import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  appointmentId?: mongoose.Types.ObjectId;
  type: 'service' | 'product' | 'adjustment';
  amount: number;
  description: string;
  category: string;
  paymentMethod: 'cash' | 'card' | 'pix';
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    type: { type: String, enum: ['service', 'product', 'adjustment'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'Venda' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'pix'], default: 'pix' },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
