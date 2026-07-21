import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { fetchDashboardStats } from '@/services/dashboard';
import { fetchMovements } from '@/services/movements';
import { fetchRequests } from '@/services/requests';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PERIOD_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '15', label: '15 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
];

const PIE_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  rejected: '#dc2626',
  fulfilled: '#6b7280',
};

export function ReportsPage() {
  const [period, setPeriod] = useState('30');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  const { data: movements = [], isLoading: movementsLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: fetchRequests,
  });

  const days = parseInt(period, 10);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const periodMovements = movements.filter((m) => new Date(m.created_at) >= since);

  const movementsByDate = new Map<string, number>();
  for (const m of periodMovements) {
    const d = new Date(m.created_at).toLocaleDateString('pt-BR');
    movementsByDate.set(d, (movementsByDate.get(d) ?? 0) + 1);
  }
  const movementsOverTime = Array.from(movementsByDate.entries()).map(([date, count]) => ({ date, count }));

  const productRequestCount = new Map<string, number>();
  for (const r of requests) {
    for (const item of r.request_items ?? []) {
      const name = item.product?.name ?? 'Desconhecido';
      productRequestCount.set(name, (productRequestCount.get(name) ?? 0) + 1);
    }
  }
  const topProducts = Array.from(productRequestCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (statsLoading || movementsLoading || requestsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise de dados do sistema</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Estoque por indústria</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats?.stockByIndustry ?? []}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="industry" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="stock" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Produtos mais solicitados</h2>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Movimentações ao longo do tempo</h2>
          {movementsOverTime.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={movementsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Resumo de solicitações</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={stats?.requestsByStatus ?? []}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry: { status: string }) => REQUEST_STATUS_LABELS[entry.status as keyof typeof REQUEST_STATUS_LABELS] ?? entry.status}
            >
              {(stats?.requestsByStatus ?? []).map((entry) => (
                <Cell key={entry.status} fill={PIE_COLORS[entry.status] ?? '#dc2626'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
