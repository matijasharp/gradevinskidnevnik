# Data model i permission koncept

## Multi-tenant osnova
- Jedna baza i jedan backend.
- Logička odvojenost podataka po organization_id.
- Tenant tipovi:
  - Company tenant (firma izvođača)
  - Project tenant / master project workspace
- User membership layer:
  - korisnik može biti član svoje firme i više centralnih projekata

## Ključna odluka
- Ne odvojene baze po subdomeni.
- Ne odvojeni deployevi i logika po struci.
- Multi-tenant + cross-project sharing je ispravan smjer.

## Osnovni entiteti (visok nivo)
- organizations
  - Tipovi: investor, contractor, architect, supervisor, permit_authority (kasnije), project_management_company
- users
- organization_members
  - Uloge: owner, admin, manager, field_worker, client_viewer, external_collaborator
- projects
  - project_type: internal | master
  - owner_organization_id
- project_disciplines (podprojekti po struci)
  - project_id
  - discipline_type (elektro, voda, klimatizacija, strojarski, arhitektura, završni radovi)
  - assigned_organization_id
  - status, start_date, due_date
- project_participants
  - organizacija, pojedinac ili vanjski suradnik
- reports (terenska izvješća)
  - projekt ili podprojekt, autor, faza, datum, lokacija
  - opis, fotografije, problemi, sljedeći koraci
- documents
  - nacrti, dozvole, troškovnici, atesti, zapisnici, ugovori
- tasks
  - zadaci po projektu / disciplini / fazi
- phase_updates
  - promjene statusa po fazi
- invitations
  - poziv firmi ili korisniku na sudjelovanje

## “Svaka firma ima svoju bazu”
- Poslovno zvuči dobro, ali tehnički rješenje je logička izolacija.
- Implementacija:
  - row-level security (RLS)
  - tenant isolation
  - membership pravila
  - share permission model
- Fizički odvojene baze imaju smisla tek kasnije:
  - enterprise klijenti
  - zahtjev za izolaciju
  - backup/export per customer
  - compliance razlozi

## Permission model (3 sloja)
### 1) Organization permissions
- Što korisnik smije unutar svoje firme.
- Primjeri: owner, project manager, worker.

### 2) Project permissions
- Što korisnik smije na određenom projektu.
- Primjeri: view, edit, upload reports, close phases, comment-only.

### 3) Shared scope permissions
- Firma pozvana u centralni projekt vidi samo svoj scope.
- Primjer: elektro firma vidi
  - elektro podprojekt
  - relevantne nacrte
  - svoje zadatke i rokove
  - centralne announcemente
- Ne vidi:
  - financije drugih izvođača
  - privatne dokumente investitora
  - interne komentare koji nisu shareani
