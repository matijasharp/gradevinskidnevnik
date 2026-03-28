create table if not exists public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'viewer',  -- lead | contributor | viewer
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (project_id, email)
);

create index if not exists project_invitations_project_idx on public.project_invitations(project_id);
create index if not exists project_invitations_email_idx on public.project_invitations(email);
