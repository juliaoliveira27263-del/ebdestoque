import { useEffect, useState } from 'react';
import { Check, CheckCheck, Trash2, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import type { Notification } from '../lib/types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications((data as Notification[] | null) ?? []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notification: Notification) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erro ao marcar notificação');
    }
  }

  async function markAllAsRead() {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Erro ao marcar notificações');
    }
  }

  async function deleteNotification(notification: Notification) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      toast.success('Notificação excluída');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao excluir notificação');
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          <p className="text-dark-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas as notificações lidas'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition"
          >
            <CheckCheck size={18} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-dark-400">Carregando...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-12 text-center">
            <Bell size={48} className="mx-auto text-dark-600 mb-4" />
            <p className="text-dark-400">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-dark-900 border rounded-lg p-4 flex items-start gap-4 ${
                notification.read ? 'border-dark-800' : 'border-emerald-600'
              }`}
            >
              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-dark-600' : 'bg-emerald-500'}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{notification.title}</h3>
                  {!notification.read && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Nova</span>
                  )}
                </div>
                {notification.message && (
                  <p className="text-sm text-dark-400 mt-1">{notification.message}</p>
                )}
                <p className="text-xs text-dark-500 mt-2">
                  {new Date(notification.created_at).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification)}
                    className="p-2 text-dark-400 hover:text-emerald-400 hover:bg-dark-800 rounded transition"
                    title="Marcar como lida"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification)}
                  className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded transition"
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
