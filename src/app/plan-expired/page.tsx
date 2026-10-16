'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PlanExpiredContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl text-center">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ⚠️
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-white">
          {reason === 'inactive' ? 'Barbearia Desativada' : 'Seu Trial Expirou'}
        </h1>
        
        <p className="text-neutral-400 mb-8">
          {reason === 'inactive' 
            ? 'O acesso à sua barbearia foi temporariamente suspenso. Entre em contato com o suporte.'
            : 'Seu período de teste de 7 dias chegou ao fim. Para continuar usando a plataforma e não perder seus dados, escolha um plano.'}
        </p>

        {isAdmin ? (
          <div className="space-y-4">
            <button 
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-xl transition-colors shadow-lg shadow-amber-500/20"
              onClick={() => router.push('/admin/billing')} // Redirecionar para página de faturamento
            >
              Ver Planos Disponíveis
            </button>
            <button 
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-4 rounded-xl transition-colors"
              onClick={() => router.push('/')}
            >
              Sair
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500 mb-4">
              Por favor, avise o dono da barbearia para renovar o plano.
            </p>
            <button 
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-4 rounded-xl transition-colors"
              onClick={() => router.push('/')}
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlanExpiredPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Carregando...</div>}>
      <PlanExpiredContent />
    </Suspense>
  );
}
