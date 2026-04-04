---
phase: 27-stripe-billing-foundation
plan: 01
subsystem: payments
tags: [stripe, billing, subscriptions, webhook, postgres, express]

requires:
  - phase: 26-pdf-export-enhancements
    provides: stable app baseline for billing layer

provides:
  - organizations.stripe_customer_id column (TEXT, nullable)
  - organizations.subscription_status column (TEXT NOT NULL DEFAULT 'free', CHECK constrained)
  - POST /api/billing/create-checkout-session — creates Stripe Checkout session for org upgrade
  - POST /api/stripe/webhook — handles subscription events, updates org status via service role

affects: [27-02-stripe-billing-foundation, billing UI, feature gating]

tech-stack:
  added: [stripe@^22.0.0]
  patterns:
    - Stripe client initialized as null when STRIPE_SECRET_KEY absent (graceful dev startup)
    - express.raw('/api/stripe/webhook') registered BEFORE express.json() for raw Buffer delivery
    - supabaseAdmin (service role client) for webhook DB writes that bypass RLS
    - Stripe customer created on-demand at checkout and stored in organizations.stripe_customer_id

key-files:
  created: [supabase/migrations/20260404_17_stripe_billing.sql]
  modified: [app/server.ts, app/.env]

key-decisions:
  - "Null-safe Stripe init: stripe = STRIPE_SECRET_KEY ? new Stripe(...) : null — server starts cleanly without keys in dev"
  - "subscription_status lives on organizations (not profiles) — billing is per-org, not per-user"
  - "CHECK constraint on subscription_status values: free, pro, cancelled, past_due"
  - "No client UPDATE policy on subscription_status — webhook (service role) is sole writer"

patterns-established:
  - "Billing endpoints return 503 with clear message when Stripe keys absent — no silent failures"
  - "Webhook handler: constructEvent with raw Buffer, then switch on event.type, supabaseAdmin for DB writes"
  - "Stripe customer created lazily at checkout (not at org creation) — avoids Stripe API calls for non-paying users"

duration: ~15min
started: 2026-04-04T00:00:00Z
completed: 2026-04-04T00:00:00Z
---

# Phase 27 Plan 01: Stripe Billing Foundation — Backend Summary

**Stripe billing DB schema + Express checkout/webhook endpoints: organizations now track `subscription_status` (default 'free') and `stripe_customer_id`, with Checkout session creation and subscription event handling wired into server.ts.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 2/2 completed |
| Files modified | 3 |
| Deviations | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Billing Columns in DB | Pass | Migration adds both columns with NOT NULL DEFAULT 'free' and CHECK constraint |
| AC-2: Checkout Session Endpoint | Pass | POST /api/billing/create-checkout-session creates customer + session, returns { url } |
| AC-3: Webhook Handler | Pass | constructEvent verifies signature; checkout.session.completed → 'pro'; subscription.deleted → 'cancelled'; payment_failed → 'past_due' |

## Accomplishments

- Migration `20260404_17_stripe_billing.sql` adds `stripe_customer_id` and `subscription_status` to organizations table; existing orgs default to `'free'`
- Two billing endpoints in server.ts: checkout session creation with lazy Stripe customer creation, and webhook handler with signature verification
- Stripe client and supabaseAdmin initialized at startup; Stripe gracefully absent in dev (null check on STRIPE_SECRET_KEY)
- `express.raw` registered before `express.json` — webhook receives raw Buffer required for `constructEvent`
- Four env vars documented in `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/migrations/20260404_17_stripe_billing.sql` | Created | Adds stripe_customer_id + subscription_status to organizations |
| `app/server.ts` | Modified | Stripe + supabaseAdmin init, express.raw middleware, 2 billing endpoints |
| `app/.env` | Modified | 4 new env vars documented with placeholder values |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Null-safe Stripe client (`stripe = key ? new Stripe() : null`) | Server must start cleanly in dev without Stripe keys; all billing routes return 503 gracefully | No dev friction; prod requires keys |
| `subscription_status` on `organizations`, not `profiles` | Billing is per-org — all members of an org share the same plan | Plan 02 reads from org context, not user context |
| No RLS UPDATE for `subscription_status` from client | Prevents client-side plan spoofing; webhook (service role) is sole writer | Security: plan status can't be escalated by users |
| `stripe_customer_id` stored after first checkout session | Avoids creating Stripe customers for orgs that never upgrade | Cleaner Stripe dashboard; no orphaned customers |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- `subscriptionStatus` queryable from `organizations` table for any org
- `/api/billing/create-checkout-session` ready to call from BillingPage
- Webhook handler live — once STRIPE_WEBHOOK_SECRET is set, subscription events auto-update org status
- `stripe` npm package installed (`^22.0.0`)

**Concerns:**
- Env vars need real values before billing is functional: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- Migration not yet applied to production Supabase — must run before Plan 02 frontend can read `subscription_status`
- Stripe webhook endpoint URL (`APP_URL/api/stripe/webhook`) must be registered in Stripe Dashboard → Webhooks

**Blockers:**
- None for Plan 02 (frontend can be built against the schema; live testing requires env vars)

---
*Phase: 27-stripe-billing-foundation, Plan: 01*
*Completed: 2026-04-04*
