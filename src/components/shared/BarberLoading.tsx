'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

/**
 * BarberLoading - High Performance Loading Screen
 * 
 * Uses GPU-accelerated CSS animations defined in globals.css.
 * Optimized for mobile to prevent 'freezing' and main-thread blocking.
 * Integrated with Framer Motion for smooth exit transitions.
 */
export default function BarberLoading({ 
  message = 'PREPARANDO SUA CADEIRA...',
  inline = false 
}: { 
  message?: string,
  inline?: boolean
}) {
  return (
    <motion.div 
      className={inline ? "flex flex-col items-center justify-center py-20 w-full h-full min-h-[400px]" : "barber-loading-overlay"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="barber-loading-inner">
        {/* SVG Premium Spinner - Branded with Logo */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <motion.svg 
            className="w-full h-full" 
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          >
            <defs>
              <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6e00" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
            {/* Background static ring */}
            <circle 
              cx="50" cy="50" r="46" 
              stroke="rgba(255,110,0,0.05)" 
              strokeWidth="2" 
              fill="none" 
            />
            {/* Active rotating ring */}
            <circle 
              cx="50" cy="50" r="46" 
              stroke="url(#spinner-grad)" 
              strokeWidth="4" 
              strokeLinecap="round" 
              fill="none" 
              strokeDasharray="140 300"
            />
          </motion.svg>
          
          {/* Logo in the center with breathing effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className="relative w-16 h-16 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.05, 1],
                filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)']
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={64} 
                height={64} 
                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,110,0,0.3)]"
              />
            </motion.div>
          </div>
        </div>

        {/* Status Text */}
        <p className="barber-loading-text">{message}</p>
      </div>
    </motion.div>
  );
}
