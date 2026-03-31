import React from 'react';
import { useAuth, useOrg } from '../../../app/providers';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import CalendarView from './CalendarView';

export default function CalendarPage() {
  const { company } = useAuth();
  const { projects, entries } = useOrg();
  const { googleTokens, calendarEvents, connectGoogleCalendar } = useGoogleCalendar();

  return (
    <CalendarView
      projects={projects}
      entries={entries}
      googleEvents={calendarEvents}
      onConnectGoogle={connectGoogleCalendar}
      isConnected={!!googleTokens}
      company={company}
    />
  );
}
