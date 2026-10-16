import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  barbershopId: mongoose.Types.ObjectId; // tenant
  appointmentId?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  type: 'service' | 'product' | 'adjustment';
  amount: number;
  description: string;
  category: string;
  paymentMethod: 'cash' | 'card' | 'pix' | 'mercadopago';
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  providerId?: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    barbershopId: { type: Schema.Types.ObjectId, ref: 'Barbershop', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['service', 'product', 'adjustment'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'Venda' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'pix', 'mercadopago'], default: 'pix' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'refunded'], default: 'approved' },
    providerId: { type: String },
  },
  { timestamps: true }
);

// SENIOR PERFORMANCE: Índices para buscas financeiras
TransactionSchema.index({ barbershopId: 1, createdAt: -1 });
TransactionSchema.index({ barbershopId: 1, userId: 1 });
TransactionSchema.index({ barbershopId: 1, appointmentId: 1 });

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
