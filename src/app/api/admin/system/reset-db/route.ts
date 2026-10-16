import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const barbershopId = (session.user as any).barbershopId;
    if (!barbershopId) {
      return NextResponse.json({ message: 'Missing barbershopId' }, { status: 400 });
    }

    await connectToDatabase();

    // Delete all appointments for this barbershop
    const appointmentsRes = await Appointment.deleteMany({ barbershopId });

    // Delete all transactions for this barbershop
    const transactionsRes = await Transaction.deleteMany({ barbershopId });

    // Delete non-admin users for this barbershop
    const usersRes = await User.deleteMany({ barbershopId, role: { $ne: 'admin' } });

    return NextResponse.json({
      message: 'Database reset successful',
      details: {
        appointments: appointmentsRes.deletedCount,
        transactions: transactionsRes.deletedCount,
        users: usersRes.deletedCount,
        settings: 'preserved',
      }
    });
  } catch (error: any) {
    console.error('Reset DB error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
