'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';

export default function StampAnimationOverlay() {
  const { showStampAnimation, stampAnimationCount, dismissStampAnimation, currentUser } = useBarbershopStore();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showStampAnimation) {
      timer.current = setTimeout(dismissStampAnimation, 3600);
    }
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [showStampAnimation, dismissStampAnimation]);

  return (
    <AnimatePresence>
      {showStampAnimation && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

          {/* Luxury Backdrop (Optimized: removed expensive blur on mobile) */}
          <motion.div className="absolute inset-0 pointer-events-auto bg-black/95 md:backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismissStampAnimation} />

          {/* Animated Stage */}
          <motion.div className="relative z-10 flex flex-col items-center gap-8 md:gap-12 max-w-md w-full transform-gpu will-change-transform"
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}>

            {/* Cinematic Stamp Effect */}
            <div className="relative transform-gpu">
              {/* Expanding Rings (Hidden on mobile to save CPU/GPU) */}
              <div className="hidden md:block">
                {[1, 2].map(i => (
                  <motion.div key={i}
                    className="absolute inset-0 rounded-full border-2 border-orange-500/30 transform-gpu"
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 2.5 + i * 0.3, opacity: 0 }}
                    transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeOut', repeat: Infinity, repeatDelay: 1 }} />
                ))}
              </div>

              <motion.div
                className="w-32 h-32 md:w-56 md:h-56 rounded-full flex items-center justify-center relative shadow-[0_0_50px_rgba(255,110,0,0.3)] transform-gpu will-change-transform"
                style={{
                  background: 'linear-gradient(135deg, #ff6e00, #ea580c, #9a3412)',
                }}
                initial={{ rotate: -30, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                
                <div className="text-center text-white flex flex-col items-center transform-gpu">
                  <motion.span 
                    className="text-5xl md:text-8xl mb-1 md:mb-2 drop-shadow-xl"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    ✂️
                  </motion.span>
                  <span className="text-[11px] md:text-xs font-black tracking-[0.4em] uppercase drop-shadow-lg opacity-80">Carimbado</span>
                </div>
                
                <div className="absolute inset-3 rounded-full border-2 border-white/20 border-dashed animate-spin-slow" />
              </motion.div>
            </div>

            {/* Progress Badge */}
            <motion.div
              className="card-luxury p-6 md:p-14 text-center w-full border-orange-500/30 shadow-none md:shadow-[0_0_60px_rgba(234,88,12,0.2)] transform-gpu"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}>
              
              <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] mb-4 text-orange-500">Sua Fidelidade Cresceu</p>
              
              <div className="flex items-baseline justify-center gap-2 md:gap-4 mb-6">
                <motion.span className="text-6xl md:text-9xl text-bebas font-black text-white italic tracking-tighter drop-shadow-md transform-gpu"
                  initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.4, stiffness: 300 }}>
                  {stampAnimationCount}
                </motion.span>
                <span className="text-2xl md:text-5xl text-bebas font-black text-neutral-700 italic">/10</span>
              </div>

              <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    className="h-full bg-orange-600 shadow-[0_0_20px_var(--orange-prime)]"
                    initial={{ width: `${((stampAnimationCount - 1) / 10) * 100}%` }}
                    animate={{ width: `${(stampAnimationCount / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                />
              </div>

              <p className="text-sm md:text-base font-bold text-neutral-400 mt-6 italic">
                {currentUser?.name || 'Cliente'} • VIP Protocol
              </p>
            </motion.div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
