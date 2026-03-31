import { supabase, ensureSupabase } from './_utils';
import type { Company, AppUser } from '../../../shared/types';

const mapOrganization = (row: any): Company => ({
  id: row.id,
  name: row.name ?? '',
  ownerEmail: row.owner_email ?? undefined,
  brandColor: row.brand_color ?? undefined,
  logoUrl: row.logo_url ?? undefined,
  street: row.street ?? undefined,
  city: row.city ?? undefined,
  address: row.address ?? undefined,
  email: row.email ?? undefined,
  phone: row.phone ?? undefined,
  website: row.website ?? undefined,
  discipline: (row.discipline ?? 'electro') as 'electro' | 'water' | 'klima',
});

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

export const fetchOrganizationById = async (organizationId: string): Promise<Company | null> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapOrganization(data) : null;
};

export const searchOrganizations = async (query: string): Promise<Company[]> => {
  if (query.trim().length < 2) return [];
  ensureSupabase();
  const { data } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', `%${query.trim()}%`)
    .limit(10);
  return (data ?? []).map(mapOrganization);
};

export const createOrganizationWithOwner = async (params: {
  organizationName: string;
  ownerUserId: string;
  ownerEmail: string | null;
  ownerName: string;
  discipline?: 'electro' | 'water' | 'klima' | 'general';
}): Promise<{ company: Company; profile: AppUser }> => {
  ensureSupabase();
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: params.organizationName,
      owner_email: params.ownerEmail ?? undefined,
      owner_user_id: params.ownerUserId,
      discipline: params.discipline ?? 'electro'
    })
    .select('*')
    .single();

  if (orgError) throw orgError;

  const { error: memberError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: org.id,
      user_id: params.ownerUserId,
      role: 'admin'
    });
  if (memberError) throw memberError;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: params.ownerUserId,
      organization_id: org.id,
      name: params.ownerName,
      email: params.ownerEmail ?? undefined,
      role: 'admin',
      invited: false,
      status: 'approved'
    })
    .select('*')
    .single();

  if (profileError) throw profileError;

  return {
    company: mapOrganization(org),
    profile: mapUser(profile)
  };
};

export const updateOrganization = async (organizationId: string, data: Partial<Company>): Promise<void> => {
  ensureSupabase();
  const payload: any = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.brandColor !== undefined) payload.brand_color = data.brandColor;
  if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;
  if (data.street !== undefined) payload.street = data.street;
  if (data.city !== undefined) payload.city = data.city;
  if (data.address !== undefined) payload.address = data.address;
  if (data.email !== undefined) payload.email = data.email;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.website !== undefined) payload.website = data.website;
  if (data.discipline !== undefined) payload.discipline = data.discipline;

  const { error } = await supabase
    .from('organizations')
    .update(payload)
    .eq('id', organizationId);
  if (error) throw error;
};
