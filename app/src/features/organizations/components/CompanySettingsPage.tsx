import React from 'react';
import { useAuth } from '../../../app/providers';
import { updateOrganization } from '../../../lib/data';
import { OperationType, handleFirestoreError } from '../../../shared/utils/error';
import CompanySettingsView from './CompanySettingsView';

export default function CompanySettingsPage() {
  const { appUser, company, setCompany } = useAuth();

  if (appUser?.role !== 'admin' || !company) return null;

  const handleUpdate = (data: any) => {
    setCompany({ ...company, ...data });
    updateOrganization(company.id, data).catch((error) =>
      handleFirestoreError(error, OperationType.UPDATE, `organizations/${company.id}`)
    );
  };

  return <CompanySettingsView company={company} onUpdate={handleUpdate} />;
}
