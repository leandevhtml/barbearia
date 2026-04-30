import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  fidelityEnabled: boolean;
  stampsPerReward: number;
  rewardServiceName: string; // Service that can be free
  announcementEnabled: boolean;
  announcementText: string;
  announcementImage: string;
  barbershopAddress: string;
  supportPhone: string;
  weekOpenHour: string;
  weekCloseHour: string;
  saturdayOpenHour: string;
  saturdayCloseHour: string;
  saturdayClosed: boolean;
  sundayOpenHour: string;
  sundayCloseHour: string;
  sundayClosed: boolean;
  delayTolerance: number;
  cancelNoticeHours: number;
  bookingNoticeHours: number;
  specialDays: Array<{ date: string; openHour?: string; closeHour?: string; isClosed: boolean }>;
  mpAccessToken?: string;
  mpPublicKey?: string;
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
    barbershopAddress: { type: String, default: 'Rua Exemplo, 123 - Centro' },
    supportPhone: { type: String, default: '5511999999999' },
    weekOpenHour: { type: String, default: '09:00' },
    weekCloseHour: { type: String, default: '20:00' },
    saturdayOpenHour: { type: String, default: '09:00' },
    saturdayCloseHour: { type: String, default: '18:00' },
    saturdayClosed: { type: Boolean, default: false },
    sundayOpenHour: { type: String, default: '09:00' },
    sundayCloseHour: { type: String, default: '14:00' },
    sundayClosed: { type: Boolean, default: true },
    delayTolerance: { type: Number, default: 15 },
    cancelNoticeHours: { type: Number, default: 2 },
    bookingNoticeHours: { type: Number, default: 1 },
    specialDays: [
      {
        date: String,
        openHour: String,
        closeHour: String,
        isClosed: { type: Boolean, default: false }
      }
    ],
    mpAccessToken: { type: String, default: '' },
    mpPublicKey: { type: String, default: '' },
  },
  { timestamps: true }
);

delete mongoose.models.GlobalSetting;
export default mongoose.model<ISettings>('GlobalSetting', SettingsSchema);
