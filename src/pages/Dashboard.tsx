import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import Badge from '../components/Badge';
import type { Industry, Product, Request, RequestStatus, Profile } from '../lib/types';
import { statusLabels } from '../lib/types';

interface DashboardStats {
  products: number;
  lowStock: number;
  industries: number;
  pendingRequests: number;
  users: number;
  totalStockItems: number;
}

interface StockByIndustry {
  name: string;
  stock: number;
}

interface StockStatus {
  name: string;
  value: number;
  color: string;
}

interface RecentRequest extends Request {
  profileName: string;
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    lowStock: 0,
    industries: 0,
    pendingRequests: 0,
    users: 0,
    totalStockItems: 0,
  });
  const [stockByIndustry, setStockByIndustry] = useState<StockByIndustry[]>([]);
  const [stockStatus, setStockStatus] = useState<StockStatus[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [
        productsRes,
        industriesRes,
        requestsRes,
        usersRes,
        productsForChartRes,
      ] = await Promise.all([
        supabase.from('products').select('stock_quantity, min_stock, active'),
        supabase.from('industries').select('id, name', { count: 'exact', head: true }),
        supabase.from('requests').select('id, user_id, status, total_items, created_at, updated_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('stock_quantity, industry_id, min_stock, active'),
      ]);

      const products = (productsRes.data as Product[] | null) ?? [];
      const industriesCount = industriesRes.count ?? 0;
      const requests = (requestsRes.data as Request[] | null) ?? [];
      const usersCount = usersRes.count ?? 0;
      const productsForChart = (productsForChartRes.data as Product[] | null) ?? [];

      const activeProducts = products.filter((p) => p.active);
      const lowStockCount = activeProducts.filter(
        (p) => p.stock_quantity <= p.min_stock,
      ).length;
      const totalStock = activeProducts.reduce((sum, p) => sum + p.stock_quantity, 0);
      const pendingCount = requests.filter((r) => r.status === 'pending').length;

      setStats({
        products: activeProducts.length,
        lowStock: lowStockCount,
        industries: industriesCount,
        pendingRequests: pendingCount,
        users: usersCount,
        totalStockItems: totalStock,
      });

      // Fetch industries separately for chart mapping (NO supabase join)
      const { data: industriesData } = await supabase
        .from('industries')
        .select('id, name');
      const industries = (industriesData as Industry[] | null) ?? [];

      const industryMap = new Map<string, string>();
      industries.forEach((ind) => industryMap.set(ind.id, ind.name));

      const stockMap = new Map<string, number>();
      productsForChart
        .filter((p) => p.active && p.industry_id)
        .forEach((p) => {
          const key = p.industry_id as string;
          stockMap.set(key, (stockMap.get(key) ?? 0) + p.stock_quantity);
        });

      const chartData: StockByIndustry[] = [];
      industries.forEach((ind) => {
        chartData.push({
          name: ind.name,
          stock: stockMap.get(ind.id) ?? 0,
        });
      });
      setStockByIndustry(chartData);

      // Stock status pie
      const okStock = activeProducts.filter((p) => p.stock_quantity > p.min_stock).length;
      const lowStockPie = activeProducts.filter(
        (p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock,
      ).length;
      const outStock = activeProducts.filter((p) => p.stock_quantity === 0).length;
      setStockStatus([
        { name: 'Em estoque', value: okStock, color: PIE_COLORS[0] },
        { name: 'Estoque baixo', value: lowStockPie, color: PIE_COLORS[1] },
        { name: 'Sem estoque', value: outStock, color: PIE_COLORS[2] },
      ]);

      // Fetch profiles for recent requests
      if (requests.length > 0) {
        const userIds = [...new Set(requests.map((r) => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        const profiles = (profilesData as Profile[] | null) ?? [];
        const profileMap = new Map<string, string>();
        profiles.forEach((p) => profileMap.set(p.id, p.name));

        const recent: RecentRequest[] = requests.map((r) => ({
          ...r,
          profileName: profileMap.get(r.user_id) ?? 'Usuário desconhecido',
        }));
        setRecentRequests(recent);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Produtos', value: stats.products, color: 'text-emerald-400' },
    { label: 'Estoque baixo', value: stats.lowStock, color: 'text-amber-400' },
    { label: 'Indústrias', value: stats.industries, color: 'text-blue-400' },
    { label: 'Pedidos pendentes', value: stats.pendingRequests, color: 'text-purple-400' },
    { label: 'Usuários', value: stats.users, color: 'text-pink-400' },
    { label: 'Itens em estoque', value: stats.totalStockItems, color: 'text-cyan-400' },
  ];

  function badgeVariant(status: RequestStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-400">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">Visão geral do sistema</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-dark-900 border border-dark-800 rounded-lg p-4"
          >
            <p className="text-sm text-dark-400">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Estoque por indústria</h2>
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

        <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Status do estoque</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: { name: string; value: number }) => `${entry.name}: ${entry.value}`}
              >
                {stockStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent requests */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Pedidos recentes</h2>
        {recentRequests.length === 0 ? (
          <p className="text-dark-400 text-center py-8">Nenhum pedido encontrado</p>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-dark-950 rounded-lg border border-dark-800"
              >
                <div>
                  <p className="text-white font-medium">{req.profileName}</p>
                  <p className="text-sm text-dark-400">
                    {req.total_items} itens - {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant={badgeVariant(req.status)}>
                  {statusLabels[req.status as RequestStatus]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
