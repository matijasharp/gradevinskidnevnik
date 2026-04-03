import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, X, User as UserIcon, Mail, UserPlus } from 'lucide-react';
import { fetchProjectMembers, fetchProjectInvitations, addProjectMember, createProjectInvitation, removeProjectMember, updateProjectMemberRole, cancelProjectInvitation } from '../../../lib/data';
import type { ProjectMember, ProjectInvitation } from '../../../lib/data';
import type { Project } from '../../../shared/types';
import { Button, Card } from '../../../shared/ui';

export default function ProjectMembersTab({ project, currentUser, orgMembers = [], company, canManage }: {
  project: Project;
  currentUser: any;
  orgMembers: any[];
  company: any;
  canManage?: boolean;
}) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState<'lead' | 'contributor' | 'viewer'>('viewer');
  const [selectedOrgMemberId, setSelectedOrgMemberId] = useState('');
  const [selectedOrgMemberRole, setSelectedOrgMemberRole] = useState<'lead' | 'contributor' | 'viewer'>('viewer');
  const [saving, setSaving] = useState(false);
  const brandColor = company?.brandColor || 'var(--color-accent)';
  // canManage explicitly passed for cross-org members; falls back to org admin check
  const isAdmin = canManage ?? currentUser?.role === 'admin';

  const roleLabel = (r: string) => r === 'lead' ? 'Voditelj' : r === 'contributor' ? 'Suradnik' : 'Gledatelj';

  const load = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        fetchProjectMembers(project.id),
        fetchProjectInvitations(project.id)
      ]);
      setMembers(m);
      setInvitations(i);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  const handleAddOrgMember = async () => {
    if (!selectedOrgMemberId || !currentUser) return;
    setSaving(true);
    try {
      await addProjectMember({ projectId: project.id, userId: selectedOrgMemberId, role: selectedOrgMemberRole, invitedBy: currentUser.id });
      setSelectedOrgMemberId('');
      await load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleInviteEmail = async () => {
    if (!addEmail || !currentUser) return;
    setSaving(true);
    try {
      await createProjectInvitation({ projectId: project.id, email: addEmail, name: addName || undefined, role: addRole, createdBy: currentUser.id });
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, name: addName, type: 'project_invite', organizationName: project.projectName, inviterName: currentUser.name })
      }).catch(() => null);
      setAddEmail('');
      setAddName('');
      await load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMember({ projectId: project.id, userId });
      await load();
    } catch { /* silent */ }
  };

  const handleRoleChange = async (userId: string, role: 'lead' | 'contributor' | 'viewer') => {
    try {
      await updateProjectMemberRole({ projectId: project.id, userId, role });
      await load();
    } catch { /* silent */ }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await cancelProjectInvitation(id);
      await load();
    } catch { /* silent */ }
  };

  const existingMemberIds = new Set(members.map(m => m.userId));
  const availableOrgMembers = orgMembers.filter((u: any) => !existingMemberIds.has(u.id));

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current members */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Članovi projekta</h3>
        {members.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">Nema članova.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <Card key={m.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                    <UserIcon size={14} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{m.name || m.email || m.userId}</p>
                    {m.email && m.name && <p className="text-xs text-zinc-400">{m.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.userId, e.target.value as any)}
                      className="text-xs font-bold bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="lead">Voditelj</option>
                      <option value="contributor">Suradnik</option>
                      <option value="viewer">Gledatelj</option>
                    </select>
                  ) : (
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full font-bold">{roleLabel(m.role)}</span>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleRemoveMember(m.userId)} className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Pozivi na čekanju</h3>
          <div className="space-y-2">
            {invitations.map(inv => (
              <Card key={inv.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                    <Mail size={14} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{inv.email}</p>
                    <p className="text-xs text-zinc-400">{roleLabel(inv.role)}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleCancelInvitation(inv.id)} className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                    <X size={14} />
                  </button>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Add member controls (admin only) */}
      {isAdmin && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dodaj člana</h3>

          {/* Add from org */}
          {availableOrgMembers.length > 0 && (
            <Card className="p-4 space-y-3">
              <p className="text-xs font-bold text-zinc-500">Dodaj iz tima</p>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedOrgMemberId}
                  onChange={e => setSelectedOrgMemberId(e.target.value)}
                  className="flex-1 min-w-0 text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">Odaberi člana tima...</option>
                  {availableOrgMembers.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
                <select
                  value={selectedOrgMemberRole}
                  onChange={e => setSelectedOrgMemberRole(e.target.value as any)}
                  className="text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="lead">Voditelj</option>
                  <option value="contributor">Suradnik</option>
                  <option value="viewer">Gledatelj</option>
                </select>
                <Button
                  size="sm"
                  disabled={!selectedOrgMemberId || saving}
                  onClick={handleAddOrgMember}
                  style={{ backgroundColor: brandColor }}
                  className="text-white border-none"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Dodaj
                </Button>
              </div>
            </Card>
          )}

          {/* Invite by email */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-500">Pozovi emailom</p>
            <input
              type="text"
              placeholder="Ime (opcionalno)"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <div className="flex gap-2 flex-wrap">
              <input
                type="email"
                placeholder="Email adresa"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                className="flex-1 min-w-0 text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
              />
              <select
                value={addRole}
                onChange={e => setAddRole(e.target.value as any)}
                className="text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="lead">Voditelj</option>
                <option value="contributor">Suradnik</option>
                <option value="viewer">Pregledatelj</option>
              </select>
            </div>
            <Button
              size="sm"
              disabled={!addEmail || saving}
              onClick={handleInviteEmail}
              style={{ backgroundColor: brandColor }}
              className="w-full text-white border-none"
            >
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <UserPlus size={14} className="mr-2" />}
              Pošalji poziv
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}
