import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ═══════════════════════════════════════════════════════
// 🛡️ MIDDLEWARE DE SEGURANÇA — Primeira barreira de defesa
// ═══════════════════════════════════════════════════════

// Rate Limiter simplificado para Edge Runtime (middleware roda no edge)
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function edgeRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return false; // não bloqueado
  }
  
  if (entry.count >= limit) return true; // bloqueado
  entry.count++;
  return false;
}

// Limpar entradas velhas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.reset) rateLimitMap.delete(key);
  }
}, 60 * 1000);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || '127.0.0.1';
  
  // ─── Rate Limiting para Login ──────────────────────
  if (pathname.startsWith('/api/auth/callback/credentials')) {
    const blocked = edgeRateLimit(`login:${ip}`, 30, 15 * 60 * 1000);
    if (blocked) {
      return NextResponse.json(
        { message: 'Muitas tentativas de login. Aguarde 15 minutos.' },
        { status: 429 }
      );
    }
  }

  // ─── Rate Limiting para APIs de Pagamento ───────────
  if (pathname.startsWith('/api/payments') && !pathname.includes('webhook')) {
    const blocked = edgeRateLimit(`payment:${ip}`, 20, 60 * 1000);
    if (blocked) {
      return NextResponse.json(
        { message: 'Muitas requisições de pagamento. Aguarde.' },
        { status: 429 }
      );
    }
  }

  // ─── Rate Limiting Geral para APIs ──────────────────
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const blocked = edgeRateLimit(`api:${ip}`, 300, 60 * 1000);
    if (blocked) {
      return NextResponse.json(
        { message: 'Limite de requisições excedido.' },
        { status: 429 }
      );
    }
  }

  // Permitir GET em /api/admin/settings para sincronização pública de horários/avisos
  if (pathname === '/api/admin/settings' && req.method === 'GET') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  }

  // ─── Proteção de Rotas e Verificação de Plano ────────────────────────
  // Impedir que usuários não autenticados acessem APIs ou páginas restritas
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin') || pathname.startsWith('/barber')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ message: 'Acesso negado.' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Apenas superadmin ignora regras de plano da barbearia
    if (token.role !== 'superadmin') {
      if (pathname.startsWith('/api/admin') || pathname.startsWith('/admin')) {
        if (token.role !== 'admin') {
          if (pathname.startsWith('/api/')) {
            return NextResponse.json({ message: 'Acesso negado.' }, { status: 403 });
          }
          return NextResponse.redirect(new URL('/', req.url));
        }
      }

      // Verificação do plano (Tenant Isolation)
      if (token.barbershopIsActive === false) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ message: 'Barbearia desativada.' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/plan-expired?reason=inactive', req.url));
      }

      const now = new Date().getTime();
      let hasAccess = true;

      if (token.barbershopPlan === 'inactive') {
        hasAccess = false;
      } else if (token.barbershopPlan === 'trial' && token.barbershopTrialEndsAt) {
        const trialEnds = new Date(token.barbershopTrialEndsAt as string).getTime();
        if (now > trialEnds) hasAccess = false;
      } else if ((token.barbershopPlan === 'basic' || token.barbershopPlan === 'pro') && token.barbershopPlanExpiresAt) {
        const planEnds = new Date(token.barbershopPlanExpiresAt as string).getTime();
        if (now > planEnds) hasAccess = false;
      }

      if (!hasAccess) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ message: 'Plano expirado.' }, { status: 403 });
        }
        // Redirecionar para a tela de plano expirado para comprar
        return NextResponse.redirect(new URL('/plan-expired', req.url));
      }
    }
  }

  // ─── Security Headers extras no response ────────────
  const response = NextResponse.next();
  
  // Impedir que o navegador faça cache de dados sensíveis
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
  }

  return response;
}

// Configurar quais rotas o middleware protege
export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
    '/barber/:path*'
  ],
};
