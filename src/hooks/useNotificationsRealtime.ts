import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Subscribes to realtime notifications for the current user.
 * When a new notification arrives, shows a toast and invalidates queries.
 * Includes a fallback that re-fetches every 30s in case realtime fails.
 */
export function useNotificationsRealtime() {
  const queryClient = useQueryClient();
  const { profile, isAdmin } = useAuth();
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!profile) return;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    };

    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as { user_id: string | null; title: string; message: string | null };
          // Show toast if notification is for this user or broadcast (null = admin broadcast)
          if (n.user_id === profile.id || (n.user_id === null && isAdmin)) {
            toast.info(n.title, { description: n.message ?? undefined });
          }
          invalidate();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        invalidate
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movements' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['movements'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        }
      )
      .subscribe();

    // Fallback: re-fetch every 30s in case realtime misses an event
    fallbackRef.current = setInterval(invalidate, 30_000);

    return () => {
      supabase.removeChannel(channel);
      if (fallbackRef.current) clearInterval(fallbackRef.current);
    };
  }, [queryClient, profile, isAdmin]);
}
