---
phase: 08-extract-simple-views
plan: 02
subsystem: ui
tags: [react, feature-folders, extract-and-import, dashboard, projects, pdf]

requires:
  - phase: 08-extract-simple-views/08-01
    provides: features/ directory structure established, extract-and-import pattern proven

provides:
  - app/src/integrations/pdf/generateDiaryPdf.ts
  - app/src/features/dashboard/components/DashboardView.tsx
  - app/src/features/projects/components/ProjectsView.tsx
  - app/src/features/projects/components/NewProjectView.tsx

affects: [08-03-reports-calendar-master, 13-data-layer-decomposition]

tech-stack:
  added: []
  patterns: [feature-folder-structure, extract-and-import, integrations-folder-for-non-react-modules]

key-files:
  created:
    - app/src/integrations/pdf/generateDiaryPdf.ts
    - app/src/features/dashboard/components/DashboardView.tsx
    - app/src/features/projects/components/ProjectsView.tsx
    - app/src/features/projects/components/NewProjectView.tsx
  modified:
    - app/src/App.tsx

key-decisions:
  - "generateDiaryPdf adds company as explicit parameter — it closed over company from AppContent; call site passes company explicitly"
  - "PDF function placed in integrations/pdf/ not features/ — it is not a React component, it is a utility module"
  - "autoTable imported in generateDiaryPdf.ts for jsPDF plugin side-effect registration even though not called directly"

patterns-established:
  - "Non-component utilities extracted to src/integrations/{domain}/ not src/features/"
  - "Closure variables surfaced as explicit parameters when extracting — no hidden dependencies allowed"

duration: ~20min
started: 2026-03-30T00:00:00Z
completed: 2026-03-30T00:00:00Z
---

# Phase 8 Plan 02: Extract Dashboard, Projects & PDF Summary

**generateDiaryPdf, DashboardView, ProjectsView, and NewProjectView extracted from App.tsx into feature/integration folders; App.tsx reduced by 676 lines (4883→4207).**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 3 completed |
| Files created | 4 |
| Files modified | 1 (App.tsx) |
| App.tsx reduction | 4883 → 4207 lines (−676) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: generateDiaryPdf extracted | Pass | integrations/pdf/generateDiaryPdf.ts created; company added as explicit parameter; old generatePDF name gone |
| AC-2: DashboardView extracted | Pass | features/dashboard/components/DashboardView.tsx created; imported and wired |
| AC-3: ProjectsView + NewProjectView extracted | Pass | Both in features/projects/components/; imported and wired |
| AC-4: Build integrity maintained | Pass | npm run build exits 0 at every intermediate step (6 builds total) |

## Accomplishments

- Established `integrations/` folder pattern for non-React modules (PDF generation, future API clients)
- Extracted 3 React components and 1 utility function with zero behavior change
- `dashboard` and `projects` feature domains now established in `src/features/`
- App.tsx reduced by 676 lines — more than estimated (−490) because function bodies were larger than projected

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/integrations/pdf/generateDiaryPdf.ts` | Created | PDF report generation for diary entries; accepts project, entries, company |
| `app/src/features/dashboard/components/DashboardView.tsx` | Created | Main dashboard with analytics chart, calendar widget, project cards |
| `app/src/features/projects/components/ProjectsView.tsx` | Created | Project list with status/phase filters and shared projects section |
| `app/src/features/projects/components/NewProjectView.tsx` | Created | New project creation form |
| `app/src/App.tsx` | Modified | 3 imports added, 4 definitions removed (generatePDF + 3 view functions) |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| generateDiaryPdf adds `company` as explicit parameter | Function closed over `company` from AppContent scope; explicit parameter removes hidden dependency | Call site passes `company`; function is now self-contained and testable |
| PDF module in `integrations/pdf/` not `features/` | Not a React component — it is a pure async utility returning void; features/ is for UI | Establishes pattern: UI components → features/, utility modules → integrations/ |
| autoTable imported in generateDiaryPdf.ts | jsPDF-autotable registers itself as a plugin via side effects on import | Required for jsPDF to recognize the plugin; suppressed unused-import lint with `void autoTable` |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Essential — resolved closure dependency |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** One necessary fix, no scope creep, no deferred items.

### Auto-fixed Issues

**1. generatePDF closed over `company` from AppContent**
- **Found during:** Task 1
- **Issue:** The plan spec said to copy the function verbatim; however `company` was referenced from the outer AppContent closure — not passed as a parameter. Extracting verbatim would fail to compile.
- **Fix:** Added `company: Company | null` as explicit third parameter; updated call site at App.tsx line 910 to pass `company`
- **Files:** `app/src/integrations/pdf/generateDiaryPdf.ts`, `app/src/App.tsx`
- **Verification:** `grep -n "generatePDF\b" app/src/App.tsx` → 0 results; build passes

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Plan estimated −490 lines; actual was −676 | Functions were larger than estimated. No impact — outcome exceeds plan. |

## Next Phase Readiness

**Ready:**
- `src/features/` domain structure: auth/, users/, organizations/, dashboard/, projects/ — all established
- `src/integrations/` structure introduced — ready for supabase queries (Phase 13) and other utilities
- Extract-and-import pattern proven across all types: module-scope function, closure function, React component
- 4 imports added at lines 120-123 of App.tsx — pattern set for 08-03

**Concerns:**
- App.tsx still has 4 more view functions to extract in 08-03: ReportsView (~456 lines), CalendarView (~295 lines), MasterProjectsListView (~70 lines), MasterProjectDetailView (~280 lines)
- `any` typing throughout extracted components — acceptable, Phase 10 will tighten
- Lucide icon imports in App.tsx not yet pruned — deferred until all views extracted

**Blockers:** None

---
*Phase: 08-extract-simple-views, Plan: 02*
*Completed: 2026-03-30*
