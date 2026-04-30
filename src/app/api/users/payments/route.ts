import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const userId = (session.user as any).id;
    
    // Fetch transactions for this user
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .populate('appointmentId', 'date');

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ message: 'Error fetching payment history' }, { status: 500 });
  }
}
