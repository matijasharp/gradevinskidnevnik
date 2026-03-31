import { supabase, ensureSupabase } from './_utils';
import type {
  MasterProject,
  MasterProjectOrganization,
  MasterProjectStats,
  MasterActivityItem,
  MasterProjectIssue,
} from '../../../shared/types';

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
    .not('master_project_id', 'is', null);
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
