import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadNotifications() {
  const { profile, isAdmin } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', profile?.id, isAdmin],
    queryFn: async (): Promise<number> => {
      let query = supabase.from('notifications').select('id', { count: 'exact', head: true });

      if (isAdmin) {
        query = query.or('user_id.is.null,read.eq.false');
      } else if (profile) {
        query = query.eq('user_id', profile.id).eq('read', false);
      } else {
        return 0;
      }

      const { count, error } = await query;
      if (error) {
        console.error('Error fetching unread notifications:', error.message);
        return 0;
      }
      return count ?? 0;
    },
    enabled: !!profile,
    refetchInterval: 30_000,
  });

  return { unreadCount };
}
