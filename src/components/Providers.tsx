'use client';

import { SessionProvider } from 'next-auth/react';
import { useBarbershopStore } from '@/store/barbershopStore';
import BarberLoading from './shared/BarberLoading';
import Toast from './shared/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  const isGlobalLoading = useBarbershopStore((state) => state.isGlobalLoading);
  const loadingMessage = useBarbershopStore((state) => state.loadingMessage);

  return (
    <SessionProvider>
      {/* Pure CSS loader — no AnimatePresence overhead */}
      {isGlobalLoading && <BarberLoading message={loadingMessage} />}
      <Toast />
      {children}
    </SessionProvider>
  );
}
