import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfiles, updateProfile } from '@/services/users';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole, Profile } from '@/types';

export default function UsersPage() {
  const { profile: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Profile, 'role' | 'active'>> }) =>
      updateProfile(id, input),
    onSuccess: () => {
      toast.success('Usuário atualizado!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground">Gerencie usuários e permissões.</p>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário" description="Não há usuários cadastrados." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Papel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const isSelf = p.id === currentUser?.id;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                            {p.name?.charAt(0).toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {p.name}
                            {isSelf && <span className="ml-2 text-xs text-muted-foreground">(Você)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <Badge>{ROLE_LABELS[p.role]}</Badge>
                      ) : (
                        <Select
                          value={p.role}
                          onValueChange={(v) =>
                            updateMutation.mutate({ id: p.id, input: { role: v as UserRole } })
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                              <SelectItem key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <Badge variant="default">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                        <Switch
                          checked={p.active}
                          onCheckedChange={(c) =>
                            updateMutation.mutate({ id: p.id, input: { active: c } })
                          }
                        />
                        {p.active ? (
                          <ShieldCheck className="h-4 w-4 text-success" />
                        ) : (
                          <ShieldOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        </div>
                      )}
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
