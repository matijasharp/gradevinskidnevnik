-- Migration: enforce project_members.role in RLS
-- Previously, diary_entries / diary_photos / project_phases / projects all used
-- FOR ALL policies that gave cross-org project members full write access regardless
-- of their role. This migration splits each into a read policy (all members) and
-- write policies (org members + role-gated cross-org inserts).

-- ─── projects ────────────────────────────────────────────────────────────────
-- Drop the old FOR ALL policy that allowed cross-org members to UPDATE/DELETE
drop policy if exists projects_write on public.projects;

-- Writes are org-members only (org admins/workers managing their own projects)
create policy projects_write on public.projects
  for all
  using (organization_id in (select get_my_organization_ids()))
  with check (organization_id in (select get_my_organization_ids()));

-- SELECT for cross-org members is already covered by projects_select (unchanged)

-- ─── project_phases ──────────────────────────────────────────────────────────
drop policy if exists project_phases_access on public.project_phases;

create policy project_phases_select on public.project_phases
  for select
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  );

create policy project_phases_write on public.project_phases
  for all
  using (project_id in (select get_my_org_project_ids()))
  with check (project_id in (select get_my_org_project_ids()));

-- ─── diary_entries ───────────────────────────────────────────────────────────
drop policy if exists diary_entries_access on public.diary_entries;

-- All project members can read
create policy diary_entries_select on public.diary_entries
  for select
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  );

-- Org members: full write access
create policy diary_entries_write_org on public.diary_entries
  for all
  using (project_id in (select get_my_org_project_ids()))
  with check (project_id in (select get_my_org_project_ids()));

-- Cross-org lead/contributor: may insert diary entries
create policy diary_entries_insert_member on public.diary_entries
  for insert
  with check (
    project_id in (
      select pm.project_id from public.project_members pm
      where pm.user_id = auth.uid()
        and pm.role in ('lead', 'contributor')
    )
  );

-- ─── diary_photos ────────────────────────────────────────────────────────────
drop policy if exists diary_photos_access on public.diary_photos;

-- All project members can read
create policy diary_photos_select on public.diary_photos
  for select
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (select get_my_project_ids())
  );

-- Org members: full write access
create policy diary_photos_write_org on public.diary_photos
  for all
  using (project_id in (select get_my_org_project_ids()))
  with check (project_id in (select get_my_org_project_ids()));

-- Cross-org lead/contributor: may insert photos alongside diary entries
create policy diary_photos_insert_member on public.diary_photos
  for insert
  with check (
    project_id in (
      select pm.project_id from public.project_members pm
      where pm.user_id = auth.uid()
        and pm.role in ('lead', 'contributor')
    )
  );
