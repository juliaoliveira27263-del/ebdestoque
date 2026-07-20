import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Plus,
  Search,
  Loader2,
  Check,
  X,
  Trash2,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchRequests,
  fetchMyRequests,
  createRequestWithItems,
  approveRequest,
  rejectRequest,
  deleteRequest,
} from '@/services/requests';
import { fetchProducts } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { useAuth } from '@/contexts/AuthContext';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import {
  REQUEST_STATUS_LABELS,
  REQUEST_STATUS_COLORS,
  ROLE_LABELS,
} from '@/lib/constants';
import type { StockRequest, Product } from '@/types';

export function RequestsPage() {
  const { isAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<StockRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StockRequest | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: allRequests = [], isLoading, error, refetch } = useQuery({
    queryKey: ['requests', isAdmin ? 'all' : 'mine'],
    queryFn: () => (isAdmin ? fetchRequests() : fetchMyRequests(profile!.id)),
    refetchInterval: 15_000,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const filtered = useMemo(() => {
    return allRequests.filter((r) => {
      const matchSearch =
        !search ||
        r.profile?.name.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase().slice(0, 8));
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allRequests, search, statusFilter]);

  const createMutation = useMutation({
    mutationFn: ({ items, notes }: { items: { product_id: string; quantity: number; industry_id?: string | null }[]; notes?: string }) =>
      createRequestWithItems(items, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['requests-by-status'] });
      toast.success('Solicitação criada! O administrador foi notificado.');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao criar solicitação.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['movements-by-day'] });
      toast.success('Solicitação aprovada e estoque atualizado!');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao aprovar solicitação.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => rejectRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['requests-by-status'] });
      toast.success('Solicitação rejeitada.');
      setRejectTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao rejeitar solicitação.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success('Solicitação excluída.');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir solicitação.'),
  });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Solicitações</h2>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'Gerencie todas as solicitações de material' : 'Suas solicitações de material'}
          </p>
        </div>
        {isAdmin ? (
          <RippleButton onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </RippleButton>
        ) : (
          <RippleButton onClick={() => navigate('/solicitar')}>
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </RippleButton>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAdmin ? "Buscar por solicitante..." : "Buscar..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma solicitação encontrada"
          description="Crie uma nova solicitação de material."
          action={
            <RippleButton onClick={() => isAdmin ? setCreateOpen(true) : navigate('/solicitar')}>
              <Plus className="h-4 w-4" />Nova Solicitação
            </RippleButton>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const isExpanded = expanded === r.id;
            const canCancel = !isAdmin && r.status === 'pending' && r.user_id === profile?.id;
            const canDelete = isAdmin;
            return (
              <div
                key={r.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div
                  className="flex cursor-pointer items-center justify-between gap-4 p-4"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <StatusIcon status={r.status} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          Solicitação #{r.id.slice(0, 8)}
                        </span>
                        <Badge className={REQUEST_STATUS_COLORS[r.status]}>
                          {REQUEST_STATUS_LABELS[r.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin && r.profile ? `${r.profile.name} • ` : ''}
                        {r.total_items} item(ns) • {new Date(r.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && r.status === 'pending' && (
                      <>
                        <RippleButton
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); approveMutation.mutate(r.id); }}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Aprovar
                        </RippleButton>
                        <RippleButton
                          size="sm"
                          variant="destructive"
                          onClick={(e) => { e.stopPropagation(); setRejectTarget(r); }}
                        >
                          <X className="h-4 w-4" />
                          Rejeitar
                        </RippleButton>
                      </>
                    )}
                    {canCancel && (
                      <RippleButton
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Cancelar
                      </RippleButton>
                    )}
                    {canDelete && r.status !== 'pending' && (
                      <RippleButton
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </RippleButton>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    {r.notes && (
                      <div className="mb-3 rounded-lg bg-card p-3 text-sm">
                        <span className="font-medium text-foreground">Observações: </span>
                        <span className="text-muted-foreground">{r.notes}</span>
                      </div>
                    )}
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-2 font-medium">Produto</th>
                          <th className="pb-2 font-medium">Destino</th>
                          <th className="pb-2 text-right font-medium">Qtd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.request_items?.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="py-2 text-foreground">
                              {item.product?.name ?? 'Produto removido'}
                              {item.product && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({item.product.stock_quantity} {item.product.unit} em estoque)
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-muted-foreground">
                              {item.industry?.name ?? '-'}
                            </td>
                            <td className="py-2 text-right font-semibold text-foreground">
                              {item.quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <CreateRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        products={products}
        industries={industries}
        onSubmit={(items, notes) => createMutation.mutate({ items, notes })}
        loading={createMutation.isPending}
      />

      {/* Reject Dialog */}
      {rejectTarget && (
        <RejectDialog
          request={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSubmit={(reason) => rejectMutation.mutate({ id: rejectTarget.id, reason })}
          loading={rejectMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.user_id === profile?.id && deleteTarget?.status === 'pending'
                ? 'Cancelar solicitação?'
                : 'Excluir solicitação?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  const map: Record<string, typeof Clock> = {
    pending: Clock,
    approved: CheckCircle2,
    rejected: XCircle,
    fulfilled: Package,
  };
  const Icon = map[status] ?? Clock;
  const color: Record<string, string> = {
    pending: 'text-warning bg-warning/15',
    approved: 'text-success bg-success/15',
    rejected: 'text-destructive bg-destructive/15',
    fulfilled: 'text-secondary bg-secondary/15',
  };
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color[status] ?? ''}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

interface CreateRequestDialogProps {
  open: boolean;
  onClose: () => void;
  products: Product[];
  industries: { id: string; name: string }[];
  onSubmit: (items: { product_id: string; quantity: number; industry_id?: string | null }[], notes?: string) => void;
  loading: boolean;
}

function CreateRequestDialog({ open, onClose, products, industries, onSubmit, loading }: CreateRequestDialogProps) {
  const [items, setItems] = useState<{ product_id: string; quantity: number; industry_id?: string | null }[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  const addItem = () => {
    if (!selectedProduct) return;
    const industryId = selectedIndustry && selectedIndustry !== 'none' ? selectedIndustry : null;
    const existing = items.find((i) => i.product_id === selectedProduct && (i.industry_id ?? null) === industryId);
    if (existing) {
      setItems(items.map((i) =>
        i.product_id === selectedProduct && (i.industry_id ?? null) === industryId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setItems([...items, { product_id: selectedProduct, quantity: 1, industry_id: industryId }]);
    }
    setSelectedProduct('');
    setSelectedIndustry('');
  };

  const updateQty = (index: number, qty: number) => {
    if (qty < 1) {
      setItems(items.filter((_, i) => i !== index));
      return;
    }
    setItems(items.map((it, i) => (i === index ? { ...it, quantity: qty } : it)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item.');
      return;
    }
    onSubmit(items, notes || undefined);
    setItems([]);
    setNotes('');
    setSelectedProduct('');
    setSelectedIndustry('');
  };

  const handleClose = () => {
    setItems([]);
    setNotes('');
    setSelectedProduct('');
    setSelectedIndustry('');
    onClose();
  };

  const activeProducts = products.filter((p) => p.active);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-90vh overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Solicitação</DialogTitle>
          <DialogDescription>
            Selecione os materiais que deseja solicitar do estoque.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Adicionar item</Label>
            <div className="flex gap-2">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                      {p.name} ({p.stock_quantity} {p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Indústria (destino)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem destino</SelectItem>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RippleButton type="button" variant="outline" onClick={addItem} disabled={!selectedProduct}>
                <Plus className="h-4 w-4" />
              </RippleButton>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              {items.map((item, index) => {
                const product = products.find((p) => p.id === item.product_id);
                const industry = industries.find((i) => i.id === item.industry_id);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {product?.name ?? 'Produto'}
                      </div>
                      {industry && (
                        <div className="text-xs text-muted-foreground truncate">
                          Destino: {industry.name}
                        </div>
                      )}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQty(index, parseInt(e.target.value, 10) || 0)}
                      className="h-8 w-20"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(index, 0)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>

          <DialogFooter>
            <RippleButton type="button" variant="ghost" onClick={handleClose}>Cancelar</RippleButton>
            <RippleButton type="submit" disabled={loading || items.length === 0}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Solicitação
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RejectDialogProps {
  request: StockRequest;
  onClose: () => void;
  onSubmit: (reason?: string) => void;
  loading: boolean;
}

function RejectDialog({ request, onClose, onSubmit, loading }: RejectDialogProps) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar Solicitação</DialogTitle>
          <DialogDescription>
            Solicitação #{request.id.slice(0, 8)} de {request.profile?.name ?? 'Usuário'} ({ROLE_LABELS[request.profile?.role ?? 'vendedor']})
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(reason || undefined); }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Estoque insuficiente, item indisponível..."
            />
          </div>
          <DialogFooter>
            <RippleButton type="button" variant="ghost" onClick={onClose}>Cancelar</RippleButton>
            <RippleButton type="submit" variant="destructive" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Rejeitar
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
