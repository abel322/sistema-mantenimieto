import React from 'react';
import type { Metadata } from 'next';
import StringsClientProviders from './StringsClientProviders';

export const metadata: Metadata = {
  title: 'Strings Studio | Sonora Academy',
  description:
    'Taller de edición, diapasón interactivo y escenario de práctica Synthesia Runway a pantalla completa para bajo y guitarra eléctrica.',
};

export default function StringsRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StringsClientProviders>{children}</StringsClientProviders>;
}
