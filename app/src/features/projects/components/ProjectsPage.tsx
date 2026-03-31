import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useOrg } from '../../../app/providers';
import { ROUTES } from '../../../app/router/routeConfig';
import ProjectsView from './ProjectsView';

export default function ProjectsPage() {
  const { appUser, company } = useAuth();
  const { projects, sharedProjects } = useOrg();
  const navigate = useNavigate();

  return (
    <ProjectsView
      projects={projects}
      sharedProjects={sharedProjects}
      onProjectClick={(p) => navigate(`/projects/${p.id}`)}
      onSharedProjectClick={(p) => navigate(`/projects/${p.id}`)}
      onCreateProject={() => navigate(ROUTES.NEW_PROJECT)}
      onNewEntry={() => navigate(ROUTES.NEW_ENTRY)}
      userRole={appUser?.role}
      company={company}
    />
  );
}
