import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Transaction from '@/models/Transaction';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, startOfHour, addHours } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    await connectToDatabase();

    const now = new Date();
    
    let startDate = startOfDay(subDays(now, 6)); // default 7d
    const endDate = endOfDay(now);

    if (range === '1d') startDate = startOfDay(now);
    else if (range === '30d') startDate = startOfDay(subDays(now, 29));
    else if (range === '1y') startDate = startOfDay(subMonths(now, 11));

    // 1. Get all transactions in range for revenue
    const rangeTransactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // 2. Get all completed appointments in range for cuts count and service mix
    const rangeAppointments = await Appointment.find({
      status: 'completed',
      updatedAt: { $gte: startDate, $lte: endDate }
    });

    const totalRev = rangeTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalCuts = rangeAppointments.length;

    // Advanced Revenue Split based on Transactions
    const appRevenue = rangeTransactions
      .filter(t => t.paymentMethod === 'pix' && (t.description.includes('Antecipado') || t.description.includes('PIX')))
      .reduce((acc, t) => acc + t.amount, 0);
    
    const counterRevenue = totalRev - appRevenue;

    const consumptionRevenue = rangeTransactions
      .filter(t => t.type === 'product' || t.category.includes('Produtos'))
      .reduce((acc, t) => acc + t.amount, 0);

    const serviceRevenue = totalRev - consumptionRevenue;

    // Generate chart data based on range
    let chartData: any[] = [];
    
    if (range === '1d') {
      // 14 hours (08:00 to 21:00)
      const startHour = 8;
      const endHour = 21;
      const totalHours = endHour - startHour + 1;
      
      chartData = Array.from({ length: totalHours }, (_, i) => {
        const currentHour = startHour + i;
        const hourStart = addHours(startDate, currentHour);
        const hourEnd = addHours(hourStart, 1);
        const appts = rangeAppointments.filter(a => new Date(a.updatedAt) >= hourStart && new Date(a.updatedAt) < hourEnd);
        const txs = rangeTransactions.filter(t => new Date(t.createdAt) >= hourStart && new Date(t.createdAt) < hourEnd);
        return {
          day: `${currentHour}h`,
          revenue: txs.reduce((acc, t) => acc + t.amount, 0),
          cuts: appts.length
        };
      });
    } else if (range === '7d' || range === '30d') {
      // Daily
      const daysCount = range === '7d' ? 7 : 30;
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      chartData = Array.from({ length: daysCount }, (_, i) => {
        const date = subDays(now, daysCount - 1 - i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const appts = rangeAppointments.filter(a => new Date(a.updatedAt) >= dayStart && new Date(a.updatedAt) <= dayEnd);
        const txs = rangeTransactions.filter(t => new Date(t.createdAt) >= dayStart && new Date(t.createdAt) <= dayEnd);
        return {
          day: range === '7d' ? days[date.getDay()] : `${date.getDate()}/${date.getMonth() + 1}`,
          revenue: txs.reduce((acc, t) => acc + t.amount, 0),
          cuts: appts.length
        };
      });
    } else if (range === '1y') {
      // Monthly
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      chartData = Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(now, 11 - i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        const appts = rangeAppointments.filter(a => new Date(a.updatedAt) >= monthStart && new Date(a.updatedAt) <= monthEnd);
        const txs = rangeTransactions.filter(t => new Date(t.createdAt) >= monthStart && new Date(t.createdAt) <= monthEnd);
        return {
          day: months[date.getMonth()],
          revenue: txs.reduce((acc, t) => acc + t.amount, 0),
          cuts: appts.length
        };
      });
    }

    // Service Mix (Pie) in range
    const serviceMixMap: Record<string, number> = {};
    rangeAppointments.forEach(a => {
      const sName = a.serviceName || 'Outros';
      serviceMixMap[sName] = (serviceMixMap[sName] || 0) + 1;
    });

    const pieData = Object.entries(serviceMixMap).map(([name, value]) => ({
      name,
      value: Math.round((value / (totalCuts || 1)) * 100)
    }));

    return NextResponse.json({
      totalRev,
      totalCuts,
      chartData,
      pieData,
      splits: {
        appRevenue,
        counterRevenue,
        serviceRevenue,
        consumptionRevenue
      }
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
  }
}
