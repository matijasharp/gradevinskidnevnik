import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Trash2, CheckCircle2, Download, Plus, Loader2, User as UserIcon, MapPin, History, Clock, Search, Calendar, AlertTriangle } from 'lucide-react';
import Markdown from 'react-markdown';
import { fetchProjectPhotos } from '../../../lib/data';
import { generateDiaryPdf } from '../../../integrations/pdf/generateDiaryPdf';
import type { DiaryEntry, DiaryPhoto } from '../../../shared/types';
import { safeFormatDate } from '../../../shared/utils/format';
import { OperationType, handleFirestoreError } from '../../../shared/utils/error';
import { cn } from '../../../lib/utils';
import { Button, Card, StatusBadge } from '../../../shared/ui';
import { getPhases } from '../../../lib/disciplineConfig';
import PhotoGallery from '../../diary/components/PhotoGallery';
import ProjectMembersTab from './ProjectMembersTab';
import ProjectTasksTab from './ProjectTasksTab';
import ProjectDocumentsTab from './ProjectDocumentsTab';
import ActivityFeed from './ActivityFeed';

export default function ProjectDetailView({ project, entries, onBack, onNewEntry, onEntryClick, onGeneratePDF, onAddToCalendar, onCompleteProject, onUpdatePhase, onDeleteProject, hasCalendar, userRole, appUser, company, readonly = false, companyUsers = [] }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectPhotos, setProjectPhotos] = useState<DiaryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<DiaryPhoto | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'dnevnik' | 'suradnici' | 'zadaci' | 'dokumenti' | 'aktivnost'>('dnevnik');

  const brandColor = company?.brandColor || 'var(--color-accent)';

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateDiaryPdf(project, entries, company, projectPhotos);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (!project.id || !appUser?.companyId) return;

    // Fetch photos for the project (one-time fetch to save quota)
    const fetchPhotos = async () => {
      try {
        const photos = await fetchProjectPhotos(project.id);
        setProjectPhotos(photos);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'diaryPhotos-project');
      }
    };

    fetchPhotos();
  }, [project.id, appUser?.companyId]);

  const uniqueWorkers = Array.from(new Set((entries || []).map((e: DiaryEntry) => JSON.stringify({ id: e.createdBy, name: e.createdByName }))))
    .map(s => JSON.parse(s as string));

  const filteredEntries = (entries || []).filter((entry: DiaryEntry) => {
    const matchesSearch = (entry?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (entry?.description || '').toLowerCase().includes((searchQuery || '').toLowerCase());

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && entry.entryDate >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && entry.entryDate <= endDate;
    }

    const matchesWorker = selectedWorkerId ? entry.createdBy === selectedWorkerId : true;
    const matchesPhase = selectedPhase ? entry.phase === selectedPhase : true;

    return matchesSearch && matchesDate && matchesWorker && matchesPhase;
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{project.projectName}</h1>
              {project.status === 'completed' && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">Završeno</span>
              )}
              <span className="bg-zinc-100 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">{project.phase}</span>
              {userRole === 'admin' && project.status !== 'completed' && (
                <select
                  className="text-[10px] font-bold uppercase bg-zinc-50 border-none rounded-full px-2 py-0.5 focus:ring-0 cursor-pointer text-zinc-500"
                  value={project.phase}
                  onChange={(e) => onUpdatePhase(e.target.value)}
                >
                  {getPhases(company?.discipline).map((p: string) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-1">
              <UserIcon size={14} /> {project.clientName}
            </p>
            <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
              <MapPin size={14} /> {project.street}, {project.city}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {userRole === 'admin' && (
            <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 border-red-100 hover:bg-red-50 p-2.5 md:px-4">
              <Trash2 size={18} />
              <span className="hidden md:inline ml-2 text-xs">Obriši</span>
            </Button>
          )}
          {project.status !== 'completed' && userRole === 'admin' && (
            <Button variant="outline" onClick={onCompleteProject} className="text-green-600 border-green-200 hover:bg-green-50 flex-1 md:flex-none">
              <CheckCircle2 size={18} />
              <span className="ml-1 md:ml-2 text-sm md:text-base">Završi</span>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            className="flex-1 md:flex-none font-bold shadow-sm"
            disabled={isGeneratingPDF}
            style={{ borderColor: isGeneratingPDF ? undefined : brandColor + '40', color: isGeneratingPDF ? undefined : brandColor }}
          >
            {isGeneratingPDF ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            <span className="ml-1 md:ml-2 text-sm md:text-base">{isGeneratingPDF ? 'Generiram...' : 'Izvještaj'}</span>
          </Button>
          {!readonly && (
            <Button
              onClick={onNewEntry}
              className="flex-1 md:flex-none font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}4D` }}
            >
              <Plus size={18} />
              <span className="ml-1 md:ml-2 text-sm md:text-base">Novi unos</span>
            </Button>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="overflow-x-auto">
      <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit min-w-max">
        <button
          onClick={() => setActiveTab('dnevnik')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'dnevnik' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Dnevnik
        </button>
        <button
          onClick={() => setActiveTab('suradnici')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'suradnici' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Suradnici
        </button>
        <button
          onClick={() => setActiveTab('zadaci')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'zadaci' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Zadaci
        </button>
        <button
          onClick={() => setActiveTab('dokumenti')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'dokumenti' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Dokumenti
        </button>
        <button
          onClick={() => setActiveTab('aktivnost')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'aktivnost' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Aktivnost
        </button>
      </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-4 text-red-600">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Obriši projekt?</h2>
            </div>

            <p className="text-sm md:text-base text-zinc-500">
              Jeste li sigurni da želite obrisati projekt <span className="font-bold text-zinc-900">{project.projectName}</span>?
              Ova radnja će trajno obrisati sve unose i fotografije povezane s ovim projektom.
            </p>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                Odustani
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none" onClick={onDeleteProject}>
                Obriši trajno
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'suradnici' && (
        <ProjectMembersTab
          project={project}
          currentUser={appUser}
          orgMembers={companyUsers}
          company={company}
        />
      )}

      {activeTab === 'zadaci' && (
        <ProjectTasksTab
          project={project}
          currentUser={appUser}
          orgMembers={companyUsers}
          readonly={readonly}
          company={company}
        />
      )}

      {activeTab === 'dokumenti' && (
        <ProjectDocumentsTab
          project={project}
          currentUser={appUser}
          readonly={readonly}
          company={company}
        />
      )}

      {activeTab === 'aktivnost' && (
        <ActivityFeed
          projectId={project.id}
          brandColor={brandColor}
        />
      )}

      {activeTab === 'dnevnik' && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center gap-1">
          <Clock size={20} style={{ color: brandColor }} />
          <p className="text-[10px] font-bold text-zinc-500 uppercase">Ukupno unosa</p>
          <p className="text-2xl font-bold">{(entries || []).length}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center gap-1">
          <History size={20} style={{ color: brandColor }} />
          <p className="text-[10px] font-bold text-zinc-500 uppercase">Zadnji unos</p>
          <p className="text-sm font-bold">{entries && entries.length > 0 ? safeFormatDate(entries[0].entryDate, 'dd.MM.yyyy') : 'Nema'}</p>
        </Card>
      </div>

      {projectPhotos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Sve fotografije</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {projectPhotos.map((photo) => (
              <div
                key={photo.id}
                className="aspect-square rounded-xl overflow-hidden border border-zinc-100 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt="Projektna fotografija"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6"
          >
            <button
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <img
                src={selectedPhoto.url}
                alt="Puna veličina"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {selectedPhoto.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 max-w-2xl w-full text-center mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white text-lg md:text-xl font-medium leading-relaxed">{selectedPhoto.description}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Od:</span>
                  <input
                    type="date"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Do:</span>
                  <input
                    type="date"
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Radnik:</span>
                  <select
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent appearance-none"
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                  >
                    <option value="">Svi radnici</option>
                    {uniqueWorkers.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Faza:</span>
                  <select
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent appearance-none"
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                  >
                    <option value="">Sve faze</option>
                    <option value="Priprema">Priprema</option>
                    <option value="Razvod">Razvod</option>
                    <option value="Kabliranje">Kabliranje</option>
                    <option value="Montaža">Montaža</option>
                    <option value="Sanacija">Sanacija</option>
                    <option value="Testiranje">Testiranje</option>
                    <option value="Završeno">Završeno</option>
                  </select>
                </div>
            </div>
            {(startDate || endDate || selectedWorkerId || selectedPhase) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setSelectedWorkerId(''); setSelectedPhase(''); }}
                className="text-xs font-bold hover:underline px-2 py-1.5"
                style={{ color: brandColor }}
              >
                Očisti filtere
              </button>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Vremenska lenta</h2>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Pretraži unose..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-6 relative before:absolute before:left-5 md:before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
          {filteredEntries.map((entry: DiaryEntry) => (
            <div key={entry.id} className="relative pl-10 md:pl-12">
              <div className="absolute left-3 md:left-4 top-1 w-4 h-4 rounded-full bg-white border-2 z-10" style={{ borderColor: brandColor, boxShadow: `0 0 10px ${brandColor}4D` }} />
              <Card onClick={() => onEntryClick(entry)} className="space-y-3 cursor-pointer transition-all" style={{ hoverBorderColor: brandColor + '4D' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">
                      {safeFormatDate(entry.entryDate, 'EEEE, dd.MM.yyyy')}
                    </span>
                    {entry.phase && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold uppercase">{entry.phase}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCalendar && (
                      <button
                        onClick={() => onAddToCalendar(entry)}
                        className="p-1.5 text-zinc-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="Dodaj u kalendar"
                      >
                        <Calendar size={16} style={{ color: brandColor }} />
                      </button>
                    )}
                    <StatusBadge status={entry.status} />
                  </div>
                </div>
                <h3 className="font-bold">{entry.title}</h3>
                <p className="text-sm text-zinc-600 line-clamp-2">{entry.description}</p>

                {entry.lineItems && entry.lineItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 py-1">
                    {entry.lineItems.map((item, idx) => (
                      <span key={idx} className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-md font-medium text-zinc-600">
                        {item.name}: {item.quantity} {item.unit}
                      </span>
                    ))}
                  </div>
                )}

                {/* Photo Gallery */}
                <PhotoGallery entryId={entry.id} onPhotoClick={setSelectedPhoto} />

                {entry.aiSummary && (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">AI Sažetak</p>
                    <div className="prose prose-sm prose-zinc max-w-none break-words prose-headings:font-bold prose-headings:tracking-tight prose-p:text-zinc-600 prose-p:leading-relaxed">
                      <Markdown>{entry.aiSummary}</Markdown>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 pt-2 text-[10px] font-bold text-zinc-400 uppercase">
                  <span className="flex items-center gap-1"><Clock size={12} /> {entry.hours}h</span>
                  <span className="flex items-center gap-1"><UserIcon size={12} /> {entry.workersCount} radnika</span>
                </div>
              </Card>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 ml-12">
              <p className="text-zinc-400">{searchQuery ? 'Nema unosa koji odgovaraju pretrazi.' : 'Još nema unosa.'}</p>
            </div>
          )}
        </div>
      </section>
      </>
      )}
    </div>
  );
}
