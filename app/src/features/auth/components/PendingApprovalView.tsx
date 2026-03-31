import { signOut } from '../../../lib/supabaseAuth';
import { Clock, LogOut } from 'lucide-react';

export default function PendingApprovalView() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto">
          <Clock size={32} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Račun čeka odobrenje</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Vaš zahtjev je zaprimljen. Kontaktirat ćemo vas kada pristup bude odobren.
          </p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 mx-auto text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <LogOut size={16} /> Odjava
        </button>
      </div>
    </div>
  );
}
