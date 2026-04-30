import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBarbershopStore } from '@/store/barbershopStore';
import BarberLoading from '@/components/shared/BarberLoading';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface CheckoutModalProps {
  appointment: any;
  onClose: () => void;
  onConfirm: (items: any[], totalAmount: number, paymentMethod: string) => void;
}

export default function CheckoutModal({ appointment, onClose, onConfirm }: CheckoutModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [isServicePaid, setIsServicePaid] = useState(
    appointment.paymentStatus === 'paid_app' || appointment.paymentStatus === 'free_reward'
  );

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProducts(data);
        setLoading(false);
      });
  }, []);

  const addItem = (product: Product) => {
    const existing = selectedItems.find(i => i.productId === product._id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { 
        productId: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1 
      }]);
    }
  };

  const removeItem = (productId: string) => {
    const item = selectedItems.find(i => i.productId === productId);
    if (item && item.quantity > 1) {
      setSelectedItems(selectedItems.map(i => 
        i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
      ));
    } else {
      setSelectedItems(selectedItems.filter(i => i.productId !== productId));
    }
  };

  const subtotalProducts = selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalToPay = (isServicePaid ? 0 : appointment.price) + subtotalProducts;

  return (
    <motion.div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div 
        className="luxury-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border-orange-500/30"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl text-bebas font-black text-white italic tracking-tight">Fechar Comanda</h2>
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Cliente: {appointment.userId?.name}</p>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Product Selection */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-white/10 bg-black/20">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Adicionar Itens</h3>
            {loading ? (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 rounded-2xl flex items-center justify-center">
                  <BarberLoading message="CARREGANDO PRODUTOS..." />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map(p => (
                  <button 
                    key={p._id}
                    onClick={() => addItem(p)}
                    className="p-4 rounded-2xl bg-neutral-900 border border-white/5 text-left hover:border-orange-500/30 transition-all group"
                  >
                    <p className="text-sm font-bold text-white group-hover:text-orange-500">{p.name}</p>
                    <p className="text-xs font-black text-orange-500 mt-1">R$ {p.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart / Summary */}
          <div className="w-full md:w-80 p-6 flex flex-col bg-neutral-950">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Resumo da Conta</h3>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
                    {appointment.serviceName}
                    {isServicePaid && (
                        <span className="text-[7px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-full uppercase font-black">PAGO</span>
                    )}
                  </p>
                  <p className="text-[10px] text-neutral-500">Serviço Agendado</p>
                </div>
                <button 
                    onClick={() => setIsServicePaid(!isServicePaid)}
                    className={`text-xs font-black transition-all ${isServicePaid ? 'text-neutral-500 line-through' : 'text-orange-500 hover:text-orange-400 underline decoration-dotted'}`}
                >
                    R$ {appointment.price.toFixed(2)}
                </button>
              </div>

              {selectedItems.map(item => (
                <div key={item.productId} className="flex justify-between items-start group">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-xs font-bold text-white uppercase tracking-tight truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => removeItem(item.productId)} className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px]">-</button>
                      <span className="text-[10px] font-black text-orange-500">{item.quantity}x</span>
                      <button onClick={() => {
                        const p = products.find(prod => prod._id === item.productId);
                        if (p) addItem(p);
                      }} className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px]">+</button>
                    </div>
                  </div>
                  <p className="text-xs font-black text-white">R$ {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-5">
              <div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-3">Forma de Pagamento (Restante)</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'pix', label: 'PIX', icon: '📱' },
                        { id: 'card', label: 'Cartão', icon: '💳' },
                        { id: 'cash', label: 'Dinheiro', icon: '💵' },
                    ].map(m => (
                        <button 
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id as any)}
                            className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${
                                paymentMethod === m.id ? 'bg-orange-600 border-white/20 text-white shadow-lg' : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'
                            }`}
                        >
                            <span className="text-sm mb-1">{m.icon}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                    ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total a Pagar</span>
                <span className="text-3xl text-bebas font-black text-orange-500 italic">
                    R$ {totalToPay.toFixed(2)}
                </span>
              </div>
              <button 
                onClick={() => onConfirm(selectedItems, totalToPay, paymentMethod)}
                className="btn-prime w-full py-4 text-xs font-black tracking-widest"
              >
                FINALIZAR E PAGAR
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
