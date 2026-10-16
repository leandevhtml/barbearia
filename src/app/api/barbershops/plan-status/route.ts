import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Barbershop from '@/models/Barbershop';

// GET /api/barbershops/plan-status
// Retorna o status atual do plano da barbearia logada
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const user = session.user as any;

    // Superadmin não tem barbearia
    if (user.role === 'superadmin') {
      return NextResponse.json({ plan: 'superadmin', isActive: true, isTrialActive: false });
    }

    if (!user.barbershopId) {
      return NextResponse.json({ error: 'Usuário sem barbearia vinculada' }, { status: 400 });
    }

    await connectToDatabase();

    const barbershop = await Barbershop.findById(user.barbershopId).lean();

    if (!barbershop) {
      return NextResponse.json({ error: 'Barbearia não encontrada' }, { status: 404 });
    }

    const now = new Date();
    const isTrialActive = barbershop.plan === 'trial' && now < new Date(barbershop.trialEndsAt);
    const isPaidPlanActive =
      (barbershop.plan === 'basic' || barbershop.plan === 'pro') &&
      (!barbershop.planExpiresAt || now < new Date(barbershop.planExpiresAt));

    const trialDaysRemaining = barbershop.plan === 'trial'
      ? Math.max(0, Math.ceil((new Date(barbershop.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      barbershopId: barbershop._id,
      barbershopName: barbershop.name,
      slug: barbershop.slug,
      plan: barbershop.plan,
      isActive: barbershop.isActive,
      isTrialActive,
      isPaidPlanActive,
      trialEndsAt: barbershop.trialEndsAt,
      trialDaysRemaining,
      planExpiresAt: barbershop.planExpiresAt || null,
      // Acesso permitido se trial ativo OU plano pago ativo
      hasAccess: barbershop.isActive && (isTrialActive || isPaidPlanActive),
    });
  } catch (error) {
    console.error('Erro ao verificar plano:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
