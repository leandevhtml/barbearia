import { NextResponse } from 'next/server';
import connectToDatabase, { syncStateToCloud } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerName, ownerEmail, ownerPassword, phone } = body;

    if (!ownerName || !ownerEmail || !ownerPassword || !phone) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = ownerEmail.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json({ error: 'Este e-mail já está em uso.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    
    // Criamos o usuário inicial sem barbershopId.
    // O role 'owner_pending' indica que ele ainda precisa configurar a barbearia.
    await User.create({
      name: ownerName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      role: 'owner_pending', 
      active: true,
    });

    await syncStateToCloud();

    return NextResponse.json({ message: 'Conta criada com sucesso!' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erro interno ao criar conta' }, { status: 500 });
  }
}
