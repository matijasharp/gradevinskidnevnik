---
phase: 16-signup-approval-gate
plan: 01
subsystem: auth
tags: [supabase, rls, react, profiles, approval-gate, super-admin]

requires:
  - phase: 15-app-polish-role-enforcement
    provides: Stable app with role enforcement and routing

provides:
  - profiles.status + is_super_admin columns via migration
  - PendingApprovalView holding screen for pending users
  - /admin/approvals super admin route with approve/reject

affects: [17-landing-page, 18-deployment, 22-full-super-admin]

tech-stack:
  added: []
  patterns: [profile-status-gate in App.tsx, isSuperAdmin self-redirect guard in component]

key-files:
  created:
    - supabase/migrations/20260331_11_profile_status.sql
    - app/src/features/auth/components/PendingApprovalView.tsx
    - app/src/features/admin/components/SuperAdminPage.tsx
  modified:
    - app/src/shared/types/index.ts
    - app/src/integrations/supabase/queries/members.ts
    - app/src/integrations/supabase/queries/organizations.ts
    - app/src/app/router/routeConfig.ts
    - app/src/App.tsx

key-decisions:
  - "DEFAULT 'approved' on migration: existing profiles stay unblocked, new signups explicitly set to pending"
  - "isSuperAdmin redirect guard in component (not ProtectedRoute): keeps route intentionally hidden"

patterns-established:
  - "Profile status gate: check appUser.status in App.tsx after loading guard, before AppShell return"
  - "Super admin self-guard: redirect non-admins inside useEffect on component mount"

duration: ~35min
started: 2026-03-31T00:00:00Z
completed: 2026-03-31T14:00:00Z
---

# Phase 16 Plan 01: Signup Approval Gate Summary

**Migration adds `status`/`is_super_admin` to profiles; pending users see a Croatian holding screen; super admin at `/admin/approvals` can approve or reject with optimistic list removal.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~35 min |
| Started | 2026-03-31 |
| Completed | 2026-03-31 |
| Tasks | 3 completed |
| Files modified | 7 (3 created, 4 modified) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: New signup lands in pending state | Pass | createOrganizationWithOwner sets status='pending'; DEFAULT 'approved' preserves existing rows |
| AC-2: Pending user sees holding screen | Pass | PendingApprovalView with Croatian copy and sign-out button; gated in App.tsx |
| AC-3: Approved user sees full app unchanged | Pass | Pending check only fires when status === 'pending'; no impact on existing flow |
| AC-4: Super admin can view pending users | Pass | fetchPendingProfiles query returns all status='pending' profiles ordered by created_at |
| AC-5: Super admin can approve or reject | Pass | approveProfile/rejectProfile update status; optimistic removal from list on action |
| AC-6: Non-super-admin cannot access /admin/approvals | Pass | useEffect guard redirects to ROUTES.DASHBOARD if !appUser.isSuperAdmin |

## Accomplishments

- Applied migration adding `status TEXT NOT NULL DEFAULT 'approved'` and `is_super_admin BOOLEAN NOT NULL DEFAULT false` to `profiles` — zero disruption to existing data
- Built full approval gate flow: new signups enter pending state → see holding screen → super admin approves → user gains access
- Hidden `/admin/approvals` route fully functional with approve/reject and optimistic UI updates

## Task Commits

No atomic per-task commits — plan was executed in a single session. Phase commit will be made at transition.

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260331_11_profile_status.sql` | Created | Adds status + is_super_admin columns to profiles |
| `app/src/shared/types/index.ts` | Modified | Added status and isSuperAdmin to AppUser interface |
| `app/src/integrations/supabase/queries/members.ts` | Modified | mapUser maps status/isSuperAdmin; added fetchPendingProfiles, approveProfile, rejectProfile |
| `app/src/integrations/supabase/queries/organizations.ts` | Modified | mapUser maps status/isSuperAdmin; createOrganizationWithOwner sets status='pending' |
| `app/src/app/router/routeConfig.ts` | Modified | Added ROUTES.SUPER_ADMIN = '/admin/approvals' |
| `app/src/features/auth/components/PendingApprovalView.tsx` | Created | Croatian holding screen with Clock icon and sign-out button |
| `app/src/features/admin/components/SuperAdminPage.tsx` | Created | Super admin approval page with approve/reject actions |
| `app/src/App.tsx` | Modified | Imports PendingApprovalView + SuperAdminPage; adds pending gate + route registration |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| DEFAULT 'approved' on migration | Existing profiles must remain unblocked; new signups explicitly opt into pending | All pre-existing users unaffected |
| isSuperAdmin guard inside component (not ProtectedRoute) | Keeps route undiscoverable — no nav link, no wrapper that hints at its existence | Route is safely hidden; non-admins redirect silently |
| No rejected-user screen | Rejection is edge case; rejected users stay on PendingApprovalView — acceptable for MVP | Reduces scope; can be revisited in Phase 22 |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Approval gate is live — new signups will be gated from the moment this deploys
- Super admin can be enabled by setting is_super_admin=true directly in Supabase dashboard (no UI needed for MVP)
- Phase 17 (Landing Page) and Phase 18 (Deployment) can proceed without any dependency on this phase's internals

**Concerns:**
- The `fetchPendingProfiles` query uses `select('*')` — includes all profile columns. If profiles table grows large, consider explicit column list in Phase 22 Full Super Admin Panel.
- No email notification on approval — users must check back. Flagged as out-of-scope for v1.2.

**Blockers:**
- None

---
*Phase: 16-signup-approval-gate, Plan: 01*
*Completed: 2026-03-31*
