import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Barbershop from '@/models/Barbershop';
import User from '@/models/User';
import Settings from '@/models/Settings';
import bcrypt from 'bcryptjs';

// POST /api/barbershops/register
// Registrar uma nova barbearia (cria barbearia + admin + settings padrão)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barbershopName, slug, ownerName, ownerEmail, ownerPassword, phone } = body;

    if (!barbershopName || !slug || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome da barbearia, slug, nome do dono, email e senha' },
        { status: 400 }
      );
    }

    // Validar slug (apenas letras, números e hífens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' },
        { status: 400 }
      );
    }

    const reservedSlugs = ['admin', 'api', 'superadmin', 'plan-expired', 'login', 'register', 'dashboard', 'barber', 'client'];
    if (reservedSlugs.includes(slug.toLowerCase())) {
      return NextResponse.json(
        { error: 'Este slug é reservado e não pode ser utilizado.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verificar se slug já existe
    const existingSlug = await Barbershop.findOne({ slug });
    if (existingSlug) {
      return NextResponse.json(
        { error: 'Este slug já está em uso. Escolha outro.' },
        { status: 409 }
      );
    }

    // Verificar se email já existe
    const existingEmail = await User.findOne({ email: ownerEmail });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado.' },
        { status: 409 }
      );
    }

    // Criar a barbearia (trial de 7 dias automático)
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    const barbershop = await Barbershop.create({
      name: barbershopName,
      slug,
      ownerName,
      ownerEmail,
      phone,
      plan: 'trial',
      trialStartedAt,
      trialEndsAt,
      isActive: true,
    });

    // Criar o usuário admin da barbearia
    const hashedPassword = await bcrypt.hash(ownerPassword, 12);
    const adminUser = await User.create({
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      phone: phone || '00000000000',
      role: 'admin',
      barbershopId: barbershop._id,
      active: true,
    });

    // Criar settings padrão para a barbearia
    await Settings.create({
      barbershopId: barbershop._id,
    });

    return NextResponse.json(
      {
        message: 'Barbearia cadastrada com sucesso! Você tem 7 dias de trial gratuito.',
        barbershop: {
          id: barbershop._id,
          name: barbershop.name,
          slug: barbershop.slug,
          plan: barbershop.plan,
          trialEndsAt: barbershop.trialEndsAt,
        },
        admin: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro ao registrar barbearia:', error);
    return NextResponse.json(
      { error: 'Erro interno ao cadastrar barbearia.' },
      { status: 500 }
    );
  }
}

// GET /api/barbershops/register?slug=xxx — verificar disponibilidade de slug
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug é obrigatório' }, { status: 400 });
  }

  await connectToDatabase();
  const existing = await Barbershop.findOne({ slug });

  return NextResponse.json({ available: !existing });
}
