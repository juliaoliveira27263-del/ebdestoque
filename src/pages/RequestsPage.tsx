import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRequests, fetchMyRequests, approveRequest, rejectRequest, deleteRequest } from '@/services/requests';
import type { StockRequest } from '@/types';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/RippleButton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RequestsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectRequest_, setRejectRequest_] = useState<StockRequest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests = [], isLoading } = useQuery<StockRequest[]>({
    queryKey: isAdmin ? ['requests'] : ['my-requests', profile?.id],
    queryFn: () => (isAdmin ? fetchRequests() : fetchMyRequests(profile!.id)),
    enabled: !!profile,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Solicitação aprovada!');
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Solicitação rejeitada');
      setRejectRequest_(null);
      setRejectReason('');
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Solicitação excluída!');
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const filtered = requests.filter((r) => {
    const matchSearch = r.profile?.name?.toLowerCase().includes(search.toLowerCase()) || search === '';
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? 'Gerencie todas as solicitações' : 'Suas solicitações de produtos'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="approved">Aprovadas</SelectItem>
            <SelectItem value="rejected">Rejeitadas</SelectItem>
            <SelectItem value="fulfilled">Atendidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
          <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((request) => (
            <div key={request.id} className="rounded-2xl border border-border bg-card shadow-sm">
              <button
                onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                {expandedId === request.id ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {request.profile?.name || 'Usuário'}
                    </span>
                    <Badge className={cn('border-0', REQUEST_STATUS_COLORS[request.status])}>
                      {REQUEST_STATUS_LABELS[request.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {request.total_items} itens • {formatDate(request.created_at)}
                  </p>
                </div>
                {request.status === 'pending' && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-success hover:bg-success/10"
                          onClick={() => approveMutation.mutate(request.id)}
                          title="Aprovar"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setRejectRequest_(request)}
                          title="Rejeitar"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {!isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(request.id)}
                        title="Cancelar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                {(isAdmin || request.status !== 'pending') && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteId(request.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </button>

              {expandedId === request.id && (
                <div className="border-t border-border p-4">
                  {request.notes && (
                    <p className="mb-3 text-sm text-muted-foreground">
                      <span className="font-medium">Observações:</span> {request.notes}
                    </p>
                  )}
                  <div className="space-y-1">
                    {request.request_items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-foreground">
                          {item.product?.name || 'Produto'}
                        </span>
                        <span className="text-muted-foreground">
                          {item.quantity} {item.product?.unit || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rejectRequest_} onOpenChange={(o) => !o && setRejectRequest_(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da rejeição</Label>
            <Textarea
              id="reason"
              placeholder="Informe o motivo..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectRequest_(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectRequest_ &&
                rejectMutation.mutate({ id: rejectRequest_.id, reason: rejectReason })
              }
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A solicitação será permanentemente excluída.
            </AlertDialogDescription>
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
