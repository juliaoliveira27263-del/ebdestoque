import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, CheckCheck, Loader2, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchNotifications, markNotificationRead, markAllNotificationsRead,
} from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { RippleButton } from '@/components/RippleButton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import type { Notification } from '@/types';

const NOTIF_ICONS: Record<string, LucideIcon> = {
  request: Bell,
  default: Bell,
};

function getIcon(type: string): LucideIcon {
  return NOTIF_ICONS[type] ?? Bell;
}

export function NotificationsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications(profile!.id, isAdmin),
    refetchInterval: 15_000,
  });

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao marcar notificação.'),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(profile!.id, isAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações marcadas como lidas.');
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar notificações.'),
  });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notificações</h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `Você tem ${unreadCount} notificação(ões) não lida(s)` : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <RippleButton variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
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
          {notifications.map((n: Notification) => {
            const Icon = getIcon(n.type);
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md ${
                  n.read ? 'border-border' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    {!n.read && (
                      <Badge className="bg-primary/15 text-primary">Nova</Badge>
                    )}
                  </div>
                  {n.message && (
                    <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {!n.read && (
                  <RippleButton
                    size="sm"
                    variant="ghost"
                    onClick={() => markReadMutation.mutate(n.id)}
                    disabled={markReadMutation.isPending}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Marcar como lida
                  </RippleButton>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
