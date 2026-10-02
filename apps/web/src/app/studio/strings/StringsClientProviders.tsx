'use client';

import React from 'react';
import { StringsPracticeProvider } from '@/context/StringsPracticeContext';

/**
 * StringsClientProviders — Client-side wrapper for Strings Studio.
 * Marked 'use client' so that StringsPracticeProvider runs only on the client.
 */
export default function StringsClientProviders({ children }: { children: React.ReactNode }) {
  return <StringsPracticeProvider>{children}</StringsPracticeProvider>;
}
