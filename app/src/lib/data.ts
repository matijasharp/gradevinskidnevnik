import { supabase, isSupabaseConfigured } from './supabase';

interface Project {
  id: string;
  companyId: string;
  clientName: string;
  projectName: string;
  street: string;
  city: string;
  objectType: string;
  status: 'active' | 'completed' | 'archived';
  phase: string;
  startDate: string;
  notes?: string;
}

interface DiaryEntry {
  id: string;
  companyId: string;
  projectId: string;
  createdBy: string;
  createdByName: string;
  entryDate: string;
  title: string;
  phase: string;
  workType: string;
  zone?: string;
  description: string;
  status: 'završeno' | 'djelomično završeno' | 'čeka materijal' | 'blokirano' | 'potrebno dodatno';
  hours: number;
  workersCount: number;
  lineItems?: { name: string; quantity: number; unit: string }[];
  materialsUsed?: string;
  missingItems?: string;
  returnVisitNeeded: boolean;
  issueNote?: string;
  aiSummary?: string;
  weatherCondition?: string;
  temperature?: number;
  reminderAt?: string;
  reminderNotified?: boolean;
  signatureUrl?: string;
  createdAt: any;
}

interface AppUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  googleTokens?: any;
}

interface Company {
  id: string;
  name: string;
  ownerEmail?: string;
  brandColor?: string;
  logoUrl?: string;
  street?: string;
  city?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  discipline?: 'electro' | 'water' | 'klima' | 'general';
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  name?: string;
  role: 'admin' | 'worker';
}

interface DiaryPhoto {
  id: string;
  entryId: string;
  projectId: string;
  companyId: string;
  url: string;
  description?: string;
  createdAt?: any;
}

type Unsubscribe = () => void;

const ensureSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
};

const mapProject = (row: any): Project => ({
  id: row.id,
  companyId: row.organization_id,
  clientName: row.client_name ?? '',
  projectName: row.project_name ?? '',
  street: row.street ?? '',
  city: row.city ?? '',
  objectType: row.object_type ?? '',
  status: row.status ?? 'active',
  phase: row.phase ?? 'Priprema',
  startDate: row.start_date ?? '',
  notes: row.notes ?? undefined
});

const mapEntry = (row: any): DiaryEntry => ({
  id: row.id,
  companyId: row.organization_id,
  projectId: row.project_id,
  createdBy: row.created_by ?? '',
  createdByName: row.created_by_name ?? '',
  entryDate: row.entry_date ?? '',
  title: row.title ?? '',
  phase: row.phase ?? 'Priprema',
  workType: row.work_type ?? '',
  zone: row.zone ?? undefined,
  description: row.description ?? '',
  status: row.status ?? 'završeno',
  hours: row.hours ?? 0,
  workersCount: row.workers_count ?? 0,
  lineItems: row.line_items ?? [],
  materialsUsed: row.materials_used ?? undefined,
  missingItems: row.missing_items ?? undefined,
  returnVisitNeeded: row.return_visit_needed ?? false,
  issueNote: row.issue_note ?? undefined,
  aiSummary: row.ai_summary ?? undefined,
  weatherCondition: row.weather_condition ?? undefined,
  temperature: row.temperature ?? undefined,
  reminderAt: row.reminder_at ?? undefined,
  reminderNotified: row.reminder_notified ?? false,
  signatureUrl: row.signature_url ?? undefined,
  createdAt: row.created_at ?? null
});

const mapUser = (row: any): AppUser => ({
  id: row.id,
  companyId: row.organization_id,
  name: row.name ?? '',
  email: row.email ?? '',
  role: row.role ?? 'worker',
  googleTokens: row.google_tokens ?? undefined
});

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

const mapInvitation = (row: any): Invitation => ({
  id: row.id,
  organizationId: row.organization_id,
  email: row.email,
  name: row.name ?? undefined,
  role: row.role ?? 'worker'
});

const mapPhoto = (row: any): DiaryPhoto => ({
  id: row.id,
  entryId: row.entry_id,
  projectId: row.project_id,
  companyId: row.organization_id,
  url: row.url,
  description: row.description ?? undefined,
  createdAt: row.created_at ?? null
});

const subscribeWithFetch = (
  channelName: string,
  table: string,
  filter: string,
  fetcher: () => Promise<void>
): Unsubscribe => {
  ensureSupabase();

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter },
      () => {
        fetcher().catch(() => null);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeProjects = (
  companyId: string,
  onChange: (projects: Project[]) => void,
  onError: (error: unknown) => void
): Unsubscribe => {
  let active = true;

  const fetchProjects = async () => {
    try {
      ensureSupabase();
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', companyId)
        .order('status', { ascending: true })
        .limit(50);

      if (!active) return;
      if (error) throw error;
      onChange((data ?? []).map(mapProject));
    } catch (error) {
      if (!active) return;
      onError(error);
    }
  };

  fetchProjects().catch(() => null);

  if (!isSupabaseConfigured) {
    return () => {
      active = false;
    };
  }

  const unsubscribe = subscribeWithFetch(
    `projects:${companyId}`,
    'projects',
    `organization_id=eq.${companyId}`,
    fetchProjects
  );

  return () => {
    active = false;
    unsubscribe();
  };
};

export const subscribeDiaryEntries = (
  companyId: string,
  onChange: (entries: DiaryEntry[]) => void,
  onError: (error: unknown) => void
): Unsubscribe => {
  let active = true;

  const fetchEntries = async () => {
    try {
      ensureSupabase();
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('organization_id', companyId)
        .order('entry_date', { ascending: false })
        .limit(200);

      if (!active) return;
      if (error) throw error;
      onChange((data ?? []).map(mapEntry));
    } catch (error) {
      if (!active) return;
      onError(error);
    }
  };

  fetchEntries().catch(() => null);

  if (!isSupabaseConfigured) {
    return () => {
      active = false;
    };
  }

  const unsubscribe = subscribeWithFetch(
    `diary_entries:${companyId}`,
    'diary_entries',
    `organization_id=eq.${companyId}`,
    fetchEntries
  );

  return () => {
    active = false;
    unsubscribe();
  };
};

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

export const fetchDiaryPhotos = async (entryId: string): Promise<DiaryPhoto[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('diary_photos')
    .select('*')
    .eq('entry_id', entryId);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPhoto);
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

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
      invited: false
    })
    .select('*')
    .single();

  if (profileError) throw profileError;

  return {
    company: mapOrganization(org),
    profile: mapUser(profile)
  };
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

export const updateProfileTokens = async (userId: string, tokens: any): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('profiles')
    .update({ google_tokens: tokens })
    .eq('id', userId);
  if (error) throw error;
};

export const updateDiaryEntryReminder = async (entryId: string, reminderNotified: boolean): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('diary_entries')
    .update({ reminder_notified: reminderNotified })
    .eq('id', entryId);
  if (error) throw error;
};

export const createProject = async (companyId: string, data: Project): Promise<Project> => {
  ensureSupabase();
  const { data: row, error } = await supabase
    .from('projects')
    .insert({
      organization_id: companyId,
      owner_company_id: companyId,
      client_name: data.clientName,
      project_name: data.projectName,
      street: data.street,
      city: data.city,
      object_type: data.objectType,
      status: data.status,
      phase: data.phase,
      start_date: data.startDate || null,
      notes: data.notes ?? null
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapProject(row);
};

export const updateProject = async (projectId: string, data: Partial<Project>): Promise<void> => {
  ensureSupabase();
  const payload: any = {};
  if (data.clientName !== undefined) payload.client_name = data.clientName;
  if (data.projectName !== undefined) payload.project_name = data.projectName;
  if (data.street !== undefined) payload.street = data.street;
  if (data.city !== undefined) payload.city = data.city;
  if (data.objectType !== undefined) payload.object_type = data.objectType;
  if (data.status !== undefined) payload.status = data.status;
  if (data.phase !== undefined) payload.phase = data.phase;
  if (data.startDate !== undefined) payload.start_date = data.startDate || null;
  if (data.notes !== undefined) payload.notes = data.notes ?? null;

  const { error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId);
  if (error) throw error;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  if (error) throw error;
};

export const createDiaryEntry = async (companyId: string, data: DiaryEntry): Promise<string> => {
  ensureSupabase();
  const { data: row, error } = await supabase
    .from('diary_entries')
    .insert({
      organization_id: companyId,
      project_id: data.projectId,
      created_by: data.createdBy,
      created_by_name: data.createdByName,
      entry_date: data.entryDate,
      title: data.title,
      phase: data.phase,
      work_type: data.workType,
      zone: data.zone ?? null,
      description: data.description,
      status: data.status,
      hours: data.hours,
      workers_count: data.workersCount,
      line_items: data.lineItems ?? [],
      materials_used: data.materialsUsed ?? null,
      missing_items: data.missingItems ?? null,
      return_visit_needed: data.returnVisitNeeded,
      issue_note: data.issueNote ?? null,
      ai_summary: data.aiSummary ?? null,
      weather_condition: data.weatherCondition ?? null,
      temperature: data.temperature ?? null,
      reminder_at: data.reminderAt || null,
      reminder_notified: data.reminderNotified ?? false,
      signature_url: data.signatureUrl ?? null
    })
    .select('id')
    .single();

  if (error) throw error;
  return row.id;
};

export const deleteDiaryEntry = async (entryId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('diary_entries')
    .delete()
    .eq('id', entryId);
  if (error) throw error;
};

export const updateDiaryEntry = async (entryId: string, data: Partial<DiaryEntry>): Promise<void> => {
  ensureSupabase();
  const payload: any = {};
  if (data.entryDate !== undefined) payload.entry_date = data.entryDate;
  if (data.title !== undefined) payload.title = data.title;
  if (data.phase !== undefined) payload.phase = data.phase;
  if (data.workType !== undefined) payload.work_type = data.workType;
  if (data.zone !== undefined) payload.zone = data.zone ?? null;
  if (data.description !== undefined) payload.description = data.description;
  if (data.status !== undefined) payload.status = data.status;
  if (data.hours !== undefined) payload.hours = data.hours;
  if (data.workersCount !== undefined) payload.workers_count = data.workersCount;
  if (data.lineItems !== undefined) payload.line_items = data.lineItems ?? [];
  if (data.materialsUsed !== undefined) payload.materials_used = data.materialsUsed ?? null;
  if (data.missingItems !== undefined) payload.missing_items = data.missingItems ?? null;
  if (data.returnVisitNeeded !== undefined) payload.return_visit_needed = data.returnVisitNeeded;
  if (data.issueNote !== undefined) payload.issue_note = data.issueNote ?? null;
  if (data.aiSummary !== undefined) payload.ai_summary = data.aiSummary ?? null;
  if (data.weatherCondition !== undefined) payload.weather_condition = data.weatherCondition ?? null;
  if (data.temperature !== undefined) payload.temperature = data.temperature ?? null;
  if (data.reminderAt !== undefined) payload.reminder_at = data.reminderAt || null;
  if (data.reminderNotified !== undefined) payload.reminder_notified = data.reminderNotified;
  if (data.signatureUrl !== undefined) payload.signature_url = data.signatureUrl ?? null;

  const { error } = await supabase
    .from('diary_entries')
    .update(payload)
    .eq('id', entryId);
  if (error) throw error;
};

export const createDiaryPhoto = async (data: {
  entryId: string;
  projectId: string;
  companyId: string;
  url: string;
  description?: string;
}): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('diary_photos')
    .insert({
      entry_id: data.entryId,
      project_id: data.projectId,
      organization_id: data.companyId,
      url: data.url,
      description: data.description ?? null
    });
  if (error) throw error;
};

export const updateDiaryPhoto = async (photoId: string, description: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('diary_photos')
    .update({ description })
    .eq('id', photoId);
  if (error) throw error;
};

export const uploadDiaryPhoto = async (
  file: File,
  orgId: string,
  entryId: string
): Promise<string> => {
  ensureSupabase();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${orgId}/${entryId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from('diary-photos')
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  const { data } = supabase.storage.from('diary-photos').getPublicUrl(path);
  return data.publicUrl;
};

export const deleteDiaryPhoto = async (photoId: string, photoUrl?: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('diary_photos')
    .delete()
    .eq('id', photoId);
  if (error) throw error;

  if (photoUrl) {
    const marker = '/object/public/diary-photos/';
    const markerIdx = photoUrl.indexOf(marker);
    if (markerIdx !== -1) {
      const storagePath = photoUrl.slice(markerIdx + marker.length);
      supabase.storage.from('diary-photos').remove([storagePath]).catch(() => null);
    }
  }
};

export const fetchProjectPhotos = async (projectId: string): Promise<DiaryPhoto[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('diary_photos')
    .select('*')
    .eq('project_id', projectId)
    .limit(50);

  if (error) throw error;
  return (data ?? []).map(mapPhoto);
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

export const cancelInvitation = async (invitationId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId);
  if (error) throw error;
};

// ─── Project Membership & Cross-org Invitations ──────────────────────────────

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'lead' | 'contributor' | 'viewer';
  invitedBy?: string;
  createdAt: string;
  name?: string;
  email?: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  name?: string;
  role: 'lead' | 'contributor' | 'viewer';
  createdBy?: string;
  createdAt: string;
}

const mapProjectMember = (row: any): ProjectMember => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  role: row.role ?? 'viewer',
  invitedBy: row.invited_by ?? undefined,
  createdAt: row.created_at ?? '',
  name: row.profiles?.name ?? undefined,
  email: row.profiles?.email ?? undefined
});

const mapProjectInvitation = (row: any): ProjectInvitation => ({
  id: row.id,
  projectId: row.project_id,
  email: row.email,
  name: row.name ?? undefined,
  role: row.role ?? 'viewer',
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at ?? ''
});

export const fetchProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_members')
    .select('*, profiles(name, email)')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []).map(mapProjectMember);
};

export const addProjectMember = async (params: {
  projectId: string;
  userId: string;
  role: 'lead' | 'contributor' | 'viewer';
  invitedBy: string;
}): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: params.projectId,
        user_id: params.userId,
        role: params.role,
        invited_by: params.invitedBy
      },
      { onConflict: 'project_id,user_id' }
    );
  if (error) throw error;
};

export const removeProjectMember = async (params: {
  projectId: string;
  userId: string;
}): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', params.projectId)
    .eq('user_id', params.userId);
  if (error) throw error;
};

export const updateProjectMemberRole = async (params: {
  projectId: string;
  userId: string;
  role: 'lead' | 'contributor' | 'viewer';
}): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_members')
    .update({ role: params.role })
    .eq('project_id', params.projectId)
    .eq('user_id', params.userId);
  if (error) throw error;
};

export const fetchProjectInvitations = async (projectId: string): Promise<ProjectInvitation[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []).map(mapProjectInvitation);
};

export const createProjectInvitation = async (params: {
  projectId: string;
  email: string;
  name?: string;
  role: 'lead' | 'contributor' | 'viewer';
  createdBy: string;
}): Promise<ProjectInvitation> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_invitations')
    .insert({
      project_id: params.projectId,
      email: params.email,
      name: params.name ?? null,
      role: params.role,
      created_by: params.createdBy
    })
    .select()
    .single();
  if (error) throw error;
  return mapProjectInvitation(data);
};

export const cancelProjectInvitation = async (invitationId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_invitations')
    .delete()
    .eq('id', invitationId);
  if (error) throw error;
};

export const fetchProjectInvitationByEmail = async (email: string): Promise<ProjectInvitation | null> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_invitations')
    .select('*')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProjectInvitation(data) : null;
};

export const acceptProjectInvitation = async (params: {
  invitation: ProjectInvitation;
  userId: string;
}): Promise<void> => {
  ensureSupabase();
  const { invitation, userId } = params;
  const { error: memberError } = await supabase
    .from('project_members')
    .upsert(
      {
        project_id: invitation.projectId,
        user_id: userId,
        role: invitation.role,
        invited_by: invitation.createdBy ?? null
      },
      { onConflict: 'project_id,user_id' }
    );
  if (memberError) throw memberError;
  const { error: deleteError } = await supabase
    .from('project_invitations')
    .delete()
    .eq('id', invitation.id);
  if (deleteError) throw deleteError;
};

export const fetchSharedProjects = async (
  userId: string,
  myOrgId: string
): Promise<Project[]> => {
  ensureSupabase();
  // Get all project_ids where user is a project_member
  const { data: memberships, error: memberError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', userId);
  if (memberError) throw memberError;
  if (!memberships || memberships.length === 0) return [];

  const projectIds = memberships.map((m: any) => m.project_id);

  // Fetch those projects that belong to a DIFFERENT org (cross-org sharing)
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('id', projectIds)
    .neq('organization_id', myOrgId);
  if (error) throw error;
  return (data ?? []).map(mapProject);
};

// ─── Master Project Workspace ────────────────────────────────────────────────

export interface MasterProject {
  id: string;
  name: string;
  description?: string;
  location?: string;
  status: 'active' | 'completed' | 'archived';
  ownerOrganizationId: string;
  createdBy?: string;
  createdAt: string;
}

export interface MasterProjectOrganization {
  id: string;
  masterProjectId: string;
  organizationId: string;
  organizationName?: string;
  discipline: 'electro' | 'water' | 'klima';
  role: 'lead' | 'contributor' | 'viewer';
  linkedProjectId?: string;
  linkedProjectName?: string;
  createdAt: string;
}

export interface MasterProjectStats {
  projectId: string;
  entryCount: number;
  totalHours: number;
  lastEntryDate?: string;
}

export interface MasterActivityItem {
  entryId: string;
  projectId: string;
  entryDate: string;
  title: string;
  status: string;
  createdByName: string;
}

const mapMasterProject = (row: any): MasterProject => ({
  id: row.id,
  name: row.name ?? '',
  description: row.description ?? undefined,
  location: row.location ?? undefined,
  status: row.status ?? 'active',
  ownerOrganizationId: row.owner_organization_id ?? '',
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at ?? '',
});

const mapMasterProjectOrganization = (row: any): MasterProjectOrganization => ({
  id: row.id,
  masterProjectId: row.master_project_id ?? '',
  organizationId: row.organization_id ?? '',
  organizationName: row.organizations?.name ?? undefined,
  discipline: row.discipline ?? 'electro',
  role: row.role ?? 'contributor',
  linkedProjectId: row.linked_project_id ?? undefined,
  linkedProjectName: row.projects?.project_name ?? undefined,
  createdAt: row.created_at ?? '',
});

export const createMasterProject = async (params: {
  name: string;
  description?: string;
  location?: string;
  ownerOrganizationId: string;
  createdBy: string;
}): Promise<MasterProject> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('master_projects')
    .insert({
      name: params.name,
      description: params.description ?? null,
      location: params.location ?? null,
      owner_organization_id: params.ownerOrganizationId,
      created_by: params.createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  const mp = mapMasterProject(data);
  // Auto-link owner org as lead participant
  const { data: orgData } = await supabase
    .from('organizations')
    .select('discipline')
    .eq('id', params.ownerOrganizationId)
    .single();
  const discipline = orgData?.discipline ?? 'electro';
  await supabase.from('master_project_organizations').insert({
    master_project_id: mp.id,
    organization_id: params.ownerOrganizationId,
    discipline,
    role: 'lead',
  });
  return mp;
};

export const fetchMasterProjects = async (organizationId: string): Promise<MasterProject[]> => {
  ensureSupabase();
  // Fetch master projects owned by this org
  const { data: owned, error: ownedError } = await supabase
    .from('master_projects')
    .select('*')
    .eq('owner_organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (ownedError) throw ownedError;

  // Fetch master projects where this org is a participant (not owner)
  const { data: participantRows, error: participantError } = await supabase
    .from('master_project_organizations')
    .select('master_project_id')
    .eq('organization_id', organizationId)
    .neq('master_project_id', null);
  if (participantError) throw participantError;

  const participantIds = (participantRows ?? []).map((r: any) => r.master_project_id);
  const ownedIds = (owned ?? []).map((r: any) => r.id);
  const foreignIds = participantIds.filter((id: string) => !ownedIds.includes(id));

  let foreignProjects: MasterProject[] = [];
  if (foreignIds.length > 0) {
    const { data: foreign, error: foreignError } = await supabase
      .from('master_projects')
      .select('*')
      .in('id', foreignIds)
      .order('created_at', { ascending: false });
    if (foreignError) throw foreignError;
    foreignProjects = (foreign ?? []).map(mapMasterProject);
  }

  return [...(owned ?? []).map(mapMasterProject), ...foreignProjects];
};

export const fetchMasterProjectOrganizations = async (
  masterProjectId: string
): Promise<MasterProjectOrganization[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('master_project_organizations')
    .select('id, master_project_id, organization_id, discipline, role, linked_project_id, created_at, organizations(name), projects(project_name)')
    .eq('master_project_id', masterProjectId);
  if (error) throw error;
  return (data ?? []).map(mapMasterProjectOrganization);
};

export const linkOrganizationToMasterProject = async (params: {
  masterProjectId: string;
  organizationId: string;
  discipline: 'electro' | 'water' | 'klima';
  role?: 'lead' | 'contributor' | 'viewer';
  linkedProjectId?: string;
}): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('master_project_organizations')
    .upsert(
      {
        master_project_id: params.masterProjectId,
        organization_id: params.organizationId,
        discipline: params.discipline,
        role: params.role ?? 'contributor',
        linked_project_id: params.linkedProjectId ?? null,
      },
      { onConflict: 'master_project_id,organization_id' }
    );
  if (error) throw error;
};

export const updateMasterProject = async (
  id: string,
  updates: { name?: string; description?: string; location?: string; status?: string }
): Promise<void> => {
  ensureSupabase();
  const payload: any = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.status !== undefined) payload.status = updates.status;
  const { error } = await supabase.from('master_projects').update(payload).eq('id', id);
  if (error) throw error;
};

export const fetchMasterProjectStats = async (projectIds: string[]): Promise<MasterProjectStats[]> => {
  if (projectIds.length === 0) return [];
  ensureSupabase();
  const { data } = await supabase
    .from('diary_entries')
    .select('project_id, hours, entry_date')
    .in('project_id', projectIds);
  const map: Record<string, { count: number; hours: number; lastDate?: string }> = {};
  for (const row of data ?? []) {
    const pid = row.project_id as string;
    if (!map[pid]) map[pid] = { count: 0, hours: 0 };
    map[pid].count += 1;
    map[pid].hours += (row.hours as number) ?? 0;
    if (!map[pid].lastDate || row.entry_date > map[pid].lastDate!) {
      map[pid].lastDate = row.entry_date as string;
    }
  }
  return Object.entries(map).map(([projectId, s]) => ({
    projectId,
    entryCount: s.count,
    totalHours: s.hours,
    lastEntryDate: s.lastDate,
  }));
};

export const fetchMasterRecentActivity = async (projectIds: string[], limit = 10): Promise<MasterActivityItem[]> => {
  if (projectIds.length === 0) return [];
  ensureSupabase();
  const { data } = await supabase
    .from('diary_entries')
    .select('id, project_id, entry_date, title, status, created_by_name')
    .in('project_id', projectIds)
    .order('entry_date', { ascending: false })
    .limit(limit);
  return (data ?? []).map((row: any) => ({
    entryId: row.id,
    projectId: row.project_id,
    entryDate: row.entry_date ?? '',
    title: row.title ?? '',
    status: row.status ?? '',
    createdByName: row.created_by_name ?? '',
  }));
};

// ─── Master Project Issues ───────────────────────────────────────────────────

export interface MasterProjectIssue {
  id: string;
  masterProjectId: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  discipline?: string;
  reportedBy?: string;
  createdAt: string;
}

const mapMasterProjectIssue = (row: any): MasterProjectIssue => ({
  id: row.id,
  masterProjectId: row.master_project_id ?? '',
  title: row.title ?? '',
  description: row.description ?? undefined,
  status: row.status ?? 'open',
  priority: row.priority ?? 'medium',
  discipline: row.discipline ?? undefined,
  reportedBy: row.reported_by ?? undefined,
  createdAt: row.created_at ?? '',
});

export const fetchMasterProjectIssues = async (masterProjectId: string): Promise<MasterProjectIssue[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('master_project_issues')
    .select('*')
    .eq('master_project_id', masterProjectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapMasterProjectIssue);
};

export const createMasterProjectIssue = async (params: {
  masterProjectId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  discipline?: string;
  reportedBy: string;
}): Promise<MasterProjectIssue> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('master_project_issues')
    .insert({
      master_project_id: params.masterProjectId,
      title: params.title,
      description: params.description ?? null,
      priority: params.priority,
      discipline: params.discipline || null,
      reported_by: params.reportedBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapMasterProjectIssue(data);
};

export const updateMasterProjectIssueStatus = async (id: string, status: MasterProjectIssue['status']): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('master_project_issues')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
};

// ─── Project Tasks ───────────────────────────────────────────────────────────

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  done: boolean;
  assignedTo?: string;
  assignedToName?: string;
  createdBy?: string;
  createdAt: string;
}

const mapProjectTask = (row: any): ProjectTask => ({
  id: row.id,
  projectId: row.project_id,
  title: row.title,
  done: row.done ?? false,
  assignedTo: row.assigned_to ?? undefined,
  assignedToName: row.profiles?.name ?? undefined,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at ?? ''
});

export const fetchProjectTasks = async (projectId: string): Promise<ProjectTask[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*, profiles!project_tasks_assigned_to_fkey(name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapProjectTask);
};

export const createProjectTask = async (params: {
  projectId: string;
  title: string;
  assignedTo?: string;
  createdBy: string;
}): Promise<ProjectTask> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      project_id: params.projectId,
      title: params.title,
      assigned_to: params.assignedTo ?? null,
      created_by: params.createdBy
    })
    .select('*, profiles!project_tasks_assigned_to_fkey(name)')
    .single();
  if (error) throw error;
  return mapProjectTask(data);
};

export const toggleProjectTask = async (params: { taskId: string; done: boolean }): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_tasks')
    .update({ done: params.done })
    .eq('id', params.taskId);
  if (error) throw error;
};

export const deleteProjectTask = async (taskId: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId);
  if (error) throw error;
};

export const updateProjectTaskTitle = async (params: { taskId: string; title: string }): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_tasks')
    .update({ title: params.title })
    .eq('id', params.taskId);
  if (error) throw error;
};

// ─── Project Documents ───────────────────────────────────────────────────────

export interface ProjectDocument {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy?: string;
  createdAt: string;
}

const mapProjectDocument = (row: any): ProjectDocument => ({
  id: row.id,
  projectId: row.project_id,
  organizationId: row.organization_id,
  name: row.name,
  filePath: row.file_path,
  fileUrl: row.file_url,
  fileSize: row.file_size ?? undefined,
  fileType: row.file_type ?? undefined,
  uploadedBy: row.uploaded_by ?? undefined,
  createdAt: row.created_at ?? ''
});

export const fetchProjectDocuments = async (projectId: string): Promise<ProjectDocument[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProjectDocument);
};

export const uploadProjectDocument = async (params: {
  projectId: string;
  orgId: string;
  file: File;
  uploadedBy: string;
}): Promise<ProjectDocument> => {
  ensureSupabase();
  const ext = params.file.name.split('.').pop() ?? 'bin';
  const filePath = `${params.orgId}/${params.projectId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('project-documents')
    .upload(filePath, params.file, { upsert: false, contentType: params.file.type });
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('project-documents').getPublicUrl(filePath);
  const { data, error } = await supabase
    .from('project_documents')
    .insert({
      project_id: params.projectId,
      organization_id: params.orgId,
      name: params.file.name,
      file_path: filePath,
      file_url: urlData.publicUrl,
      file_size: params.file.size,
      file_type: params.file.type,
      uploaded_by: params.uploadedBy
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapProjectDocument(data);
};

export const deleteProjectDocument = async (docId: string, filePath: string): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('project_documents')
    .delete()
    .eq('id', docId);
  if (error) throw error;
  supabase.storage.from('project-documents').remove([filePath]).catch(() => null);
};

export const subscribeDiaryPhotos = (
  entryId: string,
  onChange: (photos: DiaryPhoto[]) => void,
  onError: (error: unknown) => void
): Unsubscribe => {
  let active = true;

  const fetchPhotos = async () => {
    try {
      ensureSupabase();
      const { data, error } = await supabase
        .from('diary_photos')
        .select('*')
        .eq('entry_id', entryId);

      if (!active) return;
      if (error) throw error;
      onChange((data ?? []).map(mapPhoto));
    } catch (error) {
      if (!active) return;
      onError(error);
    }
  };

  fetchPhotos().catch(() => null);

  if (!isSupabaseConfigured) {
    return () => {
      active = false;
    };
  }

  const unsubscribe = subscribeWithFetch(
    `diary_photos:${entryId}`,
    'diary_photos',
    `entry_id=eq.${entryId}`,
    fetchPhotos
  );

  return () => {
    active = false;
    unsubscribe();
  };
};
