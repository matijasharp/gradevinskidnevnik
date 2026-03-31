# Gradevinski Dnevnik

A multi-tenant site diary platform for construction contractors and project leads. Contractors log daily site progress fast; project leads see shared, audited status across all disciplines in real time.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Disciplines & Multi-tenancy](#disciplines--multi-tenancy)
- [Authentication](#authentication)
- [Data Layer](#data-layer)
- [Test Users](#test-users)

---

## Overview

Gradevinski Dnevnik ("Construction Diary") is built for trade contractors — electricians, plumbers, HVAC technicians — who need to document daily site work and share progress with project coordinators. It supports:

- **Contractor workspace** — company profile, projects, daily diary entries with photos
- **Multi-tenant sharing** — invite external contractors to projects; read-only cross-org access
- **Discipline verticals** — separate UX paths for Elektro, Vodoinstalacije, Klima, and General contractors, detected from subdomain
- **Master project workspace** — coordinators link multiple trade orgs to a single master project, see aggregated stats, timelines, and issue tracking across all disciplines

The app started as a prototype (`site-diary-mini/`) and was rebuilt on Supabase with full parity.

---

## Features

### Contractor Workspace
- **Projects** — create, manage, and archive construction projects per client
- **Daily diary entries** — log work type, phase, crew count, description, weather, materials used
- **Photo gallery** — attach site photos to diary entries (Supabase Storage)
- **PDF reports** — generate structured diary PDF exports per project
- **Google Calendar** — add diary entries as calendar events via OAuth
- **Reminders** — set per-entry reminders; background checker surfaces due reminders as overlays
- **Phases** — discipline-specific phase progression (e.g. Priprema → Razvod → Kabliranje → Testiranje)

### Team & Sharing
- **Role-based access** — `admin` (full write) and `worker` (create entries, check tasks) per org
- **Invitations** — email-based invitation flow; pending/accepted/cancelled states
- **Shared projects** — invited orgs see read-only project views; RLS enforced at the database level
- **Task checklists** — per-project task list with completion tracking

### Master Project Workspace
- **Cross-discipline overview** — link multiple trade orgs to one master project
- **Aggregated stats** — per-discipline entry counts, phase status, recent activity feed
- **Issue tracking** — create issues, cycle status (open → in-progress → resolved) via badge click
- **Organization search** — find and link orgs to master project with discipline and role assignment

### Company Settings
- **Profile** — company name, logo, brand color, address, contact details
- **Secrets modal** — configure AI (Gemini) and Google OAuth keys at runtime without redeploy
- **AI summaries** — Gemini-powered diary entry summaries

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 19 + TypeScript + Vite 6 | SPA with React Router 7 |
| Styling | Tailwind CSS 4 + typography plugin | Mobile-first, utility classes |
| Backend | Supabase (Auth + Postgres + Storage) | RLS-enforced multi-tenancy |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Server | Express (Node.js) | Serverless-friendly; handles OAuth token exchange |
| AI | Google Gemini (`@google/genai`) | Diary entry summaries |
| Calendar | Google Calendar API + googleapis | OAuth token exchange via server |
| PDF | jsPDF + jspdf-autotable | Client-side diary PDF generation |
| Charts | Recharts | Stats visualizations in master workspace |
| Email | Resend | Invitation emails |
| Animations | Motion (motion/react) | Page transitions and overlays |
| Dates | date-fns | Formatting and reminder calculations |

---

## Architecture

The app uses a **feature-based architecture** extracted from a monolithic App.tsx (originally ~6,000 lines, now 140 lines):

```
app/src/
├── app/                     # Application shell
│   ├── layouts/             # AppShell — navigation, sidebar, user menu
│   ├── providers/           # AuthProvider, OrganizationProvider
│   └── router/              # AppRouter, route constants, guards
├── features/                # Domain feature modules
│   ├── auth/                # LoginView
│   ├── calendar/            # CalendarPage, CalendarView, useGoogleCalendar
│   ├── dashboard/           # DashboardPage, DashboardView
│   ├── diary/               # NewEntryPage, EditEntryPage, NewEntryView,
│   │                        #   DiaryEntryDetailModal, PhotoGallery, ReminderOverlay
│   ├── masterProjects/      # MasterWorkspacePage, list/detail views
│   ├── organizations/       # CompanySettingsPage, InviteUserModal
│   ├── projects/            # ProjectsPage, ProjectDetailPage, NewProjectPage,
│   │                        #   ProjectDetailView, tabs (Members, Tasks, Documents)
│   ├── reports/             # ReportsPage, ReportsView
│   └── users/               # UsersPage
├── shared/                  # Cross-feature primitives
│   ├── types/               # Single source of truth for all TypeScript types
│   ├── ui/                  # Button, Card, Input, Select, StatusBadge
│   ├── components/          # ErrorBoundary, SecretsModal
│   ├── utils/               # format.ts, image.ts, error.ts
│   └── constants/           # disciplineConfig re-exports
├── integrations/
│   ├── supabase/            # 11 domain query modules + barrel re-export
│   └── pdf/                 # generateDiaryPdf.ts
└── lib/
    ├── data.ts              # Barrel re-export → integrations/supabase
    ├── disciplineConfig.ts  # Discipline detection, phases, work types
    ├── supabase.ts          # Supabase client singleton
    └── supabaseAuth.ts      # Auth helpers
```

### Context Providers

Two React contexts manage global state:

**`AuthProvider`** — mounted in `main.tsx`
- `user` — Supabase auth user
- `appUser` — profile row from `public.profiles`
- `company` — organization row from `public.organizations`
- `loading`, `showOnboarding` — auth lifecycle flags
- Handles session changes, profile fetch, pending invitation auto-acceptance

**`OrganizationProvider`** — mounted inside the router (requires `useNavigate`)
- Real-time subscriptions: `projects`, `entries`, `companyUsers`, `pendingInvitations`
- Fetched data: `sharedProjects`, `masterProjects`
- All project and team mutation actions (`createProject`, `inviteUser`, `deleteUser`, etc.)
- Derived state: `materialHistory`, `materialUnits` (autocomplete for diary entries)

### Routing

```typescript
ROUTES = {
  DASHBOARD:        '/',
  PROJECTS:         '/projects',
  PROJECT_DETAIL:   '/projects/:projectId',
  NEW_PROJECT:      '/projects/new',
  NEW_ENTRY:        '/diary/new',
  EDIT_ENTRY:       '/diary/:entryId/edit',
  REPORTS:          '/reports',
  CALENDAR:         '/calendar',
  USERS:            '/users',
  COMPANY_SETTINGS: '/settings/company',
  MASTER_WORKSPACE: '/master',
}
```

All routes are wrapped in `ProtectedRoute` (redirects to `/` if unauthenticated). The router is a `createBrowserRouter` with Vite's `historyApiFallback` for SPA navigation.

---

## Project Structure

```
gradevinski-dnevnik/
├── app/                     # React frontend + Express server
│   ├── src/                 # Application source (see Architecture)
│   ├── server.ts            # Express server — Google OAuth token exchange
│   ├── vite.config.ts       # Vite config with @ alias and SPA fallback
│   ├── tsconfig.json        # TypeScript config
│   └── package.json         # Dependencies and scripts
├── supabase/
│   └── migrations/          # 10 SQL migration files (applied to production)
├── site-diary-mini/         # Original prototype (reference only)
├── docs/                    # Additional documentation
├── MIGRATION_PLAN.md        # Architecture refactor plan (completed)
├── TEST_USERS.md            # Development test user credentials
└── GDPR/                    # GDPR compliance documentation
```

---

## Database Schema

Managed via Supabase migrations. All existing migrations are applied to production and must not be modified.

| Migration | Purpose |
|-----------|---------|
| `20260327_01_init.sql` | Core tables: `organizations`, `profiles`, `projects`, `diary_entries`, `diary_photos` |
| `20260327_02_invites.sql` | `organization_invitations` — email-based org invitations |
| `20260328_03_storage.sql` | Storage buckets for photos and documents |
| `20260328_04_project_invitations.sql` | `project_members` — cross-org project access |
| `20260328_05_project_tasks.sql` | `project_tasks` — per-project task checklists |
| `20260328_06_project_documents.sql` | `project_documents` — file attachments per project |
| `20260328_07_master_workspace.sql` | `master_projects`, `master_project_organizations` |
| `20260328_08_general_discipline.sql` | `general` discipline type for PM/coordinator orgs |
| `20260328_09_master_issues.sql` | `master_project_issues` — cross-discipline issue tracking |
| `20260329_10_master_org_discipline.sql` | Organization discipline field + constraints |

### Key Design Decisions

- **RLS everywhere** — every table has Row Level Security policies; multi-tenancy is enforced at the DB layer
- **Dual FK on `project_members.user_id`** — references both `auth.users` (original) and `public.profiles` (PostgREST joins); pattern for all profile joins
- **FK join hint for `assigned_to`** — `profiles!project_tasks_assigned_to_fkey(name)` — named FK hint required for Supabase's PostgREST to resolve ambiguous joins
- **`master_project_organizations` RLS** — uses `owner OR direct org_id` to avoid recursive self-referencing subqueries

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (URL + publishable key)
- Google Cloud project with OAuth credentials (for Calendar integration)
- Gemini API key (for AI summaries — optional)

### Installation

```bash
cd app
npm install
```

### Configure Environment

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) for details.

### Run Development Server

```bash
cd app
npm run dev
```

This starts the Express server (which also serves Vite via the dev middleware). The app is available at `http://localhost:3000` by default.

### Build for Production

```bash
cd app
npm run build
```

Output is in `app/dist/`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon/publishable key (client-safe) |
| `GOOGLE_CLIENT_ID` | For Calendar | Google OAuth 2.0 client ID |
| `GOOGLE_CLIENT_SECRET` | For Calendar | Google OAuth 2.0 client secret (server-only) |
| `GEMINI_API_KEY` | For AI | Google Gemini API key |
| `APP_URL` | Production | Deployed app URL (for OAuth redirects) |

> The Supabase `service_role` key must **never** be exposed to the client. All privileged operations use RLS with the user's JWT.

---

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Express + Vite HMR) |
| `npm run build` | Production build via Vite |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm run preview` | Preview production build |
| `npm run clean` | Remove `dist/` directory |

### Key Conventions

**Extract-and-import pattern** — when moving code, always create the new file first, import it, verify the build passes (`npm run build`), then remove the inline version. Never delete before proven working.

**Build gate** — `npm run build` must exit 0 after every significant change. TypeScript errors are treated as blockers.

**Route navigation** — always import from `ROUTES` in `app/src/app/router/routeConfig.ts` rather than hardcoding path strings.

**Context hooks** — use `useAuth()` for auth/company state, `useOrg()` for org/project/entry data. Do not prop-drill what the context provides.

**URL-param pattern** — page components resolve their own entity from URL params + context:
```typescript
const { projectId } = useParams();
const { projects } = useOrg();
const project = projects.find(p => p.id === projectId) ?? null;
if (!project) return null;
```

---

## Disciplines & Multi-tenancy

Each organization has a `discipline` field that determines its available phases and work types:

| Discipline | Label | Phases |
|------------|-------|--------|
| `electro` | Elektro | Priprema, Razvod, Kabliranje, Montaža, Sanacija, Testiranje, Završeno |
| `water` | Vodoinstalacije | Priprema, Iskop, Razvod cijevi, Ugradnja armatura, Testiranje, Sanacija, Završeno |
| `klima` | Klima / Ventilacija | Priprema, Montaža kanala, Ugradnja jedinica, Spajanje, Testiranje, Sanacija, Završeno |
| `general` | Opći izvođač | (no phases — coordinator/PM role) |

Discipline is detected at runtime from the subdomain (`electro.app.com`) with a fallback to the `?discipline=` query parameter for local development (no DNS required).

---

## Authentication

Supabase Auth handles all identity management.

**Login methods:**
- Email/password
- Google OAuth (via server-side token exchange in `server.ts`)

**Onboarding flow** — first-time users who have no org are shown an onboarding screen to create their company. The `showOnboarding` flag in `AuthProvider` controls this.

**Invitation flow:**
1. Admin sends email invitation (stored in `organization_invitations`)
2. Invited user signs up and logs in
3. `AuthProvider` auto-detects and accepts the pending invitation on auth state change
4. User's `profiles` row is linked to the inviting org

**Roles:**
- `admin` — full access; can invite/remove users, manage projects, edit company settings
- `worker` — can create diary entries and check off tasks; cannot manage team or settings

---

## Data Layer

All database access goes through `app/src/integrations/supabase/queries/`. The `lib/data.ts` file is a thin barrel re-export maintained for import compatibility.

| Query Module | Responsibility |
|---|---|
| `organizations.ts` | Org profile CRUD, company fetch |
| `profiles.ts` | User profile read/update |
| `projects.ts` | Project CRUD, status transitions |
| `diary.ts` | Diary entry CRUD, reminder updates |
| `photos.ts` | Photo upload/delete via Supabase Storage |
| `invitations.ts` | Org invitation create/cancel/accept |
| `projectMembers.ts` | Cross-org project access management |
| `tasks.ts` | Project task checklist CRUD |
| `documents.ts` | Project document upload/delete |
| `masterProjects.ts` | Master project CRUD, org linking, stats, activity, issues |
| `members.ts` | Org member role update, removal |

Real-time subscriptions (projects, diary entries, company users, invitations) are set up inside `OrganizationProvider` using Supabase's `channel` + `on('postgres_changes')` API.

---

## Test Users

For local development against the Supabase project:

| Email | Role | Password |
|-------|------|----------|
| `test.contractor@test.local` | admin | `Test1234!` |
| `test.coordinator@test.local` | admin | `Test1234!` |
| `test.external@test.local` | worker | `Test1234!` |
| `test.worker@test.local` | worker | `Test1234!` |

> **Note:** Test users were created via direct DB insert, which bypasses GoTrue's normal signup and leaves `NULL` in several `auth.users` columns. If login returns a 500 error, run the fix in `TEST_USERS.md` to patch the `auth.users` and `auth.identities` rows.

---

*Gradevinski Dnevnik — v1.1 Frontend Architecture Refactor complete*
