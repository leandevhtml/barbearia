'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#ff6e00', '#ff913d', '#c2410c', '#7c2d12', '#ea580c', '#9a3412'];

function TTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-bright rounded-2xl p-4 text-xs border-orange-500/20 shadow-2xl">
      <p className="mb-2 font-black text-neutral-500 uppercase tracking-widest">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-black text-xl text-white drop-shadow-md">
          {p.name === 'revenue' ? `R$ ${Number(p.value).toFixed(2)}` : `${p.value} cortes`}
        </p>
      ))}
    </div>
  );
}

export default function FinancialDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 1d, 7d, 30d, 1y

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?range=${timeRange}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [timeRange]);

  const { totalRev = 0, totalCuts = 0, chartData = [], pieData = [] } = data || {};
  
  const avg = totalCuts > 0 ? totalRev / totalCuts : 0;
  const bestDay = chartData.reduce((prev: any, curr: any) => (curr.revenue > prev.revenue ? curr : prev), { revenue: 0, day: '-' });

  const getRangeText = () => {
    if (timeRange === '1d') return 'HOJE';
    if (timeRange === '7d') return '7 DIAS';
    if (timeRange === '30d') return '30 DIAS';
    return '1 ANO';
  };

  const kpis = [
    { label:`Receita (${getRangeText()})`, value:`R$ ${totalRev.toFixed(2)}`, icon:'💰', color:'#10b981', trend:getRangeText() },
    { label:'Atendimentos',   value:totalCuts,                    icon:'✂️', color:'var(--orange)', trend:getRangeText() },
    { label:'Ticket Médio',   value:`R$ ${avg.toFixed(2)}`,       icon:'🧾', color:'#f59e0b', trend:'MÉDIA' },
    { label:'Pico de Receita',value:`R$ ${bestDay.revenue.toFixed(2)}`, icon:'📈', color:'#06b6d4', trend:bestDay.day || '-' },
  ];

  if (loading && !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-orange-500 font-bebas text-xl tracking-widest animate-pulse">PROCESSANDO FINANÇAS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* ── Filter Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bebas italic tracking-widest text-white">Relatório <span className="text-orange-500">Financeiro</span></h2>
          <p className="text-sm font-bold text-neutral-400 uppercase">Acompanhe seus resultados e faturamento</p>
        </div>
        
        <div className="flex p-1 bg-neutral-900 border border-white/5 rounded-xl">
          {[
            { id: '1d', label: '1 Dia' },
            { id: '7d', label: '1 Semana' },
            { id: '30d', label: '1 Mês' },
            { id: '1y', label: '1 Ano' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                timeRange === r.id 
                  ? 'bg-orange-600 text-white shadow-lg' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label}
            className="glass rounded-3xl p-6 border card-hover relative overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
              style={{ background: k.color }} />
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">{k.icon}</div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-white/5 border border-white/5 text-white/70 uppercase tracking-widest">
                {k.trend}
              </span>
            </div>
            <p className="text-3xl font-black text-white tracking-tighter">{k.value}</p>
            <p className="text-xs font-black uppercase tracking-[0.2em] mt-1 text-neutral-400">{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Main Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Revenue Area Chart */}
        <motion.div className="glass rounded-[2rem] p-8 border border-white/5"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div className="flex justify-between items-start mb-8 relative">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-neutral-400 mb-1">Performance Financeira</p>
              <h4 className="text-2xl font-black text-white tracking-tighter">Receita no Período</h4>
            </div>
            <div className="text-right">
                <p className="text-2xl font-black text-white tracking-tighter drop-shadow-md">R$ {totalRev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs font-bold text-neutral-400">Volume total acumulado</p>
            </div>
            {loading && <div className="absolute top-0 right-0 w-full h-full bg-neutral-950/50 flex items-center justify-center z-10 backdrop-blur-[2px] rounded-[2rem]"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top:10, right:10, bottom:0, left:-20 }}>
                <defs>
                    <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff6e00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6e00" stopOpacity={0}    />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill:'#888', fontSize:12, fontWeight:700 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill:'#888', fontSize:12, fontWeight:700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TTip />} cursor={{ stroke: 'rgba(255,110,0,0.2)', strokeWidth: 2, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey="revenue" stroke="#ff6e00" strokeWidth={4}
                    fill="url(#orangeGrad)" dot={{ fill:'#ff6e00', strokeWidth:0, r:4 }}
                    activeDot={{ r:8, fill:'#fff', stroke:'#ff6e00', strokeWidth:4 }} />
                </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Volume Bar Chart */}
        <motion.div className="glass rounded-[2rem] p-8 border border-white/5"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
          <div className="flex justify-between items-start mb-8 relative">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.4em] text-neutral-400 mb-1">Volume de Clientes</p>
              <h4 className="text-2xl font-black text-white tracking-tighter">Atendimentos no Período</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white text-xl font-black shadow-lg">
                {totalCuts}
            </div>
            {loading && <div className="absolute top-0 right-0 w-full h-full bg-neutral-950/50 flex items-center justify-center z-10 backdrop-blur-[2px] rounded-[2rem]"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top:10, right:10, bottom:0, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill:'#888', fontSize:12, fontWeight:700 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill:'#888', fontSize:12, fontWeight:700 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TTip />} cursor={{ fill: 'rgba(255,110,0,0.1)' }} />
                <Bar dataKey="cuts" radius={[8,8,0,0]} maxBarSize={50} fill="#ff6e00" />
                </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Secondary Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Service Mix Pie */}
        <motion.div className="glass rounded-[2rem] p-8 border border-white/5 relative"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          {loading && <div className="absolute inset-0 bg-neutral-950/50 flex items-center justify-center z-10 backdrop-blur-[2px] rounded-[2rem]"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>}
          <p className="text-xs font-black uppercase tracking-[0.4em] text-neutral-400 mb-6">Mix de Serviços</p>
          <div className="h-[200px] w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85}
                  paddingAngle={8} dataKey="value" stroke="none">
                  {pieData.map((e: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6">
            {pieData.map((p: any, i: number) => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,110,0,0.3)]" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs font-black text-neutral-400">{p.name}</span>
                </div>
                <span className="text-xs font-black text-white">{p.value}%</span>
              </div>
            ))}
            {pieData.length === 0 && <p className="text-center text-xs text-neutral-600">Sem dados para exibir.</p>}
          </div>
        </motion.div>

        {/* Revenue Breakdown Card */}
        <motion.div className="glass rounded-[2rem] p-8 border border-white/5 xl:col-span-2 space-y-8"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-neutral-400 mb-6">Detalhamento de Receita</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Services vs Consumption */}
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Serviços vs Consumo</span>
                        <span className="text-xs font-bold text-neutral-500">{((data?.splits?.serviceRevenue / totalRev) * 100 || 0).toFixed(0)}% / {((data?.splits?.consumptionRevenue / totalRev) * 100 || 0).toFixed(0)}%</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                        <div className="h-full bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.5)]" style={{ width: `${(data?.splits?.serviceRevenue / totalRev) * 100 || 0}%` }} />
                        <div className="h-full bg-white/10" style={{ width: `${(data?.splits?.consumptionRevenue / totalRev) * 100 || 0}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                            <span className="text-neutral-400">Mão de Obra:</span>
                            <span className="text-white">R$ {data?.splits?.serviceRevenue?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-white/20"></span>
                            <span className="text-neutral-400">Produtos:</span>
                            <span className="text-white">R$ {data?.splits?.consumptionRevenue?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>

                {/* App vs Counter */}
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Origem do Pagamento</span>
                        <span className="text-xs font-bold text-neutral-500">{((data?.splits?.appRevenue / totalRev) * 100 || 0).toFixed(0)}% APP</span>
                    </div>
                    <div className="h-4 bg-white/5 rounded-full overflow-hidden flex border border-white/5">
                        <div className="h-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" style={{ width: `${(data?.splits?.appRevenue / totalRev) * 100 || 0}%` }} />
                        <div className="h-full bg-white/10" style={{ width: `${(data?.splits?.counterRevenue / totalRev) * 100 || 0}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-neutral-400">Pré-pago (App):</span>
                            <span className="text-white">R$ {data?.splits?.appRevenue?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-white/20"></span>
                            <span className="text-neutral-400">No Balcão:</span>
                            <span className="text-white">R$ {data?.splits?.counterRevenue?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-600/10 rounded-2xl flex items-center justify-center text-2xl">📊</div>
                  <div>
                      <p className="text-xs font-black text-white uppercase tracking-widest">Análise de Tendência</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase">Dados baseados em {getRangeText()}</p>
                  </div>
              </div>
              <p className="text-xs text-neutral-500 font-bold max-w-sm text-center md:text-right italic">
                Lembre-se: O lucro real depende do abatimento das comissões dos barbeiros e custo dos produtos.
              </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
