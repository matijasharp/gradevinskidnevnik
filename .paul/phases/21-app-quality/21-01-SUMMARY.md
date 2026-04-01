---
phase: 21-app-quality
plan: 01
subsystem: ui
tags: [react, react-router, tailwind, calendar]

requires:
  - phase: 20-edge-functions
    provides: deployed edge functions; project/diary data available in calendar

provides:
  - Day view calendar cards navigate to /projects/:id on click
  - Mobile arrow buttons visible and tappable (32×32px, flex-centered)

affects: []

tech-stack:
  added: []
  patterns: [useNavigate inside feature component for card-level navigation]

key-files:
  modified: [app/src/features/calendar/components/CalendarView.tsx]

key-decisions:
  - "useNavigate called directly in CalendarView — no ROUTES import needed for /projects/:id"
  - "Raw <button> for arrow nav instead of Button component size=icon — local fix, no Button API change"

patterns-established:
  - "Card-level onClick navigation: onClick={() => navigate(`/projects/${id}`)} + cursor-pointer hover:opacity-80"

duration: ~5min
started: 2026-04-01T00:00:00Z
completed: 2026-04-01T00:00:00Z
---

# Phase 21 Plan 01: Calendar Navigation & Mobile Arrow Fix

**Day view project and diary entry cards now navigate to `/projects/:id`; mobile prev/next arrows replaced with raw `<button>` elements guaranteeing 32×32px centered tap targets.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~5 min |
| Tasks | 2 completed |
| Files modified | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Day view project click → `/projects/:id` | Pass | onClick on project card div |
| AC-2: Day view diary entry click → `/projects/:projectId` | Pass | onClick on diary entry card div |
| AC-3: Mobile arrow buttons visible and tappable | Pass | Raw `<button>` with `flex items-center justify-center h-8 w-8` |

## Accomplishments

- Added `useNavigate` + `navigate()` calls to both day view card types — zero props changed
- Replaced three `<Button size="icon">` arrow elements with raw `<button>` elements eliminating padding collapse on mobile
- `npm run build` passes with no TypeScript errors

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/features/calendar/components/CalendarView.tsx` | Modified | Added useNavigate import, navigate hook, onClick handlers on day view cards, replaced arrow Buttons |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| No ROUTES import — template literal `/projects/${id}` | ROUTES.PROJECTS pattern not set up for dynamic segments; direct string is idiomatic | Consistent with existing navigation patterns |
| Raw `<button>` for arrows, not Button size variant | Boundary: Button component not to be modified; local fix only | No API surface change |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Phase 21 plan 01 complete; calendar navigation functional
- Phase 21 plan 02 (if planned) can build on this

**Concerns:**
- None

**Blockers:**
- None

---
*Phase: 21-app-quality, Plan: 01*
*Completed: 2026-04-01*
