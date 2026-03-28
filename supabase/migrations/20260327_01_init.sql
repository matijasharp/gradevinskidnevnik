create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text,
  owner_user_id uuid,
  brand_color text,
  logo_url text,
  street text,
  city text,
  address text,
  email text,
  phone text,
  website text,
  created_at timestamptz default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'worker',
  created_at timestamptz default now(),
  unique (organization_id, user_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  name text,
  email text,
  role text,
  invited boolean default false,
  google_tokens jsonb,
  created_at timestamptz default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  owner_company_id uuid references public.organizations(id) on delete set null,
  parent_project_id uuid references public.projects(id) on delete set null,
  discipline text,
  client_id uuid references public.clients(id) on delete set null,
  project_type text,
  visibility text default 'private',
  client_name text,
  project_name text not null,
  street text,
  city text,
  object_type text,
  status text default 'active',
  phase text default 'Priprema',
  start_date date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  status text default 'active',
  start_date date,
  end_date date,
  order_index integer,
  created_at timestamptz default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  created_by uuid references auth.users(id),
  created_by_name text,
  entry_date date not null,
  work_date_from date,
  work_date_to date,
  title text,
  phase text,
  work_type text,
  zone text,
  description text,
  status text,
  hours numeric,
  workers_count integer,
  line_items jsonb,
  materials_used text,
  missing_items text,
  return_visit_needed boolean default false,
  issue_note text,
  ai_summary text,
  weather_condition text,
  temperature numeric,
  reminder_at timestamptz,
  reminder_notified boolean default false,
  signature_url text,
  entry_number integer,
  pdf_url text,
  client_visible boolean default false,
  signed_by_name text,
  signed_by_role text,
  created_at timestamptz default now()
);

create table if not exists public.diary_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.diary_entries(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  url text not null,
  storage_path text,
  description text,
  created_at timestamptz default now()
);

create index if not exists projects_org_idx on public.projects(organization_id);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_created_idx on public.projects(created_at);

create index if not exists diary_entries_org_idx on public.diary_entries(organization_id);
create index if not exists diary_entries_project_idx on public.diary_entries(project_id);
create index if not exists diary_entries_date_idx on public.diary_entries(entry_date);

create index if not exists diary_photos_entry_idx on public.diary_photos(entry_id);
