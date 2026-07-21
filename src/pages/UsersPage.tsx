import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { fetchProfiles, updateProfile } from '@/services/users';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import type { UserRole } from '@/lib/constants';
import type { Profile } from '@/types';

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export function UsersPage() {
  const { profile: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { role?: UserRole; active?: boolean } }) =>
      updateProfile(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Usuário atualizado!');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar usuário.'),
  });

  const sorted = useMemo(() => {
    return [...profiles].sort((a, b) => {
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      return 0;
    });
  }, [profiles, currentUser]);

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Usuários</h2>
        <p className="text-sm text-muted-foreground">Gerencie usuários, papéis e status</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum usuário encontrado"
          description="Os usuários cadastrados aparecerão aqui."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
                <th className="px-4 py-3 font-medium">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p: Profile) => {
                const isSelf = p.id === currentUser?.id;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {getInitials(p.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{p.name}</span>
                            {isSelf && (
                              <Badge className="bg-primary/10 text-primary">
                                <ShieldCheck className="mr-1 h-3 w-3" />
                                Você
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <Badge className={ROLE_COLORS[p.role]}>
                          {ROLE_LABELS[p.role]}
                        </Badge>
                      ) : (
                        <Select
                          value={p.role}
                          onValueChange={(v: UserRole) => updateMutation.mutate({ id: p.id, input: { role: v } })}
                          disabled={updateMutation.isPending}
                        >
                          <SelectTrigger className="h-8 w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.phone ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={p.active}
                        disabled={isSelf || updateMutation.isPending}
                        onCheckedChange={(v) => updateMutation.mutate({ id: p.id, input: { active: v } })}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {updateMutation.isPending && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-lg border border-border">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Atualizando...</span>
        </div>
      )}
    </div>
  );
}
