import { NextResponse } from 'next/server';
import { getMercadoPagoClient } from '@/lib/mercadopago';
import { Payment } from 'mercadopago';
import connectToDatabase from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Appointment from '@/models/Appointment';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('data.id');

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

        // If it was for an appointment, mark it as paid
        if (tx && tx.appointmentId) {
          await Appointment.findByIdAndUpdate(tx.appointmentId, {
            status: 'completed' // or a new 'paid' status if needed
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 });
  }
}
