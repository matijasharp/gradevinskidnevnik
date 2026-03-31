import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import { fetchPendingProfiles, approveProfile, rejectProfile } from '../../../lib/data';
import { ROUTES } from '../../../app/router/routeConfig';
import type { AppUser } from '../../../shared/types';

export default function SuperAdminPage() {
  const { appUser } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.isSuperAdmin) {
      navigate(ROUTES.DASHBOARD, { replace: true });
      return;
    }
    fetchPendingProfiles()
      .then(setPending)
      .finally(() => setLoading(false));
  }, [appUser]);

  const handleApprove = async (userId: string) => {
    await approveProfile(userId);
    setPending(prev => prev.filter(u => u.id !== userId));
  };

  const handleReject = async (userId: string) => {
    await rejectProfile(userId);
    setPending(prev => prev.filter(u => u.id !== userId));
  };

  if (loading) return null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Odobrenje pristupa</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Korisnici koji čekaju odobrenje pristupa platformi</p>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 text-zinc-400 text-sm">Nema korisnika koji čekaju odobrenje.</div>
      ) : (
        <div className="space-y-3">
          {pending.map(user => (
            <div key={user.id} className="bg-white border border-zinc-100 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-900">{user.name}</p>
                <p className="text-sm text-zinc-500">{user.email}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  onClick={() => handleApprove(user.id)}
                >
                  Odobri
                </button>
                <button
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  onClick={() => handleReject(user.id)}
                >
                  Odbij
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
