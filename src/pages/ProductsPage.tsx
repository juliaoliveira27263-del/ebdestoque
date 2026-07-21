import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package, Plus, Search, Loader2, Pencil, Trash2, ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchProducts, createProduct, updateProduct, deleteProduct, adjustStock,
} from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { cn } from '@/lib/utils';
import type { Product, Industry } from '@/types';

interface FormState {
  name: string; description: string; sku: string; category_id: string;
  stock_quantity: string; min_stock: string; unit: string; industry_id: string; active: boolean;
}

const emptyForm: FormState = {
  name: '', description: '', sku: '', category_id: '', stock_quantity: '0',
  min_stock: '0', unit: 'un', industry_id: '', active: true,
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const { data: industries = [] } = useQuery({ queryKey: ['industries'], queryFn: fetchIndustries });

  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === 'all' || p.industry_id === industryFilter;
    return matchSearch && matchIndustry;
  }), [products, search, industryFilter]);

  const invalidateProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  };

  const createMutation = useMutation({
    mutationFn: (input: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'industry'>) => createProduct(input),
    onSuccess: () => { invalidateProducts(); toast.success('Produto criado com sucesso!'); setCreateOpen(false); },
    onError: (err: Error) => toast.error(err.message || 'Erro ao criar produto.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Product> }) => updateProduct(id, input),
    onSuccess: () => { invalidateProducts(); toast.success('Produto atualizado!'); setEditTarget(null); },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar produto.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { invalidateProducts(); toast.success('Produto excluído.'); setDeleteTarget(null); },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir produto.'),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason: string }) => adjustStock(id, qty, reason),
    onSuccess: () => {
      invalidateProducts();
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Estoque ajustado!'); setAdjustTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao ajustar estoque.'),
  });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
          <p className="text-sm text-muted-foreground">Gerencie o catálogo de produtos e estoque</p>
        </div>
        <RippleButton onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Novo Produto
        </RippleButton>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Indústria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as indústrias</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto encontrado"
          description="Cadastre um novo produto para começar."
          action={<RippleButton onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Novo Produto</RippleButton>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 text-right font-medium">Estoque</th>
                <th className="px-4 py-3 text-right font-medium">Mínimo</th>
                <th className="px-4 py-3 font-medium">Indústria</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.stock_quantity < p.min_stock;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.name}</div>
                      {p.description && <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.sku ?? '-'}</td>
                    <td className={cn('px-4 py-3 text-right font-semibold', isLow ? 'text-destructive' : 'text-foreground')}>
                      {p.stock_quantity} {p.unit}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.min_stock} {p.unit}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.industry?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <Badge className="bg-destructive/15 text-destructive">Estoque baixo</Badge>
                      ) : p.active ? (
                        <Badge className="bg-success/15 text-success">Ativo</Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RippleButton size="icon" variant="ghost" onClick={() => setAdjustTarget(p)} title="Ajustar estoque">
                          <ArrowUpDown className="h-4 w-4" />
                        </RippleButton>
                        <RippleButton size="icon" variant="ghost" onClick={() => setEditTarget(p)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </RippleButton>
                        <RippleButton size="icon" variant="ghost" onClick={() => setDeleteTarget(p)} title="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </RippleButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <ProductDialog
          industries={industries}
          onClose={() => setCreateOpen(false)}
          onSubmit={(form) => createMutation.mutate({
            name: form.name, description: form.description || null, sku: form.sku || null,
            category_id: form.category_id || null, stock_quantity: parseInt(form.stock_quantity, 10) || 0,
            min_stock: parseInt(form.min_stock, 10) || 0, unit: form.unit,
            industry_id: form.industry_id || null, active: form.active, image_url: null,
          })}
          loading={createMutation.isPending}
        />
      )}

      {editTarget && (
        <ProductDialog
          product={editTarget}
          industries={industries}
          onClose={() => setEditTarget(null)}
          onSubmit={(form) => updateMutation.mutate({
            id: editTarget.id,
            input: {
              name: form.name, description: form.description || null, sku: form.sku || null,
              category_id: form.category_id || null, stock_quantity: parseInt(form.stock_quantity, 10) || 0,
              min_stock: parseInt(form.min_stock, 10) || 0, unit: form.unit,
              industry_id: form.industry_id || null, active: form.active,
            },
          })}
          loading={updateMutation.isPending}
        />
      )}

      {adjustTarget && (
        <AdjustDialog
          product={adjustTarget}
          onClose={() => setAdjustTarget(null)}
          onSubmit={(qty, reason) => adjustMutation.mutate({ id: adjustTarget.id, qty, reason })}
          loading={adjustMutation.isPending}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProductDialogProps {
  product?: Product;
  industries: Industry[];
  onClose: () => void;
  onSubmit: (form: FormState) => void;
  loading: boolean;
}

function ProductDialog({ product, industries, onClose, onSubmit, loading }: ProductDialogProps) {
  const [form, setForm] = useState<FormState>(product ? {
    name: product.name, description: product.description ?? '', sku: product.sku ?? '',
    category_id: product.category_id ?? '', stock_quantity: String(product.stock_quantity),
    min_stock: String(product.min_stock), unit: product.unit,
    industry_id: product.industry_id ?? '', active: product.active,
  } : emptyForm);

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Informe o nome do produto.'); return; }
    onSubmit(form);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-90vh overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>{product ? 'Atualize as informações do produto.' : 'Cadastre um novo produto no estoque.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome do produto" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Descrição opcional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="Código SKU" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input id="unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="un, kg, L..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque</Label>
              <Input id="stock" type="number" min={0} value={form.stock_quantity} onChange={(e) => set('stock_quantity', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Estoque Mínimo</Label>
              <Input id="min_stock" type="number" min={0} value={form.min_stock} onChange={(e) => set('min_stock', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Indústria</Label>
            <Select value={form.industry_id || 'none'} onValueChange={(v) => set('industry_id', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem indústria</SelectItem>
                {industries.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="active" className="text-sm font-medium">Produto ativo</Label>
            <Switch id="active" checked={form.active} onCheckedChange={(v) => set('active', v)} />
          </div>
          <DialogFooter>
            <RippleButton type="button" variant="ghost" onClick={onClose}>Cancelar</RippleButton>
            <RippleButton type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {product ? 'Salvar' : 'Criar'}
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AdjustDialogProps {
  product: Product;
  onClose: () => void;
  onSubmit: (qty: number, reason: string) => void;
  loading: boolean;
}

function AdjustDialog({ product, onClose, onSubmit, loading }: AdjustDialogProps) {
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(qty, 10);
    if (isNaN(n) || n === 0) { toast.error('Informe uma quantidade válida (positiva para entrada, negativa para saída).'); return; }
    onSubmit(n, reason || 'Ajuste manual');
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>{product.name} — Atual: {product.stock_quantity} {product.unit}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qty">Quantidade (use negativo para saída)</Label>
            <Input id="qty" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Ex: 10 ou -5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea id="reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: Inventário, perda, correção..." />
          </div>
          <DialogFooter>
            <RippleButton type="button" variant="ghost" onClick={onClose}>Cancelar</RippleButton>
            <RippleButton type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Ajuste
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
