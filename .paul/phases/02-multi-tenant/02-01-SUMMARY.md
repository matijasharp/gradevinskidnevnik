---
phase: 02-multi-tenant
plan: 01
subsystem: database, ui, auth
tags: [supabase, rls, project-members, invitations, multi-tenant]

requires:
  - phase: 01-contractor-mvp
    provides: Supabase schema, RLS foundation, org invitation flow, project/entry CRUD

provides:
  - project_invitations table + RLS policies
  - project_members FK to profiles (PostgREST join support)
  - Full project membership CRUD functions in data.ts
  - Cross-org email invitation + auto-accept on login
  - Suradnici tab (project member management UI)
  - Dijeljeni projekti section (shared projects list, always visible)

affects: 02-02-documents-tasks-audit, 04-master-workspace

tech-stack:
  added: []
  patterns:
    - "Cross-org access via project_invitations → project_members auto-accept on login"
    - "project_members FK to both auth.users AND public.profiles (dual FK for PostgREST join)"

key-files:
  created:
    - supabase/migrations/20260328_04_project_invitations.sql
    - supabase/policies/20260328_04_project_invitations_policies.sql
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "Added dual FK on project_members.user_id: auth.users (original) + public.profiles (for PostgREST join)"
  - "Dijeljeni projekti section always rendered with empty state, not hidden when empty"

patterns-established:
  - "fetchSharedProjects filters by neq organization_id — ensures own-org projects never appear as shared"
  - "acceptProjectInvitation: upsert member then delete invitation atomically"

duration: ~60min
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:00:00Z
---

# Phase 2 Plan 01: Membership Model + Invitations Summary

**Project-level membership layer shipped: cross-org email invitations, auto-accept on login, Suradnici management tab, and Dijeljeni projekti section.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~60 min |
| Tasks | 3 auto + 1 checkpoint |
| Files modified | 2 |
| Migrations applied | 3 (table, policies, FK fix) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Project member management | Pass | Suradnici tab: add org member, change role, remove — all functional |
| AC-2: Cross-org project invitation | Pass | Email invite creates project_invitation; auto-accepted on login |
| AC-3: Shared Projects section | Pass | Dijeljeni projekti always visible; read-only mode via `readonly` prop |

## Accomplishments

- `project_invitations` table with RLS: org admins manage invites, invited user can see/cancel their own
- All 9 data.ts functions for project membership + invitations (fetch, add, remove, role change, invite, accept, cancel, shared projects)
- `ProjectMembersTab` component with org-member picker, email invite form, pending invitations list
- Auto-accept project invitation on every login (both org member and onboarding paths)
- `fetchSharedProjects` correctly excludes own-org projects via `neq organization_id`

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260328_04_project_invitations.sql` | Created | project_invitations table schema |
| `supabase/policies/20260328_04_project_invitations_policies.sql` | Created | RLS for project_invitations + project_members_self_insert policy |
| `app/src/lib/data.ts` | Modified | 9 new exports: types + CRUD + invitation flow functions |
| `app/src/App.tsx` | Modified | Suradnici tab, ProjectMembersTab component, Dijeljeni projekti section, auto-accept on login |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Dual FK on project_members.user_id | auth.users FK existed; profiles FK needed for PostgREST join syntax | Required new migration; pattern to follow for any future table joining profiles |
| Dijeljeni projekti always visible | Checkpoint spec said "may be empty — that's OK"; empty state more discoverable | Section with empty state message, no count badge when empty |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 2 | Essential fixes, no scope creep |

### Auto-fixed Issues

**1. Missing FK: project_members → profiles**
- **Found during:** Checkpoint verification (400 Bad Request on Suradnici tab load)
- **Issue:** PostgREST `profiles(name,email)` join failed — no FK from project_members to public.profiles
- **Fix:** Applied migration `project_members_fk_to_profiles` adding FK to public.profiles(id)
- **Verification:** Test query confirmed join returns name + email correctly

**2. Dijeljeni projekti hidden when empty**
- **Found during:** Checkpoint verification (section not visible)
- **Issue:** `{sharedProjects.length > 0 && ...}` guard prevented rendering when no shared projects
- **Fix:** Removed guard; section always renders with empty state "Nema dijeljenih projekata."
- **Verification:** User confirmed visible

## Next Phase Readiness

**Ready:**
- Foundation complete for Plan 02-02 (documents, tasks, audit log)
- project_members table ready to be extended with permissions for doc/task access
- Cross-org access pattern established and tested

**Concerns:**
- `acceptProjectInvitation` only accepts the first matching invitation per login — if a user has multiple project invitations, only one is accepted per login. Low impact for now but worth revisiting in 02-02 if multi-project invites are needed.

**Blockers:** None

---
*Phase: 02-multi-tenant, Plan: 01*
*Completed: 2026-03-28*
