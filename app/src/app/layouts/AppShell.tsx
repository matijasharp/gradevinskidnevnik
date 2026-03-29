import { cn } from '../../lib/utils';
import { Button } from '../../shared/ui';
import { signOut } from '../../lib/supabaseAuth';
import {
  LayoutDashboard, Folder, CalendarDays, FileText, Layers,
  Users, Building2, Zap, LogOut, Plus, User as UserIcon
} from 'lucide-react';

function NavItem({ active, onClick, icon, label, brandColor }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
        active
          ? 'text-white shadow-lg'
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      )}
      style={active ? { backgroundColor: brandColor || '#3b82f6', boxShadow: `0 10px 15px -3px ${(brandColor || '#3b82f6')}33` } : {}}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, brandColor }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-2 rounded-xl transition-all',
        active ? 'shadow-sm' : 'text-zinc-400'
      )}
      style={active ? { color: brandColor || '#3b82f6', backgroundColor: `${brandColor || '#3b82f6'}10` } : {}}
    >
      {icon}
    </button>
  );
}

export default function AppShell({ view, setView, company, appUser, children }: any) {
  const brandColor = company?.brandColor || '#3b82f6';
  return (
    <div
      className="min-h-screen bg-zinc-50 pb-24 md:pb-0 md:pl-64"
      style={{ '--color-accent': brandColor } as any}
    >
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-primary text-white border-r border-slate-800 h-screen fixed left-0 top-0 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 overflow-hidden">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Zap className="text-white w-5 h-5 fill-white" />
            )}
          </div>
          <span className="font-bold text-xl tracking-tight">Site Diary</span>
        </div>
        <nav className="space-y-2 flex-1">
          <NavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label="Nadzorna ploča" brandColor={brandColor} />
          <NavItem active={view === 'projects'} onClick={() => setView('projects')} icon={<Folder size={20} />} label="Projekti" brandColor={brandColor} />
          <NavItem active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarDays size={20} />} label="Kalendar" brandColor={brandColor} />
          <NavItem active={view === 'reports'} onClick={() => setView('reports')} icon={<FileText size={20} />} label="Izvještaji" brandColor={brandColor} />
          <NavItem active={view === 'master-workspace'} onClick={() => setView('master-workspace')} icon={<Layers size={20} />} label="Master projekti" brandColor={brandColor} />
          {appUser?.role === 'admin' && (
            <NavItem active={view === 'users'} onClick={() => setView('users')} icon={<Users size={20} />} label="Korisnici" brandColor={brandColor} />
          )}
          {appUser?.role === 'admin' && (
            <NavItem active={view === 'company-settings'} onClick={() => setView('company-settings')} icon={<Building2 size={20} />} label="Postavke tvrtke" brandColor={brandColor} />
          )}
        </nav>
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
              <UserIcon size={16} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{appUser?.name}</p>
              <p className="text-xs text-slate-400 truncate">{company?.name}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-400/10" onClick={signOut}>
            <LogOut size={18} /> Odjava
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        {children}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavItem active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={24} />} brandColor={brandColor} />
        <MobileNavItem active={view === 'projects'} onClick={() => setView('projects')} icon={<Folder size={24} />} brandColor={brandColor} />
        <button
          onClick={() => setView('new-entry')}
          className="w-14 h-14 rounded-full flex items-center justify-center -mt-10 shadow-lg text-white active:scale-90 transition-transform border-4 border-white"
          style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` }}
        >
          <Plus size={28} />
        </button>
        <MobileNavItem active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarDays size={24} />} brandColor={brandColor} />
        <MobileNavItem active={view === 'reports'} onClick={() => setView('reports')} icon={<FileText size={24} />} brandColor={brandColor} />
      </nav>
    </div>
  );
}
