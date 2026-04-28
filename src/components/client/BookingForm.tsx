'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import { format } from 'date-fns';

const ALL_TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

export default function BookingForm({ onBooked }: { onBooked: () => void }) {
  const { services, currentUser, isBookingFreeCut, setBookingFreeCut, setGlobalLoading, showToast } = useBarbershopStore();
  const user = currentUser;

  const [step, setStep] = useState(1);
  const [svc,  setSvc]  = useState('');
  const [brb,  setBrb]  = useState('');
  const [time, setTime] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const [dbBarbers, setDbBarbers] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  useEffect(() => {
    // Fetch Barbers
    fetch('/api/barbers')
      .then(res => res.json())
      .then(data => setDbBarbers(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    // Fetch Services
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setDbServices(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  const activeServices = dbServices.filter(s => s.active);
  const availableBarbers = dbBarbers.filter(b => b.available !== false); // default to true if undefined

  useEffect(() => {
    if (brb && step === 3) {
      // Fetch appointments for this barber to block times
      fetch('/api/appointments')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const barberAppointments = data.filter(a => a.barberId && a.barberId._id === brb && a.status !== 'cancelled');
            const blocked = barberAppointments.map(a => {
              const d = new Date(a.date);
              return `${d.getUTCHours().toString().padStart(2, '0')}:00`;
            });
            setBookedTimes(blocked);
          }
        });
    }
  }, [brb, step]);

  const getAvailableTimes = () => {
    if (!brb) return ALL_TIMES;
    return ALL_TIMES.filter(t => !bookedTimes.includes(t));
  };

  const availableTimes = getAvailableTimes();

  // Logic: Only "Corte Social" is free if the reward is active
  const getServicePrice = (serviceId: string) => {
      const s = dbServices.find(x => x._id === serviceId);
      if (!s) return 0;
      if (isBookingFreeCut && s.name.toLowerCase().includes('corte social')) return 0;
      return s.price;
  };

  async function book() {
    if (!svc || !brb || !time || !user || loading) return;
    setGlobalLoading(true, 'RESERVANDO SUA CADEIRA...');
    setLoading(true);

    const s = dbServices.find(x => x._id === svc);
    const dateStr = format(new Date(), 'yyyy-MM-dd') + 'T' + time + ':00.000Z'; // Parse time into today

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: svc,
          serviceName: s?.name || 'Corte',
          price: getServicePrice(svc),
          date: dateStr,
          barberId: brb
        })
      });

      if (res.ok) {
        setDone(true);
        showToast('Agendamento realizado com sucesso!', 'success');
        setTimeout(onBooked, 2200);
      } else {
        showToast('Erro ao agendar. Tente outro horário.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao servidor.', 'error');
    } finally {
      // Artificial delay for premium feel
      setTimeout(() => {
        setLoading(false);
        setGlobalLoading(false);
      }, 1500);
    }
  }


  if (done)
    return (
      <motion.div 
        className="card-luxury p-12 text-center max-w-md mx-auto border-orange-500/20"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      >
        <motion.div 
            className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white/20 shadow-[0_0_50px_var(--orange-prime)]"
            animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
        >
            <span className="text-4xl text-white">✓</span>
        </motion.div>
        <h2 className="text-4xl text-bebas font-black text-white italic uppercase mb-4 tracking-tight">RESERVADO!</h2>
        <p className="text-neutral-400 font-bold text-sm leading-relaxed">
            Seu lugar no clube está garantido para às <span className="text-orange-500 font-black">{time}</span>.
        </p>
      </motion.div>
    );

  return (
    <div className="space-y-12 w-full px-2">
      
      {/* ── Reward Active Badge ── */}
      {isBookingFreeCut && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto p-6 rounded-[2rem] bg-orange-600/10 border border-orange-500/30 flex items-center justify-between gap-6"
          >
              <div className="flex items-center gap-4">
                  <span className="text-3xl">🎁</span>
                  <div>
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Recompensa Ativa</p>
                      <p className="text-xs font-bold text-white">Seu "Corte Social" hoje é cortesia da casa!</p>
                  </div>
              </div>
              <button onClick={() => setBookingFreeCut(false)} className="text-[9px] font-black text-neutral-500 hover:text-white uppercase transition-colors">Cancelar</button>
          </motion.div>
      )}

      {/* ── Progress Journey ── */}
      <div className="flex items-center justify-center gap-4 md:gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex items-center gap-4 md:gap-6">
            <motion.div 
                className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center font-black text-xs md:text-sm border transition-colors duration-500`}
                animate={{
                    backgroundColor: step >= n ? 'var(--orange-prime)' : 'rgba(255,255,255,0.05)',
                    borderColor: step >= n ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)',
                    color: step >= n ? '#fff' : '#444',
                    scale: step === n ? 1.1 : 1,
                    boxShadow: step === n ? '0 0 30px rgba(234,88,12,0.3)' : '0 0 0px rgba(0,0,0,0)'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
                {step > n ? '✓' : `0${n}`}
            </motion.div>
            {n < 3 && (
                <div className="w-8 md:w-16 h-1 bg-neutral-900 rounded-full overflow-hidden relative">
                    <motion.div 
                        className="absolute inset-0 bg-orange-600"
                        initial={{ x: '-100%' }}
                        animate={{ x: step > n ? '0%' : '-100%' }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1 – Services Selection */}
        {step === 1 && (
          <motion.div 
            key="svc"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex overflow-x-auto gap-4 pb-6 px-1 snap-x snap-mandatory no-scrollbar"
          >
            {activeServices.map(s => {
              const price = getServicePrice(s.id);
              const isFree = isBookingFreeCut && price === 0;

              return (
                <button 
                  key={s._id} 
                  onClick={() => { setSvc(s._id); setStep(2); }}
                  className={`card-luxury flex-none w-[260px] snap-center p-5 flex flex-col items-center text-center group transition-all duration-500 ${isFree ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10'}`}
                >
                  <div className="w-14 h-14 bg-neutral-950 rounded-2xl border border-white/5 flex items-center justify-center text-4xl mb-4 shadow-inner group-hover:scale-110 transition-transform">
                    {s.icon}
                  </div>
                  <h3 className="text-xl text-bebas font-black text-white italic uppercase mb-1 group-hover:text-orange-500 transition-colors tracking-tight">
                      {s.name}
                      {isFree && <span className="block text-[10px] font-black text-orange-500 tracking-[0.2em] mt-0.5">GIFT REDEEMED</span>}
                  </h3>
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Duração: {s.duration}m</p>
                  <div className={`text-3xl font-black tracking-tighter drop-shadow-lg ${isFree ? 'text-green-500' : 'text-orange-500'}`}>
                      {isFree ? 'GRÁTIS' : `R$${s.price}`}
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Step 2 – Barber Selection */}
        {step === 2 && (
          <motion.div 
            key="brb"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="flex overflow-x-auto gap-4 pb-6 px-1 snap-x snap-mandatory no-scrollbar">
              {availableBarbers.map(b => (
                <button 
                  key={b._id} 
                  onClick={() => { setBrb(b._id); setStep(3); }}
                  className="card-luxury flex-none w-[180px] snap-center p-5 flex flex-col items-center text-center group border-white/10 active:scale-95 transition-transform"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-black border border-white/10 flex items-center justify-center text-white text-bebas font-black text-3xl shadow-2xl mb-3 relative overflow-hidden group-hover:scale-105 transition-transform">
                    {b.avatar && b.avatar.startsWith('http') ? (
                      <img src={b.avatar} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      b.avatar || b.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <h3 className="text-base text-bebas font-black text-white italic uppercase mb-0.5 tracking-tight">{b.name}</h3>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{b.specialty || 'Barbeiro'}</p>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button 
                onClick={() => setStep(1)} 
                className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-orange-500 transition-all flex items-center gap-3 border-b border-white/5 pb-2"
              >
                ← Alterar Serviço
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3 – Time Selection */}
        {step === 3 && (
          <motion.div 
            key="time"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="flex flex-col items-center gap-12"
          >
            <div className="w-full text-center">
                <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em] mb-6">Horários Disponíveis</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 w-full max-w-2xl mx-auto">
                {ALL_TIMES.map(t => {
                    const isAvailable = availableTimes.includes(t);
                    return (
                        <button 
                        key={t} 
                        disabled={!isAvailable}
                        onClick={() => setTime(t)}
                        className={`py-5 rounded-2xl text-sm font-black transition-all duration-500 border ${
                            time === t 
                            ? 'bg-orange-600 text-white border-white/40 shadow-2xl scale-110 z-10' 
                            : isAvailable 
                                ? 'bg-neutral-900 text-white border-white/10 hover:border-orange-500/50 hover:text-orange-500'
                                : 'bg-black text-neutral-800 border-transparent opacity-10 cursor-not-allowed'
                        }`}
                        >
                        {t}
                        </button>
                    );
                })}
                </div>
            </div>

            {time && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md card-luxury p-10 relative overflow-hidden border-orange-500/30 shadow-[0_0_50px_rgba(234,88,12,0.1)]"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl text-bebas">CLUB</div>
                <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.6em] mb-10">Confirmação Final</p>
                
                <div className="space-y-6 mb-12">
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Serviço</span>
                      <span className="text-3xl text-bebas font-black text-white italic uppercase tracking-tight">{activeServices.find(s => s._id === svc)?.name}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Especialista</span>
                      <span className="text-3xl text-bebas font-black text-white italic uppercase tracking-tight">{availableBarbers.find(b => b._id === brb)?.name}</span>
                  </div>
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Valor Final</span>
                      <span className={`text-5xl text-bebas font-black italic leading-none ${getServicePrice(svc) === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                          {getServicePrice(svc) === 0 ? 'GRÁTIS' : `R$ ${getServicePrice(svc).toFixed(2)}`}
                      </span>
                  </div>
                </div>
                <button onClick={book} className="btn-prime w-full py-6 text-lg tracking-[0.2em]">AGENDAR AGORA</button>
              </motion.div>
            )}
            <button 
              onClick={() => setStep(2)} 
              className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-orange-500 transition-all flex items-center gap-3 border-b border-white/5 pb-2"
            >
              ← Alterar Profissional
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
