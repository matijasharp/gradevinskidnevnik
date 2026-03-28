---
phase: 04-master-project-workspace
plan: 04
subsystem: database, data-layer, ui
tags: [master-project, issues, rls, react, typescript, supabase]

requires:
  - phase: 04-master-project-workspace/04-01
    provides: master_projects table; master_project_organizations table; MasterProjectDetailView shell
  - phase: 04-master-project-workspace/04-03
    provides: MasterProjectDetailView with discipline cards + activity feed; pattern for flat section layout

provides:
  - master_project_issues table with RLS (select/insert for all participants; update for reporter or owner; delete for owner)
  - fetchMasterProjectIssues(masterProjectId) — ordered desc by created_at
  - createMasterProjectIssue(params) — inserts and returns mapped issue
  - updateMasterProjectIssueStatus(id, status) — optimistic update pattern
  - "Prijave" section in MasterProjectDetailView: list with status/priority badges, status cycle on click, inline create form

affects:
  - post-MVP (no planned follow-on phases; Phase 4 complete)

tech-stack:
  added: []
  patterns:
    - Status cycle via nextStatus map: { open → in_progress → resolved → closed → open } — click badge to advance
    - Optimistic UI update for status: setMasterProjectIssues(prev => prev.map(...)) before re-fetch
    - Issues cleared in onBack alongside orgs/stats/activity — full cleanup pattern

key-files:
  created:
    - supabase/migrations/20260328_09_master_issues.sql
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "discipline type expanded to include 'general' in Company interface (data.ts + App.tsx local) and createOrganizationWithOwner — required by earlier general discipline addition"
  - "RLS INSERT allows all participants (owner OR linked org) — any org in the master project can report issues, not just the owner"
  - "Status cycle on badge click (no dropdown) — minimal UI, consistent with mobile-first design"

patterns-established:
  - "nextStatus map for status cycling: flat map lookup, no switch/if chains"
  - "Issues fetched independently of orgs/stats (separate .then chain on onSelect) — not blocked by linked_project_id availability"

duration: ~25min
started: 2026-03-28T03:00:00Z
completed: 2026-03-28T03:25:00Z
---

# Phase 4 Plan 04: Issue Tracking — Summary

**Issue tracking is live in the master project workspace — participants can report issues with priority and discipline tags, advance status through a click cycle, and see a real-time list scoped to each master project.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~25 min |
| Tasks | 3/3 completed |
| Files created | 1 |
| Files modified | 2 |
| Qualify results | PASS × 3 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Issues list renders for a master project | Pass | "Prijave" section renders below activity feed; empty state shown when no issues |
| AC-2: New issue can be created | Pass | Inline form with title + priority + discipline; re-fetches list after insert; form resets on submit |
| AC-3: Issue status can be toggled | Pass | Click status badge cycles open→in_progress→resolved→closed→open via nextStatus map |

## Accomplishments

- `master_project_issues` table created with RLS: all participants can select + insert; reporter or owner can update; owner-only delete
- Three data functions added to data.ts: `fetchMasterProjectIssues`, `createMasterProjectIssue`, `updateMasterProjectIssueStatus`
- Full issues section in MasterProjectDetailView: issue list with priority + status badges, status cycle on badge click, toggle-able inline create form

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260328_09_master_issues.sql` | Created | master_project_issues table + 4 RLS policies |
| `app/src/lib/data.ts` | Modified | +MasterProjectIssue interface, +mapMasterProjectIssue, +3 exported functions; discipline type widened to include 'general' in Company + createOrganizationWithOwner |
| `app/src/App.tsx` | Modified | +imports, +masterProjectIssues state, +handleCreateIssue, +handleUpdateIssueStatus, updated onSelect/onBack, updated MasterProjectDetailView props + component body |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Status cycle on badge click | Minimal UI, no modal/dropdown needed for MVP; mobile-friendly one-tap interaction | Simple but functional; no multi-step edit flow |
| INSERT RLS allows all participants | Any org in the master project can report blockers, not just the owner | Enables cross-discipline issue reporting |
| Issues fetched independently of orgs | Issues don't depend on linked_project_id — separate fetch avoids blocking | Clean separation; issues load even if no projects are linked |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 2 | No scope change |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Two type propagation fixes; no functional scope change.

### Auto-fixed Issues

**1. Migration _07 not applied to DB**
- **Found during:** Task 1 (Supabase execute_sql failed on FK to master_projects)
- **Issue:** `master_projects` table didn't exist — migration _07 was a local file but never applied
- **Fix:** Applied _07 migration first, then _09
- **Files:** Supabase DB only

**2. `discipline` type needed 'general' in Company + createOrganizationWithOwner**
- **Found during:** Task 2 TypeScript check (tsc --noEmit)
- **Issue:** Earlier addition of 'general' to `Discipline` in disciplineConfig.ts propagated to `Company.discipline` and `createOrganizationWithOwner` params, which were typed as `'electro' | 'water' | 'klima'`; also a duplicate local `Company` interface in App.tsx had the same narrow type
- **Fix:** Widened `discipline` field in `Company` interface (data.ts), local `Company` interface (App.tsx line ~224), and `createOrganizationWithOwner` params to include `'general'`
- **Files:** `app/src/lib/data.ts`, `app/src/App.tsx`

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Migration _07 missing from DB | Applied manually via MCP before _09 |
| TypeScript errors from 'general' discipline type | Widened 3 inline type annotations to include 'general' |

## Next Phase Readiness

**Ready:**
- Phase 4 complete — all 4 plans executed (04-01 through 04-04)
- v1.0 MVP milestone fully delivered: contractor workspace, multi-tenant sharing, discipline verticals, master project workspace with issue tracking
- `master_project_issues` available for future enhancements (edit, delete, comments)

**Concerns:**
- Migration _07 was never applied to DB during prior phases — worth auditing whether _08 (general discipline) was also not applied
- `linked_project_id` is still not set when linking via "Dodaj organizaciju" modal (noted in 04-03 summary) — acceptable MVP behaviour

**Blockers:**
- None

---
*Phase: 04-master-project-workspace, Plan: 04*
*Completed: 2026-03-28*
