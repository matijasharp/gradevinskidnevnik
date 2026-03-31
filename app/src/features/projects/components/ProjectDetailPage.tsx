import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import { useOrg } from '../../../app/providers';
import { useGoogleCalendar } from '../../calendar/hooks/useGoogleCalendar';
import { ROUTES } from '../../../app/router/routeConfig';
import { generateDiaryPdf } from '../../../integrations/pdf/generateDiaryPdf';
import ProjectDetailView from './ProjectDetailView';
import DiaryEntryDetailModal from '../../diary/components/DiaryEntryDetailModal';
import type { DiaryEntry } from '../../../shared/types';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { appUser, company } = useAuth();
  const { projects, entries, sharedProjects, companyUsers,
          completeProject, updateProjectPhase, deleteProject } = useOrg();
  const { googleTokens, addToCalendar } = useGoogleCalendar();
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);

  const project = projects.find(p => p.id === projectId) ?? null;
  const isShared = sharedProjects.some(sp => sp.id === projectId);

  if (!project) return null;

  const projectEntries = entries
    .filter(e => e.projectId === project.id)
    .sort((a, b) => b.entryDate.localeCompare(a.entryDate));

  const entryProject = selectedEntry
    ? (projects.find(p => p.id === selectedEntry.projectId) ?? null)
    : null;

  return (
    <>
      <ProjectDetailView
        project={project}
        entries={projectEntries}
        onBack={() => navigate(ROUTES.PROJECTS)}
        onNewEntry={() => navigate(ROUTES.NEW_ENTRY)}
        onEntryClick={setSelectedEntry}
        onGeneratePDF={async () =>
          await generateDiaryPdf(project, projectEntries, company)
        }
        onAddToCalendar={(entry) => addToCalendar(entry, project.projectName)}
        onCompleteProject={() => completeProject(project.id)}
        onUpdatePhase={(phase) => updateProjectPhase(project.id, phase)}
        onDeleteProject={() => deleteProject(project.id)}
        hasCalendar={!!googleTokens}
        userRole={appUser?.role}
        appUser={appUser}
        company={company}
        readonly={isShared}
        companyUsers={companyUsers}
      />
      {selectedEntry && entryProject && (
        <DiaryEntryDetailModal
          entry={selectedEntry}
          project={entryProject}
          onClose={() => setSelectedEntry(null)}
          onEdit={(e) => {
            setSelectedEntry(null);
            navigate(`/diary/${e.id}/edit`);
          }}
          onAddToCalendar={(entry) => {
            const projectName = projects.find(p => p.id === entry.projectId)?.projectName ?? '';
            return addToCalendar(entry, projectName).then(() => setSelectedEntry(null));
          }}
          hasCalendar={!!googleTokens}
          company={company}
        />
      )}
    </>
  );
}
