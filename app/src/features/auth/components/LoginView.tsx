import React, { useState, useCallback } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button, Card, Input } from '../../../shared/ui';
import { DISCIPLINE_LABELS, DISCIPLINE_SUBTITLES, type Discipline } from '../../../lib/disciplineConfig';
import { SplashScreen } from './SplashScreen';

export default function LoginView({
  loading,
  contextDiscipline,
  emailLogin,
  setEmailLogin,
  showPassword,
  setShowPassword,
  handleLogin,
  handleEmailLogin,
  showOnboarding,
  newCompanyName,
  setNewCompanyName,
  onboardingDiscipline,
  setOnboardingDiscipline,
  handleOnboarding,
}: any) {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  if (loading || !splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!showOnboarding) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <img src="/brand/logo.svg" alt="Građevinski Dnevnik Online" className="h-14 w-14 mb-3 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Građevinski Dnevnik Online</h1>
            <p className="text-zinc-500">{DISCIPLINE_SUBTITLES[contextDiscipline]}</p>
          </div>
          <Button onClick={handleLogin} className="w-full py-4 text-lg">
            Prijavi se putem Google-a
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-xs text-zinc-400 font-medium">ili</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3 text-left">
            <Input
              label="Email"
              type="email"
              placeholder="vas@email.com"
              value={emailLogin.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailLogin((prev: any) => ({ ...prev, email: e.target.value }))}
              required
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lozinka</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={emailLogin.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailLogin((prev: any) => ({ ...prev, password: e.target.value }))}
                  required
                  className="w-full px-4 py-3 pr-11 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/5 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p: boolean) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {emailLogin.error && (
              <p className="text-sm text-red-500">{emailLogin.error}</p>
            )}
            <Button type="submit" variant="outline" className="w-full py-3" disabled={emailLogin.loading}>
              {emailLogin.loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Prijavi se emailom'}
            </Button>
          </form>

          <p className="text-xs text-zinc-400">Prijavom se slažete s našim uvjetima pružanja usluge.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-6">
      <Card className="max-w-md w-full p-8 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">Dobrodošli!</h2>
          <p className="text-zinc-500">Postavimo profil vaše tvrtke.</p>
        </div>
        <Input
          label="Naziv tvrtke"
          placeholder="npr. Elektro-Instalacije d.o.o."
          value={newCompanyName}
          onChange={(e: any) => setNewCompanyName(e.target.value)}
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700">Struka</label>
          <select
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
            value={onboardingDiscipline}
            onChange={(e) => setOnboardingDiscipline(e.target.value as Discipline)}
          >
            {(Object.entries(DISCIPLINE_LABELS) as [Discipline, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleOnboarding} className="w-full py-3" disabled={!newCompanyName}>
          Kreiraj tvrtku
        </Button>
      </Card>
    </div>
  );
}
