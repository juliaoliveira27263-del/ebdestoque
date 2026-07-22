import { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { supabase } from '../lib/supabase';
import Badge from '../components/Badge';
import { toast } from 'sonner';
import { RequestStatus, statusLabels } from '../lib/types';

interface DashboardStats {
  totalProducts: number;
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

interface StockStatusData {
  name: string;
  value: number;
}

interface RecentRequest {
  id: string;
  user_name: string;
  status: RequestStatus;
  total_items: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  'Em Estoque': '#10b981',
  'Estoque Baixo': '#f59e0b',
  'Sem Estoque': '#ef4444',
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStock: 0,
    industries: 0,
    pendingRequests: 0,
    users: 0,
    totalStockItems: 0,
  });
  const [stockByIndustry, setStockByIndustry] = useState<StockByIndustry[]>([]);
  const [stockStatus, setStockStatus] = useState<StockStatusData[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [
        productsRes,
        industriesRes,
        requestsRes,
        usersRes,
        stockByIndustryRes,
      ] = await Promise.all([
        supabase.from('products').select('stock_quantity, min_stock, active'),
        supabase.from('industries').select('id, active'),
        supabase.from('requests').select('id, status, total_items, created_at, user_id'),
        supabase.from('profiles').select('id, name, active'),
        supabase
          .from('products')
          .select('stock_quantity, industry_id, industries(name)'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (industriesRes.error) throw industriesRes.error;
      if (requestsRes.error) throw requestsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (stockByIndustryRes.error) throw stockByIndustryRes.error;

      const products = productsRes.data ?? [];
      const industries = industriesRes.data ?? [];
      const requests = requestsRes.data ?? [];
      const users = usersRes.data ?? [];

      const activeProducts = products.filter((p: { active: boolean }) => p.active);
      const lowStockCount = activeProducts.filter(
        (p: { stock_quantity: number; min_stock: number }) =>
          p.stock_quantity <= p.min_stock && p.stock_quantity > 0,
      ).length;
      const outOfStockCount = activeProducts.filter(
        (p: { stock_quantity: number }) => p.stock_quantity === 0,
      ).length;
      const inStockCount = activeProducts.length - lowStockCount - outOfStockCount;
      const totalStockItems = activeProducts.reduce(
        (sum: number, p: { stock_quantity: number }) => sum + p.stock_quantity,
        0,
      );

      setStats({
        totalProducts: activeProducts.length,
        lowStock: lowStockCount + outOfStockCount,
        industries: industries.filter((i: { active: boolean }) => i.active).length,
        pendingRequests: requests.filter(
          (r: { status: RequestStatus }) => r.status === 'pending',
        ).length,
        users: users.filter((u: { active: boolean }) => u.active).length,
        totalStockItems,
      });

      // Stock by industry
      const industryMap: Record<string, number> = {};
      (stockByIndustryRes.data ?? []).forEach((item: { stock_quantity: number; industries: { name: string }[] | null }) => {
        const industryName = item.industries?.[0]?.name ?? 'Sem Indústria';
        industryMap[industryName] = (industryMap[industryName] ?? 0) + (item.stock_quantity ?? 0);
      });
      setStockByIndustry(
        Object.entries(industryMap).map(([name, stock]: [string, number]) => ({ name, stock })),
      );

      // Stock status
      setStockStatus([
        { name: 'Em Estoque', value: inStockCount },
        { name: 'Estoque Baixo', value: lowStockCount },
        { name: 'Sem Estoque', value: outOfStockCount },
      ]);

      // Recent requests - need user names
      const pendingRequestIds = requests
        .filter((r: { status: RequestStatus }) => r.status === 'pending')
        .slice(0, 5);
      const userIds = [...new Set(pendingRequestIds.map((r: { user_id: string }) => r.user_id))];
      const profilesRes = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      const profileMap: Record<string, string> = {};
      (profilesRes.data ?? []).forEach((p: { id: string; name: string }) => {
        profileMap[p.id] = p.name;
      });
      setRecentRequests(
        pendingRequestIds.map((r: { id: string; user_id: string; status: RequestStatus; total_items: number; created_at: string }) => ({
          id: r.id,
          user_name: profileMap[r.user_id] ?? 'Usuário',
          status: r.status,
          total_items: r.total_items,
          created_at: r.created_at,
        })),
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar dados';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const statusVariant = (status: RequestStatus): 'warning' | 'success' | 'error' => {
    if (status === 'pending') return 'warning';
    if (status === 'approved') return 'success';
    return 'error';
  };

  const statCards = [
    { label: 'Total de Produtos', value: stats.totalProducts, color: 'text-blue-400' },
    { label: 'Estoque Baixo', value: stats.lowStock, color: 'text-warning-500' },
    { label: 'Indústrias', value: stats.industries, color: 'text-purple-400' },
    { label: 'Pedidos Pendentes', value: stats.pendingRequests, color: 'text-orange-400' },
    { label: 'Usuários', value: stats.users, color: 'text-green-400' },
    { label: 'Itens em Estoque', value: stats.totalStockItems, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <p className="text-dark-400 text-sm">{card.label}</p>
            <p className={`text-2xl font-bold mt-2 ${card.color}`}>
              {loading ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock by Industry */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Estoque por Indústria</h2>
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
        </div>

        {/* Stock Status Pie */}
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Status do Estoque</h2>
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
                {stockStatus.map((entry: StockStatusData) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#6b7280'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Pedidos Recentes</h2>
        {recentRequests.length === 0 ? (
          <p className="text-dark-400 text-center py-8">Nenhum pedido pendente</p>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req: RecentRequest) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-dark-700"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white font-medium">{req.user_name}</p>
                    <p className="text-dark-400 text-sm">
                      {req.total_items} itens •{' '}
                      {new Date(req.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant(req.status)}>
                  {statusLabels[req.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
