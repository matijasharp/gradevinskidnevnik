# Gradevinski Dnevnik

## What This Is

Gradevinski Dnevnik is a multi-tenant site diary platform for construction contractors and project leads. It starts with electricians and delivers daily work logging (entries, phases, photos, reports) while enabling cross-discipline visibility, shared documents, and audit trails across master projects.

## Core Value

Contractors log site progress fast while project leads see shared, audited status across all disciplines.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 1.2 (in progress) |
| Status | v1.2 Electro MVP Launch — Phase 21 complete (calendar nav + mobile fixes); Phase 22 Activity Log next |
| Last Updated | 2026-04-01 |

**Production URLs:**
- None

## Requirements

### Core Features

- Contractor workspace (company profile, clients, projects)
- Daily diary entries with phases, photos, reports, and exports
- Team management with role-based access
- Invited participation in master projects with shared documents and tasks
- Master workspace for cross-discipline oversight (later phases)

### Validated (Shipped)

- ✓ Phase 1: Prototype parity in main app with Supabase backend — Phase 1
- ✓ Phase 2: Multi-tenant sharing — invitations, project membership, task checklist, file documents — Phase 2
- ✓ Phase 3: Vertical subdomains and discipline-specific templates — Phase 3
- ✓ Phase 4: Master project workspace — cross-discipline overview, org linking, issue tracking — Phase 4
- ✓ Phase 5: Shared type/utility foundation — types/index.ts, shared/utils, Firebase removed — Phase 5
- ✓ Phase 6: Shared UI primitives — Button, Card, Input, Select, StatusBadge extracted to shared/ui/ — Phase 6
- ✓ Phase 7: Navigation + layout shell — ErrorBoundary, SecretsModal, AppShell extracted; AppContent return restructured to use AppShell — Phase 7
- ✓ Phase 8: Extract simple view components — all 12 prop-driven views extracted into feature folders; App.tsx reduced 4207 → 3119 lines (−1088) — Phase 8
- ✓ Phase 9: Extract complex view components — 7 data-fetching views extracted into feature folders — Phase 9
- ✓ Phase 10: Router scaffolding — react-router-dom installed, Vite SPA fallback configured, router skeleton created (not activated) — Phase 10
- ✓ Phase 11: AuthProvider extraction — auth state (user, appUser, company, loading, showOnboarding) moved to context; main.tsx wrapped with BrowserRouter + AuthProvider; AppContent migrated to useAuth() — Phase 11
- ✓ Phase 12: navigate() migration — view useState removed; Routes/Route replace view-conditionals; all setView() → navigate(); AppRouter activated as RouterProvider; BrowserRouter removed — Phase 12
- ✓ Phase 13: Data layer decomposition — data.ts (1427 lines) split into 10 domain query modules under integrations/supabase/queries/; data.ts → single-line barrel re-export; zero consumer changes — Phase 13
- ✓ Phase 14: OrganizationProvider + Thin Pages — OrganizationProvider extracted; 12 thin page components created; App.tsx reduced from ~696 to 140 lines; AppContent god-component eliminated — Phase 14
- ✓ Phase 15: App Polish + Role Enforcement — Master projekti nav/create gated by discipline; contractors see only invited projects; shared/icons/ barrel created — Phase 15
- ✓ Phase 16: Signup Approval Gate + Minimal Super Admin — profiles.status pending/approved; PendingApprovalView; hidden /admin/approvals super admin page — Phase 16
- ✓ Phase 17: Landing Page — 9-section Croatian marketing page at /landing; favicon.svg; OG/Twitter metadata; GuestRoute auth guard — Phase 17
- ✓ Phase 18: Deployment — Railway hosting, PORT env var, live at elektro.gradevinskidnevnik.online — Phase 18
- ✓ Phase 18.1: Brand Identity — Jost font, GDO SVG icons/logo, GSAP splash screen, landing CTA fix, #6366f1 default color, letter spacing — Phase 18.1
- ✓ Phase 18.2: UI Consistency & Design System — 15-token design system, sharp corners, status badge tokens, full-width layout, expandable sidebar, /brand living design guide — Phase 18.2
- ✓ Phase 19: Supabase Local Config — config.toml, auto-generated database.types.ts (14 tables), idempotent seed.sql for local dev — Phase 19
- ✓ Phase 20: Edge Functions — send-invitation Edge Function (Resend REST API); generate-pdf Edge Function built + deployed (v7, pdf-lib, Jost font, RFC 5987 header fix); client PDF reverted to jsPDF pending Phase 21 QA — Phase 20
- ✓ Phase 21: App Quality & Export Enhancements (Plan 01) — calendar day view cards navigate to /projects/:id; mobile arrow buttons fixed with raw button elements (32×32px tap targets); tab bar responsiveness fixed — Phase 21
- ✓ Phase 22: Activity Log — activity_log table + RLS, logActivity (fire-and-forget), ActivityFeed component, "Aktivnost" tab in ProjectDetailView, diary_entry_created write point — Phase 22

### Active (In Progress)

- v1.2 Electro MVP Launch — Phase 23: Full Super Admin Panel (next)

### Planned (Next)

- Post-MVP: DNS/subdomain production setup
- Post-MVP: Audit log (activity feed, deferred from Phase 2)
- Post-MVP: Issue edit/delete and comments

### Out of Scope

- Billing and subscriptions
- Native mobile apps (web-only for MVP)
- Audit log (deferred from Phase 2 → Phase 4 master workspace)

## Target Users

**Primary:** Electrician contractors and field teams
- Mobile-first, on-site usage
- Need quick entry creation and photo capture
- Manage both internal and invited projects

**Secondary:** Project leads, investors, and supervisors
- Need aggregated progress and audit visibility

## Context

**Business Context:**
Start with electricians, then expand to other disciplines. Single platform with subdomain entry points, not separate products.

**Technical Context:**
Prototype exists in `site-diary-mini`. Main app must match prototype UI/UX and include all features. Backend is Supabase-first with serverless OAuth integrations.

## Constraints

### Technical Constraints

- Preserve prototype mobile design and feature set in the main app
- Supabase Auth/Postgres/Storage with RLS for multi-tenant isolation
- Serverless OAuth for Google Calendar integration

### Business Constraints

- MVP must be usable for electricians without master workspace
- Subdomains are UX-only, backend is unified

### Compliance Constraints

- GDPR baseline (data export, deletion, retention policy)

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Supabase-first backend | Avoid Firebase migration and enforce RLS early | 2026-03-27 | Active |
| Keep all prototype features | Maintain parity with existing UX expectations | 2026-03-27 | Active |
| Serverless OAuth | Simplify deployment for integrations | 2026-03-27 | Active |
| Dual FK on project_members.user_id | auth.users (original) + public.profiles (PostgREST join) | 2026-03-28 | Active |
| Storage bucket public for documents | Documents accessed via public URL; table RLS gates metadata | 2026-03-28 | Active |
| Audit log deferred to Phase 4 | MVP value delivered without it; fits master workspace scope better | 2026-03-28 | Active |
| detectDisciplineFromSubdomain reads hostname then ?discipline= param | Enables prod subdomain routing and local dev testing without DNS setup | 2026-03-28 | Active |
| discipline typed inline in createOrganizationWithOwner | Avoids circular import between data.ts and disciplineConfig.ts | 2026-03-28 | Active |
| 'general' discipline for PM/general contractor orgs | Master project owners are coordinators, not specialty trades; separate discipline value prevents misclassification | 2026-03-28 | Active |
| master_project_issues INSERT allows all participants | Any linked org can report issues, not just the owner; enables cross-discipline collaboration | 2026-03-28 | Active |
| Issue status cycle on badge click | Minimal mobile-friendly UX; no dropdown needed for MVP | 2026-03-28 | Active |
| Extract-and-import pattern for v1.1 refactor | Create new file → import → npm run build → remove inline; never delete before proven working | 2026-03-29 | Active |
| data.ts re-exports from shared/types | Preserves App.tsx line 106 import compat across all phases without churn | 2026-03-29 | Active |
| AppRouter not mounted until Phase 12 | Router scaffold and auth context (Phase 11) must both exist before activation; prevents partial wiring | 2026-03-30 | Active |
| setAppUser/setCompany/setShowOnboarding exposed as context setters | handleOnboarding mutates auth-adjacent state after org creation; must be mutable from AppContent | 2026-03-30 | Active |
| BrowserRouter in main.tsx (temporary) | Phase 12's useNavigate() requires a router context; will be replaced by RouterProvider when AppRouter activates | 2026-03-30 | Resolved — Phase 12 |
| AppRouter catchall path='*' → App: thin pages deferred to Phase 14 | Phase 12 activates routing; thin page components (DashboardPage etc.) split in Phase 14 | 2026-03-31 | Resolved — Phase 14 |
| ProtectedRoute redirects to ROUTES.DASHBOARD, not /login | No separate /login route until Phase 14; AppContent shows LoginView at '/' when user is null | 2026-03-31 | Active |
| OrganizationProvider mounted in AppRouter route element, not main.tsx | useNavigate() requires Router context; any provider needing navigation must be inside RouterProvider | 2026-03-31 | Active |
| ReminderOverlay "Vidi detalje" navigates to /projects/:id without setSelectedEntry | selectedEntry is internal to ProjectDetailPage; cross-boundary prop drilling not warranted for overlay UX | 2026-03-31 | Active |
| Landing CTAs → ROUTES.REPORTS (catchall → App → LoginView) | No dedicated /login route; `*` catchall is the auth entry point | 2026-03-31 | Active |
| SplashScreen only in LoginView loading gate | Per-page splash out of scope; initial auth load only | 2026-03-31 | Active |
| Sidebar active = left border accent, not full bg | Enterprise sidebar convention; matches ROADMAP direction — no white-on-color text for nav items | 2026-04-01 | Active |
| Sidebar expand state in localStorage (gdo-sidebar-expanded) | User preference persists across sessions; default true (expanded) | 2026-04-01 | Active |
| /brand route is dev-only, no AppShell nav link | Living design guide for internal use; not a user-facing feature | 2026-04-01 | Active |
| Supabase client stays untyped (no createClient<Database>) | Typed wiring is Phase 20+ scope; database.types.ts is reference only in Phase 19 | 2026-04-01 | Active |
| seed.sql: profiles.org_id set via UPDATE after org insert | FK ordering constraint — orgs must exist before profiles can reference them in seed | 2026-04-01 | Active |
| Resend via fetch REST API in Edge Functions (no SDK) | Resend SDK has no Deno build; direct fetch to api.resend.com works in all runtimes | 2026-04-01 | Active |
| RFC 5987 Content-Disposition in Edge Functions | Deno rejects non-ASCII ByteString header values; filename*=UTF-8''<encoded> is required for Croatian filenames | 2026-04-01 | Active |
| generate-pdf client reverted to jsPDF (Phase 20) | Edge Function deployed (v7) but PDF output not user-verified before revert; wiring deferred to Phase 21 | 2026-04-01 | Active |
| logActivity is fire-and-forget (not awaited) | Activity log errors must never surface to user or block the diary entry save flow | 2026-04-03 | Active |
| activity_log is append-only (no UPDATE/DELETE RLS) | Immutable audit trail — rows cannot be edited or deleted | 2026-04-03 | Active |
| ActivityFeed one-time fetch on tab mount (no realtime) | Sufficient for MVP; realtime can be added in a future phase | 2026-04-03 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Prototype parity (features + mobile UI) | 100% in Phase 1 | 100% | ✅ Done |
| Diary entry creation time | < 2 minutes | Unknown | Unknown |
| Report export reliability | 100% success | Unknown | Unknown |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React + Vite + TypeScript | Prototype stack |
| Auth | Supabase Auth | RLS-driven access control |
| Database | Supabase Postgres | Schema aligned with context-seed |
| Storage | Supabase Storage | Photos and documents |
| Server | Node/Express (serverless) | OAuth + integrations |
| Exports | jsPDF | Reports and PDFs |
| AI | Gemini | Summaries and reports |

## Links

| Resource | URL |
|----------|-----|
| Repository | Local workspace | 
| Documentation | `docs/context-seed/` |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-04-03 after Phase 22 — activity log shipped; Phase 23 Full Super Admin Panel next*
