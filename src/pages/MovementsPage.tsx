import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal, Search, Package } from 'lucide-react';
import { fetchMovements } from '@/services/movements';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/lib/constants';
import type { MovementType } from '@/lib/constants';
import type { Movement } from '@/types';

const TYPE_ICONS: Record<MovementType, typeof ArrowDownLeft> = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
  adjustment: SlidersHorizontal,
};

export function MovementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: movements = [], isLoading, error, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
    refetchInterval: 30_000,
  });

  const filtered = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch = !search ||
        (m.product?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.profile?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (m.reason ?? '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [movements, search, typeFilter]);

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
          <Input placeholder="Buscar por produto, usuário ou motivo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="in">Entrada</SelectItem>
            <SelectItem value="out">Saída</SelectItem>
            <SelectItem value="adjustment">Ajuste</SelectItem>
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
          icon={Package}
          title="Nenhuma movimentação encontrada"
          description="As movimentações de estoque aparecerão aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: Movement) => {
                const Icon = TYPE_ICONS[m.type];
                return (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {m.product?.name ?? 'Produto removido'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${
                          m.type === 'in' ? 'text-success' : m.type === 'out' ? 'text-destructive' : 'text-muted-foreground'
                        }`} />
                        <Badge className={MOVEMENT_TYPE_COLORS[m.type]}>
                          {MOVEMENT_TYPE_LABELS[m.type]}
                        </Badge>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      m.type === 'in' ? 'text-success' : m.type === 'out' ? 'text-destructive' : 'text-foreground'
                    }`}>
                      {m.type === 'in' ? '+' : m.type === 'out' ? '-' : '±'}{m.quantity}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.reason ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.profile?.name ?? 'Sistema'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(m.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
