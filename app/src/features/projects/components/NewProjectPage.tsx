import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useOrg } from '../../../app/providers';
import { ROUTES } from '../../../app/router/routeConfig';
import NewProjectView from './NewProjectView';

export default function NewProjectPage() {
  const { company } = useAuth();
  const { createProject } = useOrg();
  const navigate = useNavigate();

  return (
    <NewProjectView
      onCancel={() => navigate(ROUTES.PROJECTS)}
      onSubmit={createProject}
      company={company}
    />
  );
}
