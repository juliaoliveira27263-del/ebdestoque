import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Loader2,
  ClipboardList,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchRequests,
  fetchMyRequests,
  approveRequest,
  rejectRequest,
  deleteRequest,
} from '@/services/requests';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { StockRequest, RequestStatus } from '@/types';

export default function RequestsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<StockRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: requests = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['requests', profile?.id, isAdmin],
    queryFn: () =>
      isAdmin && profile ? fetchRequests() : profile ? fetchMyRequests(profile.id) : Promise.resolve([]),
    enabled: !!profile,
  });

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.notes?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: () => {
      toast.success('Solicitação aprovada!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (!rejectTarget) throw new Error('Nenhuma solicitação selecionada.');
      return rejectRequest(rejectTarget.id, rejectReason);
    },
    onSuccess: () => {
      toast.success('Solicitação rejeitada.');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRejectTarget(null);
      setRejectReason('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: () => {
      toast.success('Solicitação excluída.');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-request-stats'] });
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? 'Gerencie todas as solicitações.' : 'Acompanhe suas solicitações.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {REQUEST_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma solicitação"
          description="Não há solicitações para exibir."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {isAdmin ? r.profile?.name ?? 'Usuário' : `Solicitação`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.total_items} item(s) — {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(REQUEST_STATUS_COLORS[r.status])}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </Badge>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 py-3 space-y-3">
                    {r.request_items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-foreground">{item.product?.name ?? 'Produto'}</span>
                        <span className="text-muted-foreground">
                          {item.quantity} un. {item.industry?.name ? `(${item.industry.name})` : ''}
                        </span>
                      </div>
                    ))}
                    {r.notes && (
                      <p className="text-sm text-muted-foreground border-t border-border pt-2">
                        {r.notes}
                      </p>
                    )}
                    <div className="flex gap-2 pt-2">
                      {isAdmin && r.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(r.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setRejectTarget(r)}
                          >
                            <X className="h-4 w-4" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {!isAdmin && r.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Cancelar
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da rejeição..."
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
