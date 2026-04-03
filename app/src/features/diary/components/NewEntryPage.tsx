import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import { useOrg } from '../../../app/providers';
import { ROUTES } from '../../../app/router/routeConfig';
import NewEntryView from './NewEntryView';

export default function NewEntryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appUser, company } = useAuth();
  const { projects, materialHistory, materialUnits } = useOrg();

  if (!appUser) return null;

  const initialProjectId = (location.state as any)?.projectId;
  const initialProject = initialProjectId
    ? projects.find(p => p.id === initialProjectId) ?? null
    : null;

  return (
    <NewEntryView
      appUser={appUser}
      projects={projects}
      initialProject={initialProject}
      materialHistory={materialHistory}
      materialUnits={materialUnits}
      company={company}
      onCancel={() => navigate(ROUTES.DASHBOARD)}
      onSuccess={() => navigate(ROUTES.DASHBOARD)}
    />
  );
}
