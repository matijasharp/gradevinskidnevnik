import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useOrg } from '../../../app/providers';
import { ROUTES } from '../../../app/router/routeConfig';
import Button from '../../../shared/ui/Button';
import NewProjectView from './NewProjectView';

export default function NewProjectPage() {
  const { company } = useAuth();
  const { createProject, projects, subscriptionStatus } = useOrg();
  const navigate = useNavigate();

  const activeProjectCount = projects.filter(p => p.status === 'active').length;
  const isGated = subscriptionStatus === 'free' && activeProjectCount >= 3;

  if (isGated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-surface-raised border border-border rounded p-8 max-w-sm w-full">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-bold text-text-primary mb-2">Dostigli ste limit plana</h2>
          <p className="text-text-secondary text-sm mb-6">
            Besplatni plan omogućuje do 3 aktivna projekta. Nadogradite na Pro za neograničen broj projekata.
          </p>
          <Button variant="primary" className="w-full mb-3" onClick={() => navigate(ROUTES.BILLING)}>
            Nadogradi na Pro
          </Button>
          <button
            onClick={() => navigate(ROUTES.PROJECTS)}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            ← Natrag na projekte
          </button>
        </div>
      </div>
    );
  }

  return (
    <NewProjectView
      onCancel={() => navigate(ROUTES.PROJECTS)}
      onSubmit={createProject}
      company={company}
    />
  );
}
