alter table public.invitations enable row level security;

drop policy if exists org_members_insert on public.organization_members;
create policy org_members_insert on public.organization_members
  for insert
  with check (
    organization_id in (
      select m.organization_id from public.organization_members m
      where m.user_id = auth.uid()
    )
    or exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.owner_user_id = auth.uid()
    )
    or exists (
      select 1 from public.invitations i
      where i.organization_id = organization_id
        and lower(i.email) = lower(auth.email())
    )
  );

create policy invitations_select_org on public.invitations
  for select
  using (
    organization_id in (
      select m.organization_id from public.organization_members m
      where m.user_id = auth.uid()
    )
  );

create policy invitations_select_email on public.invitations
  for select
  using (lower(email) = lower(auth.email()));

create policy invitations_insert_org on public.invitations
  for insert
  with check (
    organization_id in (
      select m.organization_id from public.organization_members m
      where m.user_id = auth.uid()
    )
  );

create policy invitations_delete_org on public.invitations
  for delete
  using (
    organization_id in (
      select m.organization_id from public.organization_members m
      where m.user_id = auth.uid()
    )
  );

create policy invitations_delete_email on public.invitations
  for delete
  using (lower(email) = lower(auth.email()));
