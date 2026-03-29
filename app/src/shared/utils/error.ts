import type { User as SupabaseUser } from '@supabase/supabase-js';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

let authContext: { userId?: string; email?: string | null } = {};

export function setAuthContext(user: SupabaseUser | null) {
  authContext = {
    userId: user?.id,
    email: user?.email ?? null
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: authContext.userId,
      email: authContext.email,
      emailVerified: undefined,
      isAnonymous: undefined,
      tenantId: undefined,
      providerInfo: []
    },
    operationType,
    path
  }

  console.error('Data Error: ', JSON.stringify(errInfo));

  // If it's a quota error, we might want to show a more user-friendly message
  if (errorMessage.includes('Quota limit exceeded') || errorMessage.includes('quota exceeded')) {
    const quotaError = new Error(JSON.stringify({
      ...errInfo,
      userMessage: 'Dosegnuto je ograničenje besplatne kvote baze podataka. Molimo pokušajte ponovno sutra ili kontaktirajte podršku.'
    }));
    throw quotaError;
  }

  throw new Error(JSON.stringify(errInfo));
}
