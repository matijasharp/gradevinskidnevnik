import { supabase, isSupabaseConfigured, ensureSupabase, subscribeWithFetch } from './_utils';
import type { DiaryPhoto, Unsubscribe } from '../../../shared/types';

const mapPhoto = (row: any): DiaryPhoto => ({
  id: row.id,
  entryId: row.entry_id,
  projectId: row.project_id,
  companyId: row.organization_id,
  url: row.url,
  description: row.description ?? undefined,
  createdAt: row.created_at ?? null
});

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
