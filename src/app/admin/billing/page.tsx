'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const PLANS = [
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 69,90',
    interval: '/mês',
    features: [
      'Até 3 Barbeiros',
      'Agendamentos ilimitados',
      'Painel do Barbeiro',
      'Programa de Fidelidade Básico',
    ],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 129,90',
    interval: '/mês',
    features: [
      'Barbeiros ilimitados',
      'Agendamentos ilimitados',
      'Sistema de Pagamentos Integrado',
      'Gestão Financeira Avançada',
      'Programa de Fidelidade Pro',
      'Suporte Prioritário',
    ],
    recommended: true,
  }
];

export default function BillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    setSelectedPlan(planId);
    
    // Simulação de chamada para o backend de assinatura (Stripe, Mercado Pago, etc.)
    try {
      // alert(`Redirecionando para pagamento do plano ${planId}...`);
      // Em um cenário real, chamariamos a API para criar um checkout
      // const res = await fetch('/api/billing/checkout', { method: 'POST', body: JSON.stringify({ planId }) });
      // const { url } = await res.json();
      // window.location.href = url;
      
      alert(`Integração de pagamento será implementada na próxima fase. Plano escolhido: ${planId}`);
      
    } catch (error) {
      console.error(error);
      alert('Erro ao iniciar assinatura');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-8 text-white">Carregando...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto text-white">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Planos e Assinatura</h1>
        <p className="text-neutral-400 max-w-2xl mx-auto">
          Escolha o plano ideal para a sua barbearia. Faça um upgrade para liberar mais recursos e potencializar seus ganhos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan) => (
          <div 
            key={plan.id}
            className={`relative bg-neutral-900 border rounded-2xl p-8 flex flex-col ${
              plan.recommended ? 'border-amber-500 shadow-2xl shadow-amber-500/10' : 'border-neutral-800'
            }`}
          >
            {plan.recommended && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-black text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                Mais Escolhido
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-neutral-400">{plan.interval}</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-300">
                  <span className="text-amber-500 mt-1">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold transition-colors ${
                plan.recommended 
                  ? 'bg-amber-500 hover:bg-amber-600 text-black' 
                  : 'bg-neutral-800 hover:bg-neutral-700 text-white'
              }`}
            >
              {loading && selectedPlan === plan.id ? 'Aguarde...' : 'Assinar Agora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
