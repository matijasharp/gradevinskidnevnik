import { supabase, isSupabaseConfigured, ensureSupabase, subscribeWithFetch } from './_utils';
import type { Project, Unsubscribe } from '../../../shared/types';

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
