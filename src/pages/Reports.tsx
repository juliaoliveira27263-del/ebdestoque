import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import Badge from '../components/Badge';
import { exportToCSV } from '../lib/csv';
import type { Product, Industry, Movement } from '../lib/types';

interface StockByIndustry {
  name: string;
  stock: number;
}

interface MovementsByMonth {
  month: string;
  in: number;
  out: number;
}

export default function Reports() {
  const [stockByIndustry, setStockByIndustry] = useState<StockByIndustry[]>([]);
  const [movementsByMonth, setMovementsByMonth] = useState<MovementsByMonth[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setLoading(true);
    try {
      // Fetch products and industries separately (NO supabase join)
      const [productsRes, industriesRes, movementsRes] = await Promise.all([
        supabase.from('products').select('*').eq('active', true),
        supabase.from('industries').select('*'),
        supabase.from('movements').select('type, quantity, created_at').order('created_at', { ascending: false }).limit(500),
      ]);

      const products = (productsRes.data as Product[] | null) ?? [];
      const inds = (industriesRes.data as Industry[] | null) ?? [];
      const movements = (movementsRes.data as Movement[] | null) ?? [];

      setIndustries(inds);

      // Compute stock by industry manually
      const industryMap = new Map<string, string>();
      inds.forEach((ind) => industryMap.set(ind.id, ind.name));

      const stockMap = new Map<string, number>();
      products.forEach((p) => {
        if (p.industry_id) {
          stockMap.set(p.industry_id, (stockMap.get(p.industry_id) ?? 0) + p.stock_quantity);
        }
      });

      const chartData: StockByIndustry[] = inds.map((ind) => ({
        name: ind.name,
        stock: stockMap.get(ind.id) ?? 0,
      }));
      setStockByIndustry(chartData);

      // Low stock products
      const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock);
      setLowStockProducts(lowStock);

      // Movements by month (last 6 months)
      const monthMap = new Map<string, MovementsByMonth>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        monthMap.set(key, { month: label, in: 0, out: 0 });
      }

      movements.forEach((m) => {
        const d = new Date(m.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const entry = monthMap.get(key);
        if (entry) {
          if (m.type === 'in') {
            entry.in += m.quantity;
          } else if (m.type === 'out') {
            entry.out += m.quantity;
          }
        }
      });

      setMovementsByMonth(Array.from(monthMap.values()));
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }

  function getIndustryName(id: string | null): string {
    if (!id) return '-';
    const ind = industries.find((i) => i.id === id);
    return ind ? ind.name : '-';
  }

  function handleExportStock() {
    const headers = ['Indústria', 'Estoque Total'];
    const rows = stockByIndustry.map((s) => [s.name, s.stock]);
    exportToCSV('estoque-por-industria', headers, rows);
  }

  function handleExportLowStock() {
    const headers = ['Produto', 'SKU', 'Estoque', 'Estoque Mín', 'Indústria'];
    const rows = lowStockProducts.map((p) => [
      p.name,
      p.sku ?? '',
      p.stock_quantity,
      p.min_stock,
      getIndustryName(p.industry_id),
    ]);
    exportToCSV('estoque-baixo', headers, rows);
  }

  function handleExportMovements() {
    const headers = ['Mês', 'Entradas', 'Saídas'];
    const rows = movementsByMonth.map((m) => [m.month, m.in, m.out]);
    exportToCSV('movimentacoes-por-mes', headers, rows);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-400">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <p className="text-dark-400 mt-1">Análises e exportações</p>
      </div>

      {/* Stock by industry */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Estoque por indústria</h2>
          <button
            onClick={handleExportStock}
            className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition text-sm"
          >
            <Download size={16} /> CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockByIndustry}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Movements by month */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Movimentações por mês</h2>
          <button
            onClick={handleExportMovements}
            className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition text-sm"
          >
            <Download size={16} /> CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={movementsByMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Line type="monotone" dataKey="in" name="Entradas" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="out" name="Saídas" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Low stock products */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Produtos com estoque baixo</h2>
          <button
            onClick={handleExportLowStock}
            className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition text-sm"
          >
            <Download size={16} /> CSV
          </button>
        </div>
        {lowStockProducts.length === 0 ? (
          <p className="text-dark-400 text-center py-8">Nenhum produto com estoque baixo</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-950 border-b border-dark-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Produto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">SKU</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Estoque</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Mín</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Indústria</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-dark-950">
                    <td className="px-4 py-3 text-white">{p.name}</td>
                    <td className="px-4 py-3 text-dark-400">{p.sku ?? '-'}</td>
                    <td className="px-4 py-3 text-white">{p.stock_quantity} {p.unit}</td>
                    <td className="px-4 py-3 text-dark-400">{p.min_stock}</td>
                    <td className="px-4 py-3 text-dark-400">{getIndustryName(p.industry_id)}</td>
                    <td className="px-4 py-3">
                      {p.stock_quantity === 0 ? (
                        <Badge variant="error">Sem estoque</Badge>
                      ) : (
                        <Badge variant="warning">Estoque baixo</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
