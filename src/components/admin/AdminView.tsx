'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import FinancialDashboard from './FinancialDashboard';
import AppointmentControl from './AppointmentControl';
import ServiceManager from './ServiceManager';
import BarberManager from './BarberManager';
import ProductManager from './ProductManager';
import SystemSettings from './SystemSettings';

const ADMIN_TABS = [
  { id: 'appointments', icon: '✂️', label: 'Agenda Geral' },
  { id: 'barbers',      icon: '👥', label: 'Equipe' },
  { id: 'products',     icon: '📦', label: 'Inventário' },
  { id: 'financial',    icon: '📊', label: 'Financeiro' },
  { id: 'settings',     icon: '⚙️', label: 'Configurações' },
] as const;

type AdminTab = typeof ADMIN_TABS[number]['id'];

export default function AdminView() {
  const [tab, setTab] = useState<AdminTab>('appointments');
  const [isOpen, setIsOpen] = useState(false);
  const { toggleAdminMode, notifications, markNotificationsRead, logout, currentUser } = useBarbershopStore();
  const [showNotifs, setShowNotifs] = useState(false);

  // Absolute Security Guard - Role-based protection
  if (currentUser?.role !== 'admin') return null;

  const adminNotifs = notifications.filter(n => !n.userId);
  const unreadCount = adminNotifs.filter(n => !n.read).length;

  const NavContent = () => (
    <div className="h-full flex flex-col justify-between py-10 px-6">
        <div>
            <div className="flex flex-col items-center mb-12">
                <div className="relative w-32 h-24 mb-2">
                    <Image 
                        src="/logo.png" 
                        alt="Logo" 
                        width={128}
                        height={96}
                        priority
                        className="w-full h-full object-contain"
                    />
                </div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] text-center">Admin Control</p>
            </div>

            <nav className="space-y-1">
                {ADMIN_TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setTab(t.id); setIsOpen(false); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                            tab === t.id ? 'bg-orange-600 text-white shadow-lg' : 'text-neutral-500 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t.label}</span>
                    </button>
                ))}
            </nav>
        </div>

        <div className="pt-6 mt-auto border-t border-white/5">
            <div className="flex gap-2 mb-6">
                <button 
                    onClick={toggleAdminMode}
                    title="Mudar para Cliente"
                    className="flex-1 flex items-center justify-center p-3 rounded-xl bg-white/5 text-orange-500 hover:bg-orange-500/10 transition-all text-lg"
                >
                    👤
                </button>
                <button 
                    onClick={() => signOut()}
                    title="Sair do Sistema"
                    className="flex-1 flex items-center justify-center p-3 rounded-xl bg-white/5 text-red-500 hover:bg-red-500/10 transition-all text-lg"
                >
                    🚪
                </button>
            </div>
            <p className="text-[8px] font-black text-neutral-800 uppercase tracking-[0.5em] text-center italic">Gigantes do Corte © 2026</p>
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050505] text-white -m-4 md:-m-10 relative overflow-hidden">
      
      {/* ── Lateral Sidebar (Desktop) ── */}
      <aside className="hidden lg:block w-[300px] bg-[#050505] border-r border-white/5 sticky top-0 h-screen">
          <NavContent />
      </aside>

      {/* ── Mobile Hamburger Menu ── */}
      <AnimatePresence>
        {isOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/90 z-[200] lg:hidden"
                />
                <motion.aside 
                    initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-[#050505] z-[201] lg:hidden border-r border-white/10"
                >
                    <NavContent />
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-8 right-8 text-2xl text-neutral-500"
                    >
                        ✕
                    </button>
                </motion.aside>
            </>
        )}
      </AnimatePresence>

      {/* ── Main Stage ── */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar relative">
        
        <header className="sticky top-0 z-50 p-4 pt-12 md:p-6 md:pt-16 flex justify-between items-center bg-[#050505] border-b border-white/5">
            <button 
                onClick={() => setIsOpen(true)}
                className="w-12 h-12 flex flex-col items-center justify-center gap-1.5 glass-panel rounded-xl border-white/10 lg:hidden"
            >
                <div className="w-6 h-0.5 bg-white rounded-full" />
                <div className="w-6 h-0.5 bg-orange-500 rounded-full" />
                <div className="w-6 h-0.5 bg-white rounded-full" />
            </button>

            {/* Centered Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex items-center justify-center">
                <div className="relative w-32 h-16 md:w-40 md:h-20">
                    <Image 
                        src="/logo.png" 
                        alt="Logo" 
                        fill
                        className="object-contain"
                    />
                </div>
            </div>

            <div className="relative ml-auto">
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
                                className="absolute top-16 right-0 w-[280px] md:w-[450px] bg-[#0c0c0c] rounded-[2rem] p-6 z-[300] border border-orange-500/40 shadow-[0_40px_80px_rgba(0,0,0,1)]"
                            >
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-6">Notificações</h4>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {adminNotifs.length === 0 ? (
                                        <p className="text-center py-10 text-neutral-600 text-xs italic">Sem alertas.</p>
                                    ) : (
                                        adminNotifs.map(n => (
                                            <div key={n.id} className={`p-5 rounded-2xl border ${n.type === 'reward' ? 'bg-orange-600/20 border-orange-500/40' : 'bg-white/5 border-white/10'}`}>
                                                <p className="text-sm font-bold text-white leading-relaxed">{n.message}</p>
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
        <div className="p-6 pb-24">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="mb-10 lg:hidden">
                        <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">Painel Administrativo</p>
                        <h2 className="text-4xl text-bebas font-black italic text-white uppercase tracking-tight">
                            {ADMIN_TABS.find(t => t.id === tab)?.label}
                        </h2>
                    </div>
                    {tab === 'financial'    && <FinancialDashboard />}
                    {tab === 'appointments' && <AppointmentControl />}
                    {tab === 'barbers'      && <BarberManager />}
                    {tab === 'products'     && <ProductManager />}
                    {tab === 'settings'     && <SystemSettings />}
                </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
