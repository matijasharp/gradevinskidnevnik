# Project Member Roles — Permissions Reference

## Context

Cross-org project members are users invited via the **Pozovi suradnika** flow in the project's Suradnici tab. They belong to a different organization and are granted access to a specific project with one of three roles stored in `project_members.role`.

This is distinct from **org-level roles** (`admin` / `worker` in `organization_members`), which govern access to the org's own projects and settings.

## Role Definitions

| Role (DB value) | Croatian label | Description |
|---|---|---|
| `lead` | Voditelj | Project lead — coordinates cross-org work on this project |
| `contributor` | Suradnik | Active collaborator — can add entries and interact with the project |
| `viewer` | Gledatelj | Read-only observer — can only view the diary and download the PDF |

## Permission Matrix (Intended)

| Action | Voditelj | Suradnik | Gledatelj |
|---|---|---|---|
| View diary entries | ✅ | ✅ | ✅ |
| Add diary entry (Novi unos) | ✅ | ✅ | ❌ |
| Download PDF (Izvještaj) | ✅ | ✅ | ✅ |
| View tasks tab | ✅ | ✅ | ❌ |
| Toggle task done | ✅ | ✅ | ❌ |
| Create / delete tasks | ✅ | ❌ | ❌ |
| View documents tab | ✅ | ✅ | ❌ |
| Upload / delete documents | ✅ | ❌ | ❌ |
| View members (Suradnici) tab | ✅ | ✅ | ❌ |
| Manage members (invite / remove / change role) | ✅ | ❌ | ❌ |
| View activity feed | ✅ | ✅ | ❌ |
| Complete / delete project | ❌ | ❌ | ❌ |

> Complete and delete project remain exclusive to org-level `admin` users (own org only).

## Implementation Status

### Bugs found (audit 2026-04-03)

1. **Role not enforced at DB level** — RLS policies on `diary_entries`, `diary_photos`, `project_phases`, and `projects` use `get_my_project_ids()` for the `FOR ALL` policy, which gives cross-org members INSERT / UPDATE / DELETE despite the UI blocking it. The `role` column is never checked by any RLS policy.

2. **Blank page for shared project navigation** — `ProjectDetailPage` resolves the project via `projects.find()` which only contains own-org projects. Shared projects are in `sharedProjects`. Cross-org members who navigate to `/projects/:id` directly see a blank page. Fix: also fall back to `sharedProjects.find()`.

3. **Role not enforced at UI level** — the only gate is the `readonly` flag (true when the project is in `sharedProjects`). All three cross-org roles get the same `readonly=true` treatment regardless of whether they are `lead`, `contributor`, or `viewer`.

### Files to change for full enforcement

| File | Change |
|---|---|
| `app/src/features/projects/components/ProjectDetailPage.tsx` | Fall back to `sharedProjects.find()`, fetch project member role, pass as prop |
| `app/src/features/projects/components/ProjectDetailView.tsx` | Accept `memberRole` prop; gate tabs, buttons, actions based on role |
| `app/src/features/projects/components/ProjectTasksTab.tsx` | Replace `!readonly` guard with role check |
| `app/src/features/projects/components/ProjectDocumentsTab.tsx` | Replace `!readonly` guard with role check |
| `app/src/features/projects/components/ProjectMembersTab.tsx` | Gate member management actions by role |
| `supabase/migrations/` | New migration: split `diary_entries_access` / `projects_write` / `project_phases_access` policies to separate SELECT from write; add role-aware write checks |
