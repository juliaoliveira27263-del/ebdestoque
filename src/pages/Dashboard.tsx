import { useEffect, useState, useMemo } from 'react';
import {
  Package,
  Factory,
  Boxes,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Product, Industry, Request, Profile } from '../lib/types';

const COLORS = ['#dc2626', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

interface StatCardProps {
  icon: typeof Package;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-dark-400 text-xs font-medium truncate">{label}</p>
        <p className="text-white text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAdmin, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { data: productsData },
        { data: industriesData },
        { data: myRequests },
        { data: allReqs },
        { data: profilesData },
      ] = await Promise.all([
        supabase.from('products').select('*, industry:industries(*)'),
        supabase.from('industries').select('*'),
        supabase.from('requests').select('*, profile:profiles(*)').eq('user_id', profile?.id ?? ''),
        supabase.from('requests').select('*, profile:profiles(*)'),
        supabase.from('profiles').select('*'),
      ]);

      setProducts(productsData as Product[] ?? []);
      setIndustries(industriesData as Industry[] ?? []);
      setRequests(myRequests as Request[] ?? []);
      setAllRequests(allReqs as Request[] ?? []);
      setProfiles(profilesData as Profile[] ?? []);
      setLoading(false);
    })();
  }, [profile?.id]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalIndustries = industries.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0);
    const lowStock = products.filter((p) => p.stock_quantity <= p.min_stock);
    const displayRequests = isAdmin ? allRequests : requests;
    const pending = displayRequests.filter((r) => r.status === 'pending');
    const completed = displayRequests.filter((r) => r.status === 'completed');
    const totalUsers = profiles.length;

    return { totalProducts, totalIndustries, totalStock, lowStock, pending, completed, totalUsers, displayRequests };
  }, [products, industries, requests, allRequests, isAdmin, profiles]);

  const stockByIndustry = useMemo(() => {
    return industries.map((ind) => {
      const indProducts = products.filter((p) => p.industry_id === ind.id);
      const total = indProducts.reduce((sum, p) => sum + p.stock_quantity, 0);
      return { name: ind.name.trim(), estoque: total };
    });
  }, [products, industries]);

  const requestsByPeriod = useMemo(() => {
    const displayRequests = isAdmin ? allRequests : requests;
    const now = new Date();
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      days[key] = 0;
    }
    displayRequests.forEach((r) => {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([name, solicitacoes]) => ({ name, solicitacoes }));
  }, [allRequests, requests, isAdmin]);

  const topProducts = useMemo(() => {
    const displayRequests = isAdmin ? allRequests : requests;
    const productCounts: Record<string, { name: string; count: number }> = {};
    displayRequests.forEach((r) => {
      r.request_items?.forEach((item) => {
        const pname = item.product?.name ?? 'Desconhecido';
        if (!productCounts[item.product_id]) {
          productCounts[item.product_id] = { name: pname, count: 0 };
        }
        productCounts[item.product_id].count += item.quantity;
      });
    });
    return Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allRequests, requests, isAdmin]);

  const topUsers = useMemo(() => {
    const userCounts: Record<string, { name: string; count: number; items: number }> = {};
    allRequests.forEach((r) => {
      const uname = r.profile?.name ?? 'Desconhecido';
      if (!userCounts[r.user_id]) {
        userCounts[r.user_id] = { name: uname, count: 0, items: 0 };
      }
      userCounts[r.user_id].count++;
      userCounts[r.user_id].items += r.total_items;
    });
    return Object.values(userCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 text-sm mt-1">
          Visão geral do sistema
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Total de Produtos" value={stats.totalProducts} color="bg-primary-600/15 text-primary-400" />
        <StatCard icon={Factory} label="Indústrias" value={stats.totalIndustries} color="bg-blue-500/15 text-blue-400" />
        <StatCard icon={Boxes} label="Estoque Total" value={stats.totalStock} color="bg-success-500/15 text-success-500" />
        <StatCard icon={Clock} label="Solicitações Pendentes" value={stats.pending.length} color="bg-warning-500/15 text-warning-500" />
        <StatCard icon={CheckCircle2} label="Solicitações Concluídas" value={stats.completed.length} color="bg-success-500/15 text-success-500" />
        <StatCard icon={AlertTriangle} label="Estoque Baixo" value={stats.lowStock.length} color="bg-error-500/15 text-error-500" />
        {isAdmin && <StatCard icon={Users} label="Usuários" value={stats.totalUsers} color="bg-purple-500/15 text-purple-400" />}
        <StatCard icon={TrendingUp} label="Total Solicitações" value={stats.displayRequests.length} color="bg-primary-600/15 text-primary-400" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock by industry */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            <h2 className="text-white font-semibold">Estoque por Indústria</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stockByIndustry}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2e34" />
              <XAxis dataKey="name" stroke="#6d6e78" fontSize={11} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#6d6e78" fontSize={11} />
              <Tooltip
                contentStyle={{ background: '#1e1f24', border: '1px solid #3d3e45', borderRadius: '8px', color: '#fff' }}
                cursor={{ fill: '#2d2e34' }}
              />
              <Bar dataKey="estoque" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Requests by period */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            <h2 className="text-white font-semibold">Solicitações (últimos 7 dias)</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={requestsByPeriod}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2e34" />
              <XAxis dataKey="name" stroke="#6d6e78" fontSize={11} />
              <YAxis stroke="#6d6e78" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1e1f24', border: '1px solid #3d3e45', borderRadius: '8px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="solicitacoes" stroke="#dc2626" strokeWidth={2} dot={{ fill: '#dc2626', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low stock products */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-warning-500" />
          <h2 className="text-white font-semibold">Produtos com Estoque Baixo</h2>
        </div>
        {stats.lowStock.length === 0 ? (
          <p className="text-dark-400 text-sm py-4 text-center">Nenhum produto com estoque baixo.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50">
                <div className="flex items-center gap-3 min-w-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-dark-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.name}</p>
                    <p className="text-dark-400 text-xs">{p.industry?.name?.trim() ?? 'Sem indústria'}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="badge-error">{p.stock_quantity} / {p.min_stock} {p.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary-400" />
            <h2 className="text-white font-semibold">Produtos Mais Solicitados</h2>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-dark-400 text-sm py-4 text-center">Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2e34" />
                <XAxis type="number" stroke="#6d6e78" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#6d6e78" fontSize={10} width={120} tick={{ fill: '#9b9ca3' }} />
                <Tooltip
                  contentStyle={{ background: '#1e1f24', border: '1px solid #3d3e45', borderRadius: '8px', color: '#fff' }}
                  cursor={{ fill: '#2d2e34' }}
                />
                <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top users */}
        {isAdmin && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary-400" />
              <h2 className="text-white font-semibold">Ranking de Usuários</h2>
            </div>
            {topUsers.length === 0 ? (
              <p className="text-dark-400 text-sm py-4 text-center">Sem dados ainda.</p>
            ) : (
              <div className="space-y-2">
                {topUsers.map((u, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-dark-700/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      i === 0 ? 'bg-warning-500 text-white' :
                      i === 1 ? 'bg-dark-300 text-dark-900' :
                      i === 2 ? 'bg-orange-700 text-white' :
                      'bg-dark-600 text-dark-200'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{u.name}</p>
                      <p className="text-dark-400 text-xs">{u.count} solicitações · {u.items} itens</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
