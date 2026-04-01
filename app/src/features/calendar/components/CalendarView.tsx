import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CalendarDays, Calendar } from 'lucide-react';
import { Button, Card } from '../../../shared/ui';
import { cn } from '../../../lib/utils';
import type { Project, DiaryEntry, CalendarEvent } from '../../../shared/types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  isToday,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { hr } from 'date-fns/locale';

export default function CalendarView({
  projects,
  entries,
  googleEvents,
  onConnectGoogle,
  isConnected,
  company
}: {
  projects: Project[],
  entries: DiaryEntry[],
  googleEvents: CalendarEvent[],
  onConnectGoogle: () => void,
  isConnected: boolean,
  company: any
}) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const brandColor = company?.brandColor || 'var(--color-accent)';

  const getEventColor = (status: string) => {
    switch (status) {
      case 'završeno':
      case 'completed':
        return '#16a34a'; // green-600
      case 'čeka materijal':
      case 'on-hold':
        return '#ea580c'; // orange-600
      case 'blokirano':
        return '#dc2626'; // red-600
      case 'potrebno dodatno':
        return '#9333ea'; // purple-600
      case 'djelomično završeno':
        return '#0ea5e9'; // sky-600
      case 'active':
        return '#2563eb'; // blue-600
      default:
        return brandColor;
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);

  let startDate: Date;
  let endDate: Date;

  if (viewType === 'month') {
    startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  } else if (viewType === 'week') {
    startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  } else {
    startDate = startOfDay(currentDate);
    endDate = endOfDay(currentDate);
  }

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const next = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prev = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const getEventsForDay = (day: Date) => {
    const dayEntries = entries.filter(e => isSameDay(parseISO(e.entryDate), day));
    const dayProjects = projects.filter(p => p.startDate && isSameDay(parseISO(p.startDate), day));
    const dayGoogle = googleEvents.filter(e => {
      const start = e.start.dateTime ? parseISO(e.start.dateTime) : parseISO(e.start.date);
      return isSameDay(start, day);
    });

    return { entries: dayEntries, projects: dayProjects, google: dayGoogle };
  };

  const renderHeader = () => {
    let title = "";
    if (viewType === 'month') title = format(currentDate, 'MMMM yyyy', { locale: hr });
    else if (viewType === 'week') {
      title = `${format(startDate, 'd. MMM', { locale: hr })} - ${format(endDate, 'd. MMM yyyy', { locale: hr })}`;
    } else {
      title = format(currentDate, 'EEEE, d. MMMM yyyy', { locale: hr });
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-lg md:text-xl font-bold capitalize">
          {title}
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex bg-zinc-100 p-1 rounded-lg">
            <button
              onClick={() => setViewType('month')}
              className={cn(
                "px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all",
                viewType === 'month' ? "text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
              style={viewType === 'month' ? { backgroundColor: brandColor } : {}}
            >
              Mjesec
            </button>
            <button
              onClick={() => setViewType('week')}
              className={cn(
                "px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all",
                viewType === 'week' ? "text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
              style={viewType === 'week' ? { backgroundColor: brandColor } : {}}
            >
              Tjedan
            </button>
            <button
              onClick={() => setViewType('day')}
              className={cn(
                "px-2 md:px-3 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all",
                viewType === 'day' ? "text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
              style={viewType === 'day' ? { backgroundColor: brandColor } : {}}
            >
              Dan
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prev}
              className="flex items-center justify-center h-8 w-8 rounded-md text-zinc-600 hover:bg-zinc-100 active:scale-95 transition-all"
              aria-label="Prethodno"
            >
              <ChevronRight className="rotate-180" size={18} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="flex items-center justify-center px-2 h-8 text-[10px] md:text-xs font-bold rounded-md text-zinc-600 hover:bg-zinc-100 active:scale-95 transition-all"
            >
              Danas
            </button>
            <button
              onClick={next}
              className="flex items-center justify-center h-8 w-8 rounded-md text-zinc-600 hover:bg-zinc-100 active:scale-95 transition-all"
              aria-label="Sljedeće"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Kalendar</h1>
          <p className="text-zinc-500">Pratite radove i rokove na jednom mjestu.</p>
        </div>
        {!isConnected && (
          <Button onClick={onConnectGoogle} variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-center" style={{ borderColor: brandColor + '40', color: brandColor }}>
            <CalendarDays size={16} /> Poveži Google Kalendar
          </Button>
        )}
      </header>

      <Card className="p-6 bg-white shadow-xl border-none">
        {renderHeader()}

        {viewType === 'day' ? (
          <div className="space-y-6">
            {calendarDays.map((day, idx) => {
              const { entries: dayEntries, projects: dayProjects, google: dayGoogle } = getEventsForDay(day);
              return (
                <div key={idx} className="space-y-4">
                  {dayProjects.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>Projekti</h3>
                      {dayProjects.map(p => {
                        const color = getEventColor(p.status);
                        return (
                          <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="p-4 rounded-r-xl border-l-4 cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: color + '10', borderColor: color }}>
                            <p className="font-bold" style={{ color: color }}>{p.projectName}</p>
                            <p className="text-sm opacity-70" style={{ color: color }}>{p.clientName} • {p.street}, {p.city}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {dayEntries.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: brandColor }}>Dnevnički zapisi</h3>
                      {dayEntries.map(e => {
                        const color = getEventColor(e.status);
                        return (
                          <div key={e.id} onClick={() => navigate(`/projects/${e.projectId}`)} className="p-4 rounded-r-xl border-l-4 cursor-pointer hover:opacity-80 transition-opacity" style={{ backgroundColor: color + '10', borderColor: color }}>
                            <p className="font-bold" style={{ color: color }}>{e.title}</p>
                            <p className="text-sm opacity-70" style={{ color: color }}>{e.workType} • {e.hours}h • {e.workersCount} radnika</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {dayGoogle.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Google Kalendar</h3>
                      {dayGoogle.map((e, i) => (
                        <div key={i} className="p-4 bg-zinc-50 border-l-4 border-zinc-400 rounded-r-xl">
                          <p className="font-bold text-zinc-800">{e.summary}</p>
                          {e.description && <p className="text-sm text-zinc-600">{e.description}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {dayProjects.length === 0 && dayEntries.length === 0 && dayGoogle.length === 0 && (
                    <div className="h-40 flex flex-col items-center justify-center text-zinc-400 space-y-2">
                      <Calendar size={48} className="opacity-20" />
                      <p>Nema planiranih aktivnosti za ovaj dan.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-zinc-100 border border-zinc-100 rounded-xl overflow-hidden">
            {['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'].map(day => (
              <div key={day} className="bg-zinc-50 p-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {day}
              </div>
            ))}

            {calendarDays.map((day, idx) => {
              const { entries: dayEntries, projects: dayProjects, google: dayGoogle } = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isTodayDay = isToday(day);

              return (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewType('day');
                  }}
                  className={cn(
                    "min-h-[100px] md:min-h-[120px] bg-white p-2 transition-colors hover:bg-zinc-50/50 text-left items-start flex flex-col w-full border-none outline-none group",
                    !isCurrentMonth && viewType === 'month' && "bg-zinc-50/30 text-zinc-300"
                  )}
                >
                  <div className="flex justify-between items-center w-full mb-2">
                    <span className={cn(
                      "text-xs md:text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full transition-transform group-hover:scale-110",
                      isTodayDay && "text-white shadow-lg"
                    )}
                    style={isTodayDay ? { backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` } : {}}
                    >
                      {format(day, 'd')}
                    </span>
                    { (dayEntries.length > 0 || dayProjects.length > 0 || dayGoogle.length > 0) && (
                      <div className="flex gap-0.5">
                        {dayEntries.length > 0 && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getEventColor(dayEntries[0].status) }} />}
                        {dayProjects.length > 0 && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getEventColor(dayProjects[0].status) }} />}
                        {dayGoogle.length > 0 && <div className="w-1 h-1 rounded-full bg-zinc-400" />}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 w-full overflow-hidden">
                    {dayProjects.slice(0, 2).map(p => {
                      const color = getEventColor(p.status);
                      return (
                        <div key={p.id} className="text-[8px] md:text-[10px] p-0.5 md:p-1 rounded border-l-2 truncate font-medium" style={{ backgroundColor: color + '20', color: color, borderColor: color }}>
                          🚀 {p.projectName}
                        </div>
                      );
                    })}
                    {dayEntries.slice(0, 2).map(e => {
                      const color = getEventColor(e.status);
                      return (
                        <div key={e.id} className="text-[8px] md:text-[10px] p-0.5 md:p-1 rounded border-l-2 truncate font-medium" style={{ backgroundColor: color + '10', color: color, borderColor: color }}>
                          📝 {e.title}
                        </div>
                      );
                    })}
                    {dayGoogle.slice(0, 1).map((e, i) => (
                      <div key={i} className="text-[8px] md:text-[10px] p-0.5 md:p-1 bg-zinc-100 text-zinc-600 rounded border-l-2 border-zinc-400 truncate italic">
                        🗓️ {e.summary}
                      </div>
                    ))}
                    {(dayProjects.length + dayEntries.length + dayGoogle.length > 5) && (
                      <p className="text-[8px] text-zinc-400 text-center">+ još</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
