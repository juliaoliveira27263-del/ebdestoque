import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Loader2, ClipboardList, Check, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRequests, fetchMyRequests, approveRequest, rejectRequest, deleteRequest } from '@/services/requests';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { RippleButton } from '@/components/RippleButton';
import { EmptyState } from '@/components/EmptyState';
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { StockRequest, RequestStatus } from '@/types';

export function RequestsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [rejectRequest_, setRejectRequest_] = React.useState<StockRequest | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['requests', profile?.id, isAdmin],
    queryFn: () => (isAdmin ? fetchRequests() : fetchMyRequests(profile!.id)),
    enabled: !!profile,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: () => { toast.success('Solicitação aprovada!'); queryClient.invalidateQueries({ queryKey: ['requests'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectRequest(id, reason),
    onSuccess: () => { toast.success('Solicitação rejeitada!'); queryClient.invalidateQueries({ queryKey: ['requests'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: () => { toast.success('Solicitação excluída!'); queryClient.invalidateQueries({ queryKey: ['requests'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = requests.filter((r) => {
    const matchSearch = r.profile?.name?.toLowerCase().includes(search.toLowerCase()) ?? true;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleReject = () => {
    if (!rejectRequest_) return;
    rejectMutation.mutate({ id: rejectRequest_.id, reason: rejectReason || 'Rejeitado' });
    setRejectRequest_(null);
    setRejectReason('');
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma solicitação" description="Não há solicitações para exibir." />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card shadow-sm">
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', REQUEST_STATUS_COLORS[r.status])}>
                    {r.status === 'approved' ? <Check className="h-5 w-5" /> : r.status === 'rejected' ? <X className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.profile?.name ?? 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')} · {r.total_items} itens</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={REQUEST_STATUS_COLORS[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                  {expandedId === r.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-border p-4">
                  {r.notes && <p className="mb-3 text-sm text-muted-foreground">Obs: {r.notes}</p>}
                  <div className="space-y-2">
                    {r.request_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.product?.name ?? 'Produto'}</p>
                          {item.industry?.name && <p className="text-xs text-muted-foreground">{item.industry.name}</p>}
                        </div>
                        <Badge variant="secondary">{item.quantity} {item.product?.unit ?? 'un'}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {isAdmin && r.status === 'pending' && (
                      <>
                        <RippleButton size="sm" onClick={() => approveMutation.mutate(r.id)} disabled={approveMutation.isPending}>
                          <Check className="h-4 w-4" />Aprovar
                        </RippleButton>
                        <RippleButton size="sm" variant="destructive" onClick={() => setRejectRequest_(r)}>
                          <X className="h-4 w-4" />Rejeitar
                        </RippleButton>
                      </>
                    )}
                    {!isAdmin && r.status === 'pending' && (
                      <RippleButton size="sm" variant="destructive" onClick={() => setDeleteId(r.id)}>Cancelar</RippleButton>
                    )}
                    {isAdmin && (
                      <RippleButton size="sm" variant="ghost" onClick={() => setDeleteId(r.id)}><Plus className="h-4 w-4 rotate-45" />Excluir</RippleButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!rejectRequest_} onOpenChange={(o) => { if (!o) { setRejectRequest_(null); setRejectReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar solicitação</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea id="reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motivo da rejeição..." />
          </div>
          <DialogFooter>
            <RippleButton variant="outline" onClick={() => { setRejectRequest_(null); setRejectReason(''); }}>Cancelar</RippleButton>
            <RippleButton variant="destructive" onClick={handleReject}>Rejeitar</RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
