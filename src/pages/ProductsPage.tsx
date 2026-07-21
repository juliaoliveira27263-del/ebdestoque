import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Package, Loader2, AlertTriangle } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { RippleButton } from '@/components/RippleButton';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface FormState {
  name: string;
  sku: string;
  stock_quantity: string;
  min_stock: string;
  unit: string;
  industry_id: string;
  description: string;
}

const emptyForm: FormState = {
  name: '',
  sku: '',
  stock_quantity: '0',
  min_stock: '0',
  unit: 'un',
  industry_id: '',
  description: '',
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [industryFilter, setIndustryFilter] = React.useState('all');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [adjustId, setAdjustId] = React.useState<string | null>(null);
  const [adjustQty, setAdjustQty] = React.useState('');
  const [adjustReason, setAdjustReason] = React.useState('');
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: industries = [] } = useQuery({ queryKey: ['industries'], queryFn: fetchIndustries });

  const createMutation = useMutation({
    mutationFn: (p: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category' | 'industry'>) => createProduct(p),
    onSuccess: () => { toast.success('Produto criado!'); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) => updateProduct(id, updates),
    onSuccess: () => { toast.success('Produto atualizado!'); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => { toast.success('Produto excluído!'); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason: string }) => adjustStock(id, qty, reason),
    onSuccess: () => { toast.success('Estoque ajustado!'); queryClient.invalidateQueries({ queryKey: ['products'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === 'all' || p.industry_id === industryFilter;
    return matchSearch && matchIndustry;
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      sku: p.sku ?? '',
      stock_quantity: String(p.stock_quantity),
      min_stock: String(p.min_stock),
      unit: p.unit,
      industry_id: p.industry_id ?? '',
      description: p.description ?? '',
    });
    setEditingId(p.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      min_stock: parseInt(form.min_stock, 10) || 0,
      unit: form.unit,
      industry_id: form.industry_id || null,
      description: form.description.trim() || null,
      category_id: null,
      image_url: null,
      active: true,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
    setDialogOpen(false);
  };

  const openAdjust = (id: string) => {
    setAdjustId(id);
    setAdjustQty('');
    setAdjustReason('');
    setAdjustOpen(true);
  };

  const handleAdjust = () => {
    if (!adjustId) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty === 0) { toast.error('Quantidade inválida'); return; }
    adjustMutation.mutate({ id: adjustId, qty, reason: adjustReason || 'Ajuste manual' });
    setAdjustOpen(false);
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
        <RippleButton onClick={openCreate}><Plus className="h-4 w-4" />Novo produto</RippleButton>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Indústria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum produto" description="Crie seu primeiro produto para começar." action={<RippleButton onClick={openCreate}><Plus className="h-4 w-4" />Novo produto</RippleButton>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Estoque</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Indústria</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    {p.sku && <p className="text-xs text-muted-foreground">{p.sku}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-semibold', p.stock_quantity < p.min_stock ? 'text-destructive' : 'text-foreground')}>
                        {p.stock_quantity} {p.unit}
                      </span>
                      {p.stock_quantity < p.min_stock && (
                        <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Baixo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Mín: {p.min_stock}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.industry?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <RippleButton variant="ghost" size="icon" onClick={() => openAdjust(p.id)} title="Ajustar estoque"><Package className="h-4 w-4" /></RippleButton>
                      <RippleButton variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar"><Pencil className="h-4 w-4" /></RippleButton>
                      <RippleButton variant="ghost" size="icon" onClick={() => setDeleteId(p.id)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></RippleButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Editar produto' : 'Novo produto'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5"><Label htmlFor="sku">SKU</Label><Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="unit">Unidade</Label><Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="stock">Estoque atual</Label><Input id="stock" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="min">Estoque mínimo</Label><Input id="min" type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Indústria</Label>
              <Select value={form.industry_id} onValueChange={(v) => setForm({ ...form, industry_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="desc">Descrição</Label><Textarea id="desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <RippleButton variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</RippleButton>
            <RippleButton onClick={handleSave}>{editingId ? 'Salvar' : 'Criar'}</RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajustar estoque</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="adjust-qty">Quantidade (+ ou -)</Label>
              <Input id="adjust-qty" type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="ex: 10 ou -5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adjust-reason">Motivo</Label>
              <Input id="adjust-reason" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Motivo do ajuste" />
            </div>
          </div>
          <DialogFooter>
            <RippleButton variant="outline" onClick={() => setAdjustOpen(false)}>Cancelar</RippleButton>
            <RippleButton onClick={handleAdjust}>Ajustar</RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
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
