'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Show after 5 seconds if not dismissed
    const hasDismissed = localStorage.getItem('installPromptDismissed');
    if (!hasDismissed) {
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('installPromptDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-[5000] md:left-auto md:right-8 md:bottom-8 md:w-80"
        >
          <div className="bg-[#111111] border border-orange-500/30 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden">
            {/* Glossy background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent pointer-events-none" />
            
            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white text-xl"
            >
              ✕
            </button>

            <div className="flex gap-4 items-center mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-orange-400/20">
                📱
              </div>
              <div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Dica de Acesso</p>
                <h4 className="text-sm font-bold text-white uppercase tracking-tight">Instalar Aplicativo</h4>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed mb-6">
              {isIOS 
                ? 'Toque no ícone de compartilhar (setinha) e escolha "Adicionar à Tela de Início" para usar como um app nativo.'
                : 'Instale nosso app para receber notificações e ter acesso rápido aos seus agendamentos.'}
            </p>

            {!isIOS && (
                <button 
                    onClick={() => {
                        // For Android, this usually triggers the browser's own prompt
                        // but we can't force it easily without the event.
                        // We just show instructions for now as backup.
                        alert('Toque nos três pontinhos do navegador e selecione "Instalar Aplicativo" ou "Adicionar à tela inicial".');
                        handleDismiss();
                    }}
                    className="w-full py-3 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl active:scale-95 transition-transform"
                >
                    Como Instalar
                </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
