# Roadmap: Gradevinski Dnevnik

## Overview

Start from the electrician prototype, deliver a Supabase-backed MVP with full UI/feature parity, then expand into multi-tenant sharing, subdomain verticals, and a master project workspace. Then refactor the architecture for maintainability before adding new features.

## Current Milestone

**v1.2 — Electro MVP Launch** (v1.2)
Status: 🚧 In Progress
Phases: 6 of 11 complete

## Previous Milestones

**v1.1 — Frontend Architecture Refactor** (v1.1)
Status: ✅ Complete
Phases: 10 of 10 complete

**v1.0 MVP** (v1.0)
Status: ✅ Complete
Phases: 4 of 4 complete

---

### v1.2 — Electro MVP Launch

**Goal:** Launch the app for electricians on elektro.gradevinskidnevnik.online with role enforcement, approval gate, landing page, and deployment.

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 15 | App Polish + Role Enforcement | 1/1 | ✅ Complete | 2026-03-31 |
| 16 | Signup Approval Gate + Minimal Super Admin | 1/1 | ✅ Complete | 2026-03-31 |
| 17 | Landing Page | 1/1 | ✅ Complete | 2026-03-31 |
| 18 | Deployment | 1/1 | ✅ Complete | 2026-03-31 |
| 18.1 | Brand Identity [INSERTED] | 2/2 | ✅ Complete | 2026-03-31 |
| 18.2 | UI Consistency & Design System [INSERTED] | 4/4 | ✅ Complete | 2026-04-01 |
| 19 | Supabase Local Config | 1/1 | ✅ Complete | 2026-04-01 |
| 20 | Edge Functions | 2/2 | Planning | - |
| 21 | App Quality & Export Enhancements [INSERTED] | TBD | Not started | - |
| 22 | Activity Log | TBD | Not started | - |
| 23 | Full Super Admin Panel | TBD | Not started | - |

#### Phase Details

##### Phase 15: App Polish + Role Enforcement
**Goal:** Gate master project nav/creation by org discipline (`general` = coordinator only). Create `src/shared/icons/` folder. Any other UI polish before launch.
**Scope:**
- Hide "Master projekti" nav from contractor orgs (non-`general` discipline)
- Disable "create master project" for contractor orgs
- Show only invited master projects for contractors
- Add route guard on `/master-workspace` for contractor orgs
- Create `src/shared/icons/` directory with placeholder barrel export
**Plans:** TBD

##### Phase 16: Signup Approval Gate + Minimal Super Admin
**Goal:** New signups see a "pending approval" screen. A minimal super admin screen lets the platform owner approve/reject users.
**Scope:**
- Signup flow → pending state in DB (e.g. `profiles.status = 'pending'`)
- App shows "We'll contact you when approved" screen for pending users
- Minimal super admin route (hidden, protected) listing pending users with approve/reject
- Super admin role flag on `profiles` table
**Plans:** TBD

##### Phase 17: Landing Page
**Goal:** Full Croatian landing page on elektro.gradevinskidnevnik.online targeting electricians.
**Scope:**
- Hero, Problem, How It Works, Features, Social Proof, Pilot Offer, Referral sections
- All copy in Croatian as provided
- CTA buttons linking to app signup
- Mobile-first design consistent with app aesthetic
**Plans:** TBD

##### Phase 18: Deployment
**Goal:** App live on elektro.gradevinskidnevnik.online via Namecheap DNS.
**Scope:**
- Hosting setup (platform TBD during planning)
- Namecheap DNS subdomain configuration
- Environment variables (.env production)
- Landing page deployed alongside app
- Smoke test post-deploy
**Plans:** TBD

##### Phase 18.2: UI Consistency & Design System
**Goal:** Enterprise-grade desktop layout — light sidebar, full-width content, expanded color system, /brand design guide.

**Design Direction:**
- Sidebar: white/clean, not dark — already `bg-white`, keep and refine
- `#3ab9e3` = accent only (active nav dot/bar, links, focus rings, primary buttons)
- `#192a46` = primary text + heading color (high contrast on white)
- Desktop content: remove `max-w-4xl mx-auto` constraint — fill all space left of sidebar
- Mobile: do NOT touch — already good

**Full token system (index.css @theme):**
| Token | Hex | Role |
|-------|-----|------|
| `--color-accent` | `#3ab9e3` | Active states, links, primary buttons, focus rings |
| `--color-accent-hover` | `#25a8d4` | Button/link hover |
| `--color-accent-subtle` | `#3ab9e315` | Accent bg tint (active nav bg, pill bg) |
| `--color-text-primary` | `#192a46` | Headings, strong text |
| `--color-text-secondary` | `#4a5a72` | Labels, secondary text |
| `--color-text-muted` | `#8fa0b8` | Placeholders, disabled |
| `--color-surface` | `#f1f4f2` | Page/app background |
| `--color-surface-raised` | `#ffffff` | Cards, sidebar, modals |
| `--color-border` | `#e0e6ed` | Default borders |
| `--color-border-subtle` | `#f0f3f5` | Subtle dividers |
| `--color-warning` | `#fad03d` | Warnings, badges |
| `--color-warning-subtle` | `#fad03d20` | Warning bg tint |
| `--color-secondary` | `#816840` | Secondary accents (rare) |
| `--color-error` | `#e05252` | Errors, destructive actions |
| `--color-success` | `#3dba7a` | Success states |

**Scope:**
1. `/brand` route — living design guide: all tokens as swatches, typography scale (h1–h6, body, label, mono), button variants (primary/secondary/ghost/destructive), badge/status styles, icon set, spacing scale
2. Replace `#6366f1` (current accent fallback in index.css) and all `#3b82f6` hardcodes with `#3ab9e3`; replace `#192a46` as `--color-text-primary`
3. AppShell desktop layout: remove `max-w-4xl mx-auto` from content wrapper; add `px-8 py-6` padding only; sidebar gets expandable/collapsible toggle (icon-only at 64px collapsed, 240px expanded); state in localStorage
4. Sidebar refinements: `#192a46` text for nav labels, `#3ab9e3` accent indicator for active item (left border or dot, not full bg), `--color-border` right divider
5. Sharp edges: `rounded` (4px) for cards, inputs, buttons — replace all `rounded-xl`/`rounded-2xl` in shared components; `rounded-md` (6px) for dropdowns/modals
6. Typography: `--color-text-primary` for all headings, `--color-text-secondary` for labels
7. All status badges use token colors (warning/error/success/accent)
8. `npm run build` must pass

**Plans:** TBD

##### Phase 19: Supabase Local Config
**Goal:** Reproducible local dev environment.
**Scope:**
- `supabase/config.toml`
- `.env.example` with all required keys
- `database.types.ts` auto-generated types
- `supabase/seed/` with dev data
**Plans:** TBD

##### Phase 20: Edge Functions
**Goal:** Move heavy operations off-client.
**Scope:**
- Real email invitations via Edge Function
- PDF generation off-client
**Plans:** TBD

##### Phase 21: App Quality & Export Enhancements [INSERTED]
**Goal:** QA pass on all major flows, functional Google Calendar integration, improved exports. Builds on Phase 20's Edge Functions for OAuth and off-client PDF/email.
**Scope:**
1. QA pass — verify all major flows end-to-end: auth, diary entries, photos, projects, sharing, master projects
2. Google Calendar integration — connect and make functional (OAuth flow via Edge Function, event sync)
3. Resend email integration — improve invitation emails (design, delivery, content); builds on Phase 20 Edge Function
4. CSV export — overhaul: proper Croatian headers, all relevant fields, better structure and formatting
5. PDF export — add include/exclude images toggle; when included, up to 10 images in two-column rows within the PDF; builds on Phase 20 off-client PDF
**Plans:** TBD

##### Phase 22: Activity Log
**Goal:** Audit trail for all project activity.
**Scope:**
- `activity_log` migration + RLS policies
- UI activity feed component
**Plans:** TBD

##### Phase 23: Full Super Admin Panel
**Goal:** Complete platform oversight for platform owner.
**Scope:**
- User management (list, suspend, delete)
- Analytics dashboard (orgs, entries, usage)
- Full access control management
**Plans:** TBD

---

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with [INSERTED])

### v1.0 MVP — Completed Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Contractor MVP (Electro) | 3 | ✅ Complete | 2026-03-28 |
| 2 | Multi-tenant + Sharing | 3 | ✅ Complete | 2026-03-28 |
| 3 | Vertical Expansion + Subdomains | 2 | ✅ Complete | 2026-03-28 |
| 4 | Master Project Workspace | 4 | ✅ Complete | 2026-03-28 |

### v1.1 — Frontend Architecture Refactor

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 5 | Types + Pure Utilities | 1/1 | ✅ Complete | 2026-03-29 |
| 6 | Shared UI Primitives | 1/1 | ✅ Complete | 2026-03-29 |
| 7 | Navigation + Layout Shell | 1/1 | ✅ Complete | 2026-03-29 |
| 8 | Extract Simple View Components | 3/3 | ✅ Complete | 2026-03-30 |
| 9 | Extract Complex View Components | 4/4 | ✅ Complete | 2026-03-30 |
| 10 | Router Scaffolding | 1/1 | ✅ Complete | 2026-03-30 |
| 11 | AuthProvider Extraction | 1/1 | ✅ Complete | 2026-03-30 |
| 12 | navigate() Migration | 1/1 | ✅ Complete | 2026-03-31 |
| 13 | Data Layer Decomposition | 1/1 | ✅ Complete | 2026-03-31 |
| 14 | OrganizationProvider + Thin Pages | 3/3 | ✅ Complete | 2026-03-31 |

---

## Phase Details — v1.0 MVP (Archived)

### Phase 1: Contractor MVP (Electro)

**Goal:** Full prototype parity in the main app with Supabase backend and unchanged mobile design.
**Plans:**
- [x] 01-01: Supabase foundation, schema, and core read paths
- [x] 01-02: Port core CRUD flows (projects, phases, entries, photos, users)
- [x] 01-03: Storage migration + advanced feature verification

### Phase 2: Multi-tenant + Sharing

**Goal:** Contractor-owned projects plus invited participation in master projects with documents, tasks, and audit log.
**Plans:**
- [x] 02-01: Membership model + invitations
- [x] 02-02: Task checklist (Zadaci tab)
- [x] 02-03: Project documents (Dokumenti tab)

### Phase 3: Vertical Expansion + Subdomains

**Goal:** Add water/klima variants and subdomain UX on shared backend.
**Plans:**
- [x] 03-01: Vertical config and templates
- [x] 03-02: Subdomain routing and UX polish

### Phase 4: Master Project Workspace

**Goal:** Central portal with aggregated status, issues, timeline, and audit trail.
**Plans:**
- [x] 04-01: Master workspace data model + views
- [x] 04-02: Aggregated stats per discipline card + cross-discipline activity feed
- [x] 04-03: "Dodaj organizaciju" search-and-link modal
- [x] 04-04: Issue tracking (master_project_issues table + data layer + UI)

---

## Phase Details — v1.1 Frontend Architecture Refactor

### Governing Constraint

**NOTHING gets broken.** Extract-and-import pattern throughout. Create new file → import it → verify → remove inline. `npm run build` must pass after every phase.

### Phase 5: Types + Pure Utilities

**Goal:** Create single source of truth for types and utilities. Zero behavior change.
**Risk:** Low
**Source:** MIGRATION_PLAN.md Phase 1
**Scope:**
- `src/shared/types/index.ts` — all types from App.tsx + data.ts
- `src/shared/utils/format.ts` — safeFormatDate, stripMarkdown
- `src/shared/utils/image.ts` — trimCanvas, compressImage
- `src/shared/utils/error.ts` — OperationType, handleFirestoreError, setAuthContext
- `src/shared/constants/disciplines.ts` — re-export of disciplineConfig.ts
- Delete `firebase.ts` (confirmed unused) + remove firebase npm packages
**Plans:** TBD

### Phase 6: Shared UI Primitives

**Goal:** Standalone UI components every feature depends on. Must exist before feature extraction.
**Risk:** Low
**Source:** MIGRATION_PLAN.md Phase 2
**Scope:**
- `src/shared/ui/Button.tsx`
- `src/shared/ui/Card.tsx`
- `src/shared/ui/Input.tsx`
- `src/shared/ui/Select.tsx`
- `src/shared/ui/StatusBadge.tsx`
- `src/shared/ui/index.ts` — barrel export
**Plans:** TBD

### Phase 7: Navigation + Layout Shell

**Goal:** Extract app chrome. Components still receive view/setView as props — no context yet.
**Risk:** Low-Medium
**Source:** MIGRATION_PLAN.md Phase 3
**Scope:**
- `src/shared/components/ErrorBoundary.tsx`
- `src/app/layouts/AppShell.tsx`
- `src/shared/components/SecretsModal.tsx`
**Plans:** TBD

### Phase 8: Extract Simple View Components

**Goal:** Extract 12 prop-driven views from App.tsx into feature folders.
**Risk:** Medium
**Source:** MIGRATION_PLAN.md Phase 4a
**Scope:**
- LoginView, CompanySettingsView, InviteUserModal, UsersView, DashboardView
- ProjectsView, NewProjectView, ReportsView, CalendarView
- MasterProjectsListView, MasterProjectDetailView
- PDF generation fn → `src/integrations/pdf/generateDiaryPdf.ts`
**Plans:** TBD

### Phase 9: Extract Complex View Components

**Goal:** Extract 8 views with internal data fetching.
**Risk:** Medium
**Source:** MIGRATION_PLAN.md Phase 4b
**Scope:**
- DiaryEntryDetailModal, NewEntryView, PhotoGallery
- ProjectDetailView, ProjectMembersTab, ProjectTasksTab, ProjectDocumentsTab
**Depends on:** Phase 5 complete (shared utils imported)
**Plans:** TBD

### Phase 10: Router Scaffolding

**Goal:** Install react-router-dom, create route config and shells. NO behavior change yet.
**Risk:** Low-Medium
**Source:** MIGRATION_PLAN.md Phase 5 (safe part)
**Scope:**
- `npm install react-router-dom`
- `src/app/router/routeConfig.ts` — route path constants
- `src/app/router/AppRouter.tsx` — skeleton (not yet activated)
- `src/app/router/ProtectedRoute.tsx`, `GuestRoute.tsx` — shells
- `vite.config.ts` — add `server.historyApiFallback = true`
**Plans:** TBD

### Phase 11: AuthProvider Extraction

**Goal:** Extract auth state to context, wrap main.tsx. setView() still used for navigation.
**Risk:** Medium-High
**Source:** MIGRATION_PLAN.md Phase 5 (auth context part)
**Scope:**
- `src/app/providers/AuthProvider.tsx` — user, appUser, company, loading, showOnboarding
- `src/app/providers/index.ts`
- `src/main.tsx` — wrap with BrowserRouter + AuthProvider
- AppContent: replace auth useState with useAuth()
**Plans:** TBD

### Phase 12: navigate() Migration

**Goal:** Replace all setView() calls with navigate() throughout. Activate the router.
**Risk:** Medium
**Source:** MIGRATION_PLAN.md Phase 5 (navigation wiring)
**Scope:**
- Replace setView() with navigate() across all extracted components + App.tsx
- Wire AppRouter with all routes mapped to view components
- Verify browser back/forward, auth redirects, invitation flow
**Plans:** TBD

### Phase 13: Data Layer Decomposition

**Goal:** Break data.ts into domain query modules. data.ts becomes a barrel re-export.
**Risk:** Medium
**Source:** MIGRATION_PLAN.md Phase 6
**Scope:**
- `src/integrations/supabase/queries/` — organizations, profiles, projects, diary, photos, invitations, projectMembers, tasks, documents, masterProjects, members
- `src/integrations/supabase/index.ts` — barrel export
- `src/lib/data.ts` → becomes `export * from '../integrations/supabase'`
- Per-feature hooks: useProjects, useDiaryEntries, useDiaryPhotos, useCompanyUsers, useGoogleCalendar, useReminderChecker
**Plans:** TBD

### Phase 14: OrganizationProvider + Thin Pages

**Goal:** Complete context extraction. AppContent becomes ~100 lines.
**Risk:** Medium
**Source:** MIGRATION_PLAN.md Phase 7
**Scope:**
- `src/app/providers/OrganizationProvider.tsx`
- Thin page components for each route
- Full regression verification
**Plans:** TBD

---

## Planned (Future Milestones)

*(none — v1.2 is now active)*

---
*Roadmap created: 2026-03-27*
*Last updated: 2026-04-01 — Phase 21 inserted (App Quality & Export Enhancements, after Edge Functions); Activity Log → 22, Super Admin → 23*
