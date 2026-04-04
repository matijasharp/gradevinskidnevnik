import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'
import fontkitModule from 'https://esm.sh/@pdf-lib/fontkit@1.1.1'
// Handle CJS default export wrapping from esm.sh
// deno-lint-ignore no-explicit-any
const fontkit = (fontkitModule as any)?.default ?? fontkitModule

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Convert mm-from-top to pdf-lib points-from-bottom
function py(yMm: number, pageHeight = 841.89): number {
  return pageHeight - (yMm * 2.835)
}

function mmToPt(mm: number): number {
  return mm * 2.835
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
  }
  return [0.227, 0.725, 0.890] // #3ab9e3 normalized
}

function wrapText(text: string, font: any, fontSize: number, maxWidthPt: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(test, fontSize) > maxWidthPt && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

async function embedImage(pdfDoc: PDFDocument, bytes: Uint8Array): Promise<any> {
  try {
    return await pdfDoc.embedJpg(bytes)
  } catch {
    try {
      return await pdfDoc.embedPng(bytes)
    } catch {
      return null
    }
  }
}

// Minimal Croatian date formatter: dd.MM.yyyy
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// Minimal markdown stripper
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/_(.*?)_/g, '$1')
}

// Parse markdown table lines into rows of cells (excludes separator row)
function parseMarkdownTable(tableLines: string[]): string[][] {
  return tableLines
    .filter(line => !line.trim().match(/^\|[\s:|-]+\|$/))
    .map(line =>
      line.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    )
}

// Draw a parsed markdown table; returns updated yMm
function drawTable(page: any, rows: string[][], jost: any, xMm: number, widthMm: number, startYMm: number): number {
  const rowH = 7
  const padX = mmToPt(1.5)
  const padY = mmToPt(1.5)
  const totalW = mmToPt(widthMm)
  const colCount = Math.max(...rows.map(r => r.length), 1)

  const firstColW = colCount > 1 ? totalW * 0.55 : totalW
  const otherColW = colCount > 1 ? (totalW - firstColW) / (colCount - 1) : 0
  const colWidths = Array.from({ length: colCount }, (_, i) => i === 0 ? firstColW : otherColW)

  let yMm = startYMm
  for (let ri = 0; ri < rows.length; ri++) {
    const isHeader = ri === 0
    const rowBottomPt = py(yMm + rowH)
    const rowHeightPt = mmToPt(rowH)
    let xCursor = mmToPt(xMm)
    for (let ci = 0; ci < colCount; ci++) {
      const w = colWidths[ci]
      const cell = (rows[ri]?.[ci] ?? '').slice(0, 50)
      page.drawRectangle({
        x: xCursor,
        y: rowBottomPt,
        width: w,
        height: rowHeightPt,
        color: isHeader ? rgb(0.90, 0.95, 0.99) : ri % 2 === 1 ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1),
        borderColor: rgb(0.80, 0.80, 0.80),
        borderWidth: 0.4,
      })
      if (cell) {
        page.drawText(cell, {
          x: xCursor + padX,
          y: rowBottomPt + padY,
          size: 8,
          font: jost,
          color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.3, 0.3, 0.3),
        })
      }
      xCursor += w
    }
    yMm += rowH
  }
  return yMm + 3
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { project, entries, company, photos } = await req.json()

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit)

    // Font loading — Jost for Croatian characters (pinned version; fallback to Helvetica)
    let jost: any
    try {
      const fontRes = await fetch('https://cdn.jsdelivr.net/npm/@fontsource/jost@4.5.0/files/jost-latin-ext-400-normal.woff')
      if (!fontRes.ok) throw new Error(`Font fetch failed: ${fontRes.status}`)
      const fontBytes = new Uint8Array(await fontRes.arrayBuffer())
      jost = await pdfDoc.embedFont(fontBytes)
    } catch (fontError) {
      console.warn('Jost font unavailable, falling back to Helvetica:', fontError)
      jost = await pdfDoc.embedFont(StandardFonts.Helvetica)
    }

    // Brand color
    const [cr, cg, cb] = hexToRgb(company?.brandColor ?? '#3ab9e3')
    const brandColor = rgb(cr, cg, cb)

    // First page
    let page = pdfDoc.addPage([595.28, 841.89])
    let yMm = 15

    // Company logo (top-right)
    if (company?.logoUrl) {
      const logoBytes = await fetchImageBytes(company.logoUrl)
      if (logoBytes) {
        const img = await embedImage(pdfDoc, logoBytes)
        if (img) {
          page.drawImage(img, {
            x: mmToPt(170),
            y: py(10 + 25),
            width: mmToPt(25),
            height: mmToPt(25),
          })
        }
      }
    }

    // Company name header
    page.drawText(company?.name ?? 'Građevinski Dnevnik Online', {
      x: mmToPt(14),
      y: py(22),
      size: 22,
      font: jost,
      color: brandColor,
    })

    // Company info lines
    yMm = 27
    if (company?.address) {
      page.drawText(company.address, { x: mmToPt(14), y: py(yMm), size: 8, font: jost, color: rgb(0.59, 0.59, 0.59) })
      yMm += 4
    }
    if (company?.phone || company?.email) {
      const line = [company.phone, company.email].filter(Boolean).join(' | ')
      page.drawText(line, { x: mmToPt(14), y: py(yMm), size: 8, font: jost, color: rgb(0.59, 0.59, 0.59) })
      yMm += 4
    }
    if (company?.website) {
      page.drawText(company.website, { x: mmToPt(14), y: py(yMm), size: 8, font: jost, color: rgb(0.59, 0.59, 0.59) })
    }

    // Project info block
    page.drawText(`Izvještaj projekta: ${project.projectName}`, { x: mmToPt(14), y: py(42), size: 10, font: jost, color: rgb(0.39, 0.39, 0.39) })
    page.drawText(`Klijent: ${project.clientName}`, { x: mmToPt(14), y: py(47), size: 10, font: jost, color: rgb(0.39, 0.39, 0.39) })
    page.drawText(`Adresa: ${project.street}, ${project.city}`, { x: mmToPt(14), y: py(52), size: 10, font: jost, color: rgb(0.39, 0.39, 0.39) })
    page.drawText(`Datum: ${formatDate(new Date().toISOString())}`, { x: mmToPt(14), y: py(57), size: 10, font: jost, color: rgb(0.39, 0.39, 0.39) })

    // Divider line
    page.drawLine({
      start: { x: mmToPt(14), y: py(62) },
      end: { x: mmToPt(196), y: py(62) },
      thickness: 0.5,
      color: brandColor,
    })

    yMm = 72

    // Sort entries newest-first
    const sortedEntries = [...entries].sort((a: any, b: any) => b.entryDate.localeCompare(a.entryDate))

    for (const entry of sortedEntries) {
      // Page overflow check
      if (yMm > 240) {
        page = pdfDoc.addPage([595.28, 841.89])
        yMm = 20
      }

      // Entry header
      page.drawText(`${formatDate(entry.entryDate)} - ${entry.title}`, {
        x: mmToPt(14), y: py(yMm), size: 12, font: jost, color: rgb(0, 0, 0),
      })
      yMm += 7

      // Meta line
      let metaText = `Vrsta posla: ${entry.workType} | Status: ${entry.status}`
      if (entry.weatherCondition || entry.temperature) {
        metaText += ` | Vrijeme: ${entry.weatherCondition || '-'} (${entry.temperature || 0}°C)`
      }
      page.drawText(metaText, { x: mmToPt(14), y: py(yMm), size: 9, font: jost, color: brandColor })
      yMm += 6

      // AI summary — process line-by-line to render markdown tables properly
      if (entry.aiSummary) {
        const rawLines = entry.aiSummary.split('\n')
        let li = 0
        while (li < rawLines.length) {
          if (yMm > 285) { page = pdfDoc.addPage([595.28, 841.89]); yMm = 20 }
          const trimmed = rawLines[li].trim()
          if (trimmed.startsWith('|')) {
            // Collect all consecutive table lines
            const tableRawLines: string[] = []
            while (li < rawLines.length && rawLines[li].trim().startsWith('|')) {
              tableRawLines.push(rawLines[li])
              li++
            }
            const tableRows = parseMarkdownTable(tableRawLines)
            if (tableRows.length > 0) {
              if (yMm + tableRows.length * 7 > 280) { page = pdfDoc.addPage([595.28, 841.89]); yMm = 20 }
              yMm = drawTable(page, tableRows, jost, 14, 182, yMm)
            }
          } else {
            const text = stripMarkdown(trimmed)
            if (text) {
              const wrapped = wrapText(text, jost, 10, mmToPt(180))
              for (const wl of wrapped) {
                if (yMm > 285) { page = pdfDoc.addPage([595.28, 841.89]); yMm = 20 }
                page.drawText(wl, { x: mmToPt(14), y: py(yMm), size: 10, font: jost, color: rgb(0.24, 0.24, 0.24) })
                yMm += 5
              }
            } else if (trimmed === '') {
              yMm += 2
            }
            li++
          }
        }
        yMm += 5
      }

      // Line items
      if (entry.lineItems && entry.lineItems.length > 0) {
        if (yMm > 275) { page = pdfDoc.addPage([595.28, 841.89]); yMm = 20 }
        page.drawText('Izvršeni radovi / Stavke:', { x: mmToPt(14), y: py(yMm), size: 9, font: jost, color: rgb(0.31, 0.31, 0.31) })
        yMm += 5
        for (const item of entry.lineItems) {
          if (yMm > 275) { page = pdfDoc.addPage([595.28, 841.89]); yMm = 20 }
          page.drawText(`• ${item.name}: ${item.quantity} ${item.unit}`, { x: mmToPt(20), y: py(yMm), size: 9, font: jost, color: rgb(0.31, 0.31, 0.31) })
          yMm += 5
        }
        yMm += 5
      } else {
        yMm += 5
      }

      // Photos
      const entryPhotos = (photos as any[]).filter((p: any) => p.entryId === entry.id)
      if (entryPhotos.length > 0) {
        if (yMm > 230) { page = pdfDoc.addPage([595.28, 841.89]); yMm = 20 }
        page.drawText('Fotografije:', { x: mmToPt(14), y: py(yMm), size: 8, font: jost, color: rgb(0.59, 0.59, 0.59) })
        yMm += 4

        const count = Math.min(entryPhotos.length, 9)
        for (let pi = 0; pi < count; pi++) {
          const col = pi % 3
          const row = Math.floor(pi / 3)
          const xPt = mmToPt(14 + col * 59)
          const rowYMm = yMm + row * 45
          if (row > 0 && col === 0 && rowYMm > 245) break
          const imgBytes = await fetchImageBytes(entryPhotos[pi].url)
          if (imgBytes) {
            const img = await embedImage(pdfDoc, imgBytes)
            if (img) {
              const maxW = mmToPt(55)
              const maxH = mmToPt(41)
              const scale = Math.min(maxW / img.width, maxH / img.height)
              const drawW = img.width * scale
              const drawH = img.height * scale
              const yPt = py(rowYMm) - drawH
              page.drawImage(img, { x: xPt, y: yPt, width: drawW, height: drawH })
            }
          }
        }
        const rows = Math.min(Math.ceil(count / 3), 3)
        yMm += rows * 45 + 4
      }

      // Signature
      if (entry.signatureUrl) {
        if (yMm > 240) { page = pdfDoc.addPage([595.28, 841.89]); yMm = 20 }
        page.drawText('Potpis odgovorne osobe:', { x: mmToPt(14), y: py(yMm), size: 8, font: jost, color: rgb(0.59, 0.59, 0.59) })
        yMm += 2
        const sigBytes = await fetchImageBytes(entry.signatureUrl)
        if (sigBytes) {
          const sigImg = await embedImage(pdfDoc, sigBytes)
          if (sigImg) {
            page.drawImage(sigImg, {
              x: mmToPt(14),
              y: py(yMm + 15),
              width: mmToPt(40),
              height: mmToPt(15),
            })
          }
        }
        yMm += 18
      }

      // Entry separator
      page.drawLine({
        start: { x: mmToPt(14), y: py(yMm - 2) },
        end: { x: mmToPt(196), y: py(yMm - 2) },
        thickness: 0.3,
        color: rgb(0.94, 0.94, 0.94),
      })
      yMm += 5
    }

    // Footer on every page
    const pageCount = pdfDoc.getPageCount()
    for (let i = 0; i < pageCount; i++) {
      const p = pdfDoc.getPage(i)
      p.drawText(`Stranica ${i + 1} od ${pageCount}`, {
        x: 297.64,
        y: mmToPt(7),
        size: 8,
        font: jost,
        color: rgb(0.59, 0.59, 0.59),
      })
      p.drawText('Generirano putem Građevinski Dnevnik Online', {
        x: mmToPt(14),
        y: mmToPt(7),
        size: 8,
        font: jost,
        color: rgb(0.59, 0.59, 0.59),
      })
    }

    const pdfBytes = await pdfDoc.save()
    // RFC 5987 encoding — HTTP headers are ASCII-only (ByteString); project name may contain Croatian chars
    const encodedFilename = encodeURIComponent(`${project.projectName}_Izvjestaj.pdf`)
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        ...corsHeaders,
      },
    })
  } catch (error) {
    console.error('generate-pdf error:', error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
