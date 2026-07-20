import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  Package,
  Boxes,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  ArrowLeftRight,
  Check,
  X,
  Loader2,
  Clock,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatCard } from '@/components/StatCard';
import { ErrorState } from '@/components/ErrorState';
import {
  fetchDashboardStats,
  fetchStockByCategory,
  fetchMovementsByDay,
} from '@/services/dashboard';
import { fetchRequests, approveRequest, rejectRequest } from '@/services/requests';
import { Badge } from '@/components/ui/badge';
import { RippleButton } from '@/components/RippleButton';
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { StockRequest } from '@/types';

export function DashboardPage() {
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<StockRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 15_000,
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['requests', 'all'],
    queryFn: fetchRequests,
    refetchInterval: 10_000,
  });

  const { data: stockByCategory = [] } = useQuery({
    queryKey: ['stock-by-category'],
    queryFn: fetchStockByCategory,
    refetchInterval: 30_000,
  });

  const { data: movementsByDay = [] } = useQuery({
    queryKey: ['movements-by-day'],
    queryFn: () => fetchMovementsByDay(14),
    refetchInterval: 30_000,
  });

  const pendingRequests = allRequests.filter((r) => r.status === 'pending');

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['movements-by-day'] });
      queryClient.invalidateQueries({ queryKey: ['stock-by-category'] });
      toast.success('Solicitação aprovada e estoque atualizado!');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao aprovar.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Solicitação rejeitada.');
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao rejeitar.'),
  });

  if (statsError) {
    return <ErrorState message={statsError.message} onRetry={() => refetchStats()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Visão geral do estoque e solicitações</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Package} label="Produtos" value={stats?.totalProducts ?? 0} loading={statsLoading} tone="primary" />
        <StatCard icon={Boxes} label="Unidades em Estoque" value={stats?.totalStock ?? 0} loading={statsLoading} tone="default" />
        <StatCard
          icon={AlertTriangle}
          label="Estoque Baixo"
          value={stats?.lowStockCount ?? 0}
          loading={statsLoading}
          tone={stats && stats.lowStockCount > 0 ? 'warning' : 'default'}
          hint={stats && stats.lowStockCount > 0 ? 'Requer atenção' : 'Tudo certo'}
        />
        <StatCard
          icon={ClipboardList}
          label="Pendentes"
          value={pendingRequests.length}
          loading={statsLoading}
          tone={pendingRequests.length > 0 ? 'primary' : 'default'}
          hint={pendingRequests.length > 0 ? 'Aguardando aprovação' : 'Nada pendente'}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Aprovadas (total)" value={stats?.approvedRequests ?? 0} loading={statsLoading} tone="success" />
        <StatCard icon={ArrowLeftRight} label="Movimentações" value={stats?.totalMovements ?? 0} loading={statsLoading} tone="default" />
        <StatCard icon={Users} label="Usuários" value={stats?.totalUsers ?? 0} loading={statsLoading} tone="default" />
        <div className="flex flex-col justify-center rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hoje</p>
          <p className="mt-1 text-sm font-bold text-foreground leading-snug">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Pending requests */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-warning" />
          <h3 className="text-base font-semibold text-foreground">Solicitações Pendentes</h3>
          {pendingRequests.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1.5 text-xs font-bold text-warning-foreground">
              {pendingRequests.length}
            </span>
          )}
        </div>

        {pendingRequests.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-10">
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" />
              <p className="font-medium text-foreground">Nenhuma solicitação pendente</p>
              <p className="text-sm text-muted-foreground">Tudo em dia!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <PendingRequestCard
                key={r.id}
                request={r}
                onApprove={() => approveMutation.mutate(r.id)}
                onReject={() => { setRejectTarget(r); setRejectReason(''); }}
                approving={approveMutation.isPending && approveMutation.variables === r.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Movimentações (14 dias)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementsByDay}>
                <defs>
                  <linearGradient id="inGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}`; }}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="in" name="Entrada" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#inGradient)" animationDuration={800} />
                <Area type="monotone" dataKey="out" name="Saída" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#outGradient)" animationDuration={800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-foreground">Estoque por Categoria</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="quantity" name="Quantidade" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent resolved requests table */}
      {allRequests.filter((r) => r.status !== 'pending').length > 0 && (
        <div>
          <h3 className="mb-3 text-base font-semibold text-foreground">Solicitações Recentes</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Solicitante</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Data</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">Itens</th>
                    <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allRequests
                    .filter((r) => r.status !== 'pending')
                    .slice(0, 10)
                    .map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{r.profile?.name ?? 'Usuário'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 text-center text-muted-foreground">{r.total_items}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={REQUEST_STATUS_COLORS[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Solicitação de {rejectTarget?.profile?.name ?? 'Usuário'} com {rejectTarget?.total_items} item(ns)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Motivo (opcional)</Label>
            <Textarea
              id="rejectReason"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ex: Estoque insuficiente..."
            />
          </div>
          <DialogFooter>
            <RippleButton variant="ghost" onClick={() => setRejectTarget(null)}>Cancelar</RippleButton>
            <RippleButton
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() =>
                rejectTarget &&
                rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason || undefined })
              }
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Rejeitar
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface PendingRequestCardProps {
  request: StockRequest;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
}

function PendingRequestCard({ request, onApprove, onReject, approving }: PendingRequestCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-warning/40 bg-card shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between gap-4 p-4 hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{request.profile?.name ?? 'Usuário'}</p>
            <p className="text-xs text-muted-foreground">
              {request.total_items} item(ns) • {new Date(request.created_at).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <RippleButton size="sm" onClick={onApprove} disabled={approving}>
            {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Aprovar
          </RippleButton>
          <RippleButton size="sm" variant="destructive" onClick={onReject}>
            <X className="h-4 w-4" />
            Rejeitar
          </RippleButton>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4">
          {request.notes && (
            <div className="mb-3 rounded-lg bg-card p-3 text-sm">
              <span className="font-medium">Obs: </span>
              <span className="text-muted-foreground">{request.notes}</span>
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-medium">Produto</th>
                <th className="pb-2 text-right font-medium">Solicitado</th>
                <th className="pb-2 text-right font-medium">Em estoque</th>
              </tr>
            </thead>
            <tbody>
              {request.request_items?.map((item) => {
                const ok = (item.product?.stock_quantity ?? 0) >= item.quantity;
                return (
                  <tr key={item.id} className="border-t border-border">
                    <td className="py-2 text-foreground">{item.product?.name ?? 'Produto removido'}</td>
                    <td className="py-2 text-right font-semibold text-foreground">{item.quantity}</td>
                    <td className={`py-2 text-right font-semibold ${ok ? 'text-success' : 'text-destructive'}`}>
                      {item.product?.stock_quantity ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
