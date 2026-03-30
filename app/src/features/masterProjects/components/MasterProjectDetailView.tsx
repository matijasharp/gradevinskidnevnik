import React from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { DISCIPLINE_LABELS } from '../../../lib/disciplineConfig';
import type { MasterProject, MasterProjectOrganization, MasterProjectStats, MasterActivityItem, MasterProjectIssue } from '../../../lib/data';

export default function MasterProjectDetailView({ masterProject, orgs, stats, activity, issues, ownerOrgId, currentOrgId, onAddOrg, onCreateIssue, onUpdateIssueStatus, brandColor, onBack }: {
  masterProject: MasterProject;
  orgs: MasterProjectOrganization[];
  stats: MasterProjectStats[];
  activity: MasterActivityItem[];
  issues: MasterProjectIssue[];
  ownerOrgId: string;
  currentOrgId: string;
  onAddOrg: () => void;
  onCreateIssue: (params: { title: string; priority: 'low' | 'medium' | 'high'; discipline?: string }) => Promise<void>;
  onUpdateIssueStatus: (issueId: string, status: MasterProjectIssue['status']) => Promise<void>;
  brandColor?: string;
  onBack: () => void;
}) {
  const color = brandColor || '#3b82f6';
  const statusLabel: Record<string, string> = { active: 'Aktivan', completed: 'Završen', archived: 'Arhiviran' };
  const statusColor: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', completed: 'bg-zinc-100 text-zinc-500', archived: 'bg-amber-100 text-amber-700' };
  const roleLabel: Record<string, string> = { lead: 'Voditelj', contributor: 'Suradnik', viewer: 'Promatrač' };
  const roleColor: Record<string, string> = { lead: 'bg-blue-100 text-blue-700', contributor: 'bg-violet-100 text-violet-700', viewer: 'bg-zinc-100 text-zinc-500' };
  const disciplineIcon: Record<string, string> = { electro: '⚡', water: '💧', klima: '❄️' };

  const [showIssueForm, setShowIssueForm] = React.useState(false);
  const [newIssueTitle, setNewIssueTitle] = React.useState('');
  const [newIssuePriority, setNewIssuePriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [newIssueDiscipline, setNewIssueDiscipline] = React.useState('');
  const [issueSubmitting, setIssueSubmitting] = React.useState(false);

  const issueStatusColor: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-zinc-100 text-zinc-500',
  };
  const issueStatusLabel: Record<string, string> = {
    open: 'Otvoreno',
    in_progress: 'U tijeku',
    resolved: 'Riješeno',
    closed: 'Zatvoreno',
  };
  const issuePriorityColor: Record<string, string> = {
    low: 'bg-zinc-100 text-zinc-500',
    medium: 'bg-amber-100 text-amber-600',
    high: 'bg-red-100 text-red-600',
  };
  const issuePriorityLabel: Record<string, string> = { low: 'Niska', medium: 'Srednja', high: 'Visoka' };
  const nextStatus: Record<string, MasterProjectIssue['status']> = {
    open: 'in_progress',
    in_progress: 'resolved',
    resolved: 'closed',
    closed: 'open',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4" onClick={onBack}>
          <ChevronRight size={16} className="rotate-180" />
          Master projekti
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[masterProject.status] ?? statusColor.active}`}>
                {statusLabel[masterProject.status] ?? masterProject.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">{masterProject.name}</h1>
            {masterProject.location && (
              <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1"><MapPin size={14} />{masterProject.location}</p>
            )}
            {masterProject.description && (
              <p className="text-sm text-zinc-500 mt-2">{masterProject.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Discipline cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Sudionici po disciplini</h2>
          <button
            className={`text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors ${
              currentOrgId === ownerOrgId
                ? 'text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                : 'text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
            }`}
            disabled={currentOrgId !== ownerOrgId}
            onClick={currentOrgId === ownerOrgId ? onAddOrg : undefined}
          >
            + Dodaj organizaciju
          </button>
        </div>

        {orgs.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400 bg-zinc-50 rounded-2xl">
            Nema povezanih organizacija.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orgs.map(org => (
              <div key={org.id} className="bg-white border border-zinc-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{disciplineIcon[org.discipline] ?? '🔧'}</span>
                    <span className="font-semibold text-zinc-800 text-sm">
                      {DISCIPLINE_LABELS[org.discipline as keyof typeof DISCIPLINE_LABELS] ?? org.discipline}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[org.role] ?? roleColor.contributor}`}>
                    {roleLabel[org.role] ?? org.role}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 font-medium truncate">{org.organizationName ?? '—'}</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  Projekt: {org.linkedProjectName ?? '—'}
                </p>
                {(() => {
                  const s = stats.find(s => s.projectId === org.linkedProjectId);
                  return (
                    <p className="text-xs text-zinc-400 mt-1">
                      {s ? s.entryCount : 0} zapisa · {s ? s.totalHours : 0}h
                    </p>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Nedavna aktivnost</h2>
        {activity.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-400 bg-zinc-50 rounded-2xl">
            Nema nedavnih aktivnosti.
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map(item => {
              const org = orgs.find(o => o.linkedProjectId === item.projectId);
              const icon = disciplineIcon[org?.discipline ?? ''] ?? '🔧';
              const entryStatusColor: Record<string, string> = {
                'završeno': 'bg-emerald-100 text-emerald-700',
                'djelomično završeno': 'bg-amber-100 text-amber-700',
                'blokirano': 'bg-red-100 text-red-700',
                'čeka materijal': 'bg-orange-100 text-orange-600',
                'potrebno dodatno': 'bg-blue-100 text-blue-700',
              };
              const [y, m, d] = item.entryDate.split('-');
              const dateFormatted = `${d}.${m}.${y}`;
              return (
                <div key={item.entryId} className="flex items-start gap-3 bg-white border border-zinc-100 rounded-xl px-4 py-3">
                  <span className="text-base mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-800 truncate">{item.title}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entryStatusColor[item.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{dateFormatted} · {item.createdByName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issues */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Prijave</h2>
          <button
            className="text-xs font-medium border border-zinc-300 text-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
            onClick={() => setShowIssueForm(f => !f)}
          >
            {showIssueForm ? 'Odustani' : '+ Dodaj prijavu'}
          </button>
        </div>

        {issues.length === 0 && !showIssueForm && (
          <div className="text-center py-8 text-sm text-zinc-400 bg-zinc-50 rounded-2xl">
            Nema prijava.
          </div>
        )}

        {issues.length > 0 && (
          <div className="space-y-2 mb-3">
            {issues.map(issue => (
              <div key={issue.id} className="flex items-center gap-2 bg-white border border-zinc-100 rounded-xl px-4 py-3">
                {issue.discipline && (
                  <span className="text-base">{disciplineIcon[issue.discipline] ?? '🔧'}</span>
                )}
                <span className="text-sm font-medium text-zinc-800 flex-1 min-w-0 truncate">{issue.title}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${issuePriorityColor[issue.priority] ?? issuePriorityColor.medium}`}>
                  {issuePriorityLabel[issue.priority] ?? issue.priority}
                </span>
                <button
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 cursor-pointer ${issueStatusColor[issue.status] ?? issueStatusColor.open}`}
                  onClick={() => onUpdateIssueStatus(issue.id, nextStatus[issue.status] ?? 'open')}
                  title="Klikni za promjenu statusa"
                >
                  {issueStatusLabel[issue.status] ?? issue.status}
                </button>
              </div>
            ))}
          </div>
        )}

        {showIssueForm && (
          <div className="bg-white border border-zinc-100 rounded-2xl p-4 space-y-3 mt-2">
            <input
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Naslov prijave..."
              value={newIssueTitle}
              onChange={e => setNewIssueTitle(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <select
                className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newIssuePriority}
                onChange={e => setNewIssuePriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Niska prioritet</option>
                <option value="medium">Srednja prioritet</option>
                <option value="high">Visoka prioritet</option>
              </select>
              <select
                className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newIssueDiscipline}
                onChange={e => setNewIssueDiscipline(e.target.value)}
              >
                <option value="">Sve discipline</option>
                <option value="electro">⚡ Elektro</option>
                <option value="water">💧 Vodoinstalacije</option>
                <option value="klima">❄️ Klima</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: color }}
                disabled={!newIssueTitle.trim() || issueSubmitting}
                onClick={async () => {
                  if (!newIssueTitle.trim()) return;
                  setIssueSubmitting(true);
                  try {
                    await onCreateIssue({
                      title: newIssueTitle.trim(),
                      priority: newIssuePriority,
                      discipline: newIssueDiscipline || undefined,
                    });
                    setNewIssueTitle('');
                    setNewIssuePriority('medium');
                    setNewIssueDiscipline('');
                    setShowIssueForm(false);
                  } finally {
                    setIssueSubmitting(false);
                  }
                }}
              >
                {issueSubmitting ? 'Sprema...' : 'Dodaj'}
              </button>
              <button
                className="rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                onClick={() => { setNewIssueTitle(''); setNewIssuePriority('medium'); setNewIssueDiscipline(''); setShowIssueForm(false); }}
              >
                Odustani
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
