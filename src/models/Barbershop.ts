import mongoose, { Schema, Document } from 'mongoose';

export type PlanType = 'trial' | 'basic' | 'pro' | 'inactive';

export interface IBarbershop extends Document {
  name: string;
  slug: string; // URL única: ex. "gigantes-do-corte"
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  
  // Sistema de Planos
  plan: PlanType;
  trialStartedAt: Date;
  trialEndsAt: Date;
  planActivatedAt?: Date;
  planExpiresAt?: Date;
  
  // Status
  isActive: boolean;
  
  // Branding (configurado pelo admin da barbearia)
  logoUrl?: string;
  primaryColor?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const BarbershopSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true, unique: true },
    phone: { type: String },

    // Sistema de planos
    plan: {
      type: String,
      enum: ['trial', 'basic', 'pro', 'inactive'],
      default: 'trial',
    },
    trialStartedAt: { type: Date, default: Date.now },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 dias
    },
    planActivatedAt: { type: Date },
    planExpiresAt: { type: Date },

    // Status
    isActive: { type: Boolean, default: true },

    // Branding
    logoUrl: { type: String },
    primaryColor: { type: String, default: '#D4AF37' },
  },
  { timestamps: true }
);

// Índices para performance
BarbershopSchema.index({ slug: 1 });
BarbershopSchema.index({ ownerEmail: 1 });

// Virtual: verificar se o trial ainda está ativo
BarbershopSchema.virtual('isTrialActive').get(function (this: IBarbershop) {
  if (this.plan !== 'trial') return false;
  return new Date() < this.trialEndsAt;
});

// Virtual: dias restantes do trial
BarbershopSchema.virtual('trialDaysRemaining').get(function (this: IBarbershop) {
  if (this.plan !== 'trial') return 0;
  const diff = this.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

export default mongoose.models.Barbershop ||
  mongoose.model<IBarbershop>('Barbershop', BarbershopSchema);
