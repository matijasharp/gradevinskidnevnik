# Gradevinski Dnevnik

> Multi-tenant site diary platform for construction contractors and project leads, starting with electricians.

**Created:** 2026-03-27
**Type:** Application
**Stack:** React (Vite, TypeScript) + Supabase (Auth/Postgres/Storage) + Node/Express (serverless OAuth) + Vercel/Netlify
**Skill Loadout:** ui-ux-pro-max, /paul:audit, sonarqube scan
**Quality Gates:** test coverage, security scan, accessibility, performance

---

## Problem Statement

Electricians and other contractors need a simple, fast way to log daily site progress (diary entries, phases, photos, reports) for their own projects and clients, while project leads need cross-discipline visibility, audit trails, and shared documentation. Contractors must be able to run their own internal projects and also be invited into larger master projects as collaborators. The platform must support multi-tenant contractor workspaces and a central master project workspace, without splitting into separate products. The main app must include ALL prototype functionality and match the prototype mobile design.

---

## Tech Stack

Use the existing prototype UI/UX for speed, but implement the backend directly on Supabase.

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + Vite + TypeScript | Matches `site-diary-mini` prototype and supports fast iteration |
| Backend | Supabase Auth + Postgres + Storage | Supabase-first MVP with RLS and relational schema |
| Server | Node/Express (serverless OAuth + integrations) | Needed for Google Calendar OAuth and API calls |
| Deployment | Vercel/Netlify (frontend), Firebase (data) | Standard hosting for React + Firebase |

### Research Needed
- Data migration path from Firebase prototype to Supabase (data import and schema alignment).
- Final hosting setup for server-side OAuth (Vercel/Netlify serverless).

---

## Data Model

Core entities and relationships (target model aligns with context-seed):

### Entities

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| Organization | id, name, logoUrl, address, oib | has many Users, Projects, Clients |
| OrganizationMember | userId, organizationId, role | belongs to Organization and User |
| Project | id, name, status, clientId, ownerCompanyId, projectType | has many Phases, Entries, Documents, Tasks |
| ProjectDiscipline | projectId, discipline, contractorOrgId | belongs to Project, links contractor |
| ProjectMember | userId, projectId, role | belongs to Project and User |
| Client | id, name, contact | belongs to Organization |
| Phase | id, projectId, name, status, dates | belongs to Project |
| DiaryEntry | id, projectId, phaseId, workDateFrom/To, summary, signedBy | belongs to Project and Phase |
| DiaryPhoto | entryId, url, storagePath, description | belongs to DiaryEntry |
| Document | projectId, type, url, visibility | belongs to Project |
| Task/Issue | projectId, type, status, assigneeId | belongs to Project |
| Invitation | token, email, role, orgId/projectId | belongs to Organization/Project |
| AuditEvent | actorId, entityType, action, timestamp | belongs to Organization/Project |

### Notes
- MVP can keep Firebase schema, but should add missing membership and sharing collections early to avoid rework.
- DiaryEntry fields should align with context (entry_number, pdf_url, client_visible, signedByName/Role, workDateFrom/To).

---

## API Surface

### Auth Strategy
- Supabase Auth with RLS for org/project scopes.
- Invitation tokens for onboarding (org + project membership).

### Route Groups (Server)
- `POST /auth/google` (OAuth token exchange)
- `GET /calendar/events` (Google Calendar sync)
- `POST /ai/summary` (AI summary generation)

### Internal vs External
- Public endpoints: none (auth required).
- Internal/admin endpoints: org and project admin operations.
- MCP integration points: none.

---

## Deployment Strategy

### Local Development
- Vite dev server for frontend.
- Supabase local stack for Auth/Postgres/Storage.
- Local Node/Express server for OAuth/integrations.

| Service | Image/Runtime | Port | Purpose |
|---------|--------------|------|---------|
| frontend | node 20 | 5173 | app UI |
| server | node 20 | 3001 | OAuth + integrations |

### Staging / Production
- Frontend on Vercel/Netlify.
- Supabase for Auth/Postgres/Storage.
- Server on Vercel/Netlify serverless.

---

## Security Considerations

- Multi-tenant data isolation with explicit organizationId and project membership checks.
- RLS policies must enforce org + project boundaries (no hard-coded superadmin).
- Invitation tokens should be single-use and time-limited.
- Store API keys (Google, Gemini) in server-side env only.
- Audit log for critical actions (membership changes, document uploads, entry approval).
- GDPR baseline: data export, data deletion, and retention policy documented.

---

## UI/UX Needs

### Design System
- Preserve the existing prototype design while consolidating into the main app.
- Match the prototype mobile layout, typography, spacing, and interaction patterns.
- Mobile-first for on-site usage; desktop-friendly for project leads.

### Key Views / Pages

| View | Purpose | Complexity |
|------|---------|------------|
| Dashboard | Quick status, KPIs, recent activity | medium |
| Projects | List and filter projects | medium |
| Project Detail | Phases, diary, photos, reports | high |
| Diary Entry | Create/edit daily report, photos | high |
| Reports | PDF/CSV exports | medium |
| Calendar | Schedule view, reminders | medium |
| Users/Team | Invite and manage roles | medium |
| Company Settings | Profile, branding | low |
| Master Workspace (future) | Cross-discipline overview | high |

### Real-Time Requirements
- Optional: live updates for diary entries and status changes.

### Responsive Needs
- Both desktop and mobile.

---

## Integration Points

| Integration | Type | Purpose | Auth |
|------------|------|---------|------|
| Google Calendar | API | Sync project reminders | OAuth |
| Open-Meteo | API | Weather for diary entries | None |
| Gemini / AI | API | Summaries and reports | API key |
| PDF Generator | Library | Export reports | N/A |

---

## Phase Breakdown

### Phase 1: Contractor MVP (Electro)
- **Build:** Migrate ALL prototype UI, mobile design, and features into the main app (company profile, projects, phases, diary entries, photos, reports, users, calendar, weather, reminders, AI summaries, analytics exports) with Supabase backend and RLS. Align fields with context model.
- **Testable:** Electrician workflow end-to-end: create project, add phase, write diary entry with photos, export report.
- **Outcome:** Usable electrician diary app in production-quality UI.

### Phase 2: Multi-tenant + Sharing
- **Build:** Organization and project membership, invitations, clients, documents, tasks/issues, audit log; support contractor-owned projects plus invited participation in master projects.
- **Testable:** Invite external collaborator, share project scope, role-based access works across orgs.
- **Outcome:** Core multi-tenant platform ready for shared projects.

### Phase 3: Vertical Expansion + Subdomains
- **Build:** Add water/klima variants (terminology, templates, checklists) and subdomain UX (elektro/voda/klima) on shared backend.
- **Testable:** Users can enter via subdomain and see tailored UI without data separation.
- **Outcome:** Multi-vertical contractor workspaces.

### Phase 4: Master Project Workspace
- **Build:** Central portal with discipline subprojects, aggregated status, issues, timeline, audit trail; cross-company visibility.
- **Testable:** Master project owner can track all disciplines and see contractor updates.
- **Outcome:** Full platform vision achieved.

## Skill Loadout & Quality Gates

### Skills Used During Build

| Skill | When It Fires | Purpose |
|-------|--------------|---------|
| ui-ux-pro-max | UI consolidation | Design system alignment and responsive polish |
| /paul:audit | Each milestone | Architecture review |
| sonarqube scan | Each phase | Code quality and security |

### Quality Gates

| Gate | Threshold | When |
|------|-----------|------|
| Test coverage | 70%+ | Each phase |
| Security scan | Pass | Each phase |
| Accessibility | WCAG AA | UI phases |
| Performance | LCP < 2.5s | Phase 1 + final |

---

## Design Decisions

1. **Start from the existing prototype**: Keep the `site-diary-mini` UI/UX, mobile design, and all features as the MVP baseline.
2. **Single platform with vertical entry points**: Subdomains are UX-only; backend is unified.
3. **Supabase-first MVP**: Implement backend directly on Supabase and use Firebase only as a reference.
4. **Multi-tenant permissions early**: Org + project membership before adding master workspace.
5. **Keep prototype extras unless rejected**: Calendar, weather, AI summaries, reminders, analytics are assumed in scope.

---

## Open Questions

1. None currently. Revisit after Phase 1 scoping.

---

## Next Actions

- [ ] Finalize Phase 1 scope and create implementation plan (PLAN.md)

---

## References

- `docs/context-seed/01-vision-platform.md`
- `docs/context-seed/02-product-and-gtm.md`
- `docs/context-seed/03-data-model-and-permissions.md`
- `docs/context-seed/04-firestore-current-and-refactor.md`
- `docs/context-seed/05-supabase-schema.md`
- `docs/context-seed/06-frontend-structure.md`
- `docs/context-seed/07-supabase-backend-structure.md`
- `docs/context-seed/08-misc-and-assets.md`
- `site-diary-mini/src/App.tsx`
- `site-diary-mini/firestore.rules`
