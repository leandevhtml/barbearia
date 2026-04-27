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
      {/* ── 3D Barber Pole Simulation ── */}
      <div className="relative w-16 h-48 md:w-20 md:h-64">
        
        {/* Top Metallic Cap */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 md:w-24 md:h-10 bg-gradient-to-b from-[#e5e7eb] via-[#9ca3af] to-[#4b5563] rounded-full z-10 border border-white/20 shadow-[0_-5px_15px_rgba(255,255,255,0.1)]" />
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-10 h-6 bg-[#9ca3af] rounded-full z-10" />

        {/* The Pole Body */}
        <div className="w-full h-full bg-white rounded-full overflow-hidden border-x-4 border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5),0_0_40px_rgba(0,0,0,0.8)] relative">
            <motion.div 
                className="absolute inset-0 w-full h-[200%]"
                style={{
                    background: `repeating-linear-gradient(
                        45deg,
                        #ff0000,
                        #ff0000 20px,
                        #ffffff 20px,
                        #ffffff 40px,
                        #0000ff 40px,
                        #0000ff 60px,
                        #ffffff 60px,
                        #ffffff 80px
                    )`
                }}
                animate={{ y: ['0%', '-50%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/4 w-1 bg-white/30 blur-[2px] pointer-events-none" />
        </div>

        {/* Bottom Metallic Cap */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-8 md:w-24 md:h-10 bg-gradient-to-t from-[#e5e7eb] via-[#9ca3af] to-[#4b5563] rounded-full z-10 border border-white/20 shadow-[0_5px_15px_rgba(255,255,255,0.1)]" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-10 h-6 bg-[#9ca3af] rounded-full z-10" />
      </div>

      {/* ── Status Text ── */}
      <motion.div 
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-[11px] md:text-sm font-black text-orange-500 uppercase tracking-[0.4em] mb-4">
            {message}
        </p>
        <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map(i => (
                <motion.div 
                    key={i}
                    className="w-1.5 h-1.5 bg-white/20 rounded-full"
                    animate={{ backgroundColor: ['rgba(255,255,255,0.2)', '#ea580c', 'rgba(255,255,255,0.2)'] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
