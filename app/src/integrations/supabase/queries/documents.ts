import { supabase, ensureSupabase } from './_utils';
import type { ProjectDocument } from '../../../shared/types';

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
