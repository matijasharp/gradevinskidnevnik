import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Zap, Calendar } from 'lucide-react';
import { Button } from '../ui';

function SecretsModal({ onClose }: { onClose: () => void }) {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const result = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(result);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Postavke Tajni</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <Zap size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Gemini API Ključ</p>
                <p className="text-[10px] text-zinc-500">Potreban za AI značajke (sažetke, analizu).</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${hasKey ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                {hasKey ? 'KLJUČ ODABRAN' : 'KLJUČ NIJE ODABRAN'}
              </span>
              <Button variant="outline" size="sm" onClick={handleOpenSelectKey} className="text-xs py-1 h-auto">
                {hasKey ? 'Promijeni' : 'Odaberi Ključ'}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Google Calendar API</p>
                <p className="text-[10px] text-zinc-500">Konfigurirajte Client ID i Secret u postavkama projekta.</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 bg-white p-2 rounded-lg border border-zinc-100">
              Ove tajne se postavljaju u AI Studio sučelju pod "Secrets" sekcijom koristeći varijable:
              <br/>
              <code className="text-accent font-mono">GOOGLE_CLIENT_ID</code>
              <br/>
              <code className="text-accent font-mono">GOOGLE_CLIENT_SECRET</code>
            </p>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={onClose} className="w-full py-3">Zatvori</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default SecretsModal;
