import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Notification } from '../lib/types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data ?? []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar notificações';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notification: Notification): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);
      if (error) throw error;
      setNotifications(
        notifications.map((n: Notification) =>
          n.id === notification.id ? { ...n, read: true } : n,
        ),
      );
      toast.success('Notificação marcada como lida');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar notificação';
      toast.error(message);
    }
  };

  const handleMarkAllAsRead = async (): Promise<void> => {
    try {
      const unreadIds = notifications
        .filter((n: Notification) => !n.read)
        .map((n: Notification) => n.id);
      if (unreadIds.length === 0) {
        toast.info('Nenhuma notificação não lida');
        return;
      }
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
      if (error) throw error;
      setNotifications(
        notifications.map((n: Notification) => ({ ...n, read: true })),
      );
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar notificações';
      toast.error(message);
    }
  };

  const handleDelete = async (notification: Notification): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);
      if (error) throw error;
      setNotifications(
        notifications.filter((n: Notification) => n.id !== notification.id),
      );
      toast.success('Notificação excluída');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir notificação';
      toast.error(message);
    }
  };

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          <p className="text-dark-400 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notificação(ões) não lida(s)`
              : 'Todas as notificações foram lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700 transition-colors"
          >
            <CheckCheck size={18} />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-dark-400">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto text-dark-500 mb-3" size={48} />
            <p className="text-dark-400">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`bg-dark-800 border rounded-xl p-4 flex items-start gap-4 transition-colors ${
                notification.read
                  ? 'border-dark-700'
                  : 'border-blue-500/50 bg-blue-500/5'
              }`}
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    notification.read ? 'bg-dark-700' : 'bg-blue-500/20'
                  }`}
                >
                  <Bell className={notification.read ? 'text-dark-400' : 'text-blue-400'} size={20} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{notification.title}</h3>
                  {!notification.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                </div>
                {notification.message && (
                  <p className="text-dark-300 text-sm mt-1">{notification.message}</p>
                )}
                <p className="text-dark-500 text-xs mt-2">
                  {new Date(notification.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification)}
                    className="p-2 text-dark-300 hover:text-success-500 hover:bg-dark-700 rounded-lg transition-colors"
                    title="Marcar como lida"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification)}
                  className="p-2 text-dark-300 hover:text-error-500 hover:bg-dark-700 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
