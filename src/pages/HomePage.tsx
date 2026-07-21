import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyRequests } from '@/services/requests';
import { REQUEST_STATUS_LABELS, REQUEST_STATUS_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import type { RequestStatus } from '@/types';

export function HomePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-requests', profile?.id],
    queryFn: () => fetchMyRequests(profile!.id),
    enabled: !!profile,
  });

  const total = requests.length;
  const pending = requests.filter((r) => r.status === 'pending').length;
  const approved = requests.filter((r) => r.status === 'approved').length;
  const rejected = requests.filter((r) => r.status === 'rejected').length;

  const stats = [
    { label: 'Total', value: total, icon: ShoppingCart, color: 'text-primary' },
    { label: 'Pendentes', value: pending, icon: Clock, color: 'text-warning' },
    { label: 'Aprovadas', value: approved, icon: CheckCircle2, color: 'text-success' },
    { label: 'Rejeitadas', value: rejected, icon: XCircle, color: 'text-destructive' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olá, {profile?.name ?? 'Usuário'}!</h1>
        <p className="text-sm text-muted-foreground">Faça uma nova solicitação de produtos.</p>
      </div>

      <button
        onClick={() => navigate('/solicitar')}
        className="flex w-full items-center gap-4 rounded-2xl bg-primary p-6 text-left shadow-lg transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20">
          <ShoppingCart className="h-7 w-7 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-primary-foreground">SOLICITAÇÃO</h2>
          <p className="text-sm text-primary-foreground/80">Solicite produtos do estoque</p>
        </div>
      </button>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
              <s.icon className={`mb-2 h-6 w-6 ${s.color}`} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Minhas solicitações recentes</h2>
        {requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma solicitação ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.total_items} item(s)</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <Badge className={REQUEST_STATUS_COLORS[r.status as RequestStatus]}>
                  {REQUEST_STATUS_LABELS[r.status as RequestStatus]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
