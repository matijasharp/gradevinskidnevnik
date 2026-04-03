import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import {
  fetchPendingProfiles,
  approveProfile,
  rejectProfile,
  fetchAllProfiles,
  suspendProfile,
  unsuspendProfile,
  fetchWaitlist,
} from '../../../lib/data';
import { ROUTES } from '../../../app/router/routeConfig';
import type { AppUser } from '../../../shared/types';
import type { WaitlistEntry } from '../../../integrations/supabase/queries/members';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Na čekanju',
  approved: 'Odobren',
  rejected: 'Odbijen',
  suspended: 'Suspendiran',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  suspended: 'bg-zinc-100 text-zinc-600',
};

export default function SuperAdminPage() {
  const { appUser } = useAuth();
  const navigate = useNavigate();

  // Odobrenje tab state (Phase 16 — unchanged)
  const [pending, setPending] = useState<AppUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  // Korisnici tab state
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [activeTab, setActiveTab] = useState<'odobrenje' | 'korisnici' | 'waitlist'>('odobrenje');

  // Waitlist tab state
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  useEffect(() => {
    if (!appUser?.isSuperAdmin) {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return;
    }
    fetchPendingProfiles()
      .then(setPending)
      .finally(() => setPendingLoading(false));
  }, [appUser]);

  useEffect(() => {
    if (activeTab !== 'korisnici') return;
    setUsersLoading(true);
    fetchAllProfiles(filter === 'all' ? undefined : filter)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [activeTab, filter]);

  useEffect(() => {
    if (activeTab !== 'waitlist') return;
    setWaitlistLoading(true);
    fetchWaitlist()
      .then(setWaitlist)
      .catch(() => setWaitlist([]))
      .finally(() => setWaitlistLoading(false));
  }, [activeTab]);

  const handleApprove = async (userId: string) => {
    await approveProfile(userId);
    setPending(prev => prev.filter(u => u.id !== userId));
  };

  const handleReject = async (userId: string) => {
    await rejectProfile(userId);
    setPending(prev => prev.filter(u => u.id !== userId));
  };

  const handleSuspend = async (user: AppUser) => {
    if (user.status === 'suspended') {
      await unsuspendProfile(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'approved' } : u));
    } else {
      await suspendProfile(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'suspended' } : u));
    }
  };

  if (pendingLoading) return null;

  const tabBtn = (tab: 'odobrenje' | 'korisnici' | 'waitlist', label: string, count?: number) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
        activeTab === tab
          ? 'bg-white shadow-sm text-zinc-900'
          : 'text-zinc-500 hover:text-zinc-700'
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Super Admin</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Upravljanje platformom</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1 w-fit">
        {tabBtn('odobrenje', 'Odobrenje', pending.length)}
        {tabBtn('korisnici', 'Korisnici')}
        {tabBtn('waitlist', 'Waitlist')}
      </div>

      {/* Odobrenje tab — Phase 16 logic, unchanged */}
      {activeTab === 'odobrenje' && (
        <>
          {pending.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">
              Nema korisnika koji čekaju odobrenje.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(user => (
                <div
                  key={user.id}
                  className="bg-white border border-zinc-100 rounded p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{user.name}</p>
                    <p className="text-sm text-zinc-500">{user.email}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      className="rounded px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                      onClick={() => handleApprove(user.id)}
                    >
                      Odobri
                    </button>
                    <button
                      className="rounded px-4 py-2 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                      onClick={() => handleReject(user.id)}
                    >
                      Odbij
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Korisnici tab */}
      {activeTab === 'korisnici' && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'suspended', 'rejected'] as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {f === 'all' ? 'Svi' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>

          {usersLoading ? (
            <div className="text-center py-16 text-zinc-400 text-sm">Učitavanje...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">Nema korisnika.</div>
          ) : (
            <div className="space-y-2">
              {users.map(user => (
                <div
                  key={user.id}
                  className="bg-white border border-zinc-100 rounded p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 truncate">{user.name}</p>
                      {user.isSuperAdmin && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_COLORS[user.status] ?? 'bg-zinc-100 text-zinc-600'}`}>
                      {STATUS_LABELS[user.status] ?? user.status}
                    </span>
                    {!user.isSuperAdmin && (user.status === 'approved' || user.status === 'suspended') && (
                      <button
                        onClick={() => handleSuspend(user)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded transition-colors ${
                          user.status === 'suspended'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        {user.status === 'suspended' ? 'Vrati pristup' : 'Suspendiraj'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Waitlist tab */}
      {activeTab === 'waitlist' && (
        <div className="space-y-4">
          {waitlistLoading ? (
            <div className="text-center py-16 text-zinc-400 text-sm">Učitavanje...</div>
          ) : waitlist.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 text-sm">Nema waitlist prijava.</div>
          ) : (
            <>
              {(['voda_plin', 'klima_ventilacija', 'master'] as const).map(disc => {
                const entries = waitlist.filter(e => e.discipline === disc);
                if (entries.length === 0) return null;
                const labels: Record<string, string> = {
                  voda_plin: 'Voda i plin',
                  klima_ventilacija: 'Klima i ventilacija',
                  master: 'Master platforma',
                };
                return (
                  <div key={disc}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{labels[disc]}</p>
                      <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-semibold">{entries.length}</span>
                    </div>
                    <div className="space-y-2">
                      {entries.map(entry => (
                        <div key={entry.id} className="bg-white border border-zinc-100 rounded p-4 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 truncate">{entry.email}</p>
                            {(entry.name || entry.company) && (
                              <p className="text-sm text-zinc-500 truncate">
                                {[entry.name, entry.company].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 flex-shrink-0">
                            {new Date(entry.created_at).toLocaleDateString('hr-HR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
