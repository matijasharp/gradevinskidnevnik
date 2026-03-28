# Roadmap: Gradevinski Dnevnik

## Overview

Start from the electrician prototype, deliver a Supabase-backed MVP with full UI/feature parity, then expand into multi-tenant sharing, subdomain verticals, and a master project workspace.

## Current Milestone

**v1.0 MVP** (v1.0)
Status: In progress
Phases: 2 of 4 complete

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with [INSERTED])

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Contractor MVP (Electro) | 3 | ✅ Complete | 2026-03-28 |
| 2 | Multi-tenant + Sharing | 3 | ✅ Complete | 2026-03-28 |
| 3 | Vertical Expansion + Subdomains | 2 | Not started | - |
| 4 | Master Project Workspace | 2 | Not started | - |

## Phase Details

### Phase 1: Contractor MVP (Electro)

**Goal:** Full prototype parity in the main app with Supabase backend and unchanged mobile design.
**Depends on:** Nothing (first phase)
**Research:** Likely (Supabase RLS, data migration, serverless OAuth)

**Scope:**
- Supabase schema and RLS for core entities
- Supabase client integration in main app
- Port all prototype features and screens
- Preserve mobile design and interactions

**Plans:**
- [x] 01-01: Supabase foundation, schema, and core read paths
- [x] 01-02: Port core CRUD flows (projects, phases, entries, photos, users)
- [x] 01-03: Storage migration + advanced feature verification

### Phase 2: Multi-tenant + Sharing

**Goal:** Contractor-owned projects plus invited participation in master projects with documents, tasks, and audit log.
**Depends on:** Phase 1 (Supabase foundation)
**Research:** Likely (cross-org RLS, invitation flows)

**Scope:**
- Organization and project membership
- Invitations and role enforcement
- Clients, documents, tasks/issues, audit log

**Plans:**
- [x] 02-01: Membership model + invitations
- [x] 02-02: Task checklist (Zadaci tab)
- [x] 02-03: Project documents (Dokumenti tab)

### Phase 3: Vertical Expansion + Subdomains

**Goal:** Add water/klima variants and subdomain UX on shared backend.
**Depends on:** Phase 2
**Research:** Unlikely (mostly UX + configuration)

**Scope:**
- Discipline templates and terminology
- Subdomain entry points and branding

**Plans:**
- [ ] 03-01: Vertical config and templates
- [ ] 03-02: Subdomain routing and UX polish

### Phase 4: Master Project Workspace

**Goal:** Central portal with aggregated status, issues, timeline, and audit trail.
**Depends on:** Phase 3
**Research:** Likely (cross-discipline aggregation)

**Scope:**
- Master project views and dashboards
- Discipline subprojects and shared documents
- Timeline and issue tracking

**Plans:**
- [ ] 04-01: Master workspace data model + views
- [ ] 04-02: Aggregated status, timeline, and issue workflows

---
*Roadmap created: 2026-03-27*
*Last updated: 2026-03-28 after Phase 1*
