import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ClipboardList, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/users';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ErrorState';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';

interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

async function fetchRequestStats(userId: string): Promise<RequestStats> {
  const { data, error } = await supabase
    .from('requests')
    .select('status')
    .eq('user_id', userId);
  if (error) throw error;
  const rows = data ?? [];
  return {
    total: rows.length,
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export function ProfilePage() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['profile-request-stats', profile?.id],
    queryFn: () => fetchRequestStats(profile!.id),
    enabled: !!profile?.id && !isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string; phone: string } }) =>
      updateProfile(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar perfil.'),
  });

  if (!profile) {
    return <ErrorState message="Perfil não encontrado." />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe seu nome.');
      return;
    }
    updateMutation.mutate({ id: profile.id, input: { name: name.trim(), phone: phone.trim() } });
  };

  const statCards = [
    { icon: ClipboardList, label: 'Total', value: stats?.total ?? 0, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
    { icon: Clock, label: 'Pendentes', value: stats?.pending ?? 0, iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { icon: CheckCircle2, label: 'Aprovadas', value: stats?.approved ?? 0, iconBg: 'bg-success/10', iconColor: 'text-success' },
    { icon: XCircle, label: 'Recusadas', value: stats?.rejected ?? 0, iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <Badge className={ROLE_COLORS[profile.role]}>
                {ROLE_LABELS[profile.role]}
              </Badge>
              {profile.active ? (
                <Badge className="bg-success/15 text-success">Ativo</Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground">Inativo</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Editar informações</h3>
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nome</Label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
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
        <div className="flex justify-end pt-2">
          <RippleButton type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </RippleButton>
        </div>
      </form>

      {!isAdmin && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Minhas Solicitações</h3>
          {statsError ? (
            <ErrorState message={statsError.message} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${card.iconBg}`}>
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                    {statsLoading ? (
                      <div className="h-7 w-10 animate-pulse rounded bg-muted" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
