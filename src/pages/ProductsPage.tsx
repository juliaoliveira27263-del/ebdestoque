import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Loader2, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/RippleButton';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { cn } from '@/lib/utils';
import type { Product, Industry } from '@/types';

interface ProductForm {
  name: string;
  description: string;
  sku: string;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  industry_id: string;
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    sku: '',
    stock_quantity: 0,
    min_stock: 0,
    unit: 'un',
    industry_id: '',
  });
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === 'all' || p.industry_id === industryFilter;
    return matchSearch && matchIndustry;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      sku: '',
      stock_quantity: 0,
      min_stock: 0,
      unit: 'un',
      industry_id: '',
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
      sku: p.sku ?? '',
      stock_quantity: p.stock_quantity,
      min_stock: p.min_stock,
      unit: p.unit,
      industry_id: p.industry_id ?? '',
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || null,
        sku: form.sku || null,
        stock_quantity: form.stock_quantity,
        min_stock: form.min_stock,
        unit: form.unit,
        industry_id: form.industry_id || null,
        category_id: null,
        image_url: null,
        active: true,
      };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Produto atualizado!' : 'Produto criado!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Produto excluído!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjustProduct) return;
      const qty = parseInt(adjustQty, 10);
      if (!qty) throw new Error('Quantidade inválida.');
      await adjustStock(adjustProduct.id, qty, adjustReason || 'Ajuste manual');
    },
    onSuccess: () => {
      toast.success('Estoque ajustado!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setAdjustOpen(false);
      setAdjustProduct(null);
      setAdjustQty('');
      setAdjustReason('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie o catálogo de produtos.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo produto
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Indústria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {industries.map((i: Industry) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
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
          icon={Package}
          title="Nenhum produto"
          description="Crie seu primeiro produto."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Novo produto</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estoque</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indústria</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const low = p.stock_quantity < p.min_stock;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={cn('font-semibold', low && 'text-destructive')}>
                        {p.stock_quantity} {p.unit}
                      </span>
                      {low && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Baixo
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.industry?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setAdjustProduct(p);
                            setAdjustOpen(true);
                          }}
                          title="Ajustar estoque"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(p)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(p.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome</Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Descrição</Label>
              <Textarea
                id="p-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-sku">SKU</Label>
                <Input
                  id="p-sku"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-unit">Unidade</Label>
                <Input
                  id="p-unit"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-stock">Estoque</Label>
                <Input
                  id="p-stock"
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-min">Estoque mínimo</Label>
                <Input
                  id="p-min"
                  type="number"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Indústria</Label>
              <Select
                value={form.industry_id}
                onValueChange={(v) => setForm({ ...form, industry_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((i: Industry) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar estoque — {adjustProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Estoque atual: <span className="font-semibold text-foreground">{adjustProduct?.stock_quantity}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="adj-qty">Quantidade (+/-)</Label>
              <Input
                id="adj-qty"
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="ex: 10 ou -5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adj-reason">Motivo</Label>
              <Input
                id="adj-reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Motivo do ajuste"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => adjustMutation.mutate()} disabled={adjustMutation.isPending}>
              {adjustMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Ajustar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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
