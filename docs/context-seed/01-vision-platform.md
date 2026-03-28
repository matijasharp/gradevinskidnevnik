# Vizija platforme i arhitektura proizvoda

## Polazna ideja
- Mini web app za električare: uređivanje tvrtke, projekti, izvještaji s terena, faze projekta.
- Domen: gradevinskidnevnik.online.
- Ideja subdomena po struci: elektro.gradevinskidnevnik.online, voda.gradevinskidnevnik.online, klima.gradevinskidnevnik.online.
- Glavna domena namijenjena investitoru i voditelju projekta; kooperanti po strukama.

## Strategija: jedna jezgra + vertikalni entry points
- Jedan core backend i jedna platforma.
- Subdomene su UX/GTM sloj (landing + login + prilagođeni UI), ne zasebni proizvodi.
- Izbjegava se dupliranje featurea, autha, billinga i bug fixeva.
- Kasnije povezivanje podataka ostaje prirodno jer je backend isti.

## Dvije razine rada
### A) Organizacija izvođača (contractor workspace)
- Svaka firma ima:
  - svoju organizaciju i korisnike
  - svoje klijente i interne projekte
  - izvještaje, faze rada i dokumente
  - data ownership po organization_id (logička odvojenost)

### B) Centralni građevinski projekt (master workspace)
- Na gradevinskidnevnik.online vodi se glavni projekt:
  - investitor, glavni izvođač, voditelj projekta
  - projektanti i nadzor
  - dozvole i dokumentacija
  - kooperanti i podprojekti po strukama

## Multi-tenant model (ne odvojene baze)
- Tenant tipovi:
  - Company tenant (firma izvođača)
  - Project tenant / master project workspace
- User membership layer:
  - korisnik može biti član svoje firme i više centralnih projekata
- Mentalni model:
  - jedna platforma s više workspaceova i pogleda prema ulozi korisnika
  - ne “elektro app + voda app + glavna app”

## Primjer scenarija (master projekt)
1. Investitor ili voditelj kreira projekt (npr. “Stambena zgrada Sesvete”).
2. Kreiraju se podprojekti po strukama:
   - elektro, voda i odvodnja, klimatizacija, stolarija, završni radovi
3. Podprojekt “Elektro” sadrži:
   - opis radova, faze, rokove, dokumente, nacrte, checklistu, terenska izvješća
   - odgovornu firmu
4. Elektro firma dobije poziv:
   - u svojoj app vidi interne projekte i “Dodijeljene/Kooperantske projekte”
   - vidi samo elektro segment, podijeljene dokumente i svoje zadatke
   - predaje izvještaje, slike, zapisnike, status faze
5. Centralni voditelj vidi agregirani status svih struka:
   - kašnjenja, probleme, dozvole, tko je što predao, dnevnik aktivnosti

## Proizvodi (paketi funkcionalnosti)
### 1) Contractor Workspace (elektro, voda, klima, stolarija, ...)
- profil tvrtke
- klijenti
- projekti
- faze projekta
- izvještaji s terena
- fotografije
- zadaci
- dokumenti
- evidencija radova
- suradnja s ekipom

### 2) Master Project Workspace (investitori, voditelji, glavni izvođači)
- centralni projekt
- svi sudionici
- podprojekti po strukama
- dokumentacija i dozvole
- timeline
- nadzor
- status po izvođaču
- zapisnici
- problemi / blokatori
- audit trail

## Subdomene kao UX/GTM sloj
- gradevinskidnevnik.online -> centralni portal
- elektro.gradevinskidnevnik.online -> landing + login za elektro
- voda.gradevinskidnevnik.online -> landing + login za vodu
- klima.gradevinskidnevnik.online -> landing + login za klimu
- Backend i baza ostaju isti.

## Navigacija (visok nivo)
### A) Glavna domena
- Dashboard
- Projekti
- Sudionici
- Discipline / podprojekti
- Dokumentacija
- Dozvole
- Izvještaji
- Problemi / issue tracker
- Vremenska linija
- Audit log

### B) Strukovne subdomene
- Moja tvrtka
- Klijenti
- Moji projekti
- Dodijeljeni projekti
- Terenska izvješća
- Faze
- Dokumenti
- Tim
- Predlošci izvještaja

## Core engine vs vertical layer
### Core (svima isto)
- auth, organizacije, korisnici
- projekti, zadaci, dokumenti, izvještaji
- notifikacije, audit log, dijeljenje pristupa

### Vertical layer (po struci)
- nazivi faza
- predlošci izvještaja
- checkliste
- tipovi dokumenata
- specifični dashboard widgeti
- terminologija

## MVP i faze razvoja
- Faza 1: elektro izvođači (jasna niša, lakša prodaja)
- Faza 2: dodati voda i klima
- Faza 3: centralni master project workspace

## Napomena o brandu
- gradevinskidnevnik.online je funkcionalno dobar, ali zvuči generički.
- Za početak super; kasnije može doći brand ime iznad toga.
