import { useEffect, useState } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Notification } from '../lib/types';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export default function Notifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as Notification[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    toast.success('Todas as notificações marcadas como lidas');
    fetchNotifications();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          <p className="text-dark-400 text-sm mt-1">Suas notificações</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 text-white text-sm font-medium hover:bg-dark-700 transition-colors">
            <Check size={16} /> Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={`bg-dark-900 border rounded-xl p-4 flex items-start gap-3 ${n.read ? 'border-dark-800' : 'border-primary/50'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'bg-dark-800' : 'bg-primary/20'}`}>
                <Bell size={18} className={n.read ? 'text-dark-400' : 'text-primary'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${n.read ? 'text-dark-300' : 'text-white'}`}>{n.title}</p>
                {n.message && <p className="text-dark-400 text-sm mt-0.5">{n.message}</p>}
                <p className="text-dark-500 text-xs mt-1">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-1">
                {!n.read && (
                  <button onClick={() => handleMarkRead(n.id)} className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-white transition-colors">
                    <Check size={16} />
                  </button>
                )}
                <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-error-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
