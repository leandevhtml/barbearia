import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import User from '@/models/User';

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
      appointments = await Appointment.find({ userId }).populate('barberId', 'name avatar').sort({ date: 1 });
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

    const { serviceId, serviceName, price, date, barberId } = await req.json();

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
      status: 'pending'
    });

    await newAppointment.save();

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ message: 'Erro ao criar agendamento' }, { status: 500 });
  }
}
