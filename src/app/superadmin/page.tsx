'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Barbershop {
  _id: string;
  name: string;
  slug: string;
  ownerName: string;
  adminEmail: string;
  plan: string;
  isActive: boolean;
  trialEndsAt: string;
  totalBarbers: number;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (session?.user && (session.user as any).role !== 'superadmin') {
      router.push('/'); // Redireciona se não for superadmin
    }
  }, [status, session, router]);

  useEffect(() => {
    if ((session?.user as any)?.role === 'superadmin') {
      fetchBarbershops();
    }
  }, [session]);

  const fetchBarbershops = async () => {
    try {
      const res = await fetch('/api/superadmin/barbershops');
      if (res.ok) {
        const data = await res.json();
        setBarbershops(data);
      }
    } catch (error) {
      console.error('Erro ao buscar barbearias', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">Carregando painel master...</div>;
  }

  // Estatísticas Rápidas
  const totalShops = barbershops.length;
  const activeTrials = barbershops.filter(s => s.plan === 'trial' && s.isActive).length;
  const paidPlans = barbershops.filter(s => (s.plan === 'basic' || s.plan === 'pro') && s.isActive).length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚀 Painel SaaS Master</h1>
            <p className="text-neutral-400">Visão global de todas as barbearias cadastradas na plataforma.</p>
          </div>
          <button 
            onClick={() => router.push('/api/auth/signout')}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm transition-colors"
          >
            Sair
          </button>
        </header>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-neutral-400 text-sm font-medium mb-1">Total de Barbearias</h3>
            <p className="text-3xl font-bold text-white">{totalShops}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-neutral-400 text-sm font-medium mb-1">Em Período de Teste (Trial)</h3>
            <p className="text-3xl font-bold text-amber-500">{activeTrials}</p>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
            <h3 className="text-neutral-400 text-sm font-medium mb-1">Assinaturas Ativas</h3>
            <p className="text-3xl font-bold text-green-500">{paidPlans}</p>
          </div>
        </div>

        {/* Tabela de Clientes */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 text-sm">
                <th className="p-4 font-medium">Barbearia</th>
                <th className="p-4 font-medium">Responsável</th>
                <th className="p-4 font-medium">Plano</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-center">Barbeiros</th>
                <th className="p-4 font-medium">Data Cadastro</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {barbershops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">Nenhuma barbearia cadastrada ainda.</td>
                </tr>
              ) : (
                barbershops.map((shop) => {
                  const isTrial = shop.plan === 'trial';
                  const trialEnds = new Date(shop.trialEndsAt);
                  const isExpired = isTrial && new Date() > trialEnds;

                  return (
                    <tr key={shop._id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-white">{shop.name}</div>
                        <div className="text-xs text-neutral-500">/{shop.slug}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{shop.ownerName}</div>
                        <div className="text-xs text-neutral-500">{shop.adminEmail}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                          shop.plan === 'pro' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 
                          shop.plan === 'basic' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                          'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {shop.plan}
                        </span>
                      </td>
                      <td className="p-4">
                        {!shop.isActive ? (
                          <span className="text-red-500 text-sm">Suspenso</span>
                        ) : isExpired ? (
                          <span className="text-red-400 text-sm font-medium">Trial Expirado</span>
                        ) : (
                          <span className="text-green-500 text-sm">Ativo</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-neutral-300">
                        {shop.totalBarbers}
                      </td>
                      <td className="p-4 text-sm text-neutral-400">
                        {new Date(shop.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-right">
                        <button className="text-xs px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-white transition-colors">
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
