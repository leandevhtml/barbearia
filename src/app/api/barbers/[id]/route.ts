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
    const body = await req.json();
    const { name, email, phone, specialty, commissionRate, avatar, available, password } = body;

    await connectToDatabase();
    const mongoose = (await import('mongoose')).default;
    const isValidId = mongoose.Types.ObjectId.isValid(id);
    const filterId = isValidId ? new mongoose.Types.ObjectId(id) : id;

    // Check if email is already in use by another user
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: filterId } });
      if (existingUser) {
        return NextResponse.json({ message: 'Este e-mail já está em uso por outro profissional' }, { status: 400 });
      }
    }

    const updateFields: any = {};
    if (name) updateFields.name = name.trim();
    if (email) updateFields.email = email.toLowerCase().trim();
    if (phone) updateFields.phone = phone.trim();
    if (specialty !== undefined) updateFields.specialty = specialty;
    if (commissionRate !== undefined) updateFields.commissionRate = Number(commissionRate);
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (available !== undefined) updateFields.available = Boolean(available);

    if (password && typeof password === 'string' && password.trim().length > 0) {
      const bcrypt = (await import('bcryptjs')).default;
      updateFields.password = await bcrypt.hash(password.trim(), 12);
    }

    let barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) barbershopId = defaultShop._id;
    }

    let updatedBarber = null;
    if (barbershopId) {
      const bId = mongoose.Types.ObjectId.isValid(barbershopId) ? new mongoose.Types.ObjectId(barbershopId) : barbershopId;
      updatedBarber = await User.findOneAndUpdate(
        { _id: filterId, barbershopId: bId },
        { $set: updateFields },
        { new: true }
      ).select('-password');
    }

    // Fallback por _id direto
    if (!updatedBarber) {
      updatedBarber = await User.findByIdAndUpdate(
        filterId,
        { $set: updateFields },
        { new: true }
      ).select('-password');
    }

    if (!updatedBarber) {
      return NextResponse.json({ message: 'Barbeiro não encontrado' }, { status: 404 });
    }

    return NextResponse.json(updatedBarber);
  } catch (error: any) {
    console.error('Error updating barber:', error);
    return NextResponse.json({ message: error?.message || 'Erro ao atualizar barbeiro' }, { status: 500 });
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
    
    // SENIOR FIX: Soft Delete
    // Em vez de apagar, marcamos como inativo para não quebrar o histórico de agendamentos
    const deletedBarber = await User.findOneAndUpdate(
      { _id: id, barbershopId: (session.user as any).barbershopId }, 
      { active: false, available: false }
    );

    if (!deletedBarber) {
      return NextResponse.json({ message: 'Barbeiro não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Barbeiro desativado com sucesso' });
  } catch (error) {
    console.error('Error deleting barber:', error);
    return NextResponse.json({ message: 'Erro ao excluir barbeiro' }, { status: 500 });
  }
}
