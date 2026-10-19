import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Pool } from 'pg';

const LOCAL_BOT_URL = 'http://127.0.0.1:3001';
const NEON_DB_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_1etfTpdj9MIs@ep-solitary-grass-aw63o3pp-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function fetchFromLocalBot(path: string, options: RequestInit = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${LOCAL_BOT_URL}${path}`, {
      ...options,
      cache: 'no-store',
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {
    // Local bot não está respondendo diretamente nesta máquina (ex: requisição na Vercel)
  }
  return null;
}

async function getSessionFromCloud() {
  try {
    const pool = new Pool({
      connectionString: NEON_DB_URL,
      max: 2,
      connectionTimeoutMillis: 4000,
    });
    const res = await pool.query(
      `SELECT status, qr, phone, updated_at FROM whatsapp_sessions WHERE id = 'primary'`
    );
    await pool.end();

    if (res.rows.length > 0) {
      const row = res.rows[0];
      // Se a última atualização foi há menos de 2 minutos, o bot está ativo
      const updatedAt = new Date(row.updated_at).getTime();
      const now = Date.now();
      const isAlive = (now - updatedAt) < 120000;

      if (!isAlive && row.status !== 'open') {
        return { status: 'offline', qr: null, phone: null };
      }

      return {
        status: row.status,
        qr: row.status === 'connecting' ? row.qr : null,
        phone: row.phone
      };
    }
  } catch (err) {
    console.warn('[WhatsApp Route Cloud] Erro ao buscar sessão no Neon:', err);
  }
  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Tentar local
    const localData = await fetchFromLocalBot('/status');
    if (localData) {
      return NextResponse.json(localData);
    }

    // 2. Se estiver na nuvem (Vercel), ler diretamente a sessão sincronizada no banco Neon
    const cloudData = await getSessionFromCloud();
    if (cloudData) {
      return NextResponse.json(cloudData);
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

    // Tentar desconectar local
    const localData = await fetchFromLocalBot('/disconnect', { method: 'POST' });
    if (localData) {
      return NextResponse.json(localData);
    }

    // Se estiver na Vercel, marca ação de desconexão na tabela whatsapp_sessions
    try {
      const pool = new Pool({
        connectionString: NEON_DB_URL,
        max: 2,
        connectionTimeoutMillis: 4000,
      });
      await pool.query(
        `UPDATE whatsapp_sessions SET action = 'disconnect', status = 'disconnected', qr = NULL, phone = NULL, updated_at = NOW() WHERE id = 'primary'`
      );
      await pool.end();
      return NextResponse.json({ success: true });
    } catch (cloudErr: any) {
      return NextResponse.json({ error: cloudErr.message }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
