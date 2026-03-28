# Supabase: clean baza od početka

## Zašto sada
- Nema stvarnih korisnika -> idealno vrijeme za totalni refactor temelja.
- Use case traži SQL + RLS + membership + shared access.
- Firestore može raditi, ali postaje težak za kompleksne permissione i reporting.

## Ciljevi koje baza mora podržati
- firma s više korisnika
- više projekata po firmi
- dnevni unosi i foto dokaz
- dijeljenje projekta s drugom firmom
- master projekt + podprojekti po disciplini
- subdomene bez nove baze

## Finalni data model (preporuka)

### A) profiles
- id (UUID, PK, isti kao auth user id)
- full_name
- email
- phone
- avatar_url
- created_at
- updated_at

### B) organizations
- id (UUID, PK)
- name
- slug (unique)
- type (contractor | investor | project_management | architect)
- oib (nullable)
- logo_url
- brand_color
- street
- city
- postal_code
- country (default HR)
- email
- phone
- website
- owner_user_id (FK -> profiles.id)
- status (active)
- created_at
- updated_at

### C) organization_members
- id (UUID, PK)
- organization_id (FK)
- user_id (FK -> profiles.id)
- role (owner | admin | manager | worker | viewer)
- status (invited | active | disabled)
- job_title (nullable)
- invited_by (FK -> profiles.id)
- joined_at
- created_at
- constraint: unique (organization_id, user_id)

### D) clients
- id (UUID, PK)
- organization_id (FK)
- name
- contact_person
- email
- phone
- street
- city
- notes
- created_by
- created_at
- updated_at

### E) projects
- id (UUID, PK)
- owner_organization_id (FK)
- client_id (FK, nullable)
- name
- slug (nullable)
- project_code (nullable)
- project_type (internal | shared | master | discipline)
- parent_project_id (FK -> projects.id, nullable)
- discipline (electro | water | hvac | architecture | general, nullable)
- status (draft | active | completed | archived)
- visibility (private | shared)
- street
- city
- postal_code
- object_type
- phase_current
- start_date
- end_date
- notes
- created_by
- created_at
- updated_at

### F) project_members
- id (UUID, PK)
- project_id (FK)
- organization_id (FK, nullable)
- user_id (FK, nullable)
- member_type (organization | user)
- role (owner | manager | editor | worker | viewer | contractor)
- access_scope (full_project | reports_only | discipline_only)
- discipline (nullable)
- status (invited | active | revoked)
- invited_by
- created_at
- constraint: barem organization_id ili user_id mora postojati

### G) project_phases (opcionalno)
- id
- project_id
- name
- phase_order
- status
- start_date
- end_date
- created_at

### H) diary_entries
- id (UUID, PK)
- organization_id (FK)
- project_id (FK)
- created_by (FK -> profiles.id)
- entry_number (integer, nullable)
- entry_date (date)
- work_from (time, nullable)
- work_to (time, nullable)
- hours_total (numeric, nullable)
- workers_count (integer, default 1)
- title
- phase_label
- work_type
- zone_label
- discipline (nullable)
- description
- status (completed | partially_completed | waiting_material | blocked | inspection_needed)
- materials_used_text
- missing_items_text
- return_visit_needed (boolean, default false)
- issue_note
- ai_summary
- signature_url
- signed_by_name
- signed_by_role
- client_note
- client_visible (boolean, default true)
- pdf_url
- created_at
- updated_at

### I) diary_entry_line_items
- id
- entry_id (FK)
- item_name
- quantity (numeric)
- unit
- notes
- sort_order
- created_at

### J) diary_photos
- id
- entry_id (FK)
- organization_id (FK)
- project_id (FK)
- url
- storage_path
- description
- sort_order
- taken_at (nullable)
- uploaded_by
- created_at

### K) documents
- id
- organization_id
- project_id (nullable)
- entry_id (nullable)
- document_type (report_pdf | plan | permit | contract | invoice_attachment | other)
- title
- file_url
- storage_path
- mime_type
- uploaded_by
- is_client_visible (boolean)
- created_at

### L) invitations
- id
- invitation_type (organization_member | project_member)
- organization_id (nullable)
- project_id (nullable)
- target_email
- target_name (nullable)
- role
- access_scope (nullable)
- discipline (nullable)
- token_hash
- status (pending | accepted | expired | revoked)
- invited_by
- expires_at
- created_at

### M) activity_log
- id
- organization_id
- project_id (nullable)
- entry_id (nullable)
- actor_user_id
- action_type
- entity_type
- entity_id
- metadata (jsonb)
- created_at

## Minimalna verzija za prvu produkciju
- profiles
- organizations
- organization_members
- clients
- projects
- project_members
- diary_entries
- diary_entry_line_items
- diary_photos
- documents
- invitations
- activity_log

## Što maknuti iz stare logike
- user kao direktni owner svega
- company podaci unutar user profila
- project access izveden samo iz companyId usporedbe
- line items kao neorganizirani blob ako želiš analitiku

## Najveći future-proof potez
- Nemoj modelirati firmu kao profil usera.
- Firma je zaseban entitet (organizations) i korisnici dolaze kroz membership.

## Što ne trebaš sada
- zasebne sheme po tenantu
- zasebne baze po firmi
- mikroservise
- kompleksan permission engine s desecima pravila
- full architect/investor portal
- multi-region deployment
- enterprise SSO

## Firestore vs Supabase (kratko)
- Supabase/SQL prirodno rješava upite tipa:
  - svi projekti ove firme
  - svi unosi po projektu, statusu, fazi, periodu
  - svi projekti gdje je firma član
  - svi korisnici organizacije
  - shared projekti po disciplini
- U Firestoreu je to moguće, ali uz više workarounda i veći rizik “permission kaosa”.

## Kada prebaciti
- Odmah, prije deploya pilot korisniku.
- Nema ozbiljnog production data -> najmanji rizik.

## Koraci migracije
1) Definiraj finalni SQL model.
2) Kreiraj Supabase projekt.
3) Auth: prebaci login/register na Supabase Auth.
4) Storage: prebaci fotke, potpise i PDF-ove.
5) Seed / ručni prijenos podataka (ako je malo, i ručno je ok).
6) RLS i permission model.
7) Spoji frontend i prođi cijeli flow.

## Storage bucketi (preporuka)
- organization-logos
- entry-photos
- signatures
- documents
- report-pdfs

## RLS logika (visok nivo)
- Korisnik vidi redove ako:
  - je član organizacije kojoj red pripada
  - ili je direktno član projekta
  - ili je projekt podijeljen njegovoj organizaciji kroz project_members
- diary_entries permissions se rješavaju preko projekata.

## Subdomene i Supabase
- Subdomene su UX/onboarding/brending sloj.
- Svi koriste isti API, isti auth i istu bazu.

## Faze proizvoda (tehnički smisao)
- Faza A: elektro pilot (firma, članovi, klijenti, projekti, unosi, foto dokaz, potpis, PDF).
- Faza B: shared projects (project_members, invite vanjske firme, scope).
- Faza C: master projekt (project_type = master, parent_project_id, discipline child projekti).

## Plan u 7 dana (konkretno)
- Dan 1: definiraj model + kreiraj Supabase projekt.
- Dan 2: tablice i relacije + storage bucketi.
- Dan 3: auth + profiles + organizations + memberships.
- Dan 4: projects + project_members + clients.
- Dan 5: diary_entries + line_items + photos + documents.
- Dan 6: osnovni RLS + seed + test data.
- Dan 7: frontend integracija i full flow test.
