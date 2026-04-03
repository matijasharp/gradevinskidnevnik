import React, { useEffect, useState } from 'react';
import { fetchProjectActivity } from '../../../lib/data';
import type { ActivityLogItem } from '../../../shared/types';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Activity } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  diary_entry_created: 'dodao dnevnički unos',
};

export default function ActivityFeed({ projectId, brandColor }: {
  projectId: string;
  brandColor?: string;
}) {
  const [items, setItems] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const color = brandColor || 'var(--color-accent)';

  useEffect(() => {
    setLoading(true);
    fetchProjectActivity(projectId)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-zinc-400">
        <span className="text-sm">Učitavanje aktivnosti...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
        <Activity size={40} className="opacity-20" />
        <p className="text-sm">Nema zabilježenih aktivnosti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold"
            style={{ backgroundColor: color }}
          >
            {item.actorName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-semibold">{item.actorName}</span>
              {' '}
              <span className="text-zinc-600">{ACTION_LABELS[item.action] ?? item.action}</span>
              {item.entityName && (
                <span className="font-medium text-zinc-800"> „{item.entityName}"</span>
              )}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {formatDistanceToNow(parseISO(item.createdAt), { addSuffix: true, locale: hr })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
