/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from './app/providers';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from './app/router/routeConfig';
import { signInWithGoogle, signInWithEmail } from './lib/supabaseAuth';
import { createOrganizationWithOwner } from './lib/data';
import { OperationType, handleFirestoreError } from './shared/utils/error';
import ErrorBoundary from './shared/components/ErrorBoundary';
import SecretsModal from './shared/components/SecretsModal';
import AppShell from './app/layouts/AppShell';
import LoginView from './features/auth/components/LoginView';
import PendingApprovalView from './features/auth/components/PendingApprovalView';
import DashboardPage from './features/dashboard/components/DashboardPage';
import CalendarPage from './features/calendar/components/CalendarPage';
import ProjectsPage from './features/projects/components/ProjectsPage';
import NewProjectPage from './features/projects/components/NewProjectPage';
import ProjectDetailPage from './features/projects/components/ProjectDetailPage';
import ReportsPage from './features/reports/components/ReportsPage';
import UsersPage from './features/users/components/UsersPage';
import CompanySettingsPage from './features/organizations/components/CompanySettingsPage';
import MasterWorkspacePage from './features/masterProjects/components/MasterWorkspacePage';
import SuperAdminPage from './features/admin/components/SuperAdminPage';
import NewEntryPage from './features/diary/components/NewEntryPage';
import EditEntryPage from './features/diary/components/EditEntryPage';
import ReminderOverlay from './features/diary/components/ReminderOverlay';
import { detectDisciplineFromSubdomain, type Discipline } from './lib/disciplineConfig';

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user, appUser, company, loading, showOnboarding, setShowOnboarding, setAppUser, setCompany } = useAuth();

  const [emailLogin, setEmailLogin] = useState({ email: '', password: '', error: '', loading: false });
  const [showPassword, setShowPassword] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [contextDiscipline] = useState<Discipline>(() => detectDisciplineFromSubdomain());
  const [onboardingDiscipline, setOnboardingDiscipline] = useState<Discipline>(() => detectDisciplineFromSubdomain());
  const [showSecretsModal, setShowSecretsModal] = useState(false);

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

  const handleOnboarding = async () => {
    if (!user || !newCompanyName) return;
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
  };

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

  return (
    <>
      <AppShell company={company} appUser={appUser}>
        <Routes>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
          <Route path={ROUTES.NEW_PROJECT} element={<NewProjectPage />} />
          <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          <Route path={ROUTES.NEW_ENTRY} element={<NewEntryPage />} />
          <Route path="/diary/:entryId/edit" element={<EditEntryPage />} />
          <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
          <Route path={ROUTES.CALENDAR} element={<CalendarPage />} />
          <Route path={ROUTES.USERS} element={<UsersPage />} />
          <Route path={ROUTES.COMPANY_SETTINGS} element={<CompanySettingsPage />} />
          <Route path={ROUTES.MASTER_WORKSPACE} element={<MasterWorkspacePage />} />
          <Route path={ROUTES.SUPER_ADMIN} element={<SuperAdminPage />} />
        </Routes>
      </AppShell>

      {showSecretsModal && (
        <SecretsModal onClose={() => setShowSecretsModal(false)} />
      )}

      <ReminderOverlay />
    </>
  );
}
