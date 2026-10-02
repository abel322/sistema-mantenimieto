import React from 'react';
import { Metadata } from 'next';
import SynthesiaDrumStage from '@/components/drums/SynthesiaDrumStage';
import DrumPracticeErrorBoundary from '@/components/drums/DrumPracticeErrorBoundary';

export const metadata: Metadata = {
  title: 'Synthesia Drum Practice Stage | Sonora Academy',
  description:
    'Escenario inmersivo de práctica a pantalla completa para batería estilo Synthesia / Guitar Pro. Pista horizontal continua a 60 FPS con carriles dedicados por componente de batería, sticking R/L/K/F y lectura de partitura.',
};

export default function DrumPracticePage() {
  return (
    <DrumPracticeErrorBoundary>
      <SynthesiaDrumStage />
    </DrumPracticeErrorBoundary>
  );
}
