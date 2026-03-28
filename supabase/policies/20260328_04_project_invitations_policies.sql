alter table public.project_invitations enable row level security;

-- project_invitations: org members can manage invites for their org's projects;
-- invited user can see and delete their own invitation
create policy project_invitations_select on public.project_invitations
  for select
  using (
    project_id in (select get_my_org_project_ids())
    or lower(email) = lower(auth.email())
  );

create policy project_invitations_insert on public.project_invitations
  for insert
  with check (
    project_id in (select get_my_org_project_ids())
  );

create policy project_invitations_delete on public.project_invitations
  for delete
  using (
    project_id in (select get_my_org_project_ids())
    or lower(email) = lower(auth.email())
  );

-- Allow a user to add themselves to project_members when a project_invitation exists for their email.
-- Drop the broad policy and replace with two separate policies (own-org + cross-org self-insert).
drop policy if exists project_members_access on public.project_members;

-- Org members can manage all membership for their org's projects
create policy project_members_org_access on public.project_members
  for all
  using (
    user_id = auth.uid()
    or project_id in (select get_my_org_project_ids())
  )
  with check (
    user_id = auth.uid()
    or project_id in (select get_my_org_project_ids())
  );

-- Cross-org: a user may insert themselves when a project_invitation exists for their email
create policy project_members_self_insert on public.project_members
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.project_invitations pi
      where pi.project_id = project_id
        and lower(pi.email) = lower(auth.email())
    )
  );
