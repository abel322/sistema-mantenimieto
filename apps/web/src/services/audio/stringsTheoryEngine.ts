import {
  InstrumentType,
  MusicalKey,
  ScaleType,
  ArpeggioType,
  ChordVoicingType,
  VoicingShapeId,
  ChordVoicingDef,
  VoicingNote,
} from '@/types/strings';
import { calculateFretNote } from './stringsAudioEngine';
import { getInstrumentStrings } from '@/components/studio/strings/InteractiveFretboard';

// Semitone distances from chromatic C
export const CHROMATIC_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  DB: 1,
  D: 2,
  'D#': 3,
  EB: 3,
  E: 4,
  F: 5,
  'F#': 6,
  GB: 6,
  G: 7,
  'G#': 8,
  AB: 8,
  A: 9,
  'A#': 10,
  BB: 10,
  B: 11,
};

export const CHROMATIC_KEYS: MusicalKey[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const INTERVAL_NAMES: Record<number, string> = {
  0: 'R',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3M',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7M',
};

// 1. SCALE CATALOGUE (8 Scales)
export interface ScaleDef {
  id: ScaleType;
  name: string;
  formula: string;
  recommendedFor: string;
  semitones: number[];
}

export const SCALE_CATALOGUE: ScaleDef[] = [
  {
    id: 'minor_pentatonic',
    name: 'Pentatónica Menor',
    formula: '1 - b3 - 4 - 5 - b7',
    recommendedFor: 'Rock, Blues, Funk & Solos',
    semitones: [0, 3, 5, 7, 10],
  },
  {
    id: 'major_pentatonic',
    name: 'Pentatónica Mayor',
    formula: '1 - 2 - 3 - 5 - 6',
    recommendedFor: 'Soul, Country, R&B, Pop',
    semitones: [0, 2, 4, 7, 9],
  },
  {
    id: 'blues',
    name: 'Blues (con Blue Note)',
    formula: '1 - b3 - 4 - b5 - 5 - b7',
    recommendedFor: 'Blues clásico, Chicago & Shuffle',
    semitones: [0, 3, 5, 6, 7, 10],
  },
  {
    id: 'major',
    name: 'Escala Mayor (Jónica)',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    recommendedFor: 'Baladas, Armonía tonal clásica',
    semitones: [0, 2, 4, 5, 7, 9, 11],
  },
  {
    id: 'minor',
    name: 'Menor Natural (Eólica)',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    recommendedFor: 'Rock melódico, Metal, Pop',
    semitones: [0, 2, 3, 5, 7, 8, 10],
  },
  {
    id: 'dorian',
    name: 'Dórica (Funk Groove)',
    formula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    recommendedFor: 'Líneas de Bajo Funk, Jazz Fusion',
    semitones: [0, 2, 3, 5, 7, 9, 10],
  },
  {
    id: 'mixolydian',
    name: 'Mixolidia (Rock / Blues)',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    recommendedFor: 'Riffs con acorde dominante 7',
    semitones: [0, 2, 4, 5, 7, 9, 10],
  },
  {
    id: 'harmonic_minor',
    name: 'Menor Armónica',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    recommendedFor: 'Neoclásico, Flamenco & Tensión V7',
    semitones: [0, 2, 3, 5, 7, 8, 11],
  },
];

// 2. ARPEGGIO CATALOGUE (8 Melodic Arpeggios)
export interface ArpeggioDef {
  id: ArpeggioType;
  name: string;
  formula: string;
  semitones: number[];
  intervalLabels: string[];
}

export const ARPEGGIO_CATALOGUE: ArpeggioDef[] = [
  {
    id: 'major_triad',
    name: 'Tríada Mayor',
    formula: '1 - 3 - 5',
    semitones: [0, 4, 7],
    intervalLabels: ['R', '3M', '5'],
  },
  {
    id: 'minor_triad',
    name: 'Tríada Menor',
    formula: '1 - b3 - 5',
    semitones: [0, 3, 7],
    intervalLabels: ['R', 'b3', '5'],
  },
  {
    id: 'maj7',
    name: 'Maj7 (Mayor 7)',
    formula: '1 - 3 - 5 - 7',
    semitones: [0, 4, 7, 11],
    intervalLabels: ['R', '3M', '5', '7M'],
  },
  {
    id: 'dom7',
    name: 'Dominante 7',
    formula: '1 - 3 - 5 - b7',
    semitones: [0, 4, 7, 10],
    intervalLabels: ['R', '3M', '5', 'b7'],
  },
  {
    id: 'm7',
    name: 'Menor 7 (m7)',
    formula: '1 - b3 - 5 - b7',
    semitones: [0, 3, 7, 10],
    intervalLabels: ['R', 'b3', '5', 'b7'],
  },
  {
    id: 'm7b5',
    name: 'm7b5 (Semidisminuido)',
    formula: '1 - b3 - b5 - b7',
    semitones: [0, 3, 6, 10],
    intervalLabels: ['R', 'b3', 'b5', 'b7'],
  },
  {
    id: 'dim7',
    name: 'Disminuido 7 (Dim7)',
    formula: '1 - b3 - b5 - bb7',
    semitones: [0, 3, 6, 9],
    intervalLabels: ['R', 'b3', 'b5', '6'],
  },
  {
    id: 'aug',
    name: 'Aumentado (Aug)',
    formula: '1 - 3 - #5',
    semitones: [0, 4, 8],
    intervalLabels: ['R', '3M', '#5'],
  },
];

// 3. CHORD VOICINGS SELECTORS
export interface ChordTypeOption {
  id: ChordVoicingType;
  name: string;
  symbol: string;
}

export const CHORD_TYPE_OPTIONS: ChordTypeOption[] = [
  { id: 'major', name: 'Mayor', symbol: 'Maj' },
  { id: 'minor', name: 'Menor', symbol: 'm' },
  { id: 'dom7', name: 'Dominante 7', symbol: '7' },
  { id: 'maj7', name: 'Maj7', symbol: 'Δ7' },
  { id: 'm7', name: 'Menor 7', symbol: 'm7' },
  { id: 'sus4', name: 'Sus4', symbol: 'sus4' },
  { id: 'add9', name: 'Add9', symbol: 'add9' },
];

export interface VoicingShapeOption {
  id: VoicingShapeId;
  name: string;
  shortDesc: string;
}

export const VOICING_SHAPE_OPTIONS: VoicingShapeOption[] = [
  { id: 'open', name: 'Abierto / Traste 0', shortDesc: 'Cuerdas al aire o posición 1' },
  { id: 'root6_barre', name: 'Cejilla en 6ª Cuerda (Forma E)', shortDesc: 'Raíz en cuerda grave Mi' },
  { id: 'root5_barre', name: 'Cejilla en 5ª Cuerda (Forma A)', shortDesc: 'Raíz en cuerda La' },
  { id: 'triad_high', name: 'Tríada Cuerdas Agudas (1-2-3)', shortDesc: 'Postura melódica superior' },
  { id: 'drop2', name: 'Drop 2 (Cuerdas 1 a 4)', shortDesc: 'Armonía moderna & Jazz' },
];

/**
 * Calculates genuine pedagogical guitar or bass chord voicings (1 note per string max)
 */
export function getChordVoicing(
  instrument: InstrumentType,
  key: MusicalKey,
  chordType: ChordVoicingType,
  shapeId: VoicingShapeId
): ChordVoicingDef {
  const rootIdx = CHROMATIC_INDEX[key] ?? 0;
  const isGuitar = instrument === 'guitar_6';

  if (isGuitar) {
    return getGuitarVoicing(key, rootIdx, chordType, shapeId);
  } else {
    return getBassVoicing(instrument, key, rootIdx, chordType, shapeId);
  }
}

// -------------------------------------------------------------
// GUITAR 6 VOICINGS
// String Index Order (top to bottom on fretboard):
// 0: high e (E4)
// 1: B (B3)
// 2: G (G3)
// 3: D (D3)
// 4: A (A2)
// 5: low E (E2)
// -------------------------------------------------------------
function getGuitarVoicing(
  key: MusicalKey,
  rootIdx: number,
  chordType: ChordVoicingType,
  shapeId: VoicingShapeId
): ChordVoicingDef {
  // Fret on 6th string (low E): E is 4. R6 = (rootIdx - 4 + 12) % 12
  const r6Raw = (rootIdx - 4 + 12) % 12;
  const r6 = r6Raw === 0 ? 12 : r6Raw;

  // Fret on 5th string (A): A is 9. R5 = (rootIdx - 9 + 12) % 12
  const r5Raw = (rootIdx - 9 + 12) % 12;
  const r5 = r5Raw === 0 ? 12 : r5Raw;

  let notes: VoicingNote[] = [];

  if (shapeId === 'root6_barre') {
    // Barre form E on 6th string
    if (chordType === 'major') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: r6 + 2, finger: 3, interval: '5' },
        { stringIndex: 3, fret: r6 + 2, finger: 4, interval: 'R' },
        { stringIndex: 2, fret: r6 + 1, finger: 2, interval: '3M' },
        { stringIndex: 1, fret: r6, finger: 1, interval: '5' },
        { stringIndex: 0, fret: r6, finger: 1, interval: 'R' },
      ];
    } else if (chordType === 'minor') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: r6 + 2, finger: 3, interval: '5' },
        { stringIndex: 3, fret: r6 + 2, finger: 4, interval: 'R' },
        { stringIndex: 2, fret: r6, finger: 1, interval: 'b3' },
        { stringIndex: 1, fret: r6, finger: 1, interval: '5' },
        { stringIndex: 0, fret: r6, finger: 1, interval: 'R' },
      ];
    } else if (chordType === 'dom7') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: r6 + 2, finger: 3, interval: '5' },
        { stringIndex: 3, fret: r6, finger: 1, interval: 'b7' },
        { stringIndex: 2, fret: r6 + 1, finger: 2, interval: '3M' },
        { stringIndex: 1, fret: r6, finger: 1, interval: '5' },
        { stringIndex: 0, fret: r6, finger: 1, interval: 'R' },
      ];
    } else if (chordType === 'maj7') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: null, finger: null, interval: '' },
        { stringIndex: 3, fret: r6 + 1, finger: 3, interval: '7M' },
        { stringIndex: 2, fret: r6 + 1, finger: 4, interval: '3M' },
        { stringIndex: 1, fret: r6, finger: 2, interval: '5' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
      ];
    } else if (chordType === 'm7') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: r6 + 2, finger: 3, interval: '5' },
        { stringIndex: 3, fret: r6, finger: 1, interval: 'b7' },
        { stringIndex: 2, fret: r6, finger: 1, interval: 'b3' },
        { stringIndex: 1, fret: r6, finger: 1, interval: '5' },
        { stringIndex: 0, fret: r6, finger: 1, interval: 'R' },
      ];
    } else if (chordType === 'sus4') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: r6 + 2, finger: 3, interval: '5' },
        { stringIndex: 3, fret: r6 + 2, finger: 4, interval: 'R' },
        { stringIndex: 2, fret: r6 + 2, finger: 4, interval: '4' },
        { stringIndex: 1, fret: r6, finger: 1, interval: '5' },
        { stringIndex: 0, fret: r6, finger: 1, interval: 'R' },
      ];
    } else {
      // add9
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: r6 + 2, finger: 3, interval: '5' },
        { stringIndex: 3, fret: r6 + 2, finger: 4, interval: 'R' },
        { stringIndex: 2, fret: r6 + 1, finger: 2, interval: '3M' },
        { stringIndex: 1, fret: r6 + 2, finger: 4, interval: '9' },
        { stringIndex: 0, fret: r6, finger: 1, interval: 'R' },
      ];
    }
  } else if (shapeId === 'root5_barre') {
    // Barre form A on 5th string (6th string muted)
    if (chordType === 'major') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 2, interval: '5' },
        { stringIndex: 2, fret: r5 + 2, finger: 3, interval: 'R' },
        { stringIndex: 1, fret: r5 + 2, finger: 4, interval: '3M' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    } else if (chordType === 'minor') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 3, interval: '5' },
        { stringIndex: 2, fret: r5 + 2, finger: 4, interval: 'R' },
        { stringIndex: 1, fret: r5 + 1, finger: 2, interval: 'b3' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    } else if (chordType === 'dom7') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 3, interval: '5' },
        { stringIndex: 2, fret: r5, finger: 1, interval: 'b7' },
        { stringIndex: 1, fret: r5 + 2, finger: 4, interval: '3M' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    } else if (chordType === 'maj7') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 3, interval: '5' },
        { stringIndex: 2, fret: r5 + 1, finger: 2, interval: '7M' },
        { stringIndex: 1, fret: r5 + 2, finger: 4, interval: '3M' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    } else if (chordType === 'm7') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 3, interval: '5' },
        { stringIndex: 2, fret: r5, finger: 1, interval: 'b7' },
        { stringIndex: 1, fret: r5 + 1, finger: 2, interval: 'b3' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    } else if (chordType === 'sus4') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 2, interval: '5' },
        { stringIndex: 2, fret: r5 + 2, finger: 3, interval: 'R' },
        { stringIndex: 1, fret: r5 + 3, finger: 4, interval: '4' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    } else {
      // add9
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 2, interval: '5' },
        { stringIndex: 2, fret: r5 + 4, finger: 4, interval: '9' },
        { stringIndex: 1, fret: r5 + 2, finger: 3, interval: '3M' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    }
  } else if (shapeId === 'open') {
    // Open Chords (C, A, G, E, D open positions or low CAGED position)
    if (key === 'C') {
      if (chordType === 'major') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 3, finger: 3, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 2, interval: '3M' },
          { stringIndex: 2, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 1, fret: 1, finger: 1, interval: 'R' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '3M' },
        ];
      } else if (chordType === 'dom7') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 3, finger: 3, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 2, interval: '3M' },
          { stringIndex: 2, fret: 3, finger: 4, interval: 'b7' },
          { stringIndex: 1, fret: 1, finger: 1, interval: 'R' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '3M' },
        ];
      } else if (chordType === 'maj7') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 3, finger: 3, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 2, interval: '3M' },
          { stringIndex: 2, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 1, fret: 0, finger: 0, interval: '7M' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '3M' },
        ];
      } else {
        // Cm open / low
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 3, finger: 3, interval: 'R' },
          { stringIndex: 3, fret: 1, finger: 1, interval: 'b3' },
          { stringIndex: 2, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 1, fret: 1, finger: 2, interval: 'R' },
          { stringIndex: 0, fret: null, finger: null, interval: '' },
        ];
      }
    } else if (key === 'A') {
      if (chordType === 'minor' || chordType === 'm7') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 0, finger: 0, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 2, interval: '5' },
          { stringIndex: 2, fret: 2, finger: 3, interval: 'R' },
          { stringIndex: 1, fret: 1, finger: 1, interval: 'b3' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '5' },
        ];
      } else {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 0, finger: 0, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 1, interval: '5' },
          { stringIndex: 2, fret: 2, finger: 2, interval: 'R' },
          { stringIndex: 1, fret: 2, finger: 3, interval: '3M' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '5' },
        ];
      }
    } else if (key === 'G') {
      notes = [
        { stringIndex: 5, fret: 3, finger: 2, interval: 'R' },
        { stringIndex: 4, fret: 2, finger: 1, interval: '3M' },
        { stringIndex: 3, fret: 0, finger: 0, interval: '5' },
        { stringIndex: 2, fret: 0, finger: 0, interval: 'R' },
        { stringIndex: 1, fret: 0, finger: 0, interval: '3M' },
        { stringIndex: 0, fret: 3, finger: 3, interval: 'R' },
      ];
    } else if (key === 'E') {
      if (chordType === 'minor' || chordType === 'm7') {
        notes = [
          { stringIndex: 5, fret: 0, finger: 0, interval: 'R' },
          { stringIndex: 4, fret: 2, finger: 2, interval: '5' },
          { stringIndex: 3, fret: 2, finger: 3, interval: 'R' },
          { stringIndex: 2, fret: 0, finger: 0, interval: 'b3' },
          { stringIndex: 1, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 0, fret: 0, finger: 0, interval: 'R' },
        ];
      } else {
        notes = [
          { stringIndex: 5, fret: 0, finger: 0, interval: 'R' },
          { stringIndex: 4, fret: 2, finger: 2, interval: '5' },
          { stringIndex: 3, fret: 2, finger: 3, interval: 'R' },
          { stringIndex: 2, fret: 1, finger: 1, interval: '3M' },
          { stringIndex: 1, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 0, fret: 0, finger: 0, interval: 'R' },
        ];
      }
    } else if (key === 'D') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: null, finger: null, interval: '' },
        { stringIndex: 3, fret: 0, finger: 0, interval: 'R' },
        { stringIndex: 2, fret: 2, finger: 1, interval: '5' },
        { stringIndex: 1, fret: 3, finger: 3, interval: 'R' },
        { stringIndex: 0, fret: 2, finger: 2, interval: '3M' },
      ];
    } else {
      // General low-position barre (Form A at low frets)
      const r = r5Raw <= 5 ? r5Raw : r6Raw <= 5 ? r6Raw : 1;
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r + 2, finger: 3, interval: '5' },
        { stringIndex: 2, fret: r + 2, finger: 4, interval: 'R' },
        { stringIndex: 1, fret: chordType.includes('min') ? r + 1 : r + 2, finger: 2, interval: '3' },
        { stringIndex: 0, fret: r, finger: 1, interval: '5' },
      ];
    }
  } else if (shapeId === 'triad_high') {
    // Triads on strings 1, 2, 3 (strings 2, 1, 0)
    const baseF = r6Raw;
    notes = [
      { stringIndex: 5, fret: null, finger: null, interval: '' },
      { stringIndex: 4, fret: null, finger: null, interval: '' },
      { stringIndex: 3, fret: null, finger: null, interval: '' },
      { stringIndex: 2, fret: baseF + 1, finger: 2, interval: '3M' },
      { stringIndex: 1, fret: baseF, finger: 1, interval: '5' },
      { stringIndex: 0, fret: baseF, finger: 1, interval: 'R' },
    ];
  } else {
    // Drop 2 (strings 3, 2, 1, 0)
    const baseF = r5Raw;
    notes = [
      { stringIndex: 5, fret: null, finger: null, interval: '' },
      { stringIndex: 4, fret: null, finger: null, interval: '' },
      { stringIndex: 3, fret: baseF, finger: 1, interval: 'R' },
      { stringIndex: 2, fret: baseF + 2, finger: 3, interval: '5' },
      { stringIndex: 1, fret: baseF + 1, finger: 2, interval: '7M' },
      { stringIndex: 0, fret: baseF + 2, finger: 4, interval: '3M' },
    ];
  }

  return {
    id: `guitar-${key}-${chordType}-${shapeId}`,
    name: `${key} ${chordType.toUpperCase()}`,
    shapeId,
    description: `Postura ${shapeId.replace('_', ' ')} para guitarra`,
    notes,
  };
}

// -------------------------------------------------------------
// BASS 4 / 5 VOICINGS
// String Index Order:
// Bass 4: 0: G (G2), 1: D (D2), 2: A (A1), 3: E (E1)
// Bass 5: 0: G (G2), 1: D (D2), 2: A (A1), 3: E (E1), 4: B (B0)
// -------------------------------------------------------------
function getBassVoicing(
  instrument: InstrumentType,
  key: MusicalKey,
  rootIdx: number,
  chordType: ChordVoicingType,
  shapeId: VoicingShapeId
): ChordVoicingDef {
  const is5 = instrument === 'bass_5';
  // Root fret on E string (index 3)
  const rE = (rootIdx - 4 + 12) % 12;
  const rootFretE = rE === 0 ? 12 : rE;

  // Root fret on A string (index 2)
  const rA = (rootIdx - 9 + 12) % 12;
  const rootFretA = rA === 0 ? 12 : rA;

  const isMinor = chordType === 'minor' || chordType === 'm7';
  const tenthOffset = isMinor ? 3 : 4; // 10th interval = 1 octave + 3rd

  let notes: VoicingNote[] = [];

  if (shapeId === 'open') {
    // Open position bass chord (Root + 5th / Octave)
    notes = [
      { stringIndex: 0, fret: (rootFretE + tenthOffset) % 12, finger: 2, interval: isMinor ? 'b3' : '3M' },
      { stringIndex: 1, fret: rootFretE + 2, finger: 4, interval: '5' },
      { stringIndex: 2, fret: null, finger: null, interval: '' },
      { stringIndex: 3, fret: rootFretE, finger: 1, interval: 'R' },
    ];
  } else if (shapeId === 'root6_barre') {
    // Tenths voicing (Root on E string + 10th on G string): Classic bass groove
    notes = [
      { stringIndex: 0, fret: rootFretE + (tenthOffset - 1), finger: 3, interval: isMinor ? 'b3' : '3M' },
      { stringIndex: 1, fret: null, finger: null, interval: '' },
      { stringIndex: 2, fret: null, finger: null, interval: '' },
      { stringIndex: 3, fret: rootFretE, finger: 1, interval: 'R' },
    ];
  } else if (shapeId === 'root5_barre') {
    // Tenths on A string (Root on A string + 10th on G string)
    notes = [
      { stringIndex: 0, fret: rootFretA + (tenthOffset - 1), finger: 4, interval: isMinor ? 'b3' : '3M' },
      { stringIndex: 1, fret: rootFretA + 2, finger: 3, interval: '5' },
      { stringIndex: 2, fret: rootFretA, finger: 1, interval: 'R' },
      { stringIndex: 3, fret: null, finger: null, interval: '' },
    ];
  } else {
    // Power Chord / High triad (Root + 5th + Octave)
    notes = [
      { stringIndex: 0, fret: rootFretA + 2, finger: 4, interval: 'R' },
      { stringIndex: 1, fret: rootFretA + 2, finger: 3, interval: '5' },
      { stringIndex: 2, fret: rootFretA, finger: 1, interval: 'R' },
      { stringIndex: 3, fret: null, finger: null, interval: '' },
    ];
  }

  if (is5) {
    // Add 5th string (B string) as muted
    notes.push({ stringIndex: 4, fret: null, finger: null, interval: '' });
  }

  return {
    id: `bass-${key}-${chordType}-${shapeId}`,
    name: `${key} ${chordType.toUpperCase()} (Bajo)`,
    shapeId,
    description: `Voicing para bajo con raíz en ${key}`,
    notes,
  };
}
