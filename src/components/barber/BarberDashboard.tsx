import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BarberLoading from '@/components/shared/BarberLoading';
import { format } from 'date-fns';
import { signOut } from 'next-auth/react';
import { useBarbershopStore } from '@/store/barbershopStore';

const STATUS_META = {
  pending: { label: 'Aguardando', cls: 'status-pending' },
  'in-progress': { label: 'Em Serviço', cls: 'status-in-progress' },
  completed: { label: 'Finalizado', cls: 'status-completed' },
  cancelled: { label: 'Cancelado', cls: 'status-cancelled' },
};

export default function BarberDashboard() {
  const { currentUser } = useBarbershopStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const updateStatus = async (apptId: string, status: string) => {
    console.log('Barbeiro tentando atualizar:', apptId, status);
    try {
      const res = await fetch(`/api/appointments/${apptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAppointments();
        if (status === 'completed') showToast('Serviço finalizado!', 'success');
        if (status === 'in-progress') showToast('Serviço iniciado!', 'success');
      } else {
        const data = await res.json();
        showToast(`Erro: ${data.message || 'Falha ao atualizar'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão.', 'error');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const sorted = [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Metrics
  const commissionRate = currentUser?.commissionRate || 50;
  const todayTotal = sorted.filter(a => a.status === 'completed').reduce((acc, a) => acc + (a.totalAmount || a.price || 0), 0);
  const myShare = todayTotal * (commissionRate / 100);
  const pendingCount = sorted.filter(a => a.status === 'pending').length;

  if (loading) {
    return <BarberLoading message="CARREGANDO SUA AGENDA..." />;
  }

  return (
    <div className="min-h-dvh pb-20 w-full pt-10">
      <div className="flex justify-between items-center mb-8 px-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl text-bebas font-black text-white italic tracking-tight">Fala, {currentUser?.name?.split(' ')[0]}!</h1>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1">Sua Agenda de Hoje</p>
        </div>
        <button onClick={handleLogout} className="text-xs font-black text-neutral-500 uppercase tracking-widest hover:text-red-500 transition-colors">
          Sair
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 px-4">
        <div className="luxury-card p-6 border-l-4 border-l-orange-500">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Sua Comissão ({commissionRate}%)</p>
          <p className="text-4xl text-bebas font-black text-white italic">R$ {myShare.toFixed(2)}</p>
          <p className="text-[9px] font-bold text-neutral-600 uppercase mt-1">Total produzido: R$ {todayTotal.toFixed(2)}</p>
        </div>
        <div className="luxury-card p-6 border-l-4 border-l-white/20">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Aguardando na Fila</p>
          <p className="text-4xl text-bebas font-black text-white italic">{pendingCount} <span className="text-base text-neutral-500 font-sans not-italic">clientes</span></p>
        </div>
      </div>

      <div className="space-y-4 px-4">
        {sorted.map((appt, idx) => {
          const meta = STATUS_META[appt.status as keyof typeof STATUS_META] || STATUS_META.pending;
          const timeFormatted = format(new Date(appt.date), 'HH:mm');
          const currentId = appt._id || appt.id;

          return (
            <motion.div key={currentId}
              className="luxury-card p-6 border border-white/5 relative overflow-hidden"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}>

              {appt.status === 'in-progress' && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-orange-500 shadow-[0_0_10px_var(--orange-prime)]" />
              )}

              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${meta.cls} mb-2 inline-block`}>
                      {meta.label}
                    </span>
                    <h3 className="text-2xl text-bebas font-black text-white italic tracking-tight">{appt.userId?.name || 'Cliente'}</h3>
                    <p className="text-[11px] font-bold text-neutral-400 mt-1">{appt.serviceName} • R$ {appt.price?.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl text-bebas font-black text-orange-500 italic leading-none">{timeFormatted}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2">
                  {appt.status === 'pending' && (
                    <button onClick={() => updateStatus(currentId, 'in-progress')} className="flex-1 bg-orange-600/20 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/30 transition-all font-black uppercase tracking-widest text-[10px] py-3 rounded-xl">
                      Iniciar Corte
                    </button>
                  )}
                  {appt.status === 'in-progress' && (
                    <button onClick={() => updateStatus(currentId, 'completed')} className="flex-1 bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 transition-all font-black uppercase tracking-widest text-[10px] py-3 rounded-xl">
                      Finalizar Serviço
                    </button>
                  )}
                  {appt.status === 'pending' && (
                    <button onClick={() => updateStatus(currentId, 'cancelled')} className="flex-none px-4 text-neutral-500 hover:text-red-500 font-black uppercase tracking-widest text-[10px] py-3 rounded-xl">
                      Cancelar
                    </button>
                  )}
                  {appt.status === 'completed' && (
                    <p className="w-full text-center text-[10px] font-black text-neutral-500 uppercase tracking-widest py-2">
                      Serviço Concluído
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center py-12 glass-panel rounded-3xl border-dashed">
            <p className="text-neutral-500 font-bold text-sm">Sua agenda está vazia para hoje.</p>
          </div>
        )}
      </div>
    </div>
  );
}
