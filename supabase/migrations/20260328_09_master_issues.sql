-- Phase 4 Plan 04: Issue tracking for master projects
-- Table: master_project_issues

create table if not exists public.master_project_issues (
  id uuid primary key default gen_random_uuid(),
  master_project_id uuid references public.master_projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  discipline text check (discipline in ('electro', 'water', 'klima')),
  reported_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists master_project_issues_master_idx
  on public.master_project_issues(master_project_id);

-- RLS
alter table public.master_project_issues enable row level security;

-- SELECT: owner org OR participant org
create policy "master_project_issues_select" on public.master_project_issues
  for select using (
    auth.uid() is not null and (
      master_project_id in (
        select id from public.master_projects
        where owner_organization_id in (
          select organization_id from public.profiles where id = auth.uid()
        )
      )
      or master_project_id in (
        select master_project_id from public.master_project_organizations
        where organization_id in (
          select organization_id from public.profiles where id = auth.uid()
        )
      )
    )
  );

-- INSERT: all participants (owner org OR linked participant org) can report issues
create policy "master_project_issues_insert" on public.master_project_issues
  for insert with check (
    auth.uid() is not null and (
      master_project_id in (
        select id from public.master_projects
        where owner_organization_id in (
          select organization_id from public.profiles where id = auth.uid()
        )
      )
      or master_project_id in (
        select master_project_id from public.master_project_organizations
        where organization_id in (
          select organization_id from public.profiles where id = auth.uid()
        )
      )
    )
  );

-- UPDATE: reporter or owner org can update (e.g. change status)
create policy "master_project_issues_update" on public.master_project_issues
  for update using (
    auth.uid() is not null and (
      reported_by = auth.uid()
      or master_project_id in (
        select id from public.master_projects
        where owner_organization_id in (
          select organization_id from public.profiles where id = auth.uid()
        )
      )
    )
  );

-- DELETE: owner org only
create policy "master_project_issues_delete" on public.master_project_issues
  for delete using (
    auth.uid() is not null and
    master_project_id in (
      select id from public.master_projects
      where owner_organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );
