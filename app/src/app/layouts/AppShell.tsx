import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../router/routeConfig';
import { cn } from '../../lib/utils';
import { Button } from '../../shared/ui';
import { signOut } from '../../lib/supabaseAuth';
import { useOrg } from '../providers';
import { LogOut, Plus, User as UserIcon, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';

function NavItem({ active, onClick, icon, label, expanded = true }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center rounded transition-all',
        expanded ? 'gap-3 px-4 py-3' : 'justify-center px-2 py-3',
        active
          ? 'border-l-2 border-accent bg-accent-subtle text-text-primary'
          : 'border-l-2 border-transparent text-text-secondary hover:text-text-primary hover:bg-surface'
      )}
    >
      {icon}
      {expanded && <span className="font-medium tracking-wide whitespace-nowrap">{label}</span>}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label, brandColor }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all',
        active ? 'shadow-sm' : 'text-zinc-400'
      )}
      style={active ? { color: brandColor || '#3ab9e3', backgroundColor: `${brandColor || '#3ab9e3'}10` } : {}}
    >
      {icon}
      <span className="text-[10px] font-medium tracking-wide leading-none">{label}</span>
    </button>
  );
}

export default function AppShell({ company, appUser, children }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const { masterProjects } = useOrg();
  const brandColor = company?.brandColor || '#3ab9e3';
  const showMasterNav = company?.discipline === 'general' || masterProjects.length > 0;
  const [sidebarExpanded, setSidebarExpanded] = useState(() =>
    localStorage.getItem('gdo-sidebar-expanded') !== 'false'
  );
  const toggleSidebar = () => {
    setSidebarExpanded(v => {
      localStorage.setItem('gdo-sidebar-expanded', String(!v));
      return !v;
    });
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-surface pb-24 md:pb-0 transition-all duration-200',
        sidebarExpanded ? 'md:pl-60' : 'md:pl-16'
      )}
      style={{ '--color-accent': brandColor } as any}
    >
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-100 px-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <img src="/brand/logo.svg" alt="GDO" className="w-4 h-4" />
            )}
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900">Građevinski Dnevnik</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(ROUTES.USERS)}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors overflow-hidden',
              location.pathname === ROUTES.USERS ? 'bg-accent/10' : 'hover:bg-zinc-100'
            )}
            style={location.pathname === ROUTES.USERS ? { color: brandColor } : { color: '#94a3b8' }}
          >
            {appUser?.avatarUrl ? (
              <img src={appUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={18} />
            )}
          </button>
          <button
            onClick={signOut}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={cn(
        'hidden md:flex flex-col bg-white border-r border-border h-screen fixed left-0 top-0 transition-all duration-200',
        sidebarExpanded ? 'w-60 p-6' : 'w-16 p-3'
      )}>
        <div className={cn('flex items-center mb-10', sidebarExpanded ? 'gap-3' : 'justify-center')}>
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 overflow-hidden shrink-0">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <img src="/brand/logo.svg" alt="GDO" className="w-6 h-6" />
            )}
          </div>
          {sidebarExpanded && <span className="font-bold text-base tracking-tight text-text-primary whitespace-nowrap">Građevinski Dnevnik</span>}
        </div>
        <nav className="space-y-2 flex-1">
          <NavItem active={location.pathname === ROUTES.DASHBOARD} onClick={() => navigate(ROUTES.DASHBOARD)} icon={<img src="/icons/nadzorna-ploca.svg" className="w-10 h-10 shrink-0" alt="" />} label="Nadzorna ploča" expanded={sidebarExpanded} />
          <NavItem active={location.pathname === ROUTES.PROJECTS} onClick={() => navigate(ROUTES.PROJECTS)} icon={<img src="/icons/projekt.svg" className="w-10 h-10 shrink-0" alt="" />} label="Projekti" expanded={sidebarExpanded} />
          <NavItem active={location.pathname === ROUTES.CALENDAR} onClick={() => navigate(ROUTES.CALENDAR)} icon={<img src="/icons/kalendar.svg" className="w-10 h-10 shrink-0" alt="" />} label="Kalendar" expanded={sidebarExpanded} />
          <NavItem active={location.pathname === ROUTES.REPORTS} onClick={() => navigate(ROUTES.REPORTS)} icon={<img src="/icons/izvjestaji.svg" className="w-10 h-10 shrink-0" alt="" />} label="Izvještaji" expanded={sidebarExpanded} />
          {showMasterNav && (
            <NavItem active={location.pathname === ROUTES.MASTER_WORKSPACE} onClick={() => navigate(ROUTES.MASTER_WORKSPACE)} icon={<img src="/icons/projekt.svg" className="w-10 h-10 shrink-0" alt="" />} label="Master projekti" expanded={sidebarExpanded} />
          )}
          {appUser?.role === 'admin' && (
            <NavItem active={location.pathname === ROUTES.COMPANY_SETTINGS} onClick={() => navigate(ROUTES.COMPANY_SETTINGS)} icon={<img src="/icons/tvrtka.svg" className="w-10 h-10 shrink-0" alt="" />} label="Postavke tvrtke" expanded={sidebarExpanded} />
          )}
          <NavItem active={location.pathname === ROUTES.BILLING} onClick={() => navigate(ROUTES.BILLING)} icon={<CreditCard size={20} className="shrink-0" />} label="Pretplata" expanded={sidebarExpanded} />
          {appUser?.isSuperAdmin && (
            <NavItem active={location.pathname === ROUTES.SUPER_ADMIN} onClick={() => navigate(ROUTES.SUPER_ADMIN)} icon={<img src="/icons/tvrtka.svg" className="w-10 h-10 shrink-0" alt="" />} label="Super Admin" expanded={sidebarExpanded} />
          )}
        </nav>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center p-2 mb-2 text-text-muted hover:text-text-primary hover:bg-surface rounded transition-colors self-end"
        >
          {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="pt-6 border-t border-border">
          <button
            onClick={() => navigate(ROUTES.USERS)}
            className={cn(
              'w-full flex items-center mb-4 p-2 rounded transition-colors text-left',
              sidebarExpanded ? 'gap-3' : 'justify-center',
              location.pathname === ROUTES.USERS ? 'bg-zinc-100' : 'hover:bg-surface'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              {appUser?.avatarUrl ? (
                <img src={appUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={16} className="text-slate-500" />
              )}
            </div>
            {sidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-text-primary">{appUser?.name}</p>
                <p className="text-xs text-text-secondary truncate">{company?.name}</p>
              </div>
            )}
          </button>
          <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-500 hover:bg-red-50" onClick={signOut}>
            <LogOut size={18} />{sidebarExpanded && ' Odjava'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4 pt-18 md:pt-6 md:px-8">
        {children}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavItem active={location.pathname === ROUTES.DASHBOARD} onClick={() => navigate(ROUTES.DASHBOARD)} icon={<img src="/icons/nadzorna-ploca.svg" className="w-8 h-8" alt="" />} label="Naslovna" brandColor={brandColor} />
        <MobileNavItem active={location.pathname === ROUTES.PROJECTS} onClick={() => navigate(ROUTES.PROJECTS)} icon={<img src="/icons/projekt.svg" className="w-8 h-8" alt="" />} label="Projekti" brandColor={brandColor} />
        <button
          onClick={() => navigate(ROUTES.NEW_ENTRY)}
          className="w-14 h-14 rounded-full flex items-center justify-center -mt-10 shadow-lg text-white active:scale-90 transition-transform border-4 border-white"
          style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` }}
        >
          <Plus size={28} />
        </button>
        <MobileNavItem active={location.pathname === ROUTES.CALENDAR} onClick={() => navigate(ROUTES.CALENDAR)} icon={<img src="/icons/kalendar.svg" className="w-8 h-8" alt="" />} label="Kalendar" brandColor={brandColor} />
        <MobileNavItem active={location.pathname === ROUTES.REPORTS} onClick={() => navigate(ROUTES.REPORTS)} icon={<img src="/icons/izvjestaji.svg" className="w-8 h-8" alt="" />} label="Izvještaji" brandColor={brandColor} />
      </nav>
    </div>
  );
}
