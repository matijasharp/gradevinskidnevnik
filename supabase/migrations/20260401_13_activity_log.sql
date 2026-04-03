create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  action text not null,
  entity_type text not null default '',
  entity_id text,
  entity_name text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_org_idx on public.activity_log(organization_id);
create index if not exists activity_log_project_idx on public.activity_log(project_id);

alter table public.activity_log enable row level security;

-- Members of the org can read its activity
create policy "Org members can read activity_log"
  on public.activity_log for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- Authenticated org members can insert activity
create policy "Org members can insert activity_log"
  on public.activity_log for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
