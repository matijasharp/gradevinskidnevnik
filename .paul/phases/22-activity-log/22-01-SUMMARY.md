---
phase: 22-activity-log
plan: 01
subsystem: database, ui
tags: [activity-log, audit-trail, supabase, rls, react, date-fns]

requires:
  - phase: 13-data-layer-decomposition
    provides: query module pattern (_utils, barrel export via index.ts)
  - phase: 09-extract-complex-views
    provides: ProjectDetailView and NewEntryView as extraction targets

provides:
  - activity_log table with RLS (org-scoped read + insert)
  - logActivity fire-and-forget write function
  - fetchProjectActivity query function
  - ActivityFeed component (actor initials, action label, relative time in Croatian)
  - "Aktivnost" 5th tab in ProjectDetailView
  - diary_entry_created write point in NewEntryView

affects: [Phase 23 Full Super Admin Panel — may want org-wide activity view]

tech-stack:
  added: []
  patterns:
    - "Fire-and-forget activity logging: logActivity is not awaited — errors swallowed silently to never block the main flow"
    - "Append-only activity_log: no UPDATE/DELETE policies — immutable audit trail"

key-files:
  created:
    - supabase/migrations/20260401_13_activity_log.sql
    - app/src/integrations/supabase/queries/activityLog.ts
    - app/src/features/projects/components/ActivityFeed.tsx
  modified:
    - app/src/shared/types/index.ts
    - app/src/integrations/supabase/index.ts
    - app/src/features/projects/components/ProjectDetailView.tsx
    - app/src/features/diary/components/NewEntryView.tsx

key-decisions:
  - "Fire-and-forget logActivity: not awaited in NewEntryView — activity log errors must never surface to user or block entry save"
  - "Append-only RLS: SELECT + INSERT policies only — no UPDATE/DELETE; activity_log is an immutable audit trail"
  - "ActivityFeed one-time fetch on tab mount: no real-time subscription — sufficient for MVP"
  - "Scope: only diary_entry_created in this plan — other write points (task toggle, doc upload) deferred"

patterns-established:
  - "Activity log write points go in the calling component (not in the query module) — follows same pattern as existing data layer"

duration: ~30min
started: 2026-04-01T00:00:00Z
completed: 2026-04-03T00:00:00Z
---

# Phase 22 Plan 01: Activity Log Summary

**Activity log shipped: `activity_log` table with RLS, `logActivity` + `fetchProjectActivity` query module, `ActivityFeed` component, and "Aktivnost" tab in ProjectDetailView; diary entry creation fires a non-blocking write point.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Started | 2026-04-01 |
| Completed | 2026-04-03 |
| Tasks | 3 completed |
| Files modified | 7 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Diary entry creation logs an activity event | Pass | logActivity called (not awaited) in NewEntryView create branch only |
| AC-2: ActivityFeed renders logged events in ProjectDetailView | Pass | "Aktivnost" 5th tab mounts ActivityFeed; reverse-chrono, actor initials, Croatian relative time |
| AC-3: RLS — only org members can read and write activity_log | Pass | SELECT and INSERT policies on organization_id ∈ user's orgs; no UPDATE/DELETE |

## Accomplishments

- `activity_log` migration with proper schema, indexes, and RLS — append-only design with no UPDATE/DELETE policies
- `logActivity` is fire-and-forget (not awaited, errors swallowed) — activity logging never blocks or surfaces errors to user
- `ActivityFeed` renders actor avatar (initial), action label in Croatian, entity name, and relative time using `date-fns/locale/hr`
- `npm run build` passes with no TypeScript errors

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260401_13_activity_log.sql` | Created | Table schema + indexes + 2 RLS policies |
| `app/src/shared/types/index.ts` | Modified | `ActivityLogItem` interface added |
| `app/src/integrations/supabase/queries/activityLog.ts` | Created | `logActivity` + `fetchProjectActivity` |
| `app/src/integrations/supabase/index.ts` | Modified | Barrel export for activityLog |
| `app/src/features/projects/components/ActivityFeed.tsx` | Created | Feed component with loading/empty states |
| `app/src/features/projects/components/ProjectDetailView.tsx` | Modified | 5th "Aktivnost" tab + ActivityFeed mount |
| `app/src/features/diary/components/NewEntryView.tsx` | Modified | `logActivity` fire-and-forget in create branch |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| logActivity not awaited | Activity log errors must not block diary entry save — user flow takes priority | Any network/RLS failure is silently swallowed |
| Append-only RLS (no UPDATE/DELETE) | Activity log is an immutable audit trail — rows must not be editable | Future phases cannot accidentally corrupt the audit trail |
| One-time fetch on tab mount (no realtime) | Sufficient for MVP; realtime subscription adds complexity without clear user value at this stage | Can be upgraded to realtime subscription in a future phase |
| Scope: diary_entry_created only | Keeps plan focused; other write points (tasks, docs, members) can be Phase 22 plan 02 or later | Future write points are additive — no refactoring needed |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Activity log infrastructure in place — adding new write points requires only calling `logActivity(...)` at the right place
- `ActivityFeed` component is reusable — can be mounted in DashboardView or master workspace if needed
- Migration follows existing naming convention (20260401_13_...)

**Concerns:**
- Migration not yet applied to production (requires `supabase db push` or manual apply)
- Only `diary_entry_created` is logged — the feed will be sparse until more write points are added

**Blockers:**
- None

---
*Phase: 22-activity-log, Plan: 01*
*Completed: 2026-04-03*
