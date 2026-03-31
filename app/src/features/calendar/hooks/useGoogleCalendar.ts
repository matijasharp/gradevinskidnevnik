import { useState, useEffect } from 'react';
import { useAuth } from '../../../app/providers';
import { updateProfileTokens } from '../../../lib/data';
import type { DiaryEntry, GoogleTokens, CalendarEvent } from '../../../shared/types';

export function useGoogleCalendar() {
  const { user, appUser } = useAuth();
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    if (!user) setGoogleTokens(null);
  }, [user]);

  useEffect(() => {
    if (appUser?.googleTokens) {
      setGoogleTokens(appUser.googleTokens);
      fetchCalendarEvents(appUser.googleTokens);
    }
  }, [appUser]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && user) {
        const tokens = event.data.tokens;
        setGoogleTokens(tokens);
        await updateProfileTokens(user.id, tokens);
        fetchCalendarEvents(tokens);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user]);

  const fetchCalendarEvents = async (tokens: GoogleTokens) => {
    setCalendarLoading(true);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens }),
      });
      if (response.ok) {
        const events = await response.json();
        setCalendarEvents(events);
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
    setCalendarLoading(false);
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      const { url } = await response.json();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
    }
  };

  const addToCalendar = async (entry: DiaryEntry, projectName: string): Promise<boolean> => {
    if (!googleTokens) return false;

    const entryDate = new Date(entry.entryDate);
    if (isNaN(entryDate.getTime())) {
      alert('Nevažeći datum unosa.');
      return false;
    }

    const event = {
      summary: `Site Diary: ${entry.title}`,
      description: `Projekt: ${projectName}\nOpis: ${entry.description}\nStatus: ${entry.status}`,
      start: {
        dateTime: entryDate.toISOString(),
      },
      end: {
        dateTime: new Date(entryDate.getTime() + 60 * 60 * 1000).toISOString(),
      },
    };

    try {
      const response = await fetch('/api/calendar/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: googleTokens, event }),
      });
      if (response.ok) {
        alert('Događaj uspješno dodan u Google kalendar!');
        return true;
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
    }
    return false;
  };

  return { googleTokens, calendarEvents, calendarLoading, connectGoogleCalendar, addToCalendar };
}
