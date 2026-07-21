import { supabase } from '@/lib/supabase';
import type { StockRequest, RequestItem } from '@/types';

export async function fetchRequests(): Promise<StockRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      '*, profile:profiles(*), request_items(*, product:products(*, industry:industries(*)), industry:industries(*))'
    )
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockRequest[];
}

export async function fetchMyRequests(userId: string): Promise<StockRequest[]> {
  const { data, error } = await supabase
    .from('requests')
    .select(
      '*, profile:profiles(*), request_items(*, product:products(*, industry:industries(*)), industry:industries(*))'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StockRequest[];
}

export async function createRequestWithItems(
  userId: string,
  notes: string | null,
  items: Omit<RequestItem, 'id' | 'request_id' | 'created_at' | 'product' | 'industry'>[]
): Promise<string> {
  const { data, error } = await supabase.rpc('create_request_with_items', {
    p_user_id: userId,
    p_notes: notes,
    p_items: items,
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
