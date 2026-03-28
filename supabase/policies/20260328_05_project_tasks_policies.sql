alter table public.project_tasks enable row level security;

-- Org members or project_members can read tasks
create policy project_tasks_select on public.project_tasks
  for select
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (
      select project_id from public.project_members where user_id = auth.uid()
    )
  );

-- Only org members can create tasks
create policy project_tasks_insert on public.project_tasks
  for insert
  with check (
    project_id in (select get_my_org_project_ids())
  );

-- Org members OR project_members can update (toggle done)
create policy project_tasks_update on public.project_tasks
  for update
  using (
    project_id in (select get_my_org_project_ids())
    or project_id in (
      select project_id from public.project_members where user_id = auth.uid()
    )
  );

-- Only org members can delete tasks
create policy project_tasks_delete on public.project_tasks
  for delete
  using (
    project_id in (select get_my_org_project_ids())
  );
