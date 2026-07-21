import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, AlertTriangle, Loader2, Search } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, adjustStock } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Product } from '@/types';

interface ProductForm {
  name: string;
  sku: string;
  stock_quantity: string;
  min_stock: string;
  unit: string;
  industry_id: string;
}

export function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({ name: '', sku: '', stock_quantity: '0', min_stock: '0', unit: 'un', industry_id: '' });
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [newQty, setNewQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: industries = [] } = useQuery({ queryKey: ['industries'], queryFn: fetchIndustries });

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industryFilter === 'all' || p.industry_id === industryFilter;
    return matchSearch && matchIndustry;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', sku: '', stock_quantity: '0', min_stock: '0', unit: 'un', industry_id: '' });
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku ?? '',
      stock_quantity: String(p.stock_quantity),
      min_stock: String(p.min_stock),
      unit: p.unit,
      industry_id: p.industry_id ?? '',
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku || null,
        stock_quantity: parseInt(form.stock_quantity, 10) || 0,
        min_stock: parseInt(form.min_stock, 10) || 0,
        unit: form.unit,
        industry_id: form.industry_id || null,
        active: true,
        description: null,
        image_url: null,
        category_id: null,
      };
      if (editing) {
        await updateProduct(editing.id, payload);
        toast.success('Produto atualizado!');
      } else {
        await createProduct(payload);
        toast.success('Produto criado!');
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success('Produto excluído!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleAdjust = async () => {
    if (!adjustProduct) return;
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 0) {
      toast.error('Quantidade inválida');
      return;
    }
    setSaving(true);
    try {
      await adjustStock(adjustProduct.id, qty, adjustReason || 'Ajuste manual');
      toast.success('Estoque ajustado!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setAdjustProduct(null);
      setNewQty('');
      setAdjustReason('');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">Gerencie o estoque de produtos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <RippleButton onClick={openCreate}><Plus className="h-4 w-4" /> Novo produto</RippleButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Estoque</Label>
                  <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Estoque mínimo</Label>
                  <Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Unidade</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Indústria</Label>
                <Select value={form.industry_id} onValueChange={(v) => setForm({ ...form, industry_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><RippleButton variant="outline">Cancelar</RippleButton></DialogClose>
              <RippleButton onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
              </RippleButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Indústria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Produto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Estoque</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Indústria</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-sm text-foreground">{p.name}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{p.stock_quantity} {p.unit}</span>
                    {p.stock_quantity < p.min_stock && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> Baixo
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{p.industry?.name ?? '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <RippleButton variant="ghost" size="icon" onClick={() => { setAdjustProduct(p); setNewQty(String(p.stock_quantity)); }}>
                          <AlertTriangle className="h-4 w-4" />
                        </RippleButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Ajustar estoque - {p.name}</DialogTitle></DialogHeader>
                        <div className="flex flex-col gap-4 py-2">
                          <div className="flex flex-col gap-2">
                            <Label>Nova quantidade</Label>
                            <Input type="number" min="0" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label>Motivo</Label>
                            <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Motivo do ajuste" />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild><RippleButton variant="outline">Cancelar</RippleButton></DialogClose>
                          <RippleButton onClick={handleAdjust} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Ajustar
                          </RippleButton>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <RippleButton variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></RippleButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Editar produto</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-1 gap-4 py-2">
                          <div className="flex flex-col gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                          <div className="flex flex-col gap-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2"><Label>Estoque</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></div>
                            <div className="flex flex-col gap-2"><Label>Mínimo</Label><Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></div>
                          </div>
                          <div className="flex flex-col gap-2"><Label>Unidade</Label><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></div>
                          <div className="flex flex-col gap-2">
                            <Label>Indústria</Label>
                            <Select value={form.industry_id} onValueChange={(v) => setForm({ ...form, industry_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                              <SelectContent>
                                {industries.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild><RippleButton variant="outline">Cancelar</RippleButton></DialogClose>
                          <RippleButton onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</RippleButton>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <RippleButton variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></RippleButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(p.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
