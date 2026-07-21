import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Save,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Calendar,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/services/users';
import { supabase } from '@/lib/supabase';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
});

type Form = z.infer<typeof schema>;

async function fetchMyStats(userId: string) {
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

export function ProfilePage() {
  const { profile, refreshProfile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['my-request-stats', profile?.id],
    queryFn: () => fetchMyStats(profile!.id),
    enabled: !!profile?.id && !isAdmin,
    retry: 1,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile?.name ?? '',
      phone: profile?.phone ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string; phone?: string } }) =>
      updateProfile(id, input),
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Perfil atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar perfil.'),
  });

  if (!profile) return null;

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const memberSince = (() => {
    try {
      return new Date(profile.created_at).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  })();

  const onSubmit = (data: Form) => {
    mutation.mutate({
      id: profile.id,
      input: { name: data.name, phone: data.phone || undefined },
    });
  };

  const statCards = [
    {
      icon: ClipboardList,
      label: 'Total',
      value: stats?.total ?? 0,
      color: 'text-muted-foreground',
      bg: 'bg-muted',
    },
    {
      icon: Clock,
      label: 'Pendentes',
      value: stats?.pending ?? 0,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      icon: CheckCircle2,
      label: 'Aprovadas',
      value: stats?.approved ?? 0,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      icon: XCircle,
      label: 'Recusadas',
      value: stats?.rejected ?? 0,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-24 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-primary shadow-lg shadow-primary/20">
                <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
              </div>
              <Badge className={`${ROLE_COLORS[profile.role]} mb-1`}>
                {ROLE_LABELS[profile.role]}
              </Badge>
            </div>

            <h3 className="text-xl font-bold text-foreground">{profile.name}</h3>

            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {profile.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Membro desde {memberSince}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                {ROLE_LABELS[profile.role]}
              </span>
            </div>
          </div>
        </div>

        {/* Stats — only for non-admin */}
        {!isAdmin && (
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Minhas solicitações
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center shadow-sm"
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${card.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                    <p className="text-2xl font-bold leading-none text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Edit form */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h4 className="flex items-center gap-2 font-semibold text-foreground">
              <User className="h-4 w-4 text-muted-foreground" />
              Informações pessoais
            </h4>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo *</Label>
              <Input id="name" placeholder="Seu nome completo" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp</Label>
              <Input id="phone" placeholder="(87) 99999-9999" {...register('phone')} />
            </div>
            <div className="pt-2">
              <RippleButton type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar alterações
              </RippleButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
