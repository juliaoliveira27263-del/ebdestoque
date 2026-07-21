import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { fetchProfiles, updateProfile } from '@/services/users';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';

export function UsersPage() {
  const { profile: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: profiles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { role?: UserRole; active?: boolean } }) =>
      updateProfile(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Usuário atualizado.');
    },
  });

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === 'all' || p.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [profiles, search, roleFilter]);

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
        <p className="text-sm text-muted-foreground">Gerencie usuários e suas permissões</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
            <SelectItem value="promotor">Promotores</SelectItem>
            <SelectItem value="supervisor">Supervisores</SelectItem>
            <SelectItem value="vendedor">Vendedores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário encontrado" description="Ajuste os filtros." />
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const initials = p.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
            const isSelf = p.id === currentUser?.id;
            return (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    {isSelf && <Badge variant="secondary">Você</Badge>}
                    {p.role === 'admin' && <ShieldCheck className="h-4 w-4 text-primary" />}
                    {!p.active && <ShieldAlert className="h-4 w-4 text-destructive" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[p.role]} • {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={p.role}
                    onValueChange={(v) => updateMutation.mutate({ id: p.id, input: { role: v as UserRole } })}
                    disabled={updateMutation.isPending || isSelf}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="promotor">Promotor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={p.active}
                      onCheckedChange={(v) => updateMutation.mutate({ id: p.id, input: { active: v } })}
                      disabled={updateMutation.isPending || isSelf}
                    />
                    <span className="text-xs text-muted-foreground">{p.active ? 'Ativo' : 'Inativo'}</span>
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
