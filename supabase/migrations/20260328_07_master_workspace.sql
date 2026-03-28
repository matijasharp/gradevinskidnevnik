-- Phase 4: Master Project Workspace
-- Tables: master_projects, master_project_organizations

create table if not exists public.master_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  location text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  owner_organization_id uuid references public.organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.master_project_organizations (
  id uuid primary key default gen_random_uuid(),
  master_project_id uuid references public.master_projects(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  discipline text not null check (discipline in ('electro', 'water', 'klima')),
  role text not null default 'contributor' check (role in ('lead', 'contributor', 'viewer')),
  linked_project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz default now(),
  unique (master_project_id, organization_id)
);

create index if not exists master_project_organizations_master_idx
  on public.master_project_organizations(master_project_id);

create index if not exists master_project_organizations_org_idx
  on public.master_project_organizations(organization_id);

-- RLS: master_projects
alter table public.master_projects enable row level security;

create policy "master_projects_select" on public.master_projects
  for select using (
    auth.uid() is not null and (
      owner_organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
      or id in (
        select master_project_id from public.master_project_organizations
        where organization_id in (
          select organization_id from public.profiles where id = auth.uid()
        )
      )
    )
  );

create policy "master_projects_insert" on public.master_projects
  for insert with check (auth.uid() is not null);

create policy "master_projects_update" on public.master_projects
  for update using (
    auth.uid() is not null and
    owner_organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

create policy "master_projects_delete" on public.master_projects
  for delete using (
    auth.uid() is not null and
    owner_organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

-- RLS: master_project_organizations
alter table public.master_project_organizations enable row level security;

create policy "master_project_organizations_select" on public.master_project_organizations
  for select using (
    auth.uid() is not null and (
      -- User's org owns the master project
      master_project_id in (
        select id from public.master_projects
        where owner_organization_id in (
          select organization_id from public.profiles where id = auth.uid()
        )
      )
      -- Or user's org is directly a participant in this row
      or organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "master_project_organizations_insert" on public.master_project_organizations
  for insert with check (
    auth.uid() is not null and
    master_project_id in (
      select id from public.master_projects
      where owner_organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );

create policy "master_project_organizations_delete" on public.master_project_organizations
  for delete using (
    auth.uid() is not null and
    master_project_id in (
      select id from public.master_projects
      where owner_organization_id in (
        select organization_id from public.profiles where id = auth.uid()
      )
    )
  );
