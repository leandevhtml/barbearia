import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await connectToDatabase();
    const barbers = await User.find({ role: 'barber' }).select('-password');
    return NextResponse.json(barbers);
  } catch (error) {
    console.error('Error fetching barbers:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, password, specialty, commissionRate } = await req.json();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ message: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'E-mail já está em uso' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newBarber = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'barber',
      specialty,
      commissionRate: commissionRate || 50,
      avatar: name.substring(0, 2).toUpperCase(),
    });

    await newBarber.save();

    const barberObj = newBarber.toObject();
    delete barberObj.password;

    return NextResponse.json(barberObj, { status: 201 });
  } catch (error) {
    console.error('Error creating barber:', error);
    return NextResponse.json({ message: 'Erro ao criar barbeiro' }, { status: 500 });
  }
}
