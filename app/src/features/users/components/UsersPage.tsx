import React, { useState } from 'react';
import { useAuth, useOrg } from '../../../app/providers';
import UsersView from './UsersView';
import InviteUserModal from '../../organizations/components/InviteUserModal';
import { updateProfileInfo } from '../../../lib/data';
import { updatePassword } from '../../../lib/supabaseAuth';

export default function UsersPage() {
  const { appUser, company, setAppUser } = useAuth();
  const { companyUsers, pendingInvitations, inviteUser, updateRole, deleteUser, cancelInvitation } = useOrg();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleInvite = async (email: string, name: string, role: 'admin' | 'worker') => {
    await inviteUser(email, name, role);
    setShowInviteModal(false);
  };

  const handleSaveProfile = async (data: { name: string; avatarUrl: string }) => {
    if (!appUser) return;
    await updateProfileInfo(appUser.id, { name: data.name, avatarUrl: data.avatarUrl });
    setAppUser({ ...appUser, name: data.name, avatarUrl: data.avatarUrl });
  };

  const handleChangePassword = async (newPassword: string) => {
    const { error } = await updatePassword(newPassword);
    if (error) throw error;
  };

  return (
    <>
      <UsersView
        appUser={appUser}
        users={companyUsers}
        pendingInvitations={pendingInvitations}
        onInviteUser={() => setShowInviteModal(true)}
        onUpdateRole={updateRole}
        onDeleteUser={deleteUser}
        onCancelInvitation={cancelInvitation}
        onSaveProfile={handleSaveProfile}
        onChangePassword={handleChangePassword}
        company={company}
      />
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInvite}
          company={company}
        />
      )}
    </>
  );
}
