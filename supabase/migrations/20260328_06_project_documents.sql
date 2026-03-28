create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  file_path text not null,
  file_url text not null,
  file_size bigint,
  file_type text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists project_documents_project_idx on public.project_documents(project_id);

-- Storage bucket (safe to re-run)
insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', true)
on conflict (id) do nothing;
