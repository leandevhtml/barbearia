import Settings from '@/models/Settings';

interface SendWhatsAppMessageParams {
  barbershopId: any;
  phone: string;
  message: string;
}

export async function sendWhatsAppMessage({ barbershopId, phone, message }: SendWhatsAppMessageParams): Promise<{ success: boolean; reason?: string }> {
  try {
    if (!phone) {
      return { success: false, reason: 'Telefone ausente' };
    }

    let settings = await Settings.findOne({ barbershopId });
    if (!settings || !settings.whatsappTunnelUrl) {
      settings = await Settings.findOne({ whatsappTunnelUrl: { $exists: true, $ne: '' } }) || await Settings.findOne();
    }
    if (settings && settings.whatsappAutoSendEnabled === false) {
      return { success: false, reason: 'Disparo automático de WhatsApp desativado nas configurações' };
    }

    // 1. Tentar primeiro o robô embutido local na porta 3001 (100% gratuito e direto)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
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
          console.log(`[WhatsApp Local Bot] Mensagem enviada com sucesso para ${phone}`);
          return { success: true };
        }
      }
    } catch (localErr) {
      // Se o bot local não responder diretamente (ex: rodando na Vercel), continua
    }

    // 2. Tentar via Túnel Seguro do Robô (para quando o cliente agenda pelo site na Vercel)
    if (settings?.whatsappTunnelUrl) {
      try {
        const tunnelUrl = settings.whatsappTunnelUrl.replace(/\/+$/, '');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const tunnelRes = await fetch(`${tunnelUrl}/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
          },
          body: JSON.stringify({ phone, message }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (tunnelRes.ok) {
          const tunnelData = await tunnelRes.json();
          if (tunnelData.success) {
            console.log(`[WhatsApp Tunnel Bot] Mensagem enviada via túnel para ${phone}`);
            return { success: true };
          }
        }
      } catch (tunnelErr) {
        console.warn('[WhatsApp Tunnel Bot] Erro ao enviar via túnel:', tunnelErr);
      }
    }

    // 3. Fallback: Evolution API se configurada
    const { evolutionApiUrl, evolutionApiKey, evolutionInstanceName } = settings;
    if (evolutionApiUrl && evolutionApiKey && evolutionInstanceName) {
      // Limpar telefone deixando apenas dígitos e prefixo internacional
      let cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone.startsWith('55') && cleanPhone.length >= 10) {
        cleanPhone = `55${cleanPhone}`;
      }

      const baseUrl = evolutionApiUrl.replace(/\/+$/, '');
      const endpoint = `${baseUrl}/message/sendText/${evolutionInstanceName}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: cleanPhone,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: false,
          },
          textMessage: {
            text: message,
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[Evolution API Error]:', errorText);
        return { success: false, reason: errorText };
      }

      return { success: true };
    }

    // 3. Fallback: Gravar na fila autônoma do banco (Neon)
    // Desta forma, mesmo se a requisição HTTP direta falhar ou sofrer timeout,
    // o robô em background pega a mensagem da fila e envia em poucos segundos!
    try {
      const { Pool } = await import('pg');
      const NEON_DB_URL =
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        'postgresql://neondb_owner:npg_1etfTpdj9MIs@ep-solitary-grass-aw63o3pp-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require';
      
      const pool = new Pool({ connectionString: NEON_DB_URL, max: 2, connectionTimeoutMillis: 4000 });
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
      return { success: true };
    } catch (queueErr) {
      console.warn('[WhatsApp Outbox] Falha ao enfileirar mensagem:', queueErr);
    }

    return { success: false, reason: 'Nenhum robô de WhatsApp ativo ou online no momento' };
  } catch (error: any) {
    console.error('[WhatsApp Service Error]:', error);
    return { success: false, reason: error.message };
  }
}
