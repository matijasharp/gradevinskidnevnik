import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Project, DiaryEntry, Company } from '../../shared/types';
import { safeFormatDate, stripMarkdown } from '../../shared/utils/format';

// Suppress unused import warning — autoTable registers itself as a jsPDF plugin
void autoTable;

export const generateDiaryPdf = async (project: Project, entries: DiaryEntry[], company: Company | null): Promise<void> => {
    const projectEntries = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    const doc = new jsPDF();

    // Load font for Croatian characters (Roboto supports UTF-8)
    try {
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
      const response = await fetch(fontUrl);
      const fontBuffer = await response.arrayBuffer();

      let binary = '';
      const bytes = new Uint8Array(fontBuffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fontBase64 = window.btoa(binary);

      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
    } catch (e) {
      console.error("Error loading font", e);
      doc.setFont('helvetica');
    }

    const companyName = company?.name || 'Site Diary Mini';

    // Helper to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [59, 130, 246]; // Default blue
    };

    const primaryColor = hexToRgb(company?.brandColor || '#3b82f6');

    // Logo
    if (company?.logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = company.logoUrl!;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        doc.addImage(dataURL, 'PNG', 170, 10, 25, 25);
      } catch (e) {
        console.warn("Could not add logo to PDF", e);
      }
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName, 14, 22);

    // Company Info
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    let headerY = 27;
    if (company?.address) { doc.text(company.address, 14, headerY); headerY += 4; }
    if (company?.phone || company?.email) {
      doc.text(`${company.phone || ''} ${company.phone && company.email ? '|' : ''} ${company.email || ''}`, 14, headerY);
      headerY += 4;
    }
    if (company?.website) { doc.text(company.website, 14, headerY); }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Izvještaj projekta: ${project.projectName}`, 14, 42);
    doc.text(`Klijent: ${project.clientName}`, 14, 47);
    doc.text(`Adresa: ${project.street}, ${project.city}`, 14, 52);
    doc.text(`Datum: ${safeFormatDate(new Date().toISOString(), 'dd.MM.yyyy')}`, 14, 57);

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 62, 196, 62);

    let y = 72;

    projectEntries.forEach((entry, index) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Entry Header
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`${safeFormatDate(entry.entryDate, 'dd.MM.yyyy')} - ${entry.title}`, 14, y);
      y += 7;

      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      let headerText = `Vrsta posla: ${entry.workType} | Status: ${entry.status}`;
      if (entry.weatherCondition || entry.temperature) {
        headerText += ` | Vrijeme: ${entry.weatherCondition || '-'} (${entry.temperature || 0}°C)`;
      }
      doc.text(headerText, 14, y);
      y += 6;

      // Main Content (AI Summary)
      if (entry.aiSummary) {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const cleanSummary = stripMarkdown(entry.aiSummary);
        const splitSummary = doc.splitTextToSize(cleanSummary, 180);
        doc.text(splitSummary, 14, y);
        y += (splitSummary.length * 5) + 5;
      }

      // Line Items (Logically organized)
      if (entry.lineItems && entry.lineItems.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text("Izvršeni radovi / Stavke:", 14, y);
        y += 5;

        entry.lineItems.forEach(item => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(`• ${item.name}: ${item.quantity} ${item.unit}`, 20, y);
          y += 5;
        });
        y += 5;
      } else {
        y += 5;
      }

      // Signature
      if (entry.signatureUrl) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Potpis odgovorne osobe:", 14, y);
        y += 2;
        try {
          doc.addImage(entry.signatureUrl, 'PNG', 14, y, 40, 15);
          y += 18;
        } catch (e) {
          console.warn("Could not add signature to PDF", e);
          y += 5;
        }
      }

      // Separator between entries
      doc.setDrawColor(240, 240, 240);
      doc.line(14, y - 2, 196, y - 2);
      y += 5;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Stranica ${i} od ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generirano putem Site Diary Mini`, 14, 290);
    }

    doc.save(`${project.projectName}_Izvjestaj.pdf`);
};
