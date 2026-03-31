import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../router/routeConfig';
import { cn } from '../../lib/utils';
import { Button } from '../../shared/ui';
import { signOut } from '../../lib/supabaseAuth';
import { useOrg } from '../providers';
import { LogOut, Plus, User as UserIcon } from 'lucide-react';

function NavItem({ active, onClick, icon, label, brandColor }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
        active
          ? 'text-white shadow-lg'
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
      )}
      style={active ? { backgroundColor: brandColor || '#6366f1', boxShadow: `0 10px 15px -3px ${(brandColor || '#6366f1')}33` } : {}}
    >
      {icon}
      <span className="font-medium tracking-wide">{label}</span>
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
      style={active ? { color: brandColor || '#6366f1', backgroundColor: `${brandColor || '#6366f1'}10` } : {}}
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
  const brandColor = company?.brandColor || '#6366f1';
  const showMasterNav = company?.discipline === 'general' || masterProjects.length > 0;
  return (
    <div
      className="min-h-screen bg-zinc-50 pb-24 md:pb-0 md:pl-64"
      style={{ '--color-accent': brandColor } as any}
    >
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 overflow-hidden">
            {company?.logoUrl ? (
              <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <img src="/brand/logo.svg" alt="GDO" className="w-6 h-6" />
            )}
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">Građevinski Dnevnik</span>
        </div>
        <nav className="space-y-2 flex-1">
          <NavItem active={location.pathname === ROUTES.DASHBOARD} onClick={() => navigate(ROUTES.DASHBOARD)} icon={<img src="/icons/nadzorna-ploca.svg" className="w-10 h-10" alt="" />} label="Nadzorna ploča" brandColor={brandColor} />
          <NavItem active={location.pathname === ROUTES.PROJECTS} onClick={() => navigate(ROUTES.PROJECTS)} icon={<img src="/icons/projekt.svg" className="w-10 h-10" alt="" />} label="Projekti" brandColor={brandColor} />
          <NavItem active={location.pathname === ROUTES.CALENDAR} onClick={() => navigate(ROUTES.CALENDAR)} icon={<img src="/icons/kalendar.svg" className="w-10 h-10" alt="" />} label="Kalendar" brandColor={brandColor} />
          <NavItem active={location.pathname === ROUTES.REPORTS} onClick={() => navigate(ROUTES.REPORTS)} icon={<img src="/icons/izvjestaji.svg" className="w-10 h-10" alt="" />} label="Izvještaji" brandColor={brandColor} />
          {showMasterNav && (
            <NavItem active={location.pathname === ROUTES.MASTER_WORKSPACE} onClick={() => navigate(ROUTES.MASTER_WORKSPACE)} icon={<img src="/icons/projekt.svg" className="w-10 h-10" alt="" />} label="Master projekti" brandColor={brandColor} />
          )}
          {appUser?.role === 'admin' && (
            <NavItem active={location.pathname === ROUTES.USERS} onClick={() => navigate(ROUTES.USERS)} icon={<img src="/icons/tim.svg" className="w-10 h-10" alt="" />} label="Korisnici" brandColor={brandColor} />
          )}
          {appUser?.role === 'admin' && (
            <NavItem active={location.pathname === ROUTES.COMPANY_SETTINGS} onClick={() => navigate(ROUTES.COMPANY_SETTINGS)} icon={<img src="/icons/tvrtka.svg" className="w-10 h-10" alt="" />} label="Postavke tvrtke" brandColor={brandColor} />
          )}
        </nav>
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <UserIcon size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-900">{appUser?.name}</p>
              <p className="text-xs text-slate-500 truncate">{company?.name}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-500 hover:bg-red-50" onClick={signOut}>
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
