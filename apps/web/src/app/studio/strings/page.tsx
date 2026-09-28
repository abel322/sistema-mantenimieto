import React from 'react';
import { Metadata } from 'next';
import FretboardSequencerStudio from '@/components/studio/strings/FretboardSequencerStudio';

export const metadata: Metadata = {
  title: 'Sonora Strings Lab | Diapasón Interactivo & Secuenciador de Bajo y Guitarra',
  description:
    'Estudio visual e interactivo para la práctica de bajo eléctrico y guitarra con mástil SVG en tiempo real, tablatura dinámica y síntesis Web Audio en Sonora Academy.',
};

export default function StringsStudioPage() {
  return (
    <div className="w-full min-h-screen bg-[#070B14] text-slate-100 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        <FretboardSequencerStudio />
      </div>
    </div>
  );
}
