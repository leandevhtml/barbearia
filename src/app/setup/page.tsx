'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function SetupPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [barbershopName, setBarbershopName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/barbershops/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barbershopName, slug }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao configurar barbearia.');
        setLoading(false);
      } else {
        // Atualiza a sessão (força re-leitura do token NextAuth) para pegar o novo 'role' e 'barbershopId'
        await update();
        
        // Redireciona para o app da barbearia recém-criada
        router.push(`/${data.slug}`);
      }
    } catch (err) {
      setError('Erro de conexão.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">CARREGANDO...</div>;
  }

  // Se o usuário não está logado ou já configurou a barbearia, manda embora.
  if (status === 'unauthenticated') {
    router.push('/');
    return null;
  }
  
  if (session && (session.user as any).role !== 'owner_pending') {
    if ((session.user as any).role === 'admin' && (session.user as any).barbershopId) {
       // Se der erro de redirect hardcoded, precisa tratar, mas a ideia é mandar para a barbearia
       // Como o slug não está na sessão no frontend, podemos apenas mandar para a home page de venda, 
       // mas se possível, seria melhor ter o slug.
       router.push('/'); 
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col items-center justify-center p-6 selection:bg-orange-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/10 via-transparent to-transparent pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10"
      >
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-orange-500 text-black rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 font-bold shadow-[0_0_30px_rgba(234,88,12,0.3)]">
            ⚙️
          </div>
          <h1 className="text-2xl font-black mb-1">Crie sua Conta Admin</h1>
          <p className="text-neutral-400 text-sm">Quase lá! Qual será o nome da sua barbearia na nossa plataforma?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 mb-2 block">Nome da Barbearia</label>
            <input 
              type="text" required
              value={barbershopName} onChange={e => setBarbershopName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
              placeholder="Ex: Barbearia do Zé"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-1 mb-2 block">Link de Acesso (URL)</label>
            <div className="flex items-stretch shadow-inner">
              <span className="bg-neutral-950 border border-white/10 border-r-0 rounded-l-xl px-4 py-4 text-neutral-500 text-sm flex items-center">
                app.com/
              </span>
              <input 
                type="text" required
                value={slug} onChange={handleSlugChange}
                className="w-full bg-black/50 border border-white/10 rounded-r-xl px-4 py-4 text-white focus:border-orange-500 outline-none transition-all"
                placeholder="barbearia-do-ze"
              />
            </div>
            <p className="text-[10px] text-neutral-500 mt-2 ml-1">Este será o link que você enviará para os seus clientes.</p>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-500/10 py-2 rounded-lg">{error}</p>}

          <button 
            type="submit" disabled={loading || !barbershopName || !slug}
            className="w-full py-4 mt-2 bg-gradient-to-r from-orange-500 to-amber-600 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(234,88,12,0.2)] hover:shadow-[0_0_30px_rgba(234,88,12,0.4)] disabled:opacity-50 disabled:grayscale"
          >
            {loading ? 'CONFIGURANDO SISTEMA...' : 'FINALIZAR CONFIGURAÇÃO'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
