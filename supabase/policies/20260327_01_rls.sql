alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_phases enable row level security;
alter table public.diary_entries enable row level security;
alter table public.diary_photos enable row level security;

-- Security definer functions (bypass RLS to avoid infinite recursion)

create or replace function public.get_my_organization_ids()
returns setof uuid
language sql security definer stable set search_path = public
as $$
  select organization_id from public.organization_members where user_id = auth.uid();
$$;

create or replace function public.get_my_owned_org_ids()
returns setof uuid
language sql security definer stable set search_path = public
as $$
  select id from public.organizations where owner_user_id = auth.uid();
$$;

create or replace function public.get_my_project_ids()
returns setof uuid
language sql security definer stable set search_path = public
as $$
  select project_id from public.project_members where user_id = auth.uid();
$$;

create or replace function public.get_my_org_project_ids()
returns setof uuid
language sql security definer stable set search_path = public
as $$
  select p.id from public.projects p
  where p.organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid()
  );
$$;

-- organizations
create policy orgs_select_members on public.organizations
  for select
  using (
    owner_user_id = auth.uid()
    or id in (select get_my_organization_ids())
  );

create policy orgs_insert_owner on public.organizations
  for insert
  with check (owner_user_id = auth.uid());

create policy orgs_update_owner on public.organizations
  for update
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy orgs_delete_owner on public.organizations
  for delete
  using (owner_user_id = auth.uid());

-- organization_members (no self-reference, uses owned org check)
create policy org_members_select on public.organization_members
  for select
  using (
    user_id = auth.uid()
    or organization_id in (select get_my_owned_org_ids())
  );

create policy org_members_insert on public.organization_members
  for insert
  with check (
    organization_id in (select get_my_owned_org_ids())
    or exists (
      select 1 from public.invitations i
      where i.organization_id = organization_id
        and lower(i.email) = lower(auth.email())
    )
  );

create policy org_members_update on public.organization_members
  for update
  using (organization_id in (select get_my_owned_org_ids()))
  with check (organization_id in (select get_my_owned_org_ids()));

create policy org_members_delete on public.organization_members
  for delete
  using (organization_id in (select get_my_owned_org_ids()));

-- profiles
create policy profiles_select on public.profiles
  for select
  using (
    id = auth.uid()
    or organization_id in (select get_my_organization_ids())
  );

create policy profiles_insert on public.profiles
  for insert
  with check (id = auth.uid());

create policy profiles_update on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- clients
create policy clients_access on public.clients
  for all
  using (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

-- projects
create policy projects_select on public.projects
  for select
  using (
    organization_id in (select get_my_organization_ids())
    or id in (select get_my_project_ids())
  );

create policy projects_write on public.projects
  for all
  using (
    organization_id in (select get_my_organization_ids())
    or id in (select get_my_project_ids())
  )
  with check (
    organization_id in (select get_my_organization_ids())
    or id in (select get_my_project_ids())
  );

-- project_members
create policy project_members_access on public.project_members
  for all
  using (
    user_id = auth.uid()
    or project_id in (select get_my_org_project_ids())
  )
  with check (
    user_id = auth.uid()
    or project_id in (select get_my_org_project_ids())
  );

-- project_phases
create policy project_phases_access on public.project_phases
  for all
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  )
  with check (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  );

-- diary_entries
create policy diary_entries_access on public.diary_entries
  for all
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  )
  with check (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  );

-- diary_photos
create policy diary_photos_access on public.diary_photos
  for all
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  )
  with check (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  );
