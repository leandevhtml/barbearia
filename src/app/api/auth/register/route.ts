import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase, { syncStateToCloud } from '@/lib/mongodb';
import User from '@/models/User';
import Barbershop from '@/models/Barbershop';
import { sanitizeBody, isValidEmail, isStrongPassword, checkRateLimit, RATE_LIMITS, getClientIP, auditLog } from '@/lib/security';

export async function POST(req: Request) {
  try {
    // 🛡️ SECURITY: Rate limiting contra criação massiva de contas
    const ip = getClientIP(req);
    const rateLimited = checkRateLimit(`register:${ip}`, RATE_LIMITS.REGISTER);
    if (rateLimited) return rateLimited;

    // 🛡️ SECURITY: Sanitizar inputs
    const rawBody = await req.json();
    const body = sanitizeBody(rawBody);
    const { name, email, phone, password } = body;
    const slug = (body.slug || 'gigantes-do-corte').toLowerCase().trim();

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    // 🛡️ SECURITY: Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'Formato de e-mail inválido.' }, { status: 400 });
    }

    // 🛡️ SECURITY: Validar tamanho dos campos (anti-DoS via payload gigante)
    if (name.length > 100 || email.length > 254 || phone.length > 20) {
      return NextResponse.json({ message: 'Dados excedem o tamanho permitido.' }, { status: 400 });
    }

    // 🛡️ SECURITY: Política de senha forte
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ message: passwordCheck.message }, { status: 400 });
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return NextResponse.json({ message: 'E-mail já está em uso.' }, { status: 400 });
    }

    let barbershop = await Barbershop.findOne({ slug });
    if (!barbershop) {
      barbershop = await Barbershop.findOne({});
    }
    if (!barbershop) {
      barbershop = await Barbershop.create({
        name: 'Gigantes do Corte',
        slug,
        ownerName: 'Administrador',
        ownerEmail: 'admin@gigantes.com',
        phone: '11999999999',
        plan: 'pro',
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
        logoUrl: '/logo.png',
      });
    }

    // 🛡️ SECURITY: bcrypt com custo 10 (rápido e seguro)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name.substring(0, 100),
      email: normalizedEmail,
      phone: phone.substring(0, 20),
      password: hashedPassword,
      role: 'client',
      barbershopId: barbershop._id,
      active: true,
    });

    await newUser.save();
    await syncStateToCloud();

    // 🛡️ AUDIT: Registrar criação de conta
    auditLog({
      action: 'USER_REGISTERED',
      userId: newUser._id.toString(),
      ip,
      details: { email: newUser.email, name: newUser.name },
      timestamp: new Date(),
    });

    return NextResponse.json({ message: 'Conta criada com sucesso!' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Ocorreu um erro ao criar a conta.' }, { status: 500 });
  }
}
