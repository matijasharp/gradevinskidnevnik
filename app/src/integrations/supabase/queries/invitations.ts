import { supabase, isSupabaseConfigured, ensureSupabase, subscribeWithFetch } from './_utils';
import type { Invitation, Company, AppUser, Unsubscribe } from '../../../shared/types';
import { fetchOrganizationById } from './organizations';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const mapInvitation = (row: any): Invitation => ({
  id: row.id,
  organizationId: row.organization_id,
  email: row.email,
  name: row.name ?? undefined,
  role: row.role ?? 'worker'
});

const mapUser = (row: any): AppUser => ({
  id: row.id,
  companyId: row.organization_id,
  name: row.name ?? '',
  email: row.email ?? '',
  role: row.role ?? 'worker',
  googleTokens: row.google_tokens ?? undefined
});

export const fetchInvitationByEmail = async (email: string): Promise<Invitation | null> => {
  ensureSupabase();
  const normalized = normalizeEmail(email);
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', normalized)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapInvitation(data) : null;
};

export const createInvitation = async (params: {
  organizationId: string;
  email: string;
  name: string;
  role: 'admin' | 'worker';
  createdBy: string;
}): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('invitations')
    .insert({
      organization_id: params.organizationId,
      email: normalizeEmail(params.email),
      name: params.name,
      role: params.role,
      created_by: params.createdBy
    });

  if (error) throw error;
};

export const acceptInvitation = async (params: {
  userId: string;
  email: string;
  name: string;
  invitation: Invitation;
}): Promise<{ company: Company | null; profile: AppUser }> => {
  ensureSupabase();
  const { invitation, userId, email, name } = params;

  const { error: memberError } = await supabase
    .from('organization_members')
    .upsert({
      organization_id: invitation.organizationId,
      user_id: userId,
      role: invitation.role
    }, { onConflict: 'organization_id,user_id' });
  if (memberError) throw memberError;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      organization_id: invitation.organizationId,
      name: invitation.name || name,
      email,
      role: invitation.role,
      invited: false
    })
    .select('*')
    .single();
  if (profileError) throw profileError;

  await supabase
    .from('invitations')
    .delete()
    .eq('id', invitation.id);

  const company = await fetchOrganizationById(invitation.organizationId);

  return {
    company,
    profile: mapUser(profile)
  };
};

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);
  if (error) throw error;
};

export const subscribePendingInvitations = (
  organizationId: string,
  onChange: (invitations: Invitation[]) => void,
  onError: (error: unknown) => void
): Unsubscribe => {
  let active = true;

  const fetchInvitations = async () => {
    try {
      ensureSupabase();
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) throw error;
      onChange((data ?? []).map(mapInvitation));
    } catch (error) {
      if (!active) return;
      onError(error);
    }
  };

  fetchInvitations().catch(() => null);

  if (!isSupabaseConfigured) {
    return () => { active = false; };
  }

  const unsubscribe = subscribeWithFetch(
    `invitations:${organizationId}`,
    'invitations',
    `organization_id=eq.${organizationId}`,
    fetchInvitations
  );

  return () => {
    active = false;
    unsubscribe();
  };
};
