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
    if (!settings) {
      settings = await Settings.findOne();
    }
    if (settings && settings.whatsappAutoSendEnabled === false) {
      return { success: false, reason: 'Disparo automático de WhatsApp desativado nas configurações' };
    }

    // 1. Tentar primeiro o robô embutido local na porta 3001 (100% gratuito e direto)
    try {
      const localRes = await fetch('http://127.0.0.1:3001/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
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
    if (settings.whatsappTunnelUrl) {
      try {
        const tunnelUrl = settings.whatsappTunnelUrl.replace(/\/+$/, '');
        const tunnelRes = await fetch(`${tunnelUrl}/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
          },
          body: JSON.stringify({ phone, message })
        });
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

    return { success: false, reason: 'Nenhum robô de WhatsApp ativo ou online no momento' };
  } catch (error: any) {
    console.error('[WhatsApp Service Error]:', error);
    return { success: false, reason: error.message };
  }
}
