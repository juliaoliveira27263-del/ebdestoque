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

export interface RequestItemInput {
  product_id: string;
  quantity: number;
  industry_id?: string | null;
}

export async function createRequestWithItems(items: RequestItemInput[], notes?: string): Promise<StockRequest> {
  const { data, error } = await supabase.rpc('create_request_with_items', {
    p_items: items as unknown as never,
    p_notes: notes ?? null,
  });
  if (error) throw error;
  return data as StockRequest;
}

export async function approveRequest(requestId: string): Promise<StockRequest> {
  const { data, error } = await supabase.rpc('approve_request', { p_request_id: requestId });
  if (error) throw error;
  return data as StockRequest;
}

export async function rejectRequest(requestId: string, reason?: string): Promise<StockRequest> {
  const { data, error } = await supabase.rpc('reject_request', {
    p_request_id: requestId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return data as StockRequest;
}

export async function deleteRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('requests').delete().eq('id', requestId);
  if (error) throw error;
}
