import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, CheckCheck, Loader2, Package, ArrowLeftRight, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications';
import { RippleButton } from '@/components/RippleButton';
import { Badge } from '@/components/ui/badge';

const ICON_MAP: Record<string, typeof Bell> = {
  request: ClipboardList,
  movement: ArrowLeftRight,
  product: Package,
  default: Bell,
};

export function NotificationsPage() {
  const { profile, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: () => fetchNotifications(profile!.id, isAdmin),
    enabled: !!profile,
  });

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead(profile!.id, isAdmin);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
      toast.success('Todas as notificações marcadas como lidas!');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-sm text-muted-foreground">Suas notificações do sistema</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <RippleButton variant="outline" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
          </RippleButton>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Bell className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = ICON_MAP[n.type] ?? ICON_MAP.default;
            return (
              <div key={n.id} className={`flex items-start gap-3 rounded-2xl border border-border bg-card p-4 ${!n.read ? 'border-primary/30' : ''}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`h-5 w-5 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {!n.read && <Badge variant="default" className="text-xs">Nova</Badge>}
                  </div>
                  {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                </div>
                {!n.read && (
                  <RippleButton variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                    Marcar como lida
                  </RippleButton>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
