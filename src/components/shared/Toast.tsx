'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import { useEffect } from 'react';

export default function Toast() {
  const { toast, hideToast } = useBarbershopStore();

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error':   return '❌';
      default:        return 'ℹ️';
    }
  };

  const getColor = () => {
    switch (toast.type) {
      case 'success': return 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]';
      case 'error':   return 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]';
      default:        return 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.2)]';
    }
  };

  return (
    <AnimatePresence>
      {toast.isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10000] min-w-[280px] max-w-[90vw]"
        >
          <div className={`glass-panel p-5 rounded-2xl border flex items-center gap-4 bg-black/80 backdrop-blur-xl ${getColor()}`}>
            <span className="text-xl">{getIcon()}</span>
            <p className="text-[11px] font-black uppercase tracking-widest text-white">
              {toast.message}
            </p>
            <button 
              onClick={hideToast}
              className="ml-auto text-neutral-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
