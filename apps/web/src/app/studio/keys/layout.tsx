// Server Component — intentionally no 'use client' directive.
// This layout can export Metadata because it's a Server Component.
// Client-side state (KeysPracticeProvider) is provided by KeysClientProviders,
// which is a nested 'use client' component.

import React from 'react';
import type { Metadata } from 'next';
import KeysClientProviders from './KeysClientProviders';

export const metadata: Metadata = {
  title: 'Keys Studio | Sonora Academy',
  description:
    'Taller de edición y programación de acordes, escalas, progresiones y cadencias para piano. Practica con el modo Synthesia a pantalla completa.',
};

export default function KeysRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KeysClientProviders>{children}</KeysClientProviders>;
}
