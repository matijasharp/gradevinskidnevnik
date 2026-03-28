export type Discipline = 'electro' | 'water' | 'klima';

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  electro: 'Elektro',
  water: 'Vodoinstalacije',
  klima: 'Klima / Ventilacija',
};

// Phase options — value and label are the same (display strings)
export const DISCIPLINE_PHASES: Record<Discipline, string[]> = {
  electro: ['Priprema', 'Razvod', 'Kabliranje', 'Montaža', 'Sanacija', 'Testiranje', 'Završeno'],
  water:   ['Priprema', 'Iskop', 'Razvod cijevi', 'Ugradnja armatura', 'Testiranje', 'Sanacija', 'Završeno'],
  klima:   ['Priprema', 'Montaža kanala', 'Ugradnja jedinica', 'Spajanje', 'Testiranje', 'Sanacija', 'Završeno'],
};

// Work type options — separate value/label
export const DISCIPLINE_WORK_TYPES: Record<Discipline, { value: string; label: string }[]> = {
  electro: [
    { value: 'razvod',      label: 'Razvod' },
    { value: 'kabliranje',  label: 'Kabliranje' },
    { value: 'montaža',     label: 'Montaža' },
    { value: 'ormar',       label: 'Razvodni ormar' },
    { value: 'testiranje',  label: 'Testiranje' },
  ],
  water: [
    { value: 'razvod-cijevi',       label: 'Razvod cijevi' },
    { value: 'ugradnja-armatura',   label: 'Ugradnja armatura' },
    { value: 'lemljenje',           label: 'Lemljenje' },
    { value: 'testiranje-pritiska', label: 'Testiranje pritiska' },
    { value: 'sanacija',            label: 'Sanacija' },
  ],
  klima: [
    { value: 'montaža-kanala',     label: 'Montaža kanala' },
    { value: 'ugradnja-jedinica',  label: 'Ugradnja jedinica' },
    { value: 'spajanje',           label: 'Spajanje' },
    { value: 'testiranje-sustava', label: 'Testiranje sustava' },
    { value: 'sanacija',           label: 'Sanacija' },
  ],
};

export const getPhases = (discipline?: string | null): string[] =>
  DISCIPLINE_PHASES[(discipline as Discipline) ?? 'electro'] ?? DISCIPLINE_PHASES.electro;

export const getWorkTypes = (discipline?: string | null): { value: string; label: string }[] =>
  DISCIPLINE_WORK_TYPES[(discipline as Discipline) ?? 'electro'] ?? DISCIPLINE_WORK_TYPES.electro;

export const SUBDOMAIN_DISCIPLINE_MAP: Record<string, Discipline> = {
  elektro: 'electro',
  voda: 'water',
  klima: 'klima',
};

export const DISCIPLINE_SUBTITLES: Record<Discipline, string> = {
  electro: 'Profesionalni dnevni izvještaji za električare u manje od 2 minute.',
  water:   'Profesionalni dnevni izvještaji za vodoinstalatera u manje od 2 minute.',
  klima:   'Profesionalni dnevni izvještaji za klimatičare u manje od 2 minute.',
};

export const detectDisciplineFromSubdomain = (): Discipline => {
  const subdomain = window.location.hostname.split('.')[0].toLowerCase();
  if (subdomain in SUBDOMAIN_DISCIPLINE_MAP) {
    return SUBDOMAIN_DISCIPLINE_MAP[subdomain];
  }
  const param = new URLSearchParams(window.location.search).get('discipline');
  if (param && param in DISCIPLINE_PHASES) {
    return param as Discipline;
  }
  return 'electro';
};
