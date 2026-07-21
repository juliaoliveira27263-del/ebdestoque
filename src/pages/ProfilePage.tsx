import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS } from '@/lib/constants';
import { updateProfile } from '@/services/users';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/RippleButton';

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function ProfilePage() {
  const { profile, isAdmin, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  const { data: myStats } = useQuery({
    queryKey: ['my-stats', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('status')
        .eq('user_id', profile!.id);
      if (error) throw error;
      const items = data || [];
      return {
        total: items.length,
        pending: items.filter((r: { status: string }) => r.status === 'pending').length,
        approved: items.filter((r: { status: string }) => r.status === 'approved').length,
      };
    },
    enabled: !!profile && !isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateProfile>[1] }) =>
      updateProfile(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      refreshProfile();
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      updateMutation.mutate({ id: profile.id, input: { name, phone: phone || null } });
      toast.success('Perfil atualizado com sucesso!');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-xl text-primary-foreground">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <div className="mt-1 flex items-center gap-2">
              <Badge>{ROLE_LABELS[profile.role]}</Badge>
              <span className="text-sm text-muted-foreground">
                Membro desde {formatDate(profile.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isAdmin && myStats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-foreground">{myStats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-warning">{myStats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-success">{myStats.approved}</p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Editar informações</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone">Telefone</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </form>
      </div>
    </div>
  );
}
