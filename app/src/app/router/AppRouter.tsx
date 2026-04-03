import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import App from '../../App';
import { OrganizationProvider } from '../providers';
import LandingPage from '../../features/landing/LandingPage';
import GuestRoute from './GuestRoute';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppWithScroll() {
  return (
    <OrganizationProvider>
      <ScrollToTop />
      <App />
    </OrganizationProvider>
  );
}

const router = createBrowserRouter([
  {
    path: '/landing',
    element: <GuestRoute><LandingPage /></GuestRoute>,
  },
  {
    path: '*',
    element: <AppWithScroll />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
