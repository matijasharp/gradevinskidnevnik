alter table public.project_documents enable row level security;

-- Org members OR cross-org project_members can read
create policy project_documents_select on public.project_documents
  for select
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (
      select project_id from public.project_members where user_id = auth.uid()
    )
  );

-- Only org members can upload (insert)
create policy project_documents_insert on public.project_documents
  for insert
  with check (
    project_id in (select get_my_org_project_ids())
  );

-- Only org members can delete
create policy project_documents_delete on public.project_documents
  for delete
  using (
    project_id in (select get_my_org_project_ids())
  );

-- Storage policies for project-documents bucket
create policy "Authenticated can upload project documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'project-documents');

create policy "Authenticated can view project documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'project-documents');

create policy "Authenticated can delete project documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'project-documents');
