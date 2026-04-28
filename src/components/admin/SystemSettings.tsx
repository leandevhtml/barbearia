'use client';

import { useState, useEffect } from 'react';
import BarberLoading from '@/components/shared/BarberLoading';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import ServiceManager from './ServiceManager';

export default function SystemSettings() {
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'servicos' | 'recados'>('geral');
  const [fidelityEnabled, setFidelityEnabled] = useState(true);
  const [stampsPerReward, setStampsPerReward] = useState(10);
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementImage, setAnnouncementImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setFidelityEnabled(data.fidelityEnabled);
        setStampsPerReward(data.stampsPerReward);
        setAnnouncementEnabled(data.announcementEnabled || false);
        setAnnouncementText(data.announcementText || '');
        setAnnouncementImage(data.announcementImage || '');
        setLoading(false);
      });
  }, []);

  const { syncUser } = useBarbershopStore();

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fidelityEnabled, 
          stampsPerReward,
          announcementEnabled,
          announcementText,
          announcementImage
        })
      });
      await syncUser();
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <BarberLoading message="CARREGANDO CONFIGURAÇÕES..." />;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <h2 className="text-white font-bold text-xl tracking-tight">Configurações</h2>
        
        <div className="flex bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            <button 
                onClick={() => setActiveSubTab('geral')}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'geral' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Fidelidade
            </button>
            <button 
                onClick={() => setActiveSubTab('recados')}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'recados' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Recados / Pop-up
            </button>
            <button 
                onClick={() => setActiveSubTab('servicos')}
                className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'servicos' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Serviços
            </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'geral' && (
          <motion.div 
            key="geral"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <motion.div 
                className="luxury-card p-10 border border-white/5 space-y-10 max-w-2xl"
            >
                {/* Fidelity Toggle */}
                <div className="flex items-center justify-between gap-12">
                <div className="flex-1">
                    <h4 className="text-xl font-bold text-white tracking-tight">Sistema de Fidelidade</h4>
                    <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Habilite ou desabilite o acúmulo de selos e prêmios para os clientes em tempo real.</p>
                </div>
                <button
                    onClick={() => setFidelityEnabled(!fidelityEnabled)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-700 flex items-center px-1 border ${
                        fidelityEnabled ? 'bg-orange-600 border-orange-400/50 shadow-[0_0_25px_rgba(255,110,0,0.3)]' : 'bg-white/5 border-white/10'
                    }`}
                >
                    <motion.div
                        className="w-6 h-6 rounded-full bg-white shadow-2xl"
                        animate={{ x: fidelityEnabled ? 24 : 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                </button>
                </div>

                {/* Stamps Amount */}
                <div className={`transition-all duration-700 ${fidelityEnabled ? 'opacity-100 scale-100' : 'opacity-20 scale-[0.98] pointer-events-none'}`}>
                <div className="flex items-center justify-between gap-12">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-white tracking-tight">Selos para Recompensa</h4>
                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Defina quantos cortes o cliente deve realizar para desbloquear o prêmio grátis.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-950 p-2 rounded-2xl border border-white/5 shadow-inner">
                        <button onClick={() => setStampsPerReward(Math.max(1, stampsPerReward - 1))} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">-</button>
                        <span className="text-3xl font-bebas text-orange-500 w-14 text-center tracking-tighter">{stampsPerReward}</span>
                        <button onClick={() => setStampsPerReward(stampsPerReward + 1)} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors">+</button>
                    </div>
                </div>
                </div>

                <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-prime w-full py-5 text-xs font-black uppercase tracking-[0.3em] disabled:opacity-50 mt-4"
                >
                {saving ? 'PROCESSANDO...' : 'SALVAR CONFIGURAÇÕES'}
                </button>
            </motion.div>

            <div className="glass p-6 rounded-2xl border border-orange-500/10 max-w-2xl">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Informação Importante</p>
                <p className="text-xs text-neutral-500">
                    Ao desativar a fidelidade, os clientes atuais manterão seus selos, mas não acumularão novos selos ao finalizar cortes até que a opção seja reativada.
                </p>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'recados' && (
          <motion.div 
            key="recados"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <motion.div 
                className="luxury-card p-10 border border-white/5 space-y-10 max-w-2xl"
            >
                {/* Announcement Toggle */}
                <div className="flex items-center justify-between gap-12">
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-white tracking-tight">Pop-up de Recado</h4>
                        <p className="text-xs text-neutral-500 mt-2 leading-relaxed">Ative um aviso global que aparecerá para todos os clientes ao abrirem o aplicativo.</p>
                    </div>
                    <button
                        onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-700 flex items-center px-1 border ${
                            announcementEnabled ? 'bg-orange-600 border-orange-400/50 shadow-[0_0_25px_rgba(255,110,0,0.3)]' : 'bg-white/5 border-white/10'
                        }`}
                    >
                        <motion.div
                            className="w-6 h-6 rounded-full bg-white shadow-2xl"
                            animate={{ x: announcementEnabled ? 24 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </button>
                </div>

                {/* Announcement Content */}
                <div className={`space-y-6 transition-all duration-700 ${announcementEnabled ? 'opacity-100 scale-100' : 'opacity-20 scale-[0.98] pointer-events-none'}`}>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Texto do Recado</label>
                        <textarea 
                            value={announcementText}
                            onChange={(e) => setAnnouncementText(e.target.value)}
                            rows={3}
                            className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm leading-relaxed"
                            placeholder="Ex: Estamos com uma promoção especial de Páscoa!"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">URL da Imagem (Opcional)</label>
                        <input 
                            type="text" 
                            value={announcementImage}
                            onChange={(e) => setAnnouncementImage(e.target.value)}
                            className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                            placeholder="https://exemplo.com/imagem.jpg"
                        />
                    </div>
                </div>

                <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-prime w-full py-5 text-xs font-black uppercase tracking-[0.3em] disabled:opacity-50 mt-4"
                >
                {saving ? 'PROCESSANDO...' : 'SALVAR RECADOS'}
                </button>
            </motion.div>

            {announcementEnabled && (
                <div className="glass p-6 rounded-2xl border border-orange-500/10 max-w-2xl">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Visualização</p>
                    <div className="bg-[#050505] p-4 rounded-xl border border-white/5 flex items-center gap-4">
                        {announcementImage && <img src={announcementImage} className="w-12 h-12 rounded-lg object-cover" alt="Preview" />}
                        <p className="text-xs text-white line-clamp-2">{announcementText || 'Sem texto definido...'}</p>
                    </div>
                </div>
            )}
          </motion.div>
        )}

        {activeSubTab === 'servicos' && (
          <motion.div 
            key="servicos"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
          >
            <ServiceManager />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
