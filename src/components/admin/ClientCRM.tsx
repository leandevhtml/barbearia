'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, MessageSquare, Award, Clock, DollarSign, Calendar, Sparkles, Filter, AlertTriangle } from 'lucide-react';
import BarberLoading from '@/components/shared/BarberLoading';

interface ClientItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalCuts: number;
  stamps: number;
  freeCouponAvailable: boolean;
  totalSpent: number;
  lastVisit: string;
  daysSinceLastVisit: number | null;
  crmStatus: 'vip' | 'active' | 'inactive' | 'new';
  createdAt: string;
}

export default function ClientCRM() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'vip' | 'inactive' | 'active' | 'new'>('all');

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return c.crmStatus === statusFilter;
  });

  const stats = {
    total: clients.length,
    vip: clients.filter(c => c.crmStatus === 'vip').length,
    inactive: clients.filter(c => c.crmStatus === 'inactive').length,
    new: clients.filter(c => c.crmStatus === 'new').length
  };

  if (loading) return <BarberLoading message="CARREGANDO CRM DE CLIENTES..." />;

  return (
    <div className="space-y-8">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <div>
              <h2 className="text-3xl font-bebas italic text-white tracking-tight">CRM & Carteira de Clientes</h2>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Gestão de Relacionamento, Fidelidade e Recuperação de Clientes
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp..."
            className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('all')} 
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'all' ? 'border-orange-500/50 bg-orange-600/5' : 'border-white/5 hover:border-white/20'}`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Base Total</span>
            <Users size={16} className="text-orange-500" />
          </div>
          <p className="text-3xl font-bebas text-white italic">{stats.total}</p>
          <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1">Clientes cadastrados</p>
        </div>

        <div 
          onClick={() => setStatusFilter('vip')} 
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'vip' ? 'border-amber-500/50 bg-amber-600/5' : 'border-white/5 hover:border-white/20'}`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Clientes VIP</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <p className="text-3xl font-bebas text-white italic">{stats.vip}</p>
          <p className="text-[9px] text-amber-400/80 font-bold uppercase mt-1">5+ cortes realizados</p>
        </div>

        <div 
          onClick={() => setStatusFilter('inactive')} 
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'inactive' ? 'border-red-500/50 bg-red-600/5' : 'border-white/5 hover:border-white/20'}`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Inativos (+35d)</span>
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <p className="text-3xl font-bebas text-white italic">{stats.inactive}</p>
          <p className="text-[9px] text-red-400/80 font-bold uppercase mt-1">Estimular retorno</p>
        </div>

        <div 
          onClick={() => setStatusFilter('new')} 
          className={`glass-panel p-5 rounded-2xl border cursor-pointer transition-all ${statusFilter === 'new' ? 'border-blue-500/50 bg-blue-600/5' : 'border-white/5 hover:border-white/20'}`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Novos</span>
            <Sparkles size={16} className="text-blue-400" />
          </div>
          <p className="text-3xl font-bebas text-white italic">{stats.new}</p>
          <p className="text-[9px] text-blue-400/80 font-bold uppercase mt-1">Primeiros cortes</p>
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'vip', label: '⭐ VIPs' },
          { id: 'inactive', label: '🚨 Inativos (+35 dias)' },
          { id: 'active', label: '✂️ Ativos' },
          { id: 'new', label: '🌱 Novos' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setStatusFilter(filter.id as any)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 ${
              statusFilter === filter.id
                ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                : 'bg-neutral-900 text-neutral-500 border-white/5 hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* ── Client Cards List ── */}
      <div className="space-y-4">
        {filteredClients.map((client, idx) => {
          const rawPhone = client.phone.replace(/\D/g, '');
          
          // Mensagem personalizada de recuperação ou pós-venda
          let defaultMessage = `Olá ${client.name.split(' ')[0]}! Tudo bem? Estamos com saudades de você aqui na Barbearia Gigantes do Corte. Que tal agendar o seu próximo corte para alinhar o visual?`;
          if (client.freeCouponAvailable) {
            defaultMessage = `Olá ${client.name.split(' ')[0]}! Parabéns! Seu corte grátis no Clube de Fidelidade da Barbearia Gigantes do Corte está disponível! Venha aproveitar!`;
          } else if (client.crmStatus === 'inactive') {
            defaultMessage = `Fala ${client.name.split(' ')[0]}! Faz mais de um mês que você não dá um talento no visual. Passando pra te convidar a agendar um horário com a gente! ✂️`;
          }

          const whatsappUrl = `https://wa.me/55${rawPhone}?text=${encodeURIComponent(defaultMessage)}`;

          return (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="luxury-card p-6 border border-white/5 hover:border-orange-500/30 transition-all relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                
                {/* Client Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-xl font-bebas text-orange-500 flex-shrink-0 shadow-inner">
                    {client.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-xl font-bebas text-white italic tracking-tight truncate">
                        {client.name}
                      </h4>
                      {client.crmStatus === 'vip' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[8px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                          ⭐ VIP
                        </span>
                      )}
                      {client.crmStatus === 'inactive' && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[8px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                          🚨 Ausente
                        </span>
                      )}
                      {client.freeCouponAvailable && (
                        <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[8px] font-black text-green-400 uppercase tracking-widest">
                          🎁 Cupom Grátis
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-neutral-400 font-medium">
                      📱 {client.phone} • ✉️ {client.email}
                    </p>
                  </div>
                </div>

                {/* Metrics & Actions */}
                <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                  
                  {/* Total Cortes */}
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Cortes</p>
                    <p className="text-2xl font-bebas text-white italic leading-tight">{client.totalCuts}</p>
                    <span className="text-[8px] text-orange-500 font-bold uppercase">{client.stamps} selos</span>
                  </div>

                  {/* LTV (Total Gasto) */}
                  <div className="text-left md:text-right">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Total Gasto</p>
                    <p className="text-2xl font-bebas text-green-400 italic leading-tight">
                      R$ {client.totalSpent.toFixed(2)}
                    </p>
                    <span className="text-[8px] text-neutral-500 font-bold uppercase">LTV Acumulado</span>
                  </div>

                  {/* Última Visita */}
                  <div className="text-left md:text-right min-w-[90px]">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Último Corte</p>
                    <p className={`text-sm font-black uppercase ${client.daysSinceLastVisit !== null && client.daysSinceLastVisit > 35 ? 'text-red-400' : 'text-neutral-300'}`}>
                      {client.daysSinceLastVisit !== null 
                        ? `${client.daysSinceLastVisit} dias atrás`
                        : 'Nunca cortou'}
                    </p>
                  </div>

                  {/* WhatsApp Quick Action */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
                    title="Enviar mensagem via WhatsApp"
                  >
                    <MessageSquare size={14} />
                    <span>WhatsApp</span>
                  </a>

                </div>

              </div>
            </motion.div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="text-center py-16 glass-panel rounded-3xl border-dashed border-white/10 opacity-40">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
              Nenhum cliente encontrado com os filtros atuais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
