# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-31)

**Core value:** Contractors log site progress fast while project leads see shared, audited status across all disciplines.
**Current focus:** v1.2 — Electro MVP Launch (Phase 18.2 complete; Phase 19 Supabase Local Config next).

## Current Position

Milestone: v1.2 — Electro MVP Launch
Phase: 19 of 22 (Supabase Local Config) — Not started
Plan: Not started
Status: Ready for next PLAN
Last activity: 2026-04-01 — Phase 18.2 complete; transitioned to Phase 19

Progress:
- v1.2 Milestone: [████████░░] 75%
- Phase 19: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — ready for next PLAN]
```

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 14
- Average duration: ~46 min
- Total execution time: ~10.8 hours

**Velocity (v1.1 so far):**
- Plans completed: 9
- Duration: ~175 min total

**By Phase (v1.0):**

| Phase | Plans | Total Time | Avg/Plan |
|-------|-------|------------|----------|
| 01-contractor-mvp | 3/3 ✅ | ~210 min | 70 min |
| 02-multi-tenant | 3/3 ✅ | ~180 min | 60 min |
| 03-vertical-expansion-subdomains | 2/2 ✅ | ~55 min | 28 min |
| 04-master-project-workspace | 4/4 ✅ | ~195 min | 49 min |

**By Phase (v1.1):**

| Phase | Plans | Total Time | Avg/Plan |
|-------|-------|------------|----------|
| 05-types-utilities | 1/1 ✅ | ~35 min | 35 min |
| 06-shared-ui-primitives | 1/1 ✅ | ~10 min | 10 min |
| 09-extract-complex-views | 4/4 ✅ | ~75 min | ~19 min |
| 10-router-scaffolding | 1/1 ✅ | ~10 min | ~10 min |

## Accumulated Context

### Decisions

| Decision | Phase | Impact |
|----------|-------|--------|
| Supabase-first backend | Phase 1 | Enables RLS and avoids migration later |
| Keep all prototype features | Phase 1 | Phase scope includes advanced features |
| Serverless OAuth | Phase 1 | Integrations handled outside frontend |
| base64 fallback for Storage uploads | Phase 1 | No entry loss on Storage errors; older entries display fine |
| No logo/signature migration to Storage | Phase 1 | MVP scope limit; base64 acceptable for small assets |
| Dual FK on project_members.user_id | Phase 2 | auth.users (original) + public.profiles (PostgREST join) — pattern for future profile joins |
| Dijeljeni projekti always visible | Phase 2 | Empty state shown; section always rendered for discoverability |
| FK join hint for assigned_to | Phase 2 | profiles!project_tasks_assigned_to_fkey(name) — pattern for all future profile joins via named FK |
| Toggle allowed for cross-org members | Phase 2 | Readonly members can check tasks; add/delete blocked by RLS |
| Storage bucket public for documents | Phase 2 | Public URL access; table RLS gates metadata visibility |
| Audit log deferred to Phase 4 | Phase 2 | MVP value complete without it; fits master workspace better |
| discipline NOT NULL DEFAULT 'electro' | Phase 3 | Existing orgs auto-classified; no data migration needed |
| Phase type widened to string | Phase 3 | Discipline determines valid phases at runtime via disciplineConfig.ts |
| detectDisciplineFromSubdomain: hostname then ?discipline= param | Phase 3 | Prod subdomain routing + dev testing without DNS setup |
| discipline typed inline in createOrganizationWithOwner | Phase 3 | Avoids circular import between data.ts and disciplineConfig.ts |
| Separate master_projects table (not reusing projects) | Phase 4 | Clean separation — master projects have no diary entries or org-level phases |
| RLS on master_project_organizations: owner OR direct org_id | Phase 4 | Avoids self-referencing recursive subquery that would infinite-loop in Postgres |
| createMasterProject auto-links owner org as lead | Phase 4 | Every master project starts with at least one participant; no manual step needed |
| 'general' discipline for PM/coordinator orgs | Phase 4 | Master project owners are not specialty trades; prevents misclassification |
| master_project_issues INSERT allows all participants | Phase 4 | Any linked org can report issues; cross-discipline collaboration |
| Issue status cycle on badge click | Phase 4 | Mobile-friendly; no dropdown needed for MVP |
| Extract-and-import pattern for refactor | v1.1 | Create new file → import → verify → remove inline. Never delete before proven working |
| npm run build must pass after every phase | v1.1 | Governing constraint — nothing gets broken |
| data.ts re-exports from shared/types | Phase 5 | Preserves App.tsx line 106 import compat without churn across all phases |
| AppRouter not mounted until Phase 12 | Phase 10 | Router scaffold + AuthProvider (Phase 11) must both exist before activation |
| setAppUser/setCompany/setShowOnboarding exposed as context setters | Phase 11 | handleOnboarding can mutate auth-adjacent state; Phase 12 calls these via useAuth() |
| BrowserRouter in main.tsx (temporary) | Phase 11 | Resolved in Phase 12 — RouterProvider/createBrowserRouter activates AppRouter |
| ROUTES const as single source of truth | Phase 10 | All navigate() calls import from routeConfig.ts |
| AppRouter catchall path='*' → App | Phase 12 | Thin page components deferred to Phase 14; Phase 12 activates routing only |
| ProtectedRoute redirects to ROUTES.DASHBOARD | Phase 12 | No /login route until Phase 14; AppContent shows LoginView at '/' when !user |
| selectedProject state stays in AppContent | Phase 12 | URL param → state sync deferred to Phase 13; direct /projects/:id navigation renders null until then |
| _utils.ts shared helper for query modules | Phase 13 | ensureSupabase + subscribeWithFetch shared across all 10 domain files; plan allowed both copy-in or shared |
| invitations.ts imports from organizations.ts | Phase 13 | acceptInvitation cross-module dep; establishes intra-queries/ import pattern |
| OrganizationProvider mounted in AppRouter route element, not main.tsx | Phase 14 | useNavigate() requires Router context; RouterProvider lives inside AppRouter; any provider needing useNavigate() must be inside the route element |
| refreshMasterProjects() on OrgContextValue | Phase 14 | masterProjects is one-time fetch; JSX inline handler needed to trigger re-fetch after creation; setMasterProjects is private to provider |
| DEFAULT 'approved' on profiles.status migration | Phase 16 | Existing profiles remain unblocked; new signups explicitly set to pending in createOrganizationWithOwner |
| isSuperAdmin guard inside component, not ProtectedRoute | Phase 16 | Route is intentionally hidden — no nav link; non-admins redirect silently from inside useEffect |
| Landing CTAs → ROUTES.REPORTS (not '/' or '/login') | Phase 18.1 | No dedicated /login route; `*` catchall → App → LoginView is the auth entry |
| SplashScreen only in LoginView loading gate, not per-page | Phase 18.1 | Scope limit: initial auth load only; per-page transitions deferred |
| #3b82f6 fallback left in 10+ other components | Phase 18.1 | Out of scope; AppShell + CompanySettings were sufficient for visible surfaces |
| Added Phase 18.2: UI Consistency & Design System | Phase 18.1 | Extends v1.2 scope — brand palette, expandable sidebar, /brand route, full-width layout |
| Sidebar active = left border accent (not full bg) | Phase 18.2 | border-l-2 border-accent + bg-accent-subtle; enterprise convention, matches ROADMAP direction |
| Sidebar expand state in localStorage (gdo-sidebar-expanded) | Phase 18.2 | User preference persists across sessions; default true |
| /brand route: no AppShell nav link | Phase 18.2 | Dev/design tool — accessible at /brand to authenticated users, not a user-facing nav item |

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Audit log (activity feed) | Phase 2 | Medium | v1.2 Backend Infrastructure |
| DNS/subdomain production setup | Phase 3 | Low | Deployment (post-MVP) |
| Issue edit/delete/comments | Phase 4 | Low | Post v1.1 |
| Sub-projects (parent_project_id) | Architecture audit | Medium | Post v1.1 |
| Contractor→master project linking UI | Architecture audit | Low | Post v1.1 |
| Investor/client access portal | Architecture audit | High | Future milestone |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| None | - | - |

### Git State

Last commit: ddb4e3e — feat(18.1-brand-identity): apply Jost font, GDO branding, custom SVG icons, landing page routing
Last commit: 5935436 — feat(18.1-brand-identity): Phase 18.1 complete — brand identity pass
Branch: main
Remote: https://github.com/matijasharp/gradevinskidnevnik.git
Feature branches merged: none

## Boundaries (Active)

- Preserve prototype UI and mobile design (no redesign)
- Preserve all existing behavior — no feature changes during refactor
- Firebase files can now be removed (Supabase parity confirmed in Phase 1) ✓ Done
- All existing migrations are untouchable (already applied to production)

## Session Continuity

Last session: 2026-04-01
Stopped at: Phase 18.2 complete — all 4 plans unified
Next action: Run /paul:plan for Phase 19 (Supabase Local Config)
Resume file: .paul/ROADMAP.md

---
*STATE.md — Updated after every significant action*
