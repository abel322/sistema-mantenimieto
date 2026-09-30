import React from 'react';
import { Metadata } from 'next';
import KeysStudio from '@/components/studio/keys/KeysStudio';

export const metadata: Metadata = {
  title: 'Sonora Keys Lab | Teclado Interactivo, Piano & Armonía Teórica Avanzada',
  description:
    'Estudio profesional de piano y teclado interactivo en Sonora Academy. Secuenciador continuo Modo Runway, motor de síntesis polifónica Tone.js, voicings de Jazz/Neo-Soul y enciclopedia armónica con Círculo de Quintas.',
};

export default function KeysStudioPage() {
  return (
    <div className="w-full min-h-screen bg-[#050914] text-slate-100 flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        <KeysStudio />
      </div>
    </div>
  );
}
