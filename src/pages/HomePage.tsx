import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Clock, CheckCircle2, XCircle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Button } from '@/components/RippleButton';

interface MyStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery<MyStats>({
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
        rejected: items.filter((r: { status: string }) => r.status === 'rejected').length,
      };
    },
    enabled: !!profile,
  });

  const statCards = [
    { label: 'Total', value: stats?.total ?? 0, icon: Package, color: 'text-foreground' },
    { label: 'Pendentes', value: stats?.pending ?? 0, icon: Clock, color: 'text-warning' },
    { label: 'Aprovadas', value: stats?.approved ?? 0, icon: CheckCircle2, color: 'text-success' },
    { label: 'Rejeitadas', value: stats?.rejected ?? 0, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {profile?.name?.split(' ')[0] || 'Usuário'}!</h1>
        <p className="text-sm text-muted-foreground">Faça uma nova solicitação de produtos</p>
      </div>

      <button
        onClick={() => navigate('/solicitar')}
        className={cn(
          'group flex w-full items-center gap-4 rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg transition-all hover:shadow-xl active:scale-[0.98]'
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
          <ShoppingCart className="h-7 w-7" />
        </div>
        <div className="flex-1 text-left">
          <h2 className="text-xl font-bold">Nova Solicitação</h2>
          <p className="text-sm text-primary-foreground/80">Solicite produtos do estoque</p>
        </div>
        <ShoppingCart className="h-6 w-6 transition-transform group-hover:translate-x-1" />
      </button>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn('h-5 w-5', card.color)} />
              </div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">Ações rápidas</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/solicitar')}>
            <ShoppingCart className="h-4 w-4" />
            Solicitar produtos
          </Button>
          <Button variant="outline" onClick={() => navigate('/requests')}>
            Ver minhas solicitações
          </Button>
        </div>
      </div>
    </div>
  );
}
