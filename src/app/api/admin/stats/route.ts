import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { startOfDay, endOfDay, subDays, startOfWeek } from 'date-fns';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const sevenDaysAgo = startOfDay(subDays(now, 6));

    // 1. Today's stats
    const todayAppointments = await Appointment.find({
      status: 'completed',
      updatedAt: { $gte: todayStart, $lte: todayEnd }
    });

    const todayRev = todayAppointments.reduce((acc, a) => acc + (a.totalAmount || a.price), 0);
    const todayCuts = todayAppointments.length;

    // 2. Weekly stats (last 7 days)
    const weeklyAppointments = await Appointment.find({
      status: 'completed',
      updatedAt: { $gte: sevenDaysAgo, $lte: todayEnd }
    });

    // Group by day
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weeklyData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      const dayName = days[date.getDay()];
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayAppts = weeklyAppointments.filter(a => 
        new Date(a.updatedAt) >= dayStart && new Date(a.updatedAt) <= dayEnd
      );
      
      return {
        day: dayName,
        revenue: dayAppts.reduce((acc, a) => acc + (a.totalAmount || a.price), 0),
        cuts: dayAppts.length
      };
    });

    // 3. Service Mix (Pie)
    const serviceMix = await Appointment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$serviceName', count: { $sum: 1 } } },
      { $project: { name: '$_id', value: '$count' } }
    ]);

    // Calculate percentages for pie
    const totalCuts = serviceMix.reduce((acc, s) => acc + s.value, 0);
    const pieData = serviceMix.map(s => ({
      name: s.name,
      value: Math.round((s.value / (totalCuts || 1)) * 100)
    }));

    return NextResponse.json({
      todayRev,
      todayCuts,
      weeklyData,
      pieData
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
  }
}
