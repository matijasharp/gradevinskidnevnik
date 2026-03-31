import { supabase, ensureSupabase } from './_utils';
import type { ProjectTask } from '../../../shared/types';

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
