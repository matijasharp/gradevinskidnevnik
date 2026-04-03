import { supabase, ensureSupabase } from './_utils';
import type { ProjectMember, ProjectInvitation } from '../../../shared/types';

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

export const fetchProjectMemberRole = async (
  projectId: string,
  userId: string
): Promise<'lead' | 'contributor' | 'viewer' | null> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return null;
  return (data?.role as 'lead' | 'contributor' | 'viewer') ?? null;
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
