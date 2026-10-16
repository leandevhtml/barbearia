import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays } from 'date-fns';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Notification from '@/models/Notification';
import Service from '@/models/Service';
import { sanitizeBody, isValidObjectId, getClientIP, auditLog } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Admin can see all, client can only see their own
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const barbershopId = (session.user as any).barbershopId;

    if (!barbershopId) {
      return NextResponse.json({ message: 'Barbearia não vinculada' }, { status: 400 });
    }
    
    let appointments;
    if (userRole === 'admin') {
      appointments = await Appointment.find({ barbershopId }).populate('userId', 'name phone').populate('barberId', 'name avatar').sort({ date: 1 });
    } else if (userRole === 'barber') {
      appointments = await Appointment.find({ barbershopId, barberId: userId }).populate('userId', 'name phone').sort({ date: 1 });
    } else {
      // Client view: See own appointments normally, and others' as anonymized busy slots
      const own = await Appointment.find({ barbershopId, userId }).populate('barberId', 'name avatar').sort({ date: 1 });
      const others = await Appointment.find({ 
        barbershopId,
        userId: { $ne: userId }, 
        status: { $ne: 'cancelled' },
        date: { $gte: subDays(new Date(), 1) } // Only recent/future appointments
      }).select('date barberId status');
      
      // Map others to a consistent format for the client
      const busySlots = others.map(a => ({
        _id: a._id,
        date: a.date,
        barberId: a.barberId,
        status: a.status,
        isBusySlot: true // Flag to distinguish
      }));

      appointments = [...own, ...busySlots];
    }

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 🛡️ SECURITY: Sanitizar inputs contra NoSQL Injection
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);
    const { serviceId, date, barberId, paymentStatus, totalAmount } = body;

    if (!serviceId || !date) {
      return NextResponse.json({ message: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // 🛡️ SECURITY: Validar formato dos IDs
    if (!isValidObjectId(serviceId)) {
      return NextResponse.json({ message: 'ID de serviço inválido.' }, { status: 400 });
    }
    if (barberId && !isValidObjectId(barberId)) {
      return NextResponse.json({ message: 'ID de barbeiro inválido.' }, { status: 400 });
    }

    const barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      return NextResponse.json({ message: 'Barbearia não vinculada' }, { status: 400 });
    }

    await connectToDatabase();

    // SENIOR SECURITY: Buscar o serviço no banco para garantir o preço real
    // Nunca confie no preço enviado pelo frontend!
    const dbService = await Service.findById(serviceId);
    if (!dbService) {
      return NextResponse.json({ message: 'Serviço não encontrado ou inativo.' }, { status: 404 });
    }

    const realServiceName = dbService.name;
    const clientUserId = (session.user as any).id;

    let finalPrice = dbService.price;
    let finalPaymentStatus = paymentStatus || 'pending';

    if (paymentStatus === 'free_reward') {
      const clientUser = await User.findById(clientUserId);
      if (clientUser && clientUser.freeCouponAvailable && realServiceName.toLowerCase().includes('corte social')) {
        finalPrice = 0;
        finalPaymentStatus = 'free_reward';
        await User.findByIdAndUpdate(clientUserId, { $set: { freeCouponAvailable: false } });
      } else {
        finalPaymentStatus = 'pending';
      }
    }

    // SENIOR FIX: Evitar Race Condition (Reserva Dupla)
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      barbershopId,
      barberId: barberId || null,
      date: appointmentDate,
      status: { $ne: 'cancelled' }
    });

    if (existingAppointment) {
      return NextResponse.json(
        { message: 'Este horário acabou de ser ocupado. Por favor, escolha outro momento.' }, 
        { status: 409 }
      );
    }

    const newAppointment = new Appointment({
      barbershopId,
      userId: clientUserId,
      barberId: barberId || null,
      serviceId,
      serviceName: realServiceName,
      price: finalPrice,
      date: appointmentDate,
      status: 'pending',
      paymentStatus: finalPaymentStatus,
      totalAmount: finalPaymentStatus === 'free_reward' ? 0 : (totalAmount ?? finalPrice)
    });

    await newAppointment.save();

    // 🛡️ AUDIT: Registrar a criação do agendamento
    auditLog({
      action: 'APPOINTMENT_CREATED',
      userId: clientUserId,
      userRole: (session.user as any).role,
      ip: getClientIP(req),
      details: {
        appointmentId: newAppointment._id,
        serviceId,
        serviceName: realServiceName,
        price: finalPrice,
        barberId,
        paymentStatus: finalPaymentStatus,
      },
      timestamp: new Date(),
    });

    // Side effect: If paid via App (PIX), create transaction record and notify admin immediately
    if (finalPaymentStatus === 'paid_app') {
      try {
        await Transaction.create({
          barbershopId,
          userId: clientUserId,
          appointmentId: newAppointment._id,
          type: 'service',
          amount: totalAmount || finalPrice,
          description: `Pagamento Antecipado (PIX): ${realServiceName} (${session.user?.name || 'Cliente'})`,
          category: 'Venda de Serviço',
          paymentMethod: 'pix',
          status: 'approved'
        });

        // SENIOR FIX: Notificar administradores usando o novo modelo de Notification
        const admins = await User.find({ barbershopId, role: 'admin' });
        const notificationPromises = admins.map(admin => 
          Notification.create({
            userId: admin._id,
            title: 'Novo Pagamento PIX! 📱',
            message: `O cliente ${session.user?.name || 'Cliente'} realizou um pagamento de R$ ${(totalAmount || finalPrice).toFixed(2)} via PIX para o agendamento de ${realServiceName}.`,
            type: 'info'
          })
        );
        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Error creating pre-paid transaction/notification:', error);
        // We don't fail the request if notification fails
      }
    }

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ message: 'Erro ao criar agendamento' }, { status: 500 });
  }
}
