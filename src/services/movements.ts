import { supabase } from '@/lib/supabase';
import type { Movement } from '@/types';

export async function fetchMovements(): Promise<Movement[]> {
  const { data, error } = await supabase
    .from('movements')
    .select('*, product:products(*), profile:profiles(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Movement[];
}
