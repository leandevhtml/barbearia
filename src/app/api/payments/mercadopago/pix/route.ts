import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMercadoPagoClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { amount, description, appointmentId, email } = await req.json();
    const client = await getMercadoPagoClient();
    const payment = new Payment(client);

    // Cria o pagamento PIX no Mercado Pago
    const result = await payment.create({
      body: {
        transaction_amount: Number(amount),
        description: description || 'Reserva Barbearia',
        payment_method_id: 'pix',
        payer: {
          email: email || session.user.email || 'cliente@email.com',
          first_name: session.user.name?.split(' ')[0] || 'Cliente',
          last_name: session.user.name?.split(' ').slice(1).join(' ') || 'Gigante',
        },
        notification_url: `${process.env.NEXTAUTH_URL}/api/payments/mercadopago/webhook`,
        external_reference: appointmentId || '',
      }
    });

    // Salva a transação como pendente no nosso banco
    await connectToDatabase();
    await Transaction.create({
      userId: (session.user as any).id,
      appointmentId: appointmentId || null,
      type: 'service',
      amount: Number(amount),
      description: description || 'Pagamento Antecipado (PIX)',
      category: 'Venda de Serviço',
      paymentMethod: 'mercadopago',
      status: 'pending',
      providerId: result.id?.toString()
    });

    // Retorna os dados do PIX (QR Code e Copia e Cola)
    return NextResponse.json({
      id: result.id,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
    });
  } catch (error: any) {
    console.error('Mercado Pago PIX Error:', error);
    return NextResponse.json({ message: error.message || 'Erro ao gerar PIX' }, { status: 500 });
  }
}
