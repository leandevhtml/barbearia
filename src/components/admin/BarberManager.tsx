import { useState, useEffect } from 'react';
import BarberLoading from '@/components/shared/BarberLoading';
import { motion } from 'framer-motion';

interface Barber {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialty?: string;
  commissionRate: number;
  available: boolean;
  avatar?: string;
}

export default function BarberManager() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [commissionRate, setCommissionRate] = useState(50);
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const res = await fetch('/api/barbers');
      const data = await res.json();
      if (res.ok) {
        setBarbers(data);
      }
    } catch (err) {
      console.error('Failed to fetch barbers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, specialty, commissionRate, avatar }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Erro ao criar barbeiro');
      } else {
        setSuccess('Barbeiro cadastrado com sucesso!');
        setBarbers([...barbers, data]);
        setName(''); setEmail(''); setPhone(''); setPassword(''); setSpecialty(''); setCommissionRate(50); setAvatar('');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  if (loading) {
    return <BarberLoading message="CARREGANDO BARBEIROS..." />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Formulário de Cadastro */}
        <motion.div 
          className="luxury-card p-6 lg:col-span-1 border border-orange-500/20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-bebas italic tracking-widest text-orange-500 mb-6">Novo Profissional</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input 
              type="text" placeholder="Nome do Barbeiro" required
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 transition-colors"
            />
            <input 
              type="email" placeholder="E-mail (Login)" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 transition-colors"
            />
            <input 
              type="tel" placeholder="Telefone / WhatsApp" required
              value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 transition-colors"
            />
            <input 
              type="password" placeholder="Senha provisória" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 transition-colors"
            />
            <input 
              type="text" placeholder="Especialidade (ex: Visagismo)" 
              value={specialty} onChange={e => setSpecialty(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 transition-colors"
            />
            <input 
              type="url" placeholder="URL da Foto do Perfil (Opcional)" 
              value={avatar} onChange={e => setAvatar(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 transition-colors"
            />
            <div className="space-y-2">
              <label className="text-[10px] text-neutral-500 uppercase tracking-widest font-black ml-1">Comissão (%)</label>
              <input 
                type="number" min="0" max="100" required
                value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500 transition-colors"
              />
            </div>
            
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            {success && <p className="text-green-500 text-xs font-bold">{success}</p>}
            
            <button type="submit" className="w-full bg-orange-600 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-orange-500 transition-colors">
              Cadastrar Barbeiro
            </button>
          </form>
        </motion.div>

        {/* Lista de Barbeiros */}
        <motion.div 
          className="lg:col-span-2 space-y-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bebas italic tracking-widest text-white">Equipe Atual ({barbers.length})</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbers.map(barber => (
              <div key={barber._id} className="luxury-card p-5 flex items-center gap-4">
                <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center font-bebas text-2xl text-orange-500 border border-orange-500/20 overflow-hidden">
                  {barber.avatar && barber.avatar.startsWith('http') ? (
                    <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                  ) : (
                    barber.avatar || barber.name.substring(0,2).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-white leading-tight">{barber.name}</h4>
                  <p className="text-xs text-neutral-400">{barber.specialty || 'Barbeiro Geral'}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[9px] font-black tracking-widest uppercase bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full">
                      {barber.commissionRate}% Comiss.
                    </span>
                    <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${barber.available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {barber.available ? 'Disponível' : 'Ausente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {barbers.length === 0 && (
              <div className="col-span-full py-10 text-center glass-panel rounded-2xl border-white/5">
                <p className="text-neutral-500 text-sm">Nenhum profissional cadastrado.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
