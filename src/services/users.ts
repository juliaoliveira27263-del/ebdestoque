import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data || []) as Profile[];
}

export async function updateProfile(
  id: string,
  input: Partial<Pick<Profile, 'name' | 'phone' | 'role' | 'active'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Profile;
}
