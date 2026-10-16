import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import Appointment from '@/models/Appointment';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      return NextResponse.json({ message: 'Barbearia não vinculada' }, { status: 400 });
    }

    await connectToDatabase();

    // Buscar todos os clientes da barbearia
    const clients = await User.find({
      barbershopId,
      role: 'client'
    }).select('name email phone totalCuts stamps freeCouponAvailable createdAt').lean();

    // Buscar o último agendamento concluído de cada cliente para calcular inatividade / fidelidade
    const completedAppts = await Appointment.find({
      barbershopId,
      status: 'completed'
    }).select('userId date serviceName totalAmount price').sort({ date: -1 }).lean();

    const clientHistoryMap: Record<string, { lastVisit: string; totalSpent: number; totalCompleted: number }> = {};

    completedAppts.forEach((appt: any) => {
      const uId = appt.userId?.toString();
      if (!uId) return;

      if (!clientHistoryMap[uId]) {
        clientHistoryMap[uId] = {
          lastVisit: appt.date ? new Date(appt.date).toISOString() : '',
          totalSpent: 0,
          totalCompleted: 0
        };
      }

      clientHistoryMap[uId].totalSpent += (appt.totalAmount || appt.price || 0);
      clientHistoryMap[uId].totalCompleted += 1;
    });

    const now = new Date().getTime();

    const enrichedClients = clients.map((c: any) => {
      const uId = c._id.toString();
      const history = clientHistoryMap[uId] || { lastVisit: '', totalSpent: 0, totalCompleted: 0 };
      
      let daysSinceLastVisit: number | null = null;
      if (history.lastVisit) {
        const diffMs = now - new Date(history.lastVisit).getTime();
        daysSinceLastVisit = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      }

      // Status do Cliente no CRM:
      // - 'vip': Mais de 5 cortes
      // - 'active': Visitou nos últimos 30 dias
      // - 'inactive': Não visita há mais de 35 dias (candidato a mensagem de retorno)
      // - 'new': Menos de 1 corte ou recente
      let crmStatus: 'vip' | 'active' | 'inactive' | 'new' = 'active';
      if ((c.totalCuts || history.totalCompleted) >= 5) {
        crmStatus = 'vip';
      } else if (daysSinceLastVisit !== null && daysSinceLastVisit > 35) {
        crmStatus = 'inactive';
      } else if (!history.lastVisit || (c.totalCuts || history.totalCompleted) <= 1) {
        crmStatus = 'new';
      }

      return {
        id: uId,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalCuts: c.totalCuts || history.totalCompleted,
        stamps: c.stamps || 0,
        freeCouponAvailable: !!c.freeCouponAvailable,
        totalSpent: history.totalSpent,
        lastVisit: history.lastVisit,
        daysSinceLastVisit,
        crmStatus,
        createdAt: c.createdAt
      };
    });

    return NextResponse.json(enrichedClients);
  } catch (error: any) {
    console.error('CRM clients error:', error);
    return NextResponse.json({ message: 'Erro ao carregar clientes do CRM' }, { status: 500 });
  }
}
