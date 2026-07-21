import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ArrowLeftRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { fetchMovements } from '@/services/movements';
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_COLORS,
} from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { MovementType } from '@/types';

export default function MovementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: movements = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['movements'],
    queryFn: fetchMovements,
  });

  const filtered = movements.filter((m) => {
    const matchSearch = m.product?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Histórico de movimentações de estoque.</p>
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {MOVEMENT_TYPE_LABELS[t]}
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
          icon={ArrowLeftRight}
          title="Nenhuma movimentação"
          description="Não há movimentações registradas."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qtd.</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Motivo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {m.product?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn(MOVEMENT_TYPE_COLORS[m.type])}>
                      {MOVEMENT_TYPE_LABELS[m.type]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {m.type === 'out' ? '-' : '+'}
                    {m.quantity}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.profile?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
