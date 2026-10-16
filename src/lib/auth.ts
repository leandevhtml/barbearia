import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from './mongodb';
import User from '@/models/User';
import Barbershop from '@/models/Barbershop';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        await connectToDatabase();

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.password) {
          throw new Error('Usuário não encontrado');
        }

        // SENIOR FIX: Impedir login de usuários desativados (soft delete)
        if (user.active === false) {
          throw new Error('Esta conta foi desativada. Entre em contato com a barbearia.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Senha incorreta');
        }

        // Buscar dados da barbearia (se não for superadmin)
        let barbershopData: { id: string; plan: string; trialEndsAt: Date | null; planExpiresAt: Date | null; isActive: boolean } | null = null;
        if (!user.barbershopId && user.role !== 'superadmin' && user.role !== 'owner_pending') {
          const defaultShop = await Barbershop.findOne({});
          if (defaultShop) {
            user.barbershopId = defaultShop._id;
            await user.save();
          }
        }

        if (user.barbershopId) {
          const shop = await Barbershop.findById(user.barbershopId).lean();
          if (shop) {
            barbershopData = {
              id: shop._id.toString(),
              plan: shop.plan,
              trialEndsAt: shop.trialEndsAt || null,
              planExpiresAt: shop.planExpiresAt || null,
              isActive: shop.isActive,
            };
          }
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          barbershopId: user.barbershopId?.toString() || null,
          barbershopPlan: barbershopData?.plan || 'pro',
          barbershopTrialEndsAt: barbershopData?.trialEndsAt?.toISOString() || null,
          barbershopPlanExpiresAt: barbershopData?.planExpiresAt?.toISOString() || null,
          barbershopIsActive: barbershopData?.isActive ?? true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.barbershopId = (user as any).barbershopId || null;
        token.barbershopPlan = (user as any).barbershopPlan || 'pro';
        token.barbershopTrialEndsAt = (user as any).barbershopTrialEndsAt || null;
        token.barbershopPlanExpiresAt = (user as any).barbershopPlanExpiresAt || null;
        token.barbershopIsActive = (user as any).barbershopIsActive ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).barbershopId = token.barbershopId;
        (session.user as any).barbershopPlan = token.barbershopPlan;
        (session.user as any).barbershopTrialEndsAt = token.barbershopTrialEndsAt;
        (session.user as any).barbershopPlanExpiresAt = token.barbershopPlanExpiresAt;
        (session.user as any).barbershopIsActive = token.barbershopIsActive;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
    // 🛡️ Token expira em 24 horas (o usuário terá que logar novamente)
    maxAge: 24 * 60 * 60, // 24 horas
    // Renovar o token a cada 1 hora
    updateAge: 60 * 60, // 1 hora
  },
  secret: process.env.NEXTAUTH_SECRET,
};
