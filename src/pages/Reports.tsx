import { useEffect, useState, useMemo } from 'react';
import { Package, Factory, Users, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../lib/supabase';
import type { Product, Industry, Movement, Request } from '../lib/types';

type Tab = 'estoque' | 'saidas' | 'comparativo' | 'ranking';

export default function Reports() {
  const [tab, setTab] = useState<Tab>('estoque');
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, i, m, r] = await Promise.all([
        supabase.from('products').select('*, industry:industries(*)').order('name'),
        supabase.from('industries').select('*').order('name'),
        supabase.from('movements').select('*, product:products(*), profile:profiles(*)').order('created_at', { ascending: false }),
        supabase.from('requests').select('*, profile:profiles(*), request_items(*, product:products(*))').order('created_at', { ascending: false }),
      ]);
      setProducts(p.data as Product[] ?? []);
      setIndustries(i.data as Industry[] ?? []);
      setMovements(m.data as Movement[] ?? []);
      setRequests(r.data as Request[] ?? []);
      setLoading(false);
    })();
  }, []);

  const stockByIndustry = useMemo(() => industries.map((ind) => ({ name: ind.name.trim(), estoque: products.filter((p) => p.industry_id === ind.id).reduce((s, p) => s + p.stock_quantity, 0) })), [products, industries]);
  const lowStockProducts = useMemo(() => products.filter((p) => p.stock_quantity <= p.min_stock), [products]);
  const outMovements = useMemo(() => movements.filter((m) => m.type === 'out'), [movements]);
  const inVsOut = useMemo(() => [
    { name: 'Entradas', value: movements.filter((m) => m.type === 'in').reduce((s, m) => s + m.quantity, 0) },
    { name: 'Saídas', value: movements.filter((m) => m.type === 'out').reduce((s, m) => s + m.quantity, 0) },
  ], [movements]);
  const mostMovedProducts = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    movements.forEach((m) => { const n = m.product?.name ?? 'Desconhecido'; if (!counts[m.product_id]) counts[m.product_id] = { name: n, count: 0 }; counts[m.product_id].count += m.quantity; });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [movements]);
  const requestsByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months[d.toLocaleDateString('pt-BR', { month: 'short' })] = 0; }
    requests.forEach((r) => { const key = new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'short' }); if (key in months) months[key]++; });
    return Object.entries(months).map(([name, solicitacoes]) => ({ name, solicitacoes }));
  }, [requests]);
  const userRanking = useMemo(() => {
    const counts: Record<string, { name: string; requests: number; items: number }> = {};
    requests.forEach((r) => { const n = r.profile?.name ?? 'Desconhecido'; if (!counts[r.user_id]) counts[r.user_id] = { name: n, requests: 0, items: 0 }; counts[r.user_id].requests++; counts[r.user_id].items += r.total_items; });
    return Object.values(counts).sort((a, b) => b.requests - a.requests);
  }, [requests]);
  const productRanking = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    requests.forEach((r) => r.request_items?.forEach((item) => { const n = item.product?.name ?? 'Desconhecido'; if (!counts[item.product_id]) counts[item.product_id] = { name: n, count: 0 }; counts[item.product_id].count += item.quantity; }));
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [requests]);
  const industryRanking = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    movements.forEach((m) => { const n = m.product?.industry?.name?.trim() ?? 'Sem indústria'; const id = m.product?.industry_id ?? 'none'; if (!counts[id]) counts[id] = { name: n, count: 0 }; counts[id].count += m.quantity; });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [movements]);

  if (loading) return (<div className="flex items-center justify-center h-full p-8"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  const tabs: { id: Tab; label: string }[] = [{ id: 'estoque', label: 'Estoque Atual' }, { id: 'saidas', label: 'Saídas' }, { id: 'comparativo', label: 'Comparativo' }, { id: 'ranking', label: 'Ranking' }];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Relatórios</h1><p className="text-dark-400 text-sm mt-1">Análise e estatísticas do sistema</p></div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.id ? 'bg-primary-600 text-white' : 'bg-dark-800 text-dark-300 hover:text-white hover:bg-dark-700'}`}>{t.label}</button>))}
      </div>

      {tab === 'estoque' && (
        <div className="space-y-4">
          <div className="card p-5"><h2 className="text-white font-semibold mb-4">Estoque por Indústria</h2><ResponsiveContainer width="100%" height={300}><BarChart data={stockByIndustry}><CartesianGrid strokeDasharray="3 3" stroke="#2d2e34" /><XAxis dataKey="name" stroke="#6d6e78" fontSize={11} angle={-15} textAnchor="end" height={60} /><YAxis stroke="#6d6e78" fontSize={11} /><Tooltip contentStyle={{ background: '#1e1f24', border: '1px solid #3d3e45', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#2d2e34' }} /><Bar dataKey="estoque" fill="#C00000" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <div className="card p-5"><h2 className="text-white font-semibold mb-4">Estoque por Produto</h2><div className="space-y-2 max-h-96 overflow-y-auto">{products.map((p) => (<div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-700/30"><div className="min-w-0"><p className="text-white text-sm truncate">{p.name}</p><p className="text-dark-400 text-xs">{p.industry?.name?.trim() ?? 'Sem indústria'}</p></div><span className={p.stock_quantity <= p.min_stock ? 'badge-error' : 'badge-success'}>{p.stock_quantity} {p.unit}</span></div>))}</div></div>
          <div className="card p-5"><div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-warning-500" /><h2 className="text-white font-semibold">Produtos com Estoque Baixo</h2></div>{lowStockProducts.length === 0 ? <p className="text-dark-400 text-sm py-4 text-center">Nenhum produto com estoque baixo.</p> : <div className="space-y-2">{lowStockProducts.map((p) => (<div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-dark-700/30"><div className="min-w-0"><p className="text-white text-sm truncate">{p.name}</p><p className="text-dark-400 text-xs">{p.industry?.name?.trim() ?? 'Sem indústria'}</p></div><span className="badge-error">{p.stock_quantity} / {p.min_stock} {p.unit}</span></div>))}</div>}</div>
        </div>
      )}

      {tab === 'saidas' && (
        <div className="card p-5"><h2 className="text-white font-semibold mb-4">Saídas de Estoque</h2>{outMovements.length === 0 ? <p className="text-dark-400 text-sm py-4 text-center">Nenhuma saída registrada.</p> : <div className="space-y-2 max-h-[60vh] overflow-y-auto">{outMovements.map((m) => (<div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30"><div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{m.product?.name ?? 'Produto'}</p><div className="flex items-center gap-2 text-xs text-dark-400 mt-0.5"><span>{m.product?.industry?.name?.trim() ?? ''}</span>{m.profile && <span>· {m.profile.name}</span>}<span>· {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span></div>{m.reason && <p className="text-dark-400 text-xs mt-1">{m.reason}</p>}</div><span className="badge-error shrink-0">−{m.quantity} {m.product?.unit ?? 'un'}</span></div>))}</div>}</div>
      )}

      {tab === 'comparativo' && (
        <div className="space-y-4">
          <div className="card p-5"><h2 className="text-white font-semibold mb-4">Entradas x Saídas</h2><ResponsiveContainer width="100%" height={300}><BarChart data={inVsOut}><CartesianGrid strokeDasharray="3 3" stroke="#2d2e34" /><XAxis dataKey="name" stroke="#6d6e78" fontSize={11} /><YAxis stroke="#6d6e78" fontSize={11} /><Tooltip contentStyle={{ background: '#1e1f24', border: '1px solid #3d3e45', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#2d2e34' }} /><Bar dataKey="value" fill="#C00000" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <div className="card p-5"><h2 className="text-white font-semibold mb-4">Produtos Mais Movimentados</h2>{mostMovedProducts.length === 0 ? <p className="text-dark-400 text-sm py-4 text-center">Sem dados ainda.</p> : <ResponsiveContainer width="100%" height={300}><BarChart data={mostMovedProducts} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#2d2e34" /><XAxis type="number" stroke="#6d6e78" fontSize={11} /><YAxis type="category" dataKey="name" stroke="#6d6e78" fontSize={10} width={120} tick={{ fill: '#9b9ca3' }} /><Tooltip contentStyle={{ background: '#1e1f24', border: '1px solid #3d3e45', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#2d2e34' }} /><Bar dataKey="count" fill="#C00000" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer>}</div>
          <div className="card p-5"><h2 className="text-white font-semibold mb-4">Solicitações por Período (6 meses)</h2><ResponsiveContainer width="100%" height={300}><LineChart data={requestsByMonth}><CartesianGrid strokeDasharray="3 3" stroke="#2d2e34" /><XAxis dataKey="name" stroke="#6d6e78" fontSize={11} /><YAxis stroke="#6d6e78" fontSize={11} allowDecimals={false} /><Tooltip contentStyle={{ background: '#1e1f24', border: '1px solid #3d3e45', borderRadius: '8px', color: '#fff' }} /><Line type="monotone" dataKey="solicitacoes" stroke="#C00000" strokeWidth={2} dot={{ fill: '#C00000', r: 4 }} /></LineChart></ResponsiveContainer></div>
        </div>
      )}

      {tab === 'ranking' && (
        <div className="space-y-4">
          <div className="card p-5"><div className="flex items-center gap-2 mb-4"><Users className="w-5 h-5 text-primary-500" /><h2 className="text-white font-semibold">Usuários que Mais Solicitam</h2></div>{userRanking.length === 0 ? <p className="text-dark-400 text-sm py-4 text-center">Sem dados ainda.</p> : <div className="space-y-2">{userRanking.map((u, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-warning-500 text-white' : i === 1 ? 'bg-dark-300 text-dark-900' : i === 2 ? 'bg-orange-700 text-white' : 'bg-dark-600 text-dark-200'}`}>{i + 1}</div><div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{u.name}</p><p className="text-dark-400 text-xs">{u.requests} solicitações · {u.items} itens</p></div></div>))}</div>}</div>
          <div className="card p-5"><div className="flex items-center gap-2 mb-4"><Package className="w-5 h-5 text-primary-500" /><h2 className="text-white font-semibold">Produtos Mais Solicitados</h2></div>{productRanking.length === 0 ? <p className="text-dark-400 text-sm py-4 text-center">Sem dados ainda.</p> : <div className="space-y-2">{productRanking.slice(0, 10).map((p, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-warning-500 text-white' : i === 1 ? 'bg-dark-300 text-dark-900' : i === 2 ? 'bg-orange-700 text-white' : 'bg-dark-600 text-dark-200'}`}>{i + 1}</div><p className="text-white text-sm font-medium flex-1 truncate">{p.name}</p><span className="badge-primary shrink-0">{p.count}</span></div>))}</div>}</div>
          <div className="card p-5"><div className="flex items-center gap-2 mb-4"><Factory className="w-5 h-5 text-primary-500" /><h2 className="text-white font-semibold">Indústrias Mais Movimentadas</h2></div>{industryRanking.length === 0 ? <p className="text-dark-400 text-sm py-4 text-center">Sem dados ainda.</p> : <div className="space-y-2">{industryRanking.map((ind, i) => (<div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/30"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-warning-500 text-white' : i === 1 ? 'bg-dark-300 text-dark-900' : i === 2 ? 'bg-orange-700 text-white' : 'bg-dark-600 text-dark-200'}`}>{i + 1}</div><p className="text-white text-sm font-medium flex-1 truncate">{ind.name}</p><span className="badge-primary shrink-0">{ind.count}</span></div>))}</div>}</div>
        </div>
      )}
    </div>
  );
}
