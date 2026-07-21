import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Loader2, FileBarChart, TrendingUp, Package, ClipboardList } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorState } from '@/components/ErrorState';
import { REQUEST_STATUS_LABELS } from '@/lib/constants';
import type { Product, Industry, Movement, StockRequest } from '@/types';

interface ReportData {
  products: Product[];
  industries: Industry[];
  movements: Movement[];
  requests: StockRequest[];
  requestItems: { product_id: string; quantity: number; product?: Product }[];
}

async function fetchReportData(): Promise<ReportData> {
  const [productsRes, industriesRes, movementsRes, requestsRes, itemsRes] = await Promise.all([
    supabase.from('products').select('*, category:categories(*), industry:industries(*)').order('name'),
    supabase.from('industries').select('*').order('name'),
    supabase.from('movements').select('*, product:products(*), profile:profiles(*)').order('created_at', { ascending: true }),
    supabase.from('requests').select('*, profile:profiles(*)').order('created_at', { ascending: false }),
    supabase.from('request_items').select('product_id, quantity, product:products(*)'),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (industriesRes.error) throw industriesRes.error;
  if (movementsRes.error) throw movementsRes.error;
  if (requestsRes.error) throw requestsRes.error;
  if (itemsRes.error) throw itemsRes.error;

  return {
    products: (productsRes.data ?? []) as Product[],
    industries: (industriesRes.data ?? []) as Industry[],
    movements: (movementsRes.data ?? []) as Movement[],
    requests: (requestsRes.data ?? []) as StockRequest[],
    requestItems: (itemsRes.data ?? []) as unknown as { product_id: string; quantity: number; product?: Product }[],
  };
}

export function ReportsPage() {
  const { isAdmin } = useAuth();
  const [period, setPeriod] = useState('30');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', period],
    queryFn: fetchReportData,
    refetchInterval: 60_000,
  });

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

  const topRequested = useMemo(() => {
    const items = data?.requestItems ?? [];
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      counts[item.product_id] = (counts[item.product_id] ?? 0) + item.quantity;
    });
    const products = data?.products ?? [];
    return Object.entries(counts)
      .map(([pid, qty]) => {
        const p = products.find((pr) => pr.id === pid);
        return { name: p?.name ?? 'Produto removido', solicitado: qty };
      })
      .sort((a, b) => b.solicitado - a.solicitado)
      .slice(0, 10);
  }, [data]);

  const movementsOverTime = useMemo(() => {
    const movements = data?.movements ?? [];
    const days = parseInt(period, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = movements.filter((m) => new Date(m.created_at) >= cutoff);
    const byDay: Record<string, { date: string; entradas: number; saidas: number }> = {};
    filtered.forEach((m) => {
      const d = new Date(m.created_at);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!byDay[key]) byDay[key] = { date: key, entradas: 0, saidas: 0 };
      if (m.type === 'in') byDay[key].entradas += m.quantity;
      else if (m.type === 'out') byDay[key].saidas += m.quantity;
    });
    return Object.values(byDay).sort((a, b) => {
      const [da, ma] = a.date.split('/').map(Number);
      const [db, mb] = b.date.split('/').map(Number);
      return ma === mb ? da - db : ma - mb;
    });
  }, [data, period]);

  const requestSummary = useMemo(() => {
    const requests = data?.requests ?? [];
    const days = parseInt(period, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recent = requests.filter((r) => new Date(r.created_at) >= cutoff);
    return {
      total: recent.length,
      pending: recent.filter((r) => r.status === 'pending').length,
      approved: recent.filter((r) => r.status === 'approved').length,
      rejected: recent.filter((r) => r.status === 'rejected').length,
      fulfilled: recent.filter((r) => r.status === 'fulfilled').length,
    };
  }, [data, period]);

  if (!isAdmin) {
    return <ErrorState message="Acesso restrito a administradores." />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  const summaryCards = [
    { label: 'Total de Solicitações', value: requestSummary.total, icon: ClipboardList, color: 'text-primary' },
    { label: 'Pendentes', value: requestSummary.pending, icon: ClipboardList, color: 'text-warning' },
    { label: 'Aprovadas', value: requestSummary.approved, icon: ClipboardList, color: 'text-success' },
    { label: 'Rejeitadas', value: requestSummary.rejected, icon: ClipboardList, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground">Análise de estoque, movimentações e solicitações</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
          {(['7', '15', '30', '90'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {p} dias
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${card.color}`} />
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
              {isLoading ? (
                <div className="mt-2 h-7 w-12 animate-pulse rounded bg-muted" />
              ) : (
                <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Estoque por Indústria</h3>
          </div>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : stockByIndustry.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stockByIndustry}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="estoque" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Produtos Mais Solicitados</h3>
          </div>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : topRequested.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topRequested} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="solicitado" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Movimentações ao Longo do Tempo</h3>
        </div>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : movementsOverTime.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Sem movimentações no período</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2} name="Entradas" />
              <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2} name="Saídas" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Resumo de Solicitações</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(REQUEST_STATUS_LABELS) as Array<keyof typeof REQUEST_STATUS_LABELS>).map((key) => {
            const value = key === 'pending' ? requestSummary.pending
              : key === 'approved' ? requestSummary.approved
              : key === 'rejected' ? requestSummary.rejected
              : requestSummary.fulfilled;
            return (
              <div key={key} className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">{REQUEST_STATUS_LABELS[key]}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
