import React from 'react';
import { Metadata } from 'next';
import SynthesiaDrumStage from '@/components/drums/SynthesiaDrumStage';
import DrumPracticeErrorBoundary from '@/components/drums/DrumPracticeErrorBoundary';

export const metadata: Metadata = {
  title: 'Reproductor de Partitura de Batería | Sonora Academy',
  description:
    'Reproductor interactivo de partitura estándar de percusión (5 líneas) con cursor seguidor en tiempo real a 60 FPS, sticking analítico R/L y audio sincronizado vía Tone.js.',
};

export default function DrumPracticePage() {
  return (
    <DrumPracticeErrorBoundary>
      <SynthesiaDrumStage />
    </DrumPracticeErrorBoundary>
  );
}
