import React from 'react';
import { UserPlus, User as UserIcon, Trash2, Mail, X } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';
import type { AppUser } from '../../../shared/types';
import type { Invitation } from '../../../lib/data';

export default function UsersView({ users, pendingInvitations = [], onInviteUser, onUpdateRole, onDeleteUser, onCancelInvitation, currentUser }: any) {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Korisnici</h1>
        <Button onClick={onInviteUser}>
          <UserPlus size={20} /> Pozovi korisnika
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {users.map((u: AppUser) => (
          <Card key={u.id} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                <UserIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold">{u.name}</h3>
                <p className="text-xs text-zinc-500">{u.email}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-accent/10 text-accent'}`}>
                  {u.role === 'admin' ? 'Administrator' : 'Radnik'}
                </span>
              </div>
            </div>

            {currentUser.role === 'admin' && currentUser.id !== u.id && (
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
    </div>
  );
}
