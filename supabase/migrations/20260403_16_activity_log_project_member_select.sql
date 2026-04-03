-- Allow cross-org project members to read activity for their projects
-- The existing "Org members can read activity_log" policy covers own-org users.
-- This policy adds visibility for invited cross-org members by project_id.
create policy "Project members can read activity_log"
  on public.activity_log for select
  using (
    project_id in (select get_my_project_ids())
  );
