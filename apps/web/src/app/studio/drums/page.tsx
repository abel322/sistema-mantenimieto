import React from 'react';
import type { Metadata } from 'next';
import DrumLab from '@/components/drums/DrumLab';

export const metadata: Metadata = {
  title: 'Sonora Drum Lab | Interactive Percussion Studio & Polyrhythmic Sequencer',
  description:
    'Advanced drum score editor and polyrhythmic sequencer powered by VexFlow and Tone.js. Edit standard 5-line percussion sheet music with irregular tuplets, ghost notes, and low-latency audio synthesis.',
};

export default function DrumLabPage() {
  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 overflow-x-hidden">
      <DrumLab />
    </main>
  );
}
