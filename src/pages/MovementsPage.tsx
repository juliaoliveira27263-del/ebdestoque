import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ArrowLeftRight } from 'lucide-react';
import { fetchMovements } from '@/services/movements';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/lib/constants';
import type { MovementType } from '@/types';

export function MovementsPage() {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const { data: movements = [], isLoading } = useQuery({ queryKey: ['movements'], queryFn: fetchMovements });

  const filtered = movements.filter((m) => {
    const matchSearch = m.product?.name?.toLowerCase().includes(search.toLowerCase()) ?? true;
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]).map((t) => (
              <SelectItem key={t} value={t}>{MOVEMENT_TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="Nenhuma movimentação" description="Não há movimentações registradas." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Produto</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Tipo</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Quantidade</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Motivo</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{m.product?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge className={MOVEMENT_TYPE_COLORS[m.type]}>{MOVEMENT_TYPE_LABELS[m.type]}</Badge></td>
                  <td className="px-4 py-3 font-semibold text-foreground">{m.quantity > 0 ? '+' : ''}{m.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.profile?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(m.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
