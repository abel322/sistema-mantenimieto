'use client';

import React from 'react';
import { DrumPracticeProvider } from '@/context/DrumPracticeContext';

/**
 * DrumClientProviders — Client-side wrapper for Drum Studio.
 * Marked 'use client' so that DrumPracticeProvider runs only on the client.
 */
export default function DrumClientProviders({ children }: { children: React.ReactNode }) {
  return <DrumPracticeProvider>{children}</DrumPracticeProvider>;
}
