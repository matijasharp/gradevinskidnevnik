import { supabase, ensureSupabase } from './_utils';
import type { ActivityLogItem } from '../../../shared/types';

const mapItem = (row: any): ActivityLogItem => ({
  id: row.id,
  organizationId: row.organization_id,
  projectId: row.project_id ?? null,
  actorId: row.actor_id ?? null,
  actorName: row.actor_name ?? '',
  action: row.action ?? '',
  entityType: row.entity_type ?? '',
  entityId: row.entity_id ?? null,
  entityName: row.entity_name ?? null,
  createdAt: row.created_at ?? '',
});

export const logActivity = async (params: {
  organizationId: string;
  projectId?: string | null;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
}): Promise<void> => {
  if (!supabase) return; // silently skip if Supabase not configured
  try {
    ensureSupabase();
    await supabase.from('activity_log').insert({
      organization_id: params.organizationId,
      project_id: params.projectId ?? null,
      actor_id: params.actorId,
      actor_name: params.actorName,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      entity_name: params.entityName ?? null,
    });
    // Fire-and-forget: do not throw — activity logging must not break the main flow
  } catch {
    // Silently swallow — activity log errors must not surface to the user
  }
};

export const fetchProjectActivity = async (projectId: string): Promise<ActivityLogItem[]> => {
  ensureSupabase();
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(mapItem);
};
