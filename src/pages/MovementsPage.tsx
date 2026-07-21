import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search } from 'lucide-react';
import { fetchMovements } from '@/services/movements';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MovementType } from '@/types';

export function MovementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: movements = [], isLoading } = useQuery({ queryKey: ['movements'], queryFn: fetchMovements });

  const filtered = movements.filter((m) => {
    const matchSearch = m.product?.name?.toLowerCase().includes(search.toLowerCase()) ?? true;
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Movimentações</h1>
        <p className="text-sm text-muted-foreground">Histórico de movimentações de estoque</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="in">Entrada</SelectItem>
            <SelectItem value="out">Saída</SelectItem>
            <SelectItem value="adjustment">Ajuste</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Produto</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Tipo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Qtd</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Motivo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Usuário</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-sm text-foreground">{m.product?.name ?? '-'}</td>
                <td className="px-4 py-3">
                  <Badge className={MOVEMENT_TYPE_COLORS[m.type as MovementType]}>
                    {MOVEMENT_TYPE_LABELS[m.type as MovementType]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{m.quantity}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.reason ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{m.profile?.name ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {new Date(m.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
