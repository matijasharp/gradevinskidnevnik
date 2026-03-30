---
phase: 11-auth-provider
plan: 01
subsystem: auth
tags: [react-context, supabase-auth, auth-provider, use-auth]

requires:
  - phase: 10-router-scaffolding
    provides: AppRouter scaffold, ProtectedRoute/GuestRoute shells, routeConfig.ts

provides:
  - AuthProvider component with auth state context
  - useAuth() hook for consuming auth state
  - app/src/app/providers barrel
  - main.tsx wrapped with BrowserRouter + AuthProvider

affects: [12-navigate-migration, ProtectedRoute, GuestRoute]

tech-stack:
  added: []
  patterns:
    - "React Context + hook pattern for auth state (AuthProvider / useAuth)"
    - "Setters exposed via context (setAppUser, setCompany, setShowOnboarding) for post-onboarding mutations"

key-files:
  created:
    - app/src/app/providers/AuthProvider.tsx
    - app/src/app/providers/index.ts
  modified:
    - app/src/main.tsx
    - app/src/App.tsx

key-decisions:
  - "setAppUser, setCompany, setShowOnboarding exposed as setters from context — handleOnboarding mutates these after org creation"
  - "BrowserRouter added to main.tsx now; will be removed when Phase 12 activates RouterProvider/createBrowserRouter"
  - "googleTokens stays in AppContent — only cleanup effect added to watch user from context"

patterns-established:
  - "useAuth() throws if called outside AuthProvider — fail-fast guard"
  - "resolveUser is internal to AuthProvider — AppContent never directly calls auth resolution"

duration: ~15min
started: 2026-03-30T00:00:00Z
completed: 2026-03-30T00:00:00Z
---

# Phase 11 Plan 01: AuthProvider Extraction Summary

**Auth state (user, appUser, company, loading, showOnboarding) extracted from AppContent into AuthProvider context; main.tsx wrapped with BrowserRouter + AuthProvider; AppContent migrated to useAuth().**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 3 completed |
| Files created | 2 |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: AuthProvider provides auth state via context | Pass | useAuth() returns all 5 values + 3 setters; throws outside provider |
| AC-2: Auth lifecycle moved to AuthProvider | Pass | resolveUser + getSession + onAuthStateChange subscription verbatim in AuthProvider |
| AC-3: AppContent uses useAuth() — no duplicate auth state | Pass | Zero useState for user/appUser/company/loading/showOnboarding; no resolveUser in App.tsx |
| AC-4: googleTokens cleanup preserved | Pass | useEffect watching user → setGoogleTokens(null) present in AppContent |
| AC-5: Build passes, behavior unchanged | Pass | npm run build exits 0, no TypeScript errors |

## Accomplishments

- Decoupled auth lifecycle from AppContent — Phase 12 can now wire ProtectedRoute/GuestRoute guards without touching AppContent state
- Removed 5 auth useState + full auth useEffect (~80 lines) from AppContent
- Cleaned unused imports from App.tsx (SupabaseUser type, getSession, onAuthStateChange, fetchProfileByUserId, fetchOrganizationById, fetchInvitationByEmail, acceptInvitation, fetchProjectInvitationByEmail, acceptProjectInvitation, setAuthContext)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/app/providers/AuthProvider.tsx` | Created | Auth context, AuthProvider component, useAuth() hook |
| `app/src/app/providers/index.ts` | Created | Barrel export for providers |
| `app/src/main.tsx` | Modified | Wrapped App with BrowserRouter + AuthProvider |
| `app/src/App.tsx` | Modified | Removed 5 auth useState + auth useEffect; added useAuth() destructure + googleTokens cleanup effect; cleaned imports |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Expose setAppUser, setCompany, setShowOnboarding as setters from context | handleOnboarding in AppContent mutates these after creating an org — they must remain mutable from outside the provider | Phase 12 can rely on these being available from useAuth() |
| BrowserRouter in main.tsx (temporary) | Phase 12's ProtectedRoute/GuestRoute need useNavigate() which requires a router context; RouterProvider (createBrowserRouter) replaces this in Phase 12 | Phase 12 must update main.tsx again to remove BrowserRouter |
| googleTokens stays in AppContent | Out of scope for this phase; cleanup effect sufficient | No change to callers |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- useAuth() available anywhere inside AuthProvider subtree
- ProtectedRoute/GuestRoute can now call useAuth() to read user/loading for auth guards
- BrowserRouter in place — useNavigate() works in route components

**Concerns:**
- BrowserRouter will conflict with RouterProvider when Phase 12 activates AppRouter — must remove it from main.tsx in Phase 12

**Blockers:**
- None

---
*Phase: 11-auth-provider, Plan: 01*
*Completed: 2026-03-30*
