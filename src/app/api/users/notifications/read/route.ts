import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    await connectToDatabase();
    await User.updateOne(
      { email: session.user?.email },
      { $set: { "notifications.$[].read": true } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: 'Erro no servidor' }, { status: 500 });
  }
}
