import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function useUnreadNotifications() {
  const { profile, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['unread-notifications', profile?.id, isAdmin],
    queryFn: async (): Promise<number> => {
      let query = supabase.from('notifications').select('id', { count: 'exact', head: true });

      if (isAdmin) {
        query = query.or('user_id.is.null,read.eq.false');
      } else {
        query = query.eq('user_id', profile!.id).eq('read', false);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profile,
    refetchInterval: 30000,
  });
}
