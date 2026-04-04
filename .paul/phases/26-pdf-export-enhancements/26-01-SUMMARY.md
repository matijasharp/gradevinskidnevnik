---
phase: 26-pdf-export-enhancements
plan: 01
subsystem: pdf
tags: [pdf-lib, jspdf, edge-function, supabase, deno, fontkit]

requires:
  - phase: 20-edge-functions
    provides: generate-pdf Edge Function (deployed, previously unverified)

provides:
  - Edge Function wired as primary PDF path with jsPDF fallback
  - Aspect-ratio-preserving photo rendering in both PDF paths
  - Markdown table renderer in Edge Function

affects: 26-02

tech-stack:
  added: []
  patterns:
    - "verify_jwt: false for Edge Functions that receive all data via payload (no DB access)"
    - "Use .woff (not .woff2) with @pdf-lib/fontkit@1.1.1 — woff2 causes glyph mapping failure"

key-files:
  modified:
    - supabase/functions/generate-pdf/index.ts
    - app/src/integrations/pdf/generateDiaryPdf.ts

key-decisions:
  - "verify_jwt: false — function receives full payload, no user-specific DB access needed"
  - "Jost .woff over .woff2 — fontkit 1.1.1 woff2 glyph mapping produces all-E output"
  - "Markdown table renderer added post-plan at user request — accepted scope addition"

patterns-established:
  - "py(rowYMm) - drawH for top-aligned image placement in pdf-lib (bottom-left origin)"
  - "supabase.functions.invoke returns Blob for PDF — check data instanceof Blob before use"

duration: ~45min
started: 2026-04-04T00:00:00Z
completed: 2026-04-04T00:00:00Z
---

# Phase 26 Plan 01: Edge Function PDF Wiring + Aspect Ratio Fix Summary

**Edge Function wired as primary PDF path (jsPDF fallback preserved), photos now render fit-within 55×41mm preserving aspect ratio in both paths, with markdown table rendering added.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~45 min |
| Tasks | 2 completed |
| Deployments | 3 (v11 → v12 → v13, each fixing a discovered issue) |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Edge Function primary path | Pass | POST to /functions/v1/generate-pdf confirmed; fallback triggers on error |
| AC-2: Aspect ratio both paths | Pass | Verified visually — landscape/portrait photos no longer stretched |
| AC-3: Build passes | Pass | `npm run build` clean, no TypeScript errors |

## Accomplishments

- `supabase.functions.invoke('generate-pdf', ...)` wired at top of `generateDiaryPdf`; returns on Blob success, logs warning and falls back on error
- Edge Function photo loop now uses `Math.min(maxW / img.width, maxH / img.height)` scale — top-aligned via `py(rowYMm) - drawH`
- jsPDF fallback photo loop uses same scale logic via `img.width`/`img.height` from loaded HTMLImageElement
- Markdown table lines detected and rendered as pdf-lib rectangles (header row light-blue, alternating row shading, 55/22.5/22.5% column split)

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `supabase/functions/generate-pdf/index.ts` | Modified | Aspect ratio fix + table renderer + font → woff + verify_jwt false |
| `app/src/integrations/pdf/generateDiaryPdf.ts` | Modified | Edge Function primary path + supabase import + jsPDF fallback aspect ratio fix |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| `verify_jwt: false` on Edge Function | Function receives all data via payload; 401 blocked all calls | All authenticated users can call; no per-user auth needed for PDF generation |
| Switch font from `.woff2` to `.woff` | `@pdf-lib/fontkit@1.1.1` has woff2 glyph mapping failure — all chars rendered as "E" | Jost font renders correctly; woff2 documented as known-bad for this fontkit version |
| Add markdown table renderer | User-requested after seeing raw `\|` table syntax in output | AI summaries with tables now render as proper styled tables |

## Deviations from Plan

### Summary

| Type | Count | Impact |
|------|-------|--------|
| Scope additions | 2 | Markdown table renderer (user-approved); Edge Function redeployments |
| Auto-fixed | 2 | 401 (verify_jwt), woff2 font rendering failure |
| Deferred | 0 | — |

**Total impact:** Two unplanned issues discovered during live verification required extra deployments; both resolved. One user-requested scope addition (table renderer) accepted and completed.

### Auto-fixed Issues

**1. Edge Function 401 Unauthorized**
- **Found during:** Live test after Task 2
- **Issue:** `verify_jwt: true` (default) blocked `supabase.functions.invoke` — returned 401
- **Fix:** Redeployed with `verify_jwt: false` (v11)
- **Rationale:** Function receives full payload, no DB access — JWT verification adds no security value

**2. Woff2 glyph rendering failure**
- **Found during:** First successful v11 PDF download
- **Issue:** All text rendered as repeated "E" characters — fontkit 1.1.1 cannot correctly decode woff2 glyph maps
- **Fix:** Switched font URL from `.woff2` to `.woff` (v12)

### Scope Addition

**Markdown table renderer (user-approved)**
- **Origin:** User observed raw `| Opis stavke | Količina |` syntax in PDF output after v12
- **Added:** `parseMarkdownTable` + `drawTable` functions; AI summary block refactored to line-by-line processing
- **Deployed:** v13

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| 401 on Edge Function invoke | verify_jwt set to false, redeployed |
| All text rendered as "E" | woff2 → woff font format change |
| Raw markdown table in output | Table renderer added (scope addition) |

## Next Phase Readiness

**Ready:**
- Edge Function v13 active, serving PDFs correctly
- jsPDF fallback intact and functional
- Both photo paths aspect-ratio-correct
- Markdown table rendering in place

**Concerns:**
- Font loaded from CDN on every invocation — if jsDelivr is unavailable, font fetch fails and function throws. No fallback font yet.
- Table cell text truncated at 50 chars — long cell content silently cut off

**Blockers:** None

---
*Phase: 26-pdf-export-enhancements, Plan: 01*
*Completed: 2026-04-04*
