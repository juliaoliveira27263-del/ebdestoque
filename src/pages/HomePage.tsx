import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
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
      return { total: total ?? 0, pending: pending ?? 0, approved: approved ?? 0, rejected: rejected ?? 0 };
    },
    enabled: !!profile,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const cards = [
    { label: 'Total', value: stats?.total, icon: Package, color: 'text-foreground' },
    { label: 'Pendentes', value: stats?.pending, icon: Clock, color: 'text-warning' },
    { label: 'Aprovadas', value: stats?.approved, icon: CheckCircle2, color: 'text-success' },
    { label: 'Rejeitadas', value: stats?.rejected, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {profile?.name?.split(' ')[0] ?? 'Usuário'}!
        </h1>
        <p className="text-sm text-muted-foreground">Faça uma nova solicitação de produtos.</p>
      </div>

      <button
        onClick={() => navigate('/solicitar')}
        className="flex w-full items-center gap-4 rounded-2xl bg-primary p-6 text-left shadow-lg transition-transform hover:scale-[1.01] active:scale-95"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
          <ShoppingCart className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-primary-foreground">SOLICITAÇÃO</h2>
          <p className="text-sm text-primary-foreground/80">
            Clique para solicitar produtos
          </p>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Icon className={cn('h-5 w-5', card.color)} />
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-2xl font-bold text-foreground">{card.value ?? 0}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{card.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
