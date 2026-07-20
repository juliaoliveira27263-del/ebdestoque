import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Search, ArrowDownCircle, ArrowUpCircle, Sliders } from 'lucide-react';
import { fetchMovements } from '@/services/movements';
import { fetchProducts } from '@/services/products';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/lib/constants';
import type { MovementType } from '@/types';

export function MovementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  const { data: movements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: () => fetchMovements(200),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        !search ||
        m.product?.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.reason ?? '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchProduct = productFilter === 'all' || m.product_id === productFilter;
      return matchSearch && matchType && matchProduct;
    });
  }, [movements, search, typeFilter, productFilter]);

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Movimentações</h2>
        <p className="text-sm text-muted-foreground">Histórico de entradas, saídas e ajustes de estoque</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto ou motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in">Entrada</SelectItem>
            <SelectItem value="out">Saída</SelectItem>
            <SelectItem value="adjustment">Ajuste</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos produtos</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Nenhuma movimentação encontrada"
          description="Ajuste os filtros ou aguarde novas movimentações."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Produto</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground">Quantidade</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Motivo</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Usuário</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => {
                  const icon =
                    m.type === 'in' ? ArrowDownCircle : m.type === 'out' ? ArrowUpCircle : Sliders;
                  const Icon = icon;
                  return (
                    <tr key={m.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${MOVEMENT_TYPE_COLORS[m.type as MovementType]}`} />
                          <Badge variant="secondary">
                            {MOVEMENT_TYPE_LABELS[m.type as MovementType]}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {m.product?.name ?? 'Produto removido'}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${MOVEMENT_TYPE_COLORS[m.type as MovementType]}`}>
                        {m.type === 'out' ? '-' : '+'}{m.quantity}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.reason ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.profile?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(m.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
