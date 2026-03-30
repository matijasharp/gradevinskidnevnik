# Roadmap: Gradevinski Dnevnik

## Overview

Start from the electrician prototype, deliver a Supabase-backed MVP with full UI/feature parity, then expand into multi-tenant sharing, subdomain verticals, and a master project workspace. Then refactor the architecture for maintainability before adding new features.

## Current Milestone

**v1.1 — Frontend Architecture Refactor** (v1.1)
Status: 🚧 In Progress
Phases: 5 of 10 complete

## Previous Milestone

**v1.0 MVP** (v1.0)
Status: ✅ Complete
Phases: 4 of 4 complete

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
| 10 | Router Scaffolding | TBD | Not started | - |
| 11 | AuthProvider Extraction | TBD | Not started | - |
| 12 | navigate() Migration | TBD | Not started | - |
| 13 | Data Layer Decomposition | TBD | Not started | - |
| 14 | OrganizationProvider + Thin Pages | TBD | Not started | - |

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

### v1.2 — Backend Infrastructure *(after v1.1 fully stable)*
- supabase/config.toml, .env.example
- supabase/seed/ directory with dev data
- database.types.ts auto-generated types
- Edge functions: real email invitations, PDF off-client
- activity_log migration + policies

---
*Roadmap created: 2026-03-27*
*Last updated: 2026-03-30 — Phase 9 complete*
