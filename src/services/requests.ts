import { supabase } from '@/lib/supabase';
import type { StockRequest } from '@/types';

export async function fetchRequests(): Promise<StockRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*, profile:profiles(*), request_items(*, product:products(*), industry:industries(*))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockRequest[];
}

export async function fetchMyRequests(userId: string): Promise<StockRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*, profile:profiles(*), request_items(*, product:products(*), industry:industries(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockRequest[];
}

export async function createRequestWithItems(
  userId: string,
  items: { product_id: string; quantity: number; industry_id: string | null }[],
  notes: string | null
): Promise<string> {
  const { data, error } = await supabase.rpc('create_request_with_items', {
    p_user_id: userId,
    p_items: items,
    p_notes: notes,
  });
  if (error) throw error;
  return data as string;
}

export async function approveRequest(requestId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_request', {
    p_request_id: requestId,
  });
  if (error) throw error;
}

export async function rejectRequest(requestId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('reject_request', {
    p_request_id: requestId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function deleteRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('requests').delete().eq('id', requestId);
  if (error) throw error;
}
