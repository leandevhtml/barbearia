import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointment extends Document {
  userId: mongoose.Types.ObjectId;
  barberId?: mongoose.Types.ObjectId;
  serviceId: string; // Will link to a service model later or just be string for now
  serviceName: string;
  price: number;
  date: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  paymentStatus?: 'pending' | 'paid_app' | 'free_reward';
  items: Array<{ productId?: mongoose.Types.ObjectId | string; name: string; price: number; quantity: number }>;
  totalAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    barberId: { type: Schema.Types.ObjectId, ref: 'User' },
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid_app', 'free_reward'], default: 'pending' },
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

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);
