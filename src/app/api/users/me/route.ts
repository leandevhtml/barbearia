import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: session.user.email }).select('-password');
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching user' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone } = body;

    await connectToDatabase();

    const updateFields: any = {};
    if (name && typeof name === 'string') updateFields.name = name.trim();
    if (phone && typeof phone === 'string') {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length >= 8) updateFields.phone = cleanPhone;
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateFields },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ message: 'Error updating profile' }, { status: 500 });
  }
}

