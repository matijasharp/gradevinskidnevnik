create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'worker',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create index if not exists invitations_org_idx on public.invitations(organization_id);
create index if not exists invitations_email_idx on public.invitations(email);
