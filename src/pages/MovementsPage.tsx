import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeftRight } from 'lucide-react';
import { fetchMovements } from '@/services/movements';
import type { Movement, MovementType } from '@/types';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MovementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: movements = [], isLoading } = useQuery<Movement[]>({
    queryKey: ['movements'],
    queryFn: fetchMovements,
  });

  const filtered = movements.filter((m) => {
    const matchSearch = m.product?.name?.toLowerCase().includes(search.toLowerCase()) || search === '';
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Histórico de movimentações de estoque</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in">Entrada</SelectItem>
            <SelectItem value="out">Saída</SelectItem>
            <SelectItem value="adjustment">Ajuste</SelectItem>
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
          <ArrowLeftRight className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma movimentação encontrada</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Qtd</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Motivo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((movement) => (
                  <tr key={movement.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {movement.product?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-0', MOVEMENT_TYPE_COLORS[movement.type as MovementType])}>
                        {MOVEMENT_TYPE_LABELS[movement.type as MovementType]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {movement.type === 'out' ? '-' : '+'}
                      {movement.quantity}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {movement.reason || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {movement.profile?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(movement.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
