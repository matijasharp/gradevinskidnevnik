import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useOrg } from '../../app/providers/OrganizationProvider';
import { ROUTES } from '../../app/router/routeConfig';
import Button from '../../shared/ui/Button';

const FREE_FEATURES = [
  'Do 3 aktivna projekta',
  'Neograničeni dnevni unosi',
  'Foto dokumentacija',
  'PDF izvoz',
  'Pozivanje članova tima',
];

const PRO_FEATURES = [
  'Neograničeni projekti',
  'Sve besplatne funkcije',
  'Prioritetna podrška',
  'Napredni izvozi',
  'Rana dostupnost novih funkcija',
];

export default function BillingPage() {
  const navigate = useNavigate();
  const { appUser, company } = useAuth();
  const { subscriptionStatus, stripeCustomerId } = useOrg();
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!company?.id || !appUser?.email) return;
    setUpgradeLoading(true);
    setUpgradeError(null);
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: company.id, userEmail: appUser.email }),
      });
      if (!res.ok) throw new Error('server_error');
      const { url } = await res.json();
      if (url) window.open(url, '_blank');
    } catch {
      setUpgradeError('Greška pri pokretanju naplate. Pokušajte ponovo.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const isPro = subscriptionStatus === 'pro';
  const isCancelled = subscriptionStatus === 'cancelled' || subscriptionStatus === 'past_due';

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Pretplata</h1>
      <p className="text-text-secondary mb-8">Upravljajte svojim planom i nadogradnjama.</p>

      {isCancelled && (
        <div className="mb-6 p-4 rounded bg-warning-subtle border border-warning text-text-primary text-sm">
          ⚠️ Pretplata je istekla ili čeka uplatu. Nadogradite kako biste obnovili Pro pristup.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className={`rounded border p-6 bg-surface-raised ${!isPro ? 'border-accent ring-2 ring-accent/20' : 'border-border'}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-text-primary">Besplatni plan</h2>
            {!isPro && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-accent-subtle text-accent">Aktivni plan</span>
            )}
          </div>
          <p className="text-2xl font-bold text-text-primary mb-1">0 €<span className="text-sm font-normal text-text-secondary"> / mj.</span></p>
          <p className="text-text-secondary text-sm mb-6">Idealno za pokretanje.</p>
          <ul className="space-y-2 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-success">✓</span> {f}
              </li>
            ))}
          </ul>
          {!isPro && <p className="text-xs text-text-muted text-center">Trenutni plan</p>}
        </div>

        {/* Pro Plan */}
        <div className={`rounded border p-6 bg-surface-raised ${isPro ? 'border-accent ring-2 ring-accent/20' : 'border-border'}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-text-primary">Pro plan</h2>
            {isPro && (
              <span className="text-xs font-semibold px-2 py-1 rounded bg-accent-subtle text-accent">Aktivni Pro plan</span>
            )}
          </div>
          <p className="text-2xl font-bold text-text-primary mb-1">
            —<span className="text-sm font-normal text-text-secondary"> kontaktirajte nas</span>
          </p>
          <p className="text-text-secondary text-sm mb-6">Za rastuće tvrtke bez ograničenja.</p>
          <ul className="space-y-2 mb-6">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-success">✓</span> {f}
              </li>
            ))}
          </ul>

          {isPro ? (
            <div className="text-center">
              <p className="text-xs text-text-muted">
                Stripe ref: …{stripeCustomerId?.slice(-6) ?? '—'}
              </p>
            </div>
          ) : (
            <>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleUpgrade}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? 'Učitavanje…' : 'Nadogradi na Pro'}
              </Button>
              {upgradeError && (
                <p className="mt-3 text-xs text-error text-center">{upgradeError}</p>
              )}
            </>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-text-muted text-center">
        Pitanja o naplati?{' '}
        <a href="mailto:billing@elektro.gradevinskidnevnik.online" className="text-accent hover:underline">
          billing@elektro.gradevinskidnevnik.online
        </a>
      </p>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Natrag na nadzornu ploču
        </button>
      </div>
    </div>
  );
}
