import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const BOT_URL = 'http://127.0.0.1:3001';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${BOT_URL}/status`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ status: 'disconnected', qr: null, phone: null });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ status: 'offline', qr: null, phone: null, message: err.message });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${BOT_URL}/disconnect`, { method: 'POST' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
