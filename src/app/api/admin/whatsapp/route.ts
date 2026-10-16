import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Settings from '@/models/Settings';

const LOCAL_BOT_URL = 'http://127.0.0.1:3001';

async function fetchFromBot(path: string, options: RequestInit = {}) {
  // 1. Tentar primeiro via localhost (quando executando no servidor local)
  try {
    const res = await fetch(`${LOCAL_BOT_URL}${path}`, {
      ...options,
      cache: 'no-store',
      headers: {
        'Bypass-Tunnel-Reminder': 'true',
        ...(options.headers || {})
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {
    // Falhou local (ex: rodando na Vercel)
  }

  // 2. Se falhou localmente, buscar a URL do túnel salva no banco de dados na nuvem
  try {
    await connectToDatabase();
    const settings = await Settings.findOne();
    if (settings && settings.whatsappTunnelUrl) {
      const tunnelUrl = settings.whatsappTunnelUrl.replace(/\/+$/, '');
      const res = await fetch(`${tunnelUrl}${path}`, {
        ...options,
        cache: 'no-store',
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
          ...(options.headers || {})
        }
      });
      if (res.ok) {
        return await res.json();
      }
    }
  } catch (tunnelErr) {
    console.warn('[WhatsApp Route] Erro ao conectar ao túnel:', tunnelErr);
  }

  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await fetchFromBot('/status');
    if (data) {
      return NextResponse.json(data);
    }

    return NextResponse.json({ status: 'offline', qr: null, phone: null });
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

    const data = await fetchFromBot('/disconnect', { method: 'POST' });
    if (data) {
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Robô inacessível' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
