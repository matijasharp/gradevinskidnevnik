---
phase: 27-stripe-billing-foundation
plan: 02
subsystem: payments
tags: [stripe, billing, react, context, feature-gating, ui]

requires:
  - phase: 27-stripe-billing-foundation (plan 01)
    provides: subscription_status column on organizations, checkout/webhook endpoints

provides:
  - subscriptionStatus + stripeCustomerId exposed via useOrg() context
  - BillingPage at /billing — current plan display, upgrade CTA
  - Sidebar "Pretplata" nav link (desktop, all authenticated users)
  - Free-tier project creation gate (cap at 3 active projects)

affects: [future feature gating, billing UI extensions]

tech-stack:
  added: []
  patterns:
    - subscriptionStatus fetched once on org load in OrganizationProvider (one-time, no realtime)
    - Client-side feature gate via isGated flag in page component (not RLS)
    - Upgrade flow: fetch POST → window.open(url, '_blank') — no Stripe.js SDK needed

key-files:
  created: [app/src/features/billing/BillingPage.tsx]
  modified:
    - app/src/app/providers/OrganizationProvider.tsx
    - app/src/app/router/routeConfig.ts
    - app/src/App.tsx
    - app/src/app/layouts/AppShell.tsx
    - app/src/features/projects/components/NewProjectPage.tsx

key-decisions:
  - "Route added to App.tsx (not AppRouter.tsx) — all page routes live in App.tsx's <Routes>"
  - "subscriptionStatus fetched in OrganizationProvider (not AuthProvider) — billing is org-level"
  - "Gate counts only active projects, not completed/archived"
  - "Client-side gate only — server-side RLS enforcement deferred"

patterns-established:
  - "Feature gate pattern: const isGated = subscriptionStatus === 'free' && count >= limit; if (isGated) return <GateUI />"
  - "Upgrade CTA: navigate to /billing — centralized, not inline checkout triggers per-page"

duration: ~20min
started: 2026-04-04T00:00:00Z
completed: 2026-04-04T00:00:00Z
---

# Phase 27 Plan 02: Stripe Billing Foundation — Frontend Summary

**BillingPage at /billing with Free/Pro plan display and upgrade CTA; subscriptionStatus flows from DB → OrgContext → UI; free-tier orgs capped at 3 active projects with a gate in NewProjectPage.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 3/3 completed |
| Files modified | 5 |
| Files created | 1 |
| Deviations | 1 (minor, architectural) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Subscription Status in Context | Pass | useOrg().subscriptionStatus returns 'free' default; fetched from organizations on org load |
| AC-2: Billing Page Visible | Pass | /billing renders Free/Pro columns with feature lists |
| AC-3: Upgrade Flow Starts | Pass | "Nadogradi na Pro" POSTs to /api/billing/create-checkout-session, opens URL in new tab |
| AC-4: Free Tier Project Gate | Pass | isGated = subscriptionStatus === 'free' && activeProjectCount >= 3; shows lock screen with /billing CTA |

## Accomplishments

- `subscriptionStatus` and `stripeCustomerId` added to OrgContextValue, fetched on `appUser.companyId` change, exposed via `useOrg()`
- `BillingPage` created at `app/src/features/billing/BillingPage.tsx` — shows active plan badge, feature lists, upgrade button with loading/error states, billing contact email
- `/billing` route registered in `routeConfig.ts` and `App.tsx`; "Pretplata" nav item added to sidebar with `CreditCard` icon from lucide-react
- `NewProjectPage` gates project creation for free orgs with ≥3 active projects — shows lockscreen with "Nadogradi na Pro" → /billing CTA

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/features/billing/BillingPage.tsx` | Created | Billing page: plan display, upgrade flow, billing contact |
| `app/src/app/providers/OrganizationProvider.tsx` | Modified | Added subscriptionStatus + stripeCustomerId state, fetch effect, context exposure |
| `app/src/app/router/routeConfig.ts` | Modified | Added BILLING: '/billing' |
| `app/src/App.tsx` | Modified | BillingPage import + Route for /billing |
| `app/src/app/layouts/AppShell.tsx` | Modified | CreditCard import, "Pretplata" NavItem in sidebar |
| `app/src/features/projects/components/NewProjectPage.tsx` | Modified | Free-tier project creation gate |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Route added to App.tsx not AppRouter.tsx | All page routes live in App.tsx `<Routes>`; AppRouter.tsx only has /landing and `*` wildcard | Follows actual codebase pattern; plan spec was written against assumed AppRouter structure |
| Gate counts only `status === 'active'` projects | Completed/archived projects don't consume capacity; aligns with business intent | Users can complete projects to free up slots without upgrading |
| Client-side gate only | Server-side enforcement is a future hardening task; client gate is sufficient for trust-based MVP | Plan boundary respected; noted in concerns |
| Sidebar nav visible to all authenticated users | All users should be able to see their plan and upgrade — not admin-gated | Any team member can initiate upgrade conversation |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 1 | None — correct architectural choice |

**Total impact:** Zero functional impact; more correct than plan spec.

### Auto-fixed Issues

**1. Routing — Route added to App.tsx instead of AppRouter.tsx**
- **Found during:** Task 2 (BillingPage + route)
- **Issue:** Plan spec said `AppRouter.tsx` but all page routes live in `App.tsx <Routes>`. AppRouter.tsx only has `/landing` and `*` wildcard.
- **Fix:** Added route to App.tsx following the established pattern
- **Files:** `app/src/App.tsx` (instead of `app/src/app/router/AppRouter.tsx`)
- **Verification:** Build passes; `/billing` resolves correctly

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Billing foundation complete — DB schema, backend endpoints, frontend UI all in place
- Pattern established for additional feature gates (just check `subscriptionStatus` from `useOrg()`)
- `/billing` is the canonical upgrade entry point for future upsell flows

**Concerns:**
- Gate is client-side only — a motivated user could bypass via DevTools; server-side enforcement should be added in a future hardening phase
- Stripe env vars (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) must be populated in Railway before billing is functional
- Migration `20260404_17_stripe_billing.sql` must be applied to production Supabase
- Stripe webhook URL must be registered in Stripe Dashboard pointing to `APP_URL/api/stripe/webhook`

**Blockers:**
- None for future phases

---
*Phase: 27-stripe-billing-foundation, Plan: 02*
*Completed: 2026-04-04*
