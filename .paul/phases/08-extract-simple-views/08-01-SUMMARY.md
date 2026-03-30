---
phase: 08-extract-simple-views
plan: 01
subsystem: ui
tags: [react, feature-folders, extract-and-import, auth, users, organizations]

requires:
  - phase: 07-navigation-layout
    provides: AppShell (stable layout shell), shared/components/ and app/layouts/ directories established

provides:
  - app/src/features/auth/components/LoginView.tsx
  - app/src/features/users/components/UsersView.tsx
  - app/src/features/organizations/components/InviteUserModal.tsx
  - app/src/features/organizations/components/CompanySettingsView.tsx

affects: [08-02-dashboard-projects-pdf, 08-03-reports-calendar-master, 11-auth-provider]

tech-stack:
  added: []
  patterns: [feature-folder-structure, extract-and-import]

key-files:
  created:
    - app/src/features/auth/components/LoginView.tsx
    - app/src/features/users/components/UsersView.tsx
    - app/src/features/organizations/components/InviteUserModal.tsx
    - app/src/features/organizations/components/CompanySettingsView.tsx
  modified:
    - app/src/App.tsx

key-decisions:
  - "LoginView wraps both login + onboarding screens as internal conditionals (not separate components)"
  - "countryCodes array moved from App.tsx module scope into CompanySettingsView.tsx (only consumer)"
  - "3 early returns (loading, !user, showOnboarding) consolidated into one LoginView render gate"

patterns-established:
  - "Feature folder structure: src/features/{domain}/components/{Component}.tsx"
  - "Extract-and-import: import new file → build green → remove inline → build green"
  - "Props typed as `any` for now — tightening deferred to Phase 10"

duration: ~25min
started: 2026-03-30T00:00:00Z
completed: 2026-03-30T00:00:00Z
---

# Phase 8 Plan 01: Extract Auth, Users & Org Views Summary

**LoginView (login + onboarding), UsersView, InviteUserModal, and CompanySettingsView extracted from App.tsx into `src/features/` folder structure; App.tsx reduced by 521 lines.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~25 min |
| Tasks | 3 completed |
| Files created | 4 |
| Files modified | 1 (App.tsx) |
| App.tsx reduction | 5404 → 4883 lines (−521) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: LoginView extracted | Pass | features/auth/components/LoginView.tsx created; 3 early returns replaced with single render gate |
| AC-2: UsersView + InviteUserModal extracted | Pass | Both in feature folders, imported at lines 117-118, inline defs removed |
| AC-3: CompanySettingsView extracted | Pass | In features/organizations/components/, countryCodes moved with it |
| AC-4: Build and behavior unchanged | Pass | npm run build exits 0 at every intermediate checkpoint (4 builds) |

## Accomplishments

- Established `src/features/` folder structure with 3 domain directories: `auth/`, `users/`, `organizations/`
- Extracted 4 prop-driven components with zero behavior change
- Removed `countryCodes` module-scope constant from App.tsx (moved to its only consumer, CompanySettingsView)
- Consolidated 3 AppContent early returns into a single LoginView gate — cleaner flow control

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/features/auth/components/LoginView.tsx` | Created | Login screen + onboarding screen (loading/!user/showOnboarding conditionals) |
| `app/src/features/users/components/UsersView.tsx` | Created | User list with role management and pending invitations |
| `app/src/features/organizations/components/InviteUserModal.tsx` | Created | Invite user modal with name/email/role selection |
| `app/src/features/organizations/components/CompanySettingsView.tsx` | Created | Company settings form with logo upload, brand color, contact fields |
| `app/src/App.tsx` | Modified | 4 imports added, 3 function defs removed, 3 early returns → 1 LoginView render, countryCodes removed |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Consolidate loading + !user + showOnboarding into one LoginView | The three screens are all pre-authenticated states; one gate is cleaner | AppContent flow: guard → AppShell. Phase 11 AuthProvider will own this gate |
| Move countryCodes into CompanySettingsView | Only CompanySettingsView uses it; no reason to keep at App.tsx module scope | Keeps component self-contained |
| Login + onboarding as internal conditionals in one component | They share the same pre-auth context; separate components would require passing identical prop sets twice | LoginView handles its own display logic |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Node line-removal script needed 2 passes for CompanySettingsView |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Execution complication only — final result matches spec exactly.

### Auto-fixed Issues

**1. CompanySettingsView removal required two-pass Node script**
- **Found during:** Task 3
- **Issue:** The initial Node script found the first `}` that was followed by a blank line inside the function body (inside handleSave), not the function's closing brace — removing only the top ~55 lines of the 273-line function
- **Fix:** Second Node script identified the orphaned body by working backward from `function DashboardView` start and removed lines 1436–1655 cleanly
- **Files:** App.tsx
- **Verification:** `grep -c "countryCodes\|^function CompanySettingsView"` → 0; `npm run build` → exits 0

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Node script for CompanySettingsView removal only removed first ~55 lines | Used second targeted script working backward from DashboardView boundary |

## Next Phase Readiness

**Ready:**
- `src/features/` directory structure established — 08-02 and 08-03 will follow the same pattern
- Extract-and-import pattern proven and working across all 3 task types (inline JSX, module-scope function, module-scope constant)
- 4 imports added to App.tsx at lines 116-119 — pattern set for next 8 views

**Concerns:**
- App.tsx still has 7 more view functions to extract (08-02: DashboardView, ProjectsView, NewProjectView + PDF; 08-03: ReportsView, CalendarView, MasterProjectsListView, MasterProjectDetailView)
- `any` typing throughout extracted components — acceptable, Phase 10 will tighten
- Lucide icon imports in App.tsx not yet pruned — some icons (FileText, Eye, EyeOff) may now be unused; safe to defer until all views extracted

**Blockers:** None

---
*Phase: 08-extract-simple-views, Plan: 01*
*Completed: 2026-03-30*
