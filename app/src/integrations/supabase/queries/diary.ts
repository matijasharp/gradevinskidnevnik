import { supabase, isSupabaseConfigured, ensureSupabase, subscribeWithFetch } from './_utils';
import type { DiaryEntry, Unsubscribe } from '../../../shared/types';

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

export const updateDiaryEntryReminder = async (entryId: string, reminderNotified: boolean): Promise<void> => {
  ensureSupabase();
  const { error } = await supabase
    .from('diary_entries')
    .update({ reminder_notified: reminderNotified })
    .eq('id', entryId);
  if (error) throw error;
};
