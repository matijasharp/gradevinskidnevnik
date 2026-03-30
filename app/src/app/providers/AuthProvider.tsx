import React, { useState, useEffect, useContext, createContext } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { AppUser, Company } from '../../shared/types';
import { getSession, onAuthStateChange } from '../../lib/supabaseAuth';
import { setAuthContext } from '../../shared/utils/error';
import {
  fetchProfileByUserId,
  fetchOrganizationById,
  fetchInvitationByEmail,
  fetchProjectInvitationByEmail,
  acceptInvitation,
  acceptProjectInvitation,
} from '../../lib/data';

interface AuthContextValue {
  user: SupabaseUser | null;
  appUser: AppUser | null;
  company: Company | null;
  loading: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
  setAppUser: (v: AppUser | null) => void;
  setCompany: (v: Company | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  return (
    <AuthContext.Provider value={{ user, appUser, company, loading, showOnboarding, setShowOnboarding, setAppUser, setCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
