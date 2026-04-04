import React, { useState, useEffect, useContext, createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '../../lib/supabase';
import { ROUTES } from '../router/routeConfig';
import {
  subscribeProjects,
  subscribeDiaryEntries,
  subscribeCompanyUsers,
  subscribePendingInvitations,
  fetchSharedProjects,
  fetchMasterProjects,
  createInvitation,
  cancelInvitation as cancelInvitationRecord,
  updateProfileRole,
  removeOrganizationMember,
  createProject as createProjectRecord,
  updateProject,
  deleteProject as deleteProjectRecord,
} from '../../lib/data';
import type { Invitation, MasterProject } from '../../lib/data';
import type { AppUser, Project, DiaryEntry } from '../../shared/types';
import { OperationType, handleFirestoreError } from '../../shared/utils/error';

interface OrgContextValue {
  // Subscribed data
  projects: Project[];
  entries: DiaryEntry[];
  companyUsers: AppUser[];
  pendingInvitations: Invitation[];
  // Fetched data
  sharedProjects: Project[];
  masterProjects: MasterProject[];
  refreshMasterProjects: () => Promise<void>;
  // Billing
  subscriptionStatus: 'free' | 'pro' | 'cancelled' | 'past_due';
  stripeCustomerId: string | null;
  // Derived
  materialHistory: string[];
  materialUnits: Record<string, string>;
  // User/team actions
  inviteUser: (email: string, name: string, role: 'admin' | 'worker') => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  updateRole: (userId: string, newRole: 'admin' | 'worker') => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  // Project actions
  createProject: (data: any) => Promise<void>;
  completeProject: (projectId: string) => Promise<void>;
  updateProjectPhase: (projectId: string, phase: Project['phase']) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { appUser, company } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [companyUsers, setCompanyUsers] = useState<AppUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [masterProjects, setMasterProjects] = useState<MasterProject[]>([]);
  const [materialHistory, setMaterialHistory] = useState<string[]>([]);
  const [materialUnits, setMaterialUnits] = useState<Record<string, string>>({});
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'pro' | 'cancelled' | 'past_due'>('free');
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

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
    if (!appUser?.companyId) return;
    supabase
      .from('organizations')
      .select('subscription_status, stripe_customer_id')
      .eq('id', appUser.companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          setSubscriptionStatus((data.subscription_status as 'free' | 'pro' | 'cancelled' | 'past_due') ?? 'free');
          setStripeCustomerId(data.stripe_customer_id ?? null);
        }
      })
      .catch(() => null);
  }, [appUser?.companyId]);

  useEffect(() => {
    if (!entries.length) return;
    const allItems = entries.flatMap(e => e.lineItems || []);
    const historyMap = new Map<string, string>();
    allItems.forEach(item => {
      if (item.name && !historyMap.has(item.name)) historyMap.set(item.name, item.unit);
    });
    setMaterialHistory(Array.from(historyMap.keys()));
    setMaterialUnits(Object.fromEntries(historyMap));
  }, [entries]);

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
      await supabase.functions.invoke('send-invitation', {
        body: {
          email,
          name,
          role,
          organizationName: company?.name ?? '',
          inviterName: appUser.name,
          appUrl: window.location.origin
        }
      });
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

  const createProject = async (data: any) => {
    if (!appUser) return;
    try {
      await createProjectRecord(appUser.companyId, {
        ...data,
        companyId: appUser.companyId,
        status: 'active'
      } as Project);
      navigate(ROUTES.PROJECTS);
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
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const updateProjectPhase = async (projectId: string, phase: Project['phase']) => {
    try {
      await updateProject(projectId, { phase });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await deleteProjectRecord(projectId);
      navigate(ROUTES.PROJECTS);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
    }
  };

  const refreshMasterProjects = async () => {
    if (!appUser) return;
    fetchMasterProjects(appUser.companyId)
      .then(setMasterProjects)
      .catch(() => null);
  };

  return (
    <OrgContext.Provider value={{
      projects, entries, companyUsers, pendingInvitations,
      sharedProjects, masterProjects, refreshMasterProjects,
      subscriptionStatus, stripeCustomerId,
      materialHistory, materialUnits,
      inviteUser, cancelInvitation, updateRole, deleteUser,
      createProject, completeProject, updateProjectPhase, deleteProject,
    }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrganizationProvider');
  return ctx;
}
