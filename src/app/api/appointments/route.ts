import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { subDays } from 'date-fns';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

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
    
    let appointments;
    if (userRole === 'admin') {
      appointments = await Appointment.find().populate('userId', 'name phone').populate('barberId', 'name avatar').sort({ date: 1 });
    } else if (userRole === 'barber') {
      appointments = await Appointment.find({ barberId: userId }).populate('userId', 'name phone').sort({ date: 1 });
    } else {
      // Client view: See own appointments normally, and others' as anonymized busy slots
      const own = await Appointment.find({ userId }).populate('barberId', 'name avatar').sort({ date: 1 });
      const others = await Appointment.find({ 
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

    const { serviceId, serviceName, price, date, barberId, paymentStatus, totalAmount } = await req.json();

    if (!serviceId || !serviceName || !price || !date) {
      return NextResponse.json({ message: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    await connectToDatabase();

    const newAppointment = new Appointment({
      userId: (session.user as any).id,
      barberId: barberId || null,
      serviceId,
      serviceName,
      price,
      date: new Date(date),
      status: 'pending',
      paymentStatus: paymentStatus || 'pending',
      totalAmount: totalAmount || price
    });

    await newAppointment.save();

    // Side effect: If paid via App (PIX), create transaction record and notify admin immediately
    if (paymentStatus === 'paid_app') {
      try {
        await Transaction.create({
          appointmentId: newAppointment._id,
          type: 'service',
          amount: totalAmount || price,
          description: `Pagamento Antecipado (PIX): ${serviceName} (${session.user?.name || 'Cliente'})`,
          category: 'Venda de Serviço',
          paymentMethod: 'pix'
        });

        // Notify all admins about the new pre-paid booking
        await User.updateMany(
          { role: 'admin' },
          {
            $push: {
              notifications: {
                id: Math.random().toString(36).substring(7),
                title: 'Novo Pagamento PIX! 📱',
                message: `O cliente ${session.user?.name || 'Cliente'} realizou um pagamento de R$ ${(totalAmount || price).toFixed(2)} via PIX para o agendamento de ${serviceName}.`,
                date: new Date(),
                read: false,
                type: 'info'
              }
            }
          }
        );
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
