import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, AlertTriangle } from 'lucide-react';
import { fetchProducts } from '@/services/products';
import { Input } from '@/components/ui/input';

export function CatalogPage() {
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(q) ||
          (p.sku ?? '').toLowerCase().includes(q) ||
          (p.category?.name ?? '').toLowerCase().includes(q))
    );
  }, [products, search]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Catálogo de Materiais</h2>
        <p className="text-sm text-muted-foreground">
          {filtered.length > 0 ? `${filtered.length} ${filtered.length === 1 ? 'material disponível' : 'materiais disponíveis'}` : 'Materiais disponíveis para solicitação'}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar material..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-muted" style={{ height: 260 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Package className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-foreground">
            {search ? 'Nenhum material encontrado' : 'Sem materiais disponíveis'}
          </p>
          {search && (
            <p className="mt-1 text-sm text-muted-foreground">
              Tente buscar com outros termos
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => {
            const isLow =
              product.min_stock > 0 && product.stock_quantity <= product.min_stock && product.stock_quantity > 0;
            const isOut = product.stock_quantity <= 0;

            return (
              <div
                key={product.id}
                className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Image */}
                <div className="relative overflow-hidden bg-muted" style={{ height: 160 }}>
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Stock status badge */}
                  <span
                    className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                      isOut
                        ? 'bg-destructive text-destructive-foreground'
                        : isLow
                        ? 'bg-warning text-warning-foreground'
                        : 'bg-success text-success-foreground'
                    }`}
                  >
                    {isOut ? 'Sem estoque' : isLow ? 'Estoque baixo' : 'Disponível'}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  {product.category && (
                    <p className="mt-1 text-xs text-muted-foreground">{product.category.name}</p>
                  )}
                  {product.sku && (
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Quantidade</p>
                      <p className={`text-lg font-bold leading-none ${isOut ? 'text-destructive' : isLow ? 'text-warning' : 'text-foreground'}`}>
                        {product.stock_quantity}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">{product.unit}</span>
                      </p>
                    </div>
                    {(isLow || isOut) && (
                      <AlertTriangle className={`h-4 w-4 ${isOut ? 'text-destructive' : 'text-warning'}`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
