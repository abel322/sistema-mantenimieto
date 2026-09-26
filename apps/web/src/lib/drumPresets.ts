import { DrumPreset, DrumMeasure, DrumBeat, DrumStep, DrumPieceId } from '@/types/drum';

function createStep(id: string, hits: { pieceId: DrumPieceId; accent?: boolean; ghost?: boolean }[]): DrumStep {
  return { id, hits };
}

function createBeat(
  measureId: string,
  beatIndex: number,
  subdivision: number,
  stepsConfig: { pieceId: DrumPieceId; accent?: boolean; ghost?: boolean }[][]
): DrumBeat {
  const isTuplet = [3, 5, 6, 7].includes(subdivision);
  const ratioMap: Record<number, [number, number]> = {
    3: [3, 2],
    5: [5, 4],
    6: [6, 4],
    7: [7, 4],
  };

  const steps: DrumStep[] = [];
  for (let s = 0; s < subdivision; s++) {
    const hits = stepsConfig[s] || [];
    steps.push(createStep(`${measureId}-b${beatIndex}-s${s}`, hits));
  }

  return {
    id: `${measureId}-b${beatIndex}`,
    beatIndex,
    subdivision,
    isTuplet,
    tupletRatio: isTuplet ? ratioMap[subdivision] : undefined,
    steps,
  };
}

export const DRUM_PRESETS: DrumPreset[] = [
  {
    id: 'classic-rock',
    name: 'Classic Rock 4/4 Pocket',
    category: 'Rock / Groove',
    description: 'Bomba y caja directa con charles en corcheas sólidas y backbeat acentuado en tiempos 2 y 4.',
    bpm: 110,
    timeSignature: [4, 4],
    measures: [
      {
        id: 'm1',
        timeSignature: [4, 4],
        beats: [
          // Beat 1
          createBeat('m1', 0, 2, [
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatClosed' }],
          ]),
          // Beat 2
          createBeat('m1', 1, 2, [
            [{ pieceId: 'snare', accent: true }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatClosed' }],
          ]),
          // Beat 3
          createBeat('m1', 2, 2, [
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
          ]),
          // Beat 4
          createBeat('m1', 3, 2, [
            [{ pieceId: 'snare', accent: true }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatOpen' }],
          ]),
        ],
      },
    ],
  },
  {
    id: 'funk-ghost',
    name: 'Funk Ghost-Note Groove',
    category: 'Funk / R&B',
    description: 'Sincopas en semicorcheas con ghost-notes en caja, aberturas de hi-hat y bombo dinámico.',
    bpm: 96,
    timeSignature: [4, 4],
    measures: [
      {
        id: 'm1',
        timeSignature: [4, 4],
        beats: [
          // Beat 1
          createBeat('m1', 0, 4, [
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', ghost: true }, { pieceId: 'hihatClosed' }],
          ]),
          // Beat 2
          createBeat('m1', 1, 4, [
            [{ pieceId: 'snare', accent: true }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', ghost: true }],
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', ghost: true }, { pieceId: 'hihatClosed' }],
          ]),
          // Beat 3
          createBeat('m1', 2, 4, [
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', ghost: true }],
            [{ pieceId: 'kick' }, { pieceId: 'hihatOpen' }],
            [{ pieceId: 'snare', ghost: true }],
          ]),
          // Beat 4
          createBeat('m1', 3, 4, [
            [{ pieceId: 'snare', accent: true }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', ghost: true }],
            [{ pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', ghost: true }],
          ]),
        ],
      },
    ],
  },
  {
    id: 'linear-chop',
    name: 'Linear Chop (Sixteenth & Sextuplets)',
    category: 'Gospel Chops / Fusion',
    description: 'Patrón lineal moderno combinando semicorcheas con una descarga explosiva en seisillo (6:4).',
    bpm: 120,
    timeSignature: [4, 4],
    measures: [
      {
        id: 'm1',
        timeSignature: [4, 4],
        beats: [
          // Beat 1 (16ths linear)
          createBeat('m1', 0, 4, [
            [{ pieceId: 'kick' }],
            [{ pieceId: 'snare' }],
            [{ pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', ghost: true }],
          ]),
          // Beat 2 (16ths linear toms)
          createBeat('m1', 1, 4, [
            [{ pieceId: 'kick' }],
            [{ pieceId: 'tom1' }],
            [{ pieceId: 'tom2' }],
            [{ pieceId: 'floorTom' }],
          ]),
          // Beat 3 (Sextuplet 6:4 burst!)
          createBeat('m1', 2, 6, [
            [{ pieceId: 'snare', accent: true }],
            [{ pieceId: 'tom1' }],
            [{ pieceId: 'tom2' }],
            [{ pieceId: 'floorTom' }],
            [{ pieceId: 'kick' }],
            [{ pieceId: 'kick' }],
          ]),
          // Beat 4 (Crash accent & resolve)
          createBeat('m1', 3, 4, [
            [{ pieceId: 'crash', accent: true }, { pieceId: 'kick', accent: true }],
            [{ pieceId: 'ride' }],
            [{ pieceId: 'snare', accent: true }],
            [{ pieceId: 'ride' }],
          ]),
        ],
      },
    ],
  },
  {
    id: 'odd-meter-7-8',
    name: 'Odd-Meter 7/8 Groove',
    category: 'Prog / Math Rock',
    description: 'Compás amalgama 7/8 agrupado en 2+2+3 con conducción de Ride y acentos asimétricos de caja.',
    bpm: 144,
    timeSignature: [7, 8],
    measures: [
      {
        id: 'm1',
        timeSignature: [7, 8],
        beats: [
          // 7 beats, each with 1 subdivision (straight 8ths in 7/8)
          createBeat('m1', 0, 1, [[{ pieceId: 'kick' }, { pieceId: 'ride', accent: true }]]),
          createBeat('m1', 1, 1, [[{ pieceId: 'ride' }]]),
          createBeat('m1', 2, 1, [[{ pieceId: 'snare', accent: true }, { pieceId: 'ride' }]]),
          createBeat('m1', 3, 1, [[{ pieceId: 'kick' }, { pieceId: 'ride' }]]),
          createBeat('m1', 4, 1, [[{ pieceId: 'kick' }, { pieceId: 'ride', accent: true }]]),
          createBeat('m1', 5, 1, [[{ pieceId: 'ride' }]]),
          createBeat('m1', 6, 1, [[{ pieceId: 'snare', accent: true }, { pieceId: 'ride' }]]),
        ],
      },
    ],
  },
  {
    id: 'polyrhythmic-quintuplet',
    name: 'Polyrhythmic Quintuplet Workout',
    category: 'Polyrhythms / Modern',
    description: 'Estudio de modulación métrica intercalando semicorcheas regulares con quintillos (5:4).',
    bpm: 104,
    timeSignature: [4, 4],
    measures: [
      {
        id: 'm1',
        timeSignature: [4, 4],
        beats: [
          // Beat 1: 16ths
          createBeat('m1', 0, 4, [
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', accent: true }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatClosed' }],
          ]),
          // Beat 2: Quintuplet 5:4!
          createBeat('m1', 1, 5, [
            [{ pieceId: 'snare', accent: true }],
            [{ pieceId: 'tom1' }],
            [{ pieceId: 'tom2' }],
            [{ pieceId: 'floorTom' }],
            [{ pieceId: 'kick' }],
          ]),
          // Beat 3: 16ths
          createBeat('m1', 2, 4, [
            [{ pieceId: 'kick' }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'hihatClosed' }],
            [{ pieceId: 'snare', accent: true }, { pieceId: 'hihatClosed' }],
            [{ pieceId: 'kick' }],
          ]),
          // Beat 4: Quintuplet 5:4 linear fill to crash!
          createBeat('m1', 3, 5, [
            [{ pieceId: 'tom1' }],
            [{ pieceId: 'snare', ghost: true }],
            [{ pieceId: 'tom2' }],
            [{ pieceId: 'kick' }],
            [{ pieceId: 'crash', accent: true }, { pieceId: 'kick', accent: true }],
          ]),
        ],
      },
    ],
  },
];
