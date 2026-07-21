import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadNotifications() {
  const { profile, isAdmin } = useAuth();
  const { data } = useQuery({
    queryKey: ['unread-notifications', profile?.id, isAdmin],
    queryFn: async () => {
      let query = supabase.from('notifications').select('id', { count: 'exact', head: true });
      if (isAdmin) {
        query = query.or('user_id.is.null,read.eq.false');
      } else {
        query = query.eq('user_id', profile!.id).eq('read', false);
      }
      const { count, error } = await query;
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!profile?.id,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  return { unreadCount: data ?? 0 };
}
