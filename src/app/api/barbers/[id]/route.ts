import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name, email, phone, specialty, commissionRate, avatar, available } = await req.json();

    await connectToDatabase();

    // Check if email is already in use by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json({ message: 'Este e-mail já está em uso por outro profissional' }, { status: 400 });
      }
    }

    const updatedBarber = await User.findByIdAndUpdate(
      id,
      { 
        name, 
        email, 
        phone, 
        specialty, 
        commissionRate, 
        avatar, 
        available 
      },
      { new: true }
    ).select('-password');

    if (!updatedBarber) {
      return NextResponse.json({ message: 'Barbeiro não encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedBarber);
  } catch (error) {
    console.error('Error updating barber:', error);
    return NextResponse.json({ message: 'Erro ao atualizar barbeiro' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectToDatabase();
    
    const deletedBarber = await User.findByIdAndDelete(id);

    if (!deletedBarber) {
      return NextResponse.json({ message: 'Barbeiro não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Barbeiro excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting barber:', error);
    return NextResponse.json({ message: 'Erro ao excluir barbeiro' }, { status: 500 });
  }
}
