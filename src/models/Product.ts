import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  barbershopId: Types.ObjectId; // tenant
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    barbershopId: { type: Schema.Types.ObjectId, ref: 'Barbershop', required: true, index: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    category: { type: String, default: 'Geral' },
    image: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
