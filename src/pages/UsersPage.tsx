import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProfiles, updateProfile } from '@/services/users';
import { ROLE_LABELS } from '@/lib/constants';
import type { UserRole } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function UsersPage() {
  const { profile: me } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles });

  const handleRoleChange = async (id: string, role: UserRole) => {
    if (id === me?.id) {
      toast.error('Você não pode alterar seu próprio perfil');
      return;
    }
    try {
      await updateProfile(id, { role });
      toast.success('Perfil atualizado!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleActiveToggle = async (id: string, active: boolean) => {
    if (id === me?.id) {
      toast.error('Você não pode desativar seu próprio perfil');
      return;
    }
    try {
      await updateProfile(id, { active });
      toast.success('Perfil atualizado!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground">Gerencie os usuários do sistema</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Usuário</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Perfil</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                        {u.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.phone ?? 'Sem telefone'}</p>
                    </div>
                    {u.id === me?.id && <Badge variant="secondary" className="text-xs">Você</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v as UserRole)} disabled={u.id === me?.id}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Switch checked={u.active} onCheckedChange={(v) => handleActiveToggle(u.id, v)} disabled={u.id === me?.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
