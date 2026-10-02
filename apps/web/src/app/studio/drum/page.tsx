import React from 'react';
import type { Metadata } from 'next';
import DrumLab from '@/components/drums/DrumLab';

export const metadata: Metadata = {
  title: 'Drum Lab Studio | Sonora Academy',
  description:
    'Taller de edición y composición rítmica para batería y percusión.',
};

export default function DrumAliasPage() {
  return <DrumLab />;
}
