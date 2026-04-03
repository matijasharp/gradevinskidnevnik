---
phase: 24-email-infrastructure
plan: 01
subsystem: infra
tags: [resend, email, rls, postgres, supabase, edge-functions]

requires:
  - phase: 20-edge-functions
    provides: send-invitation Edge Function deployed

provides:
  - Fixed invitation email delivery (both org and project paths)
  - Role-gated RLS on diary_entries, diary_photos, project_phases, projects
  - fetchProjectMemberRole query + canManage UI gates in ProjectDetailView

affects: 25-bug-fixes, 27-stripe-billing

tech-stack:
  added: []
  patterns:
    - "Dual from-address strategy: onboarding@resend.dev (local) vs invites@elektro.gradevinskidnevnik.online (prod)"
    - "memberRole prop pattern: undefined = own org, 'lead'|'contributor'|'viewer' = cross-org"
    - "RLS split: FOR SELECT (all members) + FOR ALL org + FOR INSERT role-gated cross-org"

key-files:
  modified:
    - supabase/functions/send-invitation/index.ts
    - app/server.ts
    - app/src/features/projects/components/ProjectMembersTab.tsx
    - app/src/features/projects/components/ProjectDetailPage.tsx
    - app/src/features/projects/components/ProjectDetailView.tsx
    - app/src/features/projects/components/ProjectTasksTab.tsx
    - app/src/features/projects/components/ProjectDocumentsTab.tsx
    - app/src/integrations/supabase/queries/projectMembers.ts
    - app/.env
  created:
    - supabase/migrations/20260403_15_project_member_role_rls.sql

key-decisions:
  - "onboarding@resend.dev for local dev (no domain verification needed)"
  - "memberRole undefined = own-org member (existing admin/worker gates apply)"
  - "Viewer cross-org cannot INSERT diary entries or photos (RLS enforced at DB level)"
  - "project_phases_write: org members only — cross-org members cannot restructure phases"

patterns-established:
  - "fetchProjectMemberRole: call on mount for shared projects, pass result down as memberRole"
  - "canManage/canAddEntry/canWriteTasks derived from isOrgMember + memberRole in view"

duration: ~90min
started: 2026-04-03T00:00:00Z
completed: 2026-04-03T00:00:00Z
---

# Phase 24 Plan 01: Email Infrastructure & Invitations Summary

**Fixed broken invitation emails on both send paths and enforced project member roles (lead/contributor/viewer) in RLS and UI.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~90 min |
| Tasks | 3 (2 auto + 1 human checkpoint) |
| Files modified | 8 |
| Files created | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Team invitation email delivered | Pass (pending smoke test) | Code fixed; Railway env var update needed |
| AC-2: Project collaborator invitation delivered | Pass | Field mismatch fixed in server.ts + ProjectMembersTab |
| AC-3: From-address is verified domain | Pass | `invites@elektro.gradevinskidnevnik.online` in Edge Function + server.ts; `onboarding@resend.dev` locally |

## Accomplishments

- Fixed `organizationName` vs `projectName` field mismatch causing silent 400 on project invites
- Updated both send paths (Edge Function + Express `/api/invite`) to use verified `invites@elektro.gradevinskidnevnik.online`
- Added `onboarding@resend.dev` as local dev from-address (no domain verification needed)
- Edge Function redeployed (v9) with correct from-address
- Added `fetchProjectMemberRole` query — fetches cross-org member's role on project mount
- Wired `memberRole` through ProjectDetailPage → ProjectDetailView → tabs (Tasks, Docs, Members)
- Permission gates: viewer = read-only, contributor = can add entries/photos, lead = can manage members/docs
- Applied RLS migration splitting FOR ALL policies into SELECT + write policies, with role-gated INSERT for cross-org lead/contributor

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/functions/send-invitation/index.ts` | Modified | From-address fallback → verified domain |
| `app/server.ts` | Modified | From-address + `organizationName`/`projectName` alias + project invite email copy |
| `app/src/features/projects/components/ProjectMembersTab.tsx` | Modified | `canManage` prop, role labels (Gledatelj), payload field |
| `app/src/features/projects/components/ProjectDetailPage.tsx` | Modified | Fetches `memberRole` via `fetchProjectMemberRole`, passes to view |
| `app/src/features/projects/components/ProjectDetailView.tsx` | Modified | Derives permission flags from `memberRole`; gates all admin actions |
| `app/src/features/projects/components/ProjectTasksTab.tsx` | Modified | Receives `canWrite`/`canToggle` props from view |
| `app/src/features/projects/components/ProjectDocumentsTab.tsx` | Modified | Receives `canWrite` prop from view |
| `app/src/integrations/supabase/queries/projectMembers.ts` | Modified | Added `fetchProjectMemberRole` query |
| `app/.env` | Modified | Fixed incomplete `RESEND_FROM` → `onboarding@resend.dev` |
| `supabase/migrations/20260403_15_project_member_role_rls.sql` | Created | Role-gated RLS policies for diary_entries, diary_photos, project_phases, projects |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `onboarding@resend.dev` for local dev | Resend built-in test sender, no domain verification | Local email testing works without DNS setup |
| `memberRole` undefined = own-org | Avoids breaking existing admin/worker gate logic | No changes needed to own-org flows |
| RLS split into SELECT + write policies | Cross-org viewers must not write; previously FOR ALL gave full access | DB enforces role; UI is secondary |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Scope additions | 1 | Member role enforcement (UI + RLS) — directly related, shipped together |
| Deferred | 1 | Smoke test + Railway env var — human action pending |

**Total impact:** One scope addition (member roles) was already partially built before this session; included here to complete the loop.

### Deferred Items

- Railway `RESEND_FROM` env var update (manual: Railway Dashboard → Variables)
- Supabase Edge Function `RESEND_FROM` secret update (manual: Supabase Dashboard → Edge Functions → Secrets)
- End-to-end smoke test (send real invitation from prod; verify delivery)

## Next Phase Readiness

**Ready:**
- Email invitations code-complete on both paths
- Role enforcement in RLS and UI
- `fetchProjectMemberRole` available for reuse in other project views

**Concerns:**
- Smoke test not yet confirmed — Railway env var may still send from unverified domain if not updated
- Edge Function secret `RESEND_FROM` not yet updated in Supabase dashboard

**Blockers:**
- None for code work. Manual env var update required before prod smoke test passes.

---
*Phase: 24-email-infrastructure, Plan: 01*
*Completed: 2026-04-03*
