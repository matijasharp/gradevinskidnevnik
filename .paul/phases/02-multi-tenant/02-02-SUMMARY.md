---
phase: 02-multi-tenant
plan: 02
subsystem: database, ui
tags: [supabase, rls, project-tasks, checklist, zadaci]

requires:
  - phase: 02-multi-tenant/02-01
    provides: project_members table, org membership RLS, Suradnici tab, fetchSharedProjects

provides:
  - project_tasks table + RLS policies (org members + cross-org project_members)
  - Task CRUD functions: fetchProjectTasks, createProjectTask, toggleProjectTask, deleteProjectTask, updateProjectTaskTitle
  - ProjectTasksTab component — "Zadaci" tab on all projects
  - Role-based controls: admin can create/delete, all can toggle done, readonly members can view+toggle

affects: 02-03-documents-audit-log, 04-master-workspace

tech-stack:
  added: []
  patterns: [FK join via named fkey hint for PostgREST (profiles!project_tasks_assigned_to_fkey)]

key-files:
  created:
    - supabase/migrations/20260328_05_project_tasks.sql
    - supabase/policies/20260328_05_project_tasks_policies.sql
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "accentColor via inline style matches org brandColor for checkbox tinting"
  - "orgMembers passed as prop to TasksTab — no separate fetch needed"
  - "Toggle (done) allowed for readonly cross-org members; add/delete blocked"

patterns-established:
  - "FK join syntax: .select('*, profiles!{fkey_name}(name)') for named FK hints"
  - "Role gate pattern: !readonly && isAdmin for destructive/create actions"

duration: ~60min
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:00:00Z
---

# Phase 2 Plan 02: Task Checklist (Zadaci) Summary

**Lightweight task checklist added to every project — admins create/delete tasks, all members (including cross-org) can toggle done, with Supabase RLS enforcing role boundaries.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~60 min |
| Started | 2026-03-28 |
| Completed | 2026-03-28 |
| Tasks | 3 auto + 1 checkpoint |
| Files modified | 4 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Task list on every project | Pass | Zadaci tab shows list with checkbox, title, assigned member |
| AC-2: Admin can create and delete tasks | Pass | Add form + delete button visible only when !readonly && isAdmin |
| AC-3: Cross-org members can view and toggle | Pass | Checkbox available to all; form/delete hidden for readonly |

## Accomplishments

- `project_tasks` table created with RLS — org members full CRUD, cross-org project_members read + toggle only
- 5 exported functions in data.ts covering all task operations with FK join for assigned member name
- `ProjectTasksTab` component: task list, empty state, add form with member assign dropdown, delete button, brand-colored checkboxes

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260328_05_project_tasks.sql` | Created | project_tasks table schema + index |
| `supabase/policies/20260328_05_project_tasks_policies.sql` | Created | RLS: select/update for org+cross-org, insert/delete for org only |
| `app/src/lib/data.ts` | Modified | ProjectTask type, mapProjectTask, 5 CRUD functions |
| `app/src/App.tsx` | Modified | Zadaci tab button, ProjectTasksTab component |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Named FK hint for assigned_to join | PostgREST can't resolve ambiguous FK without hint; profiles table has multiple FKs | Pattern established for all future profile joins |
| orgMembers passed as prop | Already available in ProjectDetailView; avoids extra fetch | Simpler component, no extra Supabase query |
| Toggle allowed for readonly cross-org | Per AC-3 spec — field workers need to check tasks off even in shared projects | insert/delete still blocked by RLS |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- project_tasks table live in Supabase with RLS
- Data layer fully typed and exported
- Zadaci tab working end-to-end

**Concerns:**
- None

**Blockers:**
- None — Plan 02-03 (documents + audit log) can proceed

---
*Phase: 02-multi-tenant, Plan: 02*
*Completed: 2026-03-28*
