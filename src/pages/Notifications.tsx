import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, BellOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Notification } from '../lib/types';

export default function Notifications() {
  const { profile, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, [profile?.id]);

  const fetchNotifications = async () => {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
    if (!isAdmin && profile?.id) {
      query = query.or(`user_id.eq.${profile.id},user_id.is.null`);
    }
    const { data } = await query;
    setNotifications(data as Notification[] ?? []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    await fetchNotifications();
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    }
    await fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    await fetchNotifications();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          <p className="text-dark-400 text-sm mt-1">{notifications.filter((n) => !n.read).length} não lida(s)</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button onClick={markAllRead} className="btn-ghost text-sm">
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="card p-8 text-center">
            <BellOff className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">Nenhuma notificação.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-3 ${!n.read ? 'border-primary-600/30 bg-primary-600/5' : ''}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary-600/15' : 'bg-dark-700'}`}>
                <Bell className={`w-5 h-5 ${!n.read ? 'text-primary-400' : 'text-dark-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-medium">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                </div>
                {n.message && <p className="text-dark-300 text-sm mt-0.5">{n.message}</p>}
                <p className="text-dark-400 text-xs mt-1">
                  {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button onClick={() => markAsRead(n.id)} className="p-2 rounded-lg text-dark-400 hover:text-success-500 hover:bg-dark-700 transition-colors" title="Marcar como lida">
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {isAdmin && (
                  <button onClick={() => deleteNotification(n.id)} className="p-2 rounded-lg text-dark-400 hover:text-error-500 hover:bg-dark-700 transition-colors" title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
