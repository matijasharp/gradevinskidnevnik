import React from 'react';
import { Plus, Layers, ChevronRight, MapPin } from 'lucide-react';
import type { MasterProject } from '../../../lib/data';

export default function MasterProjectsListView({ masterProjects, brandColor, onSelect, onCreateNew, isCoordinator = false }: {
  masterProjects: MasterProject[];
  brandColor?: string;
  onSelect: (mp: MasterProject) => void;
  onCreateNew?: () => void;
  isCoordinator?: boolean;
}) {
  const color = brandColor || '#3b82f6';
  const statusLabel: Record<string, string> = { active: 'Aktivan', completed: 'Završen', archived: 'Arhiviran' };
  const statusColor: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', completed: 'bg-zinc-100 text-zinc-500', archived: 'bg-amber-100 text-amber-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master projekti</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Agregirani pregled svih disciplina na jednom projektu</p>
        </div>
        {isCoordinator && (
          <button
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
            onClick={onCreateNew}
          >
            <Plus size={16} />
            Novi master projekt
          </button>
        )}
      </div>

      {masterProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}20` }}>
            <Layers size={28} style={{ color }} />
          </div>
          {isCoordinator ? (
            <>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Nema master projekata</h3>
              <p className="text-sm text-zinc-500 max-w-xs">Kreirajte novi master projekt za agregaciju projekata više disciplina na jednoj lokaciji.</p>
              <button
                className="mt-6 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: color }}
                onClick={onCreateNew}
              >
                Kreiraj master projekt
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Niste pozvani ni na jedan master projekt</h3>
              <p className="text-sm text-zinc-500 max-w-xs">Koordinator vas mora pozvati da sudjelujete u master projektu.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {masterProjects.map(mp => (
            <button
              key={mp.id}
              className="w-full text-left bg-white border border-zinc-100 rounded-2xl p-5 hover:shadow-md transition-all group"
              onClick={() => onSelect(mp)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[mp.status] ?? statusColor.active}`}>
                      {statusLabel[mp.status] ?? mp.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg leading-tight truncate">{mp.name}</h3>
                  {mp.location && <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1"><MapPin size={12} />{mp.location}</p>}
                  {mp.description && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{mp.description}</p>}
                </div>
                <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-500 mt-1 flex-shrink-0 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
