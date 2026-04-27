'use client';

import { motion } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';

export default function LoyaltyCard() {
  const { currentUser, settings, setBookingFreeCut, setActiveTab } = useBarbershopStore();
  
  if (!currentUser) return (
    <div className="card-luxury p-12 text-center opacity-50">
        <p className="text-neutral-500 font-bebas text-2xl uppercase italic">Faça login para ver seu cartão</p>
    </div>
  );

  if (settings && !settings.fidelityEnabled) {
    return (
      <div className="flex flex-col items-center gap-8 w-full max-w-xl mx-auto px-4 pb-20">
        <div className="luxury-card p-12 text-center border-orange-500/20">
          <div className="text-5xl mb-6">🔒</div>
          <h3 className="text-3xl text-bebas font-black text-white italic uppercase mb-4">Programa de Fidelidade Pausado</h3>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Nosso sistema de selos está temporariamente inativo. 
            Fique tranquilo! Seus selos atuais estão seguros e voltarão a aparecer assim que o programa for reativado.
          </p>
        </div>
      </div>
    );
  }

  const { stamps, totalCuts, freeCouponAvailable, name, _id, id } = currentUser;
  const userId = (_id || id || '').toString();
  const maxStamps = settings?.stampsPerReward || 10;

  function handleRedeem() {
      setBookingFreeCut(true);
      setActiveTab('book');
  }

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-xl mx-auto px-2 pb-20">

      {/* ── Premium Membership Card ── */}
      <motion.div
        className="relative w-full aspect-[1.7/1] rounded-[2rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10 group"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-transparent to-transparent opacity-50" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[100px] rounded-full" />
        
        {/* Card Content */}
        <div className="relative h-full flex flex-col justify-between p-6 md:p-10 z-10">
          
          {/* Top Section: Branding & Type */}
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.4em]">Black Member Elite</p>
              </div>
              <h2 className="text-3xl md:text-5xl text-bebas font-black text-white italic leading-tight tracking-tight">
                GIGANTES <span className="text-orange-500 underline decoration-white/20 underline-offset-4">DO CORTE</span>
              </h2>
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/10 shadow-xl">
                💈
            </div>
          </div>

          {/* Middle Section: Adaptive Stamps Progress */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-[90%]">
                {Array.from({ length: maxStamps }, (_, i) => {
                const filled = i < stamps;
                return (
                    <motion.div
                        key={i}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border transition-all duration-1000 ${
                            filled 
                            ? 'bg-orange-600 border-orange-400 shadow-[0_0_20px_rgba(255,110,0,0.5)]' 
                            : 'bg-white/5 border-white/10'
                        }`}
                        initial={filled ? { scale: 0.8, opacity: 0 } : { opacity: 1 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        {filled && (
                            <motion.span 
                                initial={{ rotate: -45, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                                className="text-white text-xl md:text-2xl"
                            >
                                ✂️
                            </motion.span>
                        )}
                    </motion.div>
                );
                })}
            </div>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mt-8 opacity-50">
                {stamps} de {maxStamps} Concluídos
            </p>
          </div>

          {/* Bottom Section: Clean Footer */}
          <div className="flex items-center justify-center border-t border-white/5 pt-6">
            <div className="flex gap-4 items-center">
                <div className="w-1 h-1 rounded-full bg-neutral-800" />
                <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-[0.2em]">VIP MEMBER ACCESS</p>
                <div className="w-1 h-1 rounded-full bg-neutral-800" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Status Grid ── */}
      <div className="grid grid-cols-2 gap-4 md:gap-8 w-full">
        <div className="bg-[#0a0a0a] rounded-[2rem] p-8 md:p-12 flex flex-col items-center text-center border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-4">Total de Cortes</p>
            <p className="text-6xl md:text-8xl text-bebas font-black text-white italic tracking-tighter leading-none drop-shadow-2xl">{totalCuts}</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-[2rem] p-8 md:p-12 flex flex-col items-center text-center border border-orange-500/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em] mb-4">Faltam p/ Bônus</p>
            <p className="text-6xl md:text-8xl text-bebas font-black text-orange-500 italic tracking-tighter leading-none drop-shadow-2xl">{Math.max(0, maxStamps - stamps)}</p>
        </div>
      </div>

      {freeCouponAvailable && (
        <motion.div 
            className="w-full p-12 rounded-[3.5rem] text-center border-2 border-white/30 relative overflow-hidden shadow-[0_0_60px_rgba(234,88,12,0.3)]"
            style={{ background: 'linear-gradient(135deg, #ff6e00, #ea580c)' }}
            animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3, repeat: Infinity }}
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none text-[12rem] font-bebas flex items-center justify-center">GOLDEN</div>
          <p className="text-[12px] font-black text-white uppercase tracking-[0.6em] mb-4 drop-shadow-md">Benefício VIP Liberado</p>
          <h3 className="text-5xl md:text-7xl text-bebas font-black text-white italic uppercase mb-8 leading-none tracking-tight drop-shadow-xl">CORTE GRÁTIS!</h3>
          <button 
            onClick={handleRedeem}
            className="bg-white text-orange-600 font-black px-16 py-6 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-transform border border-white"
          >
            RESGATAR AGORA
          </button>
        </motion.div>
      )}
    </div>
  );
}
