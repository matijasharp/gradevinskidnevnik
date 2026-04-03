---
phase: 25-bug-fixes-ux-polish
plan: 01
subsystem: ui
tags: [rls, mobile, routing, animation, react-router]

requires:
  - phase: 22-activity-log
    provides: activity_log table + RLS (base migration unapplied; applied here)
  - phase: 13-data-layer
    provides: get_my_project_ids() DB function used by new RLS policy

provides:
  - Mobile camera direct-open (capture="environment")
  - Splash screen capped to ≤1.5s
  - Scroll reset on all route changes
  - Project pre-selection when navigating from project detail to new entry
  - activity_log table in production + cross-org member SELECT access

affects: 25-02-google-oauth (next plan in phase 25)

tech-stack:
  added: []
  patterns:
    - "Route state pattern: navigate(ROUTE, { state: { id } }) → useLocation().state.id"
    - "ScrollToTop via wrapper component inside createBrowserRouter element tree"

key-files:
  created:
    - supabase/migrations/20260403_16_activity_log_project_member_select.sql
  modified:
    - app/src/features/diary/components/NewEntryView.tsx
    - app/src/features/auth/components/SplashScreen.tsx
    - app/src/features/projects/components/ProjectDetailPage.tsx
    - app/src/features/diary/components/NewEntryPage.tsx
    - app/src/app/router/AppRouter.tsx

key-decisions:
  - "ScrollToTop as AppWithScroll wrapper component — useLocation() requires Router context inside createBrowserRouter element"
  - "activity_log base migration applied here — Phase 22 file existed but was never applied to production"

patterns-established:
  - "Route state for pre-selection: navigate(ROUTE, { state: { projectId } }) → useLocation().state"

duration: ~30min
started: 2026-04-03T00:00:00Z
completed: 2026-04-03T00:00:00Z
---

# Phase 25 Plan 01: Bug Fixes & UX Polish (Wave 1) Summary

**5 post-launch UX bugs fixed: mobile camera, splash duration, scroll reset, project pre-selection, and activity tab visibility for cross-org members — plus activity_log table backfilled to production.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Tasks | 3 completed |
| Files modified | 5 |
| Migrations applied | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Camera opens directly on mobile | Pass | `capture="environment"` added to Slikaj input |
| AC-2: Project pre-selected on new entry from project view | Pass | Route state pattern: `{ state: { projectId } }` |
| AC-3: Page scroll resets on navigation | Pass | `ScrollToTop` component in `AppWithScroll` |
| AC-4: Splash completes in ≤1.5s | Pass | delay reduced 0.5→0.1; total ~1.2s |
| AC-5: Activity tab shows for cross-org project members | Pass | New RLS policy via `get_my_project_ids()` |

## Accomplishments

- All 5 ACs satisfied with zero TypeScript errors in build
- `activity_log` table applied to production (Phase 22 backfill) with 3 RLS policies
- Route state pre-selection pattern established for future use

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/features/diary/components/NewEntryView.tsx` | Modified | Added `capture="environment"` to camera input |
| `app/src/features/auth/components/SplashScreen.tsx` | Modified | Reduced fade-out delay 0.5→0.1 |
| `app/src/features/projects/components/ProjectDetailPage.tsx` | Modified | Pass `{ state: { projectId } }` to new entry navigate |
| `app/src/features/diary/components/NewEntryPage.tsx` | Modified | Read `location.state.projectId`, pass `initialProject` |
| `app/src/app/router/AppRouter.tsx` | Modified | Added `ScrollToTop` + `AppWithScroll` wrapper |
| `supabase/migrations/20260403_16_activity_log_project_member_select.sql` | Created | Cross-org project member SELECT policy |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `ScrollToTop` inside `AppWithScroll` wrapper (not at router root) | `useLocation()` requires Router context; `createBrowserRouter` element is inside `RouterProvider` | Pattern for any future hook-based router components |
| Applied base `activity_log` migration here | Table was missing from production despite Phase 22 being marked complete | All future activity log features now have a DB foundation |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Scope additions | 1 | Essential prerequisite |
| Deferred | 0 | — |

**Total impact:** One essential prerequisite applied (activity_log base migration). No scope creep.

### Scope Additions

**activity_log base migration (Phase 22 backfill)**
- **Found during:** Task 3 (activity_log RLS)
- **Issue:** `activity_log` table didn't exist in production. The Phase 22 migration file existed locally but was never applied via MCP.
- **Fix:** Applied `activity_log` migration (table creation + initial 2 policies) before applying the new cross-org policy
- **Files:** `supabase/migrations/20260401_13_activity_log.sql` (existing local file, applied to DB)
- **Verification:** `pg_policies` query confirmed 3 policies active on `activity_log`

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `npm run build` segfault on first attempt | Transient Node.js crash; second attempt succeeded cleanly |
| `activity_log` table missing from production | Applied base migration before new policy |

## Next Phase Readiness

**Ready:**
- `activity_log` table + all 3 RLS policies live in production
- Route state pre-selection pattern available for reuse
- ScrollToTop active on all routes

**Concerns:**
- Google OAuth branding (Supabase URL on consent screen) still needs dashboard config — requires human action in Supabase console
- Google Calendar OAuth fix depends on same branding fix

**Blockers:**
- None for 25-02 code work; Google OAuth branding requires Supabase Dashboard access (human-action checkpoint expected in 25-02)

---
*Phase: 25-bug-fixes-ux-polish, Plan: 01*
*Completed: 2026-04-03*
