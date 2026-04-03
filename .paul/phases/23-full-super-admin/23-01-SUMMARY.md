---
phase: 23-full-super-admin
plan: 01
subsystem: ui, database
tags: [super-admin, rls, profiles, suspend, user-management]

requires:
  - phase: 16-super-admin-approval
    provides: SuperAdminPage (single tab), isSuperAdmin flag, ROUTES.SUPER_ADMIN, fetchPendingProfiles/approveProfile/rejectProfile

provides:
  - fetchAllProfiles(filter?) — fetch all platform users with optional status filter
  - suspendProfile / unsuspendProfile — toggle user suspended state
  - SuperAdminPage two-tab layout (Odobrenje + Korisnici)
  - is_super_admin() SECURITY DEFINER function — RLS bypass for super admin
  - Sidebar "Super Admin" nav item visible to isSuperAdmin users

affects: [future admin phases, any feature touching profiles RLS]

tech-stack:
  added: []
  patterns:
    - SECURITY DEFINER function for super-admin RLS bypass (avoids recursive policy)
    - Optimistic in-place status update for suspend/unsuspend

key-files:
  created:
    - supabase/migrations/20260403_14_super_admin_rls_bypass.sql
  modified:
    - app/src/shared/types/index.ts
    - app/src/integrations/supabase/queries/members.ts
    - app/src/features/admin/components/SuperAdminPage.tsx
    - app/src/app/layouts/AppShell.tsx

key-decisions:
  - "SECURITY DEFINER function for super-admin RLS: avoids infinite recursion when policies check profiles table"
  - "Sidebar Super Admin link added post-plan: discovered missing during UAT"
  - "profiles_super_admin_update policy added: profiles_update was id=auth.uid() only, blocking suspend/unsuspend"

patterns-established:
  - "Super-admin RLS bypass: always use is_super_admin() SECURITY DEFINER function, not direct subquery"

duration: ~30min
started: 2026-04-03T00:00:00Z
completed: 2026-04-03T00:00:00Z
---

# Phase 23 Plan 01: Full Super Admin Panel Summary

**Two-tab Super Admin panel shipped: "Korisnici" tab adds full platform user management with status filter and suspend/unsuspend; RLS bypass migration enables cross-org profile visibility for super admins.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Tasks | 2 planned + 2 UAT fixes |
| Files modified | 5 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Super admin sees all users with status filter | Pass | 5-option filter (Svi / Na čekanju / Odobreni / Suspendirani / Odbijeni) |
| AC-2: Super admin can suspend and reinstate a user | Pass | Optimistic update; button toggles Suspendiraj ↔ Vrati pristup |
| AC-3: Existing "Odobrenje" tab unchanged | Pass | Phase 16 logic preserved verbatim |

## Accomplishments

- `fetchAllProfiles`, `suspendProfile`, `unsuspendProfile` added to members.ts and re-exported via lib/data
- SuperAdminPage rewritten with two-tab layout (Odobrenje unchanged, Korisnici new)
- `is_super_admin()` SECURITY DEFINER function + two new RLS policies enable cross-org profile reads and updates for super admins
- "Super Admin" sidebar nav item added, visible only when `appUser.isSuperAdmin === true`

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/shared/types/index.ts` | Modified | AppUser.status extended with 'suspended' |
| `app/src/integrations/supabase/queries/members.ts` | Modified | mapUser cast updated; fetchAllProfiles, suspendProfile, unsuspendProfile appended |
| `app/src/features/admin/components/SuperAdminPage.tsx` | Modified | Full rewrite: two-tab layout |
| `app/src/app/layouts/AppShell.tsx` | Modified | Super Admin sidebar nav item (isSuperAdmin guard) |
| `supabase/migrations/20260403_14_super_admin_rls_bypass.sql` | Created | is_super_admin() function + profiles_super_admin_select/update policies |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| SECURITY DEFINER function for RLS | Direct subquery `(SELECT is_super_admin FROM profiles WHERE id = auth.uid())` inside an RLS policy on profiles causes infinite recursion; SECURITY DEFINER bypasses RLS internally | Pattern for all future super-admin RLS policies |
| Sidebar Super Admin link added | Discovered during UAT: no entry point to /admin/approvals for new super admins | AppShell.tsx now shows link conditionally |
| profiles_super_admin_update policy added | Original profiles_update policy only allows `id = auth.uid()` — blocked suspend/unsuspend on other users | Super admin can now UPDATE any profile |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 2 | Essential UAT fixes, no scope creep |

### Auto-fixed Issues

**1. RLS blocked fetchAllProfiles and suspendProfile**
- **Found during:** UAT (Korisnici tab showed only 1 user)
- **Issue:** `profiles_select` policy limits visibility to own profile + org members; `profiles_update` policy limits to own profile only
- **Fix:** New migration adding `is_super_admin()` SECURITY DEFINER function + `profiles_super_admin_select` and `profiles_super_admin_update` policies
- **Files:** `supabase/migrations/20260403_14_super_admin_rls_bypass.sql`

**2. No sidebar entry point to Super Admin panel**
- **Found during:** UAT (user couldn't find /admin/approvals)
- **Issue:** Phase 16 deliberately hid the route; Phase 23 should surface it for super admins
- **Fix:** Added conditional `NavItem` in AppShell.tsx for `appUser.isSuperAdmin`
- **Files:** `app/src/app/layouts/AppShell.tsx`

## Next Phase Readiness

**Ready:**
- Full super admin user management operational
- Suspend/unsuspend flow works end-to-end
- RLS pattern established for future super-admin features (use `is_super_admin()`)
- Phase 23 complete — v1.2 milestone complete

**Concerns:**
- None

**Blockers:**
- None

---
*Phase: 23-full-super-admin, Plan: 01*
*Completed: 2026-04-03*
