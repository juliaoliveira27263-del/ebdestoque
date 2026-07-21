import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, X, Trash2, ChevronDown, ChevronUp, Loader2, Search, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchRequests, fetchMyRequests, approveRequest, rejectRequest, deleteRequest } from '@/services/requests';
import { fetchProducts } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { createRequestWithItems } from '@/services/requests';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/constants';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { RequestStatus } from '@/types';

export function RequestsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ['requests', isAdmin],
    queryFn: () => (isAdmin ? fetchRequests() : fetchMyRequests(profile!.id)),
    enabled: !!profile,
  });

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: industries = [] } = useQuery({ queryKey: ['industries'], queryFn: fetchIndustries });

  const filtered = allRequests.filter((r) => {
    const matchSearch = r.profile?.name?.toLowerCase().includes(search.toLowerCase()) ?? true;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await approveRequest(id);
      toast.success('Solicitação aprovada!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await rejectRequest(rejectTarget, rejectReason);
      toast.success('Solicitação rejeitada!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      setRejectTarget(null);
      setRejectReason('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRequest(id);
      toast.success('Solicitação excluída!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
          <p className="text-sm text-muted-foreground">{isAdmin ? 'Todas as solicitações' : 'Minhas solicitações'}</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <RippleButton><Plus className="h-4 w-4" /> Nova solicitação</RippleButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova solicitação</DialogTitle></DialogHeader>
              <CreateRequestForm
                products={products}
                industries={industries}
                userId={profile!.id}
                onDone={() => { setCreateOpen(false); queryClient.invalidateQueries({ queryKey: ['requests'] }); }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
            <SelectItem value="fulfilled">Atendido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card">
              <button
                className="flex w-full items-center justify-between p-4"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{r.total_items} item(s)</p>
                    <p className="text-xs text-muted-foreground">
                      {r.profile?.name ?? 'Usuário'} · {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={REQUEST_STATUS_COLORS[r.status as RequestStatus]}>
                    {REQUEST_STATUS_LABELS[r.status as RequestStatus]}
                  </Badge>
                  {expanded === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>
              {expanded === r.id && (
                <div className="border-t border-border p-4">
                  {r.request_items && r.request_items.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {r.request_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <span className="text-sm text-foreground">{item.product?.name ?? 'Produto'}</span>
                          <span className="text-sm font-medium text-foreground">{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sem itens.</p>
                  )}
                  {r.notes && <p className="mt-3 text-sm text-muted-foreground">Obs: {r.notes}</p>}
                  <div className="mt-4 flex gap-2">
                    {isAdmin && r.status === 'pending' && (
                      <>
                        <RippleButton variant="default" size="sm" onClick={() => handleApprove(r.id)} disabled={actionLoading}>
                          <Check className="h-4 w-4" /> Aprovar
                        </RippleButton>
                        <RippleButton variant="destructive" size="sm" onClick={() => setRejectTarget(r.id)} disabled={actionLoading}>
                          <X className="h-4 w-4" /> Rejeitar
                        </RippleButton>
                      </>
                    )}
                    {!isAdmin && r.status === 'pending' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <RippleButton variant="destructive" size="sm"><Trash2 className="h-4 w-4" /> Cancelar</RippleButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar solicitação?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(r.id)}>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {isAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <RippleButton variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></RippleButton>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir solicitação?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(r.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar solicitação</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Label>Motivo</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Motivo da rejeição" />
          </div>
          <DialogFooter>
            <DialogClose asChild><RippleButton variant="outline">Cancelar</RippleButton></DialogClose>
            <RippleButton variant="destructive" onClick={handleReject} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} Rejeitar
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateRequestFormProps {
  products: { id: string; name: string }[];
  industries: { id: string; name: string }[];
  userId: string;
  onDone: () => void;
}

function CreateRequestForm({ products, industries, userId, onDone }: CreateRequestFormProps) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [industryId, setIndustryId] = useState('');
  const [items, setItems] = useState<{ product_id: string; quantity: number; industry_id: string | null; product_name: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const addItem = () => {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setItems((prev) => [...prev, { product_id: productId, quantity: parseInt(quantity, 10) || 1, industry_id: industryId || null, product_name: p.name }]);
    setProductId('');
    setQuantity('1');
    setIndustryId('');
  };

  const submit = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      await createRequestWithItems(userId, items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, industry_id: i.industry_id })), notes || null);
      toast.success('Solicitação criada!');
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label>Produto</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Produto" /></SelectTrigger>
            <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Qtd</Label>
          <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Indústria</Label>
        <Select value={industryId} onValueChange={setIndustryId}>
          <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
          <SelectContent>{industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <RippleButton variant="secondary" onClick={addItem}><Plus className="h-4 w-4" /> Adicionar item</RippleButton>
      {items.length > 0 && (
        <div className="flex flex-col gap-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between rounded-lg bg-muted/50 p-2 text-sm">
              <span>{item.product_name}</span>
              <span>{item.quantity}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label>Observações</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <DialogFooter>
        <DialogClose asChild><RippleButton variant="outline">Cancelar</RippleButton></DialogClose>
        <RippleButton onClick={submit} disabled={saving || items.length === 0}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Criar
        </RippleButton>
      </DialogFooter>
    </div>
  );
}
