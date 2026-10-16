import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Barbershop from '@/models/Barbershop';
import User from '@/models/User';
import Settings from '@/models/Settings';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'owner_pending') {
      return NextResponse.json({ error: 'Não autorizado. Apenas contas pendentes podem configurar uma barbearia.' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { barbershopName, slug } = body;

    if (!barbershopName || !slug) {
      return NextResponse.json({ error: 'Preencha o nome da barbearia e a URL (slug).' }, { status: 400 });
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' }, { status: 400 });
    }

    const reservedSlugs = ['admin', 'api', 'superadmin', 'plan-expired', 'login', 'register', 'dashboard', 'barber', 'client', 'setup'];
    if (reservedSlugs.includes(slug.toLowerCase())) {
      return NextResponse.json({ error: 'Este slug é reservado e não pode ser utilizado.' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify if slug already exists
    const existingSlug = await Barbershop.findOne({ slug });
    if (existingSlug) {
      return NextResponse.json({ error: 'Este link (slug) já está em uso por outra barbearia.' }, { status: 409 });
    }

    const owner = await User.findById(userId);
    if (!owner) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Criar a Barbearia (trial de 7 dias automático)
    const trialStartedAt = new Date();
    const trialEndsAt = new Date(trialStartedAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    const barbershop = await Barbershop.create({
      name: barbershopName,
      slug,
      ownerName: owner.name,
      ownerEmail: owner.email,
      phone: owner.phone,
      plan: 'trial',
      trialStartedAt,
      trialEndsAt,
      isActive: true,
    });

    // Atualiza o usuário para o cargo final e associa à barbearia
    owner.role = 'admin';
    owner.barbershopId = barbershop._id;
    await owner.save();

    // Cria as configurações padrão da barbearia
    await Settings.create({
      barbershopId: barbershop._id,
    });

    return NextResponse.json({ message: 'Barbearia configurada com sucesso!', slug: barbershop.slug }, { status: 201 });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Erro interno ao configurar barbearia.' }, { status: 500 });
  }
}
