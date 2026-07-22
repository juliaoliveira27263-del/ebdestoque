import { useEffect, useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { Product, Industry, Movement } from '../lib/types';
import { exportToCSV } from '../lib/csv';

export default function Reports() {
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: productsData }, { data: industriesData }, { data: movementsData }] = await Promise.all([
        supabase.from('products').select('*').eq('active', true),
        supabase.from('industries').select('*'),
        supabase.from('movements').select('*').order('created_at', { ascending: false }).limit(500),
      ]);
      setProducts((productsData as Product[] | null) ?? []);
      setIndustries((industriesData as Industry[] | null) ?? []);
      setMovements((movementsData as Movement[] | null) ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const stockByIndustry = industries.map(ind => {
    const total = products.filter(p => p.industry_id === ind.id).reduce((sum, p) => sum + p.stock_quantity, 0);
    return { name: ind.name, quantidade: total };
  }).filter(item => item.quantidade > 0);

  const movementsByMonth = movements.reduce((acc: { name: string; entradas: number; saidas: number }[], m) => {
    const date = new Date(m.created_at);
    const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
    let entry = acc.find(a => a.name === monthKey);
    if (!entry) { entry = { name: monthKey, entradas: 0, saidas: 0 }; acc.push(entry); }
    if (m.type === 'in') entry.entradas += m.quantity;
    else if (m.type === 'out') entry.saidas += m.quantity;
    return acc;
  }, []).reverse().slice(-6);

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock);

  const handleExportStock = () => {
    exportToCSV('relatorio_estoque.csv', ['Produto', 'SKU', 'Estoque', 'Min', 'Status'],
      products.map(p => [p.name, p.sku ?? '', p.stock_quantity, p.min_stock,
        p.stock_quantity === 0 ? 'Sem estoque' : p.stock_quantity <= p.min_stock ? 'Baixo' : 'Normal']));
  };

  const handleExportMovements = () => {
    exportToCSV('relatorio_movimentacoes.csv', ['Produto', 'Tipo', 'Quantidade', 'Motivo', 'Data'],
      movements.map(m => [m.product_id, m.type, m.quantity, m.reason ?? '', new Date(m.created_at).toLocaleDateString('pt-BR')]));
  };

  if (loading) return <div className="p-6 text-center text-dark-400">Carregando...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <p className="text-dark-400 text-sm mt-1">Análises e exportações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Estoque por Indústria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockByIndustry}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
              <Bar dataKey="quantidade" fill="#C00000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Movimentações por Mês</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="entradas" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="saidas" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Produtos com Estoque Baixo</h3>
          <span className="text-dark-400 text-sm">{lowStockProducts.length} produto(s)</span>
        </div>
        {lowStockProducts.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-8">Nenhum produto com estoque baixo</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-800">
                  <th className="text-left p-3 text-dark-300 text-sm font-semibold">Produto</th>
                  <th className="text-right p-3 text-dark-300 text-sm font-semibold">Estoque</th>
                  <th className="text-right p-3 text-dark-300 text-sm font-semibold">Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => (
                  <tr key={p.id} className="border-b border-dark-800 last:border-0">
                    <td className="p-3 text-white text-sm">{p.name}</td>
                    <td className="p-3 text-right text-white text-sm">{p.stock_quantity}</td>
                    <td className="p-3 text-right text-dark-300 text-sm">{p.min_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={handleExportStock} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-dark-800 text-white text-sm font-medium hover:bg-dark-700 transition-colors">
          <Download size={18} /> Exportar Relatório de Estoque
        </button>
        <button onClick={handleExportMovements} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-dark-800 text-white text-sm font-medium hover:bg-dark-700 transition-colors">
          <Download size={18} /> Exportar Relatório de Movimentações
        </button>
      </div>
    </div>
  );
}
