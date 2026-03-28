# Context Seed Diff Report

## Scope
- Context: `docs/context-seed/01-vision-platform.md`, `docs/context-seed/02-product-and-gtm.md`, `docs/context-seed/03-data-model-and-permissions.md`, `docs/context-seed/04-firestore-current-and-refactor.md`, `docs/context-seed/05-supabase-schema.md`, `docs/context-seed/06-frontend-structure.md`, `docs/context-seed/07-supabase-backend-structure.md`, `docs/context-seed/08-misc-and-assets.md`
- Implementation: `site-diary-mini/src/App.tsx`, `site-diary-mini/server.ts`, `site-diary-mini/firestore.rules`, `site-diary-mini/firebase-blueprint.json`, `site-diary-mini/package.json`, `site-diary-mini/metadata.json`

## Summary
- Context describes a multi-tenant platform with subdomain entry points and a master project workspace; current app is a single-company Firebase diary for electricians.
- Major missing areas: membership layer, shared projects, discipline subprojects, master workspace, clients/documents/tasks/issues/audit log, and the 3-layer permission model.
- App includes extra features not described in the context (calendar integration, AI workflow details, weather, reminders, analytics exports, voice notes).

## Differences by area

### Platform scope and subdomains
- Expected: one platform with UX entry points on subdomains (elektro/voda/klima) plus a central investor/master portal. Not implemented in app (no routing, branding, or logic for subdomains; no master portal). `docs/context-seed/01-vision-platform.md`, `site-diary-mini/src/App.tsx`
- Expected: multi-tenant model (company tenant + master project workspace) with cross-project sharing. App is single-tenant per companyId. `docs/context-seed/01-vision-platform.md`, `docs/context-seed/03-data-model-and-permissions.md`, `site-diary-mini/src/App.tsx`

### Data model and permissions
- Missing entities: organizations/organization_members, project_members, project_disciplines, project_participants, documents, tasks, phase_updates, invitations (tokenized), activity/audit log, clients. `docs/context-seed/03-data-model-and-permissions.md`, `docs/context-seed/04-firestore-current-and-refactor.md`, `docs/context-seed/05-supabase-schema.md`, `site-diary-mini/src/App.tsx`, `site-diary-mini/firebase-blueprint.json`
- Projects lack the expected fields: ownerCompanyId, projectType, visibility, parentProjectId, discipline. Only companyId-based ownership is used. `docs/context-seed/04-firestore-current-and-refactor.md`, `site-diary-mini/src/App.tsx`, `site-diary-mini/firebase-blueprint.json`
- Users only have roles admin/worker; context expects richer org/project/shared-scope roles. No 3-layer permission model (org, project, shared scope). `docs/context-seed/03-data-model-and-permissions.md`, `site-diary-mini/src/App.tsx`, `site-diary-mini/firestore.rules`
- Diary entry fields differ: context calls for entry_number/pdf_url/client_visible/signedByName/signedByRole/workDateFrom/workDateTo; app stores a subset plus additional fields (weather, reminders, createdByName). `docs/context-seed/04-firestore-current-and-refactor.md`, `site-diary-mini/src/App.tsx`, `site-diary-mini/firebase-blueprint.json`
- Diary photo schema mismatch: blueprint expects entryId/url/storagePath only, while app also writes companyId/projectId/createdAt/description. `site-diary-mini/firebase-blueprint.json`, `site-diary-mini/src/App.tsx`
- Firestore rules include a hard-coded superadmin email not mentioned in context. `site-diary-mini/firestore.rules`

### Feature modules and navigation
- Context expects modules: Clients, Documents, Tasks/Issues, Discipline subprojects, Assigned/Shared projects, Report templates, Master portal pages. App navigation includes Dashboard, Projects, Calendar, Reports, Users, Company Settings only. `docs/context-seed/01-vision-platform.md`, `site-diary-mini/src/App.tsx`
- No dedicated Clients module; clients are only a string field on projects. `docs/context-seed/01-vision-platform.md`, `docs/context-seed/05-supabase-schema.md`, `site-diary-mini/src/App.tsx`
- No Documents module or document storage. `docs/context-seed/01-vision-platform.md`, `docs/context-seed/03-data-model-and-permissions.md`, `site-diary-mini/src/App.tsx`
- No shared project flow or external collaborator access. Invite flow only creates a user in the same company. `docs/context-seed/04-firestore-current-and-refactor.md`, `site-diary-mini/src/App.tsx`

### Backend/infra stack
- Context recommends Supabase (SQL + RLS) as target; app uses Firebase Auth + Firestore with client-side access checks and Firestore rules. `docs/context-seed/05-supabase-schema.md`, `docs/context-seed/07-supabase-backend-structure.md`, `site-diary-mini/src/lib/firebase.ts`, `site-diary-mini/firestore.rules`
- App adds an Express server for Google OAuth/Calendar APIs; context does not define any server-side layer. `site-diary-mini/server.ts`

### Frontend structure
- Context recommends feature-first folder structure with thin pages and domain modules; app is a single-file UI in `site-diary-mini/src/App.tsx` with no feature modules or routing. `docs/context-seed/06-frontend-structure.md`, `site-diary-mini/src/App.tsx`

### Extra features in app (not described in context)
- Google Calendar OAuth + event sync, plus calendar UI (month/week/day). `site-diary-mini/server.ts`, `site-diary-mini/src/App.tsx`
- Weather lookup for entries using Open-Meteo. `site-diary-mini/src/App.tsx`
- Reminders with scheduled alert modal. `site-diary-mini/src/App.tsx`
- Voice note transcription (SpeechRecognition). `site-diary-mini/src/App.tsx`
- AI summary pipeline using Gemini and a secrets modal. `site-diary-mini/src/App.tsx`, `site-diary-mini/vite.config.ts`, `site-diary-mini/metadata.json`
- Analytics dashboard, CSV export, and PDF export for reports. `site-diary-mini/src/App.tsx`
- Full-screen photo gallery and per-entry photo captions. `site-diary-mini/src/App.tsx`

### Partial alignment (present but not per context)
- Company profile, projects, phases, diary entries, photos, team management exist, but are single-tenant and lack membership/shared scope. `docs/context-seed/01-vision-platform.md`, `docs/context-seed/04-firestore-current-and-refactor.md`, `site-diary-mini/src/App.tsx`
- PDF generation exists at project-report level; context implies broader report/document handling and per-entry PDF workflows. `docs/context-seed/02-product-and-gtm.md`, `docs/context-seed/03-data-model-and-permissions.md`, `site-diary-mini/src/App.tsx`

## Notes on documentation drift
- Context seed expects a future-ready refactor with companyMembers/projectMembers and projectType/ownerCompanyId; the current codebase and Firebase blueprint do not include these collections/fields. `docs/context-seed/04-firestore-current-and-refactor.md`, `site-diary-mini/firebase-blueprint.json`, `site-diary-mini/src/App.tsx`
- Context seed provides a Supabase schema and backend structure; repository currently ships a Firebase-first implementation without Supabase files. `docs/context-seed/05-supabase-schema.md`, `docs/context-seed/07-supabase-backend-structure.md`, `site-diary-mini/`
