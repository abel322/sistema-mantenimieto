import React from 'react';
import type { Metadata } from 'next';
import DrumClientProviders from '../studio/drums/DrumClientProviders';

export const metadata: Metadata = {
  title: 'Drum Lab Studio | Sonora Academy',
  description:
    'Taller de edición y composición rítmica para batería y percusión.',
};

export default function DrumLabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DrumClientProviders>{children}</DrumClientProviders>;
}
