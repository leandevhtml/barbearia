'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';

export default function FreeCouponModal() {
  const { showFreeCoupon, dismissFreeCoupon, currentUser } = useBarbershopStore();

  return (
    <AnimatePresence>
      {showFreeCoupon && (
        <motion.div className="fixed inset-0 z-[600] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

          <motion.div className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
            onClick={dismissFreeCoupon}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

          {/* Modal card */}
          <motion.div className="relative z-10 w-full max-w-md"
            initial={{ scale: 0.5, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}>

            <div className="card-luxury p-1 md:p-1.5 overflow-hidden border-orange-500/40 shadow-[0_0_100px_rgba(234,88,12,0.4)]">
              
              <div className="bg-[#050505] rounded-[1.8rem] p-10 md:p-14 text-center relative overflow-hidden">
                
                {/* Background Decorations */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-600/10 blur-[80px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-600/5 blur-[80px] rounded-full" />
                
                {/* Trophy & Sparkles */}
                <motion.div 
                    className="text-7xl md:text-9xl mb-8 relative z-10"
                    animate={{ 
                        y: [0, -20, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    🏆
                </motion.div>

                <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.8em] mb-4">Elite Reward</p>
                
                <h2 className="text-5xl md:text-7xl text-bebas font-black text-white italic leading-none mb-6 tracking-tight">
                    CORTE <span className="text-orange-500">GRÁTIS!</span>
                </h2>

                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

                <div className="space-y-4 mb-10">
                    <p className="text-base md:text-lg font-bold text-neutral-300 leading-relaxed italic">
                        &quot;Parabéns, {currentUser?.name?.split(' ')[0]}!&quot;
                    </p>
                    <p className="text-sm font-bold text-neutral-400 mb-10 max-w-[280px] leading-relaxed">
                        Seu compromisso com o estilo valeu a pena. Use seu cupom para um &quot;Corte Social&quot; gratuito.
                    </p>
                </div>

                {/* Decorative Barcode */}
                <div className="flex justify-center gap-[2.5px] mb-10 opacity-30 h-10 items-end">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} className="bg-white"
                      style={{ 
                          width: i % 4 === 0 ? 3 : 1, 
                          height: i % 6 === 0 ? '100%' : i % 3 === 0 ? '70%' : '50%' 
                      }} 
                    />
                  ))}
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={dismissFreeCoupon}
                        className="btn-prime w-full py-5 text-sm tracking-[0.2em]"
                    >
                        RESGATAR AGORA
                    </button>
                    <button 
                        onClick={dismissFreeCoupon}
                        className="text-[10px] font-black text-neutral-600 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Utilizar em outra visita
                    </button>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
