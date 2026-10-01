import React from 'react';
import { Metadata } from 'next';
import SynthesiaPracticeStage from '@/components/studio/keys/SynthesiaPracticeStage';

export const metadata: Metadata = {
  title: 'Synthesia Runway Practice Studio | Sonora Academy',
  description:
    'Escenario inmersivo de práctica a pantalla completa estilo Synthesia. Pista continua de Runway a 60 FPS, sincronización con Tone.js, teclado interactivo alineado y detección de toque/MIDI.',
};

export default function KeysPracticePage() {
  return <SynthesiaPracticeStage />;
}
