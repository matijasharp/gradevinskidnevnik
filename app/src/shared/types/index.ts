// ─── Shared Type Definitions ─────────────────────────────────────────────────
// Single source of truth for all domain types.
// App.tsx and data.ts import from here; data.ts re-exports for backward compat.

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  ownerEmail?: string;
  brandColor?: string;
  street?: string;
  city?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  discipline?: 'electro' | 'water' | 'klima' | 'general';
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface AppUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: 'admin' | 'worker';
  googleTokens?: GoogleTokens;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  isSuperAdmin: boolean;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  companyId: string;
  clientName: string;
  projectName: string;
  street: string;
  city: string;
  objectType: string;
  status: 'active' | 'completed' | 'archived';
  phase: string;
  startDate: string;
  notes?: string;
}

export interface DiaryEntry {
  id: string;
  companyId: string;
  projectId: string;
  createdBy: string;
  createdByName: string;
  entryDate: string;
  title: string;
  phase: string;
  workType: string;
  zone?: string;
  description: string;
  status: 'završeno' | 'djelomično završeno' | 'čeka materijal' | 'blokirano' | 'potrebno dodatno';
  hours: number;
  workersCount: number;
  lineItems?: { name: string; quantity: number; unit: string }[];
  materialsUsed?: string;
  missingItems?: string;
  returnVisitNeeded: boolean;
  issueNote?: string;
  aiSummary?: string;
  weatherCondition?: string;
  temperature?: number;
  reminderAt?: string;
  reminderNotified?: boolean;
  signatureUrl?: string;
  createdAt: any;
}

export interface DiaryPhoto {
  id: string;
  entryId: string;
  projectId: string;
  companyId: string;
  url: string;
  description?: string;
  createdAt?: any;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export type Unsubscribe = () => void;

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  name?: string;
  role: 'admin' | 'worker';
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'lead' | 'contributor' | 'viewer';
  invitedBy?: string;
  createdAt: string;
  name?: string;
  email?: string;
}

export interface ProjectInvitation {
  id: string;
  projectId: string;
  email: string;
  name?: string;
  role: 'lead' | 'contributor' | 'viewer';
  createdBy?: string;
  createdAt: string;
}

export interface MasterProject {
  id: string;
  name: string;
  description?: string;
  location?: string;
  status: 'active' | 'completed' | 'archived';
  ownerOrganizationId: string;
  createdBy?: string;
  createdAt: string;
}

export interface MasterProjectOrganization {
  id: string;
  masterProjectId: string;
  organizationId: string;
  organizationName?: string;
  discipline: 'electro' | 'water' | 'klima';
  role: 'lead' | 'contributor' | 'viewer';
  linkedProjectId?: string;
  linkedProjectName?: string;
  createdAt: string;
}

export interface MasterProjectStats {
  projectId: string;
  entryCount: number;
  totalHours: number;
  lastEntryDate?: string;
}

export interface MasterActivityItem {
  entryId: string;
  projectId: string;
  entryDate: string;
  title: string;
  status: string;
  createdByName: string;
}

export interface MasterProjectIssue {
  id: string;
  masterProjectId: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  discipline?: string;
  reportedBy?: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  done: boolean;
  assignedTo?: string;
  assignedToName?: string;
  createdBy?: string;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  organizationId: string;
  name: string;
  filePath: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  organizationId: string;
  projectId: string | null;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  createdAt: string;
}
