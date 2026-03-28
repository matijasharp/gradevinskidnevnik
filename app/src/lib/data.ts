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
  phase: 'Priprema' | 'Razvod' | 'Kabliranje' | 'Montaža' | 'Testiranje' | 'Sanacija' | 'Završeno';
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
  phase: 'Priprema' | 'Razvod' | 'Kabliranje' | 'Montaža' | 'Testiranje' | 'Sanacija' | 'Završeno';
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
  website: row.website ?? undefined
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
}): Promise<{ company: Company; profile: AppUser }> => {
  ensureSupabase();
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: params.organizationName,
      owner_email: params.ownerEmail ?? undefined,
      owner_user_id: params.ownerUserId
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
