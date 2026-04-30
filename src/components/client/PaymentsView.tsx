'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import BarberLoading from '@/components/shared/BarberLoading';

export default function PaymentsView() {
  const { currentUser } = useBarbershopStore();
  const [history, setHistory] = useState<any[]>([]);
  const [demoTransactions, setDemoTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  async function handleAddCard() {
    setLoadingPay(true);
    // Simulação 100% local para visualização do histórico
    setTimeout(() => {
      const mockTx = {
        _id: 'mock-' + Date.now(),
        description: 'Simulação: Corte + Barba',
        amount: 45.00,
        createdAt: new Date().toISOString(),
        paymentMethod: 'mercadopago',
        status: 'approved'
      };
      
      setDemoTransactions(prev => [mockTx, ...prev]);
      setShowAddCard(false);
      setLoadingPay(false);
      alert('Simulação Concluída! Veja o novo item no seu histórico.');
    }, 1500);
  }

  useEffect(() => {
    fetch('/api/users/payments')
      .then(res => res.json())
      .then(data => {
        setHistory(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const combinedHistory = [...demoTransactions, ...history];

  if (loading) return <BarberLoading inline message="CARREGANDO CARTEIRA..." />;

  return (
    <div className="flex flex-col gap-10 w-full max-w-xl mx-auto px-1 pb-24">
      
      {/* ── Virtual Elite Card ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full aspect-[1.6/1] rounded-[2.5rem] p-8 overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col justify-between"
        style={{ background: 'linear-gradient(135deg, #111111 0%, #050505 100%)' }}
      >
        {/* Holographic Mesh Effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.4em] mb-1">Pagamento Digital</p>
                <h3 className="text-2xl text-bebas font-black text-white italic tracking-widest">GIGANTES ELITE</h3>
            </div>
            <div className="w-14 h-10 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md flex items-center justify-center text-xl">
                💳
            </div>
        </div>

        <div className="relative z-10 space-y-4">
            <div className="flex gap-4 items-center">
                <p className="text-xl md:text-2xl font-mono text-white tracking-[0.2em]">••••  ••••  ••••  0000</p>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Titular</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">{currentUser?.name}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Expira</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">--/--</p>
                </div>
            </div>
        </div>
      </motion.div>

      {/* ── Actions ── */}
      <div className="grid grid-cols-1 gap-4">
        <button 
            onClick={() => setShowAddCard(true)}
            className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
        >
            <span className="text-lg">➕</span> Adicionar Novo Cartão
        </button>
      </div>

      {/* ── History ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
            <h4 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.3em]">Histórico de Pagamentos</h4>
            <span className="text-[10px] text-neutral-600 font-bold uppercase">{combinedHistory.length} Transações</span>
        </div>

        <div className="space-y-3">
            {combinedHistory.length === 0 ? (
                <div className="luxury-card p-12 text-center border-dashed">
                    <p className="text-xs text-neutral-500 italic uppercase tracking-widest">Nenhuma transação encontrada</p>
                </div>
            ) : (
                combinedHistory.map((tx) => (
                    <div key={tx._id} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-3xl flex items-center justify-between group hover:border-orange-500/20 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">
                                {tx.paymentMethod === 'mercadopago' ? '💳' : tx.paymentMethod === 'pix' ? '📱' : '💵'}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white mb-0.5">{tx.description}</p>
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                                    {new Date(tx.createdAt).toLocaleDateString('pt-BR')} • {tx.paymentMethod.toUpperCase()}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-white italic">R$ {tx.amount.toFixed(2)}</p>
                            <p className={`text-[8px] font-black uppercase tracking-widest ${tx.status === 'approved' ? 'text-green-500' : 'text-orange-500'}`}>
                                {tx.status === 'approved' ? 'Aprovado' : 'Pendente'}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* ── Add Card Modal ── */}
      <AnimatePresence>
        {showAddCard && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowAddCard(false)}
                    className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[1000]"
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0c0c0c] rounded-[2.5rem] p-10 z-[1001] border border-orange-500/20 shadow-2xl"
                >
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-orange-600/10 rounded-3xl mx-auto flex items-center justify-center text-4xl mb-4 border border-orange-500/20">
                            🛡️
                        </div>
                        <h3 className="text-2xl text-bebas font-black text-white italic tracking-widest uppercase">Integração Mercado Pago</h3>
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            Para sua segurança, os dados do cartão são processados diretamente pelo Mercado Pago. Estamos configurando o ambiente seguro.
                        </p>
                        <div className="pt-6 space-y-3">
                            <button 
                                onClick={handleAddCard}
                                disabled={loadingPay}
                                className="w-full py-5 bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl disabled:opacity-50"
                            >
                                {loadingPay ? 'PROCESSANDO...' : 'INICIAR PAGAMENTO'}
                            </button>
                            <button 
                                onClick={() => setShowAddCard(false)}
                                disabled={loadingPay}
                                className="w-full py-5 text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em]"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
