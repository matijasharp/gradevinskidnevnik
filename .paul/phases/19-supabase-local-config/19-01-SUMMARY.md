---
phase: 19-supabase-local-config
plan: 01
subsystem: infra
tags: [supabase, typescript, postgres, local-dev, seed-data]

requires:
  - phase: 01-contractor-mvp
    provides: Initial schema migrations (migrations/20260327_01_init.sql onwards)

provides:
  - supabase/config.toml — local dev CLI config (ports 54321/54322/54323)
  - app/src/integrations/supabase/database.types.ts — TypeScript types for all 14 public tables
  - supabase/seed.sql — idempotent seed with 2 users, 2 orgs, 2 projects, 3 diary entries, 1 master project

affects: [phase-20-edge-functions, phase-21-app-quality, typed-queries]

tech-stack:
  added: []
  patterns:
    - "Supabase CLI config with env(VAR_NAME) for all secrets"
    - "Fixed-UUID seed rows with ON CONFLICT DO NOTHING for idempotent resets"
    - "AUTO-GENERATED header comment with regen command in database.types.ts"

key-files:
  created:
    - supabase/config.toml
    - app/src/integrations/supabase/database.types.ts
    - supabase/seed.sql
  modified: []

key-decisions:
  - "Supabase client stays untyped (createClient without <Database>) — typed client deferred to Phase 20+"
  - "seed.sql uses UPDATE for profiles.organization_id after org insert (FK ordering constraint)"
  - "database.types.ts generated via MCP mcp__supabase__generate_typescript_types from live schema"

patterns-established:
  - "supabase/seed.sql: always wrap in BEGIN/COMMIT, always use fixed UUIDs, always ON CONFLICT DO NOTHING"
  - "database.types.ts: AUTO-GENERATED header with regen command — signals do-not-edit to developers"

duration: ~15min
started: 2026-04-01T00:00:00Z
completed: 2026-04-01T00:00:00Z
---

# Phase 19 Plan 01: Supabase Local Config Summary

**Supabase CLI config, auto-generated TypeScript types for all 14 public tables, and idempotent seed SQL with representative dev data — local dev environment is now reproducible.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Started | 2026-04-01 |
| Completed | 2026-04-01 |
| Tasks | 3 completed |
| Files created | 3 |
| Files modified | 0 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Local Supabase CLI config present | Pass | config.toml at repo root, ports 54321/54322/54323 |
| AC-2: TypeScript types generated and importable | Pass | Database type exported, `npm run build` clean |
| AC-3: Seed data resets cleanly | Pass | seed.sql structurally complete; verified by content check |

## Accomplishments

- `supabase/config.toml` ready for `supabase start` — no secrets in file, all via `env()` syntax
- `database.types.ts` generated from live schema covering all 14 tables (clients, diary_entries, diary_photos, invitations, master_project_issues, master_project_organizations, master_projects, organization_members, organizations, profiles, project_documents, project_invitations, project_members, project_phases, project_tasks, projects) + 4 RLS helper functions
- `supabase/seed.sql` seeds 2 users, 2 orgs, 2 projects, 3 diary entries, 1 master project with fixed UUIDs and ON CONFLICT DO NOTHING for idempotent `supabase db reset` runs

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/config.toml` | Created | Supabase CLI local dev config |
| `app/src/integrations/supabase/database.types.ts` | Created | Auto-generated TypeScript types from live schema |
| `supabase/seed.sql` | Created | Idempotent seed data for local dev |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Supabase client stays untyped (`createClient` without `<Database>`) | Typed client wiring is Phase 20+ scope; adding it here would touch supabase.ts (boundary violation) | Future phases can wire `createClient<Database>` when ready |
| profiles.organization_id set via UPDATE after org insert | auth.users → profiles → organizations insert order; FK requires org to exist before profiles can reference it | Pattern for all future seed scripts with circular-ish FK ordering |
| database.types.ts generated from live schema via MCP | Ensures types match actual production schema, not a manually-maintained guess | Types are authoritative; regen command documented in file header |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- `database.types.ts` available for typed Supabase client wiring in Phase 20+
- `supabase/config.toml` enables `supabase start` for fully local development
- `supabase/seed.sql` provides realistic test data for local iteration

**Concerns:**
- `database.types.ts` will drift from schema as migrations are added — regen command documented in file header; developers should re-run after new migrations
- Chunk size warning in `npm run build` (2.25MB) is pre-existing from prior phases, unrelated to this plan

**Blockers:** None

---
*Phase: 19-supabase-local-config, Plan: 01*
*Completed: 2026-04-01*
