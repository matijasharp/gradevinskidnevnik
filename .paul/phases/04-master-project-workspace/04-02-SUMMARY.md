---
phase: 04-master-project-workspace
plan: 02
subsystem: ui, data-layer
tags: [master-project, aggregation, react, typescript, supabase, diary-entries]

requires:
  - phase: 04-master-project-workspace/04-01
    provides: master_projects + master_project_organizations tables; MasterProject + MasterProjectOrganization interfaces; fetchMasterProjectOrganizations() with linkedProjectId; MasterProjectDetailView shell

provides:
  - MasterProjectStats interface — projectId, entryCount, totalHours, lastEntryDate
  - MasterActivityItem interface — entryId, projectId, entryDate, title, status, createdByName
  - fetchMasterProjectStats(projectIds) — aggregates diary entry counts + hours per linked project (JS-side grouping)
  - fetchMasterRecentActivity(projectIds, limit) — returns N most recent diary entries across linked projects
  - Discipline cards now show "N zapisa · Nh" stats line per linked project
  - "Nedavna aktivnost" activity feed section in MasterProjectDetailView (10 most recent, sorted by date)

affects:
  - 04-03 (can call fetchMasterProjectStats/fetchMasterRecentActivity for further aggregation; feed established as UI pattern)

tech-stack:
  added: []
  patterns:
    - JS-side aggregation over Supabase query result — avoids DB-side aggregation where RLS scoping makes it simpler to filter in the client
    - Chained .then() in onSelect to load orgs → compute ids → load stats + activity in parallel
    - IIFE inside JSX for per-card stats lookup without a helper function

key-files:
  created: []
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "JS-side aggregation for stats — one .select() + group in JS vs a Supabase RPC; simpler, no migration, RLS already handles row visibility"
  - "Stats + activity load in parallel in onSelect chain — ids computed once from org list, both fetches fire independently"

patterns-established:
  - "fetchMasterProjectStats early-returns [] for empty projectIds — prevents unnecessary Supabase query, pattern for all future aggregate helpers"
  - "Activity feed resolves discipline icon by matching item.projectId to orgs array — no extra join needed, data already in scope"

duration: ~20min
started: 2026-03-28T02:00:00Z
completed: 2026-03-28T02:20:00Z
---

# Phase 4 Plan 02: Aggregated Stats + Activity Feed — Summary

**Discipline cards now show entry count + hours per linked project, and a cross-discipline "Nedavna aktivnost" feed displays the 10 most recent diary entries across all master project participants.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 3/3 completed |
| Files created | 0 |
| Files modified | 2 |
| Qualify results | PASS × 3 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Discipline cards show aggregated stats | Pass | Each card shows "N zapisa · Nh" line sourced from fetchMasterProjectStats |
| AC-2: Activity feed shows recent cross-discipline entries | Pass | "Nedavna aktivnost" section renders below cards; shows date, title, discipline icon, status badge |
| AC-3: Graceful empty and inaccessible states | Pass | Cards show "0 zapisa · 0h" when no stats found; feed shows "Nema nedavnih aktivnosti." empty state; both functions return [] for empty input |

## Accomplishments

- Added `MasterProjectStats` + `MasterActivityItem` interfaces and `fetchMasterProjectStats()` + `fetchMasterRecentActivity()` to data.ts — all exported, all typed, both with empty-input guard
- Wired stats + activity loading into onSelect chain in App.tsx — ids computed from org list, both fetches fire in parallel; onBack resets all four state vars
- Discipline cards upgraded with live stats line; MasterProjectDetailView extended with full "Nedavna aktivnost" feed section with status color mapping and discipline icon lookup

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/lib/data.ts` | Modified | +2 exported interfaces; +2 exported async functions |
| `app/src/App.tsx` | Modified | +2 imports (functions); +2 type imports; +2 state vars; onSelect chain extended; onBack reset extended; stats/activity props added to MasterProjectDetailView; stats line in org cards; activity feed section |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| JS-side aggregation for entry stats | Supabase RPC not needed — one select + group in JS is simpler, no migration required, and RLS already gates row visibility | No migration; stats are approximate (RLS-filtered) which is correct behavior |
| Stats + activity fetched in parallel | Both depend only on project ids (same input), no ordering dependency between them | Faster load on detail open; independent failure paths |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** None. Plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- `fetchMasterProjectStats` and `fetchMasterRecentActivity` are available for 04-03 to extend or reuse
- Activity feed UI pattern established — 04-03 can add issue feed in the same visual style
- `linkOrganizationToMasterProject` is still imported in App.tsx (from 04-01) but not yet wired to UI — 04-03 wires it via "Dodaj organizaciju" modal

**Concerns:**
- Stats are RLS-filtered: a master project lead will only see diary entries from their own org's linked project unless they are also a `project_member` on other orgs' projects. Cross-org stats aggregation requires either broader RLS or a dedicated aggregation view — deferred per plan scope decision.

**Blockers:**
- None

---
*Phase: 04-master-project-workspace, Plan: 02*
*Completed: 2026-03-28*
