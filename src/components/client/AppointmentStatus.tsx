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
  const { currentUser, showToast, syncUser, settings } = useBarbershopStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchMyAppointments = () => {
    fetch('/api/appointments', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAppointments(data.filter((a: any) => !a.isBusySlot));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMyAppointments();
  }, []);

  const handleCancel = async (apptId: string) => {
    if (!apptId || cancellingId) return;
    setCancellingId(apptId);
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Agendamento cancelado com sucesso.', 'info');
        fetchMyAppointments();
        syncUser();
      } else {
        showToast(data.message || 'Não foi possível cancelar.', 'error');
      }
    } catch {
      showToast('Erro de conexão ao cancelar.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  if (!currentUser) return null;

  if (loading) {
    return <BarberLoading inline message="CARREGANDO SEUS AGENDAMENTOS..." />;
  }

  const list = appointments;

  if (!list.length)
    return (
      <div className="card-luxury p-10 md:p-16 text-center max-w-2xl mx-auto border-dashed opacity-40">
        <div className="text-6xl md:text-9xl mb-6">📅</div>
        <h3 className="text-3xl md:text-5xl text-bebas font-black text-white italic uppercase tracking-tight">SEM AGENDA</h3>
        <p className="text-neutral-500 font-bold text-sm mt-4 max-w-sm mx-auto">
            Sua jornada de estilo começará assim que você realizar o primeiro agendamento.
        </p>
      </div>
    );

  return (
    <div className="space-y-8 w-full max-w-3xl mx-auto px-2 pb-20">
      {list.map((appt, i) => {
        const cfg = CFG[appt.status as keyof typeof CFG] || CFG.pending;
        const apptDate = new Date(appt.date);
        const timeFormatted = format(apptDate, 'HH:mm');
        const dateFormatted = format(apptDate, 'dd/MM/yyyy');
        const apptId = appt._id || appt.id;

        return (
          <motion.div 
            key={apptId}
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

            <div className="p-5 md:p-10">
                {/* Status Section */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-2xl border border-white/15 bg-neutral-900" 
                             style={{ color: cfg.color }}>
                            {cfg.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-0.5 drop-shadow-sm" style={{ color: cfg.color }}>{cfg.label}</p>
                            <div className="flex items-baseline gap-3">
                              <p className="text-3xl md:text-5xl text-bebas font-black text-white italic leading-none drop-shadow-md">{timeFormatted}</p>
                              <span className="text-xs font-black text-orange-500 uppercase tracking-widest">{dateFormatted}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">PROTOCOLO VIP</p>
                          <p className="text-xl text-bebas font-black text-orange-500 italic tracking-tighter">#{(apptId || '').toString().toUpperCase().slice(0,8)}</p>
                        </div>
                        <div className="flex gap-2">
                          {appt.status === 'pending' && (
                            <a
                              href={`https://wa.me/${(settings?.supportPhone || '5511999999999').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, gostaria de confirmar detalhes sobre meu agendamento (#${(apptId || '').slice(0, 8)}) de ${appt.serviceName} para o dia ${dateFormatted} às ${timeFormatted}.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-[9px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1 transition-all"
                            >
                              💬 Contato
                            </a>
                          )}
                          {appt.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(apptId)}
                              disabled={cancellingId === apptId}
                              className="px-4 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[9px] font-black text-red-500 uppercase tracking-widest transition-all"
                            >
                              {cancellingId === apptId ? 'Cancelando...' : 'Cancelar'}
                            </button>
                          )}
                        </div>
                    </div>
                </div>

                {/* Service Details */}
                <div className="space-y-2 mb-6">
                    <h4 className="text-3xl md:text-5xl text-bebas font-black text-white italic uppercase leading-none tracking-tight drop-shadow-xl break-words">
                        {appt.serviceName}
                    </h4>
                    <p className="text-sm font-bold text-neutral-400 leading-relaxed">
                        {cfg.desc}
                    </p>
                </div>

                {/* Footer Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-5 border-t border-white/10 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-white/15 flex items-center justify-center text-bebas font-black text-orange-500 text-xl shadow-2xl overflow-hidden flex-shrink-0">
                            {appt.barberId?.avatar && (appt.barberId.avatar.startsWith('http') || appt.barberId.avatar.startsWith('data:image')) ? (
                              <img src={appt.barberId.avatar} alt={appt.barberId.name} className="w-full h-full object-cover" />
                            ) : (
                              appt.barberId?.name?.substring(0,2).toUpperCase() || 'BB'
                            )}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-0.5">Especialista</p>
                            <p className="text-xl text-bebas font-black text-white italic uppercase leading-none tracking-tight">{appt.barberId?.name || 'Não atribuído'}</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right">
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-0.5">Valor</p>
                        <p className="text-3xl text-bebas font-black text-orange-500 italic leading-none drop-shadow-lg">
                          {appt.price === 0 || appt.paymentStatus === 'free_reward' ? 'GRÁTIS' : `R$ ${(appt.totalAmount || appt.price || 0).toFixed(2)}`}
                        </p>
                    </div>
                </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
