import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone: string;
  role: 'client' | 'admin' | 'barber';
  stamps: number;
  totalCuts: number;
  freeCouponAvailable: boolean;
  hasSeenFreeCutModal: boolean;
  
  // Barber specific fields
  specialty?: string;
  commissionRate?: number;
  avatar?: string;
  available?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for OAuth
    phone: { type: String, required: true },
    role: { type: String, enum: ['client', 'admin', 'barber'], default: 'client' },
    stamps: { type: Number, default: 0 },
    totalCuts: { type: Number, default: 0 },
    freeCouponAvailable: { type: Boolean, default: false },
    hasSeenFreeCutModal: { type: Boolean, default: false },
    
    // Barber specific fields
    specialty: { type: String },
    commissionRate: { type: Number, default: 50 },
    avatar: { type: String },
    available: { type: Boolean, default: true },
    notifications: [{
      id: { type: String },
      title: { type: String },
      message: { type: String },
      date: { type: Date, default: Date.now },
      read: { type: Boolean, default: false },
      type: { type: String, default: 'info' }
    }]
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
