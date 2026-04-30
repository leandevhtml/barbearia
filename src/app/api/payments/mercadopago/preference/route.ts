import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMercadoPagoClient } from '@/lib/mercadopago';
import { Preference } from 'mercadopago';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description, appointmentId } = await req.json();
    const client = await getMercadoPagoClient();
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: appointmentId || 'service',
            title: description || 'Serviço Barbearia',
            unit_price: Number(amount),
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/?payment=success`,
          failure: `${process.env.NEXTAUTH_URL}/?payment=failure`,
          pending: `${process.env.NEXTAUTH_URL}/?payment=pending`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXTAUTH_URL}/api/payments/mercadopago/webhook`,
        external_reference: appointmentId || ''
      }
    });

    // Create a pending transaction in our DB
    await connectToDatabase();
    await Transaction.create({
      userId: (session.user as any).id,
      appointmentId: appointmentId || null,
      type: 'service',
      amount: Number(amount),
      description: description || 'Pagamento App',
      paymentMethod: 'mercadopago',
      status: 'pending',
      providerId: result.id
    });

    return NextResponse.json({ id: result.id, init_point: result.init_point });
  } catch (error: any) {
    console.error('Mercado Pago Preference Error:', error);
    return NextResponse.json({ message: error.message || 'Error creating payment' }, { status: 500 });
  }
}
