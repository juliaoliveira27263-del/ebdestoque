import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/users';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  const { data: stats } = useQuery({
    queryKey: ['my-request-stats', profile?.id],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile!.id);
      return { total: total ?? 0 };
    },
    enabled: !!profile && !isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!profile) throw new Error('Sem perfil');
      return updateProfile(profile.id, { name, phone: phone || null });
    },
    onSuccess: () => {
      toast.success('Perfil atualizado!');
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Perfil</h1>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">
              {profile.name?.charAt(0).toUpperCase() ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{profile.name}</h2>
            <Badge className={cn(ROLE_COLORS[profile.role], 'mt-1')}>
              {ROLE_LABELS[profile.role]}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold text-foreground">Editar dados</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Telefone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 0000-0000"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      </div>

      {!isAdmin && stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Solicitações totais</p>
          </div>
        </div>
      )}
    </div>
  );
}
