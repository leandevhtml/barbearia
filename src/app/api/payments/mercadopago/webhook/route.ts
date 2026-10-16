import { NextResponse } from 'next/server';
import { getMercadoPagoClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Appointment from '@/models/Appointment';
import { auditLog, getClientIP } from '@/lib/security';
import crypto from 'crypto';

// 🛡️ SECURITY: Validar assinatura do Mercado Pago
// Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
function verifyWebhookSignature(req: Request, body: string): boolean {
  const xSignature = req.headers.get('x-signature');
  const xRequestId = req.headers.get('x-request-id');
  
  if (!xSignature || !xRequestId) return false;
  
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Se não tem secret configurado, aceitar (modo desenvolvimento)
    console.warn('[SECURITY] MP_WEBHOOK_SECRET não configurado. Webhook não validado.');
    return true;
  }

  try {
    // Extrair ts e hash do header x-signature
    const parts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.trim().split('=');
      if (key && value) parts[key] = value;
    });

    const ts = parts['ts'];
    const hash = parts['v1'];
    if (!ts || !hash) return false;

    // Extrair data.id da URL
    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') || '';

    // Reconstruir a string de validação
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    const expectedHash = crypto
      .createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch (error) {
    console.error('[SECURITY] Webhook signature verification failed:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('data.id');

    // 🛡️ SECURITY: Validar assinatura
    const bodyText = await req.text();
    const isValid = verifyWebhookSignature(req, bodyText);
    
    if (!isValid) {
      auditLog({
        action: 'WEBHOOK_SIGNATURE_INVALID',
        ip: getClientIP(req),
        details: { type, id },
        timestamp: new Date(),
      });
      return NextResponse.json({ message: 'Assinatura inválida' }, { status: 403 });
    }

    if (type === 'payment' && id) {
      const client = await getMercadoPagoClient();
      const payment = new Payment(client);
      const paymentData = await payment.get({ id });

      if (paymentData.status === 'approved') {
        await connectToDatabase();
        
        // Update transaction
        const tx = await Transaction.findOneAndUpdate(
          { providerId: paymentData.preference_id },
          { status: 'approved' },
          { new: true }
        );

        // If it was for an appointment, mark it as paid, but keep status as pending
        if (tx && tx.appointmentId) {
          await Appointment.findByIdAndUpdate(tx.appointmentId, {
            paymentStatus: 'paid_app'
          });
        }

        // 🛡️ AUDIT: Registrar pagamento aprovado
        auditLog({
          action: 'PAYMENT_APPROVED_VIA_WEBHOOK',
          ip: getClientIP(req),
          details: {
            paymentId: id,
            preferenceId: paymentData.preference_id,
            amount: paymentData.transaction_amount,
            transactionId: tx?._id,
            appointmentId: tx?.appointmentId,
          },
          timestamp: new Date(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
