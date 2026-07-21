import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, Check, CheckCheck, Loader2, Info, AlertCircle, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications';
import { Badge } from '@/components/ui/badge';
import { RippleButton } from '@/components/RippleButton';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

function getIcon(type: string): typeof Bell {
  switch (type) {
    case 'request': return Package;
    case 'warning': return AlertCircle;
    case 'info': return Info;
    default: return Bell;
  }
}

export function NotificationsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', profile?.id, isAdmin],
    queryFn: () => fetchNotifications(profile!.id, isAdmin),
    enabled: !!profile,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(profile!.id, isAdmin),
    onSuccess: () => { toast.success('Todas marcadas como lidas!'); queryClient.invalidateQueries({ queryKey: ['notifications'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
        {unreadCount > 0 && (
          <RippleButton variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </RippleButton>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="Nenhuma notificação" description="Você não tem notificações no momento." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: Notification) => {
            const Icon = getIcon(n.type);
            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors',
                  !n.read && 'border-primary/30 bg-primary/5'
                )}
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', n.read ? 'bg-muted' : 'bg-primary/10 text-primary')}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{n.title}</p>
                    {!n.read && <Badge variant="default" className="text-[10px]">Nova</Badge>}
                  </div>
                  {n.message && <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markReadMutation.mutate(n.id)}
                    className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Marcar como lida"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
