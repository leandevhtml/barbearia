'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnnouncementPopupProps {
  text: string;
  image?: string;
  onClose: () => void;
}

export default function AnnouncementPopup({ text, image, onClose }: AnnouncementPopupProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onClose();
    }
  }, [countdown, onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-[95vw] md:max-w-lg bg-[#0c0c0c] border border-orange-500/30 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(234,88,12,0.15)] max-h-[90vh] flex flex-col"
      >
        {/* Close Button & Timer */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-3 md:gap-4 z-10">
          <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-500 text-[9px] md:text-[10px] font-black font-mono">
            {countdown}s
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Image Container - Responsive height */}
        {image && (
          <div className="w-full h-48 sm:h-64 md:h-80 shrink-0 relative">
            <img 
              src={image} 
              alt="Anúncio" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-transparent" />
          </div>
        )}

        {/* Content - Scrollable if too long */}
        <div className="p-6 md:p-10 pt-4 md:pt-6 text-center space-y-4 md:space-y-6 overflow-y-auto no-scrollbar">
          <div className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-orange-600/10 border border-orange-500/20">
            <p className="text-[8px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] md:tracking-[0.3em]">Recado do Barbeiro</p>
          </div>
          
          <p className="text-lg md:text-2xl font-bold text-white leading-relaxed italic px-2">
            "{text}"
          </p>

          <div className="pt-2 md:pt-4">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    className="h-full bg-orange-600 shadow-[0_0_10px_#ea580c]"
                />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
