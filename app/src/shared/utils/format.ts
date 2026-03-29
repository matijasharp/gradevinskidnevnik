import { format } from 'date-fns';

export function safeFormatDate(dateStr: string | undefined | null, formatStr: string, fallback: string = 'Nema datuma') {
  if (!dateStr) return fallback;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatStr);
  } catch (e) {
    return fallback;
  }
}

export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1')     // italic
    .replace(/__(.*?)__/g, '$1')     // bold
    .replace(/_(.*?)_/g, '$1')       // italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/#{1,6}\s+(.*)/g, '$1') // headers
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // code
    .replace(/^\s*[-*+]\s+/gm, '• ') // bullets
    .replace(/^\s*\d+\.\s+/gm, '')   // numbers
    .trim();
}
