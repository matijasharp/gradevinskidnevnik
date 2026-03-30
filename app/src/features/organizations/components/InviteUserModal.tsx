import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../../../shared/ui';

export default function InviteUserModal({ onClose, onSubmit, company }: any) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'worker'>('worker');
  const brandColor = company?.brandColor || '#3b82f6';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Pozovi korisnika</h2>
          <p className="text-sm text-zinc-500">Dodajte novog člana tima u svoju tvrtku.</p>
        </div>

        <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Ime i prezime</label>
                <input
                  type="text"
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="npr. Ivan Horvat"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Email adresa</label>
                <input
                  type="email"
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan.horvat@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Uloga</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRole('worker')}
                    className="flex-1 py-3 rounded-xl border transition-all text-sm font-bold"
                    style={role === 'worker' ? { backgroundColor: brandColor, color: 'white', borderColor: brandColor } : { backgroundColor: '#f9f9f9', color: '#71717a', borderColor: '#f4f4f5' }}
                  >
                    Radnik
                  </button>
                  <button
                    onClick={() => setRole('admin')}
                    className="flex-1 py-3 rounded-xl border transition-all text-sm font-bold"
                    style={role === 'admin' ? { backgroundColor: brandColor, color: 'white', borderColor: brandColor } : { backgroundColor: '#f9f9f9', color: '#71717a', borderColor: '#f4f4f5' }}
                  >
                    Admin
                  </button>
                </div>
              </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Odustani</Button>
          <Button className="flex-1" onClick={() => onSubmit(email, name, role)} disabled={!email || !name}>Pozovi</Button>
        </div>
      </motion.div>
    </div>
  );
}
