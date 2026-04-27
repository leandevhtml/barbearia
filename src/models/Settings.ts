import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  fidelityEnabled: boolean;
  stampsPerReward: number;
  rewardServiceName: string; // Service that can be free
  announcementEnabled: boolean;
  announcementText: string;
  announcementImage: string;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    fidelityEnabled: { type: Boolean, default: true },
    stampsPerReward: { type: Number, default: 10 },
    rewardServiceName: { type: String, default: 'Corte Social' },
    announcementEnabled: { type: Boolean, default: false },
    announcementText: { type: String, default: '' },
    announcementImage: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
