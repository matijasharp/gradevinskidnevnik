import React from 'react';
import { useAuth, useOrg } from '../../../app/providers';
import ReportsView from './ReportsView';

export default function ReportsPage() {
  const { company } = useAuth();
  const { projects, entries } = useOrg();

  return <ReportsView projects={projects} entries={entries} company={company} />;
}
