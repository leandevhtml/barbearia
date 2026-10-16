import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  barbershopId: mongoose.Types.ObjectId; // tenant isolamento
  userId: mongoose.Types.ObjectId;
  barberId?: mongoose.Types.ObjectId;
  serviceId: string;
  serviceName: string;
  price: number;
  date: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid_app' | 'free_reward';
  items: Array<{ productId?: mongoose.Types.ObjectId | string; name: string; price: number; quantity: number }>;
  clientNotes?: string;
  barberNotes?: string;
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    barbershopId: { type: Schema.Types.ObjectId, ref: 'Barbershop', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    barberId: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid_app', 'free_reward'], default: 'pending' },
    clientNotes: { type: String, default: '' },
    barberNotes: { type: String, default: '' },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 }
      }
    ],
    totalAmount: { type: Number }
  },
  { timestamps: true }
);

// SENIOR PERFORMANCE: Índices para buscas rápidas
AppointmentSchema.index({ barbershopId: 1, date: -1 });
AppointmentSchema.index({ barbershopId: 1, barberId: 1, date: 1 });
AppointmentSchema.index({ barbershopId: 1, userId: 1, date: -1 });
AppointmentSchema.index({ barbershopId: 1, status: 1 });

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
