import { supabase } from '@/lib/supabase';
import type { Movement } from '@/types';

export async function fetchMovements(limit = 100): Promise<Movement[]> {
  const { data, error } = await supabase
    .from('movements')
    .select('*, product:products(*, category:categories(*), industry:industries(*)), profile:profiles(*)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Movement[];
}

export async function fetchMovementsByProduct(productId: string): Promise<Movement[]> {
  const { data, error } = await supabase
    .from('movements')
    .select('*, product:products(*, category:categories(*), industry:industries(*)), profile:profiles(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Movement[];
}
