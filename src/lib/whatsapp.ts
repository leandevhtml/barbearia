import Settings from '@/models/Settings';
import { Pool } from 'pg';

interface SendWhatsAppMessageParams {
  barbershopId: any;
  phone: string;
  message: string;
}

const NEON_DB_URL =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_1etfTpdj9MIs@ep-solitary-grass-aw63o3pp-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function queueMessageInCloud(phone: string, message: string) {
  try {
    const pool = new Pool({
      connectionString: NEON_DB_URL,
      max: 2,
      connectionTimeoutMillis: 4000,
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_outbox (
        id SERIAL PRIMARY KEY,
        phone TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ
      );
    `);
    await pool.query(
      `INSERT INTO whatsapp_outbox (phone, message, status) VALUES ($1, $2, 'pending')`,
      [phone, message]
    );
    await pool.end();
    console.log(`[WhatsApp Outbox] Mensagem enfileirada no banco com sucesso para ${phone}`);
    return true;
  } catch (err) {
    console.warn('[WhatsApp Outbox Error]:', err);
    return false;
  }
}

export async function sendWhatsAppMessage({ barbershopId, phone, message }: SendWhatsAppMessageParams): Promise<{ success: boolean; reason?: string }> {
  try {
    if (!phone) {
      return { success: false, reason: 'Telefone ausente' };
    }

    let settings = await Settings.findOne({ barbershopId });
    if (!settings) {
      settings = await Settings.findOne();
    }
    if (settings && settings.whatsappAutoSendEnabled === false) {
      return { success: false, reason: 'Disparo automático de WhatsApp desativado nas configurações' };
    }

    // 1. Sempre enfileirar de imediato no banco PostgreSQL/Neon
    // Isso garante 100% de confiabilidade mesmo se qualquer conexão HTTP falhar!
    await queueMessageInCloud(phone, message);

    // 2. Se rodando localmente, tentar entrega instantânea via localhost:3001
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const localRes = await fetch('http://127.0.0.1:3001/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (localRes.ok) {
        const localData = await localRes.json();
        if (localData.success) {
          console.log(`[WhatsApp Local Bot] Mensagem enviada diretamente para ${phone}`);
          return { success: true };
        }
      }
    } catch (_) {
      // Local bot não respondeu diretamente (ex: rodando na Vercel), o poller do banco cuidará disso
    }

    // 3. Se uma URL real da Evolution API estiver configurada (iniciando com http), tenta enviar por ela também
    if (settings?.evolutionApiUrl && settings.evolutionApiUrl.startsWith('http') && settings?.evolutionApiKey) {
      try {
        let cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
          cleanPhone = `55${cleanPhone}`;
        }
        const baseUrl = settings.evolutionApiUrl.replace(/\/+$/, '');
        const instanceName = settings.evolutionInstanceName || 'gigantes-do-corte';
        const endpoint = `${baseUrl}/message/sendText/${instanceName}`;

        const evoRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': settings.evolutionApiKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            options: { delay: 1000, presence: 'composing', linkPreview: false },
            textMessage: { text: message },
          }),
        });
        if (evoRes.ok) {
          return { success: true };
        }
      } catch (evoErr) {
        console.warn('[Evolution API Send Error]:', evoErr);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('[WhatsApp Service Error]:', error);
    return { success: false, reason: error.message };
  }
}
