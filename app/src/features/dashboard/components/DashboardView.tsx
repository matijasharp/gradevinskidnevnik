import React from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Calendar,
  CalendarDays,
  Loader2,
  ExternalLink,
  Users,
  Building2,
  Briefcase,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { signOut } from '../../../lib/supabaseAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { safeFormatDate } from '../../../shared/utils/format';
import { Button, Card } from '../../../shared/ui';
import type { Project, DiaryEntry } from '../../../shared/types';

function DashboardView({
  appUser,
  projects,
  entries,
  onProjectClick,
  onNewEntry,
  onUsersClick,
  onSettingsClick,
  googleTokens,
  calendarEvents,
  calendarLoading,
  onConnectCalendar,
  onOpenSecrets,
  company
}: any) {
  const activeProjects = projects.filter((p: any) => p.status === 'active');
  const brandColor = company?.brandColor || '#6366f1';

  // Prepare chart data
  const chartData = projects.map((p: Project) => {
    const projectEntries = entries.filter((e: DiaryEntry) => e.projectId === p.id);
    const totalHours = projectEntries.reduce((sum: number, e: DiaryEntry) => sum + (e.hours || 0), 0);
    return {
      name: p.projectName.length > 10 ? p.projectName.substring(0, 10) + '...' : p.projectName,
      fullName: p.projectName,
      hours: totalHours,
      entries: projectEntries.length
    };
  }).filter((d: any) => d.hours > 0 || d.entries > 0);

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Zdravo, {appUser.name.split(' ')[0]}!</h1>
          <p className="text-zinc-500">Što se danas događa na terenu?</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onNewEntry}
            className="hidden md:flex items-center gap-2 font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}4D` }}
          >
            <Plus size={18} />
            Novi unos
          </Button>
          <Button variant="ghost" onClick={signOut} className="md:hidden text-zinc-400 hover:text-red-500 hover:bg-red-50">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {!googleTokens && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl flex items-center justify-between gap-4"
          style={{ backgroundColor: brandColor + '10', borderColor: brandColor + '20', borderStyle: 'solid', borderWidth: '1px' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: brandColor + '20', color: brandColor }}>
              <Calendar size={20} />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-bold" style={{ color: brandColor }}>Povežite Google Kalendar</p>
              <p className="text-xs opacity-70" style={{ color: brandColor }}>Pratite rokove i zakazane radove direktno na svom Dashboardu.</p>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onConnectCalendar}
            className="text-white border-none shadow-lg whitespace-nowrap"
            style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` }}
          >
            Poveži sada
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {appUser.role === 'admin' && (
          <Card
            className="p-6 text-white border-none shadow-xl cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-between"
            onClick={onUsersClick}
            style={{ backgroundColor: brandColor, boxShadow: `0 20px 25px -5px ${brandColor}33` }}
          >
            <div className="space-y-2">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Upravljanje timom</h3>
              <p className="text-sm opacity-80">Pozovite radnike i upravljajte ulogama.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-4">
              Otvori <ChevronRight size={14} />
            </div>
          </Card>
        )}
        {appUser.role === 'admin' && (
          <Card
            className="p-6 bg-white border-zinc-100 cursor-pointer hover:scale-[1.02] transition-transform flex flex-col justify-between shadow-sm"
            onClick={onSettingsClick}
          >
            <div className="space-y-2">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <Building2 size={20} className="text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold">Postavke tvrtke</h3>
              <p className="text-sm text-zinc-500">Ažurirajte naziv, logo i brand tvrtke.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-4 text-zinc-400">
              Otvori <ChevronRight size={14} />
            </div>
          </Card>
        )}
        <Card
          className="p-6 space-y-2 shadow-sm flex flex-col justify-center"
          style={appUser.role !== 'admin' ? { backgroundColor: brandColor, color: 'white', border: 'none', boxShadow: `0 20px 25px -5px ${brandColor}33`, gridColumn: 'span 3 / span 3' } : { backgroundColor: 'white', border: '1px solid #f4f4f5' }}
        >
          <p className={`text-xs font-bold uppercase tracking-widest ${appUser.role === 'admin' ? 'text-zinc-400' : 'opacity-80'}`}>Aktivni projekti</p>
          <p className="text-4xl font-bold">{activeProjects.length}</p>
        </Card>
      </div>

      {googleTokens && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Google Kalendar</p>
              <CalendarDays size={16} style={{ color: brandColor }} />
            </div>
            <div className="space-y-3">
              {calendarLoading ? (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Loader2 className="animate-spin" size={14} /> Učitavanje...
                </div>
              ) : calendarEvents.length > 0 ? (
                calendarEvents.slice(0, 2).map((event: any) => (
                  <div key={event.id} className="flex items-start gap-3 group">
                    <div className="w-1 h-8 rounded-full mt-1" style={{ backgroundColor: brandColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{event.summary}</p>
                      <p className="text-[10px] text-zinc-500">
                        {event.start.dateTime ? safeFormatDate(event.start.dateTime, 'HH:mm') : 'Cijeli dan'}
                      </p>
                    </div>
                    <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink size={14} className="text-zinc-400 hover:text-accent" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">Nema zakazanih radova.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Section */}
      {chartData.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Analitika rada</h2>
          <Card className="p-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar
                    name="Sati rada"
                    dataKey="hours"
                    fill={brandColor}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    name="Broj unosa"
                    dataKey="entries"
                    fill={brandColor + '40'}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nedavni projekti</h2>
          <Button variant="ghost" className="text-sm">Vidi sve</Button>
        </div>
        <div className="space-y-3">
          {activeProjects.slice(0, 3).map((p: Project) => (
            <Card key={p.id} onClick={() => onProjectClick(p)} className="flex items-center justify-between cursor-pointer hover:border-zinc-300 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="text-zinc-400" size={20} />
                </div>
                <div>
                  <h3 className="font-bold">{p.projectName}</h3>
                  <p className="text-xs text-zinc-500">{p.clientName}</p>
                </div>
              </div>
              <ChevronRight className="text-zinc-300" size={20} />
            </Card>
          ))}
          {activeProjects.length === 0 && (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <p className="text-zinc-400">Još nema aktivnih projekata.</p>
            </div>
          )}
        </div>
      </section>

      <Button onClick={onNewEntry} className="w-full py-4 md:hidden">
        <Plus size={20} /> Novi dnevni unos
      </Button>
    </div>
  );
}

export default DashboardView;
