'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import BarberLoading from './BarberLoading';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (isLogin) {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Artificial delay to show animation
        await new Promise(r => setTimeout(r, 1500));
        window.location.reload();
      }
    } else {
      if (!name || !email || !password || !phone) {
        setError('Preencha todos os campos obrigatórios.');
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password }),
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.message || 'Erro ao criar conta');
          setLoading(false);
        } else {
          // Auto-login after register
          await signIn('credentials', {
            redirect: false,
            email,
            password,
          });
          // Artificial delay to show animation
          await new Promise(r => setTimeout(r, 1500));
          window.location.reload();
        }
      } catch (err) {
        setError('Erro de conexão com o servidor.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <AnimatePresence>
        {loading && <BarberLoading message={isLogin ? 'ACESSANDO SEU CLUBE...' : 'CRIANDO SUA CONTA ELITE...'} />}
      </AnimatePresence>
      <motion.div 
        className="w-full max-w-md luxury-card p-6 md:p-12 relative overflow-hidden"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl md:text-9xl font-bebas pointer-events-none">GDC</div>
        
        <div className="text-center mb-8 md:mb-10">
          <div className="flex justify-center mb-6">
              <div className="relative w-40 h-28">
                <Image 
                    src="/logo.png" 
                    alt="Gigantes do Corte" 
                    width={160}
                    height={112}
                    priority
                    className="w-full h-full object-contain brightness-110 drop-shadow-[0_0_20px_rgba(234,88,12,0.4)]"
                />
              </div>
          </div>
          <p className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">{isLogin ? 'BEM-VINDO AO CLUBE' : 'CRIAR MINHA CONTA ELITE'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5"
              >
                <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950/50 border border-white/5 rounded-xl px-4 py-3.5 md:px-5 md:py-4 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                  placeholder="Seu nome"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950/50 border border-white/5 rounded-xl px-4 py-3.5 md:px-5 md:py-4 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
              placeholder="exemplo@email.com"
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Telefone</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-neutral-950/50 border border-white/5 rounded-xl px-4 py-3.5 md:px-5 md:py-4 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
                placeholder="(11) 99999-9999"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950/50 border border-white/5 rounded-xl px-4 py-3.5 md:px-5 md:py-4 text-white focus:outline-none focus:border-orange-500 transition-colors text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-[10px] font-bold text-center italic">{error}</p>
          )}

          <motion.button 
            type="submit" 
            disabled={loading} 
            className="btn-luxury w-full py-4 md:py-5 text-lg md:text-xl mt-2 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLogin ? 'ACESSAR MEU CLUBE' : 'ATIVAR CONTA ELITE'}
          </motion.button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-[9px] font-black text-neutral-500 uppercase tracking-widest hover:text-orange-500 transition-colors"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
