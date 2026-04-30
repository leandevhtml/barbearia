import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BarberLoading from '@/components/shared/BarberLoading';
import { Package, Plus, Trash2, Search, Upload, FileText, ChevronRight, Check, AlertCircle, ShoppingCart, Image as ImageIcon, X, Edit3 } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  'cerveja': 'Bebidas',
  'refrigerante': 'Bebidas',
  'suco': 'Bebidas',
  'agua': 'Bebidas',
  'shampoo': 'Cosméticos',
  'pomada': 'Cosméticos',
  'gel': 'Cosméticos',
  'oleo': 'Cosméticos',
  'barba': 'Cosméticos',
  'tesoura': 'Acessórios',
  'pente': 'Acessórios',
  'capa': 'Acessórios',
  'navalha': 'Acessórios'
};

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('Geral');
  const [image, setImage] = useState('');
  
  // UI states
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('Tudo');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Smart Auto-Categorization
  useEffect(() => {
    const lowerName = name.toLowerCase();
    for (const [key, cat] of Object.entries(CATEGORY_KEYWORDS)) {
      if (lowerName.includes(key)) {
        setCategory(cat);
        break;
      }
    }
  }, [name]);

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


  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          price: Number(price), 
          stock: Number(stock), 
          category, 
          image 
        }),
      });
      if (res.ok) {
        setSuccess(editingProductId ? 'Produto atualizado com sucesso!' : 'Produto adicionado ao estoque!');
        resetForm();
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erro ao salvar produto');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const resetForm = () => {
    setName(''); setPrice(''); setStock(''); setImage(''); setCategory('Geral');
    setIsInvoiceMode(false);
    setEditingProductId(null);
  };

  const handleEditClick = (p: Product) => {
    setEditingProductId(p._id);
    setName(p.name);
    setPrice(p.price.toString());
    setStock(p.stock.toString());
    setCategory(p.category);
    setImage(p.image || '');
    setIsInvoiceMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await fetch(`/api/products/${productToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
        setSuccess('Produto removido com sucesso!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao remover o produto.');
    } finally {
      setProductToDelete(null);
    }
  };

  const filteredProducts = products.filter(p => activeFilter === 'Tudo' || p.category === activeFilter);

  if (loading) return <BarberLoading message="CARREGANDO ESTOQUE..." />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Formulário / Entrada */}
        <motion.div 
          className="lg:col-span-1 space-y-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="luxury-card p-8 border border-orange-500/20 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bebas italic tracking-widest text-orange-500">
                {editingProductId ? 'Editar Produto' : isInvoiceMode ? 'Entrada por Nota' : 'Gestão de Itens'}
              </h3>
              <button 
                onClick={() => setIsInvoiceMode(!isInvoiceMode)}
                className={`p-2 rounded-lg transition-all border ${isInvoiceMode ? 'bg-orange-600 text-white border-orange-400' : 'bg-neutral-900 text-neutral-500 border-white/5'}`}
                title={isInvoiceMode ? "Mudar para Cadastro Manual" : "Mudar para Entrada por Nota"}
              >
                <FileText size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Image Section */}
              <div className="relative group">
                <div className="w-full h-48 rounded-2xl bg-neutral-900/50 border border-white/10 overflow-hidden flex items-center justify-center relative shadow-inner">
                  {image ? (
                    <>
                      <img 
                        src={image} 
                        alt="Preview"
                        className="w-full h-full object-contain p-4" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <button 
                        type="button" onClick={() => { setImage(''); setError(''); }}
                        className="absolute top-2 right-2 bg-black/60 w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-red-600 transition-all border border-white/10 z-20"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-neutral-600">
                      <ImageIcon size={48} strokeWidth={1} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Sem Imagem</p>
                    </div>
                  )}
                </div>
                
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex w-full justify-center px-4">
                  <button 
                    type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full max-w-[200px] bg-neutral-900 border border-white/10 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase text-white hover:border-orange-500 transition-all flex items-center justify-center gap-2 shadow-2xl"
                  >
                    <Upload size={12} /> Fazer Upload
                  </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              </div>

              <div className="pt-8 space-y-4">
                {isInvoiceMode && (
                  <div className="p-4 rounded-xl bg-orange-600/5 border border-dashed border-orange-500/30 flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <FileText className="text-orange-500" size={24} />
                      <div>
                        <p className="text-[10px] font-black text-orange-500 uppercase leading-none mb-1 tracking-tighter">Anexo de Nota</p>
                        <p className="text-[11px] text-white font-bold">PDF ou XML</p>
                      </div>
                    </div>
                    <button 
                      type="button" onClick={() => invoiceFileRef.current?.click()}
                      className="bg-orange-600 px-3 py-1.5 rounded-lg text-[9px] font-black text-white uppercase shadow-lg shadow-orange-900/20"
                    >
                      Anexar
                    </button>
                    <input type="file" ref={invoiceFileRef} className="hidden" />
                  </div>
                )}

                <div className="space-y-4">
                  <input 
                    type="text" placeholder="Nome do Produto / Acessório" required
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-500 uppercase font-black ml-1">Preço Sugerido</label>
                      <input 
                        type="number" step="0.01" required
                        value={price} onChange={e => setPrice(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-neutral-500 uppercase font-black ml-1">Quantidade</label>
                      <input 
                        type="number" required
                        value={stock} onChange={e => setStock(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-orange-500 transition-colors outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-neutral-500 uppercase font-black ml-1">Tipo de Mercadoria</label>
                    <div className="relative">
                      <select 
                        value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:border-orange-500 transition-colors outline-none appearance-none cursor-pointer"
                      >
                        <option value="Geral">📦 Geral</option>
                        <option value="Bebidas">🥤 Bebidas</option>
                        <option value="Cosméticos">🧪 Cosméticos</option>
                        <option value="Acessórios">🎩 Acessórios</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                        <ChevronRight size={14} className="rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <AnimatePresence>
                {success && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                    <Check size={14} className="text-green-500" />
                    <p className="text-[10px] font-black text-green-500 uppercase">{success}</p>
                  </motion.div>
                )}
                {error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle size={14} className="text-red-500" />
                    <p className="text-[10px] font-black text-red-500 uppercase">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <button type="submit" className="btn-prime w-full py-5 text-xs tracking-[0.2em] flex items-center justify-center gap-3">
                {isInvoiceMode ? <><Plus size={16} /> Confirmar Entrada</> : editingProductId ? <><Check size={16} /> Salvar Alterações</> : <><ShoppingCart size={16} /> Adicionar ao Clube</>}
              </button>

              {editingProductId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="w-full py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-2 text-neutral-400 hover:text-white transition-colors bg-neutral-900 border border-white/5 rounded-xl mt-2"
                >
                  <X size={14} /> Cancelar Edição
                </button>
              )}
            </form>
          </div>
        </motion.div>

        {/* Lado Direito: Grid de Produtos */}
        <motion.div 
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bebas italic tracking-widest text-white">Prateleira Digital <span className="text-orange-500 ml-2">({filteredProducts.length})</span></h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar w-full max-w-[200px] md:max-w-none pb-2">
              {['Tudo', 'Bebidas', 'Cosméticos', 'Acessórios'].map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setActiveFilter(cat)}
                  className={`shrink-0 px-4 py-2 rounded-lg border text-[9px] font-black uppercase transition-all whitespace-nowrap ${
                    activeFilter === cat 
                      ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                      : 'bg-neutral-900 text-neutral-500 border-white/5 hover:text-white hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map(p => (
              <motion.div 
                key={p._id} 
                layout
                className="luxury-card p-6 flex items-center gap-5 border-white/5 relative group hover:border-orange-500/30 transition-all overflow-hidden"
              >
                <div className="absolute -right-4 -bottom-4 opacity-5 text-neutral-500 group-hover:text-orange-500 transition-colors">
                  <Package size={80} />
                </div>

                <div className="w-24 h-24 bg-neutral-900/80 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-2xl flex-shrink-0 border border-white/5">
                  {p.image ? (
                    <img src={p.image} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <span className="text-3xl grayscale group-hover:grayscale-0 transition-all text-neutral-800">📦</span>
                  )}
                </div>

                {/* Action Buttons - Absolute Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  <button 
                    onClick={() => handleEditClick(p)}
                    className="w-8 h-8 rounded-full bg-black/60 text-neutral-400 hover:text-orange-500 hover:bg-black/80 transition-all flex items-center justify-center border border-white/5"
                    title="Editar"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(p._id)}
                    className="w-8 h-8 rounded-full bg-black/60 text-neutral-400 hover:text-red-500 hover:bg-black/80 transition-all flex items-center justify-center border border-white/5"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex-1 min-w-0 z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="pr-20"> {/* Extra padding for the buttons */}
                      <h4 className="font-black text-lg text-white leading-tight break-words uppercase tracking-tighter">
                        {p.name}
                      </h4>
                    </div>
                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-1 italic">{p.category}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-end justify-between gap-3 mt-4">
                    <div className="shrink-0">
                      <p className="text-[9px] text-neutral-500 uppercase font-black">Preço</p>
                      <span className="text-lg font-black text-white tracking-tighter leading-none block">R$ {p.price.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-white/5 shrink-0 ml-auto">
                      <button 
                        onClick={() => updateStock(p._id, -1)}
                        className="w-8 h-8 rounded-lg bg-neutral-900 text-white font-black hover:bg-orange-600 transition-colors text-sm"
                      >-</button>
                      <div className="px-2 flex flex-col items-center min-w-[32px]">
                        <span className={`text-xs font-black leading-none ${p.stock < 10 ? 'text-red-500' : 'text-green-500'}`}>{p.stock}</span>
                        <span className="text-[7px] font-black text-neutral-600 uppercase">UN</span>
                      </div>
                      <button 
                        onClick={() => updateStock(p._id, 1)}
                        className="w-8 h-8 rounded-lg bg-neutral-900 text-white font-black hover:bg-orange-600 transition-colors text-sm"
                      >+</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {products.length === 0 && (
              <div className="col-span-full py-20 text-center glass-panel rounded-[2.5rem] border-dashed border-white/10 opacity-30">
                <div className="text-5xl mb-4">📦</div>
                <h4 className="text-xl font-bebas italic tracking-widest">Estoque Vazio</h4>
                <p className="text-xs font-bold text-neutral-500 uppercase mt-2">Nenhum item disponível para o Clube</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <AlertCircle size={32} />
                </div>
                
                <div>
                  <h3 className="text-xl font-bebas italic tracking-wider text-white">Confirmar Exclusão</h3>
                  <p className="text-sm text-neutral-400 mt-2">
                    Tem certeza que deseja remover este produto da sua prateleira digital? Esta ação não pode ser desfeita.
                  </p>
                </div>
                
                <div className="flex gap-3 w-full pt-4">
                  <button
                    onClick={() => setProductToDelete(null)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
