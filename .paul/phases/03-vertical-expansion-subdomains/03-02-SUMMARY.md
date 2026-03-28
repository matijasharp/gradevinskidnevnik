---
phase: 03-vertical-expansion-subdomains
plan: 02
subsystem: ui
tags: [discipline, subdomain, routing, onboarding, typescript, react]

requires:
  - phase: 03-vertical-expansion-subdomains/03-01
    provides: disciplineConfig.ts with Discipline type, DISCIPLINE_LABELS, getPhases/getWorkTypes helpers; discipline column on organizations

provides:
  - detectDisciplineFromSubdomain() — reads hostname subdomain prefix or ?discipline= param, falls back to 'electro'
  - DISCIPLINE_SUBTITLES — per-discipline login screen copy
  - SUBDOMAIN_DISCIPLINE_MAP — elektro/voda/klima → Discipline
  - createOrganizationWithOwner now accepts and inserts discipline explicitly
  - Login screen subtitle adapts to detected discipline
  - Onboarding discipline selector pre-filled from URL context

affects:
  - 04-master-workspace (orgs now always have explicit discipline from creation; no default fallback needed)

tech-stack:
  added: []
  patterns:
    - detectDisciplineFromSubdomain() — call at app init to get URL-driven discipline context; supports prod subdomain and dev ?discipline= param
    - DISCIPLINE_SUBTITLES[discipline] — pattern for any discipline-aware copy (extend for future screens)

key-files:
  created: []
  modified:
    - app/src/lib/disciplineConfig.ts
    - app/src/lib/data.ts
    - app/src/App.tsx

key-decisions:
  - "onboardingDiscipline initialized from detectDisciplineFromSubdomain() directly (not from contextDiscipline state) — avoids state dependency at init time"
  - "discipline param in createOrganizationWithOwner typed inline as 'electro' | 'water' | 'klima' — avoids circular import from disciplineConfig"
  - "Login screen h1 kept unchanged (Site Diary Mini) — subtitle-only adaptation per plan boundaries"

patterns-established:
  - "detectDisciplineFromSubdomain() — call once at app init; hostname split('.')[0] → SUBDOMAIN_DISCIPLINE_MAP lookup → ?discipline= param fallback → 'electro'"
  - "DISCIPLINE_SUBTITLES[contextDiscipline] — pattern for any screen needing discipline-specific copy"

duration: 20min
started: 2026-03-28T00:35:00Z
completed: 2026-03-28T00:55:00Z
---

# Phase 3 Plan 02: Subdomain Routing and UX Polish — Summary

**Discipline detected from URL subdomain/param flows into login screen copy and onboarding org creation — new orgs always have explicit discipline from first touch.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 2/2 completed |
| Files modified | 3 |
| Files created | 0 |
| Qualify results | PASS × 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Discipline detected from URL | Pass | hostname subdomain prefix + ?discipline= param fallback; returns Discipline, defaults 'electro' |
| AC-2: Login screen reflects detected discipline | Pass | Subtitle driven by DISCIPLINE_SUBTITLES[contextDiscipline]; h1 unchanged |
| AC-3: New org created with detected discipline | Pass | onboardingDiscipline state pre-filled from detection; passed to createOrganizationWithOwner; inserted explicitly in DB |

## Accomplishments

- Added `detectDisciplineFromSubdomain()` to `disciplineConfig.ts` — reads hostname prefix (elektro/voda/klima) or `?discipline=` param for dev; exported alongside SUBDOMAIN_DISCIPLINE_MAP and DISCIPLINE_SUBTITLES
- Extended `createOrganizationWithOwner` in `data.ts` to accept optional `discipline` param; always inserts explicitly (no longer relies on DB DEFAULT)
- Wired detection into App.tsx: `contextDiscipline` state, discipline-adaptive login subtitle, onboarding discipline selector (Struka) pre-filled from URL context

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/lib/disciplineConfig.ts` | Modified | Added SUBDOMAIN_DISCIPLINE_MAP, DISCIPLINE_SUBTITLES, detectDisciplineFromSubdomain() |
| `app/src/lib/data.ts` | Modified | discipline?: 'electro'\|'water'\|'klima' param on createOrganizationWithOwner; inserted explicitly in organizations row |
| `app/src/App.tsx` | Modified | Added DISCIPLINE_SUBTITLES + detectDisciplineFromSubdomain imports; contextDiscipline + onboardingDiscipline state; login subtitle adaptive; onboarding discipline selector; handleOnboarding passes discipline |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| onboardingDiscipline init calls detectDisciplineFromSubdomain() directly | Avoids useState dependency on contextDiscipline at init time | Clean initialization; both states are synchronously correct |
| Inline type for discipline param in data.ts | Avoids circular import (data.ts → disciplineConfig.ts) | No circular dep; type matches Company.discipline exactly |
| h1 "Site Diary Mini" unchanged | Plan boundaries: subtitle-only adaptation | No redesign scope creep |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixed | 0 | — |
| Scope additions | 0 | — |
| Deferred | 0 | — |

**Total impact:** Plan executed exactly as written. No deviations.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- All orgs now have discipline set explicitly from creation (never relies on DB DEFAULT)
- detectDisciplineFromSubdomain() available globally — Phase 4 master workspace can use it for cross-discipline aggregation context
- Subdomain routing is fully wired: landing on voda.* → water discipline throughout the flow

**Concerns:**
- No actual DNS/subdomain configuration exists (UX-only per PROJECT.md) — production subdomain setup deferred to deployment
- Subdomain detection reads at mount time; if URL changes without page reload, contextDiscipline won't update (acceptable for SPA)

**Blockers:**
- None

---
*Phase: 03-vertical-expansion-subdomains, Plan: 02*
*Completed: 2026-03-28*
