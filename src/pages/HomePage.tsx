import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, XCircle, ArrowRight, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface MyRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

async function fetchMyRequestStats(userId: string): Promise<MyRequestStats> {
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

export function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['my-request-stats', profile?.id],
    queryFn: () => fetchMyRequestStats(profile!.id),
    enabled: !!profile?.id,
    refetchInterval: 15_000,
  });

  const firstName = profile?.name?.split(' ')[0] ?? 'usuário';

  const statCards = [
    { icon: ClipboardList, label: 'Total de Solicitações', value: stats?.total ?? 0, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
    { icon: Clock, label: 'Pendentes', value: stats?.pending ?? 0, iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    { icon: CheckCircle2, label: 'Aprovadas', value: stats?.approved ?? 0, iconBg: 'bg-success/10', iconColor: 'text-success' },
    { icon: XCircle, label: 'Recusadas', value: stats?.rejected ?? 0, iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Bem-vindo ao portal de solicitações</p>
      </div>

      {/* Main CTA */}
      <div
        className="group relative overflow-hidden rounded-2xl bg-primary p-8 shadow-xl shadow-primary/30 cursor-pointer select-none transition-all hover:brightness-105 active:scale-[0.99]"
        onClick={() => navigate('/solicitar')}
      >
        {/* Background decoration */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -right-2 h-24 w-24 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between">
          <div>
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Package className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">SOLICITAÇÃO</h2>
            <p className="mt-1 text-sm text-white/80">Clique para solicitar materiais do estoque</p>
          </div>
          <ArrowRight className="h-8 w-8 text-white/80 transition-transform group-hover:translate-x-1" />
        </div>
      </div>

      {/* Stat Cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Minhas solicitações
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => navigate('/requests')}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30 text-left"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
                <div>
                  {isLoading ? (
                    <div className="h-6 w-8 animate-pulse rounded bg-muted" />
                  ) : (
                    <p className="text-xl font-bold leading-none text-foreground">{card.value}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
