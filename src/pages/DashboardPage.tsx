import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, Clock, Building2, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { fetchDashboardStats } from '@/services/dashboard';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';
import type { RequestStatus } from '@/types';

const PIE_COLORS: Record<RequestStatus, string> = {
  pending: 'hsl(38 92% 50%)',
  approved: 'hsl(142 71% 45%)',
  rejected: 'hsl(0 72% 51%)',
  fulfilled: 'hsl(0 14% 96%)',
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: fetchDashboardStats });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data!;

  const cards = [
    { label: 'Total de Produtos', value: stats.totalProducts, icon: Package, color: 'bg-primary/10 text-primary' },
    { label: 'Estoque Baixo', value: stats.lowStockCount, icon: AlertTriangle, color: 'bg-warning/15 text-warning' },
    { label: 'Solicitações Pendentes', value: stats.pendingRequests, icon: Clock, color: 'bg-warning/15 text-warning' },
    { label: 'Indústrias', value: stats.totalIndustries, icon: Building2, color: 'bg-accent text-accent-foreground' },
  ];

  const pieData = stats.requestsByStatus.map((s) => ({
    name: REQUEST_STATUS_LABELS[s.status as RequestStatus] ?? s.status,
    value: s.count,
    status: s.status,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Estoque por Indústria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.stockByIndustry}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="industry" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Solicitações por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {pieData.map((entry) => (
                  <Cell key={entry.status} fill={PIE_COLORS[entry.status as RequestStatus] ?? 'hsl(var(--primary))'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
