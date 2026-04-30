'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function QuickInfo() {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const openMaps = () => {
    const address = settings?.barbershopAddress || 'Barbearia';
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  };

  const openWhatsApp = () => {
    const phone = settings?.supportPhone || '5511999999999';
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 space-y-8 pb-4"
    >
      {/* ── Banner Section ── */}
      <div className="relative h-48 md:h-64 rounded-[2.5rem] overflow-hidden border border-white/10 group">
        <img 
          src="/sede.jpg" 
          alt="Interior da Barbearia" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-6 md:bottom-6 md:left-8">
            <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.4em] mb-0.5">Nossa Sede</p>
            <h3 className="text-xl md:text-2xl text-bebas font-black text-white italic uppercase tracking-tight">O Templo do Estilo</h3>
        </div>
      </div>

      {/* ── Info Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between min-h-[200px]">
              <div>
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Localização</h4>
                  <p className="text-sm font-bold text-white leading-relaxed whitespace-pre-line">
                      {settings?.barbershopAddress || 'Carregando endereço...'}
                  </p>
              </div>
              <button 
                onClick={openMaps}
                className="mt-6 flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-600 hover:border-orange-500 transition-all"
              >
                  📍 Abrir no Google Maps
              </button>
          </div>

          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between min-h-[200px]">
              <div>
                  <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Funcionamento</h4>
                  <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-neutral-400">Seg - Sex</span>
                          <span className="font-black text-white">{settings?.weekOpenHour || '09:00'} - {settings?.weekCloseHour || '20:00'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-neutral-400">Sábado</span>
                          {settings?.saturdayClosed ? (
                            <span className="font-black text-red-500 uppercase">Fechado</span>
                          ) : (
                            <span className="font-black text-white">{settings?.saturdayOpenHour || '08:00'} - {settings?.saturdayCloseHour || '18:00'}</span>
                          )}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-neutral-400">Domingo</span>
                          {settings?.sundayClosed === false ? (
                            <span className="font-black text-white">{settings?.sundayOpenHour || '09:00'} - {settings?.sundayCloseHour || '14:00'}</span>
                          ) : (
                            <span className="font-black text-red-500 uppercase">Fechado</span>
                          )}
                      </div>
                  </div>
              </div>
              <button 
                onClick={openWhatsApp}
                className="mt-6 flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 text-[10px] font-black uppercase tracking-widest text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all"
              >
                  💬 Suporte via WhatsApp
              </button>
          </div>
      </div>

      {/* ── Brand Slogan ── */}
      <div className="text-center py-4 opacity-10">
          <p className="text-[10px] font-black text-white uppercase tracking-[1em] italic">Gigantes do Corte</p>
      </div>
    </motion.div>
  );
}
