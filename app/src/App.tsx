/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Camera, 
  Mic, 
  FileText, 
  Folder, 
  ChevronRight, 
  LogOut, 
  LayoutDashboard, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  Download,
  Share2,
  User as UserIcon,
  Building2,
  MapPin,
  Briefcase,
  History,
  X,
  Edit2,
  Calendar,
  CalendarDays,
  ExternalLink,
  Settings,
  Zap,
  CloudSun,
  Bell,
  Search,
  Users,
  UserPlus,
  Mail,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { signInWithGoogle, signInWithEmail, getSession, onAuthStateChange } from './lib/supabaseAuth';
import {
  subscribeProjects,
  subscribeDiaryEntries,
  subscribeCompanyUsers,
  subscribeDiaryPhotos,
  fetchDiaryPhotos,
  fetchProjectPhotos,
  fetchProfileByUserId,
  fetchOrganizationById,
  fetchInvitationByEmail,
  acceptInvitation,
  createOrganizationWithOwner,
  createInvitation,
  updateProfileRole,
  removeOrganizationMember,
  updateOrganization,
  updateProfileTokens,
  updateDiaryEntryReminder,
  createProject as createProjectRecord,
  updateProject,
  deleteProject as deleteProjectRecord,
  createDiaryEntry,
  updateDiaryEntry,
  createDiaryPhoto,
  uploadDiaryPhoto,
  updateDiaryPhoto,
  deleteDiaryPhoto,
  subscribePendingInvitations,
  cancelInvitation as cancelInvitationRecord,
  fetchProjectInvitationByEmail,
  acceptProjectInvitation,
  fetchProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateProjectMemberRole,
  fetchProjectInvitations,
  createProjectInvitation,
  cancelProjectInvitation,
  fetchSharedProjects,
  fetchProjectTasks,
  createProjectTask,
  toggleProjectTask,
  deleteProjectTask,
  fetchProjectDocuments,
  uploadProjectDocument,
  deleteProjectDocument,
  fetchMasterProjects,
  fetchMasterProjectOrganizations,
  createMasterProject,
  linkOrganizationToMasterProject,
  fetchMasterProjectStats,
  fetchMasterRecentActivity,
  searchOrganizations,
  fetchMasterProjectIssues,
  createMasterProjectIssue,
  updateMasterProjectIssueStatus
} from './lib/data';
import type { Invitation, ProjectMember, ProjectInvitation, ProjectTask, ProjectDocument, MasterProject, MasterProjectOrganization, MasterProjectStats, MasterActivityItem, MasterProjectIssue } from './lib/data';
import type { Company, AppUser, Project, DiaryEntry, DiaryPhoto, GoogleTokens, CalendarEvent } from './shared/types';
import { safeFormatDate, stripMarkdown } from './shared/utils/format';
import { trimCanvas, compressImage } from './shared/utils/image';
import { OperationType, setAuthContext, handleFirestoreError } from './shared/utils/error';
import { cn } from './lib/utils';
import { Button, Card, Input, Select, StatusBadge } from './shared/ui';
import ErrorBoundary from './shared/components/ErrorBoundary';
import SecretsModal from './shared/components/SecretsModal';
import AppShell from './app/layouts/AppShell';
import LoginView from './features/auth/components/LoginView';
import UsersView from './features/users/components/UsersView';
import InviteUserModal from './features/organizations/components/InviteUserModal';
import CompanySettingsView from './features/organizations/components/CompanySettingsView';
import { generateDiaryPdf } from './integrations/pdf/generateDiaryPdf';
import DashboardView from './features/dashboard/components/DashboardView';
import ProjectsView from './features/projects/components/ProjectsView';
import NewProjectView from './features/projects/components/NewProjectView';
import CalendarView from './features/calendar/components/CalendarView';
import ReportsView from './features/reports/components/ReportsView';
import MasterProjectsListView from './features/masterProjects/components/MasterProjectsListView';
import MasterProjectDetailView from './features/masterProjects/components/MasterProjectDetailView';
import PhotoGallery from './features/diary/components/PhotoGallery';
import DiaryEntryDetailModal from './features/diary/components/DiaryEntryDetailModal';
import ProjectMembersTab from './features/projects/components/ProjectMembersTab';
import ProjectTasksTab from './features/projects/components/ProjectTasksTab';
import ProjectDocumentsTab from './features/projects/components/ProjectDocumentsTab';
import ProjectDetailView from './features/projects/components/ProjectDetailView';
import NewEntryView from './features/diary/components/NewEntryView';
import { getPhases, getWorkTypes, DISCIPLINE_LABELS, DISCIPLINE_SUBTITLES, detectDisciplineFromSubdomain, type Discipline } from './lib/disciplineConfig';
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
  endOfDay
} from 'date-fns';
import { hr } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Markdown from 'react-markdown';
import SignatureCanvas from 'react-signature-canvas';

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'projects' | 'new-entry' | 'edit-entry' | 'project-detail' | 'reports' | 'users' | 'company-settings' | 'calendar' | 'master-workspace'>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [companyUsers, setCompanyUsers] = useState<AppUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [emailLogin, setEmailLogin] = useState({ email: '', password: '', error: '', loading: false });
  const [showPassword, setShowPassword] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [contextDiscipline] = useState<Discipline>(() => detectDisciplineFromSubdomain());
  const [onboardingDiscipline, setOnboardingDiscipline] = useState<Discipline>(() => detectDisciplineFromSubdomain());
  const [googleTokens, setGoogleTokens] = useState<GoogleTokens | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [showSecretsModal, setShowSecretsModal] = useState(false);
  const [activeReminder, setActiveReminder] = useState<DiaryEntry | null>(null);
  const [materialHistory, setMaterialHistory] = useState<string[]>([]);
  const [materialUnits, setMaterialUnits] = useState<Record<string, string>>({});
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [isSharedProject, setIsSharedProject] = useState(false);
  const [masterProjects, setMasterProjects] = useState<MasterProject[]>([]);
  const [selectedMasterProject, setSelectedMasterProject] = useState<MasterProject | null>(null);
  const [masterProjectOrgs, setMasterProjectOrgs] = useState<MasterProjectOrganization[]>([]);
  const [masterProjectStats, setMasterProjectStats] = useState<MasterProjectStats[]>([]);
  const [masterRecentActivity, setMasterRecentActivity] = useState<MasterActivityItem[]>([]);
  const [masterProjectIssues, setMasterProjectIssues] = useState<MasterProjectIssue[]>([]);
  const [showNewMasterProjectModal, setShowNewMasterProjectModal] = useState(false);
  const [showAddOrgModal, setShowAddOrgModal] = useState(false);
  const [addOrgQuery, setAddOrgQuery] = useState('');
  const [addOrgResults, setAddOrgResults] = useState<Company[]>([]);
  const [addOrgSelected, setAddOrgSelected] = useState<Company | null>(null);
  const [addOrgDiscipline, setAddOrgDiscipline] = useState<'electro' | 'water' | 'klima'>('electro');
  const [addOrgRole, setAddOrgRole] = useState<'lead' | 'contributor' | 'viewer'>('contributor');
  const [addOrgLoading, setAddOrgLoading] = useState(false);
  const [newMasterProjectName, setNewMasterProjectName] = useState('');
  const [newMasterProjectDescription, setNewMasterProjectDescription] = useState('');
  const [newMasterProjectLocation, setNewMasterProjectLocation] = useState('');

  // --- Reminder Checker ---

  useEffect(() => {
    if (!entries.length || !appUser) return;

    const checkReminders = () => {
      const now = new Date();
      const dueReminder = entries.find(e => 
        e.reminderAt && 
        !e.reminderNotified && 
        new Date(e.reminderAt) <= now
      );

      if (dueReminder) {
        setActiveReminder(dueReminder);
        // Mark as notified in DB to prevent repeated alerts
        updateDiaryEntryReminder(dueReminder.id, true)
          .catch(err => console.error("Failed to update reminder status:", err));
      }
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    checkReminders(); // Initial check

    return () => clearInterval(interval);
  }, [entries, appUser]);

  useEffect(() => {
    if (!entries.length) return;
    const allItems = entries.flatMap(e => e.lineItems || []);
    const historyMap = new Map<string, string>();
    allItems.forEach(item => {
      if (item.name && !historyMap.has(item.name)) {
        historyMap.set(item.name, item.unit);
      }
    });
    setMaterialHistory(Array.from(historyMap.keys()));
    setMaterialUnits(Object.fromEntries(historyMap));
  }, [entries]);

  // --- Auth & Initial Data ---

  useEffect(() => {
    let active = true;

    const resolveUser = async (authUser: SupabaseUser | null) => {
      if (!active) return;
      setLoading(true);
      setUser(authUser);
      setAuthContext(authUser);

      if (!authUser) {
        setAppUser(null);
        setCompany(null);
        setGoogleTokens(null);
        setShowOnboarding(false);
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchProfileByUserId(authUser.id);
        if (profile && profile.companyId) {
          const org = await fetchOrganizationById(profile.companyId);
          setCompany(org);
          setAppUser(profile);
          setShowOnboarding(false);
          // Accept any pending cross-org project invitation
          if (authUser.email) {
            const projectInvite = await fetchProjectInvitationByEmail(authUser.email).catch(() => null);
            if (projectInvite) {
              await acceptProjectInvitation({ invitation: projectInvite, userId: authUser.id }).catch(() => null);
            }
          }
        } else if (authUser.email) {
          const invite = await fetchInvitationByEmail(authUser.email);
          if (invite) {
            const displayName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email;
            const { profile: invitedProfile, company } = await acceptInvitation({
              userId: authUser.id,
              email: authUser.email,
              name: displayName,
              invitation: invite
            });
            setAppUser(invitedProfile);
            setCompany(company);
            setShowOnboarding(false);
          } else {
            // Check for cross-org project invitation even without org membership
            const projectInvite = await fetchProjectInvitationByEmail(authUser.email).catch(() => null);
            if (projectInvite) {
              await acceptProjectInvitation({ invitation: projectInvite, userId: authUser.id }).catch(() => null);
            }
            setShowOnboarding(true);
          }
        } else {
          setShowOnboarding(true);
        }
      } catch (error: any) {
        console.error('resolveUser error:', error);
        setShowOnboarding(true);
      }

      setLoading(false);
    };

    getSession()
      .then(({ data }) => resolveUser(data.session?.user ?? null))
      .catch((error) => {
        console.error('session error:', error);
        setLoading(false);
      });

    const { data } = onAuthStateChange((_event, _session, authUser) => {
      resolveUser(authUser);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  // --- Real-time Listeners ---

  useEffect(() => {
    if (!appUser) return;

    const unsubscribe = subscribeProjects(
      appUser.companyId,
      setProjects,
      (error) => handleFirestoreError(error, OperationType.LIST, 'projects')
    );

    return unsubscribe;
  }, [appUser]);

  useEffect(() => {
    if (!appUser) return;
    fetchSharedProjects(appUser.id, appUser.companyId)
      .then(setSharedProjects)
      .catch(() => null);
    fetchMasterProjects(appUser.companyId)
      .then(setMasterProjects)
      .catch(() => null);
  }, [appUser]);

  useEffect(() => {
    if (!appUser) return;

    const unsubscribe = subscribeDiaryEntries(
      appUser.companyId,
      setEntries,
      (error) => handleFirestoreError(error, OperationType.LIST, 'diaryEntries')
    );

    return unsubscribe;
  }, [appUser]);

  useEffect(() => {
    if (!appUser || appUser.role !== 'admin') return;

    const unsubUsers = subscribeCompanyUsers(
      appUser.companyId,
      setCompanyUsers,
      (error) => handleFirestoreError(error, OperationType.LIST, 'users')
    );

    const unsubInvites = subscribePendingInvitations(
      appUser.companyId,
      setPendingInvitations,
      () => null
    );

    return () => {
      unsubUsers();
      unsubInvites();
    };
  }, [appUser]);

  // --- Actions ---

  const inviteUser = async (email: string, name: string, role: 'admin' | 'worker') => {
    if (!appUser) return;
    try {
      await createInvitation({
        organizationId: appUser.companyId,
        email,
        name,
        role,
        createdBy: appUser.id
      });
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          role,
          organizationName: company?.name ?? '',
          inviterName: appUser.name,
          appUrl: window.location.origin
        })
      });
      setShowInviteModal(false);
      alert(`Pozivnica je uspješno poslana na ${email}. Korisnik će biti dodan u tim nakon što se prijavi.`);
    } catch (error) {
      console.error('Invite error:', error);
      alert('Greška pri slanju pozivnice. Pokušajte ponovno.');
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      await cancelInvitationRecord(invitationId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'invitations');
    }
  };

  const updateRole = async (userId: string, newRole: 'admin' | 'worker') => {
    try {
      if (!appUser) return;
      await updateProfileRole({
        userId,
        organizationId: appUser.companyId,
        role: newRole
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Jeste li sigurni da želite ukloniti ovog korisnika?')) return;
    try {
      if (!appUser) return;
      await removeOrganizationMember({
        userId,
        organizationId: appUser.companyId
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user');
      } else {
        console.error('Login error:', error);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLogin(prev => ({ ...prev, loading: true, error: '' }));
    const { error } = await signInWithEmail(emailLogin.email, emailLogin.password);
    if (error) {
      setEmailLogin(prev => ({ ...prev, loading: false, error: 'Pogrešan email ili lozinka.' }));
    } else {
      setEmailLogin(prev => ({ ...prev, loading: false }));
    }
  };

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

  useEffect(() => {
    if (appUser?.googleTokens) {
      setGoogleTokens(appUser.googleTokens);
      fetchCalendarEvents(appUser.googleTokens);
    }
  }, [appUser]);

  const fetchCalendarEvents = async (tokens: GoogleTokens) => {
    setCalendarLoading(true);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens })
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

  const addToCalendar = async (entry: DiaryEntry) => {
    if (!googleTokens) return;
    
    const entryDate = new Date(entry.entryDate);
    if (isNaN(entryDate.getTime())) {
      alert('Nevažeći datum unosa.');
      return;
    }

    const event = {
      summary: `Site Diary: ${entry.title}`,
      description: `Projekt: ${selectedProject?.projectName}\nOpis: ${entry.description}\nStatus: ${entry.status}`,
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
        body: JSON.stringify({ tokens: googleTokens, event })
      });
      if (response.ok) {
        alert('Događaj uspješno dodan u Google kalendar!');
        fetchCalendarEvents(googleTokens);
        setSelectedEntry(null);
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
    }
  };
  const handleOnboarding = async () => {
    if (!user || !newCompanyName) return;
    setLoading(true);
    try {
      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User';
      const { company: newCompany, profile } = await createOrganizationWithOwner({
        organizationName: newCompanyName,
        ownerUserId: user.id,
        ownerEmail: user.email,
        ownerName: displayName,
        discipline: onboardingDiscipline
      });

      setAppUser(profile);
      setCompany(newCompany);
      setShowOnboarding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'onboarding');
    }
    setLoading(false);
  };

  const createProject = async (data: any) => {
    if (!appUser) return;
    try {
      await createProjectRecord(appUser.companyId, {
        ...data,
        companyId: appUser.companyId,
        status: 'active'
      } as Project);
      setView('projects');
    } catch (error) {
      console.error('Create project error:', error);
      alert('Greška pri kreiranju projekta. Pokušajte ponovno.');
    }
  };

  const completeProject = async (projectId: string) => {
    try {
      await updateProject(projectId, {
        status: 'completed',
        phase: 'Završeno'
      });
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, status: 'completed', phase: 'Završeno' });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const updateProjectPhase = async (projectId: string, phase: Project['phase']) => {
    try {
      await updateProject(projectId, { phase });
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, phase });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await deleteProjectRecord(projectId);
      
      setView('projects');
      setSelectedProject(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    }
  };
  // --- Views ---

  if (loading || !user || showOnboarding) {
    return (
      <LoginView
        loading={loading}
        contextDiscipline={contextDiscipline}
        emailLogin={emailLogin}
        setEmailLogin={setEmailLogin}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        handleEmailLogin={handleEmailLogin}
        showOnboarding={showOnboarding}
        newCompanyName={newCompanyName}
        setNewCompanyName={setNewCompanyName}
        onboardingDiscipline={onboardingDiscipline}
        setOnboardingDiscipline={setOnboardingDiscipline}
        handleOnboarding={handleOnboarding}
      />
    );
  }

  const handleAddOrgSearch = async (q: string) => {
    setAddOrgQuery(q);
    setAddOrgSelected(null);
    if (q.trim().length < 2) { setAddOrgResults([]); return; }
    const results = await searchOrganizations(q);
    const linkedIds = new Set(masterProjectOrgs.map(o => o.organizationId));
    setAddOrgResults(results.filter(r => !linkedIds.has(r.id)));
  };

  const handleCreateIssue = async (params: { title: string; priority: 'low' | 'medium' | 'high'; discipline?: string }) => {
    if (!selectedMasterProject || !appUser) return;
    await createMasterProjectIssue({ masterProjectId: selectedMasterProject.id, reportedBy: appUser.id, ...params });
    const updated = await fetchMasterProjectIssues(selectedMasterProject.id);
    setMasterProjectIssues(updated);
  };

  const handleUpdateIssueStatus = async (issueId: string, status: MasterProjectIssue['status']) => {
    await updateMasterProjectIssueStatus(issueId, status);
    setMasterProjectIssues(prev => prev.map(i => i.id === issueId ? { ...i, status } : i));
  };

  return (
    <>
      <AppShell view={view} setView={setView} company={company} appUser={appUser}>
        {view === 'dashboard' && appUser && (
            <DashboardView 
              appUser={appUser} 
              projects={projects} 
              entries={entries}
              onProjectClick={(p: Project) => { setSelectedProject(p); setView('project-detail'); }}
              onNewEntry={() => setView('new-entry')}
              onUsersClick={() => setView('users')}
              onSettingsClick={() => setView('company-settings')}
              googleTokens={googleTokens}
              calendarEvents={calendarEvents}
              calendarLoading={calendarLoading}
              onConnectCalendar={connectGoogleCalendar}
              onOpenSecrets={() => setShowSecretsModal(true)}
              company={company}
            />
        )}
        {view === 'dashboard' && !appUser && (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
          </div>
        )}
        {view === 'projects' && (
          <ProjectsView
            projects={projects}
            sharedProjects={sharedProjects}
            onProjectClick={(p: Project) => { setSelectedProject(p); setIsSharedProject(false); setView('project-detail'); }}
            onSharedProjectClick={(p: Project) => { setSelectedProject(p); setIsSharedProject(true); setView('project-detail'); }}
            onCreateProject={() => setView('new-project' as any)}
            onNewEntry={() => setView('new-entry')}
            userRole={appUser?.role}
            company={company}
          />
        )}
        {view === 'new-project' as any && (
          <NewProjectView onCancel={() => setView('projects')} onSubmit={createProject} company={company} />
        )}
        {view === 'project-detail' && selectedProject && (
          <ProjectDetailView
            project={selectedProject}
            entries={entries.filter(e => e.projectId === selectedProject.id).sort((a, b) => b.entryDate.localeCompare(a.entryDate))}
            onBack={() => setView('projects')}
            onNewEntry={() => setView('new-entry')}
            onEntryClick={setSelectedEntry}
            onGeneratePDF={async () => await generateDiaryPdf(selectedProject, entries.filter(e => e.projectId === selectedProject.id), company)}
            onAddToCalendar={addToCalendar}
            onCompleteProject={() => completeProject(selectedProject.id)}
            onUpdatePhase={(phase: Project['phase']) => updateProjectPhase(selectedProject.id, phase)}
            onDeleteProject={() => deleteProject(selectedProject.id)}
            hasCalendar={!!googleTokens}
            userRole={appUser?.role}
            appUser={appUser}
            company={company}
            readonly={isSharedProject}
            companyUsers={companyUsers}
          />
        )}
        {view === 'new-entry' && (
          <NewEntryView
            appUser={appUser!}
            projects={projects}
            initialProject={selectedProject}
            materialHistory={materialHistory}
            materialUnits={materialUnits}
            company={company}
            onCancel={() => setView(selectedProject ? 'project-detail' : 'dashboard')}
            onSuccess={() => setView(selectedProject ? 'project-detail' : 'dashboard')}
          />
        )}
        {view === 'edit-entry' && editingEntry && (
          <NewEntryView
            appUser={appUser!}
            projects={projects}
            initialProject={projects.find(p => p.id === editingEntry.projectId)}
            initialEntry={editingEntry}
            materialHistory={materialHistory}
            materialUnits={materialUnits}
            company={company}
            onCancel={() => { setEditingEntry(null); setView(selectedProject ? 'project-detail' : 'dashboard'); }}
            onSuccess={() => { setEditingEntry(null); setView(selectedProject ? 'project-detail' : 'dashboard'); }}
          />
        )}
        {view === 'reports' && (
          <ReportsView projects={projects} entries={entries} company={company} />
        )}
        {view === 'calendar' && (
          <CalendarView 
            projects={projects} 
            entries={entries} 
            googleEvents={calendarEvents}
            onConnectGoogle={connectGoogleCalendar}
            isConnected={!!googleTokens}
            company={company}
          />
        )}

        {view === 'users' && appUser?.role === 'admin' && (
          <UsersView
            users={companyUsers}
            pendingInvitations={pendingInvitations}
            onInviteUser={() => setShowInviteModal(true)}
            onUpdateRole={updateRole}
            onDeleteUser={deleteUser}
            onCancelInvitation={cancelInvitation}
            currentUser={appUser}
          />
        )}

        {view === 'company-settings' && appUser?.role === 'admin' && company && (
          <CompanySettingsView
            company={company}
            onUpdate={(data: any) => {
              setCompany({ ...company, ...data });
              updateOrganization(company.id, data).catch((error) =>
                handleFirestoreError(error, OperationType.UPDATE, `organizations/${company.id}`)
              );
            }}
          />
        )}

        {view === 'master-workspace' && appUser && company && (
          selectedMasterProject ? (
            <>
            <MasterProjectDetailView
              masterProject={selectedMasterProject}
              orgs={masterProjectOrgs}
              stats={masterProjectStats}
              activity={masterRecentActivity}
              issues={masterProjectIssues}
              ownerOrgId={selectedMasterProject.ownerOrganizationId}
              currentOrgId={appUser.companyId}
              onAddOrg={() => setShowAddOrgModal(true)}
              onCreateIssue={handleCreateIssue}
              onUpdateIssueStatus={handleUpdateIssueStatus}
              brandColor={company.brandColor}
              onBack={() => { setSelectedMasterProject(null); setMasterProjectOrgs([]); setMasterProjectStats([]); setMasterRecentActivity([]); setMasterProjectIssues([]); setShowAddOrgModal(false); setAddOrgQuery(''); setAddOrgResults([]); setAddOrgSelected(null); }}
            />
            {showAddOrgModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">Dodaj organizaciju</h2>
                  {!addOrgSelected ? (
                    <div className="space-y-3">
                      <input
                        className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Pretraži po nazivu organizacije..."
                        value={addOrgQuery}
                        onChange={e => handleAddOrgSearch(e.target.value)}
                        autoFocus
                      />
                      {addOrgResults.length > 0 && (
                        <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100">
                          {addOrgResults.map(org => (
                            <button
                              key={org.id}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 transition-colors"
                              onClick={() => setAddOrgSelected(org)}
                            >
                              <span className="font-medium text-zinc-800">{org.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {addOrgQuery.trim().length >= 2 && addOrgResults.length === 0 && (
                        <p className="text-sm text-zinc-400 text-center py-3">Nema rezultata.</p>
                      )}
                      <div className="pt-1">
                        <button
                          className="w-full rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          onClick={() => { setShowAddOrgModal(false); setAddOrgQuery(''); setAddOrgResults([]); setAddOrgSelected(null); }}
                        >
                          Odustani
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-zinc-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-800">{addOrgSelected.name}</span>
                        <button className="text-xs text-zinc-400 hover:text-zinc-600" onClick={() => setAddOrgSelected(null)}>Promijeni</button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Disciplina</label>
                        <select
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={addOrgDiscipline}
                          onChange={e => setAddOrgDiscipline(e.target.value as 'electro' | 'water' | 'klima')}
                        >
                          <option value="electro">⚡ Elektro</option>
                          <option value="water">💧 Voda</option>
                          <option value="klima">❄️ Klima</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Uloga</label>
                        <select
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={addOrgRole}
                          onChange={e => setAddOrgRole(e.target.value as 'lead' | 'contributor' | 'viewer')}
                        >
                          <option value="lead">Voditelj</option>
                          <option value="contributor">Suradnik</option>
                          <option value="viewer">Promatrač</option>
                        </select>
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          onClick={() => { setShowAddOrgModal(false); setAddOrgQuery(''); setAddOrgResults([]); setAddOrgSelected(null); }}
                        >
                          Odustani
                        </button>
                        <button
                          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                          style={{ backgroundColor: company.brandColor || '#3b82f6' }}
                          disabled={addOrgLoading}
                          onClick={async () => {
                            if (!addOrgSelected || !selectedMasterProject) return;
                            setAddOrgLoading(true);
                            try {
                              await linkOrganizationToMasterProject({
                                masterProjectId: selectedMasterProject.id,
                                organizationId: addOrgSelected.id,
                                discipline: addOrgDiscipline,
                                role: addOrgRole,
                              });
                              const updated = await fetchMasterProjectOrganizations(selectedMasterProject.id);
                              setMasterProjectOrgs(updated);
                              const ids = updated.map(o => o.linkedProjectId).filter(Boolean) as string[];
                              if (ids.length > 0) {
                                fetchMasterProjectStats(ids).then(setMasterProjectStats).catch(() => null);
                                fetchMasterRecentActivity(ids).then(setMasterRecentActivity).catch(() => null);
                              }
                              setShowAddOrgModal(false);
                              setAddOrgQuery('');
                              setAddOrgResults([]);
                              setAddOrgSelected(null);
                            } finally {
                              setAddOrgLoading(false);
                            }
                          }}
                        >
                          {addOrgLoading ? 'Dodavanje...' : 'Dodaj'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </>
          ) : (
            <>
              <MasterProjectsListView
                masterProjects={masterProjects}
                brandColor={company.brandColor}
                onSelect={(mp: MasterProject) => {
                  setSelectedMasterProject(mp);
                  fetchMasterProjectOrganizations(mp.id)
                    .then(orgs => {
                      setMasterProjectOrgs(orgs);
                      const ids = orgs.map(o => o.linkedProjectId).filter(Boolean) as string[];
                      if (ids.length > 0) {
                        fetchMasterProjectStats(ids).then(setMasterProjectStats).catch(() => null);
                        fetchMasterRecentActivity(ids).then(setMasterRecentActivity).catch(() => null);
                      }
                    })
                    .catch(() => null);
                  fetchMasterProjectIssues(mp.id).then(setMasterProjectIssues).catch(() => null);
                }}
                onCreateNew={() => setShowNewMasterProjectModal(true)}
              />
              {showNewMasterProjectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">Novi master projekt</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Naziv *</label>
                        <input
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Npr. Stambeni kompleks A1"
                          value={newMasterProjectName}
                          onChange={e => setNewMasterProjectName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Opis</label>
                        <textarea
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                          placeholder="Kratki opis projekta"
                          value={newMasterProjectDescription}
                          onChange={e => setNewMasterProjectDescription(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">Lokacija</label>
                        <input
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Npr. Zagreb, Ulica bb"
                          value={newMasterProjectLocation}
                          onChange={e => setNewMasterProjectLocation(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        className="flex-1 border border-zinc-200 rounded-xl py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                        onClick={() => {
                          setShowNewMasterProjectModal(false);
                          setNewMasterProjectName('');
                          setNewMasterProjectDescription('');
                          setNewMasterProjectLocation('');
                        }}
                      >
                        Odustani
                      </button>
                      <button
                        className="flex-[2] rounded-xl py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: company.brandColor || '#3b82f6' }}
                        disabled={!newMasterProjectName.trim()}
                        onClick={async () => {
                          if (!newMasterProjectName.trim()) return;
                          try {
                            await createMasterProject({
                              name: newMasterProjectName.trim(),
                              description: newMasterProjectDescription.trim() || undefined,
                              location: newMasterProjectLocation.trim() || undefined,
                              ownerOrganizationId: company.id,
                              createdBy: appUser.id,
                            });
                            const updated = await fetchMasterProjects(company.id);
                            setMasterProjects(updated);
                            setShowNewMasterProjectModal(false);
                            setNewMasterProjectName('');
                            setNewMasterProjectDescription('');
                            setNewMasterProjectLocation('');
                          } catch (e) {
                            console.error('Failed to create master project:', e);
                          }
                        }}
                      >
                        Kreiraj
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {selectedEntry && selectedProject && (
          <DiaryEntryDetailModal 
            entry={selectedEntry} 
            project={selectedProject} 
            onClose={() => setSelectedEntry(null)} 
            onEdit={(e) => {
              setEditingEntry(e);
              setSelectedEntry(null);
              setView('edit-entry');
            }}
            onAddToCalendar={addToCalendar}
            hasCalendar={!!googleTokens}
            company={company}
          />
        )}
      </AppShell>

      {/* Secrets Modal */}
      {showSecretsModal && (
        <SecretsModal onClose={() => setShowSecretsModal(false)} />
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal 
          onClose={() => setShowInviteModal(false)} 
          onSubmit={inviteUser} 
          company={company}
        />
      )}

      {/* Reminder Modal */}
      {activeReminder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 border-t-8"
            style={{ borderTopColor: company?.brandColor || '#3b82f6' }}
          >
            <div className="flex items-center gap-4 text-accent">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Bell size={24} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">Podsjetnik!</h2>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Dnevnički zapis</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-lg">{activeReminder.title}</h3>
              <p className="text-sm text-zinc-500 line-clamp-3 italic">"{activeReminder.description}"</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setActiveReminder(null)}
              >
                Zatvori
              </Button>
              <Button 
                className="flex-1 text-white" 
                style={{ backgroundColor: company?.brandColor || '#3b82f6' }}
                onClick={() => {
                  const project = projects.find(p => p.id === activeReminder.projectId);
                  if (project) {
                    setSelectedProject(project);
                    setSelectedEntry(activeReminder);
                    setView('project-detail');
                  }
                  setActiveReminder(null);
                }}
              >
                Vidi detalje
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
