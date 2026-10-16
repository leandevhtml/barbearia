'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import { signOut } from 'next-auth/react';

export default function ProfileView() {
  const { currentUser, syncUser, showToast } = useBarbershopStore();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatPhone = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (raw.length <= 10) {
      return raw.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
    }
    return raw.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Por favor, informe seu nome.', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showToast('Informe um número de WhatsApp válido com DDD.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: cleanPhone })
      });

      if (res.ok) {
        await syncUser();
        setSuccess(true);
        showToast('Dados da sua conta atualizados com sucesso!', 'success');
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const data = await res.json();
        showToast(data.message || 'Erro ao atualizar dados.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão ao salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    client: 'Cliente VIP',
    admin: 'Administrador',
    barber: 'Barbeiro / Especialista',
    superadmin: 'Super Admin'
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-xl mx-auto px-1 pb-24">
      {/* ── Cabeçalho do Perfil ── */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-luxury p-8 relative overflow-hidden text-center border-orange-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
      >
        <div className="w-24 h-24 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/10 shadow-[0_0_30px_rgba(234,88,12,0.4)]">
          <span className="text-3xl text-white font-black uppercase">
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </span>
        </div>

        <h2 className="text-3xl text-bebas font-black text-white italic uppercase tracking-tight">
          {currentUser?.name || 'Cliente'}
        </h2>
        <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mt-1">
          {roleLabels[currentUser?.role || 'client'] || 'Cliente'}
        </p>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <span className="text-2xl font-black text-white block">{currentUser?.stamps || 0}/10</span>
            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Selos Fidelidade</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <span className="text-2xl font-black text-white block">{currentUser?.totalCuts || 0}</span>
            <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Cortes Realizados</span>
          </div>
        </div>
      </motion.div>

      {/* ── Formulário de Edição ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-luxury p-8 border-white/10"
      >
        <div className="mb-6">
          <h3 className="text-lg text-bebas font-black text-white italic uppercase tracking-wider flex items-center gap-2">
            <span>👤</span> Meus Dados Pessoais
          </h3>
          <p className="text-xs text-neutral-500 font-medium">
            Mantenha seu telefone e WhatsApp sempre atualizados para receber as confirmações de agendamento automaticamente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
              Nome Completo
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:border-orange-500 focus:outline-none transition-colors"
              placeholder="Seu nome"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
              E-mail de Acesso
            </label>
            <input 
              type="email" 
              value={currentUser?.email || ''}
              disabled
              className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3.5 text-neutral-500 font-bold text-sm cursor-not-allowed"
            />
            <span className="text-[9px] text-neutral-600 block mt-1">O e-mail é vinculado ao seu login.</span>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
              WhatsApp / Celular com DDD
            </label>
            <input 
              type="text" 
              value={phone}
              onChange={handlePhoneChange}
              maxLength={15}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white font-bold text-sm focus:border-orange-500 focus:outline-none transition-colors"
              placeholder="(11) 99999-9999"
              required
            />
            <span className="text-[9px] text-neutral-500 block mt-1">
              📲 Todas as mensagens automáticas de confirmação são enviadas para este número.
            </span>
          </div>

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 text-xs font-bold text-center">
              ✓ Informações salvas com sucesso!
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-[0_0_20px_var(--orange-glow)] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando Dados...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </form>
      </motion.div>

      {/* ── Informações da Conta & Ações ── */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-luxury p-6 border-white/10 space-y-4"
      >
        <div className="flex justify-between items-center text-xs py-2 border-b border-white/5">
          <span className="text-neutral-500 uppercase font-black text-[9px] tracking-wider">Status do Cartão Fidelidade:</span>
          <span className="font-bold text-orange-400">
            {currentUser?.freeCouponAvailable ? '🎁 Corte Grátis Disponível!' : 'Ativo'}
          </span>
        </div>

        <div className="pt-2">
          <button 
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-black text-xs uppercase tracking-widest transition-all"
          >
            <span>✕</span> Desconectar da Conta
          </button>
        </div>
      </motion.div>
    </div>
  );
}
