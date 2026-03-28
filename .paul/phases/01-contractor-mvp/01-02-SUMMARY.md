---
phase: 01-contractor-mvp
plan: 02
subsystem: auth, api, ui
tags: [supabase, firebase-migration, resend, email, invitations, crud, rls]

requires:
  - phase: 01-contractor-mvp plan 01
    provides: Supabase schema, RLS policies, security-definer functions, read subscriptions

provides:
  - Supabase auth fully replaces Firebase (Google OAuth, onboarding, session)
  - Complete CRUD write layer for projects, diary entries, photos, users
  - Email invitation flow via Resend API
  - Pending invitations visible and revocable in Korisnici view

affects: 01-03, 02-01

tech-stack:
  added: [resend@6.9.4]
  patterns:
    - Server-side email via Express /api/invite + Resend SDK
    - Supabase real-time subscription pattern (subscribeWithFetch)
    - Graceful degradation — email skipped if RESEND_API_KEY absent, DB record still saved

key-files:
  modified:
    - app/src/lib/data.ts
    - app/src/App.tsx
    - app/server.ts
    - app/.env

key-decisions:
  - "Resend via Express server endpoint — keeps API key server-side, not exposed to client"
  - "Pending invitations use live Supabase subscription — auto-removes on acceptance"
  - "onboarding@resend.dev as dev sender — no domain verification required for testing"

patterns-established:
  - "Invite flow: DB insert (createInvitation) → email send (/api/invite) → UI state update via subscription"
  - "All Supabase write helpers in data.ts, called from App.tsx handlers"

duration: ~90min
started: 2026-03-28T00:00:00Z
completed: 2026-03-28T00:00:00Z
---

# Phase 1 Plan 02: Core CRUD + Invitation Flow Summary

**Full Supabase CRUD layer live with email invitations via Resend; pending invites visible and revocable in Korisnici.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~90 min |
| Tasks | 2 completed + 1 checkpoint resolved |
| Files modified | 4 |
| Scope additions | 2 (email delivery, pending invites UI) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Supabase auth replaces Firebase | Pass | Confirmed in prior session — OAuth, onboarding, dashboard all working |
| AC-2: Core CRUD writes use Supabase | Pass | All write helpers in data.ts, no Firebase references in App.tsx, build + lint clean |
| AC-3: Invitation flow works with Supabase | Pass | Confirmed by user — invite creates DB record, email delivered, invited user auto-joins org |

## Accomplishments

- All CRUD write helpers implemented in `data.ts` — projects, diary entries, photos, users, invitations
- Firebase fully removed from `App.tsx` — zero import references remain
- Resend API wired via Express `/api/invite` — API key stays server-side
- Pending invitations section added to Korisnici — live subscription, revocable with X button

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/lib/data.ts` | Modified | Added `deleteDiaryEntry`, `subscribePendingInvitations`, `cancelInvitation`; exported `Invitation` interface |
| `app/src/App.tsx` | Modified | `inviteUser` calls `/api/invite`; `pendingInvitations` state + subscription; `cancelInvitation` action; UsersView pending section |
| `app/server.ts` | Modified | Added Resend import + `POST /api/invite` endpoint with Croatian email template |
| `app/.env` | Modified | Added `RESEND_API_KEY` and `RESEND_FROM=onboarding@resend.dev` |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Resend call via `/api/invite` server endpoint | Keeps API key off client bundle | All invite emails route through Express |
| `onboarding@resend.dev` as dev sender | No domain verification needed for testing | Swap to custom domain when deploying |
| Graceful fallback if no API key | Invitation still saved to DB even if email fails | Prevents hard failures in dev/CI |
| Pending invites via real-time subscription | Auto-disappears when accepted — no manual refresh | Clean UX, consistent with rest of app |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Gap fix | 1 | `deleteDiaryEntry` was missing from data.ts spec — added |
| Scope additions | 2 | Resend email + pending invites UI (user-requested during verification) |

### Auto-fixed Issues

**1. Missing `deleteDiaryEntry` in data.ts**
- **Found during:** Task 2 qualify
- **Issue:** Plan spec listed diary entries (create/update/delete) but `deleteDiaryEntry` was absent
- **Fix:** Added 7-line function matching existing delete pattern
- **Verification:** lint + build clean

### Scope Additions

**1. Resend email delivery for invitations**
- User confirmed invite record saved to DB but no email was sent — added server-side Resend integration

**2. Pending invitations display in Korisnici**
- User requested visibility of pending invites with ability to revoke — added "Čekaju prihvaćanje" section

## Next Phase Readiness

**Ready:**
- Supabase is sole data source — all reads and writes go through it
- Auth, CRUD, invitations, real-time subscriptions all stable
- Server has pattern for adding API integrations (Resend joins Google Calendar)

**Concerns:**
- `App.tsx` is ~1,750 lines (monolith) — manageable for 01-03 but Phase 2+ may benefit from component extraction
- `RESEND_FROM` needs a verified custom domain before production deploy

**Blockers:** None

---
*Phase: 01-contractor-mvp, Plan: 02*
*Completed: 2026-03-28*
