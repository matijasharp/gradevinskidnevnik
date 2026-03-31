---
phase: 15-app-polish-role-enforcement
plan: 01
subsystem: ui
tags: [react, role-enforcement, discipline, navigation]

requires:
  - phase: 14-org-provider-thin-pages
    provides: OrganizationProvider with masterProjects context and company.discipline via useAuth()

provides:
  - Master projekti nav gated by discipline + invite status
  - Create master project blocked for contractor orgs (discipline !== 'general')
  - Contractor empty state shows informative Croatian message
  - src/shared/icons/index.ts barrel export placeholder

affects: [16-signup-approval-gate, 17-landing-page]

tech-stack:
  added: []
  patterns:
    - "discipline === 'general' as coordinator gate — use for any coordinator-only feature"
    - "masterProjects.length > 0 as invite gate — contractor sees feature only if invited"

key-files:
  created:
    - app/src/shared/icons/index.ts
  modified:
    - app/src/app/layouts/AppShell.tsx
    - app/src/features/masterProjects/components/MasterProjectsListView.tsx
    - app/src/features/masterProjects/components/MasterWorkspacePage.tsx

key-decisions:
  - "UI-only enforcement — RLS already gates data; nav hiding is sufficient for v1.2 launch"
  - "showMasterNav = discipline==='general' || masterProjects.length > 0 — contractors with invites can still navigate to their projects"

patterns-established:
  - "isCoordinator = company.discipline === 'general' — derive at page level, pass to child components"

duration: ~20min
started: 2026-03-31T00:00:00Z
completed: 2026-03-31T00:00:00Z
---

# Phase 15 Plan 01: App Polish + Role Enforcement Summary

**Master project nav and create button gated by org discipline — contractor orgs see only their invited projects; coordinator orgs (`general`) retain full create/manage access.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 3 completed |
| Files modified | 4 (1 created, 3 modified) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Contractor with no invites — nav hidden | Pass | `showMasterNav = false` when discipline !== 'general' and masterProjects.length === 0 |
| AC-2: Contractor with invites — nav visible | Pass | `showMasterNav = true` when masterProjects.length > 0 |
| AC-3: Contractor cannot create master project | Pass | Create button absent; empty state shows "Niste pozvani ni na jedan master projekt" |
| AC-4: Coordinator retains full access | Pass | `discipline === 'general'` always shows nav and create button |
| AC-5: Icons folder exists | Pass | `app/src/shared/icons/index.ts` created with barrel comment |

## Accomplishments

- Contractor orgs (electro, water, klima) no longer see the coordinator-only master projects nav unless invited
- Create master project flow blocked at UI level for non-coordinator orgs — modal, button, and empty state CTA all gated
- `src/shared/icons/` folder created for future custom icon uploads

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/shared/icons/index.ts` | Created | Barrel export placeholder for custom app icons |
| `app/src/app/layouts/AppShell.tsx` | Modified | Added `useOrg()` call, `showMasterNav` gate on Master projekti nav item |
| `app/src/features/masterProjects/components/MasterProjectsListView.tsx` | Modified | Added `isCoordinator` prop, gated header create button and empty state |
| `app/src/features/masterProjects/components/MasterWorkspacePage.tsx` | Modified | Derived `isCoordinator`, passed to ListView, gated `onCreateNew` and modal render |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| UI-only enforcement, no route guard | RLS already gates data; plan boundary explicitly scoped out route redirect | Contractors who navigate directly to /master-workspace see empty invited-projects list, not a crash |
| `showMasterNav` reads `masterProjects` from OrganizationProvider | Already available in context from Phase 14; no additional fetch needed | Zero extra network calls |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- App is role-safe for electrician launch — contractor users won't see coordinator UI
- `shared/icons/` folder available for custom icon uploads before deployment

**Concerns:**
- Route guard on `/master-workspace` was explicitly scoped out — a contractor who knows the URL can still visit the page (they'll see the contractor empty state, data is RLS-gated)

**Blockers:**
- None

---
*Phase: 15-app-polish-role-enforcement, Plan: 01*
*Completed: 2026-03-31*
