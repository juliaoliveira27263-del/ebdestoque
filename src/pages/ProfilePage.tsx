import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/users';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RippleButton } from '@/components/RippleButton';
import { ROLE_LABELS, REQUEST_STATUS_LABELS } from '@/lib/constants';
import type { RequestStatus } from '@/types';

export function ProfilePage() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState(profile?.name ?? '');
  const [phone, setPhone] = React.useState(profile?.phone ?? '');

  React.useEffect(() => {
    setName(profile?.name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  const { data: stats } = useQuery({
    queryKey: ['my-request-stats-profile', profile?.id],
    queryFn: async () => {
      const { count: total } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('user_id', profile!.id);
      const { count: pending } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('user_id', profile!.id).eq('status', 'pending');
      const { count: approved } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('user_id', profile!.id).eq('status', 'approved');
      const { count: rejected } = await supabase.from('requests').select('id', { count: 'exact', head: true }).eq('user_id', profile!.id).eq('status', 'rejected');
      return { total: total ?? 0, pending: pending ?? 0, approved: approved ?? 0, rejected: rejected ?? 0 };
    },
    enabled: !!profile && !isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: { name: string; phone: string | null }) => updateProfile(profile!.id, updates),
    onSuccess: () => {
      toast.success('Perfil atualizado!');
      refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!name.trim()) { toast.error('Nome é obrigatório'); return; }
    updateMutation.mutate({ name: name.trim(), phone: phone.trim() || null });
  };

  if (!profile) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statCards: { label: string; value: number; icon: typeof Clock; status: RequestStatus }[] = [
    { label: 'Total', value: stats?.total ?? 0, icon: Package, status: 'fulfilled' },
    { label: REQUEST_STATUS_LABELS.pending, value: stats?.pending ?? 0, icon: Clock, status: 'pending' },
    { label: REQUEST_STATUS_LABELS.approved, value: stats?.approved ?? 0, icon: CheckCircle2, status: 'approved' },
    { label: REQUEST_STATUS_LABELS.rejected, value: stats?.rejected ?? 0, icon: XCircle, status: 'rejected' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Perfil</h1>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <Badge variant="secondary" className="mt-1">{ROLE_LABELS[profile.role]}</Badge>
            <p className="mt-1 text-sm text-muted-foreground">
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-foreground">Editar dados</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone ?? ''} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <RippleButton onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar alterações
          </RippleButton>
        </div>
      </div>

      {!isAdmin && stats && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Minhas solicitações</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="rounded-lg border border-border p-4 text-center">
                  <Icon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
