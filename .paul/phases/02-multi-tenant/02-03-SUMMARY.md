---
phase: 02-multi-tenant
plan: 03
subsystem: database, storage, ui
tags: [supabase, rls, storage, project-documents, dokumenti, file-upload]

requires:
  - phase: 02-multi-tenant/02-01
    provides: project_members table, org membership RLS, get_my_org_project_ids()
  - phase: 02-multi-tenant/02-02
    provides: Zadaci tab pattern, ProjectTask component style reference

provides:
  - project_documents table + RLS (org members full CRD, cross-org project_members read)
  - project-documents Supabase Storage bucket (public)
  - fetchProjectDocuments, uploadProjectDocument, deleteProjectDocument in data.ts
  - ProjectDocumentsTab component — "Dokumenti" tab with search, upload, list, download, delete

affects: 04-master-workspace

tech-stack:
  added: []
  patterns:
    - Storage upload pattern (mirrors uploadDiaryPhoto — bucket/path/getPublicUrl)
    - File input via hidden <input ref> triggered by Button

key-files:
  created:
    - supabase/migrations/20260328_06_project_documents.sql
    - supabase/policies/20260328_06_project_documents_policies.sql
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "Storage bucket is public — documents accessed via public URL, RLS on table controls metadata"
  - "Search bar shown only when docs exist — no empty clutter"
  - "Upload via hidden file input + Button (no drag-drop for MVP)"

patterns-established:
  - "Storage delete: fire-and-forget (.catch(() => null)) after table delete — same as diary photos"
  - "fileTypeLabel: derives short label from MIME type (e.g. application/pdf → PDF)"

duration: ~60min
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:00:00Z
---

# Phase 2 Plan 03: Project Documents (Dokumenti) Summary

**File upload tab added to every project — org members can upload, download, search, and delete project documents stored in Supabase Storage; cross-org members can view and download only.**

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
| AC-1: Document list on every project | Pass | Dokumenti tab shows list with name, type chip, download link; empty state correct |
| AC-2: Org member can upload and delete | Pass | Upload via file picker, delete removes from table + Storage |
| AC-3: Cross-org members view/download only | Pass | readonly=true hides upload button and delete buttons |

## Accomplishments

- `project_documents` table + RLS and `project-documents` public Storage bucket live in Supabase
- 3 exported functions in data.ts using established Storage pattern (path, upload, getPublicUrl)
- `ProjectDocumentsTab`: search bar (filtered, appears only when docs exist), file list with download + delete, upload button with loading state, brand-colored

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260328_06_project_documents.sql` | Created | project_documents table + Storage bucket |
| `supabase/policies/20260328_06_project_documents_policies.sql` | Created | RLS + Storage object policies |
| `app/src/lib/data.ts` | Modified | ProjectDocument type, mapper, 3 CRUD functions |
| `app/src/App.tsx` | Modified | Dokumenti tab button, rendering block, ProjectDocumentsTab component |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Storage bucket public | Documents accessed via public URL; table RLS gates metadata visibility | Simpler URL handling, no signed URLs needed |
| Search bar conditional | Only shown when docs > 0 | Cleaner empty state UX |
| No drag-drop upload | MVP scope — file picker sufficient for field use | Can add later without schema changes |

## Deviations from Plan

### Scope additions

**Search bar added during APPLY**
- **Requested:** User asked mid-execution before checkpoint approval
- **Fix:** Added `search` state + `filteredDocs` derived value + Search input (conditional)
- **Files:** App.tsx only
- **Impact:** Enhancement within scope — no schema or function changes

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Phase 2 fully complete: invitations, tasks, documents all live
- Supabase schema stable — all Phase 2 tables applied
- data.ts pattern established for all entity types

**Concerns:**
- None

**Blockers:**
- None — Phase 3 (Vertical Expansion + Subdomains) can proceed

---
*Phase: 02-multi-tenant, Plan: 03*
*Completed: 2026-03-28*
