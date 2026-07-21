import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyRequests } from '@/services/requests';
import { updateProfile } from '@/services/users';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/types';

export function ProfilePage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const { data: requests = [] } = useQuery({
    queryKey: ['my-requests', profile?.id],
    queryFn: () => fetchMyRequests(profile!.id),
    enabled: !!profile && !isAdmin,
  });

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile(profile.id, { name, phone: phone || null });
      toast.success('Perfil atualizado!');
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'pending').length;
  const approved = requests.filter((r) => r.status === 'approved').length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile.name}</h2>
            <Badge className={`mt-1 ${ROLE_COLORS[profile.role as UserRole]}`}>
              {ROLE_LABELS[profile.role as UserRole]}
            </Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Editar informações</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <RippleButton onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações
          </RippleButton>
        </div>
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-warning">{pending}</p>
            <p className="text-sm text-muted-foreground">Pendentes</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-success">{approved}</p>
            <p className="text-sm text-muted-foreground">Aprovadas</p>
          </div>
        </div>
      )}
    </div>
  );
}
