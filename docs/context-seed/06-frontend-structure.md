# Frontend struktura (React + Supabase)

## Ključni princip
- Feature-first, ne “type-only” (components, hooks, pages).
- Shared znači stvarno shared, a ne business UI.

## Preporučeni file tree (React + Supabase)
Pretpostavke: React + TypeScript + Vite + Supabase, jedna web app.

```
project-root/
├─ public/
│  ├─ favicon.ico
│  ├─ logo.svg
│  └─ images/
│
├─ supabase/
│  ├─ migrations/
│  ├─ seed/
│  ├─ policies/
│  └─ functions/
│
├─ src/
│  ├─ app/
│  │  ├─ providers/
│  │  │  ├─ AuthProvider.tsx
│  │  │  ├─ OrganizationProvider.tsx
│  │  │  ├─ ThemeProvider.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ router/
│  │  │  ├─ AppRouter.tsx
│  │  │  ├─ ProtectedRoute.tsx
│  │  │  ├─ GuestRoute.tsx
│  │  │  └─ routeConfig.tsx
│  │  │
│  │  ├─ layouts/
│  │  │  ├─ AppShell.tsx
│  │  │  ├─ AuthLayout.tsx
│  │  │  ├─ DashboardLayout.tsx
│  │  │  └─ MarketingLayout.tsx
│  │  │
│  │  ├─ config/
│  │  │  ├─ env.ts
│  │  │  ├─ navigation.ts
│  │  │  ├─ permissions.ts
│  │  │  └─ constants.ts
│  │  │
│  │  └─ bootstrap/
│  │     ├─ initializeApp.ts
│  │     └─ index.ts
│  │
│  ├─ pages/
│  │  ├─ marketing/
│  │  │  ├─ LandingPage.tsx
│  │  │  ├─ PricingPage.tsx
│  │  │  ├─ ContactPage.tsx
│  │  │  └─ NotFoundPage.tsx
│  │  │
│  │  ├─ auth/
│  │  │  ├─ LoginPage.tsx
│  │  │  ├─ RegisterPage.tsx
│  │  │  ├─ ForgotPasswordPage.tsx
│  │  │  ├─ ResetPasswordPage.tsx
│  │  │  └─ AcceptInvitePage.tsx
│  │  │
│  │  └─ app/
│  │     ├─ DashboardPage.tsx
│  │     ├─ SettingsPage.tsx
│  │     └─ ProfilePage.tsx
│  │
│  ├─ features/
│  │  ├─ auth/
│  │  │  ├─ api/
│  │  │  │  ├─ signIn.ts
│  │  │  │  ├─ signOut.ts
│  │  │  │  ├─ signUp.ts
│  │  │  │  ├─ getCurrentUser.ts
│  │  │  │  └─ refreshSession.ts
│  │  │  ├─ components/
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  ├─ RegisterForm.tsx
│  │  │  │  └─ AuthGuard.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useAuth.ts
│  │  │  │  └─ useSession.ts
│  │  │  ├─ model/
│  │  │  │  ├─ auth.types.ts
│  │  │  │  └─ auth.schema.ts
│  │  │  └─ index.ts
│  │  │
│  │  ├─ organizations/
│  │  │  ├─ api/
│  │  │  │  ├─ createOrganization.ts
│  │  │  │  ├─ getOrganizationById.ts
│  │  │  │  ├─ getMyOrganizations.ts
│  │  │  │  ├─ updateOrganization.ts
│  │  │  │  └─ uploadOrganizationLogo.ts
│  │  │  ├─ components/
│  │  │  │  ├─ OrganizationSwitcher.tsx
│  │  │  │  ├─ OrganizationForm.tsx
│  │  │  │  ├─ OrganizationCard.tsx
│  │  │  │  └─ BrandSettingsForm.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useActiveOrganization.ts
│  │  │  │  ├─ useOrganizationMembers.ts
│  │  │  │  └─ useOrganizations.ts
│  │  │  ├─ model/
│  │  │  │  ├─ organization.types.ts
│  │  │  │  ├─ organization.schema.ts
│  │  │  │  └─ organization.mapper.ts
│  │  │  ├─ pages/
│  │  │  │  ├─ OrganizationSettingsPage.tsx
│  │  │  │  └─ TeamManagementPage.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ clients/
│  │  │  ├─ api/
│  │  │  │  ├─ createClient.ts
│  │  │  │  ├─ getClientById.ts
│  │  │  │  ├─ getClients.ts
│  │  │  │  ├─ updateClient.ts
│  │  │  │  └─ deleteClient.ts
│  │  │  ├─ components/
│  │  │  │  ├─ ClientForm.tsx
│  │  │  │  ├─ ClientList.tsx
│  │  │  │  └─ ClientDetailsCard.tsx
│  │  │  ├─ hooks/
│  │  │  │  └─ useClients.ts
│  │  │  ├─ model/
│  │  │  │  ├─ client.types.ts
│  │  │  │  └─ client.schema.ts
│  │  │  ├─ pages/
│  │  │  │  ├─ ClientsPage.tsx
│  │  │  │  └─ ClientDetailsPage.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ projects/
│  │  │  ├─ api/
│  │  │  │  ├─ createProject.ts
│  │  │  │  ├─ getProjectById.ts
│  │  │  │  ├─ getProjects.ts
│  │  │  │  ├─ updateProject.ts
│  │  │  │  ├─ archiveProject.ts
│  │  │  │  ├─ addProjectMember.ts
│  │  │  │  └─ getProjectMembers.ts
│  │  │  ├─ components/
│  │  │  │  ├─ ProjectForm.tsx
│  │  │  │  ├─ ProjectList.tsx
│  │  │  │  ├─ ProjectStatusBadge.tsx
│  │  │  │  ├─ ProjectHeader.tsx
│  │  │  │  ├─ ProjectFilters.tsx
│  │  │  │  └─ ProjectMembersPanel.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useProjects.ts
│  │  │  │  ├─ useProject.ts
│  │  │  │  └─ useProjectMembers.ts
│  │  │  ├─ model/
│  │  │  │  ├─ project.types.ts
│  │  │  │  ├─ project.schema.ts
│  │  │  │  └─ project.mapper.ts
│  │  │  ├─ pages/
│  │  │  │  ├─ ProjectsPage.tsx
│  │  │  │  ├─ ProjectDetailsPage.tsx
│  │  │  │  ├─ CreateProjectPage.tsx
│  │  │  │  └─ EditProjectPage.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ diary/
│  │  │  ├─ api/
│  │  │  │  ├─ createDiaryEntry.ts
│  │  │  │  ├─ getDiaryEntries.ts
│  │  │  │  ├─ getDiaryEntryById.ts
│  │  │  │  ├─ updateDiaryEntry.ts
│  │  │  │  ├─ deleteDiaryEntry.ts
│  │  │  │  ├─ uploadDiaryPhoto.ts
│  │  │  │  ├─ saveSignature.ts
│  │  │  │  └─ generateDiaryPdf.ts
│  │  │  ├─ components/
│  │  │  │  ├─ DiaryEntryForm.tsx
│  │  │  │  ├─ DiaryEntryList.tsx
│  │  │  │  ├─ DiaryEntryCard.tsx
│  │  │  │  ├─ DiaryPhotoUploader.tsx
│  │  │  │  ├─ SignaturePad.tsx
│  │  │  │  ├─ MaterialsLineItems.tsx
│  │  │  │  ├─ EntryStatusBadge.tsx
│  │  │  │  └─ GeneratePdfButton.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useDiaryEntries.ts
│  │  │  │  ├─ useDiaryEntry.ts
│  │  │  │  └─ useCreateDiaryEntry.ts
│  │  │  ├─ model/
│  │  │  │  ├─ diary.types.ts
│  │  │  │  ├─ diary.schema.ts
│  │  │  │  └─ diary.mapper.ts
│  │  │  ├─ pages/
│  │  │  │  ├─ DiaryPage.tsx
│  │  │  │  ├─ CreateDiaryEntryPage.tsx
│  │  │  │  ├─ DiaryEntryDetailsPage.tsx
│  │  │  │  └─ EditDiaryEntryPage.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ documents/
│  │  │  ├─ api/
│  │  │  │  ├─ uploadDocument.ts
│  │  │  │  ├─ getDocuments.ts
│  │  │  │  ├─ deleteDocument.ts
│  │  │  │  └─ updateDocumentVisibility.ts
│  │  │  ├─ components/
│  │  │  │  ├─ DocumentUploader.tsx
│  │  │  │  ├─ DocumentsList.tsx
│  │  │  │  └─ DocumentPreviewCard.tsx
│  │  │  ├─ hooks/
│  │  │  │  └─ useDocuments.ts
│  │  │  ├─ model/
│  │  │  │  ├─ document.types.ts
│  │  │  │  └─ document.schema.ts
│  │  │  ├─ pages/
│  │  │  │  └─ DocumentsPage.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ invitations/
│  │  │  ├─ api/
│  │  │  │  ├─ createInvitation.ts
│  │  │  │  ├─ acceptInvitation.ts
│  │  │  │  ├─ revokeInvitation.ts
│  │  │  │  └─ getInvitationByToken.ts
│  │  │  ├─ components/
│  │  │  │  ├─ InviteMemberForm.tsx
│  │  │  │  └─ InvitationStatusBadge.tsx
│  │  │  ├─ hooks/
│  │  │  │  └─ useInvitations.ts
│  │  │  ├─ model/
│  │  │  │  ├─ invitation.types.ts
│  │  │  │  └─ invitation.schema.ts
│  │  │  └─ index.ts
│  │  │
│  │  ├─ reports/
│  │  │  ├─ api/
│  │  │  │  ├─ generateProjectReport.ts
│  │  │  │  ├─ generateClientReport.ts
│  │  │  │  └─ exportEntriesPdf.ts
│  │  │  ├─ components/
│  │  │  │  ├─ ReportActions.tsx
│  │  │  │  ├─ ReportFilters.tsx
│  │  │  │  └─ ReportPreview.tsx
│  │  │  ├─ hooks/
│  │  │  │  └─ useReports.ts
│  │  │  ├─ model/
│  │  │  │  └─ report.types.ts
│  │  │  └─ index.ts
│  │  │
│  │  └─ dashboard/
│  │     ├─ api/
│  │     │  └─ getDashboardStats.ts
│  │     ├─ components/
│  │     │  ├─ StatsCards.tsx
│  │     │  ├─ ActiveProjectsWidget.tsx
│  │     │  ├─ RecentEntriesWidget.tsx
│  │     │  └─ PendingActionsWidget.tsx
│  │     ├─ hooks/
│  │     │  └─ useDashboardStats.ts
│  │     └─ index.ts
│  │
│  ├─ shared/
│  │  ├─ ui/
│  │  │  ├─ Button.tsx
│  │  │  ├─ Input.tsx
│  │  │  ├─ Select.tsx
│  │  │  ├─ Modal.tsx
│  │  │  ├─ Drawer.tsx
│  │  │  ├─ Table.tsx
│  │  │  ├─ Tabs.tsx
│  │  │  ├─ Badge.tsx
│  │  │  ├─ EmptyState.tsx
│  │  │  ├─ PageHeader.tsx
│  │  │  ├─ ConfirmDialog.tsx
│  │  │  └─ index.ts
│  │  │
│  │  ├─ components/
│  │  │  ├─ Logo.tsx
│  │  │  ├─ AppSidebar.tsx
│  │  │  ├─ Topbar.tsx
│  │  │  ├─ SearchInput.tsx
│  │  │  ├─ FileDropzone.tsx
│  │  │  ├─ LoadingScreen.tsx
│  │  │  └─ UnauthorizedState.tsx
│  │  │
│  │  ├─ hooks/
│  │  │  ├─ useDebounce.ts
│  │  │  ├─ useDisclosure.ts
│  │  │  └─ usePagination.ts
│  │  │
│  │  ├─ utils/
│  │  │  ├─ dates.ts
│  │  │  ├─ currency.ts
│  │  │  ├─ file.ts
│  │  │  ├─ strings.ts
│  │  │  ├─ validation.ts
│  │  │  └─ permissions.ts
│  │  │
│  │  ├─ constants/
│  │  │  ├─ projectStatuses.ts
│  │  │  ├─ diaryStatuses.ts
│  │  │  ├─ disciplines.ts
│  │  │  └─ roles.ts
│  │  │
│  │  └─ types/
│  │     ├─ api.ts
│  │     ├─ common.ts
│  │     └─ index.ts
│  │
│  ├─ integrations/
│  │  ├─ supabase/
│  │  │  ├─ client.ts
│  │  │  ├─ server.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ storage.ts
│  │  │  ├─ queries/
│  │  │  │  ├─ organizations.ts
│  │  │  │  ├─ projects.ts
│  │  │  │  ├─ diary.ts
│  │  │  │  ├─ documents.ts
│  │  │  │  └─ invitations.ts
│  │  │  └─ generated/
│  │  │     └─ database.types.ts
│  │  │
│  │  ├─ pdf/
│  │  │  ├─ generateDiaryEntryPdf.ts
│  │  │  ├─ generateProjectSummaryPdf.ts
│  │  │  └─ templates/
│  │  │     ├─ DiaryEntryPdfTemplate.tsx
│  │  │     └─ ProjectSummaryPdfTemplate.tsx
│  │  │
│  │  └─ analytics/
│  │     └─ trackEvent.ts
│  │
│  ├─ styles/
│  │  ├─ globals.css
│  │  ├─ tokens.css
│  │  └─ utilities.css
│  │
│  ├─ main.tsx
│  └─ vite-env.d.ts
│
├─ .env
├─ .env.example
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ README.md
```

## Zašto je ova struktura dobra
- app/ drži globalni framework (router, layout, providers).
- pages/ su “thin” entry točke i samo slažu feature module.
- features/ su pravi business moduli.
- shared/ su generičke reusable stvari.
- integrations/ je “vanjski svijet” (Supabase, PDF, analytics).

## Pravila da projekt ne ode u kaos
- Sve business-specifično ide u feature folder.
- Shared znači stvarno shared (nema domain polja u shared komponentama).
- API funkcije drži blizu featurea.
- Integracije drži odvojeno od UI-a.

## Clean architecture varijanta (za skaliranje)

```
src/
├─ app/
│  ├─ providers/
│  ├─ router/
│  └─ layouts/
│
├─ domain/
│  ├─ organizations/
│  │  ├─ organization.entity.ts
│  │  ├─ organization.types.ts
│  │  └─ organization.rules.ts
│  ├─ projects/
│  │  ├─ project.entity.ts
│  │  ├─ project.types.ts
│  │  └─ project.rules.ts
│  ├─ diary/
│  │  ├─ diaryEntry.entity.ts
│  │  ├─ diaryPhoto.entity.ts
│  │  ├─ diary.types.ts
│  │  └─ diary.rules.ts
│  ├─ clients/
│  ├─ documents/
│  └─ invitations/
│
├─ application/
│  ├─ organizations/
│  │  ├─ useCases/
│  │  │  ├─ createOrganization.ts
│  │  │  ├─ updateOrganization.ts
│  │  │  └─ inviteOrganizationMember.ts
│  │  └─ dto/
│  ├─ projects/
│  │  ├─ useCases/
│  │  │  ├─ createProject.ts
│  │  │  ├─ archiveProject.ts
│  │  │  ├─ addProjectMember.ts
│  │  │  └─ listProjects.ts
│  │  └─ dto/
│  ├─ diary/
│  │  ├─ useCases/
│  │  │  ├─ createDiaryEntry.ts
│  │  │  ├─ updateDiaryEntry.ts
│  │  │  ├─ uploadDiaryPhoto.ts
│  │  │  └─ generateDiaryEntryPdf.ts
│  │  └─ dto/
│  └─ shared/
│     ├─ interfaces/
│     │  ├─ OrganizationRepository.ts
│     │  ├─ ProjectRepository.ts
│     │  ├─ DiaryRepository.ts
│     │  └─ StorageRepository.ts
│     └─ errors/
│
├─ infrastructure/
│  ├─ supabase/
│  │  ├─ client.ts
│  │  ├─ repositories/
│  │  │  ├─ SupabaseOrganizationRepository.ts
│  │  │  ├─ SupabaseProjectRepository.ts
│  │  │  ├─ SupabaseDiaryRepository.ts
│  │  │  └─ SupabaseDocumentRepository.ts
│  │  ├─ mappers/
│  │  └─ queries/
│  ├─ storage/
│  │  ├─ SupabaseStorageRepository.ts
│  │  └─ fileUpload.ts
│  ├─ pdf/
│  │  ├─ PdfGenerator.ts
│  │  └─ templates/
│  └─ analytics/
│
├─ presentation/
│  ├─ features/
│  │  ├─ organizations/
│  │  │  ├─ components/
│  │  │  ├─ hooks/
│  │  │  └─ pages/
│  │  ├─ projects/
│  │  ├─ diary/
│  │  ├─ clients/
│  │  └─ documents/
│  ├─ shared/
│  │  ├─ ui/
│  │  ├─ components/
│  │  └─ hooks/
│  └─ pages/
│
├─ styles/
├─ main.tsx
└─ vite-env.d.ts
```

## Preporuka sada
- Nemoj odmah full clean architecture.
- Uzmi prvi file tree i uvedi discipline:
  - thin pages
  - business logika u feature services/model
  - shared stvarno shared

## Naming konvencije
- Komponente: PascalCase.tsx (ProjectForm.tsx, DiaryEntryCard.tsx)
- Hookovi: useX.ts (useProjects.ts)
- API funkcije: glagol + entitet (createProject.ts)
- Tipovi: feature.types.ts
- Schema: feature.schema.ts
- Mapperi: feature.mapper.ts
- Konstante: feature.constants.ts

## Što izbjegavati
- /src/components, /src/hooks, /src/services kao globalni dump.
- Ogroman lib/ folder bez strukture.
- Miješanje business UI u shared.

## Mentalni model
- “Ako brišem feature, mogu obrisati cijeli folder?”
- Ako da -> dobra struktura. Ako ne -> kaos dolazi.
