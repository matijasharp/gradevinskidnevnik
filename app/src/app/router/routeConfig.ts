export const ROUTES = {
  LANDING: '/landing',
  DASHBOARD: '/',
  PROJECTS: '/projects',
  PROJECT_DETAIL: '/projects/:projectId',
  NEW_PROJECT: '/projects/new',
  NEW_ENTRY: '/diary/new',
  EDIT_ENTRY: '/diary/:entryId/edit',
  REPORTS: '/reports',
  CALENDAR: '/calendar',
  USERS: '/users',
  COMPANY_SETTINGS: '/settings/company',
  MASTER_WORKSPACE: '/master',
  SUPER_ADMIN: '/admin/approvals',
  BRAND: '/brand',
} as const;

export type RouteKey = keyof typeof ROUTES;
