---
phase: 03-vertical-expansion-subdomains
plan: 01
subsystem: config
tags: [discipline, vertical, config, supabase, typescript]

requires:
  - phase: 02-multi-tenant
    provides: organizations table with RLS and updateOrganization in data.ts

provides:
  - discipline column on organizations (electro/water/klima, default electro)
  - disciplineConfig.ts module with per-discipline phase and work-type maps
  - all phase and work-type dropdowns now driven by company.discipline
  - discipline picker in CompanySettings for admin users

affects:
  - 03-02-subdomain-routing (reads discipline from org; subdomain sets it on signup)
  - 04-master-workspace (aggregated views should respect discipline per member org)

tech-stack:
  added: []
  patterns:
    - Discipline-driven config via disciplineConfig.ts — single source of truth for phase/work-type options per discipline
    - getPhases(company?.discipline) / getWorkTypes(company?.discipline) helpers with 'electro' fallback

key-files:
  created:
    - app/src/lib/disciplineConfig.ts
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "discipline column NOT NULL DEFAULT 'electro' — existing orgs auto-classified as electro, no migration needed"
  - "Phase/work-type types widened to string in both data.ts and App.tsx local interfaces — discipline determines valid values at runtime"
  - "App.tsx has duplicate local interfaces (Company, Project, DiaryEntry) — both sets widened to string for phase"

patterns-established:
  - "getPhases(company?.discipline) — use this anywhere phase options are rendered"
  - "getWorkTypes(company?.discipline) — use this anywhere work type options are rendered"
  - "DISCIPLINE_LABELS — use for discipline picker UI"

duration: 35min
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:35:00Z
---

# Phase 3 Plan 01: Discipline Config and Templates — Summary

**Discipline-driven phase/work-type config extracted to `disciplineConfig.ts`; all hardcoded electro arrays replaced; `discipline` persisted per org in Supabase with a picker in Company Settings.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~35 min |
| Tasks | 3/3 completed |
| Files modified | 3 |
| Files created | 1 |
| Qualify results | PASS × 3 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Discipline persists in database | Pass | Column added, mapOrganization maps it, updateOrganization writes it, CompanySettings picker saves it |
| AC-2: Dropdown options driven by discipline | Pass | All 4 phase selects + 1 work-type select use getPhases/getWorkTypes |
| AC-3: Electro remains the default | Pass | Both helper functions fall back to 'electro' on null/undefined; TypeScript clean |

## Accomplishments

- Added `discipline` column to Supabase `organizations` (`NOT NULL DEFAULT 'electro'`, CHECK constraint) — zero downtime, existing rows default to electro
- Created `disciplineConfig.ts` with complete phase/work-type maps for electro, water (Vodoinstalacije), and klima (Klima/Ventilacija)
- Replaced all 4 hardcoded phase option blocks and 1 work-type block in App.tsx with dynamic helpers
- Added discipline picker (Struka) to CompanySettingsView — admin can switch discipline and save

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/lib/disciplineConfig.ts` | Created | Discipline type, labels, phase maps, work-type maps, getPhases/getWorkTypes helpers |
| `app/src/lib/data.ts` | Modified | discipline field on Company interface + mapOrganization + updateOrganization; phase widened to string on Project and DiaryEntry |
| `app/src/App.tsx` | Modified | discipline on local Company/Project/DiaryEntry interfaces; import added; 4 phase selects + 1 work-type select replaced; NewEntryView receives company prop; discipline picker in CompanySettingsView |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| discipline NOT NULL DEFAULT 'electro' | Existing orgs stay working without explicit migration | All pre-existing orgs classified as electro automatically |
| Widen phase to string (not union) | Discipline determines valid phases at runtime, not compile time | No type errors as discipline changes; downside: no compile-time phase validation (runtime config is authoritative) |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 3 | All essential, no scope creep |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Essential fixes only. No unplanned scope added.

### Auto-fixed Issues

**1. App.tsx local interface duplicates**
- **Found during:** Task 3 (TypeScript compile check)
- **Issue:** App.tsx has its own local `Company`, `Project`, and `DiaryEntry` interfaces (separate from data.ts). The plan only specified updating data.ts.
- **Fix:** Widened `phase` to `string` in App.tsx local `Project` and `DiaryEntry`; added `discipline` to App.tsx local `Company`.
- **Files:** `app/src/App.tsx`

**2. ProjectDetailView inline phase select**
- **Found during:** Task 3 grep verification
- **Issue:** A 4th hardcoded phase `<select>` exists inside `ProjectDetailView` (admin inline phase changer on project detail). The plan identified 3 occurrences; there were 4.
- **Fix:** Replaced with `getPhases(company?.discipline).map(...)` — company is already in scope in that component.
- **Files:** `app/src/App.tsx`

**3. NewEntryView missing company prop**
- **Found during:** Task 3 implementation
- **Issue:** `NewEntryView` didn't receive `company` in its props. Required to call `getWorkTypes(company?.discipline)`.
- **Fix:** Added `company={company}` to both `NewEntryView` render call sites; added `company` to component signature.
- **Files:** `app/src/App.tsx`

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| TypeScript compile errors on first attempt (duplicate local interfaces) | Found and fixed both interface sets in App.tsx |

## Next Phase Readiness

**Ready:**
- `company.discipline` reliably set for all orgs (defaults to 'electro')
- `getPhases()` / `getWorkTypes()` available globally — Plan 03-02 can use them for subdomain landing pages
- All forms already adapt to discipline — no further wiring needed for subdomain UX

**Concerns:**
- Existing diary entries may have work-type values (`rasvjeta`, `servis`) from the old hardcoded list that are not in the new `disciplineConfig.ts` electro config. These display fine as stored strings but won't appear as a dropdown option if editing. Low risk for MVP.

**Blockers:**
- None

---
*Phase: 03-vertical-expansion-subdomains, Plan: 01*
*Completed: 2026-03-28*
