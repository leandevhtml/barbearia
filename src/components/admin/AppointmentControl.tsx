'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useBarbershopStore } from '@/store/barbershopStore';
import CheckoutModal from './CheckoutModal';

const STATUS_META = {
  pending:     { label: 'Aguardando',    cls: 'status-pending'     },
  'in-progress':{ label: 'Em Atendimento', cls: 'status-in-progress' },
  completed:   { label: 'Concluído',     cls: 'status-completed'   },
  cancelled:   { label: 'Cancelado',     cls: 'status-cancelled'   },
};

export default function AppointmentControl() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutAppt, setCheckoutAppt] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | 'future'>('1d'); // 1d, 7d, 30d, future

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`/api/appointments?t=${Date.now()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { settings, showToast } = useBarbershopStore();

  const filtered = appointments.filter(appt => {
    const d = new Date(appt.date);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (timeRange === '1d') {
      return d.toDateString() === now.toDateString();
    }
    
    if (timeRange === 'future') {
      return d.getTime() > now.getTime() && d.toDateString() !== now.toDateString();
    }
    
    const diff = now.getTime() - d.getTime();
    const diffDays = diff / (1000 * 3600 * 24);
    
    if (timeRange === '7d') return diffDays <= 7;
    if (timeRange === '30d') return diffDays <= 30;
    
    return true;
  });

  const updateStatus = async (apptId: string, status: string, items?: any[], totalAmount?: number, paymentMethod?: string) => {
    if (!apptId || apptId === 'undefined') {
      showToast('Erro: ID do agendamento inválido.', 'error');
      return;
    }

    console.log('Tentando atualizar:', apptId, status);
    
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, items, totalAmount, paymentMethod })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { message: 'Erro ao processar resposta do servidor' };
      }
      
      if (res.ok) {
        fetchAppointments();
        if (status === 'completed') {
          showToast('Atendimento finalizado com sucesso!', 'success');
        } else if (status === 'in-progress') {
          showToast('Atendimento iniciado!', 'success');
        } else if (status === 'cancelled') {
          showToast('Atendimento cancelado.', 'info');
        }
      } else {
        console.error('Erro detalhado:', JSON.stringify(data));
        showToast(`Erro: ${data.message || 'Falha ao atualizar status'}`, 'error');
      }
    } catch (err: any) {
      console.error('Erro de conexão:', err);
      showToast('Erro de conexão ao tentar atualizar o agendamento.', 'error');
    }
  };


  const handleCheckoutConfirm = async (items: any[], totalAmount: number, paymentMethod: string) => {
    if (!checkoutAppt) return;
    const id = checkoutAppt._id || checkoutAppt.id;
    await updateStatus(id, 'completed', items, totalAmount, paymentMethod);
    setCheckoutAppt(null);
  };

  const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const counts = {
    total:      sorted.length,
    pending:    sorted.filter(a => a.status === 'pending').length,
    inProgress: sorted.filter(a => a.status === 'in-progress').length,
    done:       sorted.filter(a => a.status === 'completed').length,
  };

  if (loading) {

    return <p className="text-neutral-500 animate-pulse text-center py-10 font-bebas tracking-widest">SINCRONIZANDO BANCO...</p>;
  }

  const isFidelityOn = settings?.fidelityEnabled ?? true;

  return (
    <div className="space-y-8">
      {/* ── Status Header ── */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between xl:items-center bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-xl border border-orange-500/20 shadow-[0_0_15px_rgba(234,88,12,0.1)]">
                {isFidelityOn ? '💎' : '🔒'}
            </div>
            <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">Fidelidade</p>
                <p className={`text-xs font-bold uppercase tracking-tight ${isFidelityOn ? 'text-green-500' : 'text-red-500'}`}>
                    {isFidelityOn ? 'Ativo' : 'Inativo'}
                </p>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 flex-1 xl:justify-end">
            {/* Agenda Filters */}
            <div className="flex flex-col gap-2 min-w-[180px]">
                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Agenda Ativa</p>
                <div className="flex p-1 bg-neutral-950 border border-white/5 rounded-2xl shadow-inner">
                {[
                    { id: '1d', label: 'Hoje' },
                    { id: 'future', label: 'Próximos' }
                ].map(r => (
                    <button
                    key={r.id}
                    onClick={() => setTimeRange(r.id as any)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex-1 ${
                        timeRange === r.id 
                        ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
                        : 'text-neutral-500 hover:text-white'
                    }`}
                    >
                    {r.label}
                    </button>
                ))}
                </div>
            </div>

            {/* History Filters */}
            <div className="flex flex-col gap-2 min-w-[180px]">
                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1">Relatórios</p>
                <div className="flex p-1 bg-neutral-950 border border-white/5 rounded-2xl shadow-inner">
                {[
                    { id: '7d', label: '7 Dias' },
                    { id: '30d', label: '30 Dias' }
                ].map(r => (
                    <button
                    key={r.id}
                    onClick={() => setTimeRange(r.id as any)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex-1 ${
                        timeRange === r.id 
                        ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
                        : 'text-neutral-500 hover:text-white'
                    }`}
                    >
                    {r.label}
                    </button>
                ))}
                </div>
            </div>
        </div>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Período', value: counts.total,      icon: '📋', color: 'var(--gray-300)' },
          { label: 'Aguardando', value: counts.pending,    icon: '⏳', color: '#fbbf24'          },
          { label: 'Em Serviço', value: counts.inProgress, icon: '✂️', color: 'var(--orange)'    },
          { label: 'Finalizados',value: counts.done,       icon: '✅', color: '#10b981'           },
        ].map((s, i) => (
          <motion.div key={s.label}
            className="glass rounded-3xl p-6 border card-hover"
            style={{ borderColor: 'var(--border)' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">{s.icon}</div>
              <span className="text-3xl font-black" style={{ color: s.color }}>{s.value}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Appointment List ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-neutral-500 uppercase tracking-[0.3em] mb-2 ml-1">Lista de Atendimentos</h3>
        {sorted.map((appt, idx) => {
          const meta = STATUS_META[appt.status as keyof typeof STATUS_META] || STATUS_META.pending;
          const dateObj = new Date(appt.date);
          const timeFormatted = format(dateObj, 'HH:mm');
          const dateFormatted = format(dateObj, 'dd/MM');
          const currentId = appt._id || appt.id;

          return (
            <motion.div key={currentId}
              className="glass rounded-3xl border p-6 card-hover group"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}>

              <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                {/* Time Indicator */}
                <div className="flex items-center gap-6 xl:flex-1 min-w-0">
                  <div className="flex flex-col justify-center border-l-4 border-orange-600 pl-4 py-1 flex-shrink-0">
                    <p className="text-4xl text-bebas font-black text-white italic leading-none tracking-tighter">
                        {timeFormatted}
                    </p>
                    {timeRange !== '1d' && (
                        <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] mt-1.5">
                            {dateFormatted}
                        </p>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <p className="text-2xl font-black text-white truncate tracking-tight">{appt.userId?.name || 'Cliente'}</p>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                      <div className="flex items-center gap-2 text-neutral-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                        {appt.serviceName}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="opacity-50 text-xs">👤</span>
                        {appt.barberId?.name || 'LIVRE'}
                      </div>
                      <div className="flex items-center gap-3 border-l border-white/10 pl-6">
                        <span className={`text-sm italic font-black ${appt.paymentStatus === 'paid_app' || appt.paymentStatus === 'free_reward' ? 'text-green-500' : 'text-orange-500'}`}>
                          R$ {appt.price?.toFixed(2)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md border ${
                          appt.paymentStatus === 'paid_app' 
                            ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                            : appt.paymentStatus === 'free_reward'
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                            : 'bg-orange-500/10 border-orange-500/20 text-orange-500 animate-pulse'
                        }`}>
                          {appt.paymentStatus === 'paid_app' ? 'PAGO (PIX)' : appt.paymentStatus === 'free_reward' ? 'CORTESIA' : 'PAGAR NO BALCÃO'}
                        </span>
                      </div>
                      {appt.items?.length > 0 && (
                        <div className="text-neutral-600 bg-neutral-900 px-2 py-0.5 rounded-md border border-white/5">
                            +{appt.items.length} CONSUMO
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-shrink-0 flex-wrap xl:justify-end">
                  {appt.status === 'pending' && (
                    <>
                      <motion.button id={`btn-start-${currentId}`}
                        onClick={() => updateStatus(currentId, 'in-progress')}
                        className="px-8 py-3 rounded-2xl text-xs font-black tracking-widest btn-primary"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        ▶ INICIAR
                      </motion.button>
                      <motion.button id={`btn-cancel-${currentId}`}
                        onClick={() => updateStatus(currentId, 'cancelled')}
                        className="px-8 py-3 rounded-2xl text-xs font-black tracking-widest btn-ghost text-red-500 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        ✕ CANCELAR
                      </motion.button>
                    </>
                  )}

                  {appt.status === 'in-progress' && (
                    <motion.button id={`btn-complete-${currentId}`}
                      onClick={() => { setCheckoutAppt(appt); }}
                      className="px-10 py-4 rounded-2xl text-xs font-black tracking-widest bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] transition-all"
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      ✅ FECHAR CONTA / PDV
                    </motion.button>
                  )}

                  {appt.status === 'completed' && (() => {
                    const itemsSum = appt.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0;
                    const totalFull = appt.price + itemsSum;
                    return (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-neutral-900/50 border border-white/5">
                          <span className="text-green-500 text-lg">✓</span>
                          <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                            Pago R$ {totalFull.toFixed(2)}
                          </span>
                        </div>
                        {appt.items && appt.items.length > 0 && (
                          <p className="text-[9px] text-neutral-500 font-bold uppercase">+ {appt.items.length} itens extras</p>
                        )}
                      </div>
                    );
                  })()}

                  {appt.status === 'cancelled' && (
                    <div className="px-6 py-3 rounded-2xl bg-red-950/20 border border-red-950/40">
                      <span className="text-xs font-black text-red-600 uppercase tracking-widest">Cancelado</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {checkoutAppt && (
          <CheckoutModal 
            appointment={checkoutAppt}
            onClose={() => setCheckoutAppt(null)}
            onConfirm={handleCheckoutConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
