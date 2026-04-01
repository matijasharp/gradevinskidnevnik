import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Trash2, Plus, FileText, Loader2 } from 'lucide-react';
import { fetchProjectDocuments, uploadProjectDocument, deleteProjectDocument } from '../../../lib/data';
import type { ProjectDocument } from '../../../lib/data';
import type { Project } from '../../../shared/types';
import { Button, Card } from '../../../shared/ui';

export default function ProjectDocumentsTab({ project, currentUser, readonly = false, company }: {
  project: Project;
  currentUser: any;
  readonly?: boolean;
  company: any;
}) {
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandColor = company?.brandColor || 'var(--color-accent)';

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchProjectDocuments(project.id);
      setDocs(d);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    try {
      const doc = await uploadProjectDocument({
        projectId: project.id,
        orgId: currentUser.companyId,
        file,
        uploadedBy: currentUser.id
      });
      setDocs(prev => [doc, ...prev]);
    } catch { /* silent */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (doc: ProjectDocument) => {
    try {
      await deleteProjectDocument(doc.id, doc.filePath);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch { /* silent */ }
  };

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const fileTypeLabel = (mimeType?: string) => {
    if (!mimeType) return '';
    const part = mimeType.split('/')[1]?.toUpperCase() ?? '';
    return part.length > 6 ? part.slice(0, 6) : part;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dokumenti</h3>
        {docs.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pretraži dokumente..."
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        )}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">{search ? 'Nema rezultata.' : 'Nema dokumenata.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map(doc => (
              <Card key={doc.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-zinc-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    {doc.fileType && (
                      <span className="text-xs text-zinc-400">{fileTypeLabel(doc.fileType)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors rounded-lg hover:bg-zinc-100"
                  >
                    <Download size={14} />
                  </a>
                  {!readonly && (
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {!readonly && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dodaj dokument</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ backgroundColor: brandColor }}
            className="w-full text-white border-none"
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin mr-2" />Učitavanje...</>
              : <><Plus size={14} className="mr-2" />Dodaj dokument</>
            }
          </Button>
        </section>
      )}
    </div>
  );
}
