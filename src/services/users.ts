import { supabase } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export interface ProfileUpdates {
  name?: string;
  role?: UserRole;
  phone?: string | null;
  active?: boolean;
}

export async function updateProfile(
  id: string,
  updates: ProfileUpdates
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data as Profile;
}
