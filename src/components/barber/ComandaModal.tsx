'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ComandaModalProps {
  appointment: any;
  onClose: () => void;
  onSaved: () => void;
  onFinalize: (items: any[], total: number) => void;
  showToast: (msg: string, type: string) => void;
}

export default function ComandaModal({ appointment, onClose, onSaved, onFinalize, showToast }: ComandaModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>(appointment.items || []);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data.filter(p => p.stock > 0));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product._id);
    if (existing) {
      setItems(items.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { productId: product._id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const removeItem = (productId: string) => {
    const existing = items.find(i => i.productId === productId);
    if (existing && existing.quantity > 1) {
      setItems(items.map(i => i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i));
    } else {
      setItems(items.filter(i => i.productId !== productId));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const subtotalService = appointment.price || 0;
      const subtotalItems = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const totalAmount = subtotalService + subtotalItems;

      const res = await fetch(`/api/appointments/${appointment._id || appointment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, totalAmount })
      });
      if (res.ok) {
        showToast('Comanda atualizada!', 'success');
        onSaved();
      } else {
        showToast('Erro ao atualizar comanda.', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isServicePaid = appointment.paymentStatus === 'paid_app' || appointment.paymentStatus === 'free_reward';
  const subtotalService = appointment.price || 0;
  const subtotalItems = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalAmount = subtotalService + subtotalItems;
  const totalToPay = isServicePaid ? subtotalItems : totalAmount;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-lg bg-[#0a0a0a] border border-orange-500/20 rounded-[2rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,1)] flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-neutral-900/50">
            <div>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Comanda Digital</p>
              <h3 className="text-xl text-white font-bold tracking-tight">{appointment.userId?.name || 'Cliente'}</h3>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
            {/* Resumo do Serviço */}
            <div>
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Serviço Principal</h4>
              <div className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-neutral-950">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  {appointment.serviceName}
                  {isServicePaid && <span className="text-[9px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">PAGO NO APP</span>}
                </span>
                <span className={`text-sm font-black ${isServicePaid ? 'text-neutral-500 line-through' : 'text-orange-500'}`}>R$ {subtotalService.toFixed(2)}</span>
              </div>
            </div>

            {/* Itens Adicionais */}
            <div>
              <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
                <span>Consumo Extra</span>
                <span className="text-orange-500">R$ {subtotalItems.toFixed(2)}</span>
              </h4>
              
              <div className="space-y-2 mb-6">
                {items.length === 0 ? (
                  <p className="text-xs text-neutral-600 italic">Nenhum item adicionado à comanda.</p>
                ) : (
                  items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-white bg-neutral-800 px-2 py-1 rounded-md">{item.quantity}x</span>
                        <span className="text-sm text-neutral-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-neutral-400">R$ {(item.price * item.quantity).toFixed(2)}</span>
                        <button onClick={() => removeItem(item.productId)} className="text-red-500 text-xs hover:text-red-400 font-bold">✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Catálogo de Produtos */}
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-4">Adicionar ao Consumo</p>
                {loading ? (
                  <p className="text-xs text-neutral-500">Carregando inventário...</p>
                ) : products.length === 0 ? (
                  <p className="text-xs text-neutral-500">Nenhum produto em estoque.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                    {products.map(p => (
                      <button 
                        key={p._id}
                        onClick={() => addItem(p)}
                        className="text-left p-3 rounded-xl border border-white/5 hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors group flex flex-col justify-between h-20"
                      >
                        <span className="text-xs font-bold text-white line-clamp-1">{p.name}</span>
                        <div className="flex justify-between items-end w-full">
                          <span className="text-xs text-orange-500 font-black">R$ {p.price.toFixed(2)}</span>
                          <span className="text-[9px] font-black text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase">+ ADD</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-neutral-900/50 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                {totalToPay === 0 ? 'Status de Cobrança' : 'A Cobrar no Balcão'}
              </p>
              {totalToPay === 0 ? (
                <p className="text-2xl text-bebas font-black text-green-500 italic leading-none tracking-tight">TUDO PAGO ✅</p>
              ) : (
                <p className="text-3xl text-bebas font-black text-orange-500 italic leading-none tracking-tight">R$ {totalToPay.toFixed(2)}</p>
              )}
              {isServicePaid && totalToPay > 0 && <p className="text-[9px] text-green-500 mt-1 uppercase font-bold tracking-widest">Serviço Pago / Cobrar apenas extras</p>}
            </div>
            <div className="flex gap-2">
                <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-4 rounded-xl bg-white/5 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                {saving ? '...' : 'SALVAR'}
                </button>
                <button 
                onClick={() => onFinalize(items, totalAmount)}
                disabled={saving}
                className={`btn-prime py-4 px-8 text-xs font-black uppercase tracking-widest ${totalToPay === 0 ? 'bg-green-600 hover:bg-green-500 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : ''}`}
                >
                {saving ? 'PROCESSANDO...' : 'FINALIZAR'}
                </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
