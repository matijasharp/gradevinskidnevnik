import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../../App';
import { OrganizationProvider } from '../providers';

const router = createBrowserRouter([
  {
    path: '*',
    element: <OrganizationProvider><App /></OrganizationProvider>,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
