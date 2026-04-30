'use client';

import { useState, useEffect } from 'react';
import BarberLoading from '@/components/shared/BarberLoading';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import ServiceManager from './ServiceManager';

export default function SystemSettings() {
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'regras' | 'servicos' | 'recados' | 'estabelecimento' | 'pagamentos'>('geral');
  const [fidelityEnabled, setFidelityEnabled] = useState(true);
  const [stampsPerReward, setStampsPerReward] = useState(10);
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementImage, setAnnouncementImage] = useState('');
  
  // New settings
  const [barbershopAddress, setBarbershopAddress] = useState('');
  const [supportPhone, setSupportPhone] = useState('5511999999999');
  const [weekOpenHour, setWeekOpenHour] = useState('09:00');
  const [weekCloseHour, setWeekCloseHour] = useState('20:00');
  const [saturdayOpenHour, setSaturdayOpenHour] = useState('09:00');
  const [saturdayCloseHour, setSaturdayCloseHour] = useState('18:00');
  const [saturdayClosed, setSaturdayClosed] = useState(false);
  const [sundayOpenHour, setSundayOpenHour] = useState('09:00');
  const [sundayCloseHour, setSundayCloseHour] = useState('14:00');
  const [sundayClosed, setSundayClosed] = useState(true);
  const [delayTolerance, setDelayTolerance] = useState(15);
  const [cancelNoticeHours, setCancelNoticeHours] = useState(2);
  const [bookingNoticeHours, setBookingNoticeHours] = useState(1);
  const [specialDays, setSpecialDays] = useState<any[]>([]);
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialClosed, setNewSpecialClosed] = useState(true);
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  
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
        setBarbershopAddress(data.barbershopAddress || '');
        setSupportPhone(data.supportPhone || '5511999999999');
        setWeekOpenHour(data.weekOpenHour || '09:00');
        setWeekCloseHour(data.weekCloseHour || '20:00');
        setSaturdayOpenHour(data.saturdayOpenHour || '09:00');
        setSaturdayCloseHour(data.saturdayCloseHour || '18:00');
        setSaturdayClosed(data.saturdayClosed || false);
        setSundayOpenHour(data.sundayOpenHour || '09:00');
        setSundayCloseHour(data.sundayCloseHour || '14:00');
        setSundayClosed(data.sundayClosed || false);
        setDelayTolerance(data.delayTolerance ?? 15);
        setCancelNoticeHours(data.cancelNoticeHours ?? 2);
        setBookingNoticeHours(data.bookingNoticeHours ?? 1);
        setSpecialDays(data.specialDays || []);
        setMpAccessToken(data.mpAccessToken || '');
        setMpPublicKey(data.mpPublicKey || '');
        setLoading(false);
      });
  }, []);

  const { syncUser, showToast } = useBarbershopStore();

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
          announcementImage,
          barbershopAddress,
          supportPhone,
          weekOpenHour,
          weekCloseHour,
          saturdayOpenHour,
          saturdayCloseHour,
          saturdayClosed,
          sundayOpenHour,
          sundayCloseHour,
          sundayClosed,
          delayTolerance,
          cancelNoticeHours,
          bookingNoticeHours,
          specialDays,
          mpAccessToken,
          mpPublicKey
        })
      });
      await syncUser();
      showToast('Configurações salvas com sucesso!', 'success');
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
        <h2 className="hidden md:block text-white font-bold text-xl tracking-tight">Configurações</h2>
        
        <div className="flex flex-nowrap bg-neutral-900/80 p-1.5 rounded-2xl border border-white/5 shadow-inner overflow-x-auto no-scrollbar w-full gap-1">
            <button 
                onClick={() => setActiveSubTab('geral')}
                className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'geral' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Fidelidade
            </button>
            <button 
                onClick={() => setActiveSubTab('regras')}
                className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'regras' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Regras
            </button>
            <button 
                onClick={() => setActiveSubTab('recados')}
                className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'recados' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Recados
            </button>
            <button 
                onClick={() => setActiveSubTab('estabelecimento')}
                className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'estabelecimento' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Estabelecimento
            </button>
            <button 
                onClick={() => setActiveSubTab('servicos')}
                className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'servicos' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Serviços
            </button>
            <button 
                onClick={() => setActiveSubTab('pagamentos')}
                className={`shrink-0 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeSubTab === 'pagamentos' ? 'bg-orange-600 text-white shadow-[0_0_20px_var(--orange-glow)]' : 'text-neutral-500 hover:text-white'}`}
            >
                Pagamentos
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

            {/* Danger Zone */}
            <div className="mt-20 pt-10 border-t border-red-500/10 max-w-2xl">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-6">Zona de Perigo</h4>
                <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1">
                        <p className="text-white font-bold text-sm mb-1">Resetar Banco de Dados</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Isso apagará agendamentos, clientes e transações de teste.</p>
                    </div>
                    <button 
                        onClick={async () => {
                            if (confirm('TEM CERTEZA? Isso apagará TODOS os dados de teste (exceto administradores).')) {
                                try {
                                    const res = await fetch('/api/admin/system/reset-db', { method: 'POST' });
                                    if (res.ok) {
                                        alert('Banco de dados resetado com sucesso!');
                                        window.location.reload();
                                    } else {
                                        alert('Erro ao resetar banco. Verifique as permissões.');
                                    }
                                } catch (e) {
                                    alert('Erro na conexão com o servidor.');
                                }
                            }
                        }}
                        className="px-8 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap"
                    >
                        Resetar Agora
                    </button>
                </div>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'regras' && (
          <motion.div 
            key="regras"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <motion.div 
                className="luxury-card p-10 border border-white/5 space-y-10 max-w-2xl"
            >
                <div>
                    <h4 className="text-xl font-bold text-white tracking-tight mb-2">Regras de Agendamento</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-8">Defina as políticas de marcação e cancelamento para manter a agenda organizada.</p>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between gap-8 bg-neutral-900/50 p-5 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold text-white mb-1">Tolerância de Atraso (minutos)</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Tempo de espera pelo cliente</p>
                            </div>
                            <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-white/5">
                                <button onClick={() => setDelayTolerance(Math.max(0, delayTolerance - 5))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">-</button>
                                <span className="w-10 text-center font-bebas text-xl text-orange-500">{delayTolerance}</span>
                                <button onClick={() => setDelayTolerance(delayTolerance + 5)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">+</button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-8 bg-neutral-900/50 p-5 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold text-white mb-1">Antecedência p/ Agendar (horas)</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Tempo mínimo de reserva</p>
                            </div>
                            <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-white/5">
                                <button onClick={() => setBookingNoticeHours(Math.max(0, bookingNoticeHours - 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">-</button>
                                <span className="w-10 text-center font-bebas text-xl text-orange-500">{bookingNoticeHours}</span>
                                <button onClick={() => setBookingNoticeHours(bookingNoticeHours + 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">+</button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-8 bg-neutral-900/50 p-5 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-sm font-bold text-white mb-1">Antecedência p/ Cancelar (horas)</p>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Bloqueio no app do cliente</p>
                            </div>
                            <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-xl border border-white/5">
                                <button onClick={() => setCancelNoticeHours(Math.max(0, cancelNoticeHours - 1))} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">-</button>
                                <span className="w-10 text-center font-bebas text-xl text-orange-500">{cancelNoticeHours}</span>
                                <button onClick={() => setCancelNoticeHours(cancelNoticeHours + 1)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-prime w-full py-5 text-xs font-black uppercase tracking-[0.3em] disabled:opacity-50 mt-4"
                >
                    {saving ? 'PROCESSANDO...' : 'SALVAR REGRAS'}
                </button>
            </motion.div>
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

            <div className="glass p-6 rounded-2xl border border-orange-500/10 max-w-2xl">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Informação Importante</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                    Ao ativar o Pop-up de Recado, essa mensagem saltará na tela de todos os clientes assim que eles abrirem o aplicativo. É uma ferramenta perfeita para avisar sobre horários de fim de ano, informar promoções relâmpago ou dar boas-vindas!
                </p>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'estabelecimento' && (
          <motion.div 
            key="estabelecimento"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <motion.div 
                className="luxury-card p-10 border border-white/5 space-y-10 max-w-2xl"
            >
                <div className="space-y-2">
                    <h4 className="text-xl font-bold text-white tracking-tight mb-6">Endereço e Horários</h4>
                    
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Endereço da Barbearia</label>
                                <input 
                                    type="text" 
                                    value={barbershopAddress}
                                    onChange={(e) => setBarbershopAddress(e.target.value)}
                                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                    placeholder="Rua, Número - Bairro"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">WhatsApp (Apenas Números)</label>
                                <input 
                                    type="text" 
                                    value={supportPhone}
                                    onChange={(e) => setSupportPhone(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-[#25D366] transition-colors text-sm"
                                    placeholder="5511999999999"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Weekdays */}
                            <div className="p-4 bg-neutral-900 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-bold text-white">Segunda a Sexta</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Abre</label>
                                        <input type="time" value={weekOpenHour} onChange={(e) => setWeekOpenHour(e.target.value)}
                                            className="w-full bg-neutral-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Fecha</label>
                                        <input type="time" value={weekCloseHour} onChange={(e) => setWeekCloseHour(e.target.value)}
                                            className="w-full bg-neutral-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* Saturday */}
                            <div className="p-4 bg-neutral-900 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-bold text-white">Sábado</h5>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={saturdayClosed} onChange={(e) => setSaturdayClosed(e.target.checked)} className="accent-orange-500 w-4 h-4 rounded" />
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Fechado</span>
                                    </label>
                                </div>
                                {!saturdayClosed && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Abre</label>
                                            <input type="time" value={saturdayOpenHour} onChange={(e) => setSaturdayOpenHour(e.target.value)}
                                                className="w-full bg-neutral-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Fecha</label>
                                            <input type="time" value={saturdayCloseHour} onChange={(e) => setSaturdayCloseHour(e.target.value)}
                                                className="w-full bg-neutral-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sunday */}
                            <div className="p-4 bg-neutral-900 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-bold text-white">Domingo</h5>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={sundayClosed} onChange={(e) => setSundayClosed(e.target.checked)} className="accent-orange-500 w-4 h-4 rounded" />
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Fechado</span>
                                    </label>
                                </div>
                                {!sundayClosed && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Abre</label>
                                            <input type="time" value={sundayOpenHour} onChange={(e) => setSundayOpenHour(e.target.value)}
                                                className="w-full bg-neutral-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Fecha</label>
                                            <input type="time" value={sundayCloseHour} onChange={(e) => setSundayCloseHour(e.target.value)}
                                                className="w-full bg-neutral-950 border border-white/5 rounded-xl p-3 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Exceptions Section */}
                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <h5 className="text-sm font-bold text-white mb-4">Exceções (Folgas e Feriados)</h5>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {specialDays.map((sd: any, i: number) => (
                                        <div key={i} className="flex flex-col gap-3 bg-neutral-900 border border-white/10 p-5 rounded-2xl w-full">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-600/10 flex items-center justify-center text-orange-500 text-xl">
                                                        🗓️
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white text-lg">{new Date(sd.date + 'T12:00:00Z').toLocaleDateString('pt-BR')}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${sd.isClosed ? 'bg-red-500' : 'bg-green-500'}`} />
                                                            <p className={`text-[10px] uppercase font-bold tracking-widest ${sd.isClosed ? 'text-red-500' : 'text-green-500'}`}>
                                                                {sd.isClosed ? 'Loja Fechada' : 'Loja Aberta'}
                                                            </p>
                                                            {!sd.isClosed && <span className="text-[9px] text-neutral-500 ml-1">({sd.openHour} - {sd.closeHour})</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            const updated = [...specialDays];
                                                            updated[i].isClosed = !updated[i].isClosed;
                                                            setSpecialDays(updated);
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-black text-neutral-400 uppercase tracking-widest transition-all"
                                                    >
                                                        Alterar Status
                                                    </button>
                                                    <button onClick={() => setSpecialDays(specialDays.filter((_: any, idx: number) => idx !== i))} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-500 hover:text-red-500 transition-colors">✕</button>
                                                </div>
                                            </div>

                                            {sd.isClosed && (
                                                <div className="flex gap-2 mt-2">
                                                    <button 
                                                        onClick={() => {
                                                            const dateFmt = new Date(sd.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
                                                            setAnnouncementEnabled(true);
                                                            setAnnouncementText(`⚠️ COMUNICADO: Estaremos fechados no dia ${dateFmt} por motivo de feriado/folga. Agradecemos a compreensão!`);
                                                            setAnnouncementImage('/announcements/feriado.png');
                                                            showToast('Flyer de feriado gerado e aplicado!', 'success');
                                                            setActiveSubTab('recados');
                                                        }}
                                                        className="flex-1 py-3 px-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[9px] font-black text-orange-500 uppercase tracking-widest hover:bg-orange-500/20 transition-all"
                                                    >
                                                        📢 Publicar Recado (Flyer 1)
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const dateFmt = new Date(sd.date + 'T12:00:00Z').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
                                                            setAnnouncementEnabled(true);
                                                            setAnnouncementText(`AVISO: No dia ${dateFmt} a barbearia não funcionará. Antecipe seu agendamento!`);
                                                            setAnnouncementImage('/announcements/fechado.png');
                                                            showToast('Flyer de fechamento gerado e aplicado!', 'success');
                                                            setActiveSubTab('recados');
                                                        }}
                                                        className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all"
                                                    >
                                                        📢 Publicar Recado (Flyer 2)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {specialDays.length === 0 && <p className="text-xs text-neutral-500 italic py-4">Nenhuma exceção cadastrada.</p>}
                                </div>

                                <div className="p-5 bg-neutral-950/50 rounded-2xl border border-dashed border-white/10 space-y-4">
                                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Adicionar Nova Exceção</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <input 
                                            type="date" 
                                            value={newSpecialDate}
                                            onChange={(e) => setNewSpecialDate(e.target.value)}
                                            className="bg-neutral-900 border border-white/5 rounded-xl p-3 text-white text-sm" 
                                        />
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-3 cursor-pointer bg-neutral-900 px-4 py-3 rounded-xl border border-white/5 w-full">
                                                <input 
                                                    type="checkbox" 
                                                    checked={newSpecialClosed}
                                                    onChange={(e) => setNewSpecialClosed(e.target.checked)}
                                                    className="accent-orange-500 w-4 h-4" 
                                                />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Loja Fechada</span>
                                            </label>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(!newSpecialDate) return showToast('Selecione uma data', 'error');
                                            if(specialDays.some((s: any) => s.date === newSpecialDate)) return showToast('Esta data já existe', 'error');
                                            setSpecialDays([...specialDays, { date: newSpecialDate, isClosed: newSpecialClosed, openHour: '09:00', closeHour: '18:00' }]);
                                            setNewSpecialDate(''); // Reset
                                        }}
                                        className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        + ADICIONAR EXCEÇÃO
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-prime w-full py-5 text-xs font-black uppercase tracking-[0.3em] disabled:opacity-50 mt-4"
                >
                    {saving ? 'PROCESSANDO...' : 'SALVAR INFORMAÇÕES'}
                </button>
            </motion.div>

            <div className="glass p-6 rounded-2xl border border-orange-500/10 max-w-2xl">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Informação Importante</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                    Essas informações são públicas. O Endereço será usado pelo botão "Abrir no Google Maps" do cliente, e o WhatsApp será o contato direto do botão de "Suporte". Além disso, os dias marcados como "Fechado" aparecerão em vermelho no painel do usuário.
                </p>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'pagamentos' && (
          <motion.div 
            key="pagamentos"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-8"
          >
            <motion.div 
                className="luxury-card p-10 border border-white/5 space-y-10 max-w-2xl"
            >
                <div>
                    <h4 className="text-xl font-bold text-white tracking-tight mb-2">Mercado Pago</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-8">Configure as chaves da sua conta Mercado Pago para receber pagamentos pelo aplicativo.</p>
                    
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Public Key (Chave Pública)</label>
                            <input 
                                type="text" 
                                value={mpPublicKey}
                                onChange={(e) => setMpPublicKey(e.target.value)}
                                className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                placeholder="APP_USR-..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1">Access Token (Chave Privada)</label>
                            <input 
                                type="password" 
                                value={mpAccessToken}
                                onChange={(e) => setMpAccessToken(e.target.value)}
                                className="w-full bg-neutral-950 border border-white/5 rounded-2xl p-5 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                                placeholder="APP_USR-..."
                            />
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-prime w-full py-5 text-xs font-black uppercase tracking-[0.3em] disabled:opacity-50 mt-4"
                >
                    {saving ? 'PROCESSANDO...' : 'SALVAR CHAVES'}
                </button>
            </motion.div>

            <div className="glass p-6 rounded-2xl border border-orange-500/10 max-w-2xl">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Segurança</p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                    Seus tokens são armazenados de forma segura e utilizados apenas para processar os pagamentos dos seus clientes. Nunca compartilhe seu Access Token com ninguém.
                </p>
            </div>
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
