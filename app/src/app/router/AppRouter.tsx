import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from '../../App';
import { OrganizationProvider } from '../providers';
import LandingPage from '../../features/landing/LandingPage';
import GuestRoute from './GuestRoute';
import { RootRedirect } from './RootRedirect';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/landing',
    element: <GuestRoute><LandingPage /></GuestRoute>,
  },
  {
    path: '*',
    element: <OrganizationProvider><App /></OrganizationProvider>,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
