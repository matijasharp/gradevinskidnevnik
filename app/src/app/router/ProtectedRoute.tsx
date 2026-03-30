import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  // Auth guard added in Phase 11
  return <>{children}</>;
}
