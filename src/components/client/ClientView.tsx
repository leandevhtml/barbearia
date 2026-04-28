'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import { signOut } from 'next-auth/react';
import BookingForm from './BookingForm';
import LoyaltyCard from './LoyaltyCard';
import AppointmentStatus from './AppointmentStatus';
import QuickInfo from './QuickInfo';

const TABS = [
  { id: 'book',   icon: '📅', label: 'Agendar' },
  { id: 'status', icon: '⚡', label: 'Status' },
  { id: 'loyalty',icon: '💎', label: 'Fidelidade' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ClientView() {
  const { toggleAdminMode, currentUser, logout, notifications, markNotificationsRead, activeTab, setActiveTab, syncUser, settings } = useBarbershopStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sync data periodically when view is active
  useEffect(() => {
    const interval = setInterval(syncUser, 3000); // Sync every 3s
    return () => clearInterval(interval);
  }, [syncUser]);

  const currentId = (currentUser?._id || currentUser?.id || '').toString();
  const userNotifs = notifications.filter(n => n.userId?.toString() === currentId);
  const unreadCount = userNotifs.filter(n => !n.read).length;

  if (!currentUser) return null;

  const NavContent = () => (
    <div className="h-full flex flex-col justify-between py-10 px-6">
        <div>
            {/* Identity & Logo */}
            <div className="flex flex-col items-center mb-12">
                <div className="relative w-28 h-20 mb-4">
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest leading-none mb-1">Membro Elite</p>
                    <p className="text-xl text-bebas font-black text-white italic uppercase leading-none">{currentUser.name}</p>
                </div>
            </div>

            <nav className="space-y-4">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setActiveTab(t.id); setIsMenuOpen(false); }}
                        className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all duration-500 ${
                            activeTab === t.id ? 'bg-orange-600 text-white shadow-[0_0_30px_var(--orange-glow)]' : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <span className="text-2xl">{t.icon}</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{t.label}</span>
                    </button>
                ))}
            </nav>
        </div>

        <div className="space-y-6">
            <div className="space-y-2">
                {currentUser.email === 'admin@gigantes.com' && (
                    <button 
                        onClick={toggleAdminMode}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl text-orange-500 hover:bg-orange-500/10 transition-all"
                    >
                        <span className="text-xl">⚙️</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Painel Admin</span>
                    </button>
                )}
                <button 
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all"
                >
                    <span className="text-xl">✕</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Encerrar Sessão</span>
                </button>
            </div>

            <div className="pt-8 border-t border-white/5 text-center">
                <p className="text-[8px] font-black text-neutral-800 uppercase tracking-[0.5em]">Gigantes do Corte © 2026</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] -m-4 md:-m-10 relative">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:block w-[320px] bg-[#050505] border-r border-white/5 sticky top-0 h-screen">
          <NavContent />
      </aside>

      {/* ── Mobile Hamburger Menu ── */}
      <AnimatePresence>
        {isMenuOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsMenuOpen(false)}
                    className="fixed inset-0 bg-black/95 z-[500] lg:hidden"
                />
                <motion.aside 
                    initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#050505] z-[501] lg:hidden border-r border-white/10"
                >
                    <NavContent />
                    <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8 text-2xl text-neutral-500">✕</button>
                </motion.aside>
            </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar relative pt-24 lg:pt-0">
        
        {/* Mobile Header */}
        <header className="fixed lg:hidden top-0 left-0 right-0 z-[100] p-4 pt-12 md:p-6 md:pt-16 flex justify-between items-center bg-[#050505] border-b border-white/5">
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="w-12 h-12 flex flex-col items-center justify-center gap-1.5 glass-panel rounded-xl border-white/10"
            >
                <div className="w-6 h-0.5 bg-white rounded-full" />
                <div className="w-6 h-0.5 bg-orange-500 rounded-full" />
                <div className="w-6 h-0.5 bg-white rounded-full" />
            </button>

            {/* Centered Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center justify-center">
                <div className="relative w-32 h-16">
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            <div className="relative">
                <motion.button
                    onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markNotificationsRead(); }}
                    className="w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-xl relative border-white/10"
                    animate={unreadCount > 0 ? {
                        rotate: [0, -10, 10, -10, 10, 0],
                        transition: { repeat: Infinity, duration: 0.5, repeatDelay: 2 }
                    } : {}}
                >
                    🔔
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-[#050505] shadow-[0_0_10px_var(--orange-glow)]">
                            {unreadCount}
                        </span>
                    )}
                </motion.button>

                <AnimatePresence>
                    {showNotifs && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setShowNotifs(false)}
                                className="fixed inset-0 z-[290] bg-black/20 backdrop-blur-[2px]"
                            />
                            <motion.div 
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                className="absolute top-16 right-0 w-[290px] md:w-[380px] bg-[#0c0c0c] rounded-[2rem] p-6 z-[300] border border-orange-500/40 shadow-[0_40px_80px_rgba(0,0,0,1)]"
                            >
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-6">Novidades</h4>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {userNotifs.length === 0 ? (
                                        <p className="text-center py-10 text-neutral-600 text-xs italic">Sem mensagens novas.</p>
                                    ) : (
                                        userNotifs.map(n => (
                                            <div key={n.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                                                {n.title && <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{n.title}</p>}
                                                <p className="text-xs font-bold text-white leading-relaxed">{n.message}</p>
                                                <p className="text-[9px] font-mono text-neutral-600 mt-2">{n.timestamp}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </header>

        {/* Content Section */}
        <div className="p-6 pb-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-10 lg:hidden text-center">
                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">Elite Club</p>
                        <h2 className="text-4xl text-bebas font-black italic text-white uppercase tracking-tight">
                            {TABS.find(t => t.id === activeTab)?.label}
                        </h2>
                    </div>
                    {activeTab === 'book'    && (
                        <div className="space-y-12">
                            <BookingForm onBooked={() => setActiveTab('status')} />
                            <QuickInfo />
                        </div>
                    )}
                    {activeTab === 'loyalty' && <LoyaltyCard />}
                    {activeTab === 'status'  && <AppointmentStatus />}
                </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
