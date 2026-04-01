import type { Project, DiaryEntry, Company, DiaryPhoto } from '../../shared/types';
import { supabase } from '../../lib/supabase';

export const generateDiaryPdf = async (
  project: Project,
  entries: DiaryEntry[],
  company: Company | null,
  photos: DiaryPhoto[] = []
): Promise<void> => {
  const { data, error } = await supabase.functions.invoke('generate-pdf', {
    body: { project, entries, company, photos }
  });

  if (error) {
    console.error('PDF generation failed:', error);
    alert('Greška pri generiranju PDF-a. Pokušajte ponovno.');
    return;
  }

  // data is a Blob for binary (application/pdf) responses
  const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.projectName}_Izvjestaj.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
