'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import { format } from 'date-fns';

const ALL_TIMES = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

export default function BookingForm({ onBooked }: { onBooked: () => void }) {
  const { services, currentUser, isBookingFreeCut, setBookingFreeCut, setGlobalLoading, showToast, settings } = useBarbershopStore();
  const user = currentUser;

  const [step, setStep] = useState(1);
  const [svc,  setSvc]  = useState('');
  const [brb,  setBrb]  = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [time, setTime] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'app' | 'counter'>('counter');
  const [pixStep, setPixStep] = useState(false);
  const svcRef = useRef<HTMLDivElement>(null);
  const brbRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const handleMouseDown = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setDragStartX(e.pageX - ref.current.offsetLeft);
    setDragScrollLeft(ref.current.scrollLeft);
  };
  const handleMouseLeaveUp = () => {
    setIsDragging(false);
  };
  const handleMouseMove = (e: React.MouseEvent, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!isDragging || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - dragStartX) * 2;
    if (Math.abs(walk) > 10) setHasDragged(true);
    ref.current.scrollLeft = dragScrollLeft - walk;
  };

  const handleItemClick = (e: React.MouseEvent, action: () => void) => {
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

  const [dbBarbers, setDbBarbers] = useState<any[]>([]);
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);

  // 1. Generate Calendar Days (Next 14 days)
  const calendarDays = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0); // Normalize to start of day
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []); // Re-generate only if now changes (or just on mount)

  // 2. Handle Midnight Rollover and Today selection
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // If selected date is in the past, reset to today
    if (selectedDate < today) {
      setSelectedDate(today);
    }
  }, [selectedDate]);

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
    if (brb && (step === 3 || step === 4)) {
      // Fetch all busy slots for this barber
      fetch('/api/appointments')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setAllAppointments(data);
          }
        });
    }
  }, [brb, step]);

  const getAvailableTimes = (targetDate: Date = selectedDate) => {
    if (!brb || !settings) return [];
    
    const dayOfWeek = targetDate.getDay(); // 0=Sun, 1=Mon...
    const dateStr = targetDate.toLocaleDateString('en-CA');
    
    // Check for special day exception
    const special = settings.specialDays?.find((s: any) => s.date === dateStr);
    
    let open = '09:00';
    let close = '20:00';
    let isClosed = false;

    if (special) {
        isClosed = special.isClosed;
        open = special.openHour || '09:00';
        close = special.closeHour || '18:00';
    } else {
        if (dayOfWeek === 0) { // Sunday
            isClosed = settings.sundayClosed;
            open = settings.sundayOpenHour;
            close = settings.sundayCloseHour;
        } else if (dayOfWeek === 6) { // Saturday
            isClosed = settings.saturdayClosed;
            open = settings.saturdayOpenHour;
            close = settings.saturdayCloseHour;
        } else {
            open = settings.weekOpenHour;
            close = settings.weekCloseHour;
        }
    }

    if (isClosed) return [];

    const startHour = parseInt(open.split(':')[0]);
    const endHour = parseInt(close.split(':')[0]);
    const times = [];
    for (let h = startHour; h < endHour; h++) {
        times.push(`${h.toString().padStart(2, '0')}:00`);
    }
    
    const noticeHours = settings?.bookingNoticeHours ?? 1;
    const now = new Date();
    const isToday = dateStr === format(now, 'yyyy-MM-dd');
    
    // When checking availability for the calendar (not the current selection), 
    // we don't need to filter by booked times yet to keep it light, 
    // but for the selected date we definitely do.
    return times.filter(t => {
      // Filter by ALL appointments in state
      const isBooked = allAppointments.some(a => {
        const aDate = format(new Date(a.date), 'yyyy-MM-dd');
        const aTime = format(new Date(a.date), 'HH:mm');
        const aBarberId = a.barberId?._id || a.barberId;
        return aBarberId === brb && aDate === dateStr && aTime === t && a.status !== 'cancelled';
      });
      if (isBooked) return false;

      if (isToday) {
          const [hour, min] = t.split(':').map(Number);
          const timeDate = new Date();
          timeDate.setHours(hour, min, 0, 0);

          const diffMs = timeDate.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          return diffHours >= noticeHours;
      }
      return true;
    });
  };

  const availableTimes = getAvailableTimes();

  // 3. Auto-select first available day when entering Step 3
  useEffect(() => {
    if (step === 3 && brb && settings) {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const firstAvailable = calendarDays.find(d => {
        const times = getAvailableTimes(d);
        return times.length > 0;
      });
      
      if (firstAvailable && format(firstAvailable, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) {
        setSelectedDate(firstAvailable);
      }
    }
  }, [step, brb, settings, calendarDays]);

  // Logic: Only "Corte Social" is free if the reward is active
  const getServicePrice = (serviceId: string) => {
      const s = dbServices.find(x => x._id === serviceId);
      if (!s) return 0;
      if (isBookingFreeCut && s.name.toLowerCase().includes('corte social')) return 0;
      return s.price;
  };

  async function handleBookClick() {
    if (getServicePrice(svc) > 0 && paymentMethod === 'app' && !pixStep) {
      setPixStep(true);
      return;
    }
    
    // Explicitly determine status at click time to avoid state sync issues
    let finalStatus = 'pending';
    if (getServicePrice(svc) === 0) finalStatus = 'free_reward';
    else if (paymentMethod === 'app' || pixStep) finalStatus = 'paid_app';
    
    await book(finalStatus);
  }

  async function book(pStatus: string) {
    if (!svc || !brb || !time || !user || loading) return;
    setGlobalLoading(true, pStatus === 'paid_app' ? 'CONFIRMANDO PAGAMENTO...' : 'RESERVANDO SUA CADEIRA...');
    setLoading(true);

    const s = dbServices.find(x => x._id === svc);
    
    // Fix: Create date object in local time before converting to ISO to avoid timezone mismatch
    const [h, m] = time.split(':').map(Number);
    const finalDate = new Date(selectedDate);
    finalDate.setHours(h, m, 0, 0);
    const dateStr = finalDate.toISOString();

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: svc,
          serviceName: s?.name || 'Corte',
          price: getServicePrice(svc),
          date: dateStr,
          barberId: brb,
          paymentStatus: pStatus,
          totalAmount: getServicePrice(svc)
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
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(234, 88, 12, 0.3);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 88, 12, 0.8);
        }
      `}</style>
      
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
        {[1, 2, 3, 4].map((n) => (
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
            {n < 4 && (
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
          <div className="relative group/carousel">
            <motion.div 
              ref={svcRef}
              key="svc"
              onMouseDown={(e) => handleMouseDown(e, svcRef)}
              onMouseLeave={handleMouseLeaveUp}
              onMouseUp={handleMouseLeaveUp}
              onMouseMove={(e) => handleMouseMove(e, svcRef)}
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className={`flex overflow-x-auto gap-4 pb-8 pt-4 px-4 custom-scroll flex-nowrap items-stretch transition-all duration-300 ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}`}
            >
            {activeServices.map(s => {
              const price = getServicePrice(s.id);
              const isFree = isBookingFreeCut && price === 0;

              return (
                <button 
                  key={s._id} 
                  onClick={(e) => handleItemClick(e, () => { setSvc(s._id); setStep(2); })}
                  className={`card-luxury flex-none w-[240px] md:w-[280px] snap-center p-6 flex flex-col items-center text-center group transition-all duration-300 shrink-0 ${isFree ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/10'}`}
                >
                  <div className="w-14 h-14 bg-neutral-950 rounded-2xl border border-white/5 flex items-center justify-center text-3xl mb-4 shadow-inner group-hover:scale-110 transition-transform">
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
          </div>
        )}

        {/* Step 2 – Barber Selection */}
        {step === 2 && (
          <motion.div 
            key="brb"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <div className="relative group/carousel">
                <div 
                  ref={brbRef} 
                  onMouseDown={(e) => handleMouseDown(e, brbRef)}
                  onMouseLeave={handleMouseLeaveUp}
                  onMouseUp={handleMouseLeaveUp}
                  onMouseMove={(e) => handleMouseMove(e, brbRef)}
                  className={`flex overflow-x-auto gap-4 pb-8 pt-4 px-4 custom-scroll flex-nowrap items-stretch transition-all duration-300 ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}`}
                >
              {availableBarbers.map(b => (
                <button 
                  key={b._id} 
                  onClick={(e) => handleItemClick(e, () => { setBrb(b._id); setStep(3); })}
                  className="card-luxury flex-none w-[160px] md:w-[200px] snap-center p-6 flex flex-col items-center text-center group border-white/10 active:scale-95 transition-all shrink-0"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-black border border-white/10 flex items-center justify-center text-white text-bebas font-black text-3xl shadow-2xl mb-3 relative overflow-hidden group-hover:scale-105 transition-transform">
                    {b.avatar && (b.avatar.startsWith('http') || b.avatar.startsWith('data:image')) ? (
                      <img src={b.avatar} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      b.name.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <h3 className="text-lg text-bebas font-black text-white italic uppercase mb-0.5 tracking-tight">{b.name}</h3>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest">{b.specialty || 'Barbeiro'}</p>
                </button>
              ))}
                </div>
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

         {/* Step 3 – Date Selection */}
         {step === 3 && (
           <motion.div 
             ref={dateRef}
             key="date"
             onMouseDown={(e) => handleMouseDown(e, dateRef)}
             onMouseLeave={handleMouseLeaveUp}
             onMouseUp={handleMouseLeaveUp}
             onMouseMove={(e) => handleMouseMove(e, dateRef)}
             initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
             className={`flex overflow-x-auto gap-4 pb-8 pt-4 px-4 custom-scroll flex-nowrap items-center w-full transition-all duration-300 ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab snap-x snap-mandatory'}`}
           >
               {calendarDays.map((d, i) => {
                   const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                   const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                   const dayNum = d.getDate();
                   const monthName = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
                   
                   // Check if closed or has no times
                   const timesFromSchedule = []; // Just working hours
                   const dayOfWeek = d.getDay();
                   const dateStr = format(d, 'yyyy-MM-dd');
                   const special = settings?.specialDays?.find((s: any) => s.date === dateStr);
                   let isClosedBySchedule = false;
                   if (special) isClosedBySchedule = special.isClosed;
                   else if (dayOfWeek === 0) isClosedBySchedule = settings?.sundayClosed;
                   else if (dayOfWeek === 6) isClosedBySchedule = settings?.saturdayClosed;

                   const availableTimes = getAvailableTimes(d);
                   const isFullyBooked = !isClosedBySchedule && availableTimes.length === 0;
                   const showAsClosed = isClosedBySchedule || (format(new Date(), 'yyyy-MM-dd') === dateStr && availableTimes.length === 0 && !isFullyBooked);

                   return (
                       <button 
                           key={i}
                           disabled={showAsClosed || isFullyBooked}
                           onClick={(e) => handleItemClick(e, () => { setSelectedDate(d); setStep(4); })}
                           className={`flex-none w-24 h-32 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 snap-center relative ${
                               isSelected 
                               ? 'bg-orange-600 border-white/40 shadow-2xl scale-110 z-10' 
                               : (showAsClosed || isFullyBooked)
                               ? 'bg-neutral-950 border-white/5 opacity-40 grayscale cursor-not-allowed'
                               : 'bg-neutral-900 border-white/5 hover:border-orange-500/50'
                           }`}
                       >
                           {showAsClosed && <span className="absolute top-2 text-[7px] font-black text-red-500 uppercase tracking-widest">Fechado</span>}
                           {isFullyBooked && !showAsClosed && <span className="absolute top-2 text-[7px] font-black text-orange-500 uppercase tracking-widest">Lotado</span>}
                           <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-white' : 'text-neutral-500'}`}>{dayName}</span>
                           <span className="text-3xl font-bebas font-black text-white">{dayNum}</span>
                           <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white/70' : 'text-neutral-600'}`}>{monthName}</span>
                       </button>
                   );
               })}
           </motion.div>
         )}

         {step === 3 && (
            <div className="flex justify-center mt-4">
                <button 
                onClick={() => setStep(2)} 
                className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-orange-500 transition-all flex items-center gap-3 border-b border-white/5 pb-2"
                >
                ← Alterar Profissional
                </button>
            </div>
         )}

        {/* Step 4 – Time Selection */}
        {step === 4 && (
          <motion.div 
            key="time"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            className="flex flex-col items-center gap-12"
          >
            <div className="w-full text-center">
                <p className="text-[11px] font-black text-orange-500 uppercase tracking-[0.4em] mb-6">Horários Disponíveis</p>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 w-full max-w-2xl mx-auto">
                {availableTimes.map(t => {
                    return (
                        <button 
                        key={t} 
                        onClick={() => setTime(t)}
                        className={`py-5 rounded-2xl text-sm font-black transition-all duration-500 border ${
                            time === t 
                            ? 'bg-orange-600 text-white border-white/40 shadow-2xl scale-110 z-10' 
                            : 'bg-neutral-900 text-white border-white/10 hover:border-orange-500/50 hover:text-orange-500'
                        }`}
                        >
                        {t}
                        </button>
                    );
                })}
                {availableTimes.length === 0 && (
                    <div className="col-span-full py-12 opacity-40">
                        <p className="text-sm font-bold text-neutral-500">Não há horários disponíveis para esta data.</p>
                    </div>
                )}
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
                  {!pixStep ? (
                    <>
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
                      {getServicePrice(svc) > 0 && (
                          <div className="pt-6 border-t border-white/10">
                              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3 text-center">Como deseja pagar?</p>
                              <div className="flex gap-3">
                                  <button 
                                    onClick={() => setPaymentMethod('app')}
                                    className={`flex-1 py-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'app' ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-white/5 border-white/10 text-neutral-400'}`}
                                  >
                                      PIX (Agora)
                                  </button>
                                  <button 
                                    onClick={() => setPaymentMethod('counter')}
                                    className={`flex-1 py-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'counter' ? 'bg-orange-600 border-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]' : 'bg-white/5 border-white/10 text-neutral-400'}`}
                                  >
                                      No Balcão
                                  </button>
                              </div>
                          </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-48 h-48 mx-auto bg-white rounded-2xl p-2 flex items-center justify-center">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266554400005204000053039865802BR5913GIGANTES CORTE6009SAO PAULO62070503***63041234" alt="QR Code PIX" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Pagamento via PIX</p>
                            <p className="text-3xl text-bebas font-black text-orange-500 italic">R$ {getServicePrice(svc).toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-neutral-400 font-bold leading-relaxed px-4">
                            Abra o app do seu banco, escolha "PIX Copia e Cola" ou escaneie o QR Code acima.
                        </p>
                    </div>
                  )}
                </div>
                <button onClick={handleBookClick} className={`btn-prime w-full py-6 text-lg tracking-[0.2em] ${pixStep ? 'bg-[#25D366] hover:bg-[#1EBE5D] text-white border-[#25D366] shadow-[0_0_20px_rgba(37,211,102,0.4)]' : ''}`}>
                    {pixStep ? 'SIMULAR PAGAMENTO APROVADO' : (paymentMethod === 'app' && getServicePrice(svc) > 0 ? 'PAGAR COM PIX' : 'AGENDAR AGORA')}
                </button>
              </motion.div>
            )}
            <button 
               onClick={() => {
                 if (pixStep) { setPixStep(false); return; }
                 setStep(3);
               }} 
               className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-orange-500 transition-all flex items-center gap-3 border-b border-white/5 pb-2"
             >
               ← {pixStep ? 'Voltar' : 'Alterar Data'}
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
