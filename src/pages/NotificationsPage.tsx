import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Package, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notifications';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/RippleButton';
import { Badge } from '@/components/ui/badge';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getNotificationIcon(type: string): React.ComponentType<{ className?: string }> {
  switch (type) {
    case 'low_stock':
      return AlertTriangle;
    case 'request':
      return Package;
    case 'info':
      return Info;
    default:
      return Bell;
  }
}

export function NotificationsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', profile?.id],
    queryFn: () => fetchNotifications(profile!.id, isAdmin),
    enabled: !!profile,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(profile!.id, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      toast.success('Todas as notificações marcadas como lidas!');
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground">Suas notificações do sistema</p>
        </div>
        {hasUnread && (
          <Button variant="outline" onClick={() => markAllMutation.mutate()}>
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-colors',
                  notification.read ? 'border-border' : 'border-primary/30 bg-primary/5'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    notification.read ? 'bg-muted' : 'bg-primary/10'
                  )}
                >
                  <Icon className={cn('h-5 w-5', notification.read ? 'text-muted-foreground' : 'text-primary')} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                    {!notification.read && (
                      <Badge variant="default" className="text-xs">
                        Nova
                      </Badge>
                    )}
                  </div>
                  {notification.message && (
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => markReadMutation.mutate(notification.id)}
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4" />
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
