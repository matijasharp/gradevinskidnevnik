---
phase: 05-types-utilities
plan: 01
subsystem: shared
tags: [typescript, types, utils, firebase, refactor]

requires:
  - phase: 04-master-project-workspace
    provides: All type definitions inline in App.tsx and data.ts

provides:
  - app/src/shared/types/index.ts — canonical type definitions (18 types)
  - app/src/shared/utils/format.ts — safeFormatDate, stripMarkdown
  - app/src/shared/utils/image.ts — trimCanvas, compressImage
  - app/src/shared/utils/error.ts — OperationType, setAuthContext, handleFirestoreError
  - app/src/shared/constants/disciplines.ts — re-export of disciplineConfig
affects: [06-shared-ui-primitives, 07-navigation-layout, 08-extract-simple-views, 09-extract-complex-views]

tech-stack:
  added: []
  patterns: [extract-and-import (create → import → verify build → remove inline)]

key-files:
  created:
    - app/src/shared/types/index.ts
    - app/src/shared/utils/format.ts
    - app/src/shared/utils/image.ts
    - app/src/shared/utils/error.ts
    - app/src/shared/constants/disciplines.ts
  modified:
    - app/src/App.tsx
    - app/src/lib/data.ts
    - app/package.json

key-decisions:
  - "data.ts re-exports all types from shared/types — backward compat preserved for App.tsx import on line 106"
  - "SupabaseUser import stays in App.tsx (also used for user state), not moved to error.ts"
  - "firebase packages removed (firebase ^12.11.0, firebase-admin ^13.7.0) — confirmed no importers"

patterns-established:
  - "extract-and-import: new file → import in consumer → npm run build → remove inline"
  - "shared/types is the only source of truth — data.ts and App.tsx import, never re-define"

duration: ~35min
started: 2026-03-29T00:00:00Z
completed: 2026-03-29T00:00:00Z
---

# Phase 5 Plan 01: Types + Pure Utilities Summary

**Shared type/utility foundation established — 18 types consolidated, 7 functions extracted, Firebase removed, build passes.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~35 min |
| Completed | 2026-03-29 |
| Tasks | 3 completed |
| Files created | 5 |
| Files modified | 3 |
| Files deleted | 1 (firebase.ts) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: shared/types is single source of truth | Pass | 18 types in index.ts; neither App.tsx nor data.ts define inline duplicates |
| AC-2: Shared utils extracted and imported | Pass | All 7 functions moved to shared/utils; inline defs removed from App.tsx |
| AC-3: Build passes, app unchanged | Pass | `npm run build` exits 0 after every task |
| AC-4: Firebase artifacts removed | Pass | firebase.ts deleted, packages removed, build still passes |

## Accomplishments

- Consolidated 18 type definitions from App.tsx and data.ts into `shared/types/index.ts`
- Extracted 7 utility functions into 3 focused modules under `shared/utils/`
- Preserved backward compatibility — data.ts re-exports all types; App.tsx line 106 import unchanged
- Eliminated firebase dependency entirely (~2.4 MB removed from node_modules)
- Established `shared/` directory structure that all subsequent extraction phases will build on

## Task Commits

Committed atomically in phase commit.

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/shared/types/index.ts` | Created | Single source of truth — 18 canonical type definitions |
| `app/src/shared/utils/format.ts` | Created | safeFormatDate, stripMarkdown |
| `app/src/shared/utils/image.ts` | Created | trimCanvas, compressImage |
| `app/src/shared/utils/error.ts` | Created | OperationType enum, setAuthContext, handleFirestoreError |
| `app/src/shared/constants/disciplines.ts` | Created | Re-export barrel for disciplineConfig |
| `app/src/App.tsx` | Modified | Removed inline types + util definitions; added shared imports |
| `app/src/lib/data.ts` | Modified | Removed inline types; imports from shared/types; re-exports for compat |
| `app/src/lib/firebase.ts` | Deleted | No importers; Firebase fully replaced by Supabase |
| `app/package.json` | Modified | Removed firebase ^12.11.0 and firebase-admin ^13.7.0 |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| data.ts re-exports types from shared/types | App.tsx line 106 imports from `./lib/data` — changing that import would be Phase 6+ scope | Zero disruption to existing import graph |
| SupabaseUser stays imported in App.tsx | Used both in setAuthContext (now imported from error.ts) and in local user state type annotations | No duplication — just needed in both places |
| GoogleTokens placed in shared/types (not error.ts) | It's a domain type used in AppUser, not an error utility type | Clean domain boundary |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- `shared/` directory structure exists and is proven (build passes importing from it)
- All types and utils are importable from canonical locations
- App.tsx is ~80 lines shorter (types + utils removed)

**Concerns:**
- None for Phase 6

**Blockers:**
- None

---
*Phase: 05-types-utilities, Plan: 01*
*Completed: 2026-03-29*
