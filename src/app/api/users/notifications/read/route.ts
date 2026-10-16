import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Notification from '@/models/Notification';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await connectToDatabase();
    await Notification.updateMany(
      { userId: (session.user as any).id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ message: 'Erro no servidor' }, { status: 500 });
  }
}
