import { useQuery } from '@tanstack/react-query';
import { Package, AlertTriangle, ClipboardList, Building2, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchDashboardStats } from '@/services/dashboard';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';

const PIE_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#dc2626',
  fulfilled: '#6b7280',
};

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { label: 'Produtos', value: stats.totalProducts, icon: Package, color: 'text-primary' },
    { label: 'Estoque baixo', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Solicitações pendentes', value: stats.pendingRequests, icon: ClipboardList, color: 'text-primary' },
    { label: 'Indústrias', value: stats.totalIndustries, icon: Building2, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <c.icon className={`mb-2 h-6 w-6 ${c.color}`} />
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
            <p className="text-sm text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Estoque por indústria</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.stockByIndustry}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="industry" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="stock" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Solicitações por status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.requestsByStatus}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: { status: string }) => REQUEST_STATUS_LABELS[entry.status as keyof typeof REQUEST_STATUS_LABELS] ?? entry.status}
              >
                {stats.requestsByStatus.map((entry) => (
                  <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? '#dc2626'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
