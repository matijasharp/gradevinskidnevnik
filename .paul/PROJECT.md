# Gradevinski Dnevnik

## What This Is

Gradevinski Dnevnik is a multi-tenant site diary platform for construction contractors and project leads. It starts with electricians and delivers daily work logging (entries, phases, photos, reports) while enabling cross-discipline visibility, shared documents, and audit trails across master projects.

## Core Value

Contractors log site progress fast while project leads see shared, audited status across all disciplines.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 1.0-alpha |
| Status | MVP (Phase 1 complete) |
| Last Updated | 2026-03-28 |

**Production URLs:**
- None

## Requirements

### Core Features

- Contractor workspace (company profile, clients, projects)
- Daily diary entries with phases, photos, reports, and exports
- Team management with role-based access
- Invited participation in master projects with shared documents and tasks
- Master workspace for cross-discipline oversight (later phases)

### Validated (Shipped)

- ✓ Phase 1: Prototype parity in main app with Supabase backend — Phase 1

### Active (In Progress)

- [ ] Phase 2: Multi-tenant sharing, invitations, documents, tasks, audit log

### Planned (Next)

- [ ] Phase 2: Multi-tenant sharing, invitations, documents, tasks, audit log
- [ ] Phase 3: Vertical subdomains and discipline-specific templates
- [ ] Phase 4: Master project workspace

### Out of Scope

- Billing and subscriptions
- Native mobile apps (web-only for MVP)

## Target Users

**Primary:** Electrician contractors and field teams
- Mobile-first, on-site usage
- Need quick entry creation and photo capture
- Manage both internal and invited projects

**Secondary:** Project leads, investors, and supervisors
- Need aggregated progress and audit visibility

## Context

**Business Context:**
Start with electricians, then expand to other disciplines. Single platform with subdomain entry points, not separate products.

**Technical Context:**
Prototype exists in `site-diary-mini`. Main app must match prototype UI/UX and include all features. Backend is Supabase-first with serverless OAuth integrations.

## Constraints

### Technical Constraints

- Preserve prototype mobile design and feature set in the main app
- Supabase Auth/Postgres/Storage with RLS for multi-tenant isolation
- Serverless OAuth for Google Calendar integration

### Business Constraints

- MVP must be usable for electricians without master workspace
- Subdomains are UX-only, backend is unified

### Compliance Constraints

- GDPR baseline (data export, deletion, retention policy)

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| Supabase-first backend | Avoid Firebase migration and enforce RLS early | 2026-03-27 | Active |
| Keep all prototype features | Maintain parity with existing UX expectations | 2026-03-27 | Active |
| Serverless OAuth | Simplify deployment for integrations | 2026-03-27 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Prototype parity (features + mobile UI) | 100% in Phase 1 | 100% | ✅ Done |
| Diary entry creation time | < 2 minutes | Unknown | Unknown |
| Report export reliability | 100% success | Unknown | Unknown |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React + Vite + TypeScript | Prototype stack |
| Auth | Supabase Auth | RLS-driven access control |
| Database | Supabase Postgres | Schema aligned with context-seed |
| Storage | Supabase Storage | Photos and documents |
| Server | Node/Express (serverless) | OAuth + integrations |
| Exports | jsPDF | Reports and PDFs |
| AI | Gemini | Summaries and reports |

## Links

| Resource | URL |
|----------|-----|
| Repository | Local workspace | 
| Documentation | `docs/context-seed/` |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-03-28 after Phase 1*
