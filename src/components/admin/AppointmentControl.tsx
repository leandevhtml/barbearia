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

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
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

  const sorted = [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-3">
            <span className="text-xl">{isFidelityOn ? '💎' : '🔒'}</span>
            <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-1">Sistema de Fidelidade</p>
                <p className={`text-xs font-bold ${isFidelityOn ? 'text-green-500' : 'text-red-500'}`}>
                    {isFidelityOn ? 'ATIVO: Clientes acumulando selos' : 'INATIVO: Acúmulo de selos pausado'}
                </p>
            </div>
        </div>
        <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest opacity-30">
            v2.4 Live
        </div>
      </div>

      {/* ── Quick Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Hoje',  value: counts.total,      icon: '📋', color: 'var(--gray-300)' },
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
          const timeFormatted = format(new Date(appt.date), 'HH:mm');
          const currentId = appt._id || appt.id;

          return (
            <motion.div key={currentId}
              className="glass rounded-3xl border p-6 card-hover group"
              style={{ borderColor: 'var(--border)' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}>

              <div className="flex flex-col xl:flex-row xl:items-center gap-6">
                {/* Time Indicator */}
                <div className="flex items-center gap-5 xl:flex-1 min-w-0">
                  <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 bg-neutral-950 border border-white/5 group-hover:border-orange-500/30 transition-colors">
                    <span className="text-white text-xl font-black leading-none">{timeFormatted.split(':')[0]}</span>
                    <span className="text-[10px] font-black text-orange-500 mt-1">{timeFormatted.split(':')[1]}h</span>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <p className="text-2xl font-black text-white truncate tracking-tight">{appt.userId?.name || 'Cliente'}</p>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-neutral-500">
                      <span className="flex items-center gap-2 text-neutral-300">
                        {appt.serviceName}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="opacity-50">👤</span>
                        {appt.barberId?.name || 'Não atribuído'}
                      </span>
                      <span className="text-orange-500 font-black">
                        R$ {appt.price?.toFixed(2)}
                      </span>
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

                  {appt.status === 'completed' && (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-neutral-900/50 border border-white/5">
                        <span className="text-green-500 text-lg">✓</span>
                        <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">
                          Pago R$ {(appt.totalAmount || appt.price).toFixed(2)}
                        </span>
                      </div>
                      {appt.items && appt.items.length > 0 && (
                        <p className="text-[9px] text-neutral-500 font-bold uppercase">+ {appt.items.length} itens extras</p>
                      )}
                    </div>
                  )}

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
