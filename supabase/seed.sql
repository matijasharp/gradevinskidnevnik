-- supabase/seed.sql
-- Local dev seed data — run via `supabase db reset`
-- WARNING: For local development only — never run against production
-- All UUIDs are fixed so resets are idempotent

BEGIN;

-- =============================================
-- USERS (auth.users + public.profiles)
-- =============================================

INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@test.com',
  crypt('testpass123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING,
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'worker@test.com',
  crypt('testpass123', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, name, role, status, is_super_admin) VALUES
(
  '00000000-0000-0000-0000-000000000001',
  'admin@test.com',
  'Admin Test',
  'admin',
  'approved',
  false
) ON CONFLICT (id) DO NOTHING,
(
  '00000000-0000-0000-0000-000000000002',
  'worker@test.com',
  'Worker Test',
  'worker',
  'approved',
  false
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- ORGANIZATIONS
-- =============================================

INSERT INTO public.organizations (id, name, discipline, owner_user_id, owner_email) VALUES
(
  '00000000-0000-0000-0000-000000000010',
  'Elektro d.o.o.',
  'electro',
  '00000000-0000-0000-0000-000000000001',
  'admin@test.com'
) ON CONFLICT (id) DO NOTHING,
(
  '00000000-0000-0000-0000-000000000011',
  'GM Gradnja d.o.o.',
  'general',
  '00000000-0000-0000-0000-000000000001',
  'admin@test.com'
) ON CONFLICT (id) DO NOTHING;

-- Update profiles with organization_id now that orgs exist
UPDATE public.profiles
SET organization_id = '00000000-0000-0000-0000-000000000010'
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002'
);

-- =============================================
-- ORGANIZATION MEMBERS
-- =============================================

INSERT INTO public.organization_members (id, organization_id, user_id, role) VALUES
(
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'admin'
) ON CONFLICT (id) DO NOTHING,
(
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000002',
  'worker'
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- CLIENTS
-- =============================================

INSERT INTO public.clients (id, name, organization_id) VALUES
(
  '00000000-0000-0000-0000-000000000030',
  'Stambena zgrada Sarajevska',
  '00000000-0000-0000-0000-000000000010'
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PROJECTS
-- =============================================

INSERT INTO public.projects (id, project_name, organization_id, discipline, status, client_id) VALUES
(
  '00000000-0000-0000-0000-000000000040',
  'Elektroinstalacije - Zgrada Sarajevska',
  '00000000-0000-0000-0000-000000000010',
  'electro',
  'active',
  '00000000-0000-0000-0000-000000000030'
) ON CONFLICT (id) DO NOTHING,
(
  '00000000-0000-0000-0000-000000000041',
  'Koordinacija gradilišta',
  '00000000-0000-0000-0000-000000000011',
  'general',
  'active',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DIARY ENTRIES
-- =============================================

INSERT INTO public.diary_entries (
  id, project_id, organization_id, entry_date, phase, description,
  created_by, created_by_name, status
) VALUES
(
  '00000000-0000-0000-0000-000000000050',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  CURRENT_DATE - INTERVAL '2 days',
  'Priprema',
  'Postavljanje razvoda u podrumu',
  '00000000-0000-0000-0000-000000000001',
  'Admin Test',
  'draft'
) ON CONFLICT (id) DO NOTHING,
(
  '00000000-0000-0000-0000-000000000051',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  CURRENT_DATE - INTERVAL '1 day',
  'Izvođenje',
  'Montaža razvodnih ormara',
  '00000000-0000-0000-0000-000000000001',
  'Admin Test',
  'draft'
) ON CONFLICT (id) DO NOTHING,
(
  '00000000-0000-0000-0000-000000000052',
  '00000000-0000-0000-0000-000000000040',
  '00000000-0000-0000-0000-000000000010',
  CURRENT_DATE,
  'Izvođenje',
  'Uvlačenje kabela - kat 1',
  '00000000-0000-0000-0000-000000000001',
  'Admin Test',
  'draft'
) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- MASTER PROJECTS
-- =============================================

INSERT INTO public.master_projects (id, name, owner_organization_id, created_by, status) VALUES
(
  '00000000-0000-0000-0000-000000000060',
  'Stambena zgrada Sarajevska',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Link GM Gradnja as owner (lead)
INSERT INTO public.master_project_organizations (
  id, master_project_id, organization_id, role, discipline
) VALUES
(
  '00000000-0000-0000-0000-000000000070',
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000011',
  'lead',
  'general'
) ON CONFLICT (id) DO NOTHING,
-- Link Elektro d.o.o. as contributor
(
  '00000000-0000-0000-0000-000000000071',
  '00000000-0000-0000-0000-000000000060',
  '00000000-0000-0000-0000-000000000010',
  'contributor',
  'electro'
) ON CONFLICT (id) DO NOTHING;

COMMIT;
