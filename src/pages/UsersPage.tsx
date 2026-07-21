import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchProfiles, updateProfile } from '@/services/users';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/lib/constants';
import type { Profile, UserRole } from '@/types';
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

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function UsersPage() {
  const { profile: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateProfile>[1] }) =>
      updateProfile(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const handleRoleChange = (id: string, role: string) => {
    if (id === currentUser?.id) {
      toast.error('Você não pode alterar seu próprio perfil');
      return;
    }
    updateMutation.mutate({ id, input: { role: role as UserRole } });
    toast.success('Perfil atualizado!');
  };

  const handleActiveChange = (id: string, active: boolean) => {
    if (id === currentUser?.id) {
      toast.error('Você não pode desativar seu próprio perfil');
      return;
    }
    updateMutation.mutate({ id, input: { active } });
    toast.success(active ? 'Usuário ativado!' : 'Usuário desativado!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Usuário</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Papel</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Ativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">
                            {profile.name}
                            {profile.id === currentUser?.id && (
                              <span className="ml-2 text-xs text-muted-foreground">(Você)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {profile.id === currentUser?.id ? (
                        <Badge>{ROLE_LABELS[profile.role]}</Badge>
                      ) : (
                        <Select
                          value={profile.role}
                          onValueChange={(v) => handleRoleChange(profile.id, v)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                            <SelectItem value="promotor">Promotor</SelectItem>
                            <SelectItem value="vendedor">Vendedor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {profile.phone || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Switch
                          checked={profile.active}
                          onCheckedChange={(checked: boolean) => handleActiveChange(profile.id, checked)}
                          disabled={profile.id === currentUser?.id}
                        />
                      </div>
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
