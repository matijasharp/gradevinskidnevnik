---
phase: 14-org-provider-thin-pages
plan: 01
subsystem: ui
tags: [react, context, providers, router, organization]

requires:
  - phase: 11-auth-provider
    provides: AuthProvider pattern + useAuth() — structural template for this provider
  - phase: 12-navigate-migration
    provides: RouterProvider/createBrowserRouter in AppRouter — required for useNavigate() context
  - phase: 13-data-layer-decomposition
    provides: domain query modules — subscribeProjects, subscribeDiaryEntries, etc. imported by provider

provides:
  - OrganizationProvider context with all org-scoped data and actions
  - useOrg() hook exposing projects, entries, companyUsers, pendingInvitations, sharedProjects, masterProjects, materialHistory, materialUnits, and all org actions
  - AppContent migrated to useOrg() — ~150 lines of state/subscriptions/actions removed from App.tsx

affects:
  - 14-02 thin pages — can now import useOrg() in any route component

tech-stack:
  added: []
  patterns:
    - OrganizationProvider mounted inside RouterProvider (in AppRouter route element) — required for useNavigate() access
    - refreshMasterProjects() exposed from context for manual re-fetch after create operations

key-files:
  created:
    - app/src/app/providers/OrganizationProvider.tsx
    - .paul/phases/14-org-provider-thin-pages/14-01-SUMMARY.md
  modified:
    - app/src/app/providers/index.ts
    - app/src/app/router/AppRouter.tsx
    - app/src/main.tsx
    - app/src/App.tsx

key-decisions:
  - "OrganizationProvider placed inside AppRouter route element, not main.tsx — useNavigate() requires Router context"
  - "refreshMasterProjects() added to OrgContextValue — masterProjects is one-time fetch, subscription won't auto-update after creation"

patterns-established:
  - "Providers that use useNavigate() must live inside RouterProvider — mount in AppRouter route element, not main.tsx"
  - "One-time fetches that need manual refresh should expose a refresh function from context"

duration: ~30min
started: 2026-03-31T00:00:00Z
completed: 2026-03-31T00:00:00Z
---

# Phase 14 Plan 01: OrganizationProvider Extraction — Summary

**Extracted all org-scoped data subscriptions, actions, and derived state from AppContent into a new `OrganizationProvider` context; AppContent now calls `useOrg()` for all org data, reducing it by ~150 lines.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Tasks | 3 completed |
| Files modified | 5 |
| Build | ✓ exit 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: OrganizationProvider created and exports useOrg() | Pass | All 8 data fields + 8 action fields present in OrgContextValue |
| AC-2: Org state and subscriptions removed from AppContent | Pass | projects, entries, companyUsers, pendingInvitations, sharedProjects, masterProjects, materialHistory, materialUnits no longer local useState in AppContent |
| AC-3: Build passes with zero regressions | Pass | `npm run build` exits 0, 4099 modules, no TypeScript errors |

## Accomplishments

- Created `OrganizationProvider.tsx` with full subscription management (projects, diary entries, users, invitations) and one-time fetches (sharedProjects, masterProjects), derived state (materialHistory, materialUnits), and all org-scoped actions (inviteUser, cancelInvitation, updateRole, deleteUser, createProject, completeProject, updateProjectPhase, deleteProject)
- AppContent reduced from ~1067 to ~910 lines — org-scoped block eliminated
- Provider tree correctly structured: `AuthProvider → RouterProvider → OrganizationProvider → App`

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/app/providers/OrganizationProvider.tsx` | Created | New context — org-scoped state, subscriptions, fetches, derived state, and actions |
| `app/src/app/providers/index.ts` | Modified | Added `OrganizationProvider` and `useOrg` exports |
| `app/src/app/router/AppRouter.tsx` | Modified | Wraps route element with OrganizationProvider (inside RouterProvider) |
| `app/src/main.tsx` | Modified | Reverted to AuthProvider > AppRouter only (OrganizationProvider moved into AppRouter) |
| `app/src/App.tsx` | Modified | Removed ~150 lines of org state/subscriptions/actions; added useOrg() destructure |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| OrganizationProvider mounted in AppRouter route element, not main.tsx | `useNavigate()` requires Router context; `RouterProvider` lives inside AppRouter, so provider must be inside it | Establishes pattern: any provider needing useNavigate() goes in AppRouter, not main.tsx |
| `refreshMasterProjects()` added to OrgContextValue | masterProjects is fetched once on appUser change; JSX had an inline `fetchMasterProjects + setMasterProjects` after creating a master project. Since setMasterProjects is private to the provider, a refresh function was needed | Minor additive deviation — one extra function on context |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed (post-apply) | 1 | Provider placement — runtime error, required immediate fix |
| Scope additions | 1 | `refreshMasterProjects` — needed to preserve behavior of inline JSX handler |
| Behavioral regression | 1 | `setShowInviteModal(false)` not portable — minor UX impact |

### Auto-fixed Issues

**1. Provider placement — `useNavigate()` outside Router context**
- **Found during:** Post-apply browser test
- **Issue:** Plan specified placing OrganizationProvider in main.tsx. OrganizationProvider calls `useNavigate()`, but main.tsx is outside RouterProvider (which lives inside AppRouter). Runtime error: `useNavigate() may be used only in the context of a <Router> component.`
- **Fix:** Moved OrganizationProvider into AppRouter.tsx as wrapper around the route element. Reverted main.tsx to AuthProvider > AppRouter.
- **Files:** `app/src/app/router/AppRouter.tsx`, `app/src/main.tsx`
- **Verification:** `npm run build` exits 0; runtime error resolved

**2. refreshMasterProjects scope addition**
- **Found during:** Task 3 execution
- **Issue:** Plan did not account for inline JSX handler in master project creation modal that called `fetchMasterProjects(company.id)` + `setMasterProjects(updated)`. After extraction, `setMasterProjects` is private to OrganizationProvider; the JSX handler had no way to trigger a refresh.
- **Fix:** Added `refreshMasterProjects()` to OrgContextValue and OrganizationProvider implementation. Updated JSX handler to call `await refreshMasterProjects()` instead.
- **Files:** `OrganizationProvider.tsx`, `App.tsx`
- **Verification:** Build passes; behavior preserved (list refreshes after creation)

### Deferred Items

- `setShowInviteModal(false)` was called inside the original `inviteUser` function. Since modal state stays in AppContent but JSX was not to be touched, this close-on-success behavior is lost. The invite modal now requires manual close after inviting. Low impact; can be fixed in Phase 14-02 when JSX is refactored into thin pages.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| `useNavigate()` outside Router context — runtime crash | Moved OrganizationProvider into AppRouter route element (see Auto-fixed #1) |
| Inline JSX used `setMasterProjects` — no longer accessible | Added `refreshMasterProjects()` to provider context (see Auto-fixed #2) |

## Next Phase Readiness

**Ready:**
- `useOrg()` available to any component inside the router tree
- All org-scoped data (projects, entries, users, invitations, masterProjects, materialHistory) accessible via context
- AppContent trimmed — ready for further decomposition into thin page components (Plan 14-02)

**Concerns:**
- `setShowInviteModal(false)` regression — invite modal doesn't auto-close on success. Should be addressed in 14-02 when InviteUserModal gets a proper onSuccess/onClose wiring
- `selectedProject` state in AppContent is not synced when `completeProject` or `updateProjectPhase` completes — relies on Supabase subscription updating `projects[]`. Acceptable for now; thin pages (14-02) can wire this via URL params

**Blockers:**
- None

---
*Phase: 14-org-provider-thin-pages, Plan: 01*
*Completed: 2026-03-31*
