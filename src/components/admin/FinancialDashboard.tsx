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
        <p key={p.name} className="font-black text-xl text-orange-500">
          {p.name === 'revenue' ? `R$ ${Number(p.value).toFixed(2)}` : `${p.value} cortes`}
        </p>
      ))}
    </div>
  );
}

export default function FinancialDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const { todayRev = 0, todayCuts = 0, weeklyData = [], pieData = [] } = data || {};
  
  const weekRev = weeklyData.reduce((s: number, d: any) => s + d.revenue, 0);
  const weekCuts = weeklyData.reduce((s: number, d: any) => s + d.cuts, 0);
  const avg = todayCuts > 0 ? todayRev / todayCuts : 0;

  const kpis = [
    { label:'Receita Diária', value:`R$ ${todayRev.toFixed(2)}`, icon:'💰', color:'#10b981', trend:'HOJE' },
    { label:'Atendimentos',   value:todayCuts,                    icon:'✂️', color:'var(--orange)', trend:`HOJE` },
    { label:'Ticket Médio',   value:`R$ ${avg.toFixed(2)}`,       icon:'🧾', color:'#f59e0b', trend:'MÉDIA' },
    { label:'Total Semanal',  value:`R$ ${weekRev.toLocaleString('pt-BR')}`, icon:'📈', color:'#06b6d4', trend:'7 DIAS' },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-orange-500 font-bebas text-xl tracking-widest animate-pulse">PROCESSANDO FINANÇAS...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

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
              <span className="text-[10px] font-black px-3 py-1 rounded-full bg-white/5 border border-white/5 text-white/50 uppercase tracking-widest">
                {k.trend}
              </span>
            </div>
            <p className="text-3xl font-black text-white tracking-tighter">{k.value}</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-1 text-neutral-500">{k.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Main Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Revenue Area Chart */}
        <motion.div className="glass rounded-[2rem] p-8 border border-white/5"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mb-1">Performance Financeira</p>
              <h4 className="text-2xl font-black text-white tracking-tighter">Receita nos Últimos 7 Dias</h4>
            </div>
            <div className="text-right">
                <p className="text-2xl font-black text-orange-500 tracking-tighter">R$ {weekRev.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] font-bold text-neutral-500">Volume total acumulado</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top:10, right:10, bottom:0, left:-20 }}>
                <defs>
                    <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ff6e00" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff6e00" stopOpacity={0}    />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill:'#444', fontSize:11, fontWeight:800 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill:'#444', fontSize:11, fontWeight:800 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TTip />} />
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
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mb-1">Volume de Clientes</p>
              <h4 className="text-2xl font-black text-white tracking-tighter">Atendimentos por Dia</h4>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-500 text-xl font-black">
                {weekCuts}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top:10, right:10, bottom:0, left:-20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill:'#444', fontSize:11, fontWeight:800 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill:'#444', fontSize:11, fontWeight:800 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TTip />} />
                <Bar dataKey="cuts" radius={[8,8,0,0]} barSize={40}>
                    {weeklyData.map((_: any, i: number) => (
                    <Cell key={i} fill={i === weeklyData.length - 1 ? 'var(--orange)' : 'rgba(255,255,255,0.05)'} 
                          className="hover:fill-orange-400 transition-colors duration-300" />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ── Secondary Charts ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Service Mix Pie */}
        <motion.div className="glass rounded-[2rem] p-8 border border-white/5"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mb-6">Mix de Serviços</p>
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

        {/* Long term trend info card */}
        <motion.div className="glass rounded-[2rem] p-8 border border-white/5 xl:col-span-2 flex flex-col justify-center items-center text-center space-y-4"
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
          <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center text-4xl mb-2">💎</div>
          <h4 className="text-2xl font-bebas italic text-white tracking-widest uppercase">Clube Gigantes do Corte</h4>
          <p className="text-xs font-bold text-neutral-500 max-w-sm">
            Os dados acima refletem apenas atendimentos finalizados. O sistema de fidelidade e estoque é atualizado em tempo real no momento do checkout.
          </p>
          <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
             <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Status do Servidor: Operacional</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
