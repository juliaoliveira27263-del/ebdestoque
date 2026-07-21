import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  SlidersHorizontal,
  Loader2,
  ImagePlus,
  X,
  LayoutList,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Factory,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  type ProductInput,
} from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';

const productSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  sku: z.string().optional(),
  category_id: z.string().optional().nullable(),
  industry_id: z.string().optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0, 'Estoque não pode ser negativo'),
  min_stock: z.coerce.number().int().min(0, 'Estoque mínimo inválido'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  active: z.boolean(),
});

type ProductForm = z.infer<typeof productSchema>;

async function uploadProductImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

export function ProductsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'folders'>('list');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        categoryFilter === 'all' || p.category_id === categoryFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'low' && p.min_stock > 0 && p.stock_quantity <= p.min_stock) ||
        (statusFilter === 'active' && p.active) ||
        (statusFilter === 'inactive' && !p.active);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const industryGroups = useMemo(() => {
    const map = new Map<string, { id: string; name: string; products: typeof filtered }>();
    const NO_IND = '__none__';
    for (const p of filtered) {
      const key = p.industry_id ?? NO_IND;
      const name = p.industry?.name ?? 'Sem indústria';
      if (!map.has(key)) map.set(key, { id: key, name, products: [] });
      map.get(key)!.products.push(p);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.id === NO_IND ? 1 : b.id === NO_IND ? -1 : a.name.localeCompare(b.name)
    );
  }, [filtered]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: 'un', active: true, stock_quantity: 0, min_stock: 0 },
  });

  const createMutation = useMutation({
    mutationFn: (input: ProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-by-category'] });
      toast.success('Produto criado com sucesso!');
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) =>
      updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-by-category'] });
      toast.success('Produto atualizado!');
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Produto excluído.');
      setDeleteId(null);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason: string }) =>
      adjustStock(id, qty, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['movements-by-day'] });
      toast.success('Estoque ajustado!');
      setAdjustProduct(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
    reset({ unit: 'un', active: true, stock_quantity: 0, min_stock: 0, name: '', description: '', sku: '', category_id: null, industry_id: null });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setImageFile(null);
    setImagePreview(p.image_url ?? null);
    reset({
      name: p.name,
      description: p.description ?? '',
      sku: p.sku ?? '',
      category_id: p.category_id,
      industry_id: p.industry_id,
      stock_quantity: p.stock_quantity,
      min_stock: p.min_stock,
      unit: p.unit,
      active: p.active,
    });
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [uploading, setUploading] = useState(false);

  const onSubmit = async (data: ProductForm) => {
    let imageUrl: string | null | undefined = editing?.image_url ?? null;

    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadProductImage(imageFile);
      } catch {
        toast.error('Erro ao fazer upload da imagem.');
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (!imagePreview && editing?.image_url) {
      imageUrl = null;
    }

    const input: ProductInput = {
      name: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      category_id: data.category_id || null,
      industry_id: data.industry_id || null,
      stock_quantity: data.stock_quantity,
      min_stock: data.min_stock,
      unit: data.unit,
      active: data.active,
      image_url: imageUrl ?? null,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || uploading;

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie o catálogo de materiais de merchandising
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card p-1 gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutList className="h-4 w-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('folders')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === 'folders' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              Por Indústria
            </button>
          </div>
          {isAdmin && (
            <RippleButton onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo Produto
            </RippleButton>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
            <SelectItem value="low">Estoque baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
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
          description="Ajuste os filtros ou crie um novo produto."
          action={isAdmin && <RippleButton onClick={openCreate}><Plus className="h-4 w-4" />Novo Produto</RippleButton>}
        />
      ) : viewMode === 'folders' ? (
        /* Industry folder view */
        <div className="space-y-4">
          {industryGroups.map((group) => {
            const isExpanded = expandedFolders.has(group.id);
            const lowCount = group.products.filter((p) => p.min_stock > 0 && p.stock_quantity <= p.min_stock).length;
            return (
              <div key={group.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <button
                  onClick={() => toggleFolder(group.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Factory className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.products.length} produto(s)
                      {lowCount > 0 && (
                        <span className="ml-2 text-warning font-medium">· {lowCount} com estoque baixo</span>
                      )}
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {isExpanded && (
                  <div className="border-t border-border overflow-x-auto">
                    <ProductTable
                      products={group.products}
                      isAdmin={isAdmin}
                      onEdit={openEdit}
                      onDelete={(id) => setDeleteId(id)}
                      onAdjust={(p) => setAdjustProduct(p)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <ProductTable
              products={filtered}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={(id) => setDeleteId(id)}
              onAdjust={(p) => setAdjustProduct(p)}
            />
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize as informações do produto.' : 'Preencha os dados do novo produto.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Image upload */}
            <div className="space-y-2">
              <Label>Foto do produto</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <div className="relative w-full overflow-hidden rounded-xl border border-border bg-muted">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-48 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground shadow backdrop-blur hover:bg-background"
                  >
                    <ImagePlus className="h-3.5 w-3.5" />
                    Trocar foto
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  <ImagePlus className="h-8 w-8" />
                  <span>Clique para adicionar uma foto</span>
                  <span className="text-xs">JPG, PNG ou WebP · máx. 5 MB</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" rows={2} {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" {...register('sku')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria</Label>
                <Select
                  value={watch('category_id') ?? 'none'}
                  onValueChange={(v) => setValue('category_id', v === 'none' ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry_id">Indústria</Label>
              <Select
                value={watch('industry_id') ?? 'none'}
                onValueChange={(v) => setValue('industry_id', v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a indústria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem indústria</SelectItem>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Estoque</Label>
                <Input id="stock_quantity" type="number" min={0} {...register('stock_quantity')} />
                {errors.stock_quantity && <p className="text-xs text-destructive">{errors.stock_quantity.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_stock">Mínimo</Label>
                <Input id="min_stock" type="number" min={0} {...register('min_stock')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input id="unit" {...register('unit')} />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Switch
                id="active"
                checked={watch('active')}
                onCheckedChange={(v) => setValue('active', v)}
              />
              <Label htmlFor="active" className="cursor-pointer">Produto ativo</Label>
            </div>
            <DialogFooter>
              <RippleButton type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </RippleButton>
              <RippleButton type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Salvar' : 'Criar'}
              </RippleButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O produto será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust stock dialog */}
      {adjustProduct && (
        <AdjustStockDialog
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSubmit={(qty, reason) =>
            adjustMutation.mutate({ id: adjustProduct.id, qty, reason })
          }
          loading={adjustMutation.isPending}
        />
      )}
    </div>
  );
}

interface ProductTableProps {
  products: Product[];
  isAdmin: boolean;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  onAdjust: (p: Product) => void;
}

function ProductTable({ products, isAdmin, onEdit, onDelete, onAdjust }: ProductTableProps) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b border-border bg-muted/50">
        <tr>
          <th className="px-4 py-3 text-left font-semibold text-foreground">Produto</th>
          <th className="px-4 py-3 text-left font-semibold text-foreground">SKU</th>
          <th className="px-4 py-3 text-left font-semibold text-foreground">Categoria</th>
          <th className="px-4 py-3 text-right font-semibold text-foreground">Estoque</th>
          <th className="px-4 py-3 text-right font-semibold text-foreground">Mínimo</th>
          <th className="px-4 py-3 text-center font-semibold text-foreground">Status</th>
          {isAdmin && <th className="px-4 py-3 text-right font-semibold text-foreground">Ações</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {products.map((p) => {
          const isLow = p.min_stock > 0 && p.stock_quantity <= p.min_stock;
          return (
            <tr key={p.id} className="transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-foreground">{p.name}</div>
                    {p.description && (
                      <div className="truncate text-xs text-muted-foreground max-w-40">
                        {p.description}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{p.sku ?? '-'}</td>
              <td className="px-4 py-3">
                {p.category ? (
                  <Badge variant="secondary">{p.category.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <span className={`font-semibold ${isLow ? 'text-warning' : 'text-foreground'}`}>
                  {p.stock_quantity}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">{p.unit}</span>
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">{p.min_stock}</td>
              <td className="px-4 py-3 text-center">
                {isLow ? (
                  <Badge className="bg-warning/15 text-warning">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Baixo
                  </Badge>
                ) : p.active ? (
                  <Badge className="bg-success/15 text-success">Ativo</Badge>
                ) : (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </td>
              {isAdmin && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onAdjust(p)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Ajustar estoque"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(p)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

interface AdjustStockDialogProps {
  product: Product;
  onClose: () => void;
  onSubmit: (qty: number, reason: string) => void;
  loading: boolean;
}

function AdjustStockDialog({ product, onClose, onSubmit, loading }: AdjustStockDialogProps) {
  const [qty, setQty] = useState('0');
  const [reason, setReason] = useState('');

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(qty, 10);
    if (isNaN(n) || n === 0) {
      toast.error('Informe uma quantidade diferente de zero.');
      return;
    }
    onSubmit(n, reason || 'Ajuste manual');
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            Produto: <strong>{product.name}</strong> — Estoque atual: {product.stock_quantity} {product.unit}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="qty">Quantidade (use negativo para saída)</Label>
            <Input
              id="qty"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Ex: 10 ou -5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Inventário, perda, doação..."
            />
          </div>
          <DialogFooter>
            <RippleButton type="button" variant="ghost" onClick={onClose}>Cancelar</RippleButton>
            <RippleButton type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
