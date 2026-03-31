---
phase: 13-data-layer-decomposition
plan: 01
subsystem: api
tags: [supabase, typescript, data-layer, barrel, query-modules]

requires:
  - phase: 05-types-utilities
    provides: shared/types/index.ts — all domain types used by query modules
  - phase: 01-contractor-mvp
    provides: lib/supabase.ts — supabase client used by all query files

provides:
  - 10 domain query modules under src/integrations/supabase/queries/
  - src/integrations/supabase/index.ts barrel re-exporting all functions
  - data.ts converted to single-line thin re-export (backwards-compat shim)

affects: 14-organization-provider-thin-pages

tech-stack:
  added: []
  patterns:
    - Domain query modules — one file per concern (organizations, members, projects, diary, photos, invitations, projectMembers, tasks, documents, masterProjects)
    - Shared _utils.ts for ensureSupabase + subscribeWithFetch to avoid duplication across 10 files
    - Barrel index pattern — integrations/supabase/index.ts re-exports all domain functions + type re-exports

key-files:
  created:
    - app/src/integrations/supabase/queries/_utils.ts
    - app/src/integrations/supabase/queries/organizations.ts
    - app/src/integrations/supabase/queries/members.ts
    - app/src/integrations/supabase/queries/projects.ts
    - app/src/integrations/supabase/queries/diary.ts
    - app/src/integrations/supabase/queries/photos.ts
    - app/src/integrations/supabase/queries/invitations.ts
    - app/src/integrations/supabase/queries/projectMembers.ts
    - app/src/integrations/supabase/queries/tasks.ts
    - app/src/integrations/supabase/queries/documents.ts
    - app/src/integrations/supabase/queries/masterProjects.ts
    - app/src/integrations/supabase/index.ts
  modified:
    - app/src/lib/data.ts

key-decisions:
  - "_utils.ts shared helper instead of copying ensureSupabase into each file (plan allowed both; DRY preferred)"
  - "invitations.ts imports fetchOrganizationById from ./organizations to handle cross-module dependency in acceptInvitation"

patterns-established:
  - "query module imports: { supabase, isSupabaseConfigured, ensureSupabase, subscribeWithFetch } from './_utils'"
  - "internal mappers remain unexported — mappers are module-private implementation detail"
  - "barrel chain: consumers → data.ts → integrations/supabase/index.ts → queries/*.ts"

duration: ~20min
started: 2026-03-31T00:00:00Z
completed: 2026-03-31T00:20:00Z
---

# Phase 13 Plan 01: Data Layer Decomposition Summary

**data.ts (1427 lines, 11 domains) split into 10 domain query modules under integrations/supabase/queries/; data.ts reduced to a single re-export line; build passes zero errors.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Started | 2026-03-31 |
| Completed | 2026-03-31 |
| Tasks | 3 completed |
| Files created | 12 |
| Files modified | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Query Modules Exist | Pass | All 10 domain files in src/integrations/supabase/queries/ |
| AC-2: Barrel Exports Everything | Pass | index.ts re-exports all functions + 10 type re-exports |
| AC-3: data.ts Is a Thin Re-export | Pass | Single line: `export * from '../integrations/supabase'` |
| AC-4: Build Passes | Pass | npm run build exits 0, zero TypeScript errors |

## Accomplishments

- Decomposed 1427-line monolithic data.ts into 10 domain query modules — organizations, members, projects, diary, photos, invitations, projectMembers, tasks, documents, masterProjects
- Created shared `_utils.ts` exporting ensureSupabase + subscribeWithFetch, eliminating duplication across 10 files
- Barrel index at integrations/supabase/index.ts preserves all backwards-compatible re-exports — zero consumer file changes required
- data.ts converted to single-line thin re-export, fully transparent to all existing consumers

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/integrations/supabase/queries/_utils.ts` | Created | Shared ensureSupabase + subscribeWithFetch helpers |
| `app/src/integrations/supabase/queries/organizations.ts` | Created | fetchOrganizationById, searchOrganizations, createOrganizationWithOwner, updateOrganization |
| `app/src/integrations/supabase/queries/members.ts` | Created | subscribeCompanyUsers, fetchProfileByUserId, updateProfileRole, removeOrganizationMember, updateProfileTokens |
| `app/src/integrations/supabase/queries/projects.ts` | Created | subscribeProjects, createProject, updateProject, deleteProject, fetchSharedProjects |
| `app/src/integrations/supabase/queries/diary.ts` | Created | subscribeDiaryEntries, createDiaryEntry, deleteDiaryEntry, updateDiaryEntry, updateDiaryEntryReminder |
| `app/src/integrations/supabase/queries/photos.ts` | Created | fetchDiaryPhotos, createDiaryPhoto, updateDiaryPhoto, uploadDiaryPhoto, deleteDiaryPhoto, fetchProjectPhotos, subscribeDiaryPhotos |
| `app/src/integrations/supabase/queries/invitations.ts` | Created | fetchInvitationByEmail, createInvitation, acceptInvitation, cancelInvitation, subscribePendingInvitations |
| `app/src/integrations/supabase/queries/projectMembers.ts` | Created | fetchProjectMembers, addProjectMember, removeProjectMember, updateProjectMemberRole, fetchProjectInvitations, createProjectInvitation, cancelProjectInvitation, fetchProjectInvitationByEmail, acceptProjectInvitation |
| `app/src/integrations/supabase/queries/tasks.ts` | Created | fetchProjectTasks, createProjectTask, toggleProjectTask, deleteProjectTask, updateProjectTaskTitle |
| `app/src/integrations/supabase/queries/documents.ts` | Created | fetchProjectDocuments, uploadProjectDocument, deleteProjectDocument |
| `app/src/integrations/supabase/queries/masterProjects.ts` | Created | createMasterProject, fetchMasterProjects, fetchMasterProjectOrganizations, linkOrganizationToMasterProject, updateMasterProject, fetchMasterProjectStats, fetchMasterRecentActivity, fetchMasterProjectIssues, createMasterProjectIssue, updateMasterProjectIssueStatus |
| `app/src/integrations/supabase/index.ts` | Created | Barrel re-exporting all domain functions + 10 type re-exports |
| `app/src/lib/data.ts` | Modified | 1427 lines → `export * from '../integrations/supabase'` |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| _utils.ts shared helper | Plan allowed both copy-into-each or shared; DRY preferred since ensureSupabase + subscribeWithFetch are identical across all modules | No duplication; future changes to helpers in one place |
| invitations.ts imports fetchOrganizationById from ./organizations | acceptInvitation calls fetchOrganizationById — cross-module dep cleaner than duplicating | Establishes cross-module import pattern within queries/ |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 1 minor | _utils.ts — plan allowed this approach explicitly |
| Deferred | 0 | — |

**Total impact:** Zero scope creep. _utils.ts is explicitly within plan boundaries.

### Deferred Items

None.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| None | — |

## Next Phase Readiness

**Ready:**
- Query modules are cleanly separated by domain — Phase 14 can create per-feature hooks (useProjects, useDiaryEntries, etc.) directly from these modules
- All existing consumers unchanged — no regression risk at phase boundary
- Build verified green

**Concerns:**
- Phase 13 ROADMAP scope listed per-feature hooks (useProjects etc.) as in-scope — these were not in 13-01-PLAN.md and are deferred to Phase 14 or a Plan 13-02 if needed
- Large bundle warning (chunk >500KB) pre-exists from App.tsx; not introduced by this phase

**Blockers:** None

---
*Phase: 13-data-layer-decomposition, Plan: 01*
*Completed: 2026-03-31*
