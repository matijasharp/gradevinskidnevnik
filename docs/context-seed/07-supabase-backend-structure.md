# Supabase backend struktura i konvencije

## Root Supabase struktura
```
supabase/
├─ config.toml
├─ .env
│
├─ migrations/
├─ seed/
├─ policies/
├─ functions/
├─ storage/
└─ types/
```

## migrations/ (najvažnije)
- Radi po modularnim fileovima, ne jednoj velikoj SQL datoteci.
- Pravilo: 1 tablica = 1 migration file.

Primjer:
```
001_init_extensions.sql
002_profiles.sql
003_organizations.sql
004_organization_members.sql
005_clients.sql
006_projects.sql
007_project_members.sql
008_diary_entries.sql
009_diary_line_items.sql
010_diary_photos.sql
011_documents.sql
012_invitations.sql
013_activity_log.sql
014_indexes.sql
```

## seed/ (test data)
```
seed_profiles.sql
seed_organizations.sql
seed_projects.sql
seed_diary_entries.sql
seed_full_dev.sql
```

## policies/ (RLS logika)
- RLS nemoj držati unutar migrations, vodi ih zasebno.

```
profiles.sql
organizations.sql
organization_members.sql
clients.sql
projects.sql
project_members.sql
diary_entries.sql
diary_photos.sql
documents.sql
invitations.sql
```

Primjer policy strukture:
```sql
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects they have access to"
ON projects
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = projects.id
    AND (
      pm.user_id = auth.uid()
      OR pm.organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can create projects in their org"
ON projects
FOR INSERT
WITH CHECK (
  owner_organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
  )
);
```

## functions/ (edge functions)
Koristi za:
- generiranje PDF-a
- slanje emaila
- kompleksne transakcije (više tablica)
- validaciju invite tokena
- AI summarization (kasnije)

Ne koristi za obični CRUD.

Primjer strukture:
```
functions/
├─ create-diary-entry/
│  ├─ index.ts
│  └─ service.ts
├─ generate-pdf/
│  ├─ index.ts
│  └─ template.ts
├─ invite-member/
│  ├─ index.ts
│  └─ email.ts
├─ accept-invitation/
│  └─ index.ts
└─ webhooks/
   └─ stripe.ts
```

## storage/ (bucket organizacija)
Preporučeni bucketi:
- organization-logos
- diary-photos
- signatures
- documents
- report-pdfs

Naming konvencija:
- diary-photos/{organizationId}/{projectId}/{entryId}/{fileName}.jpg
- report-pdfs/{organizationId}/{projectId}/{entryId}.pdf

Ovo olakšava cleanup, export, izolaciju i sigurnost.

## types/ (generirani tipovi)
```
supabase gen types typescript --project-id YOUR_ID > database.types.ts
```

## Backend konvencije
- Svi ID-jevi su UUID.
- Ownership ide kroz organization_id i project_members.
- Permissioni su u RLS, ne u frontendu.
- Audit log radi odmah.

## Frontend integracija (pattern)
```
export const getProjects = async (orgId: string) => {
  return supabase
    .from("projects")
    .select("*")
    .eq("owner_organization_id", orgId);
};
```

## Deployment flow
- Lokalno: `supabase start`
- Migration: `supabase db push`
- Functions: `supabase functions deploy`

## Minimal setup koji moraš napraviti odmah
- Migrations (core tablice)
- RLS za organizations, projects, diary_entries
- Storage bucketi za slike i PDF
- Basic auth flow

## Može čekati
- Advanced policies
- Analytics
- Webhooks
- Kompleksne edge functions
