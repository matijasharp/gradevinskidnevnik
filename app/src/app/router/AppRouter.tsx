/**
 * AppRouter — scaffold only, not yet activated.
 * Activated in Phase 12 (navigate() migration).
 * Auth guards wired in Phase 11 (AuthProvider).
 */
import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ROUTES } from './routeConfig';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';

const router = createBrowserRouter([
  {
    path: ROUTES.DASHBOARD,
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <div>Dashboard placeholder</div> },
      { path: ROUTES.PROJECTS, element: <div>Projects placeholder</div> },
      { path: ROUTES.PROJECT_DETAIL, element: <div>Project detail placeholder</div> },
      { path: ROUTES.NEW_PROJECT, element: <div>New project placeholder</div> },
      { path: ROUTES.NEW_ENTRY, element: <div>New entry placeholder</div> },
      { path: ROUTES.EDIT_ENTRY, element: <div>Edit entry placeholder</div> },
      { path: ROUTES.REPORTS, element: <div>Reports placeholder</div> },
      { path: ROUTES.CALENDAR, element: <div>Calendar placeholder</div> },
      { path: ROUTES.USERS, element: <div>Users placeholder</div> },
      { path: ROUTES.COMPANY_SETTINGS, element: <div>Company settings placeholder</div> },
      { path: ROUTES.MASTER_WORKSPACE, element: <div>Master workspace placeholder</div> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
