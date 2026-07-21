import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

export async function fetchNotifications(
  userId: string,
  isAdmin: boolean
): Promise<Notification[]> {
  let query = supabase.from('notifications').select('*');

  if (isAdmin) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string, isAdmin: boolean): Promise<void> {
  let query = supabase.from('notifications').update({ read: true }).eq('read', false);

  if (isAdmin) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { error } = await query;
  if (error) throw error;
}
