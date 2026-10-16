import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sanitizeBody, isValidEmail, isStrongPassword, auditLog, getClientIP } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barbershopId = searchParams.get('barbershopId');

    // Se estiver logado, pode usar a barbearia do usuário da sessão
    let filterShopId = barbershopId;

    if (!filterShopId) {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        filterShopId = (session.user as any).barbershopId;
      }
    }

    await connectToDatabase();

    if (!filterShopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) filterShopId = defaultShop._id.toString();
    }

    const query: any = { role: 'barber', active: { $ne: false } };
    if (filterShopId) query.barbershopId = filterShopId;

    // SENIOR FIX: Filtrar apenas barbeiros ativos (Soft Delete) do respectivo tenant
    const barbers = await User.find(query).select('-password');
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

    // 🛡️ SECURITY: Sanitizar e validar inputs
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);
    const { name, email, phone, password, specialty, commissionRate, avatar } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ message: 'Nome, e-mail e telefone são obrigatórios' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'Formato de e-mail inválido.' }, { status: 400 });
    }

    // Se fornecida senha personalizada, valida força; senão gera uma senha padrão segura
    const chosenPassword = password && password.trim().length > 0 ? password.trim() : 'Barbeiro@123';
    if (password && password.trim().length > 0) {
      const passwordCheck = isStrongPassword(chosenPassword);
      if (!passwordCheck.valid) {
        return NextResponse.json({ message: passwordCheck.message }, { status: 400 });
      }
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ message: 'E-mail já está em uso' }, { status: 400 });
    }

    // 🛡️ SECURITY: bcrypt com custo 12
    const hashedPassword = await bcrypt.hash(chosenPassword, 12);

    let barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      const Barbershop = (await import('@/models/Barbershop')).default;
      const defaultShop = await Barbershop.findOne({});
      if (defaultShop) barbershopId = defaultShop._id;
    }

    const newBarber = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: 'barber',
      barbershopId,
      specialty,
      commissionRate: commissionRate !== undefined ? Number(commissionRate) : 50,
      avatar: avatar || name.substring(0, 2).toUpperCase(),
      available: true,
      active: true,
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
