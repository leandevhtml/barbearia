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

    const settings = await Settings.findOne({ barbershopId });
    if (!settings || !settings.whatsappAutoSendEnabled) {
      return { success: false, reason: 'Disparo automático de WhatsApp desativado nas configurações' };
    }

    const { evolutionApiUrl, evolutionApiKey, evolutionInstanceName } = settings;
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
      return { success: false, reason: 'Configurações da Evolution API incompletas' };
    }

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

    if (res.ok) {
      console.log(`[WhatsApp Evolution] Mensagem enviada com sucesso para ${cleanPhone}`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.error(`[WhatsApp Evolution] Erro ao enviar mensagem (${res.status}):`, errText);
      return { success: false, reason: `Status ${res.status}: ${errText}` };
    }
  } catch (error: any) {
    console.error('[WhatsApp Evolution] Falha na requisição:', error);
    return { success: false, reason: error.message };
  }
}
