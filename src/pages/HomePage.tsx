import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { REQUEST_STATUS_COLORS, REQUEST_STATUS_LABELS } from '@/lib/constants';
import type { RequestStatus } from '@/types';

export function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ['my-request-stats', profile?.id],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile!.id);
      const { count: pending } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile!.id)
        .eq('status', 'pending');
      const { count: approved } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile!.id)
        .eq('status', 'approved');
      const { count: rejected } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile!.id)
        .eq('status', 'rejected');
      return {
        total: total ?? 0,
        pending: pending ?? 0,
        approved: approved ?? 0,
        rejected: rejected ?? 0,
      };
    },
    enabled: !!profile,
  });

  const firstName = profile?.name?.split(' ')[0] ?? 'Usuário';

  const statCards: { label: string; value: number; icon: typeof Clock; status: RequestStatus }[] = [
    { label: 'Total', value: stats?.total ?? 0, icon: Package, status: 'fulfilled' },
    { label: REQUEST_STATUS_LABELS.pending, value: stats?.pending ?? 0, icon: Clock, status: 'pending' },
    { label: REQUEST_STATUS_LABELS.approved, value: stats?.approved ?? 0, icon: CheckCircle2, status: 'approved' },
    { label: REQUEST_STATUS_LABELS.rejected, value: stats?.rejected ?? 0, icon: XCircle, status: 'rejected' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Olá, {firstName}!</h1>

      <button
        onClick={() => navigate('/solicitar')}
        className="flex w-full flex-col items-center gap-3 rounded-2xl bg-primary p-8 text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
      >
        <ShoppingBag className="h-12 w-12" />
        <div>
          <h2 className="text-2xl font-bold">SOLICITAÇÃO</h2>
          <p className="text-sm text-primary-foreground/80">Clique para fazer uma nova solicitação</p>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${REQUEST_STATUS_COLORS[card.status]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
