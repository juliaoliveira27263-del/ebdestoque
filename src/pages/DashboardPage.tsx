import { useQuery } from '@tanstack/react-query';
import {
  Package,
  AlertTriangle,
  ClipboardList,
  Factory,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { fetchDashboardStats } from '@/services/dashboard';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const PIE_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#dc2626',
  fulfilled: '#a3a3a3',
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data!;

  const cards = [
    { label: 'Produtos', value: stats.totalProducts, icon: Package, color: 'text-primary' },
    { label: 'Estoque baixo', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Solicitações pendentes', value: stats.pendingRequests, icon: ClipboardList, color: 'text-primary' },
    { label: 'Indústrias', value: stats.totalIndustries, icon: Factory, color: 'text-foreground' },
  ];

  const pieData = stats.requestsByStatus.map((s) => ({
    name: REQUEST_STATUS_LABELS[s.status as keyof typeof REQUEST_STATUS_LABELS] ?? s.status,
    value: s.count,
    status: s.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do sistema.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Icon className={cn('h-5 w-5', card.color)} />
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Estoque por indústria</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.stockByIndustry}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="industry" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '0.75rem',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                }}
              />
              <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Solicitações por status
          </h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? '#dc2626'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
