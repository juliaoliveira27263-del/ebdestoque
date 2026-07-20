import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  X,
  Loader2,
  ChevronLeft,
  Send,
  Plus,
  Minus,
  Factory,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchProducts } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { createRequestWithItems } from '@/services/requests';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { RippleButton } from '@/components/RippleButton';
import type { Product } from '@/types';

interface CartEntry {
  qty: number;
  industryId: string | null;
}

type Cart = Record<string, CartEntry>;

const NO_INDUSTRY_ID = '__none__';

export function NewRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIndustry, setSelectedIndustry] = useState<{ id: string; name: string } | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: industries = [], isLoading: industriesLoading } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  // Group products by industry_id
  const productsByIndustry = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of activeProducts) {
      const key = p.industry_id ?? NO_INDUSTRY_ID;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [activeProducts]);

  // Industry list: only industries that have active products
  const industryList = useMemo(() => {
    const result: { id: string; name: string; productCount: number; availableCount: number }[] = [];
    for (const industry of industries) {
      if (!industry.active) continue;
      const prods = productsByIndustry.get(industry.id) ?? [];
      if (prods.length === 0) continue;
      result.push({
        id: industry.id,
        name: industry.name,
        productCount: prods.length,
        availableCount: prods.filter((p) => p.stock_quantity > 0).length,
      });
    }
    // Include "Sem indústria" if there are products without industry
    const noIndProds = productsByIndustry.get(NO_INDUSTRY_ID) ?? [];
    if (noIndProds.length > 0) {
      result.push({
        id: NO_INDUSTRY_ID,
        name: 'Sem indústria',
        productCount: noIndProds.length,
        availableCount: noIndProds.filter((p) => p.stock_quantity > 0).length,
      });
    }
    return result;
  }, [industries, productsByIndustry]);

  // Products for the selected industry
  const industryProducts = useMemo(() => {
    if (!selectedIndustry) return [];
    return productsByIndustry.get(selectedIndustry.id) ?? [];
  }, [selectedIndustry, productsByIndustry]);

  const totalItems = Object.values(cart).reduce((s, e) => s + e.qty, 0);
  const cartEntries = Object.entries(cart)
    .filter(([, e]) => e.qty > 0)
    .map(([productId, entry]) => ({
      product: products.find((p) => p.id === productId)!,
      qty: entry.qty,
      industryId: entry.industryId,
    }))
    .filter((e) => e.product);

  const setQty = (productId: string, qty: number, industryId: string | null) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const clamped = Math.max(0, Math.min(qty, product.stock_quantity));
    setCart((prev) => {
      const next = { ...prev };
      if (clamped === 0) delete next[productId];
      else next[productId] = { qty: clamped, industryId };
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () =>
      createRequestWithItems(
        cartEntries.map(({ product, qty, industryId }) => ({
          product_id: product.id,
          quantity: qty,
          industry_id: industryId === NO_INDUSTRY_ID ? null : industryId,
        })),
        notes || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-request-stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Solicitação enviada! O administrador foi notificado.');
      navigate('/profile');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao enviar solicitação.'),
  });

  const handleSubmit = () => {
    if (cartEntries.length === 0) {
      toast.error('Selecione pelo menos um produto.');
      return;
    }
    mutation.mutate();
  };

  const isLoading = productsLoading || industriesLoading;

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        {selectedIndustry ? (
          <button
            onClick={() => setSelectedIndustry(null)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        ) : null}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {selectedIndustry ? selectedIndustry.name : 'Solicitação'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {selectedIndustry
              ? 'Selecione os materiais e as quantidades'
              : 'Escolha uma indústria para ver os materiais disponíveis'}
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-muted h-28" />
          ))}
        </div>
      ) : !selectedIndustry ? (
        /* Industry list */
        industryList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Factory className="mb-4 h-14 w-14 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">Nenhuma indústria disponível</p>
            <p className="text-sm text-muted-foreground mt-1">Entre em contato com o administrador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industryList.map((ind) => {
              const cartCount = Object.entries(cart)
                .filter(([pid, e]) => {
                  const p = products.find((p) => p.id === pid);
                  return e.qty > 0 && (p?.industry_id ?? NO_INDUSTRY_ID) === ind.id;
                })
                .reduce((s, [, e]) => s + e.qty, 0);
              return (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndustry({ id: ind.id, name: ind.name })}
                  className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:bg-card active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Factory className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-base leading-tight">{ind.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {ind.availableCount} de {ind.productCount} disponível(is)
                    </p>
                    {cartCount > 0 && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        <ShoppingCart className="h-3 w-3" />
                        {cartCount} selecionado(s)
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              );
            })}
          </div>
        )
      ) : (
        /* Product grid for selected industry */
        industryProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="mb-4 h-14 w-14 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">Nenhum produto disponível</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {industryProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                qty={cart[product.id]?.qty ?? 0}
                onChangeQty={(qty) => setQty(product.id, qty, selectedIndustry?.id ?? null)}
              />
            ))}
          </div>
        )
      )}

      {/* Sticky cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm shadow-2xl px-4 py-4 lg:left-20">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-md">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {cartEntries.length}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground">{totalItems} {totalItems === 1 ? 'unidade' : 'unidades'}</p>
                <p className="text-xs text-muted-foreground">{cartEntries.length} {cartEntries.length === 1 ? 'produto' : 'produtos'} no carrinho</p>
              </div>
            </div>
            <RippleButton onClick={() => setConfirmOpen(true)} className="gap-2 px-6">
              <Send className="h-4 w-4" />
              Enviar Solicitação
            </RippleButton>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Solicitação</DialogTitle>
            <DialogDescription>Revise os itens antes de enviar.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
            {cartEntries.map(({ product, qty, industryId }) => {
              const indName = industryId === NO_INDUSTRY_ID || !industryId
                ? null
                : industries.find((i) => i.id === industryId)?.name;
              return (
                <div key={product.id} className="flex items-center gap-3 py-1">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted border border-border">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                    {indName && (
                      <p className="truncate text-xs text-muted-foreground">{indName}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-0.5 text-sm font-bold text-primary">
                    {qty} {product.unit}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais para o administrador..."
            />
          </div>

          <DialogFooter>
            <RippleButton variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </RippleButton>
            <RippleButton onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Confirmar e Enviar
            </RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  qty: number;
  onChangeQty: (qty: number) => void;
}

function ProductCard({ product, qty, onChangeQty }: ProductCardProps) {
  const isOut = product.stock_quantity <= 0;
  const isLow = product.min_stock > 0 && product.stock_quantity <= product.min_stock && !isOut;
  const isSelected = qty > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 bg-card shadow-sm transition-all ${
        isSelected
          ? 'border-primary shadow-md shadow-primary/20'
          : 'border-border hover:border-border/80 hover:shadow-md'
      } ${isOut ? 'opacity-60' : ''}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-muted" style={{ height: 150 }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
            isOut
              ? 'bg-destructive text-destructive-foreground'
              : isLow
              ? 'bg-warning text-warning-foreground'
              : 'bg-success/90 text-success-foreground'
          }`}
        >
          {isOut ? 'Sem estoque' : isLow ? 'Pouco estoque' : 'Disponível'}
        </span>
        {isSelected && (
          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <span className="text-xs font-bold">{qty}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {isLow && <AlertTriangle className="h-3 w-3 text-warning" />}
          <span className={isOut ? 'text-destructive' : isLow ? 'text-warning' : ''}>
            {product.stock_quantity} {product.unit} em estoque
          </span>
        </div>

        {/* Quantity controls */}
        <div className="mt-3">
          {isOut ? (
            <span className="text-xs text-destructive font-medium">Indisponível</span>
          ) : qty === 0 ? (
            <button
              onClick={() => onChangeQty(1)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          ) : (
            <div className="flex w-full items-center gap-2">
              <button
                onClick={() => onChangeQty(qty - 1)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                {qty === 1 ? <X className="h-4 w-4 text-destructive" /> : <Minus className="h-4 w-4" />}
              </button>
              <input
                type="number"
                min={1}
                max={product.stock_quantity}
                value={qty}
                onChange={(e) => onChangeQty(parseInt(e.target.value, 10) || 0)}
                className="h-8 flex-1 rounded-lg border border-border bg-background text-center text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={() => onChangeQty(qty + 1)}
                disabled={qty >= product.stock_quantity}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
