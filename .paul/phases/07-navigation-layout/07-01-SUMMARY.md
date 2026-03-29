---
phase: 07-navigation-layout
plan: 01
subsystem: ui
tags: [react, layout, navigation, error-boundary]

requires:
  - phase: 06-shared-ui-primitives
    provides: Button, Card, Input, Select, StatusBadge — all consumed by extracted components

provides:
  - app/src/shared/components/ErrorBoundary.tsx
  - app/src/shared/components/SecretsModal.tsx
  - app/src/app/layouts/AppShell.tsx (sidebar + mobile nav + layout wrapper)

affects: [08-extract-simple-views, 09-extract-complex-views, 11-auth-provider]

tech-stack:
  added: []
  patterns: [extract-and-import, layout-as-wrapper-component]

key-files:
  created:
    - app/src/shared/components/ErrorBoundary.tsx
    - app/src/shared/components/SecretsModal.tsx
    - app/src/app/layouts/AppShell.tsx
  modified:
    - app/src/App.tsx

key-decisions:
  - "signOut imported directly in AppShell — no need to thread through App.tsx"
  - "DiaryEntryDetailModal stays as AppShell child (inside main), not a sibling modal"
  - "Modals (SecretsModal, InviteUserModal, activeReminder) are siblings to AppShell in fragment"

patterns-established:
  - "NavItem + MobileNavItem co-located in AppShell (nav helpers belong to their consumer)"
  - "AppShell accepts view/setView/company/appUser as props + children — no context yet"

duration: ~20min
started: 2026-03-29T00:00:00Z
completed: 2026-03-29T00:00:00Z
---

# Phase 7 Plan 01: Navigation + Layout Shell Summary

**ErrorBoundary, SecretsModal, and AppShell extracted from App.tsx; AppContent return restructured to use `<AppShell>` as layout wrapper with nav helpers co-located.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 2 completed |
| Files created | 3 |
| Files modified | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: ErrorBoundary and SecretsModal extracted | Pass | Both in shared/components, imported in App.tsx, inline removed |
| AC-2: AppShell extracted with nav helpers | Pass | AppShell.tsx in app/layouts, NavItem/MobileNavItem co-located, AppContent return restructured |
| AC-3: Build passes, behavior unchanged | Pass | npm run build exits 0, 4052 modules, zero TypeScript errors |

## Accomplishments

- Created `app/src/shared/components/` directory with ErrorBoundary and SecretsModal
- Created `app/src/app/layouts/` directory with AppShell (sidebar + mobile nav + layout wrapper + NavItem + MobileNavItem)
- Restructured AppContent return: outer `<div>` + `<aside>` + `<main>` + mobile `<nav>` → `<AppShell>` wrapper; modals as siblings in `<>`
- Removed `signOut` from App.tsx supabaseAuth import (moved to AppShell)
- Build verified at each step (before and after every structural change)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/shared/components/ErrorBoundary.tsx` | Created | React error boundary class — wraps App for crash recovery |
| `app/src/shared/components/SecretsModal.tsx` | Created | Secrets/API key configuration modal |
| `app/src/app/layouts/AppShell.tsx` | Created | Sidebar, mobile nav, layout wrapper; includes NavItem and MobileNavItem helpers |
| `app/src/App.tsx` | Modified | Added 3 imports, removed signOut import, removed 4 inline definitions, restructured AppContent return |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| NavItem + MobileNavItem co-located in AppShell | Nav helpers only used by AppShell; no reason to expose them | Keeps AppShell self-contained |
| DiaryEntryDetailModal stays inside AppShell children | It renders inside the main content area; extracting it as a sibling would change visual stacking | No change to modal behavior |
| Modals (Secrets, Invite, Reminder) as AppShell siblings | They are full-screen overlays, not part of the layout chrome | Correct layering, consistent with z-index usage |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- AppShell is the stable layout shell for all phases 8–9 view extractions to mount into
- `shared/components/` directory established for future shared components
- `app/layouts/` directory established for future layout variants

**Concerns:**
- AppShell still receives `view/setView` as props — Phase 12 (navigate() migration) will replace this pattern
- `AppShell({ ...}: any)` uses `any` typing — acceptable for now, will be tightened in Phase 11/12

**Blockers:** None

---
*Phase: 07-navigation-layout, Plan: 01*
*Completed: 2026-03-29*
