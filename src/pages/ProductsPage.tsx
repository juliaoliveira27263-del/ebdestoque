import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { fetchProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import type { Product, Industry } from '@/types';
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

interface ProductForm {
  name: string;
  description: string;
  sku: string;
  stock_quantity: string;
  min_stock: string;
  unit: string;
  industry_id: string;
  category_id: string;
  image_url: string;
  active: boolean;
}

const emptyForm: ProductForm = {
  name: '',
  description: '',
  sku: '',
  stock_quantity: '0',
  min_stock: '0',
  unit: 'un',
  industry_id: '',
  category_id: '',
  image_url: '',
  active: true,
};

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: industries = [] } = useQuery<Industry[]>({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createProduct>[0]) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído com sucesso!');
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason: string }) =>
      adjustStock(id, qty, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Estoque ajustado com sucesso!');
      setAdjustProduct(null);
      setAdjustQty('');
      setAdjustReason('');
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === 'all' || p.industry_id === industryFilter;
    return matchSearch && matchIndustry;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      stock_quantity: String(product.stock_quantity),
      min_stock: String(product.min_stock),
      unit: product.unit,
      industry_id: product.industry_id || '',
      category_id: product.category_id || '',
      image_url: product.image_url || '',
      active: product.active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      sku: form.sku || null,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      min_stock: parseInt(form.min_stock, 10) || 0,
      unit: form.unit,
      industry_id: form.industry_id || null,
      category_id: form.category_id || null,
      image_url: form.image_url || null,
      active: form.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, input: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProduct) return;
    const qty = parseInt(adjustQty, 10);
    if (!qty) {
      toast.error('Quantidade inválida');
      return;
    }
    adjustMutation.mutate({ id: adjustProduct.id, qty, reason: adjustReason });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os produtos do estoque</p>
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
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Filtrar por indústria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as indústrias</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
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
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estoque</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Indústria</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{product.name}</div>
                      {product.sku && (
                        <div className="text-xs text-muted-foreground">SKU: {product.sku}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'font-medium',
                          product.stock_quantity < product.min_stock ? 'text-destructive' : 'text-foreground'
                        )}>
                          {product.stock_quantity} {product.unit}
                        </span>
                        {product.stock_quantity < product.min_stock && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Baixo
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Mín: {product.min_stock}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.industry?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAdjustProduct(product)}
                          title="Ajustar estoque"
                        >
                          <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(product.id)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque</Label>
                <Input id="stock" type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min">Estoque mínimo</Label>
                <Input id="min" type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-industry">Indústria</Label>
              <Select value={form.industry_id} onValueChange={(v) => setForm({ ...form, industry_id: v })}>
                <SelectTrigger id="prod-industry">
                  <SelectValue placeholder="Selecione uma indústria" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adjustProduct} onOpenChange={(o) => !o && setAdjustProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar estoque - {adjustProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adjust-qty">Quantidade (positiva para entrada, negativa para saída)</Label>
              <Input
                id="adjust-qty"
                type="number"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adjust-reason">Motivo</Label>
              <Input
                id="adjust-reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustProduct(null)}>
                Cancelar
              </Button>
              <Button type="submit">Ajustar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será permanentemente excluído.
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
