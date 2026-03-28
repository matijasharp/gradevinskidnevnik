# Trenutna Firestore struktura i minimalni refactor

## Trenutna struktura (Firestore)

### 1) companies (Tvrtke)
- name (obavezno)
- ownerEmail (obavezno)
- logoUrl
- brandColor
- street, city, address
- email, phone, website

### 2) users (Korisnici)
- companyId (obavezno)
- name (obavezno)
- email (obavezno)
- role: admin | worker (obavezno)

### 3) projects (Projekti)
- companyId (obavezno)
- clientName (obavezno)
- projectName (obavezno)
- street, city
- objectType
- status: active | completed | archived (obavezno)
- phase (npr. Priprema, Razvod, Montaža...)
- startDate
- notes

### 4) diaryEntries (Dnevni unosi)
- companyId, projectId (obavezno)
- createdBy (obavezno)
- entryDate (obavezno)
- title
- phase
- workType, zone
- description
- status: završeno, djelomično završeno, čeka materijal, blokirano... (obavezno)
- hours
- workersCount
- materialsUsed (tekst)
- lineItems (lista materijala: naziv, količina, jedinica)
- missingItems
- returnVisitNeeded (boolean)
- issueNote
- aiSummary
- signatureUrl

### 5) diaryPhotos (Fotografije)
- entryId (obavezno)
- url (obavezno)
- storagePath
- description

## Procjena stanja
- Dovoljno dobro za single-company app.
- Nije dovoljno za multi-tenant i shared project viziju.
- Najveći problem: ownership je user/company centric bez membership sloja.

## Što je već dobro
- companies kao zaseban entitet (najvažnije).
- diaryEntries imaju projectId, createdBy, status, faze, materijal, potpis.
- diaryPhotos su odvojene od entryja (ispravno).

## Minimalni refactor (4 ciljane promjene)

### 1) Uvedi companyMembers
- Nova kolekcija: companyMembers
  - companyId
  - userId
  - role (owner, admin, manager, worker)
  - status (active, invited, disabled)
  - invitedBy
  - joinedAt
- users.companyId zadrži privremeno (legacy), ali novu logiku gradi na companyMembers.

### 2) Fleksibilniji projects
- Dodaj:
  - projectType: internal | shared | master
  - visibility: private | shared
  - ownerCompanyId
  - createdBy
- companyId može ostati privremeno, ali dugoročno ownerCompanyId.

### 3) Uvedi projectMembers
- Nova kolekcija: projectMembers
  - projectId
  - companyId
  - userId (nullable)
  - memberType: company | user
  - role: owner | manager | editor | viewer | contractor
  - accessScope: full_project | reports_only | discipline_only
  - discipline (electro, water, hvac)
  - status: active | invited
- Omogućuje vanjske firme, pojedince bez full company accessa i discipline-based pristup.

### 4) Nadogradi diaryEntries
- Dodaj:
  - createdAt
  - updatedAt
  - reportNumber / entryNumber
  - pdfUrl
  - clientVisible (boolean)
  - sharedScope (optional)
  - discipline (electro, water, hvac)
  - signedByName
  - signedByRole
  - workDateFrom
  - workDateTo

## Dodatno na companies (preporuka)
- slug
- type (contractor, investor, architect, pm)
- ownerUserId
- createdAt
- status

## Dodatno na diaryPhotos (opcionalno)
- companyId
- projectId
- createdAt
- sortOrder
- isCover

## Nova minimalna struktura (sačuvaj postojeće gdje može)
- companies (nadograđene)
- users (companyId može ostati privremeno)
- companyMembers (novo)
- projects (ownerCompanyId + projectType)
- projectMembers (novo)
- diaryEntries (audit + pdf + discipline polja)
- diaryPhotos (po potrebi nadograditi)
- invitations (novo, za buduće dijeljenje)

## Mapiranje na buduću viziju
- Faza 1: elektro app radi bez problema.
- Faza 2: projectMembers omogućuje dijeljenje projekata.
- Faza 3: projectType = master + parentProjectId + discipline -> master projekt + podprojekti.

## Kad moraš mijenjati ownership odmah
- Ako tablice izgledaju ovako:
  - projects.user_id
  - reports.user_id
  - company_settings.user_id
- Ownership mora ići preko organization_id i membership tablica.

## Firestore napomena
- Firestore je dobar za brzi start i jednostavni CRUD.
- Slabiji je za kompleksna prava pristupa, cross-company upite, agregacije i reporting.
- Nemoj držati permissione implicitno u frontendu; spremi membership eksplicitno u bazi.

## Kada je ok ostaviti “kako je”
- jedan user = jedna firma
- svi projekti pripadaju toj firmi
- nema dijeljenja projekta
- nema više organizacija po korisniku
- nema role modela osim admin/user
- nema ozbiljnog production data

## Deploy sada ili refactor prije?
- Preporuka: mali refactor prije deploya.
- Ne totalni rewrite, nego 3–7 dana pametnog posla.
- Obavezno prije deploya:
  - companyMembers
  - projectMembers
  - projectType + ownerCompanyId
  - audit polja u diaryEntries
