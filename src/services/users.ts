import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';
import type { UserRole } from '@/lib/constants';

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfile(
  id: string,
  input: { name?: string; role?: UserRole; phone?: string; active?: boolean }
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Profile;
}
