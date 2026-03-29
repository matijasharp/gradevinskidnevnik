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

  const generatePDF = async (project: Project, entries: DiaryEntry[]) => {
    const projectEntries = [...entries].sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    const doc = new jsPDF();
    
    // Load font for Croatian characters (Roboto supports UTF-8)
    try {
      const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
      const response = await fetch(fontUrl);
      const fontBuffer = await response.arrayBuffer();
      
      let binary = '';
      const bytes = new Uint8Array(fontBuffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const fontBase64 = window.btoa(binary);
      
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
    } catch (e) {
      console.error("Error loading font", e);
      doc.setFont('helvetica');
    }

    const companyName = company?.name || 'Site Diary Mini';
    
    // Helper to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ] : [59, 130, 246]; // Default blue
    };

    const primaryColor = hexToRgb(company?.brandColor || '#3b82f6');
    
    // Logo
    if (company?.logoUrl) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = company.logoUrl!;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        doc.addImage(dataURL, 'PNG', 170, 10, 25, 25);
      } catch (e) {
        console.warn("Could not add logo to PDF", e);
      }
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(companyName, 14, 22);
    
    // Company Info
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    let headerY = 27;
    if (company?.address) { doc.text(company.address, 14, headerY); headerY += 4; }
    if (company?.phone || company?.email) { 
      doc.text(`${company.phone || ''} ${company.phone && company.email ? '|' : ''} ${company.email || ''}`, 14, headerY); 
      headerY += 4; 
    }
    if (company?.website) { doc.text(company.website, 14, headerY); }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Izvještaj projekta: ${project.projectName}`, 14, 42);
    doc.text(`Klijent: ${project.clientName}`, 14, 47);
    doc.text(`Adresa: ${project.street}, ${project.city}`, 14, 52);
    doc.text(`Datum: ${safeFormatDate(new Date().toISOString(), 'dd.MM.yyyy')}`, 14, 57);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, 62, 196, 62);

    let y = 72;

    projectEntries.forEach((entry, index) => {
      if (y > 240) {
        doc.addPage();
        y = 20;
      }

      // Entry Header
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`${safeFormatDate(entry.entryDate, 'dd.MM.yyyy')} - ${entry.title}`, 14, y);
      y += 7;

      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      let headerText = `Vrsta posla: ${entry.workType} | Status: ${entry.status}`;
      if (entry.weatherCondition || entry.temperature) {
        headerText += ` | Vrijeme: ${entry.weatherCondition || '-'} (${entry.temperature || 0}°C)`;
      }
      doc.text(headerText, 14, y);
      y += 6;
      
      // Main Content (AI Summary)
      if (entry.aiSummary) {
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        const cleanSummary = stripMarkdown(entry.aiSummary);
        const splitSummary = doc.splitTextToSize(cleanSummary, 180);
        doc.text(splitSummary, 14, y);
        y += (splitSummary.length * 5) + 5;
      }

      // Line Items (Logically organized)
      if (entry.lineItems && entry.lineItems.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text("Izvršeni radovi / Stavke:", 14, y);
        y += 5;
        
        entry.lineItems.forEach(item => {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(`• ${item.name}: ${item.quantity} ${item.unit}`, 20, y);
          y += 5;
        });
        y += 5;
      } else {
        y += 5;
      }

      // Signature
      if (entry.signatureUrl) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("Potpis odgovorne osobe:", 14, y);
        y += 2;
        try {
          doc.addImage(entry.signatureUrl, 'PNG', 14, y, 40, 15);
          y += 18;
        } catch (e) {
          console.warn("Could not add signature to PDF", e);
          y += 5;
        }
      }
      
      // Separator between entries
      doc.setDrawColor(240, 240, 240);
      doc.line(14, y - 2, 196, y - 2);
      y += 5;
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Stranica ${i} od ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generirano putem Site Diary Mini`, 14, 290);
    }

    doc.save(`${project.projectName}_Izvjestaj.pdf`);
  };

  // --- Views ---

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        <p className="text-sm font-medium text-zinc-500">Učitavanje dnevnika...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent/10">
              <FileText className="text-white w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Site Diary Mini</h1>
            <p className="text-zinc-500">{DISCIPLINE_SUBTITLES[contextDiscipline]}</p>
          </div>
          <Button onClick={handleLogin} className="w-full py-4 text-lg">
            Prijavi se putem Google-a
          </Button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200" />
            <span className="text-xs text-zinc-400 font-medium">ili</span>
            <div className="flex-1 h-px bg-zinc-200" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3 text-left">
            <Input
              label="Email"
              type="email"
              placeholder="vas@email.com"
              value={emailLogin.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailLogin(prev => ({ ...prev, email: e.target.value }))}
              required
            />
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Lozinka</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={emailLogin.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailLogin(prev => ({ ...prev, password: e.target.value }))}
                  required
                  className="w-full px-4 py-3 pr-11 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/5 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {emailLogin.error && (
              <p className="text-sm text-red-500">{emailLogin.error}</p>
            )}
            <Button type="submit" variant="outline" className="w-full py-3" disabled={emailLogin.loading}>
              {emailLogin.loading ? <Loader2 className="animate-spin w-4 h-4 mx-auto" /> : 'Prijavi se emailom'}
            </Button>
          </form>

          <p className="text-xs text-zinc-400">Prijavom se slažete s našim uvjetima pružanja usluge.</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-50 p-6">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">Dobrodošli!</h2>
            <p className="text-zinc-500">Postavimo profil vaše tvrtke.</p>
          </div>
          <Input
            label="Naziv tvrtke"
            placeholder="npr. Elektro-Instalacije d.o.o."
            value={newCompanyName}
            onChange={(e: any) => setNewCompanyName(e.target.value)}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700">Struka</label>
            <select
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent"
              value={onboardingDiscipline}
              onChange={(e) => setOnboardingDiscipline(e.target.value as Discipline)}
            >
              {(Object.entries(DISCIPLINE_LABELS) as [Discipline, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleOnboarding} className="w-full py-3" disabled={!newCompanyName}>
            Kreiraj tvrtku
          </Button>
        </Card>
      </div>
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
            onGeneratePDF={async () => await generatePDF(selectedProject, entries.filter(e => e.projectId === selectedProject.id))}
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

// --- Sub-views ---

function DiaryEntryDetailModal({ entry, project, onClose, onEdit, onAddToCalendar, hasCalendar, company }: { entry: DiaryEntry, project: Project, onClose: () => void, onEdit: (e: DiaryEntry) => void, onAddToCalendar: (e: DiaryEntry) => Promise<void>, hasCalendar: boolean, company: Company | null }) {
  const [loading, setLoading] = useState(false);
  const brandColor = company?.brandColor || '#3b82f6';

  const handleAdd = async () => {
    setLoading(true);
    try {
      await onAddToCalendar(entry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative"
      >
        <button onClick={onClose} className="absolute right-6 top-6 p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <X size={24} className="text-zinc-400" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">
              {safeFormatDate(entry.entryDate, 'EEEE, dd.MM.yyyy')}
            </span>
            <StatusBadge status={entry.status} />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{entry.title}</h2>
            <p className="text-sm text-zinc-500">{project.projectName} • {project.clientName}</p>
            {entry.phase && (
              <p className="text-xs font-bold text-accent uppercase tracking-wider">{entry.phase}</p>
            )}
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase border-y border-zinc-100 py-3">
            <span className="flex items-center gap-1"><Clock size={12} /> {entry.hours}h rada</span>
            <span className="flex items-center gap-1"><UserIcon size={12} /> {entry.workersCount} radnika</span>
            {(entry.weatherCondition || entry.temperature) && (
              <span className="flex items-center gap-1"><CloudSun size={12} /> {entry.weatherCondition || '-'} ({entry.temperature || 0}°C)</span>
            )}
            {entry.reminderAt && (
              <span className="flex items-center gap-1 text-accent font-bold"><Bell size={12} /> Podsjetnik: {safeFormatDate(entry.reminderAt, 'dd.MM. HH:mm')}</span>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase">Opis radova</p>
            <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{entry.description}</p>
          </div>

          {entry.lineItems && entry.lineItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-zinc-400 uppercase">Utrošeni materijal</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entry.lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                    <span className="text-sm font-medium text-zinc-700">{item.name}</span>
                    <span className="text-xs font-bold text-accent">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase">Fotografije</p>
            <PhotoGallery entryId={entry.id} />
          </div>

          {entry.aiSummary && (
            <div className="p-5 rounded-2xl border" style={{ backgroundColor: brandColor + '08', borderColor: brandColor + '20' }}>
              <p className="text-[10px] font-bold uppercase mb-3 flex items-center gap-1.5" style={{ color: brandColor }}>
                <Zap size={12} /> AI Analiza i Sažetak
              </p>
              <div className="prose prose-sm max-w-none prose-zinc break-words">
                <Markdown>{entry.aiSummary}</Markdown>
              </div>
            </div>
          )}

          {entry.signatureUrl && (
            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Potpis</p>
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 flex items-center justify-center">
                <img src={entry.signatureUrl} alt="Potpis" className="max-h-32 object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Zatvori
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 border-zinc-200" 
            onClick={() => onEdit(entry)}
            disabled={loading}
          >
            <Edit2 size={18} className="mr-2" />
            Uredi
          </Button>
          {hasCalendar && (
            <Button 
              className="flex-1 text-white border-none shadow-lg" 
              onClick={handleAdd}
              disabled={loading}
              style={{ backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` }}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" size={18} />
              ) : (
                <Calendar size={18} className="mr-2" />
              )}
              {loading ? 'Dodavanje...' : 'Dodaj u Kalendar'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function UsersView({ users, pendingInvitations = [], onInviteUser, onUpdateRole, onDeleteUser, onCancelInvitation, currentUser }: any) {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Korisnici</h1>
        <Button onClick={onInviteUser}>
          <UserPlus size={20} /> Pozovi korisnika
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {users.map((u: AppUser) => (
          <Card key={u.id} className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                <UserIcon size={24} />
              </div>
              <div>
                <h3 className="font-bold">{u.name}</h3>
                <p className="text-xs text-zinc-500">{u.email}</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-accent/10 text-accent'}`}>
                  {u.role === 'admin' ? 'Administrator' : 'Radnik'}
                </span>
              </div>
            </div>

            {currentUser.role === 'admin' && currentUser.id !== u.id && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateRole(u.id, u.role === 'admin' ? 'worker' : 'admin')}
                  className="text-xs"
                >
                  Promijeni ulogu
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteUser(u.id)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {pendingInvitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Čekaju prihvaćanje ({pendingInvitations.length})</h2>
          <div className="grid grid-cols-1 gap-3">
            {pendingInvitations.map((inv: Invitation) => (
              <Card key={inv.id} className="p-5 flex items-center justify-between border-dashed opacity-70 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-400">
                    <Mail size={18} />
                  </div>
                  <div>
                    {inv.name && <h3 className="font-semibold text-sm">{inv.name}</h3>}
                    <p className="text-xs text-zinc-500">{inv.email}</p>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${inv.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-zinc-100 text-zinc-500'}`}>
                      {inv.role === 'admin' ? 'Administrator' : 'Radnik'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancelInvitation(inv.id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                >
                  <X size={16} />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InviteUserModal({ onClose, onSubmit, company }: any) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'worker'>('worker');
  const brandColor = company?.brandColor || '#3b82f6';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Pozovi korisnika</h2>
          <p className="text-sm text-zinc-500">Dodajte novog člana tima u svoju tvrtku.</p>
        </div>

        <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Ime i prezime</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="npr. Ivan Horvat"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Email adresa</label>
                <input 
                  type="email" 
                  className="w-full p-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan.horvat@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase">Uloga</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRole('worker')}
                    className="flex-1 py-3 rounded-xl border transition-all text-sm font-bold"
                    style={role === 'worker' ? { backgroundColor: brandColor, color: 'white', borderColor: brandColor } : { backgroundColor: '#f9f9f9', color: '#71717a', borderColor: '#f4f4f5' }}
                  >
                    Radnik
                  </button>
                  <button 
                    onClick={() => setRole('admin')}
                    className="flex-1 py-3 rounded-xl border transition-all text-sm font-bold"
                    style={role === 'admin' ? { backgroundColor: brandColor, color: 'white', borderColor: brandColor } : { backgroundColor: '#f9f9f9', color: '#71717a', borderColor: '#f4f4f5' }}
                  >
                    Admin
                  </button>
                </div>
              </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Odustani</Button>
          <Button className="flex-1" onClick={() => onSubmit(email, name, role)} disabled={!email || !name}>Pozovi</Button>
        </div>
      </motion.div>
    </div>
  );
}

const countryCodes = [
  { label: 'HR (+385)', value: '+385' },
  { label: 'DE (+49)', value: '+49' },
  { label: 'AT (+43)', value: '+43' },
  { label: 'SI (+386)', value: '+386' },
  { label: 'IT (+39)', value: '+39' },
  { label: 'UK (+44)', value: '+44' },
  { label: 'US (+1)', value: '+1' },
];

function CompanySettingsView({ company, onUpdate }: { company: Company, onUpdate: (data: any) => void }) {
  const [name, setName] = useState(company.name);
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [brandColor, setBrandColor] = useState(company.brandColor || '#3b82f6');
  const [street, setStreet] = useState(company.street || (company.address?.split(',')[0] || ''));
  const [city, setCity] = useState(company.city || (company.address?.split(',')[1]?.trim() || ''));
  const [email, setEmail] = useState(company.email || '');
  const [phonePrefix, setPhonePrefix] = useState(() => {
    const found = countryCodes.find(c => company.phone?.startsWith(c.value));
    return found ? found.value : '+385';
  });
  const [phone, setPhone] = useState(() => {
    const found = countryCodes.find(c => company.phone?.startsWith(c.value));
    return found ? company.phone.slice(found.value.length).trim() : (company.phone || '');
  });
  const [website, setWebsite] = useState(company.website || '');
  const [discipline, setDiscipline] = useState<Discipline>(company.discipline ?? 'electro');
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoUrl(base64);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setUploading(false);
    }
  };

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Naziv tvrtke je obavezan.';
    if (!email.trim()) newErrors.email = 'Email je obavezan.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email nije ispravan.';
    if (!street.trim()) newErrors.street = 'Ulica je obavezna.';
    if (!city.trim()) newErrors.city = 'Grad je obavezan.';
    if (!phone.trim()) newErrors.phone = 'Telefon je obavezan.';
    else if (!/^\d+$/.test(phone.replace(/\s/g, ''))) newErrors.phone = 'Telefon smije sadržavati samo brojeve.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSuccessMessage(null);
      return;
    }

    setErrors({});
    onUpdate({
      name,
      logoUrl,
      brandColor,
      street,
      city,
      address: `${street}, ${city}`,
      email,
      phone: `${phonePrefix} ${phone.trim()}`,
      website,
      discipline,
    });
    setSuccessMessage('Postavke su uspješno spremljene!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Postavke tvrtke</h1>
        <p className="text-zinc-500">Upravljajte vizualnim identitetom i podacima svoje tvrtke.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="p-8 space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-400 uppercase">Logo tvrtke</label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-200 relative group">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 size={32} className="text-zinc-300" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      id="logo-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <label 
                      htmlFor="logo-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-50 cursor-pointer transition-all"
                    >
                      <Camera size={18} /> Promijeni logo
                    </label>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold">Preporučeno: Kvadratni format, PNG ili JPG</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Naziv tvrtke"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  placeholder="Unesite naziv tvrtke"
                  error={errors.name}
                />
                <Select
                  label="Struka"
                  value={discipline}
                  onChange={(e: any) => setDiscipline(e.target.value as Discipline)}
                  options={Object.entries(DISCIPLINE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div />
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Boja branda</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 shadow-sm shrink-0">
                      <input 
                        type="color" 
                        className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                      />
                    </div>
                    <input 
                      type="text" 
                      className="flex-1 px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/5 focus:border-accent transition-all font-mono text-sm"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 space-y-6">
            <h3 className="text-lg font-bold">Kontakt podaci</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Ulica i broj" 
                value={street}
                onChange={(e: any) => setStreet(e.target.value)}
                placeholder="npr. Ilica 10"
                error={errors.street}
              />
              <Input 
                label="Grad" 
                value={city}
                onChange={(e: any) => setCity(e.target.value)}
                placeholder="npr. Zagreb"
                error={errors.city}
              />
              <Input 
                label="Email" 
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                placeholder="info@tvrtka.hr"
                error={errors.email}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Telefon</label>
                <div className="flex gap-2">
                  <div className="w-32">
                    <Select 
                      options={countryCodes}
                      value={phonePrefix}
                      onChange={(e: any) => setPhonePrefix(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      className={cn(
                        "w-full px-4 py-3 bg-zinc-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/5 focus:border-accent transition-all",
                        errors.phone ? "border-red-500" : "border-zinc-100"
                      )}
                      value={phone}
                      onChange={(e: any) => setPhone(e.target.value)}
                      placeholder="9x xxx xxxx"
                    />
                  </div>
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div className="md:col-span-2">
                <Input 
                  label="Web stranica" 
                  value={website}
                  onChange={(e: any) => setWebsite(e.target.value)}
                  placeholder="www.tvrtka.hr"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 space-y-6 sticky top-8">
            <h3 className="text-lg font-bold">Pregled identiteta</h3>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-zinc-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100" style={{ backgroundColor: brandColor + '10' }}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 size={24} style={{ color: brandColor }} />
                    )}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color: brandColor }}>{name || 'Naziv tvrtke'}</p>
                    <p className="text-xs text-zinc-400">Primjer zaglavlja</p>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full" style={{ backgroundColor: brandColor }}></div>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase">Kontakt info u PDF-u</p>
                <div className="text-sm text-zinc-600 space-y-1">
                  {(street || city) && <p className="flex items-center gap-2"><MapPin size={14} /> {street}{street && city ? ', ' : ''}{city}</p>}
                  {email && <p className="flex items-center gap-2"><FileText size={14} /> {email}</p>}
                  {phone && <p className="flex items-center gap-2"><Briefcase size={14} /> {phone}</p>}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-4">
              {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100 animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 size={18} />
                  {successMessage}
                </div>
              )}
              <Button 
                className="w-full py-4 h-auto text-base font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={handleSave}
                disabled={!name || uploading}
                style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}4D` }}
              >
                Spremi promjene
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
  const brandColor = company?.brandColor || '#3b82f6';

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
          <Button variant="ghost" onClick={onOpenSecrets} className="text-zinc-400">
            <Settings size={18} /> Tajne
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {googleTokens ? (
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
        ) : (
          <Card className="p-6 flex flex-col items-center justify-center text-center space-y-3 bg-slate-50 border-dashed">
            <Calendar size={24} className="text-zinc-300" />
            <div className="space-y-1">
              <p className="text-sm font-bold">Povežite Google Kalendar</p>
              <p className="text-[10px] text-zinc-500">Pratite rokove i zakazane radove direktno ovdje.</p>
            </div>
            <Button variant="outline" size="sm" onClick={onConnectCalendar} className="text-xs py-1.5 h-auto">Poveži</Button>
          </Card>
        )}
      </div>

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

function ProjectsView({ projects, sharedProjects = [], onProjectClick, onSharedProjectClick, onCreateProject, onNewEntry, userRole, company }: any) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const brandColor = company?.brandColor || '#3b82f6';

  const filteredProjects = (projects || []).filter((p: Project) => {
    const statusMatch = filter === 'all' || p.status === filter;
    const phaseMatch = phaseFilter === 'all' || p.phase === phaseFilter;
    return statusMatch && phaseMatch;
  });

  const filterOptions = [
    { value: 'all', label: 'Svi' },
    { value: 'active', label: 'Aktivni' },
    { value: 'completed', label: 'Završeni' },
    { value: 'archived', label: 'Arhivirani' },
  ];

  const phaseOptions = [
    { value: 'all', label: 'Sve faze' },
    ...getPhases(company?.discipline).map((p: string) => ({ value: p, label: p })),
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Projekti</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onNewEntry} 
            className="hidden md:flex items-center gap-2 font-bold"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            <Plus size={18} />
            Novi unos
          </Button>
          {userRole === 'admin' && (
            <Button onClick={onCreateProject} style={{ backgroundColor: brandColor }}>
              <Plus size={20} /> Novi projekt
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border",
                filter === opt.value 
                  ? "text-white border-transparent shadow-lg" 
                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
              )}
              style={filter === opt.value ? { backgroundColor: brandColor, boxShadow: `0 10px 15px -3px ${brandColor}33` } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {phaseOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPhaseFilter(opt.value)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all whitespace-nowrap border",
                phaseFilter === opt.value 
                  ? "bg-zinc-800 text-white border-transparent" 
                  : "bg-white text-zinc-400 border-zinc-100 hover:border-zinc-200"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredProjects.map((p: Project) => (
          <Card key={p.id} onClick={() => onProjectClick(p)} className="cursor-pointer hover:border-zinc-300 transition-all group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold transition-colors" style={{ color: 'inherit' }}>
                    <span className="transition-colors" style={{ color: 'inherit' }} onMouseEnter={(e) => e.currentTarget.style.color = brandColor} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>{p.projectName}</span>
                  </h3>
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                    p.status === 'active' ? "bg-green-100 text-green-600" : 
                    p.status === 'completed' ? "bg-accent/10 text-accent" :
                    "bg-zinc-100 text-zinc-500"
                  )}>
                    {p.status === 'active' ? 'Aktivno' : 
                     p.status === 'completed' ? 'Završeno' : 'Arhivirano'}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500">
                    {p.phase}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 flex items-center gap-1">
                  <UserIcon size={14} /> {p.clientName}
                </p>
                <p className="text-sm text-zinc-500 flex items-center gap-1">
                  <MapPin size={14} /> {p.street}, {p.city}
                </p>
              </div>
              <ChevronRight className="text-zinc-300 transition-all group-hover:translate-x-1" size={24} style={{ color: undefined }} />
            </div>
          </Card>
        ))}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400">Nema projekata za odabrani status.</p>
          </div>
        )}
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">Dijeljeni projekti</h2>
          {sharedProjects.length > 0 && (
            <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">{sharedProjects.length}</span>
          )}
        </div>
        {sharedProjects.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">Nema dijeljenih projekata.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sharedProjects.map((p: Project) => (
              <Card key={p.id} onClick={() => onSharedProjectClick(p)} className="cursor-pointer hover:border-zinc-300 transition-all group">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold">{p.projectName}</h3>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                        Tuđi projekt
                      </span>
                    </div>
                    <p className="text-sm text-zinc-500 flex items-center gap-1">
                      <UserIcon size={14} /> {p.clientName}
                    </p>
                    <p className="text-sm text-zinc-500 flex items-center gap-1">
                      <MapPin size={14} /> {p.street}, {p.city}
                    </p>
                  </div>
                  <ChevronRight className="text-zinc-300 transition-all group-hover:translate-x-1" size={24} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NewProjectView({ onCancel, onSubmit, company }: any) {
  const brandColor = company?.brandColor || '#3b82f6';
  const [data, setData] = useState({
    projectName: '',
    clientName: '',
    street: '',
    city: '',
    objectType: 'Stambeni',
    phase: 'Priprema',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-full">
          <X size={24} />
        </button>
        <h1 className="text-3xl font-bold tracking-tight">Novi projekt</h1>
      </header>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Naziv projekta" 
            placeholder="npr. Renovacija stana" 
            value={data.projectName}
            onChange={(e: any) => setData({...data, projectName: e.target.value})}
          />
          <Input 
            label="Naziv klijenta" 
            placeholder="npr. Ivan Horvat" 
            value={data.clientName}
            onChange={(e: any) => setData({...data, clientName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Ulica i broj" 
            placeholder="npr. Ilica 10" 
            value={data.street}
            onChange={(e: any) => setData({...data, street: e.target.value})}
          />
          <Input 
            label="Grad" 
            placeholder="npr. Zagreb" 
            value={data.city}
            onChange={(e: any) => setData({...data, city: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Select 
            label="Tip objekta" 
            value={data.objectType}
            onChange={(e: any) => setData({...data, objectType: e.target.value})}
            options={[
              { value: 'Stambeni', label: 'Stambeni' },
              { value: 'Komercijalni', label: 'Komercijalni' },
              { value: 'Industrijski', label: 'Industrijski' },
              { value: 'Održavanje', label: 'Održavanje' },
            ]}
          />
          <Select
            label="Faza radova"
            value={data.phase}
            onChange={(e: any) => setData({...data, phase: e.target.value})}
            options={getPhases(company?.discipline).map((p: string) => ({ value: p, label: p }))}
          />
          <Input 
            label="Datum početka" 
            type="date" 
            value={data.startDate}
            onChange={(e: any) => setData({...data, startDate: e.target.value})}
          />
        </div>

        <Button 
          onClick={() => onSubmit(data)} 
          className="w-full py-4 text-lg font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]" 
          disabled={!data.projectName || !data.clientName || !data.street || !data.city} 
          style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}4D` }}
        >
          Kreiraj projekt
        </Button>
      </Card>
    </div>
  );
}

function ProjectDetailView({ project, entries, onBack, onNewEntry, onEntryClick, onGeneratePDF, onAddToCalendar, onCompleteProject, onUpdatePhase, onDeleteProject, hasCalendar, userRole, appUser, company, readonly = false, companyUsers = [] }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectPhotos, setProjectPhotos] = useState<DiaryPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<DiaryPhoto | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'dnevnik' | 'suradnici' | 'zadaci' | 'dokumenti'>('dnevnik');

  const brandColor = company?.brandColor || '#3b82f6';

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await onGeneratePDF();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  useEffect(() => {
    if (!project.id || !appUser?.companyId) return;

    // Fetch photos for the project (one-time fetch to save quota)
    const fetchPhotos = async () => {
      try {
        const photos = await fetchProjectPhotos(project.id);
        setProjectPhotos(photos);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'diaryPhotos-project');
      }
    };

    fetchPhotos();
  }, [project.id, appUser?.companyId]);

  const uniqueWorkers = Array.from(new Set((entries || []).map((e: DiaryEntry) => JSON.stringify({ id: e.createdBy, name: e.createdByName }))))
    .map(s => JSON.parse(s as string));

  const filteredEntries = (entries || []).filter((entry: DiaryEntry) => {
    const matchesSearch = (entry?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (entry?.description || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && entry.entryDate >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && entry.entryDate <= endDate;
    }

    const matchesWorker = selectedWorkerId ? entry.createdBy === selectedWorkerId : true;
    const matchesPhase = selectedPhase ? entry.phase === selectedPhase : true;
    
    return matchesSearch && matchesDate && matchesWorker && matchesPhase;
  });

  return (
    <div className="space-y-6 md:space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{project.projectName}</h1>
              {project.status === 'completed' && (
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">Završeno</span>
              )}
              <span className="bg-zinc-100 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">{project.phase}</span>
              {userRole === 'admin' && project.status !== 'completed' && (
                <select
                  className="text-[10px] font-bold uppercase bg-zinc-50 border-none rounded-full px-2 py-0.5 focus:ring-0 cursor-pointer text-zinc-500"
                  value={project.phase}
                  onChange={(e) => onUpdatePhase(e.target.value)}
                >
                  {getPhases(company?.discipline).map((p: string) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-1">
              <UserIcon size={14} /> {project.clientName}
            </p>
            <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
              <MapPin size={14} /> {project.street}, {project.city}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {userRole === 'admin' && (
            <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 border-red-100 hover:bg-red-50 p-2.5 md:px-4">
              <Trash2 size={18} />
              <span className="hidden md:inline ml-2 text-xs">Obriši</span>
            </Button>
          )}
          {project.status !== 'completed' && userRole === 'admin' && (
            <Button variant="outline" onClick={onCompleteProject} className="text-green-600 border-green-200 hover:bg-green-50 flex-1 md:flex-none">
              <CheckCircle2 size={18} /> 
              <span className="ml-1 md:ml-2 text-sm md:text-base">Završi</span>
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleGeneratePDF} 
            className="flex-1 md:flex-none font-bold shadow-sm" 
            disabled={isGeneratingPDF} 
            style={{ borderColor: isGeneratingPDF ? undefined : brandColor + '40', color: isGeneratingPDF ? undefined : brandColor }}
          >
            {isGeneratingPDF ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            <span className="ml-1 md:ml-2 text-sm md:text-base">{isGeneratingPDF ? 'Generiram...' : 'Izvještaj'}</span>
          </Button>
          {!readonly && (
            <Button
              onClick={onNewEntry}
              className="flex-1 md:flex-none font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: brandColor, boxShadow: `0 10px 20px -5px ${brandColor}4D` }}
            >
              <Plus size={18} />
              <span className="ml-1 md:ml-2 text-sm md:text-base">Novi unos</span>
            </Button>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('dnevnik')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'dnevnik' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Dnevnik
        </button>
        <button
          onClick={() => setActiveTab('suradnici')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'suradnici' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Suradnici
        </button>
        <button
          onClick={() => setActiveTab('zadaci')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'zadaci' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Zadaci
        </button>
        <button
          onClick={() => setActiveTab('dokumenti')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'dokumenti' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
          )}
        >
          Dokumenti
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-4 text-red-600">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Obriši projekt?</h2>
            </div>
            
            <p className="text-sm md:text-base text-zinc-500">
              Jeste li sigurni da želite obrisati projekt <span className="font-bold text-zinc-900">{project.projectName}</span>? 
              Ova radnja će trajno obrisati sve unose i fotografije povezane s ovim projektom.
            </p>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                Odustani
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none" onClick={onDeleteProject}>
                Obriši trajno
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'suradnici' && (
        <ProjectMembersTab
          project={project}
          currentUser={appUser}
          orgMembers={companyUsers}
          company={company}
        />
      )}

      {activeTab === 'zadaci' && (
        <ProjectTasksTab
          project={project}
          currentUser={appUser}
          orgMembers={companyUsers}
          readonly={readonly}
          company={company}
        />
      )}

      {activeTab === 'dokumenti' && (
        <ProjectDocumentsTab
          project={project}
          currentUser={appUser}
          readonly={readonly}
          company={company}
        />
      )}

      {activeTab === 'dnevnik' && (
      <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center gap-1">
          <Clock size={20} style={{ color: brandColor }} />
          <p className="text-[10px] font-bold text-zinc-500 uppercase">Ukupno unosa</p>
          <p className="text-2xl font-bold">{(entries || []).length}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center gap-1">
          <History size={20} style={{ color: brandColor }} />
          <p className="text-[10px] font-bold text-zinc-500 uppercase">Zadnji unos</p>
          <p className="text-sm font-bold">{entries && entries.length > 0 ? safeFormatDate(entries[0].entryDate, 'dd.MM.yyyy') : 'Nema'}</p>
        </Card>
      </div>

      {projectPhotos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Sve fotografije</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {projectPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="aspect-square rounded-xl overflow-hidden border border-zinc-100 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={photo.url} 
                  alt="Projektna fotografija" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-6"
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <div className="flex-1 flex items-center justify-center w-full min-h-0">
              <img 
                src={selectedPhoto.url} 
                alt="Puna veličina" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {selectedPhoto.description && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 max-w-2xl w-full text-center mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white text-lg md:text-xl font-medium leading-relaxed">{selectedPhoto.description}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Od:</span>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Do:</span>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Radnik:</span>
                  <select 
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent appearance-none"
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                  >
                    <option value="">Svi radnici</option>
                    {uniqueWorkers.map((w: any) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-bold uppercase shrink-0" style={{ color: brandColor }}>Faza:</span>
                  <select 
                    className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent appearance-none"
                    value={selectedPhase}
                    onChange={(e) => setSelectedPhase(e.target.value)}
                  >
                    <option value="">Sve faze</option>
                    <option value="Priprema">Priprema</option>
                    <option value="Razvod">Razvod</option>
                    <option value="Kabliranje">Kabliranje</option>
                    <option value="Montaža">Montaža</option>
                    <option value="Sanacija">Sanacija</option>
                    <option value="Testiranje">Testiranje</option>
                    <option value="Završeno">Završeno</option>
                  </select>
                </div>
            </div>
            {(startDate || endDate || selectedWorkerId || selectedPhase) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); setSelectedWorkerId(''); setSelectedPhase(''); }}
                className="text-xs font-bold hover:underline px-2 py-1.5"
                style={{ color: brandColor }}
              >
                Očisti filtere
              </button>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Vremenska lenta</h2>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Pretraži unose..." 
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 transition-all text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-6 relative before:absolute before:left-5 md:before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
          {filteredEntries.map((entry: DiaryEntry) => (
            <div key={entry.id} className="relative pl-10 md:pl-12">
              <div className="absolute left-3 md:left-4 top-1 w-4 h-4 rounded-full bg-white border-2 z-10" style={{ borderColor: brandColor, boxShadow: `0 0 10px ${brandColor}4D` }} />
              <Card onClick={() => onEntryClick(entry)} className="space-y-3 cursor-pointer transition-all" style={{ hoverBorderColor: brandColor + '4D' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">
                      {safeFormatDate(entry.entryDate, 'EEEE, dd.MM.yyyy')}
                    </span>
                    {entry.phase && (
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold uppercase">{entry.phase}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasCalendar && (
                      <button 
                        onClick={() => onAddToCalendar(entry)}
                        className="p-1.5 text-zinc-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="Dodaj u kalendar"
                      >
                        <Calendar size={16} style={{ color: brandColor }} />
                      </button>
                    )}
                    <StatusBadge status={entry.status} />
                  </div>
                </div>
                <h3 className="font-bold">{entry.title}</h3>
                <p className="text-sm text-zinc-600 line-clamp-2">{entry.description}</p>
                
                {entry.lineItems && entry.lineItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 py-1">
                    {entry.lineItems.map((item, idx) => (
                      <span key={idx} className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-md font-medium text-zinc-600">
                        {item.name}: {item.quantity} {item.unit}
                      </span>
                    ))}
                  </div>
                )}

                {/* Photo Gallery */}
                <PhotoGallery entryId={entry.id} onPhotoClick={setSelectedPhoto} />

                {entry.aiSummary && (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">AI Sažetak</p>
                    <div className="prose prose-sm prose-zinc max-w-none break-words prose-headings:font-bold prose-headings:tracking-tight prose-p:text-zinc-600 prose-p:leading-relaxed">
                      <Markdown>{entry.aiSummary}</Markdown>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 pt-2 text-[10px] font-bold text-zinc-400 uppercase">
                  <span className="flex items-center gap-1"><Clock size={12} /> {entry.hours}h</span>
                  <span className="flex items-center gap-1"><UserIcon size={12} /> {entry.workersCount} radnika</span>
                </div>
              </Card>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 ml-12">
              <p className="text-zinc-400">{searchQuery ? 'Nema unosa koji odgovaraju pretrazi.' : 'Još nema unosa.'}</p>
            </div>
          )}
        </div>
      </section>
      </>
      )}
    </div>
  );
}

function ProjectMembersTab({ project, currentUser, orgMembers = [], company }: {
  project: Project;
  currentUser: any;
  orgMembers: any[];
  company: any;
}) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState<'lead' | 'contributor' | 'viewer'>('viewer');
  const [selectedOrgMemberId, setSelectedOrgMemberId] = useState('');
  const [selectedOrgMemberRole, setSelectedOrgMemberRole] = useState<'lead' | 'contributor' | 'viewer'>('viewer');
  const [saving, setSaving] = useState(false);
  const brandColor = company?.brandColor || '#3b82f6';
  const isAdmin = currentUser?.role === 'admin';

  const roleLabel = (r: string) => r === 'lead' ? 'Voditelj' : r === 'contributor' ? 'Suradnik' : 'Pregledatelj';

  const load = async () => {
    setLoading(true);
    try {
      const [m, i] = await Promise.all([
        fetchProjectMembers(project.id),
        fetchProjectInvitations(project.id)
      ]);
      setMembers(m);
      setInvitations(i);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  const handleAddOrgMember = async () => {
    if (!selectedOrgMemberId || !currentUser) return;
    setSaving(true);
    try {
      await addProjectMember({ projectId: project.id, userId: selectedOrgMemberId, role: selectedOrgMemberRole, invitedBy: currentUser.id });
      setSelectedOrgMemberId('');
      await load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleInviteEmail = async () => {
    if (!addEmail || !currentUser) return;
    setSaving(true);
    try {
      await createProjectInvitation({ projectId: project.id, email: addEmail, name: addName || undefined, role: addRole, createdBy: currentUser.id });
      await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail, name: addName, type: 'project_invite', projectName: project.projectName, inviterName: currentUser.name })
      }).catch(() => null);
      setAddEmail('');
      setAddName('');
      await load();
    } catch { /* silent */ }
    setSaving(false);
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeProjectMember({ projectId: project.id, userId });
      await load();
    } catch { /* silent */ }
  };

  const handleRoleChange = async (userId: string, role: 'lead' | 'contributor' | 'viewer') => {
    try {
      await updateProjectMemberRole({ projectId: project.id, userId, role });
      await load();
    } catch { /* silent */ }
  };

  const handleCancelInvitation = async (id: string) => {
    try {
      await cancelProjectInvitation(id);
      await load();
    } catch { /* silent */ }
  };

  const existingMemberIds = new Set(members.map(m => m.userId));
  const availableOrgMembers = orgMembers.filter((u: any) => !existingMemberIds.has(u.id));

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Current members */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Članovi projekta</h3>
        {members.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">Nema članova.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <Card key={m.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                    <UserIcon size={14} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{m.name || m.email || m.userId}</p>
                    {m.email && m.name && <p className="text-xs text-zinc-400">{m.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <select
                      value={m.role}
                      onChange={e => handleRoleChange(m.userId, e.target.value as any)}
                      className="text-xs font-bold bg-zinc-50 border border-zinc-100 rounded-lg px-2 py-1 focus:outline-none"
                    >
                      <option value="lead">Voditelj</option>
                      <option value="contributor">Suradnik</option>
                      <option value="viewer">Pregledatelj</option>
                    </select>
                  ) : (
                    <span className="text-xs bg-zinc-100 text-zinc-500 px-2 py-1 rounded-full font-bold">{roleLabel(m.role)}</span>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleRemoveMember(m.userId)} className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Pozivi na čekanju</h3>
          <div className="space-y-2">
            {invitations.map(inv => (
              <Card key={inv.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                    <Mail size={14} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{inv.email}</p>
                    <p className="text-xs text-zinc-400">{roleLabel(inv.role)}</p>
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={() => handleCancelInvitation(inv.id)} className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50">
                    <X size={14} />
                  </button>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Add member controls (admin only) */}
      {isAdmin && (
        <section className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dodaj člana</h3>

          {/* Add from org */}
          {availableOrgMembers.length > 0 && (
            <Card className="p-4 space-y-3">
              <p className="text-xs font-bold text-zinc-500">Dodaj iz tima</p>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedOrgMemberId}
                  onChange={e => setSelectedOrgMemberId(e.target.value)}
                  className="flex-1 min-w-0 text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
                >
                  <option value="">Odaberi člana tima...</option>
                  {availableOrgMembers.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
                <select
                  value={selectedOrgMemberRole}
                  onChange={e => setSelectedOrgMemberRole(e.target.value as any)}
                  className="text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="lead">Voditelj</option>
                  <option value="contributor">Suradnik</option>
                  <option value="viewer">Pregledatelj</option>
                </select>
                <Button
                  size="sm"
                  disabled={!selectedOrgMemberId || saving}
                  onClick={handleAddOrgMember}
                  style={{ backgroundColor: brandColor }}
                  className="text-white border-none"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Dodaj
                </Button>
              </div>
            </Card>
          )}

          {/* Invite by email */}
          <Card className="p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-500">Pozovi emailom</p>
            <input
              type="text"
              placeholder="Ime (opcionalno)"
              value={addName}
              onChange={e => setAddName(e.target.value)}
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
            />
            <div className="flex gap-2 flex-wrap">
              <input
                type="email"
                placeholder="Email adresa"
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                className="flex-1 min-w-0 text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/5"
              />
              <select
                value={addRole}
                onChange={e => setAddRole(e.target.value as any)}
                className="text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none"
              >
                <option value="lead">Voditelj</option>
                <option value="contributor">Suradnik</option>
                <option value="viewer">Pregledatelj</option>
              </select>
            </div>
            <Button
              size="sm"
              disabled={!addEmail || saving}
              onClick={handleInviteEmail}
              style={{ backgroundColor: brandColor }}
              className="w-full text-white border-none"
            >
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <UserPlus size={14} className="mr-2" />}
              Pošalji poziv
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}

function ProjectTasksTab({ project, currentUser, orgMembers = [], readonly = false, company }: {
  project: Project;
  currentUser: any;
  orgMembers: any[];
  readonly?: boolean;
  company: any;
}) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);
  const brandColor = company?.brandColor || '#3b82f6';
  const isAdmin = currentUser?.role === 'admin';

  const load = async () => {
    setLoading(true);
    try {
      const t = await fetchProjectTasks(project.id);
      setTasks(t);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  const handleToggle = async (task: ProjectTask) => {
    try {
      await toggleProjectTask({ taskId: task.id, done: !task.done });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t));
    } catch { /* silent */ }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await deleteProjectTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch { /* silent */ }
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !currentUser) return;
    setSaving(true);
    try {
      const task = await createProjectTask({
        projectId: project.id,
        title: newTitle.trim(),
        assignedTo: newAssignedTo || undefined,
        createdBy: currentUser.id
      });
      setTasks(prev => [...prev, task]);
      setNewTitle('');
      setNewAssignedTo('');
    } catch { /* silent */ }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Task list */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Zadaci</h3>
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">Nema zadataka.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map(task => (
              <Card key={task.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => handleToggle(task)}
                    className="w-4 h-4 rounded border-zinc-300 cursor-pointer flex-shrink-0"
                    style={{ accentColor: brandColor }}
                  />
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium truncate", task.done && "line-through text-zinc-400")}>
                      {task.title}
                    </p>
                    {task.assignedToName && (
                      <p className="text-xs text-zinc-400">{task.assignedToName}</p>
                    )}
                  </div>
                </div>
                {!readonly && isAdmin && (
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0 ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Add task form — admin only, not readonly */}
      {!readonly && isAdmin && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dodaj zadatak</h3>
          <Card className="space-y-3 p-4">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Novi zadatak..."
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <select
              value={newAssignedTo}
              onChange={e => setNewAssignedTo(e.target.value)}
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl px-3 py-2 focus:outline-none"
            >
              <option value="">Bez dodjele</option>
              {orgMembers.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim() || saving}
              style={{ backgroundColor: brandColor }}
              className="w-full text-white border-none"
            >
              {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
              Dodaj zadatak
            </Button>
          </Card>
        </section>
      )}
    </div>
  );
}

function ProjectDocumentsTab({ project, currentUser, readonly = false, company }: {
  project: Project;
  currentUser: any;
  readonly?: boolean;
  company: any;
}) {
  const [docs, setDocs] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandColor = company?.brandColor || '#3b82f6';

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchProjectDocuments(project.id);
      setDocs(d);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [project.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setUploading(true);
    try {
      const doc = await uploadProjectDocument({
        projectId: project.id,
        orgId: currentUser.companyId,
        file,
        uploadedBy: currentUser.id
      });
      setDocs(prev => [doc, ...prev]);
    } catch { /* silent */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (doc: ProjectDocument) => {
    try {
      await deleteProjectDocument(doc.id, doc.filePath);
      setDocs(prev => prev.filter(d => d.id !== doc.id));
    } catch { /* silent */ }
  };

  const filteredDocs = docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const fileTypeLabel = (mimeType?: string) => {
    if (!mimeType) return '';
    const part = mimeType.split('/')[1]?.toUpperCase() ?? '';
    return part.length > 6 ? part.slice(0, 6) : part;
  };

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="animate-spin text-zinc-300" size={24} />
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dokumenti</h3>
        {docs.length > 0 && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pretraži dokumente..."
              className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
        )}
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <p className="text-zinc-400 text-sm">{search ? 'Nema rezultata.' : 'Nema dokumenata.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredDocs.map(doc => (
              <Card key={doc.id} className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText size={16} className="text-zinc-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{doc.name}</p>
                    {doc.fileType && (
                      <span className="text-xs text-zinc-400">{fileTypeLabel(doc.fileType)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors rounded-lg hover:bg-zinc-100"
                  >
                    <Download size={14} />
                  </a>
                  {!readonly && (
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 text-zinc-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {!readonly && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Dodaj dokument</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ backgroundColor: brandColor }}
            className="w-full text-white border-none"
          >
            {uploading
              ? <><Loader2 size={14} className="animate-spin mr-2" />Učitavanje...</>
              : <><Plus size={14} className="mr-2" />Dodaj dokument</>
            }
          </Button>
        </section>
      )}
    </div>
  );
}

function PhotoGallery({ entryId, onPhotoClick }: { entryId: string, onPhotoClick?: (photo: DiaryPhoto) => void }) {
  const [photos, setPhotos] = useState<DiaryPhoto[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeDiaryPhotos(
      entryId,
      setPhotos,
      (error) => handleFirestoreError(error, OperationType.LIST, 'diaryPhotos')
    );
    return unsubscribe;
  }, [entryId]);

  if (photos.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {photos.map(p => (
        <div 
          key={p.id} 
          className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-100 relative group cursor-pointer"
          onClick={(e) => {
            if (onPhotoClick) {
              e.stopPropagation();
              onPhotoClick(p);
            }
          }}
        >
          <img src={p.url} className="w-full h-full object-cover" alt="Site" referrerPolicy="no-referrer" />
          {p.description && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
              <p className="text-[8px] text-white text-center line-clamp-2">{p.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CalendarView({ 
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week' | 'day'>('month');
  const brandColor = company?.brandColor || '#3b82f6';
  
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
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8 md:h-10 md:w-10">
              <ChevronRight className="rotate-180" size={18} />
            </Button>
            <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="text-[10px] md:text-xs font-bold px-2 md:px-3 h-8 md:h-10">
              Danas
            </Button>
            <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8 md:h-10 md:w-10">
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Kalendar</h1>
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
                          <div key={p.id} className="p-4 rounded-r-xl border-l-4" style={{ backgroundColor: color + '10', borderColor: color }}>
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
                          <div key={e.id} className="p-4 rounded-r-xl border-l-4" style={{ backgroundColor: color + '10', borderColor: color }}>
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

function ReportsView({ projects, entries, company }: { projects: Project[], entries: DiaryEntry[], company: Company | null }) {
  const [dateRange, setDateRange] = useState<'30d' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const brandColor = company?.brandColor || '#3b82f6';

  const filteredEntries = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (dateRange) {
      case 'thisMonth':
        start = startOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = startOfDay(parseISO(customStart));
          end = endOfDay(parseISO(customEnd));
        } else {
          start = subDays(now, 30);
        }
        break;
      case '30d':
      default:
        start = subDays(now, 30);
        break;
    }

    return entries.filter(e => {
      const d = parseISO(e.entryDate);
      return d >= start && d <= end;
    }).sort((a, b) => b.entryDate.localeCompare(a.entryDate));
  }, [entries, dateRange, customStart, customEnd]);

  const stats = useMemo(() => {
    const totalHours = filteredEntries.reduce((acc, curr) => acc + curr.hours, 0);
    const totalWorkers = filteredEntries.reduce((acc, curr) => acc + curr.workersCount, 0);
    const avgHoursPerEntry = filteredEntries.length > 0 ? (totalHours / filteredEntries.length).toFixed(1) : 0;
    
    const statusData = filteredEntries.reduce((acc: any, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(statusData).map(([name, value]) => ({ name, value: value as number }));

    // Prepare data for bar chart (hours per day)
    const dailyHours: Record<string, number> = {};
    filteredEntries.forEach(e => {
      dailyHours[e.entryDate] = (dailyHours[e.entryDate] || 0) + e.hours;
    });

    const barData = Object.entries(dailyHours)
      .map(([date, hours]) => ({ date: format(parseISO(date), 'dd.MM.'), hours, fullDate: date }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
      .slice(-14); // Last 14 days of data in range

    // Material analytics
    const materials: Record<string, number> = {};
    filteredEntries.forEach(e => {
      e.lineItems?.forEach(item => {
        materials[item.name] = (materials[item.name] || 0) + item.quantity;
      });
    });

    const topMaterials = Object.entries(materials)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return { totalHours, totalWorkers, avgHoursPerEntry, pieData, barData, topMaterials, statusData };
  }, [filteredEntries]);

  const COLORS = ['#16a34a', '#0ea5e9', '#ea580c', '#dc2626', '#9333ea'];

  const exportToCSV = () => {
    const headers = ['Datum', 'Projekt', 'Tip rada', 'Sati', 'Radnici', 'Status', 'Vrijeme', 'Temperatura'];
    const rows = filteredEntries.map(e => {
      const project = projects.find(p => p.id === e.projectId);
      return [
        e.entryDate,
        project?.projectName || 'Nepoznato',
        e.workType,
        e.hours,
        e.workersCount,
        e.status,
        e.weatherCondition || '',
        e.temperature || 0
      ];
    });

    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `izvjestaj_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(brandColor);
    doc.text('Izvještaj o radovima', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generirano: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`, 14, 30);
    doc.text(`Razdoblje: ${dateRange}`, 14, 35);

    // Stats
    doc.setDrawColor(230);
    doc.line(14, 40, pageWidth - 14, 40);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Ukupno sati: ${stats.totalHours}h`, 14, 50);
    doc.text(`Broj unosa: ${filteredEntries.length}`, 14, 57);
    doc.text(`Aktivni projekti: ${projects.filter(p => p.status === 'active').length}`, 14, 64);

    // Table
    const tableData = filteredEntries.map(e => {
      const project = projects.find(p => p.id === e.projectId);
      return [
        format(parseISO(e.entryDate), 'dd.MM.yyyy'),
        project?.projectName || '',
        e.workType,
        e.hours,
        e.status,
        e.weatherCondition ? `${e.weatherCondition} (${e.temperature}°C)` : '-'
      ];
    });

    autoTable(doc, {
      startY: 75,
      head: [['Datum', 'Projekt', 'Tip rada', 'Sati', 'Status', 'Vrijeme']],
      body: tableData,
      headStyles: { fillColor: brandColor },
      theme: 'striped'
    });

    doc.save(`izvjestaj_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Izvještaji</h1>
          <p className="text-zinc-500">Analitika i pregled poslovanja u realnom vremenu.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs font-bold gap-2"
            onClick={exportToCSV}
          >
            <Download size={14} /> CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs font-bold gap-2"
            onClick={exportToPDF}
          >
            <FileText size={14} /> PDF
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 w-fit">
        {[
          { id: '30d', label: 'Zadnjih 30 dana' },
          { id: 'thisMonth', label: 'Ovaj mjesec' },
          { id: 'lastMonth', label: 'Prošli mjesec' },
          { id: 'thisYear', label: 'Ova godina' },
          { id: 'custom', label: 'Prilagođeno' }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setDateRange(opt.id as any)}
            className={cn(
              "px-4 py-2 text-xs font-bold rounded-xl transition-all",
              dateRange === opt.id ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
            )}
            style={dateRange === opt.id ? { color: brandColor } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {dateRange === 'custom' && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-zinc-400">Od:</span>
            <input 
              type="date" 
              className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-zinc-400">Do:</span>
            <input 
              type="date" 
              className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        </motion.div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Clock size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Ukupno sati</p>
          <p className="text-3xl font-bold text-primary">{stats.totalHours}h</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Briefcase size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Aktivni projekti</p>
          <p className="text-3xl font-bold text-primary">{projects.filter(p => p.status === 'active').length}</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '80' }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <FileText size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Broj unosa</p>
          <p className="text-3xl font-bold text-primary">{filteredEntries.length}</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '40' }}></div>
        </Card>
        <Card className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Zap size={48} style={{ color: brandColor }} />
          </div>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">Prosjek sati/unos</p>
          <p className="text-3xl font-bold text-primary">{stats.avgHoursPerEntry}h</p>
          <div className="mt-2 h-1 w-12 rounded-full" style={{ backgroundColor: brandColor + '20' }}></div>
        </Card>
      </div>

      {/* Bento Grid Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Hours per day */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Trend radnih sati</h3>
            <p className="text-xs text-zinc-400 font-medium">Zadnjih 14 unosa u razdoblju</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={stats.barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip 
                  cursor={{ fill: brandColor + '08' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill={brandColor} 
                  radius={[4, 4, 0, 0]} 
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6 space-y-6">
          <h3 className="font-bold text-lg">Statusi radova</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">{filteredEntries.length}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Ukupno</span>
            </div>
          </div>
          <div className="space-y-2">
            {stats.pieData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-zinc-600 capitalize">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Material Usage */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Korišteni materijal</h3>
            <div className="p-2 bg-zinc-50 rounded-lg">
              <Folder size={18} className="text-zinc-400" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.topMaterials.map((m, i) => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-700 truncate max-w-[180px]">{m.name}</span>
                  <span className="font-bold">{m.qty} kom</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${(m.qty / stats.topMaterials[0].qty) * 100}%`,
                      backgroundColor: brandColor
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {stats.topMaterials.length === 0 && (
              <div className="py-8 text-center space-y-2">
                <p className="text-sm text-zinc-400 italic">Nema zabilježenog materijala u ovom razdoblju.</p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent Projects Activity */}
        <Card className="lg:col-span-2 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">Zadnja aktivnost po projektima</h3>
            <Button variant="ghost" size="sm" className="text-xs font-bold" style={{ color: brandColor }}>
              Vidi sve <ChevronRight size={14} />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-zinc-400 border-b border-zinc-100">
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Projekt</th>
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Zadnji unos</th>
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest">Status</th>
                  <th className="pb-3 font-bold uppercase text-[10px] tracking-widest text-right">Sati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {projects.slice(0, 5).map(p => {
                  const projectEntries = entries.filter(e => e.projectId === p.id);
                  const lastEntry = projectEntries.sort((a, b) => b.entryDate.localeCompare(a.entryDate))[0];
                  const projectHours = projectEntries.reduce((acc, curr) => acc + curr.hours, 0);
                  
                  return (
                    <tr key={p.id} className="group hover:bg-zinc-50/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold text-primary group-hover:translate-x-1 transition-transform">{p.projectName}</div>
                        <div className="text-[10px] text-zinc-400">{p.clientName}</div>
                      </td>
                      <td className="py-4 text-zinc-500">
                        {lastEntry ? format(parseISO(lastEntry.entryDate), 'dd.MM.yyyy') : 'Nema unosa'}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                          p.status === 'active' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                        )}>
                          {p.status === 'active' ? 'Aktivan' : 'Završen'}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold text-primary">
                        {projectHours}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

const SUGGESTED_MATERIALS = [
  'Kabel PGP 3x1.5 mm2',
  'Kabel PGP 3x2.5 mm2',
  'Kabel PGP 5x2.5 mm2',
  'Bužir cijev FI 16',
  'Bužir cijev FI 20',
  'Razvodna kutija FI 60',
  'Razvodna kutija FI 78',
  'Automatski osigurač 10A',
  'Automatski osigurač 16A',
  'FID sklopka 40/0.03A',
  'Utičnica (bijela)',
  'Prekidač (obični)',
  'Prekidač (izmjenični)',
];

function NewEntryView({ appUser, projects, initialProject, initialEntry, materialHistory, materialUnits, company, onCancel, onSuccess }: any) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const signaturePadRef = useRef<SignatureCanvas>(null);
  const [photos, setPhotos] = useState<{ url: string; description: string; file?: File }[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<DiaryPhoto[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<{ id: string; url: string }[]>([]);
  const [lineItems, setLineItems] = useState<{ name: string; quantity: number; unit: string }[]>(initialEntry?.lineItems || []);
  const [data, setData] = useState({
    projectId: initialEntry?.projectId || initialProject?.id || '',
    entryDate: initialEntry?.entryDate || format(new Date(), 'yyyy-MM-dd'),
    title: initialEntry?.title || '',
    phase: initialEntry?.phase || initialProject?.phase || 'Priprema',
    workType: initialEntry?.workType || 'razvod',
    zone: initialEntry?.zone || '',
    description: initialEntry?.description || '',
    status: initialEntry?.status || 'djelomično završeno',
    hours: initialEntry?.hours || 8,
    workersCount: initialEntry?.workersCount || 1,
    materialsUsed: initialEntry?.materialsUsed || '',
    missingItems: initialEntry?.missingItems || '',
    returnVisitNeeded: initialEntry?.returnVisitNeeded || false,
    issueNote: initialEntry?.issueNote || '',
    weatherCondition: initialEntry?.weatherCondition || '',
    temperature: initialEntry?.temperature || 0,
    reminderAt: initialEntry?.reminderAt || '',
    reminderNotified: initialEntry?.reminderNotified || false,
    signatureUrl: initialEntry?.signatureUrl || ''
  });

  useEffect(() => {
    const newTitle = data.zone ? `${data.phase} - ${data.zone}` : data.phase;
    if (data.title !== newTitle) {
      setData(prev => ({ ...prev, title: newTitle }));
    }
  }, [data.phase, data.zone]);

  useEffect(() => {
    if (initialEntry) {
      const fetchPhotos = async () => {
        try {
          const photos = await fetchDiaryPhotos(initialEntry.id);
          setExistingPhotos(photos);
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'diaryPhotos-edit');
        }
      };
      fetchPhotos();
    }
  }, [initialEntry]);

  useEffect(() => {
    if (initialEntry?.signatureUrl && signaturePadRef.current && step === 4) {
      signaturePadRef.current.fromDataURL(initialEntry.signatureUrl);
    }
  }, [initialEntry, step]);

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          setPhotos(prev => [...prev, { url: compressed, description: '', file }]);
        } catch (e) {
          console.error('Image compression failed:', e);
          setPhotos(prev => [...prev, { url: reader.result as string, description: '', file }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': [] },
    maxFiles: 10 
  });

  const handleVoiceNote = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Vaš preglednik ne podržava prepoznavanje govora.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'hr-HR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setData(prev => ({ 
        ...prev, 
        description: prev.description ? prev.description + " " + transcript : transcript 
      }));
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        console.error("Speech recognition error:", event.error);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      setIsRecording(false);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onDrop(Array.from(files));
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const fetchWeather = async () => {
    try {
      setWeatherError(null);
      const proj = projects.find((p: Project) => p.id === data.projectId);
      if (!proj || !proj.city) {
        setWeatherError("Prvo odaberite projekt s unesenim gradom.");
        return;
      }
      
      setLoadingWeather(true);
      // Use project city to fetch weather
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(proj.city)}&count=1&language=en&format=json`);
      const geoData = await response.json();
      
      if (geoData.results && geoData.results.length > 0) {
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();
        
        if (weatherData.current_weather) {
          const temp = Math.round(weatherData.current_weather.temperature);
          const code = weatherData.current_weather.weathercode;
          
          // Map WMO codes to simple Croatian descriptions
          const weatherMap: Record<number, string> = {
            0: 'Vedro',
            1: 'Pretežno vedro', 2: 'Djelomično oblačno', 3: 'Oblačno',
            45: 'Magla', 48: 'Magla',
            51: 'Sipi kiša', 53: 'Sipi kiša', 55: 'Sipi kiša',
            56: 'Sipi kiša', 57: 'Sipi kiša',
            61: 'Kiša', 63: 'Kiša', 65: 'Jaka kiša',
            66: 'Ledenica', 67: 'Ledenica',
            71: 'Snijeg', 73: 'Snijeg', 75: 'Jak snijeg',
            77: 'Snijeg',
            80: 'Pljuskovi', 81: 'Pljuskovi', 82: 'Jaki pljuskovi',
            85: 'Pljuskovi snijega', 86: 'Jaki pljuskovi snijega',
            95: 'Grmljavina', 96: 'Grmljavina s tučom', 99: 'Grmljavina s tučom'
          };
          
          setData(prev => ({
            ...prev,
            temperature: temp,
            weatherCondition: weatherMap[code] || 'Promjenjivo'
          }));
        } else {
          setWeatherError("Nije moguće dohvatiti podatke o vremenu.");
        }
      } else {
        setWeatherError(`Grad "${proj.city}" nije pronađen.`);
      }
    } catch (e) {
      console.error("Weather fetch error:", e);
      setWeatherError("Greška pri dohvaćanju vremena.");
    } finally {
      setLoadingWeather(false);
    }
  };

  const processWithAI = async (description: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiziraj ovaj dnevni izvještaj električara i strukturiraj ga profesionalno na hrvatskom jeziku.
        Ulaz: "${description}"
        Vrati isključivo strukturirani izvještaj koristeći Markdown (h1, h2, h3, liste, podebljani tekst).
        NEMOJ uključivati nikakav uvodni tekst poput "Evo izvještaja" ili "Kao voditelj projekta". 
        Započni odmah s naslovom ili prvom točkom izvještaja.`,
        config: {
          systemInstruction: "Ti si profesionalni voditelj elektroinstalacijskih projekata. Sažmi obavljene radove jasno i precizno na hrvatskom jeziku koristeći Markdown. Budi direktan i profesionalan, bez uvodnih fraza.",
        }
      });
      return response.text;
    } catch (e) {
      console.error("AI Error:", e);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!data.projectId || !data.description) return;
    setLoading(true);
    try {
      let aiSummary = initialEntry?.aiSummary || null;
      if (data.description !== initialEntry?.description) {
        aiSummary = await processWithAI(data.description);
      }
      
      let entryId = initialEntry?.id;
      
      // Get signature if exists
      let signatureUrl = data.signatureUrl;
      if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
        const canvas = signaturePadRef.current.getCanvas();
        const trimmedCanvas = trimCanvas(canvas);
        signatureUrl = trimmedCanvas.toDataURL('image/png');
      }

      if (initialEntry) {
        await updateDiaryEntry(initialEntry.id, {
          ...data,
          signatureUrl,
          lineItems,
          aiSummary
        });
        
        for (const removed of removedPhotos) {
          await deleteDiaryPhoto(removed.id, removed.url);
        }

        // Update existing photos descriptions
        for (const photo of existingPhotos) {
          try {
            await updateDiaryPhoto(photo.id, photo.description || '');
          } catch (error) {
            console.error('Update photo error:', error);
          }
        }
      } else {
        entryId = await createDiaryEntry(appUser.companyId, {
          ...data,
          signatureUrl,
          lineItems,
          companyId: appUser.companyId,
          createdBy: appUser.id,
          createdByName: appUser.name,
          aiSummary
        } as DiaryEntry);
      }

      for (const photo of photos) {
        try {
          let photoUrl = photo.url;
          if (photo.file && entryId) {
            try {
              photoUrl = await uploadDiaryPhoto(photo.file, appUser.companyId, entryId);
            } catch (e) {
              console.error('Storage upload failed, falling back to base64', e);
            }
          }
          await createDiaryPhoto({
            entryId: entryId,
            projectId: data.projectId,
            companyId: appUser.companyId,
            url: photoUrl,
            description: photo.description
          });
        } catch (error) {
          console.error('Create photo error:', error);
        }
      }

      onSuccess();
    } catch (error) {
      console.error('Save entry error:', error);
      alert('Greška pri spremanju unosa. Pokušajte ponovno.');
    }
    setLoading(false);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { name: '', quantity: 1, unit: 'kom' }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...lineItems];
    (newItems[index] as any)[field] = value;
    
    // Auto-fill unit if name matches a known material
    if (field === 'name' && materialUnits && materialUnits[value]) {
      newItems[index].unit = materialUnits[value];
    }
    
    setLineItems(newItems);
  };

  const combinedSuggestions = Array.from(new Set([...SUGGESTED_MATERIALS, ...(materialHistory || [])]));

  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-zinc-100 rounded-full">
            <X size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{initialEntry ? 'Uredi unos' : 'Novi unos'}</h1>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={cn(
                "w-8 h-1.5 rounded-full transition-all",
                step >= s ? "bg-accent" : "bg-zinc-200"
              )} 
            />
          ))}
        </div>
      </header>

      <div className="space-y-6">
        {step === 1 && (
          <Card className="p-6 space-y-6">
            <Select 
              label="Odaberi projekt" 
              value={data.projectId}
              onChange={(e: any) => setData({...data, projectId: e.target.value})}
              options={[
                { value: '', label: 'Odaberi projekt...' },
                ...projects.map((p: Project) => ({ value: p.id, label: p.projectName }))
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Datum" 
                type="date" 
                value={data.entryDate}
                onChange={(e: any) => setData({...data, entryDate: e.target.value})}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Naslov zapisa (automatski)</label>
                <div className="px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-600 font-medium text-sm">
                  {data.title || 'Odaberite fazu i zonu...'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Faza radova"
                value={data.phase}
                onChange={(e: any) => setData({...data, phase: e.target.value})}
                options={getPhases(company?.discipline).map((p: string) => ({ value: p, label: p }))}
              />
              <Select
                label="Vrsta posla"
                value={data.workType}
                onChange={(e: any) => setData({...data, workType: e.target.value})}
                options={getWorkTypes(company?.discipline)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Zona/Prostorija" 
                placeholder="npr. Kuhinja, Kat 1..." 
                value={data.zone}
                onChange={(e: any) => setData({...data, zone: e.target.value})}
              />
            </div>
            
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CloudSun size={12} /> Vrijeme i temperatura
                </p>
                <button 
                  onClick={fetchWeather}
                  disabled={loadingWeather}
                  className="text-[10px] font-bold text-accent hover:underline flex items-center gap-1 disabled:opacity-50"
                >
                  {loadingWeather ? (
                    <Loader2 className="animate-spin" size={10} />
                  ) : (
                    <Zap size={10} />
                  )}
                  {loadingWeather ? 'Dohvaćam...' : 'Dohvati trenutno'}
                </button>
              </div>
              {weatherError && (
                <p className="text-[10px] text-red-500 font-medium">{weatherError}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  placeholder="npr. Sunčano" 
                  value={data.weatherCondition}
                  onChange={(e: any) => setData({...data, weatherCondition: e.target.value})}
                />
                <div className="relative">
                  <Input 
                    type="number"
                    placeholder="20" 
                    value={data.temperature}
                    onChange={(e: any) => setData({...data, temperature: parseFloat(e.target.value) || 0})}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">°C</span>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(2)} className="w-full py-4" disabled={!data.projectId || !data.title}>
              Dalje: Slike i bilješke
            </Button>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Foto dokazi</label>
              
              <div className="grid grid-cols-2 gap-3">
                <div {...getRootProps()} className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 md:p-6 text-center hover:bg-zinc-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                  <input {...getInputProps()} />
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400">
                    <Folder size={18} />
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Galerija</p>
                </div>

                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="border-2 border-accent/20 bg-accent/5 rounded-2xl p-4 md:p-6 text-center hover:bg-accent/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 text-accent"
                >
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <Camera size={18} />
                  </div>
                  <p className="text-[10px] font-bold uppercase">Slikaj</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={cameraInputRef}
                    onChange={handleCameraCapture}
                  />
                </button>
              </div>

              {(photos.length > 0 || existingPhotos.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {existingPhotos.map((p) => (
                    <div key={p.id} className="flex gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-100 relative group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={p.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Opis slike</label>
                        <input 
                          type="text"
                          className="w-full text-xs p-2 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                          placeholder="npr. Razvodna kutija u hodniku"
                          value={p.description || ''}
                          onChange={(e) => {
                            const newPhotos = [...existingPhotos];
                            const idx = newPhotos.findIndex(photo => photo.id === p.id);
                            newPhotos[idx].description = e.target.value;
                            setExistingPhotos(newPhotos);
                          }}
                        />
                      </div>
                      <button 
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           setRemovedPhotos(prev => [...prev, { id: p.id, url: p.url }]);
                           setExistingPhotos(prev => prev.filter(photo => photo.id !== p.id));
                         }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {photos.map((p, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-accent/5 rounded-2xl border border-accent/10 relative group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-accent/20 relative">
                        <img src={p.url} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[8px] font-bold text-center py-0.5">NOVO</div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-accent/60 uppercase">Opis slike</label>
                        <input 
                          type="text"
                          className="w-full text-xs p-2 bg-white border border-accent/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent"
                          placeholder="npr. Postavljeni bužiri u kuhinji"
                          value={p.description}
                          onChange={(e) => {
                            const newPhotos = [...photos];
                            newPhotos[i].description = e.target.value;
                            setPhotos(newPhotos);
                          }}
                        />
                      </div>
                      <button 
                         onClick={(e) => { e.stopPropagation(); setPhotos(photos.filter((_, idx) => idx !== i)); }}
                        className="absolute -top-2 -right-2 bg-black/50 text-white p-1.5 rounded-full shadow-lg"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Opis radova</label>
                <button 
                  onClick={handleVoiceNote}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all",
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  <Mic size={14} /> {isRecording ? "Slušam..." : "Glasovna bilješka"}
                </button>
              </div>
              <textarea 
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 transition-all min-h-[120px]"
                placeholder="Što je danas odrađeno?"
                value={data.description}
                onChange={(e) => setData({...data, description: e.target.value})}
              />
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Natrag</Button>
              <Button onClick={() => setStep(3)} className="flex-[2]" disabled={!data.description}>Dalje: Stavke materijala</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Utrošeni materijal / Stavke</label>
                <Button variant="secondary" className="py-1 px-3 text-xs" onClick={addLineItem}>
                  <Plus size={14} /> Dodaj stavku
                </Button>
              </div>
              
              <div className="space-y-4">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 relative group space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <Input 
                          placeholder="Naziv stavke" 
                          value={item.name}
                          onChange={(e: any) => updateLineItem(idx, 'name', e.target.value)}
                          list="material-suggestions"
                        />
                      </div>
                      <button 
                        onClick={() => removeLineItem(idx)}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        label="Količina"
                        type="number" 
                        value={item.quantity}
                        onChange={(e: any) => updateLineItem(idx, 'quantity', Number(e.target.value))}
                      />
                      <Select 
                        label="Jedinica"
                        value={item.unit}
                        onChange={(e: any) => updateLineItem(idx, 'unit', e.target.value)}
                        options={[
                          { value: 'kom', label: 'kom' },
                          { value: 'm', label: 'm' },
                          { value: 'cm', label: 'cm' },
                          { value: 'kg', label: 'kg' },
                          { value: 'set', label: 'set' },
                        ]}
                      />
                    </div>
                  </div>
                ))}
                
                {lineItems.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase mb-2">Često korišteno (klikni za brzi unos):</p>
                    <div className="flex flex-wrap gap-2">
                      {combinedSuggestions.slice(0, 8).map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            const lastIdx = lineItems.length - 1;
                            const unit = materialUnits?.[s] || 'kom';
                            if (lastIdx >= 0 && !lineItems[lastIdx].name) {
                              updateLineItem(lastIdx, 'name', s);
                              updateLineItem(lastIdx, 'unit', unit);
                            } else {
                              setLineItems([...lineItems, { name: s, quantity: 1, unit }]);
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:border-accent hover:text-accent transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {lineItems.length === 0 && (
                  <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <p className="text-sm text-zinc-400 mb-4 italic">Nema dodanih stavki.</p>
                    <div className="flex flex-wrap justify-center gap-2 px-4">
                      {combinedSuggestions.slice(0, 6).map((s, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            const unit = materialUnits?.[s] || 'kom';
                            setLineItems([{ name: s, quantity: 1, unit }]);
                          }}
                          className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:border-accent hover:text-accent transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <datalist id="material-suggestions">
                  {combinedSuggestions.map((s, i) => (
                    <option key={i} value={s} />
                  ))}
                </datalist>
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Dodatne napomene o materijalu</label>
                <textarea 
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-300 transition-all min-h-[80px] text-sm"
                  placeholder="npr. Potrošeno više kabla zbog promjene trase..."
                  value={data.materialsUsed}
                  onChange={(e) => setData({...data, materialsUsed: e.target.value})}
                />
              </div>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Natrag</Button>
              <Button onClick={() => setStep(4)} className="flex-[2]">Zadnji detalji</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <Card className="p-6 space-y-6">
            <Select 
              label="Trenutni status" 
              value={data.status}
              onChange={(e: any) => setData({...data, status: e.target.value})}
              options={[
                { value: 'završeno', label: 'Završeno' },
                { value: 'djelomično završeno', label: 'Djelomično završeno' },
                { value: 'čeka materijal', label: 'Čeka materijal' },
                { value: 'blokirano', label: 'Blokirano' },
                { value: 'potrebno dodatno', label: 'Potrebno dodatno' },
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Radni sati" 
                type="number" 
                value={data.hours}
                onChange={(e: any) => setData({...data, hours: Number(e.target.value)})}
              />
              <Input 
                label="Radnika na terenu" 
                type="number" 
                value={data.workersCount}
                onChange={(e: any) => setData({...data, workersCount: Number(e.target.value)})}
              />
            </div>
            <Input 
              label="Nedostaje / Prepreke" 
              placeholder="Što vas koči u radu?" 
              value={data.missingItems}
              onChange={(e: any) => setData({...data, missingItems: e.target.value})}
            />
            
            <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
              <span className="text-sm font-medium">Potreban ponovni dolazak?</span>
              <button 
                onClick={() => setData({...data, returnVisitNeeded: !data.returnVisitNeeded})}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  data.returnVisitNeeded ? "bg-accent" : "bg-zinc-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  data.returnVisitNeeded ? "left-7" : "left-1"
                )} />
              </button>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell size={12} /> Postavi podsjetnik
                </p>
              </div>
              <Input 
                type="datetime-local"
                value={data.reminderAt}
                onChange={(e: any) => setData({...data, reminderAt: e.target.value, reminderNotified: false})}
              />
              <p className="text-[10px] text-zinc-400 italic">Aplikacija će vas obavijestiti u odabrano vrijeme.</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Potpis (opcionalno)</label>
                {(data.signatureUrl || (signaturePadRef.current && !signaturePadRef.current.isEmpty())) && (
                  <button 
                    onClick={() => {
                      signaturePadRef.current?.clear();
                      setData({...data, signatureUrl: ''});
                    }}
                    className="text-[10px] font-bold text-red-500 hover:underline"
                  >
                    Očisti potpis
                  </button>
                )}
              </div>
              <div className="border-2 border-zinc-100 rounded-2xl bg-white overflow-hidden">
                <SignatureCanvas 
                  ref={signaturePadRef}
                  penColor='black'
                  canvasProps={{
                    className: "w-full h-40 cursor-crosshair",
                    style: { width: '100%', height: '160px' }
                  }}
                />
              </div>
              {data.signatureUrl && !signaturePadRef.current?.isEmpty() && (
                <p className="text-[10px] text-zinc-400 italic">Prethodni potpis je učitan. Ponovnim potpisivanjem ćete ga zamijeniti.</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Natrag</Button>
              <Button onClick={handleSubmit} className="flex-[2] py-4" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Spremi unos"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Master Workspace Views ───────────────────────────────────────────────────

function MasterProjectsListView({ masterProjects, brandColor, onSelect, onCreateNew }: {
  masterProjects: MasterProject[];
  brandColor?: string;
  onSelect: (mp: MasterProject) => void;
  onCreateNew: () => void;
}) {
  const color = brandColor || '#3b82f6';
  const statusLabel: Record<string, string> = { active: 'Aktivan', completed: 'Završen', archived: 'Arhiviran' };
  const statusColor: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', completed: 'bg-zinc-100 text-zinc-500', archived: 'bg-amber-100 text-amber-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Master projekti</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Agregirani pregled svih disciplina na jednom projektu</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: color }}
          onClick={onCreateNew}
        >
          <Plus size={16} />
          Novi master projekt
        </button>
      </div>

      {masterProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${color}20` }}>
            <Layers size={28} style={{ color }} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-2">Nema master projekata</h3>
          <p className="text-sm text-zinc-500 max-w-xs">Kreirajte novi master projekt za agregaciju projekata više disciplina na jednoj lokaciji.</p>
          <button
            className="mt-6 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: color }}
            onClick={onCreateNew}
          >
            Kreiraj master projekt
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {masterProjects.map(mp => (
            <button
              key={mp.id}
              className="w-full text-left bg-white border border-zinc-100 rounded-2xl p-5 hover:shadow-md transition-all group"
              onClick={() => onSelect(mp)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[mp.status] ?? statusColor.active}`}>
                      {statusLabel[mp.status] ?? mp.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg leading-tight truncate">{mp.name}</h3>
                  {mp.location && <p className="text-sm text-zinc-500 mt-0.5 flex items-center gap-1"><MapPin size={12} />{mp.location}</p>}
                  {mp.description && <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{mp.description}</p>}
                </div>
                <ChevronRight size={20} className="text-zinc-300 group-hover:text-zinc-500 mt-1 flex-shrink-0 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MasterProjectDetailView({ masterProject, orgs, stats, activity, issues, ownerOrgId, currentOrgId, onAddOrg, onCreateIssue, onUpdateIssueStatus, brandColor, onBack }: {
  masterProject: MasterProject;
  orgs: MasterProjectOrganization[];
  stats: MasterProjectStats[];
  activity: MasterActivityItem[];
  issues: MasterProjectIssue[];
  ownerOrgId: string;
  currentOrgId: string;
  onAddOrg: () => void;
  onCreateIssue: (params: { title: string; priority: 'low' | 'medium' | 'high'; discipline?: string }) => Promise<void>;
  onUpdateIssueStatus: (issueId: string, status: MasterProjectIssue['status']) => Promise<void>;
  brandColor?: string;
  onBack: () => void;
}) {
  const color = brandColor || '#3b82f6';
  const statusLabel: Record<string, string> = { active: 'Aktivan', completed: 'Završen', archived: 'Arhiviran' };
  const statusColor: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', completed: 'bg-zinc-100 text-zinc-500', archived: 'bg-amber-100 text-amber-700' };
  const roleLabel: Record<string, string> = { lead: 'Voditelj', contributor: 'Suradnik', viewer: 'Promatrač' };
  const roleColor: Record<string, string> = { lead: 'bg-blue-100 text-blue-700', contributor: 'bg-violet-100 text-violet-700', viewer: 'bg-zinc-100 text-zinc-500' };
  const disciplineIcon: Record<string, string> = { electro: '⚡', water: '💧', klima: '❄️' };

  const [showIssueForm, setShowIssueForm] = React.useState(false);
  const [newIssueTitle, setNewIssueTitle] = React.useState('');
  const [newIssuePriority, setNewIssuePriority] = React.useState<'low' | 'medium' | 'high'>('medium');
  const [newIssueDiscipline, setNewIssueDiscipline] = React.useState('');
  const [issueSubmitting, setIssueSubmitting] = React.useState(false);

  const issueStatusColor: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-zinc-100 text-zinc-500',
  };
  const issueStatusLabel: Record<string, string> = {
    open: 'Otvoreno',
    in_progress: 'U tijeku',
    resolved: 'Riješeno',
    closed: 'Zatvoreno',
  };
  const issuePriorityColor: Record<string, string> = {
    low: 'bg-zinc-100 text-zinc-500',
    medium: 'bg-amber-100 text-amber-600',
    high: 'bg-red-100 text-red-600',
  };
  const issuePriorityLabel: Record<string, string> = { low: 'Niska', medium: 'Srednja', high: 'Visoka' };
  const nextStatus: Record<string, MasterProjectIssue['status']> = {
    open: 'in_progress',
    in_progress: 'resolved',
    resolved: 'closed',
    closed: 'open',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4" onClick={onBack}>
          <ChevronRight size={16} className="rotate-180" />
          Master projekti
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[masterProject.status] ?? statusColor.active}`}>
                {statusLabel[masterProject.status] ?? masterProject.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">{masterProject.name}</h1>
            {masterProject.location && (
              <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1"><MapPin size={14} />{masterProject.location}</p>
            )}
            {masterProject.description && (
              <p className="text-sm text-zinc-500 mt-2">{masterProject.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Discipline cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Sudionici po disciplini</h2>
          <button
            className={`text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors ${
              currentOrgId === ownerOrgId
                ? 'text-zinc-700 border-zinc-300 hover:bg-zinc-50'
                : 'text-zinc-400 border-zinc-200 cursor-not-allowed opacity-60'
            }`}
            disabled={currentOrgId !== ownerOrgId}
            onClick={currentOrgId === ownerOrgId ? onAddOrg : undefined}
          >
            + Dodaj organizaciju
          </button>
        </div>

        {orgs.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-400 bg-zinc-50 rounded-2xl">
            Nema povezanih organizacija.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orgs.map(org => (
              <div key={org.id} className="bg-white border border-zinc-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{disciplineIcon[org.discipline] ?? '🔧'}</span>
                    <span className="font-semibold text-zinc-800 text-sm">
                      {DISCIPLINE_LABELS[org.discipline as keyof typeof DISCIPLINE_LABELS] ?? org.discipline}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColor[org.role] ?? roleColor.contributor}`}>
                    {roleLabel[org.role] ?? org.role}
                  </span>
                </div>
                <p className="text-sm text-zinc-700 font-medium truncate">{org.organizationName ?? '—'}</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  Projekt: {org.linkedProjectName ?? '—'}
                </p>
                {(() => {
                  const s = stats.find(s => s.projectId === org.linkedProjectId);
                  return (
                    <p className="text-xs text-zinc-400 mt-1">
                      {s ? s.entryCount : 0} zapisa · {s ? s.totalHours : 0}h
                    </p>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Nedavna aktivnost</h2>
        {activity.length === 0 ? (
          <div className="text-center py-8 text-sm text-zinc-400 bg-zinc-50 rounded-2xl">
            Nema nedavnih aktivnosti.
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map(item => {
              const org = orgs.find(o => o.linkedProjectId === item.projectId);
              const icon = disciplineIcon[org?.discipline ?? ''] ?? '🔧';
              const entryStatusColor: Record<string, string> = {
                'završeno': 'bg-emerald-100 text-emerald-700',
                'djelomično završeno': 'bg-amber-100 text-amber-700',
                'blokirano': 'bg-red-100 text-red-700',
                'čeka materijal': 'bg-orange-100 text-orange-600',
                'potrebno dodatno': 'bg-blue-100 text-blue-700',
              };
              const [y, m, d] = item.entryDate.split('-');
              const dateFormatted = `${d}.${m}.${y}`;
              return (
                <div key={item.entryId} className="flex items-start gap-3 bg-white border border-zinc-100 rounded-xl px-4 py-3">
                  <span className="text-base mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-zinc-800 truncate">{item.title}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entryStatusColor[item.status] ?? 'bg-zinc-100 text-zinc-500'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{dateFormatted} · {item.createdByName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issues */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Prijave</h2>
          <button
            className="text-xs font-medium border border-zinc-300 text-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
            onClick={() => setShowIssueForm(f => !f)}
          >
            {showIssueForm ? 'Odustani' : '+ Dodaj prijavu'}
          </button>
        </div>

        {issues.length === 0 && !showIssueForm && (
          <div className="text-center py-8 text-sm text-zinc-400 bg-zinc-50 rounded-2xl">
            Nema prijava.
          </div>
        )}

        {issues.length > 0 && (
          <div className="space-y-2 mb-3">
            {issues.map(issue => (
              <div key={issue.id} className="flex items-center gap-2 bg-white border border-zinc-100 rounded-xl px-4 py-3">
                {issue.discipline && (
                  <span className="text-base">{disciplineIcon[issue.discipline] ?? '🔧'}</span>
                )}
                <span className="text-sm font-medium text-zinc-800 flex-1 min-w-0 truncate">{issue.title}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${issuePriorityColor[issue.priority] ?? issuePriorityColor.medium}`}>
                  {issuePriorityLabel[issue.priority] ?? issue.priority}
                </span>
                <button
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 cursor-pointer ${issueStatusColor[issue.status] ?? issueStatusColor.open}`}
                  onClick={() => onUpdateIssueStatus(issue.id, nextStatus[issue.status] ?? 'open')}
                  title="Klikni za promjenu statusa"
                >
                  {issueStatusLabel[issue.status] ?? issue.status}
                </button>
              </div>
            ))}
          </div>
        )}

        {showIssueForm && (
          <div className="bg-white border border-zinc-100 rounded-2xl p-4 space-y-3 mt-2">
            <input
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Naslov prijave..."
              value={newIssueTitle}
              onChange={e => setNewIssueTitle(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <select
                className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newIssuePriority}
                onChange={e => setNewIssuePriority(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Niska prioritet</option>
                <option value="medium">Srednja prioritet</option>
                <option value="high">Visoka prioritet</option>
              </select>
              <select
                className="flex-1 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newIssueDiscipline}
                onChange={e => setNewIssueDiscipline(e.target.value)}
              >
                <option value="">Sve discipline</option>
                <option value="electro">⚡ Elektro</option>
                <option value="water">💧 Vodoinstalacije</option>
                <option value="klima">❄️ Klima</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ backgroundColor: color }}
                disabled={!newIssueTitle.trim() || issueSubmitting}
                onClick={async () => {
                  if (!newIssueTitle.trim()) return;
                  setIssueSubmitting(true);
                  try {
                    await onCreateIssue({
                      title: newIssueTitle.trim(),
                      priority: newIssuePriority,
                      discipline: newIssueDiscipline || undefined,
                    });
                    setNewIssueTitle('');
                    setNewIssuePriority('medium');
                    setNewIssueDiscipline('');
                    setShowIssueForm(false);
                  } finally {
                    setIssueSubmitting(false);
                  }
                }}
              >
                {issueSubmitting ? 'Sprema...' : 'Dodaj'}
              </button>
              <button
                className="rounded-xl px-4 py-2.5 text-sm font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                onClick={() => { setNewIssueTitle(''); setNewIssuePriority('medium'); setNewIssueDiscipline(''); setShowIssueForm(false); }}
              >
                Odustani
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
