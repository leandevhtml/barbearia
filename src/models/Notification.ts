import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error' | 'receipt';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ['info', 'success', 'warning', 'error', 'receipt'], default: 'info' }
  },
  { timestamps: true }
);

// Índice para busca rápida de notificações não lidas de um usuário específico
NotificationSchema.index({ userId: 1, read: 1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
