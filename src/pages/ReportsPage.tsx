import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Package,
  ArrowUpCircle,
  MapPin,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  BarChart3,
  Trophy,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  fetchStockReport,
  fetchOutflowReport,
  fetchDestinationReport,
  fetchReportSummary,
  fetchStockComparison,
  fetchRequestRanking,
  type StockReportRow,
  type OutflowReportRow,
  type DestinationReportRow,
  type StockComparisonRow,
  type RequestRankingRow,
  type RankingPeriod,
} from '@/services/reports';
import { RippleButton } from '@/components/RippleButton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { StatCard } from '@/components/StatCard';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS, ROLE_LABELS } from '@/lib/constants';
import type { MovementType, UserRole } from '@/types';

type Tab = 'stock' | 'outflow' | 'destination' | 'comparison' | 'ranking';

function exportCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(';'),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          if (v === null || v === undefined) return '';
          const s = String(v).replace(/;/g, ',').replace(/\n/g, ' ');
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(';')
    ),
  ].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [rankingPeriod, setRankingPeriod] = useState<RankingPeriod>('month');

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['report-summary'],
    queryFn: fetchReportSummary,
  });

  const stockQuery = useQuery({
    queryKey: ['report-stock'],
    queryFn: fetchStockReport,
    enabled: tab === 'stock',
  });

  const outflowQuery = useQuery({
    queryKey: ['report-outflow'],
    queryFn: fetchOutflowReport,
    enabled: tab === 'outflow',
  });

  const destQuery = useQuery({
    queryKey: ['report-destination'],
    queryFn: fetchDestinationReport,
    enabled: tab === 'destination',
  });

  const comparisonQuery = useQuery({
    queryKey: ['report-comparison'],
    queryFn: fetchStockComparison,
    enabled: tab === 'comparison',
  });

  const rankingQuery = useQuery({
    queryKey: ['report-ranking', rankingPeriod],
    queryFn: () => fetchRequestRanking(rankingPeriod),
    enabled: tab === 'ranking',
  });

  const filteredStock = useMemo(() => {
    if (!stockQuery.data) return [];
    return stockQuery.data.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.sku ?? '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [stockQuery.data, search, statusFilter]);

  const filteredOutflow = useMemo(() => {
    if (!outflowQuery.data) return [];
    return outflowQuery.data.filter((r) => {
      const matchSearch =
        !search ||
        r.product_name.toLowerCase().includes(search.toLowerCase()) ||
        (r.product_sku ?? '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || r.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [outflowQuery.data, search, typeFilter]);

  const filteredComparison = useMemo(() => {
    if (!comparisonQuery.data) return [];
    return comparisonQuery.data.filter((r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.sku ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [comparisonQuery.data, search]);

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'stock', label: 'Estoque Atual', icon: Package },
    { id: 'outflow', label: 'Saídas', icon: ArrowUpCircle },
    { id: 'comparison', label: 'Comparativo', icon: BarChart3 },
    { id: 'destination', label: 'Destinos', icon: MapPin },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
  ];

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10);
    if (tab === 'stock' && filteredStock.length > 0) {
      exportCSV(`relatorio-estoque-${date}.csv`, filteredStock as unknown as Record<string, unknown>[]);
    } else if (tab === 'outflow' && filteredOutflow.length > 0) {
      exportCSV(`relatorio-saidas-${date}.csv`, filteredOutflow as unknown as Record<string, unknown>[]);
    } else if (tab === 'comparison' && filteredComparison.length > 0) {
      exportCSV(`relatorio-comparativo-${date}.csv`, filteredComparison as unknown as Record<string, unknown>[]);
    } else if (tab === 'destination' && destQuery.data) {
      const flat = destQuery.data.flatMap((d) =>
        d.products.map((p) => ({
          industria: d.industry_name,
          total_itens: d.total_items,
          total_solicitacoes: d.total_requests,
          produto: p.name,
          quantidade: p.quantity,
        }))
      );
      if (flat.length > 0) exportCSV(`relatorio-destinos-${date}.csv`, flat);
    } else if (tab === 'ranking' && rankingQuery.data && rankingQuery.data.length > 0) {
      exportCSV(`relatorio-ranking-${date}.csv`, rankingQuery.data as unknown as Record<string, unknown>[]);
    }
  };

  const hasData =
    (tab === 'stock' && filteredStock.length > 0) ||
    (tab === 'outflow' && filteredOutflow.length > 0) ||
    (tab === 'comparison' && filteredComparison.length > 0) ||
    (tab === 'destination' && (destQuery.data?.length ?? 0) > 0) ||
    (tab === 'ranking' && (rankingQuery.data?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o estoque, saídas e destinos dos materiais
          </p>
        </div>
        <RippleButton variant="outline" onClick={handleExport} disabled={!hasData}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </RippleButton>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Package}
          label="Total de Produtos"
          value={summary?.totalProducts ?? 0}
          loading={summaryLoading}
          tone="primary"
        />
        <StatCard
          icon={CheckCircle2}
          label="Itens em Estoque"
          value={summary?.totalStockUnits ?? 0}
          loading={summaryLoading}
          tone="default"
        />
        <StatCard
          icon={AlertTriangle}
          label="Estoque Baixo"
          value={summary?.lowStock ?? 0}
          loading={summaryLoading}
          tone="warning"
        />
        <StatCard
          icon={XCircle}
          label="Sem Estoque"
          value={summary?.outOfStock ?? 0}
          loading={summaryLoading}
          tone="destructive"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setSearch('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        {tab !== 'ranking' && (
          <div className="relative min-w-48 flex-1">
            <input
              placeholder={tab === 'destination' ? 'Buscar por indústria...' : 'Buscar por produto...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
        {tab === 'stock' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ok">Normal</SelectItem>
              <SelectItem value="low">Estoque baixo</SelectItem>
              <SelectItem value="out">Sem estoque</SelectItem>
            </SelectContent>
          </Select>
        )}
        {tab === 'outflow' && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="in">Entrada</SelectItem>
              <SelectItem value="out">Saída</SelectItem>
              <SelectItem value="adjustment">Ajuste</SelectItem>
            </SelectContent>
          </Select>
        )}
        {tab === 'ranking' && (
          <Select value={rankingPeriod} onValueChange={(v) => setRankingPeriod(v as RankingPeriod)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content */}
      {tab === 'stock' && (
        <StockTable data={filteredStock} loading={stockQuery.isLoading} error={stockQuery.error} />
      )}
      {tab === 'outflow' && (
        <OutflowTable data={filteredOutflow} loading={outflowQuery.isLoading} error={outflowQuery.error} />
      )}
      {tab === 'comparison' && (
        <ComparisonTable data={filteredComparison} loading={comparisonQuery.isLoading} error={comparisonQuery.error} />
      )}
      {tab === 'destination' && (
        <DestinationView data={destQuery.data ?? []} loading={destQuery.isLoading} error={destQuery.error} search={search} />
      )}
      {tab === 'ranking' && (
        <RankingView data={rankingQuery.data ?? []} loading={rankingQuery.isLoading} error={rankingQuery.error} period={rankingPeriod} />
      )}
    </div>
  );
}

function StockTable({ data, loading, error }: { data: StockReportRow[]; loading: boolean; error: unknown }) {
  if (error) return <ErrorState message={(error as Error).message} />;
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl shimmer" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return <EmptyState icon={Package} title="Nenhum produto encontrado" description="Ajuste os filtros." />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Produto</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">SKU</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Categoria</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Indústria</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Estoque</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Mínimo</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.sku ?? '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.industry}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  {r.stock_quantity} <span className="text-xs text-muted-foreground">{r.unit}</span>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">{r.min_stock}</td>
                <td className="px-4 py-3 text-center">
                  {r.status === 'ok' && <Badge className="bg-success/15 text-success">Normal</Badge>}
                  {r.status === 'low' && <Badge className="bg-warning/15 text-warning">Baixo</Badge>}
                  {r.status === 'out' && <Badge className="bg-destructive/15 text-destructive">Sem estoque</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutflowTable({ data, loading, error }: { data: OutflowReportRow[]; loading: boolean; error: unknown }) {
  if (error) return <ErrorState message={(error as Error).message} />;
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl shimmer" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return <EmptyState icon={ArrowUpCircle} title="Nenhuma movimentação encontrada" description="Ajuste os filtros." />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Data</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Produto</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Categoria</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Tipo</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Qtd</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Motivo</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Solicitante</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Destino</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((r) => (
              <tr key={r.movement_id} className="hover:bg-muted/30">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(r.date).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{r.product_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${MOVEMENT_TYPE_COLORS[r.type as MovementType]}`}>
                    {MOVEMENT_TYPE_LABELS[r.type as MovementType]}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-semibold ${MOVEMENT_TYPE_COLORS[r.type as MovementType]}`}>
                  {r.type === 'out' ? '-' : '+'}{r.quantity}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.reason ?? '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.user_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.destination_industry ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComparisonTable({ data, loading, error }: { data: StockComparisonRow[]; loading: boolean; error: unknown }) {
  if (error) return <ErrorState message={(error as Error).message} />;
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl shimmer" />)}
      </div>
    );
  }
  if (data.length === 0) return <EmptyState icon={BarChart3} title="Nenhum produto encontrado" description="Ajuste os filtros." />;

  const maxOut = Math.max(...data.map((r) => r.total_out), 1);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Produto</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Indústria</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Estoque Atual</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Total Entradas</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Total Saídas</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground min-w-32">Consumo</th>
              <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{r.name}</div>
                  {r.sku && <div className="text-xs text-muted-foreground">{r.sku}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.industry}</td>
                <td className="px-4 py-3 text-right font-semibold text-foreground">
                  {r.current_stock} <span className="text-xs text-muted-foreground">{r.unit}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-1 text-success font-medium">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {r.total_in}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-1 text-destructive font-medium">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {r.total_out}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-destructive/70"
                        style={{ width: `${Math.min(100, (r.total_out / maxOut) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 w-8 text-right">{r.total_out}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {r.status === 'ok' && <Badge className="bg-success/15 text-success">Normal</Badge>}
                  {r.status === 'low' && <Badge className="bg-warning/15 text-warning">Baixo</Badge>}
                  {r.status === 'out' && <Badge className="bg-destructive/15 text-destructive">Sem estoque</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const periodLabels: Record<string, string> = {
  today: 'hoje',
  week: 'na última semana',
  month: 'no último mês',
  all: 'em todo o período',
};

function RankingView({ data, loading, error, period }: { data: RequestRankingRow[]; loading: boolean; error: unknown; period: RankingPeriod }) {
  if (error) return <ErrorState message={(error as Error).message} />;
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl shimmer" />)}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhuma solicitação encontrada"
        description={`Nenhuma solicitação foi registrada ${periodLabels[period] ?? ''}.`}
      />
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Ranking de solicitantes {periodLabels[period] ?? ''} — {data.length} usuário(s)
      </p>
      {data.map((row, idx) => {
        const barWidth = data[0].total_requests > 0 ? (row.total_requests / data[0].total_requests) * 100 : 0;
        return (
          <div
            key={row.user_id}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold">
              {idx < 3 ? medals[idx] : <span className="text-base text-muted-foreground">#{idx + 1}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-foreground">{row.user_name}</span>
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[row.user_role as UserRole] ?? row.user_role}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="text-success font-medium">{row.approved} aprovada(s)</span>
                <span className="text-destructive font-medium">{row.rejected} rejeitada(s)</span>
                <span className="text-warning font-medium">{row.pending} pendente(s)</span>
                <span>{row.total_items} item(ns) total</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-foreground">{row.total_requests}</p>
              <p className="text-xs text-muted-foreground">solicitação(ões)</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DestinationView({
  data,
  loading,
  error,
  search,
}: {
  data: DestinationReportRow[];
  loading: boolean;
  error: unknown;
  search: string;
}) {
  if (error) return <ErrorState message={(error as Error).message} />;
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  const filtered = data.filter((d) => !search || d.industry_name.toLowerCase().includes(search.toLowerCase()));

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Nenhum destino encontrado"
        description="Aprovando solicitações com indústrias vinculadas, os destinos aparecerão aqui."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {filtered.map((d) => (
        <div key={d.industry_id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{d.industry_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {d.total_requests} solicitação(ões) aprovada(s)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{d.total_items}</p>
              <p className="text-xs text-muted-foreground">itens enviados</p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5 border-t border-border pt-3">
            {d.products.slice(0, 5).map((p, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{p.name}</span>
                <span className="font-semibold text-muted-foreground">{p.quantity}</span>
              </div>
            ))}
            {d.products.length > 5 && (
              <p className="text-xs text-muted-foreground">+{d.products.length - 5} produto(s)...</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
