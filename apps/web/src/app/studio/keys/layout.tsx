'use client';

import React from 'react';
import { KeysPracticeProvider } from '@/context/KeysPracticeContext';

export default function KeysRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KeysPracticeProvider>{children}</KeysPracticeProvider>;
}
