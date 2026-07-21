import { supabase } from '@/lib/supabase';
import type { Industry } from '@/types';

export async function fetchIndustries(): Promise<Industry[]> {
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data || []) as Industry[];
}

export async function createIndustry(
  input: Omit<Industry, 'id' | 'created_at' | 'updated_at'>
): Promise<Industry> {
  const { data, error } = await supabase
    .from('industries')
    .insert(input)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Industry;
}

export async function updateIndustry(
  id: string,
  input: Partial<Omit<Industry, 'id' | 'created_at' | 'updated_at'>>
): Promise<Industry> {
  const { data, error } = await supabase
    .from('industries')
    .update(input)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Industry;
}

export async function deleteIndustry(id: string): Promise<void> {
  const { error } = await supabase.from('industries').delete().eq('id', id);
  if (error) throw error;
}
