import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Industry } from '../lib/types';
import { Package, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: prodData }, { data: indData }] = await Promise.all([
        supabase.from('products').select('*').eq('active', true),
        supabase.from('industries').select('*').eq('active', true),
      ]);
      setProducts((prodData as Product[]) || []);
      setIndustries((indData as Industry[]) || []);
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

  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.quantity <= p.min_quantity);
  const totalIndustries = industries.length;
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);

  const stats = [
    { label: 'Total de Produtos', value: totalProducts, icon: Package, color: 'bg-primary-600' },
    { label: 'Itens em Estoque', value: totalItems, icon: Package, color: 'bg-primary-700' },
    { label: 'Estoque Baixo', value: lowStock.length, icon: AlertTriangle, color: 'bg-primary-500' },
    { label: 'Indústrias', value: totalIndustries, icon: Package, color: 'bg-primary-800' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${s.color}`}>
                <s.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Alertas de Estoque Baixo</h2>
          <div className="space-y-2">
            {lowStock.map((p) => {
              const indName = p.industries?.[0]?.name || 'N/A';
              return (
                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <span className="font-medium text-slate-900">{p.name}</span>
                    <span className="text-sm text-slate-500 ml-2">{p.sku}</span>
                  </div>
                  <div className="text-sm text-primary-700">
                    {p.quantity} {p.unit} (mín: {p.min_quantity})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
