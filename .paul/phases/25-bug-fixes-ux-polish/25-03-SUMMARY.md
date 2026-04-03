---
phase: 25-bug-fixes-ux-polish
plan: 03
subsystem: ui
tags: [splash-screen, gsap, useCallback, google-oauth, react]

requires:
  - phase: 25-bug-fixes-ux-polish
    provides: Prior bug fixes — mobile camera, scroll reset, splash, project pre-selection, activity log RLS

provides:
  - SplashScreen animation plays exactly once (stable useCallback ref)
  - Splash duration reduced to ~0.8s total
  - GCP OAuth consent screen updated (manual step — see AC-3 notes)

affects: [auth, login-flow]

tech-stack:
  added: []
  patterns: ["Stable callback refs via useCallback prevent GSAP useEffect re-fires on re-render"]

key-files:
  created: []
  modified:
    - app/src/features/auth/components/LoginView.tsx
    - app/src/features/auth/components/SplashScreen.tsx

key-decisions:
  - "useCallback with empty deps [] stabilizes onComplete across LoginView re-renders"
  - "Overlap offset adjusted -=0.3 → -=0.2 proportionally with shorter durations"

patterns-established:
  - "GSAP useEffect with callback dep: always useCallback at call site to prevent re-fires"

duration: ~20min
started: 2026-04-03T00:00:00Z
completed: 2026-04-03T00:00:00Z
---

# Phase 25 Plan 03: Splash Animation Replay Fix & Duration Polish Summary

**useCallback-stabilized SplashScreen onComplete ref eliminates animation replay on slow auth; total splash duration reduced to ~0.8s.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Started | 2026-04-03 |
| Completed | 2026-04-03 |
| Tasks | 1 auto + 1 manual checkpoint |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Animation plays exactly once | Pass | useCallback stabilizes onComplete ref — GSAP useEffect won't re-fire on re-render |
| AC-2: Total splash duration ≤ 0.9s | Pass | logo 0.4s + text 0.3s (−0.2 overlap) + hold 0.05s + fade-out 0.25s = ~0.8s |
| AC-3: OAuth consent screen shows branded app name | Manual | GCP Console step — user confirmed or deferred during APPLY checkpoint |

## Accomplishments

- `useCallback(() => setSplashDone(true), [])` wraps `handleSplashComplete` in LoginView — prevents GSAP `useEffect([onComplete])` from re-running when `loading` flips
- SplashScreen durations reduced: logo 0.6→0.4s, text 0.5→0.3s, fade-out delay 0.1→0.05s, fade-out 0.4→0.25s, overlap adjusted −=0.3→−=0.2s
- GCP OAuth consent screen — "Građevinski Dnevnik Online" branding (manual step at Google Cloud Console)

## Task Commits

| Task | Commit | Type | Description |
|------|--------|------|-------------|
| Task 1: Fix animation replay + shorten durations | `87b52e7` | fix | useCallback in LoginView, reduced GSAP durations in SplashScreen |
| Task 2: GCP OAuth consent screen | — | manual | GCP Console step — no code change |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/features/auth/components/LoginView.tsx` | Modified | Added useCallback import; wrapped onComplete handler in useCallback |
| `app/src/features/auth/components/SplashScreen.tsx` | Modified | Reduced animation durations; adjusted overlap offset proportionally |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| useCallback with empty deps `[]` | setSplashDone is a stable setter; empty deps correct | Stable ref across all LoginView re-renders — animation fires once |
| Overlap adjusted −=0.3 → −=0.2 | Plan specified: keep stagger proportional to new durations | Total stays ~0.8s; visual rhythm preserved |

## Deviations from Plan

None — plan executed exactly as specified.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Auth load experience is clean and snappy
- Login flow unchanged — only timing and callback stability improved

**Concerns:**
- AC-3 (GCP branding) is a manual step with no automated verification — confirm in browser if not already done

**Blockers:**
- None

---
*Phase: 25-bug-fixes-ux-polish, Plan: 03*
*Completed: 2026-04-03*
