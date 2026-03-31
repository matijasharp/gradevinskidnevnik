import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../app/providers';
import { useOrg } from '../../../app/providers';
import { ROUTES } from '../../../app/router/routeConfig';
import NewEntryView from './NewEntryView';

export default function NewEntryPage() {
  const navigate = useNavigate();
  const { appUser, company } = useAuth();
  const { projects, materialHistory, materialUnits } = useOrg();

  if (!appUser) return null;

  return (
    <NewEntryView
      appUser={appUser}
      projects={projects}
      materialHistory={materialHistory}
      materialUnits={materialUnits}
      company={company}
      onCancel={() => navigate(ROUTES.DASHBOARD)}
      onSuccess={() => navigate(ROUTES.DASHBOARD)}
    />
  );
}
