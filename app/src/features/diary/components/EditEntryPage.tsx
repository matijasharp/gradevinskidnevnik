import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import { useOrg } from '../../../app/providers';
import { ROUTES } from '../../../app/router/routeConfig';
import NewEntryView from './NewEntryView';

export default function EditEntryPage() {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const { appUser, company } = useAuth();
  const { projects, entries, materialHistory, materialUnits } = useOrg();

  const entry = entries.find(e => e.id === entryId) ?? null;
  if (!entry || !appUser) return null;

  const initialProject = projects.find(p => p.id === entry.projectId);

  return (
    <NewEntryView
      appUser={appUser}
      projects={projects}
      initialProject={initialProject}
      initialEntry={entry}
      materialHistory={materialHistory}
      materialUnits={materialUnits}
      company={company}
      onCancel={() => navigate(ROUTES.DASHBOARD)}
      onSuccess={() => navigate(ROUTES.DASHBOARD)}
    />
  );
}
