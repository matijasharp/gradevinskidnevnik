import React, { useState } from 'react';
import { useAuth, useOrg } from '../../../app/providers';
import UsersView from './UsersView';
import InviteUserModal from '../../organizations/components/InviteUserModal';

export default function UsersPage() {
  const { appUser, company } = useAuth();
  const { companyUsers, pendingInvitations, inviteUser, updateRole, deleteUser, cancelInvitation } = useOrg();
  const [showInviteModal, setShowInviteModal] = useState(false);

  if (appUser?.role !== 'admin') return null;

  const handleInvite = async (email: string, name: string, role: 'admin' | 'worker') => {
    await inviteUser(email, name, role);
    setShowInviteModal(false);
  };

  return (
    <>
      <UsersView
        users={companyUsers}
        pendingInvitations={pendingInvitations}
        onInviteUser={() => setShowInviteModal(true)}
        onUpdateRole={updateRole}
        onDeleteUser={deleteUser}
        onCancelInvitation={cancelInvitation}
        currentUser={appUser}
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
