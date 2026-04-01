import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Clock, User as UserIcon, CloudSun, Bell, Zap, Edit2, Loader2, Calendar } from 'lucide-react';
import Markdown from 'react-markdown';
import { Button, StatusBadge } from '../../../shared/ui';
import { safeFormatDate } from '../../../shared/utils/format';
import type { DiaryEntry, Project, Company } from '../../../shared/types';
import PhotoGallery from './PhotoGallery';

export default function DiaryEntryDetailModal({ entry, project, onClose, onEdit, onAddToCalendar, hasCalendar, company }: { entry: DiaryEntry, project: Project, onClose: () => void, onEdit: (e: DiaryEntry) => void, onAddToCalendar: (e: DiaryEntry) => Promise<void>, hasCalendar: boolean, company: Company | null }) {
  const [loading, setLoading] = useState(false);
  const brandColor = company?.brandColor || 'var(--color-accent)';

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAddToCalendar(entry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative"
      >
        <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <X size={24} className="text-zinc-400" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">
              {safeFormatDate(entry.entryDate, 'EEEE, dd.MM.yyyy')}
            </span>
            <StatusBadge status={entry.status} />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{entry.title}</h2>
            <p className="text-sm text-zinc-500">{project.projectName} • {project.clientName}</p>
            {entry.phase && (
              <p className="text-xs font-bold text-accent uppercase tracking-wider">{entry.phase}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase border-y border-zinc-100 py-3">
            <span className="flex items-center gap-1"><Clock size={12} /> {entry.hours}h rada</span>
            <span className="flex items-center gap-1"><UserIcon size={12} /> {entry.workersCount} radnika</span>
            {(entry.weatherCondition || entry.temperature) && (
              <span className="flex items-center gap-1"><CloudSun size={12} /> {entry.weatherCondition || '-'} ({entry.temperature || 0}°C)</span>
            )}
            {entry.reminderAt && (
              <span className="flex items-center gap-1 text-accent font-bold"><Bell size={12} /> Podsjetnik: {safeFormatDate(entry.reminderAt, 'dd.MM. HH:mm')}</span>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase">Opis radova</p>
            <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{entry.description}</p>
          </div>

          {entry.lineItems && entry.lineItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">Utrošeni materijal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entry.lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-sm font-medium text-zinc-700">{item.name}</span>
                    <span className="text-xs font-bold text-accent">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase">Fotografije</p>
            <PhotoGallery entryId={entry.id} />
          </div>

          {entry.aiSummary && (
            <div className="p-5 rounded-2xl border" style={{ backgroundColor: brandColor + '08', borderColor: brandColor + '20' }}>
              <p className="text-[10px] font-bold uppercase mb-3 flex items-center gap-1.5" style={{ color: brandColor }}>
                <Zap size={12} /> AI Analiza i Sažetak
              </p>
              <div className="prose prose-sm max-w-none prose-zinc break-words">
                <Markdown>{entry.aiSummary}</Markdown>
              </div>
            </div>
          )}

          {entry.signatureUrl && (
            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Potpis</p>
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 flex items-center justify-center">
                <img src={entry.signatureUrl} alt="Potpis" className="max-h-32 object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Zatvori
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-zinc-200"
            onClick={() => onEdit(entry)}
            disabled={loading}
          >
            <Edit2 size={18} className="mr-2" />
            Uredi
          </Button>
          {hasCalendar && (
            <Button
              className="flex-1 text-white border-none shadow-lg"
              onClick={handleAdd}
              disabled={loading}
              style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` }}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <Calendar size={18} className="mr-2" />
              )}
              {loading ? 'Dodavanje...' : 'Dodaj u Kalendar'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
