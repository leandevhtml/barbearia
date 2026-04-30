'use client';

import { useState, useEffect } from 'react';
import BarberLoading from '@/components/shared/BarberLoading';
import { motion } from 'framer-motion';

interface Service {
  _id: string;
  name: string;
  price: number;
  duration: number;
  icon: string;
  active: boolean;
}

export default function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newIcon, setNewIcon] = useState('✂️');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (res.ok) setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/services/${editingId}` : '/api/services';
      const method = editingId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          price: Number(newPrice), 
          duration: Number(newDuration), 
          icon: newIcon 
        })
      });
      if (res.ok) {
        resetForm();
        fetchServices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingId(service._id);
    setNewName(service.name);
    setNewPrice(service.price.toString());
    setNewDuration(service.duration.toString());
    setNewIcon(service.icon);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setNewName('');
    setNewPrice('');
    setNewDuration('');
    setNewIcon('✂️');
  };

  const toggleService = async (service: Service) => {
    try {
      const res = await fetch(`/api/services/${service._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !service.active })
      });
      if (res.ok) {
        setServices(services.map(s => s._id === service._id ? { ...s, active: !service.active } : s));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = services.filter(s => s.active).length;

  if (loading) return <BarberLoading message="CARREGANDO SERVIÇOS..." />;

  return (
    <div className="space-y-8">
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Serviços', value: services.length, icon: '📋', color: 'var(--gray-300)' },
          { label: 'Ativos',   value: activeCount,      icon: '✅', color: '#10b981'    },
          { label: 'Inativos', value: services.length - activeCount, icon: '⏸️', color: '#ef4444' },
        ].map((stat) => (
          <div key={stat.label} 
               className="glass rounded-2xl p-5 border text-center card-hover"
               style={{ borderColor: 'var(--border)' }}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] uppercase tracking-widest mt-1 font-bold text-neutral-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <motion.div 
            className="luxury-card p-6 border border-orange-500/20 sticky top-24 self-start"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bebas italic tracking-widest text-orange-500">{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                {editingId && (
                    <button onClick={resetForm} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Cancelar</button>
                )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                    type="text" placeholder="Nome do Serviço" required
                    value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
                />
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        type="number" placeholder="Preço (R$)" required
                        value={newPrice} onChange={e => setNewPrice(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
                    />
                    <input 
                        type="number" placeholder="Duração (min)" required
                        value={newDuration} onChange={e => setNewDuration(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
                    />
                </div>
                <select 
                    value={newIcon} onChange={e => setNewIcon(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
                >
                    <option value="✂️">✂️ Tesoura</option>
                    <option value="🪒">🪒 Navalha</option>
                    <option value="💈">💈 Barbeiro</option>
                    <option value="🔥">🔥 Fogo/Quente</option>
                    <option value="🎨">🎨 Pigmento</option>
                    <option value="✨">✨ Brilho</option>
                </select>
                <button type="submit" className="btn-prime w-full py-4 text-xs font-black uppercase tracking-widest">
                    {editingId ? 'Salvar Alterações' : 'Criar Serviço'}
                </button>
            </form>
        </motion.div>

        {/* Service List */}
        <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-xl tracking-tight">Catálogo de Serviços</h2>
            </div>
            <div className="grid gap-3">
        {services.map((service, index) => (
          <motion.div
            key={service._id}
            className="glass rounded-2xl border p-4 card-hover relative overflow-hidden"
            style={{ 
                borderColor: service.active ? 'var(--border)' : 'rgba(255,255,255,0.05)',
                background: service.active ? 'rgba(20,20,20,0.75)' : 'rgba(10,10,10,0.4)'
            }}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Active Glow */}
            {service.active && (
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.03] blur-3xl pointer-events-none bg-orange-500" />
            )}

            <div className="flex items-center gap-4 relative z-10">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-all duration-500 ${
                  service.active
                    ? 'border border-orange-500 shadow-[0_0_15px_rgba(255,110,0,0.2)] bg-orange-600/10'
                    : 'bg-white/5 border border-white/5 grayscale opacity-30'
                }`}
              >
                {service.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-lg font-black tracking-tight transition-colors ${service.active ? 'text-white' : 'text-white/20'}`}>
                    {service.name}
                  </p>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                      service.active ? 'status-completed' : 'status-cancelled'
                    }`}
                  >
                    {service.active ? 'Ativo' : 'Offline'}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-xs font-medium text-neutral-500">
                  <span className="flex items-center gap-1">
                    <span className="opacity-50">⏱</span> {service.duration} min
                  </span>
                  <span className={`font-bold ${service.active ? 'text-orange-500' : 'opacity-20'}`}>
                    R$ {service.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <button
                  onClick={() => handleEdit(service)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-orange-500 hover:border-orange-500/30 transition-all text-sm"
                  title="Editar Serviço"
                >
                  ✏️
                </button>
                <button
                  onClick={() => toggleService(service)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-500 flex-shrink-0 flex items-center px-1 ${
                    service.active
                      ? 'bg-orange-600 shadow-[0_0_15px_rgba(255,110,0,0.4)]'
                      : 'bg-white/5 border border-white/10'
                  }`}
                  title={service.active ? 'Desativar Serviço' : 'Ativar Serviço'}
                >
                  <motion.div
                    className="w-5 h-5 rounded-full bg-white shadow-xl"
                    animate={{ x: service.active ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        
        {services.length === 0 && (
          <div className="text-center py-10 glass rounded-2xl border-dashed">
            <p className="text-neutral-500 text-sm">Nenhum serviço encontrado no sistema.</p>
          </div>
        )}
      </div>
    </div>
  </div>

      {/* ── Footer Info ── */}
      <div className="rounded-2xl p-5 text-sm glass border border-white/5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-600/20 flex items-center justify-center flex-shrink-0 text-xl">
            💡
        </div>
        <div>
            <p className="font-bold text-white mb-0.5">Gestão em Tempo Real</p>
            <p className="text-neutral-500">
              Serviços desativados aqui são removidos instantaneamente da visão de agendamento dos clientes, evitando conflitos de horários em dias de alta demanda.
            </p>
        </div>
      </div>
    </div>
  );
}
