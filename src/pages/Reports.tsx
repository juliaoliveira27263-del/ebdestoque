import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Industry, Movement } from '../lib/types';
import { movementTypeLabels } from '../lib/types';
import Badge from '../components/Badge';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#ef4444', '#f87171'];

export default function Reports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: prodData }, { data: indData }, { data: movData }] = await Promise.all([
        supabase.from('products').select('*, industries(name)').eq('active', true),
        supabase.from('industries').select('*').eq('active', true),
        supabase.from('movements').select('*, products(name, sku)').order('created_at', { ascending: false }).limit(100),
      ]);
      setProducts((prodData as Product[]) || []);
      setIndustries((indData as Industry[]) || []);
      setMovements((movData as Movement[]) || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const industryMap = new Map(industries.map((i) => [i.id, i.name]));

  const stockByIndustry = industries.map((i) => ({
    name: i.name,
    quantidade: products.filter((p) => p.industry_id === i.id).reduce((sum, p) => sum + p.quantity, 0),
  }));

  const productsByIndustry = industries.map((i) => ({
    name: i.name,
    produtos: products.filter((p) => p.industry_id === i.id).length,
  }));

  const movementsByType = (['in', 'out', 'adjustment'] as const).map((t) => ({
    name: movementTypeLabels[t],
    quantidade: movements.filter((m) => m.type === t).length,
  }));

  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    return d;
  });

  const movementsByDay = last7Days.map((d) => {
    const dayStr = d.toISOString().slice(0, 10);
    const count = movements.filter((m) => m.created_at.slice(0, 10) === dayStr).length;
    return { name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), movimentacoes: count };
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Relatórios</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Estoque por Indústria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockByIndustry}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Produtos por Indústria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={productsByIndustry} dataKey="produtos" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {productsByIndustry.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Movimentações por Tipo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={movementsByType}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantidade" fill="#b91c1c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Movimentações (Últimos 7 dias)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementsByDay}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="movimentacoes" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Inventário Completo</h2>
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Produto</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">SKU</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Indústria</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Qtd</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const indName = industryMap.get(p.industry_id) || 'N/A';
              const isLow = p.quantity <= p.min_quantity;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{indName}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{p.quantity} {p.unit}</td>
                  <td className="px-4 py-3">
                    {isLow ? <Badge variant="warning">Estoque baixo</Badge> : <Badge variant="success">OK</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
