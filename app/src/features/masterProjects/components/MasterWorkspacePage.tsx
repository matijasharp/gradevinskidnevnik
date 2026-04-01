import { useState } from 'react';
import { useAuth } from '../../../app/providers';
import { useOrg } from '../../../app/providers';
import {
  fetchMasterProjectOrganizations,
  createMasterProject,
  linkOrganizationToMasterProject,
  fetchMasterProjectStats,
  fetchMasterRecentActivity,
  searchOrganizations,
  fetchMasterProjectIssues,
  createMasterProjectIssue,
  updateMasterProjectIssueStatus,
} from '../../../lib/data';
import type {
  MasterProject, MasterProjectOrganization, MasterProjectStats,
  MasterActivityItem, MasterProjectIssue,
} from '../../../lib/data';
import type { Company } from '../../../shared/types';
import MasterProjectsListView from './MasterProjectsListView';
import MasterProjectDetailView from './MasterProjectDetailView';

export default function MasterWorkspacePage() {
  const { appUser, company } = useAuth();
  const { masterProjects, refreshMasterProjects } = useOrg();

  const [selectedMasterProject, setSelectedMasterProject] = useState<MasterProject | null>(null);
  const [masterProjectOrgs, setMasterProjectOrgs] = useState<MasterProjectOrganization[]>([]);
  const [masterProjectStats, setMasterProjectStats] = useState<MasterProjectStats[]>([]);
  const [masterRecentActivity, setMasterRecentActivity] = useState<MasterActivityItem[]>([]);
  const [masterProjectIssues, setMasterProjectIssues] = useState<MasterProjectIssue[]>([]);
  const [showNewMasterProjectModal, setShowNewMasterProjectModal] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [addOrgQuery, setAddOrgQuery] = useState('');
  const [addOrgResults, setAddOrgResults] = useState<Company[]>([]);
  const [addOrgSelected, setAddOrgSelected] = useState<Company | null>(null);
  const [addOrgDiscipline, setAddOrgDiscipline] = useState<'electro' | 'water' | 'klima'>('electro');
  const [addOrgRole, setAddOrgRole] = useState<'lead' | 'contributor' | 'viewer'>('contributor');
  const [addOrgLoading, setAddOrgLoading] = useState(false);
  const [newMasterProjectName, setNewMasterProjectName] = useState('');
  const [newMasterProjectDescription, setNewMasterProjectDescription] = useState('');
  const [newMasterProjectLocation, setNewMasterProjectLocation] = useState('');

  if (!appUser || !company) return null;

  const isCoordinator = company.discipline === 'general';

  const handleAddOrgSearch = async (q: string) => {
    setAddOrgQuery(q);
    setAddOrgSelected(null);
    if (q.trim().length < 2) { setAddOrgResults([]); return; }
    const results = await searchOrganizations(q);
    const linkedIds = new Set(masterProjectOrgs.map(o => o.organizationId));
    setAddOrgResults(results.filter(r => !linkedIds.has(r.id)));
  };

  const handleCreateIssue = async (params: { title: string; priority: 'low' | 'medium' | 'high'; discipline?: string }) => {
    if (!selectedMasterProject) return;
    await createMasterProjectIssue({ masterProjectId: selectedMasterProject.id, reportedBy: appUser.id, ...params });
    const updated = await fetchMasterProjectIssues(selectedMasterProject.id);
    setMasterProjectIssues(updated);
  };

  const handleUpdateIssueStatus = async (issueId: string, status: MasterProjectIssue['status']) => {
    await updateMasterProjectIssueStatus(issueId, status);
    setMasterProjectIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i));
  };

  if (selectedMasterProject) {
    return (
      <>
        <MasterProjectDetailView
          masterProject={selectedMasterProject}
          orgs={masterProjectOrgs}
          stats={masterProjectStats}
          activity={masterRecentActivity}
          issues={masterProjectIssues}
          ownerOrgId={selectedMasterProject.ownerOrganizationId}
          currentOrgId={appUser.companyId}
          onAddOrg={() => setShowAddOrgModal(true)}
          onCreateIssue={handleCreateIssue}
          onUpdateIssueStatus={handleUpdateIssueStatus}
          brandColor={company.brandColor}
          onBack={() => { setSelectedMasterProject(null); setMasterProjectOrgs([]); setMasterProjectStats([]); setMasterRecentActivity([]); setMasterProjectIssues([]); setShowAddOrgModal(false); setAddOrgQuery(''); setAddOrgResults([]); setAddOrgSelected(null); }}
        />
        {showAddOrgModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">Dodaj organizaciju</h2>
              {!addOrgSelected ? (
                <div className="space-y-3">
                  <input
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Pretraži po nazivu organizacije..."
                    value={addOrgQuery}
                    onChange={e => handleAddOrgSearch(e.target.value)}
                    autoFocus
                  />
                  {addOrgResults.length > 0 && (
                    <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
                      {addOrgResults.map(org => (
                        <button
                          key={org.id}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors"
                          onClick={() => setAddOrgSelected(org)}
                        >
                          <span className="font-medium text-zinc-800">{org.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {addOrgQuery.trim().length >= 2 && addOrgResults.length === 0 && (
                    <p className="text-sm text-zinc-400 text-center py-3">Nema rezultata.</p>
                  )}
                  <div className="pt-1">
                    <button
                      className="w-full rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      onClick={() => { setShowAddOrgModal(false); setAddOrgQuery(''); setAddOrgResults([]); setAddOrgSelected(null); }}
                    >
                      Odustani
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-zinc-50 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-800">{addOrgSelected.name}</span>
                    <button className="text-xs text-zinc-400 hover:text-zinc-600" onClick={() => setAddOrgSelected(null)}>Promijeni</button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Disciplina</label>
                    <select
                      className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addOrgDiscipline}
                      onChange={e => setAddOrgDiscipline(e.target.value as 'electro' | 'water' | 'klima')}
                    >
                      <option value="electro">⚡ Elektro</option>
                      <option value="water">💧 Voda</option>
                      <option value="klima">❄️ Klima</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Uloga</label>
                    <select
                      className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={addOrgRole}
                      onChange={e => setAddOrgRole(e.target.value as 'lead' | 'contributor' | 'viewer')}
                    >
                      <option value="lead">Voditelj</option>
                      <option value="contributor">Suradnik</option>
                      <option value="viewer">Promatrač</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      onClick={() => { setShowAddOrgModal(false); setAddOrgQuery(''); setAddOrgResults([]); setAddOrgSelected(null); }}
                    >
                      Odustani
                    </button>
                    <button
                      className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: company.brandColor || 'var(--color-accent)' }}
                      disabled={addOrgLoading}
                      onClick={async () => {
                        if (!addOrgSelected || !selectedMasterProject) return;
                        setAddOrgLoading(true);
                        try {
                          await linkOrganizationToMasterProject({
                            masterProjectId: selectedMasterProject.id,
                            organizationId: addOrgSelected.id,
                            discipline: addOrgDiscipline,
                            role: addOrgRole,
                          });
                          const updated = await fetchMasterProjectOrganizations(selectedMasterProject.id);
                          setMasterProjectOrgs(updated);
                          const ids = updated.map(o => o.linkedProjectId).filter(Boolean) as string[];
                          if (ids.length > 0) {
                            fetchMasterProjectStats(ids).then(setMasterProjectStats).catch(() => null);
                            fetchMasterRecentActivity(ids).then(setMasterRecentActivity).catch(() => null);
                          }
                          setShowAddOrgModal(false);
                          setAddOrgQuery('');
                          setAddOrgResults([]);
                          setAddOrgSelected(null);
                        } finally {
                          setAddOrgLoading(false);
                        }
                      }}
                    >
                      {addOrgLoading ? 'Dodavanje...' : 'Dodaj'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <MasterProjectsListView
        masterProjects={masterProjects}
        brandColor={company.brandColor}
        isCoordinator={isCoordinator}
        onSelect={(mp: MasterProject) => {
          setSelectedMasterProject(mp);
          fetchMasterProjectOrganizations(mp.id)
            .then(orgs => {
              setMasterProjectOrgs(orgs);
              const ids = orgs.map(o => o.linkedProjectId).filter(Boolean) as string[];
              if (ids.length > 0) {
                fetchMasterProjectStats(ids).then(setMasterProjectStats).catch(() => null);
                fetchMasterRecentActivity(ids).then(setMasterRecentActivity).catch(() => null);
              }
            })
            .catch(() => null);
          fetchMasterProjectIssues(mp.id).then(setMasterProjectIssues).catch(() => null);
        }}
        onCreateNew={isCoordinator ? () => setShowNewMasterProjectModal(true) : undefined}
      />
      {isCoordinator && showNewMasterProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Novi master projekt</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv *</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Npr. Stambeni kompleks A1"
                  value={newMasterProjectName}
                  onChange={e => setNewMasterProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Opis</label>
                <textarea
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Kratki opis projekta"
                  value={newMasterProjectDescription}
                  onChange={e => setNewMasterProjectDescription(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Lokacija</label>
                <input
                  className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Npr. Zagreb, Ulica bb"
                  value={newMasterProjectLocation}
                  onChange={e => setNewMasterProjectLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 border border-zinc-200 rounded-xl py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                onClick={() => {
                  setShowNewMasterProjectModal(false);
                  setNewMasterProjectName('');
                  setNewMasterProjectDescription('');
                  setNewMasterProjectLocation('');
                }}
              >
                Odustani
              </button>
              <button
                className="flex-[2] rounded-xl py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: company.brandColor || 'var(--color-accent)' }}
                disabled={!newMasterProjectName.trim()}
                onClick={async () => {
                  if (!newMasterProjectName.trim()) return;
                  try {
                    await createMasterProject({
                      name: newMasterProjectName.trim(),
                      description: newMasterProjectDescription.trim() || undefined,
                      location: newMasterProjectLocation.trim() || undefined,
                      ownerOrganizationId: company.id,
                      createdBy: appUser.id,
                    });
                    await refreshMasterProjects();
                    setShowNewMasterProjectModal(false);
                    setNewMasterProjectName('');
                    setNewMasterProjectDescription('');
                    setNewMasterProjectLocation('');
                  } catch (e) {
                    console.error('Failed to create master project:', e);
                  }
                }}
              >
                Kreiraj
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
