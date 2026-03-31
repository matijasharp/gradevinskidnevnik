import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Bell } from 'lucide-react';
import { useAuth } from '../../../app/providers';
import { useOrg } from '../../../app/providers';
import { updateDiaryEntryReminder } from '../../../lib/data';
import { Button } from '../../../shared/ui';
import type { DiaryEntry } from '../../../shared/types';

export default function ReminderOverlay() {
  const navigate = useNavigate();
  const { appUser, company } = useAuth();
  const { entries, projects } = useOrg();
  const [activeReminder, setActiveReminder] = useState<DiaryEntry | null>(null);

  useEffect(() => {
    if (!entries.length || !appUser) return;

    const checkReminders = () => {
      const now = new Date();
      const dueReminder = entries.find(e =>
        e.reminderAt &&
        !e.reminderNotified &&
        new Date(e.reminderAt) <= now
      );

      if (dueReminder) {
        setActiveReminder(dueReminder);
        updateDiaryEntryReminder(dueReminder.id, true)
          .catch(err => console.error('Failed to update reminder status:', err));
      }
    };

    const interval = setInterval(checkReminders, 30000);
    checkReminders();

    return () => clearInterval(interval);
  }, [entries, appUser]);

  if (!activeReminder) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 border-t-8"
        style={{ borderTopColor: company?.brandColor || '#3b82f6' }}
      >
        <div className="flex items-center gap-4 text-accent">
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Podsjetnik!</h2>
            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Dnevnički zapis</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-lg">{activeReminder.title}</h3>
          <p className="text-sm text-zinc-500 line-clamp-3 italic">"{activeReminder.description}"</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setActiveReminder(null)}
          >
            Zatvori
          </Button>
          <Button
            className="flex-1 text-white"
            style={{ backgroundColor: company?.brandColor || '#3b82f6' }}
            onClick={() => {
              const project = projects.find(p => p.id === activeReminder.projectId);
              if (project) {
                navigate(`/projects/${project.id}`);
              }
              setActiveReminder(null);
            }}
          >
            Vidi detalje
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
