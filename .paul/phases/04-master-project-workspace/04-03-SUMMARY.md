---
phase: 04-master-project-workspace
plan: 03
subsystem: ui, data-layer
tags: [master-project, organization-search, react, typescript, supabase, modal]

requires:
  - phase: 04-master-project-workspace/04-01
    provides: linkOrganizationToMasterProject(); MasterProjectOrganization.organizationId; master_project_organizations RLS (owner can insert); MasterProjectDetailView shell with disabled "Dodaj organizaciju" button
  - phase: 04-master-project-workspace/04-02
    provides: fetchMasterProjectStats(); fetchMasterRecentActivity(); stats/activity props on MasterProjectDetailView

provides:
  - searchOrganizations(query) — ilike search on organizations.name, returns Company[], 2-char guard
  - "Dodaj organizaciju" button enabled for master project owner (disabled for non-owners)
  - Add Org modal: search field → results list (excluding already-linked orgs) → org selection → discipline selector → role selector → confirm → linkOrganizationToMasterProject → refreshes orgs + stats + activity

affects:
  - 04-04 (issue tracking UI will share MasterProjectDetailView; no conflicts expected)

tech-stack:
  added: []
  patterns:
    - handleAddOrgSearch defined as plain async function in component body (not IIFE, not useCallback) — consistent with other handlers in this file
    - linkedIds exclusion set computed from masterProjectOrgs.organizationId at search time — prevents re-linking already-linked orgs

key-files:
  created: []
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "handleAddOrgSearch extracted to component body (not IIFE in JSX) — IIFE approach caused syntax error, plain function is cleaner and consistent"
  - "Modal rendered as sibling inside selectedMasterProject branch (not inside MasterProjectDetailView) — keeps state in App, component stays stateless"
  - "Org exclusion filter applied client-side after search — avoids complex NOT IN subquery, acceptable at limit=10"

patterns-established:
  - "searchOrganizations 2-char guard: returns [] without querying Supabase — pattern for all future search helpers"
  - "After linkOrganizationToMasterProject: re-fetch orgs → compute ids → re-fetch stats + activity — full refresh chain, established here for 04-04 to follow if needed"

duration: ~20min
started: 2026-03-28T02:20:00Z
completed: 2026-03-28T02:40:00Z
---

# Phase 4 Plan 03: "Dodaj organizaciju" Modal — Summary

**The "Dodaj organizaciju" button is now active for master project owners — a search-and-link modal finds organizations by name, lets the owner assign discipline and role, and refreshes the discipline card list on confirm.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 2/2 completed |
| Files created | 0 |
| Files modified | 2 |
| Qualify results | PASS × 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Organization search returns matching results | Pass | searchOrganizations() ilike queries organizations.name; results exclude already-linked orgs via client-side filter |
| AC-2: Linking an org updates the discipline card list | Pass | linkOrganizationToMasterProject called on confirm; full refresh chain (orgs → stats → activity) runs after |
| AC-3: Button only enabled for master project owner | Pass | button disabled + cursor-not-allowed when currentOrgId !== ownerOrgId; enabled + clickable for owner |

## Accomplishments

- `searchOrganizations(query)` added to data.ts — ilike on organizations.name, 2-char guard, limit 10, returns Company[]
- "Dodaj organizaciju" button owner-gated in MasterProjectDetailView — passes ownerOrgId + currentOrgId + onAddOrg as props
- Full modal flow in App.tsx: two-step UX (search → configure), exclusion filter, discipline/role selects, loading state, full refresh on success

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/lib/data.ts` | Modified | +`searchOrganizations()` after `fetchOrganizationById` |
| `app/src/App.tsx` | Modified | +import; +7 state vars; +`handleAddOrgSearch()`; updated MasterProjectDetailView props (ownerOrgId, currentOrgId, onAddOrg); owner-gated button; add-org modal JSX |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| handleAddOrgSearch as plain component-body function (not IIFE) | IIFE in JSX caused syntax error; plain function is consistent with other handlers in App.tsx | Cleaner code; no behaviour difference |
| Modal as sibling of MasterProjectDetailView (not inside it) | Keeps all add-org state in App component; MasterProjectDetailView stays stateless | Simpler component boundary; onAddOrg callback is the only interface |
| Client-side exclusion of already-linked orgs | Avoids NOT IN subquery complexity; acceptable at limit=10 | Simple, correct for current scale |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | Syntax fix, no scope change |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** One approach adjustment during execution. No scope change.

### Auto-fixed Issues

**1. IIFE pattern in JSX caused syntax error**
- **Found during:** Task 2 execution (IDE diagnostic on save)
- **Issue:** `{view === 'master-workspace' && (() => { ... return (...) })()}` pattern — the IIFE was never invoked (missing `()` at end) and TypeScript reported `)' expected` at the closing brace
- **Fix:** Removed IIFE; extracted `handleAddOrgSearch` as a plain async function in the component body (before the JSX return); restored the standard ternary condition
- **Files:** `app/src/App.tsx`

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| IIFE syntax error on first JSX edit | Detected via IDE diagnostic; fixed by restructuring to plain function + standard conditional JSX |

## Next Phase Readiness

**Ready:**
- `searchOrganizations` available for any future search-and-link flows
- MasterProjectDetailView now accepts ownerOrgId/currentOrgId — pattern established for future owner-only actions
- Org linking fully functional; discipline cards refresh after add

**Concerns:**
- `linked_project_id` is not set when linking via this modal (the org is linked without a specific contractor project). A user would need to re-link or edit to attach a project. This is acceptable MVP behaviour but worth noting for 04-04 or post-MVP.

**Blockers:**
- None

---
*Phase: 04-master-project-workspace, Plan: 03*
*Completed: 2026-03-28*
