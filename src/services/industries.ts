import { supabase } from '@/lib/supabase';
import type { Industry } from '@/types';

export async function fetchIndustries(): Promise<Industry[]> {
  const { data, error } = await supabase
    .from('industries')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Industry[];
}

export interface IndustryInput {
  name: string;
  cnpj?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  active: boolean;
}

export async function createIndustry(input: IndustryInput): Promise<Industry> {
  const { data, error } = await supabase
    .from('industries')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as Industry;
}

export async function updateIndustry(
  id: string,
  input: Partial<IndustryInput>
): Promise<Industry> {
  const { data, error } = await supabase
    .from('industries')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Industry;
}

export async function deleteIndustry(id: string): Promise<void> {
  const { error } = await supabase.from('industries').delete().eq('id', id);
  if (error) throw error;
}
