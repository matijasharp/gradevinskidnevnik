import React, { useState } from 'react';
import {
  Plus,
  User as UserIcon,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button, Card } from '../../../shared/ui';
import { getPhases } from '../../../lib/disciplineConfig';
import type { Project } from '../../../shared/types';

function ProjectsView({ projects, sharedProjects = [], onProjectClick, onSharedProjectClick, onCreateProject, onNewEntry, userRole, company }: any) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const brandColor = company?.brandColor || 'var(--color-accent)';

  const filteredProjects = (projects || []).filter((p: Project) => {
    const statusMatch = filter === 'all' || p.status === filter;
    const phaseMatch = phaseFilter === 'all' || p.phase === phaseFilter;
    return statusMatch && phaseMatch;
  });

  const filterOptions = [
    { value: 'all', label: 'Svi' },
    { value: 'active', label: 'Aktivni' },
    { value: 'completed', label: 'Završeni' },
    { value: 'archived', label: 'Arhivirani' },
  ];

  const phaseOptions = [
    { value: 'all', label: 'Sve faze' },
    ...getPhases(company?.discipline).map((p: string) => ({ value: p, label: p })),
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Projekti</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onNewEntry}
            className="hidden md:flex items-center gap-2 font-bold"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            <Plus size={18} />
            Novi unos
          </Button>
          {userRole === 'admin' && (
            <Button onClick={onCreateProject} style={{ backgroundColor: brandColor }}>
              <Plus size={20} /> Novi projekt
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as any)}
              className={cn(
                "px-4 py-2 rounded text-sm font-bold transition-all whitespace-nowrap border",
                filter === opt.value
                  ? "text-white border-transparent shadow-lg"
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
              )}
              style={filter === opt.value ? { backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {phaseOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPhaseFilter(opt.value)}
              className={cn(
                "px-4 py-2 rounded text-[10px] uppercase tracking-wider font-bold transition-all whitespace-nowrap border",
                phaseFilter === opt.value
                  ? "bg-zinc-800 text-white border-transparent"
                  : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProjects.map((p: Project) => (
          <Card key={p.id} onClick={() => onProjectClick(p)} className="cursor-pointer hover:border-zinc-300 transition-all group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold transition-colors" style={{ color: 'inherit' }}>
                    <span className="transition-colors" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = brandColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>{p.projectName}</span>
                  </h3>
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                    p.status === 'active' ? "bg-green-100 text-green-600" :
                    p.status === 'completed' ? "bg-accent/10 text-accent" :
                    "bg-zinc-100 text-zinc-500"
                  )}>
                    {p.status === 'active' ? 'Aktivno' :
                     p.status === 'completed' ? 'Završeno' : 'Arhivirano'}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                    {p.phase}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 flex items-center gap-1">
                  <UserIcon size={14} /> {p.clientName}
                </p>
                <p className="text-sm text-zinc-500 flex items-center gap-1">
                  <MapPin size={14} /> {p.street}, {p.city}
                </p>
              </div>
              <ChevronRight className="text-zinc-300 transition-all group-hover:translate-x-1" size={24} style={{ color: undefined }} />
            </div>
          </Card>
        ))}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400">Nema projekata za odabrani status.</p>
          </div>
        )}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Dijeljeni projekti</h2>
          {sharedProjects.length > 0 && (
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">{sharedProjects.length}</span>
          )}
        </div>
        {sharedProjects.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">Nema dijeljenih projekata.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sharedProjects.map((p: Project) => (
              <Card key={p.id} onClick={() => onSharedProjectClick(p)} className="cursor-pointer hover:border-zinc-300 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold">{p.projectName}</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                        Tuđi projekt
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 flex items-center gap-1">
                      <UserIcon size={14} /> {p.clientName}
                    </p>
                    <p className="text-sm text-zinc-500 flex items-center gap-1">
                      <MapPin size={14} /> {p.street}, {p.city}
                    </p>
                  </div>
                  <ChevronRight className="text-zinc-300 transition-all group-hover:translate-x-1" size={24} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ProjectsView;
