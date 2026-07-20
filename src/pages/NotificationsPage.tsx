import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notifications';
import { RippleButton } from '@/components/RippleButton';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { cn } from '@/lib/utils';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações marcadas como lidas.');
    },
  });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  const unread = notifications.filter((n) => !n.read);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground">
            {unread.length > 0 ? `${unread.length} não lida(s)` : 'Você está em dia!'}
          </p>
        </div>
        {unread.length > 0 && (
          <RippleButton
            variant="outline"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            {markAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Marcar todas como lidas
          </RippleButton>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl shimmer" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Nenhuma notificação"
          description="Você não tem notificações no momento."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markReadMutation.mutate(n.id)}
              className={cn(
                'flex w-full items-start gap-4 rounded-xl border border-border p-4 text-left shadow-sm transition-all hover:shadow-md',
                n.read ? 'bg-card' : 'bg-primary/5 border-primary/20'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  n.read ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
                )}
              >
                <Bell className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{n.title}</span>
                  {!n.read && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                {n.message && (
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              {!n.read && (
                <span className="shrink-0 text-xs font-medium text-primary">Clique para marcar como lida</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
