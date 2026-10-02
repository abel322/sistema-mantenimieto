import React from 'react';
import { Metadata } from 'next';
import StringsPracticeStage from '@/components/studio/strings/StringsPracticeStage';
import StringsPracticeErrorBoundary from '@/components/studio/strings/StringsPracticeErrorBoundary';

export const metadata: Metadata = {
  title: 'Synthesia Strings Practice Stage | Sonora Academy',
  description:
    'Escenario inmersivo a pantalla completa para bajo y guitarra eléctrica estilo Synthesia / Rocksmith. Pista Runway horizontal a 60 FPS y diapasón sincronizado.',
};

export default function StringsPracticePage() {
  return (
    <StringsPracticeErrorBoundary>
      <StringsPracticeStage />
    </StringsPracticeErrorBoundary>
  );
}
