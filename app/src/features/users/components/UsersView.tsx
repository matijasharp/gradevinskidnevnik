import React, { useState, useRef } from 'react';
import { UserPlus, User as UserIcon, Trash2, Mail, X, Camera, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button, Card, Input } from '../../../shared/ui';
import type { AppUser } from '../../../shared/types';
import type { Invitation } from '../../../lib/data';

export default function UsersView({
  appUser,
  users,
  pendingInvitations = [],
  onInviteUser,
  onUpdateRole,
  onDeleteUser,
  onCancelInvitation,
  onSaveProfile,
  onChangePassword,
}: any) {
  const [displayName, setDisplayName] = useState(appUser?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(appUser?.avatarUrl ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (newPassword && newPassword !== confirmPassword) {
      setSaveError('Lozinke se ne podudaraju.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setSaveError('Lozinka mora imati najmanje 6 znakova.');
      return;
    }
    setSaving(true);
    try {
      await onSaveProfile({ name: displayName, avatarUrl });
      if (newPassword) {
        await onChangePassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Greška pri spremanju. Pokušajte ponovo.');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = appUser?.role === 'admin';

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Korisnici</h1>
        {isAdmin && (
          <Button onClick={onInviteUser}>
            <UserPlus size={20} /> Pozovi korisnika
          </Button>
        )}
      </header>

      {/* My Profile */}
      <Card className="p-6 space-y-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Moj profil</h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={28} className="text-zinc-400" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-zinc-800 text-white rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
            >
              <Camera size={12} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{appUser?.name}</p>
            <p className="text-xs text-zinc-500">{appUser?.email}</p>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${isAdmin ? 'bg-purple-100 text-purple-600' : 'bg-accent/10 text-accent'}`}>
              {isAdmin ? 'Administrator' : 'Radnik'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Ime i prezime"
            value={displayName}
            onChange={(e: any) => setDisplayName(e.target.value)}
          />
          <Input
            label="E-mail"
            value={appUser?.email ?? ''}
            disabled
            className="opacity-50"
          />
          <div className="relative">
            <Input
              label="Nova lozinka"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e: any) => setNewPassword(e.target.value)}
              placeholder="Ostavite prazno za zadržavanje"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-8 text-zinc-400 hover:text-zinc-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {newPassword && (
            <Input
              label="Potvrdi novu lozinku"
              type="password"
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
            />
          )}
        </div>

        {saveError && <p className="text-sm text-red-500">{saveError}</p>}

        <Button onClick={handleSave} disabled={saving || !displayName.trim()} className="w-full">
          {saving ? (
            <><Loader2 size={16} className="animate-spin" /> Spremam...</>
          ) : saveSuccess ? (
            <><CheckCircle2 size={16} /> Spremljeno</>
          ) : (
            'Spremi promjene'
          )}
        </Button>
      </Card>

      {/* Admin: User list */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {users.map((u: AppUser) => (
              <Card key={u.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">{u.name}</h3>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-accent/10 text-accent'}`}>
                      {u.role === 'admin' ? 'Administrator' : 'Radnik'}
                    </span>
                  </div>
                </div>

                {appUser?.id !== u.id && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdateRole(u.id, u.role === 'admin' ? 'worker' : 'admin')}
                      className="text-xs"
                    >
                      Promijeni ulogu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteUser(u.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {pendingInvitations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Čekaju prihvaćanje ({pendingInvitations.length})</h2>
              <div className="grid grid-cols-1 gap-3">
                {pendingInvitations.map((inv: Invitation) => (
                  <Card key={inv.id} className="p-5 flex items-center justify-between border-dashed opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-400">
                        <Mail size={18} />
                      </div>
                      <div>
                        {inv.name && <h3 className="font-semibold text-sm">{inv.name}</h3>}
                        <p className="text-xs text-zinc-500">{inv.email}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${inv.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-zinc-100 text-zinc-500'}`}>
                          {inv.role === 'admin' ? 'Administrator' : 'Radnik'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelInvitation(inv.id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <X size={16} />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
