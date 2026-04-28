'use client';

import { motion } from 'framer-motion';

export default function BarberLoading({ message = 'PREPARANDO SUA CADEIRA...' }: { message?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center p-6"
    >
      <div className="relative flex flex-col items-center">
        {/* Minimalist Animated Ring */}
        <div className="relative w-20 h-20">
          <motion.div
            className="absolute inset-0 border-2 border-orange-500/20 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-t-2 border-orange-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Central Barber Icon (Lightweight SVG or simple shape) */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-1 h-8 bg-gradient-to-b from-red-500 via-white to-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          </div>
        </div>

        {/* Status Text */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] mb-3">
              {message}
          </p>
          
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div 
                key={i}
                className="w-1 h-1 bg-orange-500 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3] 
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: i * 0.15 
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

