import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import Product from '@/models/Product';
import Transaction from '@/models/Transaction';
import Settings from '@/models/Settings';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session && (session.user as any).role;

    if (!session || (userRole !== 'admin' && userRole !== 'barber')) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { status, items, totalAmount, paymentMethod } = body;
    const { id } = await params;

    if (!id || id === 'undefined') {
      return NextResponse.json({ message: `ID inválido recebido: ${id}` }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch current appointment and settings
    const [currentAppointment, settings] = await Promise.all([
      Appointment.findById(id),
      Settings.findOne({})
    ]);

    if (!currentAppointment) {
      return NextResponse.json({ message: 'Agendamento não encontrado' }, { status: 404 });
    }

    const isFidelityOn = settings?.fidelityEnabled ?? true;
    const wasCompleted = currentAppointment.status === 'completed';
    const isCompleting = status === 'completed' && !wasCompleted;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (items) updateData.items = items;
    if (totalAmount) updateData.totalAmount = totalAmount;

    // 2. Perform the appointment update
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true }
    );

      // 3. Side effects of completion (PDV Logic)
      if (isCompleting && updatedAppointment) {
        const clientRef = updatedAppointment.userId;
        const clientObjectId = clientRef._id || clientRef; // Handle populated or unpopulated
        
        const user = await User.findById(clientObjectId);

        if (user) {
          // B. Notifications & Receipt
          const itemsDesc = items && Array.isArray(items) 
            ? items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ') 
            : '';
          
          const receiptMsg = `Serviço: ${updatedAppointment.serviceName}${itemsDesc ? ` + Itens: ${itemsDesc}` : ''}. Valor Total: R$ ${(totalAmount || updatedAppointment.price || 0).toFixed(2)}.`;

          const updateOps: any = {
            $inc: { totalCuts: 1 },
            $push: {
              notifications: {
                id: Math.random().toString(36).substring(7),
                title: 'Corte Finalizado! ✂️',
                message: receiptMsg,
                date: new Date(),
                read: false,
                type: 'receipt'
              }
            }
          };

          const setOps: any = {};
          if (updatedAppointment.price === 0) {
            setOps.freeCouponAvailable = false;
          } else if (isFidelityOn) {
            const currentStamps = typeof user.stamps === 'number' ? user.stamps : 0;
            const targetStamps = settings?.stampsPerReward || 10;
            const nextStamps = currentStamps + 1;
            
            if (nextStamps >= targetStamps) {
              setOps.stamps = 0;
              setOps.freeCouponAvailable = true;
              setOps.hasSeenFreeCutModal = false;
            } else {
              setOps.stamps = nextStamps;
            }
          }

          if (Object.keys(setOps).length > 0) {
            updateOps.$set = setOps;
          }

          await User.findByIdAndUpdate(clientObjectId, updateOps);
        }

        // C. Update Product Stock
        if (items && Array.isArray(items)) {
          for (const item of items) {
            if (item.productId) {
              await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -Math.abs(item.quantity || 1) }
              });
            }
          }
        }

        // D. Create Transaction Record
        await Transaction.create({
          appointmentId: updatedAppointment._id,
          type: 'service',
          amount: totalAmount || updatedAppointment.price,
          description: `Atendimento: ${updatedAppointment.serviceName} (${user?.name || 'Cliente'})`,
          category: 'Venda de Serviço',
          paymentMethod: paymentMethod || 'pix'
        });
      }

    return NextResponse.json(updatedAppointment);
  } catch (error: any) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ message: `Erro no servidor: ${error.message}` }, { status: 500 });
  }
}
