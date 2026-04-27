'use client';

import { motion } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';

export default function ClientSelector() {
  const { clients, currentClientId, setCurrentClient } = useBarbershopStore();

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
      {clients.map((client, idx) => {
        const active = currentClientId === client.id;
        return (
          <motion.button
            key={client.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setCurrentClient(client.id)}
            className={`flex-shrink-0 flex items-center gap-4 p-2 pr-6 rounded-full border transition-all duration-500 ${
              active 
              ? 'bg-orange-600 border-orange-400 shadow-lg shadow-orange-900/20' 
              : 'bg-neutral-900/40 border-white/5 hover:border-white/10'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-inner transition-colors duration-500 ${
                active ? 'bg-white text-orange-600' : 'bg-neutral-800 text-neutral-500'
            }`}>
              {client.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className={`text-[11px] font-black uppercase tracking-tight leading-none mb-0.5 ${active ? 'text-white' : 'text-neutral-400'}`}>
                {client.name.split(' ')[0]}
              </p>
              <div className="flex items-center gap-1">
                <span className={`text-[9px] font-bold ${active ? 'text-orange-200' : 'text-neutral-600'}`}>
                    {client.stamps}/10
                </span>
                <span className="text-[9px]">✂️</span>
              </div>
            </div>
            {client.freeCouponAvailable && (
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
