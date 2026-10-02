import React from 'react';
import type { Metadata } from 'next';
import DrumClientProviders from '../drums/DrumClientProviders';

export const metadata: Metadata = {
  title: 'Drum Lab Studio | Sonora Academy',
  description:
    'Taller de edición, secuenciador matricial DAW y escenario de práctica Synthesia Runway a pantalla completa para bateristas y percusionistas.',
};

export default function DrumAliasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DrumClientProviders>{children}</DrumClientProviders>;
}
