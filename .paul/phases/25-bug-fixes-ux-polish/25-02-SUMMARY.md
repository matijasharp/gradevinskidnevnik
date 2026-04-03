---
phase: 25-bug-fixes-ux-polish
plan: 02
subsystem: infra
tags: [google-oauth, google-calendar, supabase-auth, railway, env]

requires:
  - phase: 20-edge-functions
    provides: Express server with Google Calendar OAuth flow at /api/auth/google/url + /auth/google/callback

provides:
  - Google Calendar OAuth working end-to-end on production
  - Supabase Auth Site URL set to production domain
  - GCP credentials configured for production domain

affects: [27-stripe-billing, any future OAuth integrations]

tech-stack:
  added: []
  patterns: ["APP_URL env var drives all OAuth redirect URIs — never hardcode domain in server.ts"]

key-files:
  created: []
  modified: [app/.env.example]

key-decisions:
  - "APP_URL on Railway must match GCP authorized redirect URI exactly"
  - "JS origins in GCP must include production domain for popup OAuth to work"

patterns-established:
  - "Google OAuth popup flow: JS origin = app domain, redirect URI = app domain/auth/google/callback"

duration: ~30min
started: 2026-04-03T00:00:00Z
completed: 2026-04-03T00:00:00Z
---

# Phase 25 Plan 02: Google Calendar OAuth Fix Summary

**Google Calendar OAuth flow working on production — GCP credentials, Supabase Auth URL, and Railway APP_URL all aligned to elektro.gradevinskidnevnik.online.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~30 min |
| Tasks | 4 completed (2 human-action, 1 auto, 1 human-verify) |
| Files modified | 1 (.env.example — already correct, no change needed) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Google Calendar OAuth completes successfully | Pass | Popup opens, account selection works, OAuth flow completes. "App not verified" warning shown (expected — testing mode) |
| AC-2: Supabase Auth URL config includes production domain | Pass | Site URL = https://elektro.gradevinskidnevnik.online, redirect allowlist updated |
| AC-3: APP_URL env var set on Railway | Pass | Confirmed set to https://elektro.gradevinskidnevnik.online; redirect_uri in OAuth URL matches GCP registration |

## Accomplishments

- Supabase Auth Site URL set to production domain with `/**` wildcard redirect allowlist
- GCP OAuth 2.0 Client ID updated: added `https://elektro.gradevinskidnevnik.online` to JS origins and `/auth/google/callback` to redirect URIs
- Railway `APP_URL` confirmed correct — Express server generates correct redirect_uri at runtime
- `.env.example` already had APP_URL documented (no change needed)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/.env.example` | No change needed | APP_URL was already documented with production/local notes |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| "App not verified" warning is not a bug | App is in testing mode; warning is Google's standard for unverified apps. Users can proceed via Advanced → Continue | Google verification submission is a separate process, deferred |
| Keep both localhost + production in GCP credentials | Local dev OAuth must continue to work | No regression for local development |

## Deviations from Plan

None — plan executed as written. `.env.example` was already correctly documented so Task 3 required no file change.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Google Calendar OAuth was never configured for production (only localhost existed) | Added production JS origin + redirect URI to GCP credentials |
| "App not verified" warning on OAuth consent screen | Expected for testing mode — not a code bug. Deferred to Google verification submission |

## Next Phase Readiness

**Ready:**
- Google Calendar OAuth works on production for test users
- GCP credentials support both local dev and production simultaneously
- Supabase Auth URL correctly configured for production domain

**Concerns:**
- "App not verified" warning will show to all users until Google verification is submitted and approved. Test users (added in GCP console) bypass this warning.

**Blockers:**
- None

---
*Phase: 25-bug-fixes-ux-polish, Plan: 02*
*Completed: 2026-04-03*
