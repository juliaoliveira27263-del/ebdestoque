import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Package, AlertTriangle, Clock, Building2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorState } from '@/components/ErrorState';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';
import type { Product, Industry, StockRequest } from '@/types';

interface DashboardData {
  products: Product[];
  industries: Industry[];
  requests: StockRequest[];
}

async function fetchDashboardData(): Promise<DashboardData> {
  const [productsRes, industriesRes, requestsRes] = await Promise.all([
    supabase.from('products').select('*, category:categories(*), industry:industries(*)').order('name'),
    supabase.from('industries').select('*').order('name'),
    supabase.from('requests').select('*, profile:profiles(*)').order('created_at', { ascending: false }),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (industriesRes.error) throw industriesRes.error;
  if (requestsRes.error) throw requestsRes.error;

  return {
    products: (productsRes.data ?? []) as Product[],
    industries: (industriesRes.data ?? []) as Industry[],
    requests: (requestsRes.data ?? []) as StockRequest[],
  };
}

const PIE_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  fulfilled: '#6366f1',
};

export function DashboardPage() {
  const { isAdmin } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardData,
    refetchInterval: 30_000,
  });

  const stats = useMemo(() => {
    const products = data?.products ?? [];
    const industries = data?.industries ?? [];
    const requests = data?.requests ?? [];
    return {
      totalProducts: products.length,
      lowStock: products.filter((p) => p.stock_quantity < p.min_stock).length,
      pendingRequests: requests.filter((r) => r.status === 'pending').length,
      totalIndustries: industries.filter((i) => i.active).length,
    };
  }, [data]);

  const stockByIndustry = useMemo(() => {
    const products = data?.products ?? [];
    const industries = data?.industries ?? [];
    return industries.map((ind) => {
      const total = products
        .filter((p) => p.industry_id === ind.id)
        .reduce((sum, p) => sum + p.stock_quantity, 0);
      return { name: ind.name.length > 15 ? ind.name.slice(0, 15) + '…' : ind.name, estoque: total };
    }).filter((d) => d.estoque > 0);
  }, [data]);

  const requestsByStatus = useMemo(() => {
    const requests = data?.requests ?? [];
    const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, fulfilled: 0 };
    requests.forEach((r) => { counts[r.status] = (counts[r.status] ?? 0) + 1; });
    return (Object.keys(REQUEST_STATUS_LABELS) as Array<keyof typeof REQUEST_STATUS_LABELS>).map((key) => ({
      name: REQUEST_STATUS_LABELS[key],
      value: counts[key] ?? 0,
      key,
    }));
  }, [data]);

  if (!isAdmin) {
    return <ErrorState message="Acesso restrito a administradores." />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  const statCards = [
    { icon: Package, label: 'Total de Produtos', value: stats.totalProducts, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    { icon: AlertTriangle, label: 'Estoque Baixo', value: stats.lowStock, iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { icon: Clock, label: 'Solicitações Pendentes', value: stats.pendingRequests, iconBg: 'bg-secondary', iconColor: 'text-secondary-foreground' },
    { icon: Building2, label: 'Indústrias Ativas', value: stats.totalIndustries, iconBg: 'bg-success/10', iconColor: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Painel Administrativo</h2>
        <p className="text-sm text-muted-foreground">Visão geral do estoque e solicitações</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
              {isLoading ? (
                <div className="mt-4 h-8 w-16 animate-pulse rounded bg-muted" />
              ) : (
                <p className="mt-4 text-3xl font-bold text-foreground">{card.value}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Estoque por Indústria</h3>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stockByIndustry.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Sem dados de estoque
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockByIndustry}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="estoque" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Solicitações por Status</h3>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : requestsByStatus.every((d) => d.value === 0) ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Sem solicitações
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={requestsByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.value}`}
                >
                  {requestsByStatus.map((entry) => (
                    <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
