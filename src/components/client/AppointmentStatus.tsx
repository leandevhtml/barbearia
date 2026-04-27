'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import BarberLoading from '@/components/shared/BarberLoading';
import { format } from 'date-fns';

const CFG = {
  pending: {
    label: 'Aguardando', icon: '⏳', color: '#fbbf24',
    bg: 'rgba(245,158,11,0.05)', desc: 'Preparando o ambiente para você.',
  },
  'in-progress': {
    label: 'Em Serviço', icon: '✂️', color: '#ff6e00',
    bg: 'rgba(255,110,0,0.05)', desc: 'Sua transformação de imagem começou.',
  },
  completed: {
    label: 'Finalizado', icon: '✅', color: '#10b981',
    bg: 'rgba(16,185,129,0.05)', desc: 'Serviço concluído com excelência!',
  },
  cancelled: {
    label: 'Cancelado', icon: '✕', color: '#ef4444',
    bg: 'rgba(239,68,68,0.05)', desc: 'O agendamento foi cancelado.',
  },
};

export default function AppointmentStatus() {
  const { currentUser } = useBarbershopStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/appointments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAppointments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (!currentUser) return null;

  if (loading) {
    return <BarberLoading message="CARREGANDO SEUS AGENDAMENTOS..." />;
  }

  const list = appointments;

  if (!list.length)
    return (
      <div className="card-luxury p-16 md:p-24 text-center max-w-2xl mx-auto border-dashed opacity-40">
        <div className="text-7xl md:text-9xl mb-10">📅</div>
        <h3 className="text-4xl md:text-5xl text-bebas font-black text-white italic uppercase tracking-tight">SEM AGENDA</h3>
        <p className="text-neutral-500 font-bold text-lg mt-4 max-w-sm mx-auto">
            Sua jornada de estilo começará assim que você realizar o primeiro agendamento.
        </p>
      </div>
    );

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto px-2 pb-20">
      {list.map((appt, i) => {
        const cfg = CFG[appt.status as keyof typeof CFG] || CFG.pending;
        const timeFormatted = format(new Date(appt.date), 'HH:mm');

        return (
          <motion.div 
            key={appt._id}
            className="group relative card-luxury overflow-hidden border-white/10"
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8 }}
          >
            {/* Live Progress Bar */}
            {appt.status === 'in-progress' && (
                <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden">
                    <motion.div 
                        className="h-full bg-orange-600 shadow-[0_0_20px_var(--orange-prime)]"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            )}

            <div className="p-8 md:p-12">
                {/* Status Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-2xl border border-white/15 bg-neutral-900" 
                             style={{ color: cfg.color }}>
                            {cfg.icon}
                        </div>
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] mb-1 drop-shadow-sm" style={{ color: cfg.color }}>{cfg.label}</p>
                            <p className="text-4xl md:text-5xl text-bebas font-black text-white italic leading-none drop-shadow-md">{timeFormatted}</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">PROTOCOLO VIP</p>
                        <p className="text-2xl text-bebas font-black text-orange-500 italic tracking-tighter">#GDC-{(appt._id || appt.id || '').toString().toUpperCase().slice(0,8)}</p>
                    </div>
                </div>

                {/* Service Details */}
                <div className="space-y-4 mb-12">
                    <h4 className="text-5xl md:text-8xl text-bebas font-black text-white italic uppercase leading-none tracking-tight drop-shadow-xl">
                        {appt.serviceName}
                    </h4>
                    <p className="text-base md:text-xl font-bold text-neutral-400 max-w-xl leading-relaxed">
                        {cfg.desc}
                    </p>
                </div>

                {/* Footer Info (Enhanced Contrast) */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pt-10 border-t border-white/10 gap-8">
                    <div className="flex items-center gap-5">
                        <div className="w-18 h-18 rounded-2xl bg-neutral-900 border border-white/15 flex items-center justify-center text-bebas font-black text-orange-500 text-3xl shadow-2xl overflow-hidden">
                            {appt.barberId?.avatar && appt.barberId.avatar.startsWith('http') ? (
                              <img src={appt.barberId.avatar} alt={appt.barberId.name} className="w-full h-full object-cover" />
                            ) : (
                              appt.barberId?.avatar || appt.barberId?.name?.substring(0,2).toUpperCase() || 'BB'
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-1">Especialista Responsável</p>
                            <p className="text-3xl text-bebas font-black text-white italic uppercase leading-none tracking-tight">{appt.barberId?.name || 'Não atribuído'}</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-1">Valor do Serviço</p>
                        <p className="text-5xl text-bebas font-black text-orange-500 italic leading-none drop-shadow-lg">
                          {appt.price === 0 ? 'GRÁTIS' : `R$ ${appt.price?.toFixed(2)}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Decorative Ticket Cuts */}
            <div className="absolute top-1/2 -left-5 w-10 h-10 bg-[#020202] rounded-full border border-white/10" />
            <div className="absolute top-1/2 -right-5 w-10 h-10 bg-[#020202] rounded-full border border-white/10" />
          </motion.div>
        );
      })}
    </div>
  );
}
