# Project State

## Project Reference

See: .paul/PROJECT.md (updated 2026-03-29)

**Core value:** Contractors log site progress fast while project leads see shared, audited status across all disciplines.
**Current focus:** v1.1 — Frontend Architecture Refactor. Phase 5 complete, ready to plan Phase 6.

## Current Position

Milestone: v1.1 — Frontend Architecture Refactor
Phase: 6 of 14 (Shared UI Primitives) — Not started
Plan: Not started
Status: Ready to plan
Last activity: 2026-03-29 — Phase 5 complete, transitioned to Phase 6

Progress:
- v1.1 Milestone: [█░░░░░░░░░] 10% (1/10 phases)
- Phase 6: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete — ready for next PLAN]
```

## Performance Metrics

**Velocity (v1.0):**
- Total plans completed: 14
- Average duration: ~46 min
- Total execution time: ~10.8 hours

**Velocity (v1.1 so far):**
- Plans completed: 1
- Duration: ~35 min

**By Phase (v1.0):**

| Phase | Plans | Total Time | Avg/Plan |
|-------|-------|------------|----------|
| 01-contractor-mvp | 3/3 ✅ | ~210 min | 70 min |
| 02-multi-tenant | 3/3 ✅ | ~180 min | 60 min |
| 03-vertical-expansion-subdomains | 2/2 ✅ | ~55 min | 28 min |
| 04-master-project-workspace | 4/4 ✅ | ~195 min | 49 min |

**By Phase (v1.1):**

| Phase | Plans | Total Time | Avg/Plan |
|-------|-------|------------|----------|
| 05-types-utilities | 1/1 ✅ | ~35 min | 35 min |

## Accumulated Context

### Decisions

| Decision | Phase | Impact |
|----------|-------|--------|
| Supabase-first backend | Phase 1 | Enables RLS and avoids migration later |
| Keep all prototype features | Phase 1 | Phase scope includes advanced features |
| Serverless OAuth | Phase 1 | Integrations handled outside frontend |
| base64 fallback for Storage uploads | Phase 1 | No entry loss on Storage errors; older entries display fine |
| No logo/signature migration to Storage | Phase 1 | MVP scope limit; base64 acceptable for small assets |
| Dual FK on project_members.user_id | Phase 2 | auth.users (original) + public.profiles (PostgREST join) — pattern for future profile joins |
| Dijeljeni projekti always visible | Phase 2 | Empty state shown; section always rendered for discoverability |
| FK join hint for assigned_to | Phase 2 | profiles!project_tasks_assigned_to_fkey(name) — pattern for all future profile joins via named FK |
| Toggle allowed for cross-org members | Phase 2 | Readonly members can check tasks; add/delete blocked by RLS |
| Storage bucket public for documents | Phase 2 | Public URL access; table RLS gates metadata visibility |
| Audit log deferred to Phase 4 | Phase 2 | MVP value complete without it; fits master workspace better |
| discipline NOT NULL DEFAULT 'electro' | Phase 3 | Existing orgs auto-classified; no data migration needed |
| Phase type widened to string | Phase 3 | Discipline determines valid phases at runtime via disciplineConfig.ts |
| detectDisciplineFromSubdomain: hostname then ?discipline= param | Phase 3 | Prod subdomain routing + dev testing without DNS setup |
| discipline typed inline in createOrganizationWithOwner | Phase 3 | Avoids circular import between data.ts and disciplineConfig.ts |
| Separate master_projects table (not reusing projects) | Phase 4 | Clean separation — master projects have no diary entries or org-level phases |
| RLS on master_project_organizations: owner OR direct org_id | Phase 4 | Avoids self-referencing recursive subquery that would infinite-loop in Postgres |
| createMasterProject auto-links owner org as lead | Phase 4 | Every master project starts with at least one participant; no manual step needed |
| 'general' discipline for PM/coordinator orgs | Phase 4 | Master project owners are not specialty trades; prevents misclassification |
| master_project_issues INSERT allows all participants | Phase 4 | Any linked org can report issues; cross-discipline collaboration |
| Issue status cycle on badge click | Phase 4 | Mobile-friendly; no dropdown needed for MVP |
| Extract-and-import pattern for refactor | v1.1 | Create new file → import → verify → remove inline. Never delete before proven working |
| npm run build must pass after every phase | v1.1 | Governing constraint — nothing gets broken |
| data.ts re-exports from shared/types | Phase 5 | Preserves App.tsx line 106 import compat without churn across all phases |

### Deferred Issues

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| Audit log (activity feed) | Phase 2 | Medium | v1.2 Backend Infrastructure |
| DNS/subdomain production setup | Phase 3 | Low | Deployment (post-MVP) |
| Issue edit/delete/comments | Phase 4 | Low | Post v1.1 |
| Sub-projects (parent_project_id) | Architecture audit | Medium | Post v1.1 |
| Contractor→master project linking UI | Architecture audit | Low | Post v1.1 |
| Investor/client access portal | Architecture audit | High | Future milestone |

### Blockers/Concerns

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| None | - | - |

### Git State

Last commit: 9566858 — feat(04-master-project-workspace): Phase 4 complete — master workspace + issue tracking
Branch: main
Remote: https://github.com/matijasharp/gradevinskidnevnik.git
Feature branches merged: none
*Note: Phase 5 changes staged, commit pending*

## Boundaries (Active)

- Preserve prototype UI and mobile design (no redesign)
- Preserve all existing behavior — no feature changes during refactor
- Firebase files can now be removed (Supabase parity confirmed in Phase 1) ✓ Done
- All existing migrations are untouchable (already applied to production)

## Session Continuity

Last session: 2026-03-29
Stopped at: Phase 5 complete, loop closed
Next action: /paul:plan for Phase 6 (Shared UI Primitives)
Resume file: .paul/ROADMAP.md

---
*STATE.md — Updated after every significant action*
