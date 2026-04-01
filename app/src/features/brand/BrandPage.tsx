import { Button, Card, StatusBadge } from '../../shared/ui';

const COLOR_TOKENS = [
  { token: '--color-accent', hex: '#3ab9e3', role: 'Active states, links, primary buttons, focus rings' },
  { token: '--color-accent-hover', hex: '#25a8d4', role: 'Button/link hover' },
  { token: '--color-accent-subtle', hex: '#3ab9e315', role: 'Accent bg tint — active nav, pill bg' },
  { token: '--color-text-primary', hex: '#192a46', role: 'Headings, strong text' },
  { token: '--color-text-secondary', hex: '#4a5a72', role: 'Labels, secondary text' },
  { token: '--color-text-muted', hex: '#8fa0b8', role: 'Placeholders, disabled' },
  { token: '--color-surface', hex: '#f1f4f2', role: 'Page/app background' },
  { token: '--color-surface-raised', hex: '#ffffff', role: 'Cards, sidebar, modals' },
  { token: '--color-border', hex: '#e0e6ed', role: 'Default borders' },
  { token: '--color-border-subtle', hex: '#f0f3f5', role: 'Subtle dividers' },
  { token: '--color-warning', hex: '#fad03d', role: 'Warnings, badges' },
  { token: '--color-warning-subtle', hex: '#fad03d20', role: 'Warning bg tint' },
  { token: '--color-secondary', hex: '#816840', role: 'Secondary accents (rare)' },
  { token: '--color-error', hex: '#e05252', role: 'Errors, destructive actions' },
  { token: '--color-success', hex: '#3dba7a', role: 'Success states' },
];

const ICONS = [
  { file: 'nadzorna-ploca.svg', label: 'Nadzorna ploča' },
  { file: 'projekt.svg', label: 'Projekt' },
  { file: 'kalendar.svg', label: 'Kalendar' },
  { file: 'izvjestaji.svg', label: 'Izvještaji' },
  { file: 'tim.svg', label: 'Tim' },
  { file: 'tvrtka.svg', label: 'Tvrtka' },
];

const BADGE_STATUSES = [
  'završeno',
  'djelomično završeno',
  'čeka materijal',
  'blokirano',
  'potrebno dodatno',
] as const;

export default function BrandPage() {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-3xl font-bold text-text-primary">Design System</h1>
        <p className="text-text-secondary mt-1">Građevinski Dnevnik — živući vodič dizajna</p>
      </header>

      {/* Color System */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Color System</h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLOR_TOKENS.map(({ token, hex, role }) => (
              <div key={token} className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded border border-border shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-mono font-semibold text-text-primary truncate">{token}</p>
                  <p className="text-xs font-mono text-text-secondary">{hex}</p>
                  <p className="text-xs text-text-muted">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Typography */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Typography</h2>
        <Card className="p-6 space-y-4">
          <div>
            <p className="text-xs text-text-muted mb-1">h1 — text-4xl font-bold</p>
            <h1 className="text-4xl font-bold text-text-primary">Heading 1</h1>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">h2 — text-3xl font-bold</p>
            <h2 className="text-3xl font-bold text-text-primary">Heading 2</h2>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">h3 — text-2xl font-semibold</p>
            <h3 className="text-2xl font-semibold text-text-primary">Heading 3</h3>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">h4 — text-xl font-semibold</p>
            <h4 className="text-xl font-semibold text-text-primary">Heading 4</h4>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">body — text-base text-text-primary</p>
            <p className="text-base text-text-primary">Tijelo teksta — Jost font, redoviti odlomci i opisi.</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">label — text-sm text-text-secondary</p>
            <p className="text-sm text-text-secondary">Oznaka — polja obrasca, sekundarne informacije</p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">mono — text-sm font-mono text-text-secondary</p>
            <p className="text-sm font-mono text-text-secondary">const brandColor = '#3ab9e3'</p>
          </div>
        </Card>
      </section>

      {/* Buttons */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Buttons</h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Card>
      </section>

      {/* Status Badges */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Status Badges</h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-3 items-center">
            {BADGE_STATUSES.map(status => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </Card>
      </section>

      {/* Icon Set */}
      <section>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Icon Set</h2>
        <Card className="p-6">
          <div className="flex flex-wrap gap-6">
            {ICONS.map(({ file, label }) => (
              <div key={file} className="flex flex-col items-center gap-2">
                <img src={`/icons/${file}`} alt={label} className="w-10 h-10" />
                <span className="text-xs text-text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
