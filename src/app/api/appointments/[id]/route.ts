import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import Product from '@/models/Product';
import Transaction from '@/models/Transaction';
import Settings from '@/models/Settings';
import Notification from '@/models/Notification';
import { sanitizeBody, isValidObjectId, getClientIP, auditLog } from '@/lib/security';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const sessionUserId = (session.user as any).id;
    const barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      return NextResponse.json({ message: 'Barbearia não vinculada' }, { status: 400 });
    }

    // 🛡️ SECURITY: Sanitizar inputs
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);
    const { status, items, totalAmount, paymentMethod } = body;
    const { id } = await params;

    if (!id || id === 'undefined' || !isValidObjectId(id)) {
      return NextResponse.json({ message: `ID inválido recebido: ${id}` }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch current appointment and settings
    const [currentAppointment, settings] = await Promise.all([
      Appointment.findOne({ _id: id, barbershopId }),
      Settings.findOne({ barbershopId })
    ]);

    if (!currentAppointment) {
      return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
    }

    // Client role can only cancel their own pending appointment
    if (userRole !== 'admin' && userRole !== 'barber') {
      const apptUserId = (currentAppointment.userId?._id || currentAppointment.userId || '').toString();
      if (apptUserId !== String(sessionUserId) || status !== 'cancelled') {
        return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
      }
      if (currentAppointment.status !== 'pending') {
        return NextResponse.json({ message: 'Apenas agendamentos pendentes podem ser cancelados.' }, { status: 400 });
      }
      const cancelNoticeHours = settings?.cancelNoticeHours ?? 2;
      const diffHours = (new Date(currentAppointment.date).getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHours < cancelNoticeHours) {
        return NextResponse.json({
          message: `Cancelamento permitido apenas com no mínimo ${cancelNoticeHours}h de antecedência.`
        }, { status: 400 });
      }
    }

    const isFidelityOn = settings?.fidelityEnabled ?? true;
    const wasCompleted = currentAppointment.status === 'completed';
    const isCompleting = status === 'completed' && !wasCompleted;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (items) updateData.items = items;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;

    // 2. Perform the appointment update ATOMICALLY
    // SENIOR FIX: Evita que cliques duplos processem transações e selos duas vezes
    const query: any = { _id: id, barbershopId };
    if (status === 'completed') {
      query.status = { $ne: 'completed' };
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true }
    );

    if (!updatedAppointment) {
      // Se não encontrou, provavelmente já foi finalizado por outro processo/clique
      const checkCurrent = await Appointment.findById(id);
      if (checkCurrent?.status === 'completed' && status === 'completed') {
        return NextResponse.json({ message: 'Este atendimento já foi finalizado.' }, { status: 409 });
      }
      return NextResponse.json({ message: 'Agendamento não encontrado ou já atualizado.' }, { status: 404 });
    }

    // Refund free coupon if a free_reward appointment was cancelled
    if (status === 'cancelled' && currentAppointment.paymentStatus === 'free_reward') {
      const clientRef = currentAppointment.userId?._id || currentAppointment.userId;
      if (clientRef) {
        await User.findByIdAndUpdate(clientRef, { $set: { freeCouponAvailable: true } });
      }
    }

      // 3. Side effects of completion (PDV Logic)
      if (isCompleting && updatedAppointment) {
        const clientRef = updatedAppointment.userId;
        const clientObjectId = clientRef._id || clientRef; // Handle populated or unpopulated
        
        const user = await User.findById(clientObjectId);

        if (user) {
          // B. Notifications & Receipt
          const itemsDesc = items && Array.isArray(items) && items.length > 0
            ? items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ') 
            : '';
          
          const finalReceiptVal = totalAmount !== undefined ? totalAmount : (updatedAppointment.price || 0);
          const receiptMsg = `Serviço: ${updatedAppointment.serviceName}${itemsDesc ? ` + Itens: ${itemsDesc}` : ''}. Valor Total: R$ ${Number(finalReceiptVal).toFixed(2)}.`;

          // SENIOR FIX: Criar recibo usando o novo modelo de Notification
          await Notification.create({
            userId: clientObjectId,
            title: 'Corte Finalizado! ✂️',
            message: receiptMsg,
            type: 'receipt'
          });

          const updateOps: any = {
            $inc: { totalCuts: 1 }
          };

          const setOps: any = {};
          if (updatedAppointment.price === 0 || updatedAppointment.paymentStatus === 'free_reward') {
            setOps.freeCouponAvailable = false;
          } else if (isFidelityOn) {
            const currentStamps = typeof user.stamps === 'number' ? user.stamps : 0;
            const targetStamps = settings?.stampsPerReward || 10;
            const nextStamps = currentStamps + 1;
            
            if (nextStamps >= targetStamps) {
              setOps.stamps = 0;
              setOps.freeCouponAvailable = true;
              setOps.hasSeenFreeCutModal = false;

              // Notify Client and Admins about the free cut reward
              await Notification.create({
                userId: clientObjectId,
                title: 'Prêmio Desbloqueado! 🎉',
                message: `Parabéns! Você completou ${targetStamps} selos e ganhou um CORTE GRÁTIS!`,
                type: 'reward'
              });
            } else {
              setOps.stamps = nextStamps;
            }
          }

          if (Object.keys(setOps).length > 0) {
            updateOps.$set = setOps;
          }

          await User.findByIdAndUpdate(clientObjectId, updateOps);
        }

        // C. Update Product Stock (with validation)
        if (items && Array.isArray(items)) {
          for (const item of items) {
            if (item.productId) {
              const qty = Math.abs(item.quantity || 1);
              
              // SENIOR FIX: Impedir estoque negativo e garantir mesma barbearia
              const product = await Product.findOne({ _id: item.productId, barbershopId });
              if (!product || product.stock < qty) {
                return NextResponse.json({ 
                  message: `Estoque insuficiente para "${product?.name || item.name}". Disponível: ${product?.stock ?? 0}` 
                }, { status: 400 });
              }
              
              await Product.findOneAndUpdate({ _id: item.productId, barbershopId }, {
                $inc: { stock: -qty }
              });
            }
          }
        }

        // D. Create Transaction Record
        const existingTx = await Transaction.findOne({ appointmentId: updatedAppointment._id, barbershopId });
        const txAmount = totalAmount !== undefined ? Number(totalAmount) : Number(updatedAppointment.price || 0);
        
        if (!existingTx && txAmount > 0) {
          // No pre-payment: Record the full amount (Service + Items)
          await Transaction.create({
            barbershopId,
            userId: clientObjectId,
            appointmentId: updatedAppointment._id,
            type: 'service',
            amount: txAmount,
            description: `Atendimento: ${updatedAppointment.serviceName} (${user?.name || 'Cliente'})`,
            category: 'Venda de Serviço',
            paymentMethod: paymentMethod || 'pix',
            status: 'approved'
          });
        } else if (existingTx && txAmount > 0) {
          // Pre-paid service exists: Record only the additional items/consumption
          await Transaction.create({
            barbershopId,
            userId: clientObjectId,
            appointmentId: updatedAppointment._id,
            type: 'product',
            amount: txAmount,
            description: `Consumo Extra: ${updatedAppointment.serviceName} (${user?.name || 'Cliente'})`,
            category: 'Venda de Produtos',
            paymentMethod: paymentMethod || 'pix',
            status: 'approved'
          });
        }
      }

    // 🛡️ AUDIT: Registrar toda mudança de status
    auditLog({
      action: status === 'completed' ? 'CHECKOUT_COMPLETED' : `STATUS_CHANGED_TO_${status?.toUpperCase()}`,
      userId: (session.user as any).id,
      userRole: (session.user as any).role,
      ip: getClientIP(req),
      details: {
        appointmentId: id,
        newStatus: status,
        totalAmount: totalAmount || updatedAppointment.price,
        paymentMethod: paymentMethod || 'N/A',
        itemsCount: items?.length || 0,
      },
      timestamp: new Date(),
    });

    return NextResponse.json(updatedAppointment);
  } catch (error: any) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ message: `Erro no servidor: ${error.message}` }, { status: 500 });
  }
}
