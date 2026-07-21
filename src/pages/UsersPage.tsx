import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users, Loader2 } from 'lucide-react';
import { fetchProfiles, updateProfile } from '@/services/users';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';
import type { Profile } from '@/types';

export function UsersPage() {
  const { profile: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { role?: UserRole; active?: boolean } }) =>
      updateProfile(id, updates),
    onSuccess: () => { toast.success('Usuário atualizado!'); queryClient.invalidateQueries({ queryKey: ['profiles'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Usuários</h1>

      {profiles.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário" description="Não há usuários cadastrados." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Papel</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((p: Profile) => {
                const isSelf = p.id === currentUser?.id;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar><AvatarFallback className="bg-primary text-primary-foreground">{p.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-medium text-foreground">{p.name}{isSelf && <span className="ml-1 text-xs text-muted-foreground">(você)</span>}</p>
                          <p className="text-xs text-muted-foreground">{p.phone ?? 'Sem telefone'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <Badge variant="secondary">{ROLE_LABELS[p.role]}</Badge>
                      ) : (
                        <Select value={p.role} onValueChange={(v: UserRole) => updateMutation.mutate({ id: p.id, updates: { role: v } })}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={p.active}
                        disabled={isSelf}
                        onCheckedChange={(c) => updateMutation.mutate({ id: p.id, updates: { active: c } })}
                      />
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
