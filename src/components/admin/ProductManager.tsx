import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import BarberLoading from '@/components/shared/BarberLoading';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Geral');
  const [image, setImage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (res.ok) setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: Number(price), stock: Number(stock), category, image }),
      });
      if (res.ok) {
        setName(''); setPrice(''); setStock(''); setImage('');
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStock = async (id: string, delta: number) => {
    const product = products.find(p => p._id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <BarberLoading message="CARREGANDO ESTOQUE..." />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <motion.div 
          className="luxury-card p-6 border border-orange-500/20"
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-bebas italic tracking-widest text-orange-500 mb-6">Novo Produto</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input 
              type="text" placeholder="Nome do Produto" required
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number" placeholder="Preço (R$)" required
                value={price} onChange={e => setPrice(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
              />
              <input 
                type="number" placeholder="Estoque Inicial" required
                value={stock} onChange={e => setStock(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
              />
            </div>
            <select 
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
            >
              <option value="Geral">Geral</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Cosméticos">Cosméticos</option>
              <option value="Acessórios">Acessórios</option>
            </select>
            <input 
              type="url" placeholder="URL da Imagem (Opcional)" 
              value={image} onChange={e => setImage(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-orange-500"
            />
            <button type="submit" className="btn-prime w-full py-4 text-xs">Adicionar ao Estoque</button>
          </form>
        </motion.div>

        <motion.div 
          className="lg:col-span-2 space-y-4"
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-xl font-bebas italic tracking-widest text-white">Inventário ({products.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p._id} className="luxury-card p-4 flex items-center gap-4 border-white/5 relative group">
                <button 
                    onClick={() => handleDelete(p._id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-500 transition-all text-xs"
                >
                    ✕
                </button>
                <div className="w-16 h-16 bg-neutral-800 rounded-xl overflow-hidden flex items-center justify-center">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-2xl">📦</span>}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{p.name}</h4>
                  <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{p.category}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-black text-white">R$ {p.price.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => updateStock(p._id, -1)} className="w-6 h-6 rounded bg-white/5 border border-white/5 text-white">-</button>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${p.stock < 5 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                          {p.stock}
                        </span>
                        <button onClick={() => updateStock(p._id, 1)} className="w-6 h-6 rounded bg-white/5 border border-white/5 text-white">+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
