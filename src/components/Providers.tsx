'use client';

import { useState, useEffect, useRef } from 'react';
import { SessionProvider } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import BarberLoading from './shared/BarberLoading';
import Toast from './shared/Toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  const isGlobalLoading = useBarbershopStore((state) => state.isGlobalLoading);
  const loadingMessage = useBarbershopStore((state) => state.loadingMessage);
  
  const [shouldShow, setShouldShow] = useState(true); // Always true for first splash
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const loadingTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle Initial Splash & Delayed Loading
  useEffect(() => {
    if (!isInitialLoadDone) {
      // First time: Force 3s splash
      const timer = setTimeout(() => {
        setShouldShow(false);
        setIsInitialLoadDone(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Subsequent loads:
    if (isGlobalLoading) {
      // Don't show full screen immediately. Wait 3 seconds.
      loadingTimer.current = setTimeout(() => {
        setShouldShow(true);
      }, 3000);
    } else {
      // If loading finishes before 3s, clear the timer
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
      setShouldShow(false);
    }

    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current);
    };
  }, [isGlobalLoading, isInitialLoadDone]);

  return (
    <SessionProvider>
      {/* Intelligent Loading - Full Screen only for Initial or Long Tasks */}
      <AnimatePresence mode="wait">
        {shouldShow && (
          <BarberLoading key="global-loader" message={isGlobalLoading ? loadingMessage : 'PREPARANDO SEU ESTILO...'} />
        )}
      </AnimatePresence>

      {/* Subtle Progress Bar for Quick Transitions (Fast Feedback) */}
      <AnimatePresence>
        {isGlobalLoading && !shouldShow && (
          <motion.div 
            className="fixed top-0 left-0 right-0 h-1 z-[10000] bg-gradient-to-r from-orange-500 via-white to-orange-500 bg-[length:200%_100%]"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ 
              opacity: 1, 
              scaleX: 1,
              backgroundPosition: ['0% 0%', '100% 0%']
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              scaleX: { duration: 10, ease: "easeOut" },
              backgroundPosition: { duration: 2, repeat: Infinity, ease: "linear" }
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Smooth reveal transition for the main content */}
      <motion.div
        className="flex flex-col min-h-screen"
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
        animate={{ 
          opacity: shouldShow ? 0 : 1, 
          scale: shouldShow ? 0.98 : 1,
          filter: shouldShow ? 'blur(10px)' : 'blur(0px)'
        }}
        transition={{ 
          duration: 1.2, 
          ease: [0.22, 1, 0.36, 1],
          opacity: { duration: 0.8 }
        }}
      >
        <Toast />
        {children}
      </motion.div>
    </SessionProvider>
  );
}
