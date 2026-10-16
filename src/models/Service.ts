import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IService extends Document {
  barbershopId: Types.ObjectId; // tenant
  name: string;
  price: number;
  duration: number;
  icon: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema = new Schema(
  {
    barbershopId: { type: Schema.Types.ObjectId, ref: 'Barbershop', required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // in minutes
    icon: { type: String, default: '✂️' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
