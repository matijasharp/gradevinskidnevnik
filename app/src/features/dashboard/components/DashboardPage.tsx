import React from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useOrg } from '../../../app/providers';
import { ROUTES } from '../../../app/router/routeConfig';
import { useGoogleCalendar } from '../../calendar/hooks/useGoogleCalendar';
import DashboardView from './DashboardView';

export default function DashboardPage() {
  const { appUser, company } = useAuth();
  const { projects, entries } = useOrg();
  const { googleTokens, calendarEvents, calendarLoading, connectGoogleCalendar } = useGoogleCalendar();
  const navigate = useNavigate();

  if (!appUser) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <DashboardView
      appUser={appUser}
      projects={projects}
      entries={entries}
      onProjectClick={(p) => navigate(`/projects/${p.id}`)}
      onNewEntry={() => navigate(ROUTES.NEW_ENTRY)}
      onUsersClick={() => navigate(ROUTES.USERS)}
      onSettingsClick={() => navigate(ROUTES.COMPANY_SETTINGS)}
      googleTokens={googleTokens}
      calendarEvents={calendarEvents}
      calendarLoading={calendarLoading}
      onConnectCalendar={connectGoogleCalendar}
      onOpenSecrets={() => {/* SecretsModal wiring restored in 14-03 */}}
      company={company}
    />
  );
}
