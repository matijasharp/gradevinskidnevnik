---
phase: 20-edge-functions
plan: 01
subsystem: infra
tags: [supabase, edge-functions, deno, resend, email, invitations]

requires:
  - phase: 19-supabase-local-config
    provides: supabase client (lib/supabase.ts), config.toml with edge_runtime enabled

provides:
  - supabase/functions/send-invitation — Deno Edge Function for email invitations via Resend
  - OrganizationProvider.inviteUser() calls Edge Function instead of Express /api/invite

affects: [phase 21 — Resend email enhancements build on this Edge Function]

tech-stack:
  added: []
  patterns:
    - "Supabase Edge Function pattern: serve() + CORS headers + Deno.env.get() for secrets"
    - "Resend called via fetch() REST API (no SDK) — Deno-compatible pattern for all future email functions"

key-files:
  created: [supabase/functions/send-invitation/index.ts]
  modified: [app/src/app/providers/OrganizationProvider.tsx]

key-decisions:
  - "Resend via fetch REST API (not SDK) — SDK has no Deno build; direct fetch works in all runtimes"
  - "Express /api/invite endpoint kept — not removed; acts as fallback during transition"

patterns-established:
  - "Edge Function structure: OPTIONS → env check → fetch Resend → return JSON response"
  - "Frontend invocation: supabase.functions.invoke('fn-name', { body: {...} })"

duration: ~15min
started: 2026-04-01T00:00:00Z
completed: 2026-04-01T00:00:00Z
---

# Phase 20 Plan 01: send-invitation Edge Function Summary

**Email invitation delivery moved from Express /api/invite to a Supabase Edge Function calling Resend REST API; OrganizationProvider.inviteUser() updated to invoke it.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 2 completed |
| Files modified | 2 |
| Build | ✅ passed (14.11s) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Edge Function exists and sends email | Pass | Deno function at supabase/functions/send-invitation/index.ts; calls Resend REST API with correct headers and HTML |
| AC-2: Frontend calls Edge Function (not Express) | Pass | OrganizationProvider.tsx uses supabase.functions.invoke('send-invitation', …); no fetch('/api/invite') remaining |
| AC-3: Missing API key handled gracefully | Pass | Returns `{ sent: false, reason: 'no_api_key' }` with status 200 when RESEND_API_KEY not set |

## Accomplishments

- Deno Edge Function created — handles CORS, env secrets, Resend REST API call, graceful missing-key path, Resend error path
- HTML email template copied exactly from server.ts (same Croatian copy, styling, CTA button, footer)
- OrganizationProvider.inviteUser() now calls supabase.functions.invoke() — no Express server dependency for email delivery
- `npm run build` passes clean

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/functions/send-invitation/index.ts` | Created | Deno Edge Function — email invitations via Resend REST API |
| `app/src/app/providers/OrganizationProvider.tsx` | Modified | Added supabase import; replaced fetch('/api/invite') with supabase.functions.invoke() |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Resend via fetch REST API, not SDK | Resend SDK has no Deno/ESM build; direct fetch to api.resend.com works in all runtimes | Pattern for all future email Edge Functions |
| Express /api/invite kept in server.ts | Boundary: plan explicitly excluded removal; transition safety | Can be removed in a cleanup phase post-launch |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Edge Function directory established at `supabase/functions/`
- CORS + Deno.env pattern proven — reusable for generate-pdf (Plan 20-02)
- supabase.functions.invoke() wiring pattern confirmed in OrganizationProvider

**Concerns:**
- Edge Function secrets (RESEND_API_KEY, RESEND_FROM) must be set via `supabase secrets set` before production deploy — not yet done; noted for deployment checklist

**Blockers:**
- None — Plan 20-02 (generate-pdf) can proceed immediately

---
*Phase: 20-edge-functions, Plan: 01*
*Completed: 2026-04-01*
