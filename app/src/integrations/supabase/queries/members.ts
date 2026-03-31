import { supabase, isSupabaseConfigured, ensureSupabase, subscribeWithFetch } from './_utils';
import type { AppUser, Unsubscribe } from '../../../shared/types';

const mapUser = (row: any): AppUser => ({
  id: row.id,
  companyId: row.organization_id,
  name: row.name ?? '',
  email: row.email ?? '',
  role: row.role ?? 'worker',
  googleTokens: row.google_tokens ?? undefined,
  status: (row.status ?? 'approved') as 'pending' | 'approved' | 'rejected',
  isSuperAdmin: row.is_super_admin ?? false,
});

export const subscribeCompanyUsers = (
  companyId: string,
  onChange: (users: AppUser[]) => void,
  onError: (error: unknown) => void
): Unsubscribe => {
  let active = true;

  const fetchUsers = async () => {
    try {
      ensureSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', companyId)
        .limit(50);

      if (!active) return;
      if (error) throw error;
      onChange((data ?? []).map(mapUser));
    } catch (error) {
      if (!active) return;
      onError(error);
    }
  };

  fetchUsers().catch(() => null);

  if (!isSupabaseConfigured) {
    return () => {
      active = false;
    };
  }

  const unsubscribe = subscribeWithFetch(
    `profiles:${companyId}`,
    'profiles',
    `organization_id=eq.${companyId}`,
    fetchUsers
  );

  return () => {
    active = false;
    unsubscribe();
  };
};

export const fetchProfileByUserId = async (userId: string): Promise<AppUser | null> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapUser(data) : null;
};

export const updateProfileRole = async (params: {
  userId: string;
  organizationId: string;
  role: 'admin' | 'worker';
}): Promise<void> => {
  ensureSupabase();
  const { userId, organizationId, role } = params;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);
  if (profileError) throw profileError;

  const { error: memberError } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('organization_id', organizationId)
    .eq('user_id', userId);
  if (memberError) throw memberError;
};

export const removeOrganizationMember = async (params: {
  userId: string;
  organizationId: string;
}): Promise<void> => {
  ensureSupabase();
  const { userId, organizationId } = params;

  const { error: memberError } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId);
  if (memberError) throw memberError;

  await supabase
    .from('profiles')
    .update({ organization_id: null, role: null })
    .eq('id', userId);
};

export const updateProfileTokens = async (userId: string, tokens: any): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({ google_tokens: tokens })
    .eq('id', userId);
  if (error) throw error;
};

export const fetchPendingProfiles = async (): Promise<AppUser[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapUser);
};

export const approveProfile = async (userId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase.from('profiles').update({ status: 'approved' }).eq('id', userId);
  if (error) throw error;
};

export const rejectProfile = async (userId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase.from('profiles').update({ status: 'rejected' }).eq('id', userId);
  if (error) throw error;
};
