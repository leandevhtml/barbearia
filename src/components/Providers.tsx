'use client';

import { SessionProvider } from 'next-auth/react';
import { useBarbershopStore } from '@/store/barbershopStore';
import BarberLoading from './shared/BarberLoading';
import Toast from './shared/Toast';
import { AnimatePresence } from 'framer-motion';

export default function Providers({ children }: { children: React.ReactNode }) {
  const isGlobalLoading = useBarbershopStore((state) => state.isGlobalLoading);
  const loadingMessage = useBarbershopStore((state) => state.loadingMessage);

  return (
    <SessionProvider>
      <AnimatePresence>
        {isGlobalLoading && <BarberLoading message={loadingMessage} />}
      </AnimatePresence>
      <Toast />
      {children}
    </SessionProvider>
  );
}

