import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Loader2,
  Package,
  ClipboardList,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/RippleButton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notifications';
import { cn } from '@/lib/utils';

const ICONS: Record<string, typeof Package> = {
  product: Package,
  request: ClipboardList,
  alert: AlertTriangle,
  info: Info,
};

export default function NotificationsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications', profile?.id, isAdmin],
    queryFn: () => (profile ? fetchNotifications(profile.id, isAdmin) : Promise.resolve([])),
    enabled: !!profile,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const markAllMutation = useMutation({
    mutationFn: () => (profile ? markAllNotificationsRead(profile.id) : Promise.resolve()),
    onSuccess: () => {
      toast.success('Todas as notificações marcadas como lidas.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground">Suas notificações recentes.</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <Button variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nenhuma notificação"
          description="Você está em dia com tudo."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Info;
            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors',
                  !n.read && 'border-primary/30 bg-primary/5'
                )}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    n.read ? 'bg-muted' : 'bg-primary/10'
                  )}
                >
                  <Icon className={cn('h-4 w-4', n.read ? 'text-muted-foreground' : 'text-primary')} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    {!n.read && <Badge variant="default">Nova</Badge>}
                  </div>
                  {n.message && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                  >
                    Marcar lida
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
