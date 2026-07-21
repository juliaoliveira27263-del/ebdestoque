import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/EmptyState';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';
import type { RequestStatus } from '@/types';

const PERIODS = [
  { days: 7, label: '7 dias' },
  { days: 15, label: '15 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
];

export function ReportsPage() {
  const [period, setPeriod] = React.useState('7');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', period],
    queryFn: async () => {
      const days = parseInt(period, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, industry:industries(name)');

      const industryMap = new Map<string, number>();
      for (const row of products ?? []) {
        const name = (row.industry as unknown as { name: string } | null)?.name ?? 'Sem indústria';
        industryMap.set(name, (industryMap.get(name) ?? 0) + (row.stock_quantity ?? 0));
      }
      const stockByIndustry = Array.from(industryMap, ([name, stock]) => ({ name, stock }));

      const { data: reqItems } = await supabase
        .from('request_items')
        .select('product:products(name), quantity')
        .gte('created_at', startDate.toISOString());

      const productMap = new Map<string, number>();
      for (const row of reqItems ?? []) {
        const name = (row.product as unknown as { name: string } | null)?.name ?? 'Desconhecido';
        productMap.set(name, (productMap.get(name) ?? 0) + (row.quantity ?? 0));
      }
      const topProducts = Array.from(productMap, ([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const { data: movements } = await supabase
        .from('movements')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const moveMap = new Map<string, number>();
      for (const row of movements ?? []) {
        const date = new Date(row.created_at).toLocaleDateString('pt-BR');
        moveMap.set(date, (moveMap.get(date) ?? 0) + 1);
      }
      const movementsOverTime = Array.from(moveMap, ([date, count]) => ({ date, count }));

      const { data: reqSummary } = await supabase
        .from('requests')
        .select('status')
        .gte('created_at', startDate.toISOString());

      const statusMap = new Map<string, number>();
      for (const row of reqSummary ?? []) {
        const s = (row as { status: string }).status;
        statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
      }
      const requestsSummary = Array.from(statusMap, ([status, count]) => ({
        status,
        label: REQUEST_STATUS_LABELS[status as RequestStatus] ?? status,
        count,
      }));

      return { stockByIndustry, topProducts, movementsOverTime, requestsSummary };
    },
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <div className="flex items-center gap-2">
          <Label>Período:</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => <SelectItem key={p.days} value={String(p.days)}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-foreground">Estoque por Indústria</h3>
        {data.stockByIndustry.length === 0 ? (
          <EmptyState icon={BarChart3} title="Sem dados" description="Nenhum produto cadastrado." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.stockByIndustry} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="stock" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-foreground">Produtos mais solicitados</h3>
        {data.topProducts.length === 0 ? (
          <EmptyState icon={BarChart3} title="Sem dados" description="Nenhuma solicitação no período." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={120} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-foreground">Movimentações ao longo do tempo</h3>
        {data.movementsOverTime.length === 0 ? (
          <EmptyState icon={BarChart3} title="Sem dados" description="Nenhuma movimentação no período." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.movementsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-foreground">Resumo de solicitações</h3>
        {data.requestsSummary.length === 0 ? (
          <EmptyState icon={BarChart3} title="Sem dados" description="Nenhuma solicitação no período." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.requestsSummary.map((s) => (
              <div key={s.status} className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{s.count}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
