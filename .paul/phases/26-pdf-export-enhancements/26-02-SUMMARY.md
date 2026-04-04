---
phase: 26-pdf-export-enhancements
plan: 02
subsystem: pdf
tags: [pdf, jspdf, pdf-lib, edge-function, supabase, deno, lucide-react, diary-entry]

requires:
  - phase: 26-pdf-export-enhancements/26-01
    provides: generateDiaryPdf with Edge Function primary path + jsPDF fallback; fetchDiaryPhotos available in photos.ts

provides:
  - "Preuzmi PDF" per-entry download button in DiaryEntryDetailModal
  - onDownloadPdf optional prop pattern for modal-level PDF generation
  - Edge Function v14 deployed — pinned font version + Helvetica fallback (no more 500s from CDN)
  - jsPDF fallback markdown table rendering via autoTable (parseMarkdownContent helper)

affects: Phase 27 (Stripe)

tech-stack:
  added: []
  patterns:
    - "onDownloadPdf?: () => Promise<void> — optional async prop pattern for PDF download in modals"
    - "pdfLoading local state + finally block — prevents double-fire; spinner shown during async op"
    - "fetchDiaryPhotos(entry.id) → generateDiaryPdf(project, [entry], company, photos) — single-entry PDF wiring pattern"
    - "@fontsource/jost@4.5.0 pinned in Edge Function — never use unpinned CDN URLs for font assets"
    - "StandardFonts.Helvetica fallback — font CDN failure must never cause a 500; always degrade gracefully"
    - "parseMarkdownContent — splits aiSummary into text/table segments before jsPDF render"

key-files:
  modified:
    - app/src/features/diary/components/DiaryEntryDetailModal.tsx
    - app/src/features/projects/components/ProjectDetailPage.tsx
    - app/src/integrations/pdf/generateDiaryPdf.ts
    - supabase/functions/generate-pdf/index.ts

key-decisions:
  - "onDownloadPdf is optional (?) — button only renders when prop provided; no change to views without it"
  - "Pin @fontsource/jost@4.5.0 — unpinned URL resolved to a newer package version with different file structure, causing all v12/v13 calls to 500"
  - "Helvetica fallback instead of throwing — font CDN outages must produce a PDF (degraded), not a 500"
  - "parseMarkdownContent added to jsPDF fallback — autoTable was already imported but unused; now used for markdown tables in aiSummary"

patterns-established:
  - "Modal PDF download: optional prop + local pdfLoading state + finally reset — reusable in any future modal"
  - "Single-entry PDF: pass [entry] array to generateDiaryPdf — same function, scoped to one entry"

duration: ~20min
started: 2026-04-04T00:00:00Z
completed: 2026-04-04T00:00:00Z
---

# Phase 26 Plan 02: Per-Entry PDF Download + Edge Function Fix Summary

**"Preuzmi PDF" button added to diary entry detail modal; Edge Function v14 deployed with pinned font and Helvetica fallback resolving persistent 500s; jsPDF fallback now renders markdown tables via autoTable.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Tasks | 2/2 completed (+ 2 out-of-scope fixes) |
| Deployments | 1 (Edge Function v14) |
| Files modified | 4 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: "Preuzmi PDF" button visible in entry detail modal | Pass | Button renders when `onDownloadPdf` prop provided; hidden when omitted |
| AC-2: PDF downloads with loading state | Pass | Spinner + "Generiranje..." text during generation; resets on completion/error. User confirmed: "PDF works perfectly!" |
| AC-3: Build passes | Pass | `npm run build` in `app/` clean, no TypeScript errors |

## Accomplishments

- `DiaryEntryDetailModal` gained `onDownloadPdf?: () => Promise<void>` optional prop, `pdfLoading` state, `handleDownloadPdf` handler, and a "Preuzmi PDF" button (with `FileDown` icon + `Loader2` spinner) inserted after the "Uredi" button in the footer action row
- `ProjectDetailPage` wires `onDownloadPdf` to `fetchDiaryPhotos(selectedEntry.id)` → `generateDiaryPdf(entryProject!, [selectedEntry], company, photos)` — single-entry PDF using the same shared generator
- Edge Function v14 deployed: font URL pinned to `@fontsource/jost@4.5.0`, wrapped in try/catch with `StandardFonts.Helvetica` fallback — eliminates CDN-induced 500s permanently
- `parseMarkdownContent` helper added to `generateDiaryPdf.ts` — splits `aiSummary` into text and table segments; table segments rendered with `autoTable` (jspdf-autotable was already imported but unused); resolves raw `| pipe |` table display in jsPDF fallback

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `app/src/features/diary/components/DiaryEntryDetailModal.tsx` | Modified | Added `FileDown` import, `onDownloadPdf?` prop, `pdfLoading` state, `handleDownloadPdf`, "Preuzmi PDF" button |
| `app/src/features/projects/components/ProjectDetailPage.tsx` | Modified | Added `fetchDiaryPhotos` import; wired `onDownloadPdf` in `DiaryEntryDetailModal` JSX |
| `app/src/integrations/pdf/generateDiaryPdf.ts` | Modified | Added `parseMarkdownContent` helper; replaced flat `stripMarkdown` render with segment-aware render (text via `doc.text`, tables via `autoTable`) |
| `supabase/functions/generate-pdf/index.ts` | Modified | Added `StandardFonts` import; pinned Jost font to `@4.5.0`; wrapped font load in try/catch with Helvetica fallback |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `onDownloadPdf` is optional (`?`) | Button only appears where explicitly wired; no risk of breaking views that don't pass the prop | Safe to add to other modals in future |
| `entryProject!` non-null assertion in `onDownloadPdf` handler | Guaranteed non-null by `selectedEntry && entryProject &&` render gate on line 66 | TypeScript satisfied; no runtime risk |
| Pin font to `@fontsource/jost@4.5.0` | Unpinned URL was resolving to newer package (v5.x) with changed file structure — font fetch 404 → 500 for all v12/v13 calls | Font CDN changes no longer break deployments |
| Helvetica fallback instead of re-throwing | A PDF with Latin-only fallback font is far better than a 500 error | Function is now resilient to CDN outages |
| `parseMarkdownContent` in jsPDF (not just EF) | Both paths (EF primary + jsPDF fallback) should render tables correctly; user was seeing raw pipe syntax via fallback | Both PDF paths now produce clean table output |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Scope additions | 2 | Both user-requested; essential fixes |
| Auto-fixed | 0 | — |
| Deferred | 0 | — |

**Total impact:** Two out-of-plan fixes, both requested by user after observing active production bugs. Zero scope creep — both directly improve PDF quality and reliability.

### Scope Additions

**1. Edge Function v14 — font pinning + Helvetica fallback**
- **Origin:** User reported persistent 500 errors on PDF generate button; Edge Function logs confirmed v12/v13 consistently failing
- **Root cause diagnosed:** Unpinned `@fontsource/jost` URL resolving to v5.x package; font file at `files/jost-latin-ext-400-normal.woff` no longer exists at that path in v5.x → fetch 404 → throw → 500
- **Fix:** Pinned URL to `@4.5.0`; wrapped in try/catch with `StandardFonts.Helvetica` fallback so CDN issues degrade gracefully instead of 500ing
- **Deployed:** v14 (successful; user verified PDF works)

**2. jsPDF fallback markdown table rendering**
- **Origin:** User shared PDF screenshot showing raw `| Opis stavke | Količina | Jedinica mjere |` pipe syntax rendered as plain text in jsPDF fallback path
- **Root cause:** `stripMarkdown` strips `*`, `#`, `_` etc. but leaves `|` pipe characters intact; jsPDF has no markdown awareness
- **Fix:** Added `parseMarkdownContent` helper that splits text into `{type:'text'}` and `{type:'table'}` segments; text segments go through `stripMarkdown` + `doc.text`; table segments go through `autoTable` (jspdf-autotable was already imported via `import autoTable from "jspdf-autotable"` but the `void autoTable` suppression confirmed it was unused)
- **Files:** `app/src/integrations/pdf/generateDiaryPdf.ts`

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| Edge Function 500 on all v12/v13 calls | Root cause: unpinned font CDN URL breaking on package version bump. Fixed: pinned @4.5.0 + fallback font |
| Raw `\| pipe \|` table syntax in jsPDF output | Root cause: `stripMarkdown` doesn't handle table syntax. Fixed: `parseMarkdownContent` + `autoTable` render |

## Next Phase Readiness

**Ready:**
- Phase 26 complete — all three scope items delivered: aspect ratio (26-01), Edge Function primary path (26-01), per-entry PDF download (26-02)
- PDF generation is now fully resilient: Edge Function v14 with font fallback + jsPDF fallback with table rendering
- `onDownloadPdf` pattern is reusable for any future modal that needs a download button

**Concerns:**
- Table cell text in Edge Function is still truncated at 50 chars (`.slice(0, 50)`) — acceptable for MVP but will clip long technical descriptions
- `entryProject` lookup in `ProjectDetailPage` only searches `projects`, not `sharedProjects` — if a shared project entry is opened, `entryProject` is null and the modal doesn't render (pre-existing limitation, unrelated to this plan)

**Blockers:** None — ready for Phase 27 (Stripe Billing Foundation)

---
*Phase: 26-pdf-export-enhancements, Plan: 02*
*Completed: 2026-04-04*
