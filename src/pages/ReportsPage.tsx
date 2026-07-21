import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart3, TrendingUp, Package, ArrowLeftRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/RippleButton';
import type { Product, Movement, Industry } from '@/types';

const PERIODS = [
  { label: '7 dias', value: 7 },
  { label: '15 dias', value: 15 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export default function ReportsPage() {
  const [days, setDays] = useState(30);

  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }, [days]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['reports-products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*, industry:industries(*)')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['reports-movements', days],
    queryFn: async (): Promise<Movement[]> => {
      const { data, error } = await supabase
        .from('movements')
        .select('*, product:products(*), profile:profiles(*)')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Movement[];
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['reports-requests', days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('status, request_items(product_id)')
        .gte('created_at', startDate);
      if (error) throw error;
      return data ?? [];
    },
  });

  const stockByIndustry = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const name = (p.industry as Industry | null)?.name ?? 'Sem indústria';
      map.set(name, (map.get(name) ?? 0) + p.stock_quantity);
    }
    return Array.from(map.entries()).map(([industry, stock]) => ({ industry, stock }));
  }, [products]);

  const topRequested = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of requests) {
      const items = (r as { request_items?: { product_id: string }[] }).request_items ?? [];
      for (const item of items) {
        map.set(item.product_id, (map.get(item.product_id) ?? 0) + 1);
      }
    }
    const productNames = new Map(products.map((p) => [p.id, p.name]));
    return Array.from(map.entries())
      .map(([id, count]) => ({ name: productNames.get(id) ?? 'Produto', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [requests, products]);

  const movementsOverTime = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of movements) {
      const date = new Date(m.created_at).toLocaleDateString('pt-BR');
      map.set(date, (map.get(date) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [movements]);

  const summary = useMemo(() => {
    const total = requests.length;
    const approved = requests.filter((r) => (r as { status: string }).status === 'approved').length;
    const rejected = requests.filter((r) => (r as { status: string }).status === 'rejected').length;
    const pending = requests.filter((r) => (r as { status: string }).status === 'pending').length;
    return { total, approved, rejected, pending };
  }, [requests]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise de dados do período.</p>
        </div>
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={days === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Solicitações', value: summary.total, icon: Package },
          { label: 'Aprovadas', value: summary.approved, icon: TrendingUp },
          { label: 'Pendentes', value: summary.pending, icon: BarChart3 },
          { label: 'Movimentações', value: movements.length, icon: ArrowLeftRight },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{s.value}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">Estoque por indústria</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockByIndustry}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="industry" tick={{ fontSize: 12 }} />
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Produtos mais solicitados</h2>
          {topRequested.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRequested} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-foreground">Movimentações ao longo do tempo</h2>
          {movementsOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={movementsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
