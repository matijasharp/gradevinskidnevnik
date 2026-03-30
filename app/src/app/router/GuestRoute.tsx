import React from 'react';

interface Props {
  children: React.ReactNode;
}

export default function GuestRoute({ children }: Props) {
  // Guest-only guard added in Phase 11
  return <>{children}</>;
}
