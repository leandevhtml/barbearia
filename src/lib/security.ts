// ═══════════════════════════════════════════════════════
// 🛡️ SECURITY UTILITIES — Proteções contra ataques
// ═══════════════════════════════════════════════════════

// ─── Rate Limiter (In-Memory) ───────────────────────
// Protege contra ataques de força bruta no login e abuso de API.
// Em produção com múltiplos servidores, substituir por Redis.

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Limpar entradas expiradas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;   // Máximo de requisições
  windowMs: number;      // Janela de tempo em ms
}

// Presets de rate limiting para diferentes contextos
export const RATE_LIMITS = {
  // Login: 30 tentativas por IP a cada 15 minutos
  LOGIN: { maxRequests: 30, windowMs: 15 * 60 * 1000 },
  // Registro: 30 contas por IP a cada hora
  REGISTER: { maxRequests: 30, windowMs: 60 * 60 * 1000 },
  // API geral: 300 requisições por minuto
  API: { maxRequests: 300, windowMs: 60 * 1000 },
  // Pagamento: 20 tentativas por minuto
  PAYMENT: { maxRequests: 20, windowMs: 60 * 1000 },
  // Webhook: 50 por minuto (Mercado Pago pode enviar várias notificações)
  WEBHOOK: { maxRequests: 50, windowMs: 60 * 1000 },
};

/**
 * Verifica se a requisição excedeu o rate limit.
 * @returns `null` se permitido, ou uma `Response` de erro 429 se bloqueado.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Response | null {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return null; // Permitido
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return new Response(
      JSON.stringify({ 
        message: 'Muitas tentativas. Tente novamente em alguns minutos.',
        retryAfter 
      }),
      { 
        status: 429, 
        headers: { 
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString()
        } 
      }
    );
  }

  entry.count++;
  return null; // Permitido
}

/**
 * Extrai o IP do cliente da requisição.
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return '127.0.0.1';
}


// ─── Input Sanitization ─────────────────────────────
// Protege contra NoSQL Injection e XSS.
// Um atacante pode enviar { "$gt": "" } no campo de email para
// bypassar a autenticação. Estas funções removem operadores MongoDB.

/**
 * Remove operadores MongoDB perigosos de um valor.
 * Converte objetos com chaves como $gt, $ne, $regex para strings seguras.
 */
export function sanitizeValue(value: any): any {
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'string') {
    // Remove tags HTML para prevenir XSS armazenado
    return value
      .replace(/[<>]/g, '') // Remove < e >
      .trim();
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  
  if (typeof value === 'object') {
    // Bloquear operadores MongoDB ($gt, $ne, $regex, etc.)
    const dangerousKeys = Object.keys(value).filter(k => k.startsWith('$'));
    if (dangerousKeys.length > 0) {
      // Converter para string para neutralizar o ataque
      return String(value);
    }
    
    const sanitized: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (!k.startsWith('$')) {
        sanitized[k] = sanitizeValue(v);
      }
    }
    return sanitized;
  }
  
  return value;
}

/**
 * Sanitiza todo o body de uma requisição.
 * Uso: const body = sanitizeBody(await req.json());
 */
export function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return {};
  return sanitizeValue(body);
}

/**
 * Valida se uma string é um MongoDB ObjectId válido.
 * Previne injection via IDs malformados.
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/**
 * Valida formato de email.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

/**
 * Valida força da senha.
 * Mínimo 6 caracteres para praticidade do cliente.
 */
export function isStrongPassword(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
  }
  return { valid: true, message: '' };
}


// ─── Audit Logger ───────────────────────────────────
// Registra ações financeiras e administrativas críticas.
// Em produção, substituir por um serviço como DataDog ou Sentry.

export interface AuditEntry {
  action: string;
  userId?: string;
  userRole?: string;
  ip: string;
  details: Record<string, any>;
  timestamp: Date;
}

/**
 * Loga uma ação de auditoria no console do servidor.
 * Ações financeiras e de segurança devem sempre ser logadas.
 */
export function auditLog(entry: AuditEntry): void {
  const log = {
    ...entry,
    timestamp: entry.timestamp.toISOString(),
    _audit: true,
  };
  
  // Em produção, enviar para um serviço de logging (DataDog, CloudWatch, etc.)
  console.log(`[AUDIT] ${entry.action}`, JSON.stringify(log));
}
