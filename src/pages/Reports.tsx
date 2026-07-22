import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { exportToCSV } from '../lib/csv';
import { toast } from 'sonner';
import { Product } from '../lib/types';

interface StockByIndustry {
  name: string;
  stock: number;
}

interface MovementByMonth {
  month: string;
  entradas: number;
  saidas: number;
  ajustes: number;
}

interface LowStockProduct extends Product {
  industry_name: string | undefined;
}

export default function Reports() {
  const [stockByIndustry, setStockByIndustry] = useState<StockByIndustry[]>([]);
  const [movementsByMonth, setMovementsByMonth] = useState<MovementByMonth[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [stockRes, movementsRes, lowStockRes] = await Promise.all([
        supabase.from('products').select('stock_quantity, industries(name)'),
        supabase.from('movements').select('type, quantity, created_at'),
        supabase
          .from('products')
          .select('*, industries(name)')
          .eq('active', true)
          .order('stock_quantity', { ascending: true }),
      ]);

      if (stockRes.error) throw stockRes.error;
      if (movementsRes.error) throw movementsRes.error;
      if (lowStockRes.error) throw lowStockRes.error;

      // Stock by industry
      const industryMap: Record<string, number> = {};
      (stockRes.data ?? []).forEach((item: { stock_quantity: number; industries: { name: string }[] | null }) => {
        const name = item.industries?.[0]?.name ?? 'Sem Indústria';
        industryMap[name] = (industryMap[name] ?? 0) + (item.stock_quantity ?? 0);
      });
      setStockByIndustry(
        Object.entries(industryMap).map(([name, stock]: [string, number]) => ({ name, stock })),
      );

      // Movements by month
      const monthMap: Record<string, MovementByMonth> = {};
      (movementsRes.data ?? []).forEach((m: { type: string; quantity: number; created_at: string }) => {
        const date = new Date(m.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { month: monthLabel, entradas: 0, saidas: 0, ajustes: 0 };
        }
        if (m.type === 'in') {
          monthMap[monthKey].entradas += m.quantity;
        } else if (m.type === 'out') {
          monthMap[monthKey].saidas += m.quantity;
        } else {
          monthMap[monthKey].ajustes += m.quantity;
        }
      });
      setMovementsByMonth(Object.values(monthMap).sort((a: MovementByMonth, b: MovementByMonth) => a.month.localeCompare(b.month)));

      // Low stock products
      const lowStock = (lowStockRes.data ?? [])
        .filter((p: Product) => p.stock_quantity <= p.min_stock)
        .map((p: Product & { industries: { name: string }[] | null }) => ({
          ...p,
          industry_name: p.industries?.[0]?.name,
        }));
      setLowStockProducts(lowStock);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar relatórios';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportStock = (): void => {
    const headers = ['Indústria', 'Estoque Total'];
    const rows = stockByIndustry.map((s: StockByIndustry) => [s.name, s.stock]);
    exportToCSV('estoque_por_industria.csv', headers, rows);
  };

  const handleExportMovements = (): void => {
    const headers = ['Mês', 'Entradas', 'Saídas', 'Ajustes'];
    const rows = movementsByMonth.map((m: MovementByMonth) => [m.month, m.entradas, m.saidas, m.ajustes]);
    exportToCSV('movimentacoes_por_mes.csv', headers, rows);
  };

  const handleExportLowStock = (): void => {
    const headers = ['Produto', 'SKU', 'Estoque Atual', 'Estoque Mínimo', 'Indústria'];
    const rows = lowStockProducts.map((p: LowStockProduct) => [
      p.name,
      p.sku ?? '',
      p.stock_quantity,
      p.min_stock,
      p.industry_name ?? '',
    ]);
    exportToCSV('estoque_baixo.csv', headers, rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
        <p className="text-dark-400 mt-1">Análises e exportações</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : (
        <>
          {/* Stock by Industry */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Estoque por Indústria</h2>
              <button
                onClick={handleExportStock}
                className="px-3 py-1.5 text-sm bg-dark-700 border border-dark-600 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Exportar CSV
              </button>
            </div>
            {stockByIndustry.length === 0 ? (
              <p className="text-dark-400 text-center py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockByIndustry}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Movements by Month */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Movimentações por Mês</h2>
              <button
                onClick={handleExportMovements}
                className="px-3 py-1.5 text-sm bg-dark-700 border border-dark-600 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Exportar CSV
              </button>
            </div>
            {movementsByMonth.length === 0 ? (
              <p className="text-dark-400 text-center py-8">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={movementsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#9ca3af' }} />
                  <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="ajustes" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Low Stock Products */}
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Produtos com Estoque Baixo</h2>
              <button
                onClick={handleExportLowStock}
                className="px-3 py-1.5 text-sm bg-dark-700 border border-dark-600 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Exportar CSV
              </button>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-dark-400 text-center py-8">Nenhum produto com estoque baixo</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left p-3 text-dark-300 font-semibold">Produto</th>
                      <th className="text-left p-3 text-dark-300 font-semibold">SKU</th>
                      <th className="text-left p-3 text-dark-300 font-semibold">Estoque</th>
                      <th className="text-left p-3 text-dark-300 font-semibold">Mínimo</th>
                      <th className="text-left p-3 text-dark-300 font-semibold">Indústria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((product: LowStockProduct) => (
                      <tr
                        key={product.id}
                        className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                      >
                        <td className="p-3 text-white">{product.name}</td>
                        <td className="p-3 text-dark-300">{product.sku ?? '-'}</td>
                        <td className="p-3">
                          <span className={product.stock_quantity === 0 ? 'text-error-500' : 'text-warning-500'}>
                            {product.stock_quantity} {product.unit}
                          </span>
                        </td>
                        <td className="p-3 text-dark-300">{product.min_stock}</td>
                        <td className="p-3 text-dark-300">{product.industry_name ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
