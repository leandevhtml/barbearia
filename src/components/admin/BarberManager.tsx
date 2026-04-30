import { useState, useEffect, useRef } from 'react';
import BarberLoading from '@/components/shared/BarberLoading';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Edit2, Upload, X, UserPlus, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [commissionRate, setCommissionRate] = useState(50);
  const [avatar, setAvatar] = useState('');
  const [available, setAvailable] = useState(true);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: string, name: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<{ title: string, message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Imagem muito grande (máx 2MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setEditingId(null);
    setName(''); setEmail(''); setPhone(''); setPassword(''); 
    setSpecialty(''); setCommissionRate(50); setAvatar('');
    setAvailable(true);
    setError(''); setSuccess('');
  };

  const startEdit = (barber: Barber) => {
    setEditingId(barber._id);
    setName(barber.name);
    setEmail(barber.email);
    setPhone(barber.phone);
    setSpecialty(barber.specialty || '');
    setCommissionRate(barber.commissionRate);
    setAvatar(barber.avatar || '');
    setAvailable(barber.available);
    setPassword(''); 
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (barber: Barber) => {
    setShowDeleteModal({ id: barber._id, name: barber.name });
  };

  const executeDelete = async () => {
    if (!showDeleteModal) return;
    
    try {
      const res = await fetch(`/api/barbers/${showDeleteModal.id}`, { method: 'DELETE' });
      if (res.ok) {
        setBarbers(barbers.filter(b => b._id !== showDeleteModal.id));
        setShowSuccessModal({ 
          title: 'Excluído!', 
          message: `${showDeleteModal.name} foi removido da equipe.` 
        });
        setShowDeleteModal(null);
      } else {
        setError('Erro ao excluir barbeiro.');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const payload = { name, email, phone, specialty, commissionRate, avatar, available, ...(password && { password }) };
    const url = editingId ? `/api/barbers/${editingId}` : '/api/barbers';
    const method = editingId ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || 'Erro ao processar solicitação');
      } else {
        if (editingId) {
          setBarbers(barbers.map(b => b._id === editingId ? data : b));
        } else {
          setBarbers([...barbers, data]);
        }
        
        setShowSuccessModal({ 
          title: editingId ? 'Atualizado!' : 'Cadastrado!', 
          message: `Dados de ${data.name} foram salvos com sucesso.` 
        });
        resetForm();
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  if (loading) {
    return <BarberLoading message="CARREGANDO EQUIPE..." />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Formulário de Gestão */}
        <motion.div 
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="luxury-card p-8 border border-orange-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              {editingId ? <Edit2 size={48} /> : <UserPlus size={48} />}
            </div>

            <h3 className="text-2xl font-bebas italic tracking-widest text-orange-500 mb-8">
              {editingId ? 'Editar Profissional' : 'Novo Especialista'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-2xl bg-neutral-900 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-orange-500/50 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                    {avatar ? (
                      <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="text-neutral-600 group-hover:text-orange-500 transition-colors" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-orange-600 p-2 rounded-lg shadow-xl ring-4 ring-neutral-950">
                    <Upload size={14} className="text-white" />
                  </div>
                </div>
                <input 
                  type="file" ref={fileInputRef} className="hidden" 
                  accept="image/*" onChange={handleFileUpload} 
                />
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-4">Foto do Profissional</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" placeholder="Nome Completo" required
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                />
                <input 
                  type="email" placeholder="E-mail de Login" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                />
                <input 
                  type="tel" placeholder="WhatsApp / Telefone" required
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                />
                <input 
                  type="password" placeholder={editingId ? "Senha (deixe em branco para manter)" : "Senha de Acesso"}
                  required={!editingId}
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                />
                <input 
                  type="text" placeholder="Especialidade (ex: Barboterapia)" 
                  value={specialty} onChange={e => setSpecialty(e.target.value)}
                  className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-neutral-500 uppercase tracking-[0.3em] font-black ml-1">Comissão %</label>
                    <input 
                      type="number" min="0" max="100" required
                      value={commissionRate} onChange={e => setCommissionRate(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-neutral-500 uppercase tracking-[0.3em] font-black ml-1">Status</label>
                    <button 
                      type="button"
                      onClick={() => setAvailable(!available)}
                      className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${available ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                    >
                      {available ? 'Disponível' : 'Ausente'}
                    </button>
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-500 text-xs font-bold text-center italic">{error}</motion.p>
                )}
              </AnimatePresence>
              
              <div className="flex gap-3 pt-4">
                {editingId && (
                  <button 
                    type="button" onClick={resetForm}
                    className="flex-1 bg-neutral-900 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl border border-white/10 hover:bg-neutral-800 transition-all"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  type="submit" 
                  className={`flex-[2] text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-orange-600 hover:bg-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.3)]'}`}
                >
                  {editingId ? <><Save size={14} /> Salvar Alterações</> : <><UserPlus size={14} /> Ativar Especialista</>}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Lista de Equipe */}
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bebas italic tracking-widest text-white">Elite Team <span className="text-orange-500 ml-2">({barbers.length})</span></h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {barbers.map(barber => (
              <motion.div 
                key={barber._id} 
                layout
                className={`luxury-card p-6 flex flex-col justify-between border transition-all ${editingId === barber._id ? 'border-orange-500 ring-1 ring-orange-500/50' : 'border-white/5 hover:border-white/15'}`}
              >
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 bg-neutral-900 rounded-2xl flex items-center justify-center font-bebas text-3xl text-orange-500 border border-white/5 overflow-hidden shadow-2xl relative flex-shrink-0">
                    {barber.avatar ? (
                      <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                    ) : (
                      barber.name.substring(0,2).toUpperCase()
                    )}
                    {!barber.available && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter bg-red-600 px-2 py-0.5 rounded">OFFLINE</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className="font-black text-lg text-white leading-tight truncate uppercase tracking-tight">{barber.name}</h4>
                      <div className="flex gap-1 ml-2">
                        <button 
                          onClick={() => startEdit(barber)}
                          className="p-2 bg-neutral-900 hover:bg-blue-900/40 hover:text-blue-400 rounded-lg transition-all text-neutral-500 border border-white/5"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(barber)}
                          className="p-2 bg-neutral-900 hover:bg-red-900/40 hover:text-red-400 rounded-lg transition-all text-neutral-500 border border-white/5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1 italic">{barber.specialty || 'Especialista Elite'}</p>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-neutral-500 uppercase">Contato:</span>
                        <span className="text-xs font-bold text-neutral-300">{barber.phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-lg">
                          <p className="text-[8px] font-black text-orange-500 uppercase tracking-tighter">Comissão</p>
                          <p className="text-sm font-black text-white">{barber.commissionRate}%</p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border ${barber.available ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                          <p className={`text-[8px] font-black uppercase tracking-tighter ${barber.available ? 'text-green-500' : 'text-red-500'}`}>Status</p>
                          <p className={`text-sm font-black ${barber.available ? 'text-white' : 'text-neutral-500'}`}>{barber.available ? 'ATIVO' : 'AUSENTE'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* SYSTEM MODALS */}
      <AnimatePresence>
        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h4 className="text-2xl font-bebas italic tracking-widest text-white mb-2">Confirmar Exclusão?</h4>
              <p className="text-sm text-neutral-400 mb-8 px-4">
                Você está prestes a remover <span className="text-white font-bold">{showDeleteModal.name}</span> permanentemente da equipe.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 py-4 rounded-2xl bg-neutral-800 text-white font-black uppercase tracking-widest text-[10px] border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeDelete}
                  className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-neutral-900 border border-white/10 p-8 rounded-[2.5rem] max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center"
            >
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h4 className="text-2xl font-bebas italic tracking-widest text-white mb-2">{showSuccessModal.title}</h4>
              <p className="text-sm text-neutral-400 mb-8 px-4">
                {showSuccessModal.message}
              </p>
              <button 
                onClick={() => setShowSuccessModal(null)}
                className="w-full py-4 rounded-2xl bg-orange-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(234,88,12,0.4)]"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
