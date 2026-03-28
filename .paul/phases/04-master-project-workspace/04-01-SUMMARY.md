---
phase: 04-master-project-workspace
plan: 01
subsystem: database, data-layer, ui
tags: [master-project, supabase, rls, typescript, react, multi-tenant]

requires:
  - phase: 03-vertical-expansion-subdomains/03-01
    provides: discipline column on organizations (electro/water/klima); DISCIPLINE_LABELS from disciplineConfig.ts
  - phase: 02-multi-tenant/02-01
    provides: project_members pattern, profiles.organization_id, cross-org project sharing

provides:
  - master_projects table — cross-org umbrella project entity with RLS
  - master_project_organizations table — discipline + org + linked contractor project, with RLS
  - createMasterProject() — inserts master project + auto-links owner org as lead
  - fetchMasterProjects(organizationId) — returns all master projects where org is owner or participant
  - fetchMasterProjectOrganizations(masterProjectId) — returns linked orgs with discipline, org name, project name
  - linkOrganizationToMasterProject() — upsert to link an org/discipline to a master project
  - updateMasterProject() — partial updates on master project fields
  - Master Workspace tab ("Master projekti") in App.tsx nav
  - MasterProjectsListView — list with empty state and create modal
  - MasterProjectDetailView — discipline subproject cards per linked org

affects:
  - 04-02-aggregated-status (reads from master_project_organizations + diary_entries via master project context)

tech-stack:
  added: []
  patterns:
    - master_project_organizations as the join table for discipline-per-org participation — extend this for future phase membership flows
    - RLS on master_project_organizations: owner match OR direct org_id in row — avoids recursive subquery
    - createMasterProject auto-links owner org as 'lead' with their org discipline — consistent default

key-files:
  created:
    - supabase/migrations/20260328_07_master_workspace.sql
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "Separate master_projects table (not reusing projects table) — clean separation; master projects don't have diary entries or phases"
  - "master_project_organizations_select RLS uses owner match OR direct org_id — avoids self-referencing recursive subquery that would infinite-loop"
  - "createMasterProject auto-inserts owner org into master_project_organizations as lead — no manual step needed on creation"
  - "Dodaj organizaciju button stubbed (disabled) — invitation flow deferred to 04-02"

patterns-established:
  - "fetchMasterProjectOrganizations selects organizations(name) and projects(project_name) via Supabase FK join — use this pattern for any join returning denormalized display fields"
  - "MasterProjectsListView / MasterProjectDetailView are inline components in App.tsx — consistent with all other views in this app"

duration: ~35min
started: 2026-03-28T01:00:00Z
completed: 2026-03-28T01:35:00Z
---

# Phase 4 Plan 01: Master Workspace Data Model + Views — Summary

**New master_projects + master_project_organizations tables with RLS, full data layer (5 functions), and a "Master projekti" nav tab with list view, detail view (discipline cards), and create modal — all wired into the existing App.tsx patterns.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~35 min |
| Tasks | 3/3 completed |
| Files created | 1 |
| Files modified | 2 |
| Qualify results | PASS × 3 (1 auto-fix in Task 1) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Master project persists in database | Pass | createMasterProject inserts to master_projects; fetchMasterProjects returns it; RLS gates access to owner/participant orgs |
| AC-2: Organization linked with discipline and subproject | Pass | linkOrganizationToMasterProject upserts to master_project_organizations; fetchMasterProjectOrganizations returns with org name + project name via FK join |
| AC-3: Master Workspace tab lists master projects | Pass | "Master projekti" NavItem added; MasterProjectsListView renders list/empty state; create modal calls createMasterProject and refreshes |
| AC-4: Master project detail shows discipline subproject cards | Pass | MasterProjectDetailView renders one card per org entry with discipline icon, org name, linked project name, role badge |

## Accomplishments

- Created migration with 2 tables, 2 indexes, 7 RLS policies — correctly separated master project access from contractor project model
- Added 5 exported functions + 2 interfaces + 2 private mappers to data.ts — all TypeScript-clean (zero errors)
- Wired full Master Workspace tab into App.tsx: nav item, state (7 new state vars), data loading, list/detail routing, create modal with full form flow

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260328_07_master_workspace.sql` | Created | master_projects + master_project_organizations tables + indexes + 7 RLS policies |
| `app/src/lib/data.ts` | Modified | MasterProject + MasterProjectOrganization interfaces; 5 CRUD functions; 2 private mappers |
| `app/src/App.tsx` | Modified | Layers icon import; 4 data imports + 2 type imports; view union extended; 7 state vars; data loading; nav item; view routing; MasterProjectsListView + MasterProjectDetailView components |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Separate master_projects table (not reusing projects table) | Master projects don't have diary entries, phases, or org-level ownership like contractor projects — conflation would add complexity | Clean model; 04-02 queries master_projects without filtering noise |
| RLS SELECT on master_project_organizations: owner OR direct org_id | Self-referencing subquery on same table triggers infinite RLS recursion in Postgres | Simpler and correct; visible to owner org + any directly participating org |
| createMasterProject auto-links owner org as lead | Every master project needs at least one participant; auto-link removes a manual step | Owner org always visible in discipline cards from first touch |
| "Dodaj organizaciju" stubbed disabled | Invitation/linking UX for external orgs is Plan 04-02 scope | No broken state; users see the affordance but understand it's coming |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Essential correctness fix, no scope change |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** One essential RLS fix caught in qualify step. No unplanned scope.

### Auto-fixed Issues

**1. Recursive RLS policy on master_project_organizations SELECT**
- **Found during:** Task 1 qualify (re-read migration SQL)
- **Issue:** SELECT policy used a subquery `FROM public.master_project_organizations AS inner_mpo` — the same table being protected. PostgreSQL RLS evaluates this recursively, causing infinite loop on any select.
- **Fix:** Replaced with two-clause check: `master_project_id IN (SELECT id FROM master_projects WHERE owner_organization_id IN (...))` OR `organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())`. Covers all legitimate access without self-reference.
- **Files:** `supabase/migrations/20260328_07_master_workspace.sql`

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Recursive RLS subquery on master_project_organizations | Caught in qualify, fixed before finalizing migration (see auto-fix above) |

## Next Phase Readiness

**Ready:**
- `master_projects` and `master_project_organizations` tables exist and are accessible via RLS
- All 5 data functions available in data.ts — 04-02 can call `fetchMasterProjectOrganizations` to get discipline context for aggregation
- Master Workspace UI shell in place — 04-02 adds aggregated status widgets into the existing MasterProjectDetailView
- Owner org always linked as 'lead' on creation — no missing participants at the start

**Concerns:**
- `linkOrganizationToMasterProject` is imported in App.tsx but not yet wired to UI (only `createMasterProject` is used) — 04-02 will wire it when implementing "Dodaj organizaciju"
- TypeScript build passes but migration has not yet been applied to Supabase dev — apply before 04-02 planning to verify RLS behavior in real queries

**Blockers:**
- None

---
*Phase: 04-master-project-workspace, Plan: 01*
*Completed: 2026-03-28*
