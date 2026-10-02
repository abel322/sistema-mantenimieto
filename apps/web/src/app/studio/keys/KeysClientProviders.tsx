'use client';

import React from 'react';
import { KeysPracticeProvider } from '@/context/KeysPracticeContext';

/**
 * KeysClientProviders — Client-side only wrapper.
 *
 * This component is marked 'use client' so that KeysPracticeProvider
 * (which uses useState/useEffect) runs only on the client.
 *
 * The parent layout.tsx is intentionally kept as a Server Component
 * so that it can export metadata. This client wrapper is nested inside
 * it to satisfy Next.js App Router rules.
 */
export default function KeysClientProviders({ children }: { children: React.ReactNode }) {
  return <KeysPracticeProvider>{children}</KeysPracticeProvider>;
}
