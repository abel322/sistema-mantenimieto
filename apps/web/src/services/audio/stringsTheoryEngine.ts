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

// =======================================================
// 1. CATÁLOGO COMPLETO DE ESCALAS (12)
// A) 7 Modos Griegos + B) Familia Menor & Blues (5)
// =======================================================
export interface ScaleDef {
  id: ScaleType;
  name: string;
  category: 'Griegos' | 'Menor & Blues';
  formula: string;
  recommendedFor: string;
  semitones: number[];
}

export const SCALE_CATALOGUE: ScaleDef[] = [
  // A) MODOS GRIEGOS (Los 7 Modos de la Escala Mayor)
  {
    id: 'ionian',
    name: '1. Jónica / Mayor Natural',
    category: 'Griegos',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    recommendedFor: 'Tonalidad mayor, pop, baladas, consonancia',
    semitones: [0, 2, 4, 5, 7, 9, 11],
  },
  {
    id: 'dorian',
    name: '2. Dórica',
    category: 'Griegos',
    formula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    recommendedFor: 'Funk, Jazz Fusion, Soul, vamp con 6ª mayor',
    semitones: [0, 2, 3, 5, 7, 9, 10],
  },
  {
    id: 'phrygian',
    name: '3. Frigia',
    category: 'Griegos',
    formula: '1 - b2 - b3 - 4 - 5 - b6 - b7',
    recommendedFor: 'Metal, Flamenco, sonoridad oscura con 2ª menor',
    semitones: [0, 1, 3, 5, 7, 8, 10],
  },
  {
    id: 'lydian',
    name: '4. Lidia',
    category: 'Griegos',
    formula: '1 - 2 - 3 - #4 - 5 - 6 - 7',
    recommendedFor: 'Bandas sonoras, rock progresivo, 4ª aumentada',
    semitones: [0, 2, 4, 6, 7, 9, 11],
  },
  {
    id: 'mixolydian',
    name: '5. Mixolidia',
    category: 'Griegos',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    recommendedFor: 'Rock clásico, Blues, Funk con acorde dominante 7',
    semitones: [0, 2, 4, 5, 7, 9, 10],
  },
  {
    id: 'aeolian',
    name: '6. Eólica / Menor Natural',
    category: 'Griegos',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    recommendedFor: 'Rock, baladas menores, sonido melancólico',
    semitones: [0, 2, 3, 5, 7, 8, 10],
  },
  {
    id: 'locrian',
    name: '7. Locria',
    category: 'Griegos',
    formula: '1 - b2 - b3 - 4 - b5 - b6 - b7',
    recommendedFor: 'Tensión máxima, acorde m7b5, metal extremo',
    semitones: [0, 1, 3, 5, 6, 8, 10],
  },

  // B) FAMILIA MENOR & BLUES
  {
    id: 'harmonic_minor',
    name: '8. Menor Armónica',
    category: 'Menor & Blues',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    recommendedFor: 'Metal neoclásico, tango, cadencias V7-Im',
    semitones: [0, 2, 3, 5, 7, 8, 11],
  },
  {
    id: 'melodic_minor',
    name: '9. Menor Melódica (Jazz Minor)',
    category: 'Menor & Blues',
    formula: '1 - 2 - b3 - 4 - 5 - 6 - 7',
    recommendedFor: 'Jazz, fusión, acordes mMaj7 y dominantes alterados',
    semitones: [0, 2, 3, 5, 7, 9, 11],
  },
  {
    id: 'minor_pentatonic',
    name: '10. Pentatónica Menor',
    category: 'Menor & Blues',
    formula: '1 - b3 - 4 - 5 - b7',
    recommendedFor: 'Blues, Rock, solos expresivos universales',
    semitones: [0, 3, 5, 7, 10],
  },
  {
    id: 'major_pentatonic',
    name: '11. Pentatónica Mayor',
    category: 'Menor & Blues',
    formula: '1 - 2 - 3 - 5 - 6',
    recommendedFor: 'Country, Southern Rock, Soul, R&B brillante',
    semitones: [0, 2, 4, 7, 9],
  },
  {
    id: 'blues',
    name: '12. Blues (con Blue Note)',
    category: 'Menor & Blues',
    formula: '1 - b3 - 4 - b5 - 5 - b7',
    recommendedFor: 'Blues shuffle, Chicago, expresividad vocal',
    semitones: [0, 3, 5, 6, 7, 10],
  },
];

// =======================================================
// 2. CATÁLOGO EXPANDIDO DE ARPEGIOS (12)
// =======================================================
export interface ArpeggioDef {
  id: ArpeggioType;
  name: string;
  formula: string;
  context: string;
  semitones: number[];
  intervalLabels: string[];
}

export const ARPEGGIO_CATALOGUE: ArpeggioDef[] = [
  {
    id: 'major_triad',
    name: '1. Tríada Mayor',
    formula: '1 - 3 - 5',
    context: 'Consonancia mayor, pop & himnos',
    semitones: [0, 4, 7],
    intervalLabels: ['R', '3M', '5'],
  },
  {
    id: 'minor_triad',
    name: '2. Tríada Menor',
    formula: '1 - b3 - 5',
    context: 'Tonalidad menor, introspección',
    semitones: [0, 3, 7],
    intervalLabels: ['R', 'b3', '5'],
  },
  {
    id: 'dim_triad',
    name: '3. Tríada Disminuida',
    formula: '1 - b3 - b5',
    context: 'Tensión tríada, paso armónico',
    semitones: [0, 3, 6],
    intervalLabels: ['R', 'b3', 'b5'],
  },
  {
    id: 'aug_triad',
    name: '4. Tríada Aumentada',
    formula: '1 - 3 - #5',
    context: 'Tensión flotante simétrica',
    semitones: [0, 4, 8],
    intervalLabels: ['R', '3M', '#5'],
  },
  {
    id: 'dom7',
    name: '5. Dominante 7',
    formula: '1 - 3 - 5 - b7',
    context: 'Blues, Funk & cadencias V7',
    semitones: [0, 4, 7, 10],
    intervalLabels: ['R', '3M', '5', 'b7'],
  },
  {
    id: 'maj7',
    name: '6. Mayor 7 (Maj7)',
    formula: '1 - 3 - 5 - 7',
    context: 'Jazz, Bossa Nova & Neo-Soul',
    semitones: [0, 4, 7, 11],
    intervalLabels: ['R', '3M', '5', '7M'],
  },
  {
    id: 'm7',
    name: '7. Menor 7 (m7)',
    formula: '1 - b3 - 5 - b7',
    context: 'Soul, R&B & armonía modal menor',
    semitones: [0, 3, 7, 10],
    intervalLabels: ['R', 'b3', '5', 'b7'],
  },
  {
    id: 'm_maj7',
    name: '8. Menor / Maj7 (mMaj7)',
    formula: '1 - b3 - 5 - 7',
    context: 'Acorde James Bond, Jazz Minor, misterio',
    semitones: [0, 3, 7, 11],
    intervalLabels: ['R', 'b3', '5', '7M'],
  },
  {
    id: 'm7b5',
    name: '9. Semidisminuido (m7b5)',
    formula: '1 - b3 - b5 - b7',
    context: 'ii grado en modo menor, Jazz, Bossa',
    semitones: [0, 3, 6, 10],
    intervalLabels: ['R', 'b3', 'b5', 'b7'],
  },
  {
    id: 'dim7',
    name: '10. Disminuido Completo (dim7)',
    formula: '1 - b3 - b5 - bb7',
    context: 'Tensión simétrica de tono y medio',
    semitones: [0, 3, 6, 9],
    intervalLabels: ['R', 'b3', 'b5', '6'],
  },
  {
    id: 'dom9',
    name: '11. Dominante 9',
    formula: '1 - 3 - 5 - b7 - 9',
    context: 'Funk rítmico, James Brown, Blues 9',
    semitones: [0, 2, 4, 7, 10],
    intervalLabels: ['R', '9', '3M', '5', 'b7'],
  },
  {
    id: 'm9',
    name: '12. Menor 9 (m9)',
    formula: '1 - b3 - 5 - b7 - 9',
    context: 'Neo-Soul & baladas R&B sofisticadas',
    semitones: [0, 2, 3, 7, 10],
    intervalLabels: ['R', '9', 'b3', '5', 'b7'],
  },
];

// =======================================================
// 3. CATÁLOGO EXPANDIDO DE ACORDES / VOICINGS (12)
// =======================================================
export interface ChordTypeOption {
  id: ChordVoicingType;
  name: string;
  symbol: string;
  context: string;
}

export const CHORD_TYPE_OPTIONS: ChordTypeOption[] = [
  { id: 'major', name: 'Mayor', symbol: 'Maj', context: 'Tríada abierta y con cejilla' },
  { id: 'minor', name: 'Menor', symbol: 'm', context: 'Tríada abierta y con cejilla' },
  { id: 'dom7', name: 'Dominante 7', symbol: '7', context: 'Blues, Rock & Funk' },
  { id: 'maj7', name: 'Mayor 7 (Maj7)', symbol: 'Δ7', context: 'Jazz & Neo-Soul sofisticado' },
  { id: 'm7', name: 'Menor 7 (m7)', symbol: 'm7', context: 'Soul, R&B & Jazz menor' },
  { id: 'sus4', name: 'Suspendido 4', symbol: 'sus4', context: 'Tensión modal a resolver' },
  { id: 'sus2', name: 'Suspendido 2', symbol: 'sus2', context: 'Apertura acústica moderna' },
  { id: 'm7b5', name: 'Semidisminuido', symbol: 'm7b5', context: 'Grado ii en modo menor' },
  { id: 'dim7', name: 'Disminuido 7', symbol: 'dim7', context: 'Acorde simétrico de paso' },
  { id: 'add9', name: 'Add9', symbol: 'add9', context: 'Color pop & acústico brillante' },
  { id: 'hendrix7s9', name: 'Acorde Hendrix (7#9)', symbol: '7#9', context: 'Rock psicodélico & Funk' },
  { id: 'shell', name: 'Shell Voicing', symbol: 'shell', context: 'Tónica + 3ª + 7ª para comping' },
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
  const r6Raw = (rootIdx - 4 + 12) % 12;
  const r6 = r6Raw === 0 ? 12 : r6Raw;

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
    } else if (chordType === 'sus2') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: r6 + 2, finger: 3, interval: '5' },
        { stringIndex: 3, fret: r6 + 2, finger: 4, interval: 'R' },
        { stringIndex: 2, fret: Math.max(0, r6 - 1), finger: 1, interval: '2' },
        { stringIndex: 1, fret: r6, finger: 1, interval: '5' },
        { stringIndex: 0, fret: r6, finger: 1, interval: 'R' },
      ];
    } else if (chordType === 'm7b5') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: null, finger: null, interval: '' },
        { stringIndex: 3, fret: r6, finger: 2, interval: 'b7' },
        { stringIndex: 2, fret: r6, finger: 3, interval: 'b3' },
        { stringIndex: 1, fret: Math.max(0, r6 - 1), finger: 1, interval: 'b5' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
      ];
    } else if (chordType === 'dim7') {
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: null, finger: null, interval: '' },
        { stringIndex: 3, fret: Math.max(0, r6 - 1), finger: 1, interval: 'bb7' },
        { stringIndex: 2, fret: r6, finger: 2, interval: 'b3' },
        { stringIndex: 1, fret: Math.max(0, r6 - 1), finger: 1, interval: 'b5' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
      ];
    } else if (chordType === 'hendrix7s9') {
      // Classic Jimi Hendrix 7#9 on 5th string (or low 6th)
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 2, interval: 'R' },
        { stringIndex: 3, fret: Math.max(0, r5 - 1), finger: 1, interval: '3M' },
        { stringIndex: 2, fret: r5, finger: 3, interval: 'b7' },
        { stringIndex: 1, fret: r5 + 1, finger: 4, interval: '#9' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
      ];
    } else if (chordType === 'shell') {
      // Shell voicing (R + 7 + 3)
      notes = [
        { stringIndex: 5, fret: r6, finger: 1, interval: 'R' },
        { stringIndex: 4, fret: null, finger: null, interval: '' },
        { stringIndex: 3, fret: r6, finger: 2, interval: 'b7' },
        { stringIndex: 2, fret: r6 + 1, finger: 3, interval: '3M' },
        { stringIndex: 1, fret: null, finger: null, interval: '' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
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
    } else if (chordType === 'sus2') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 2, finger: 2, interval: '5' },
        { stringIndex: 2, fret: r5 + 2, finger: 3, interval: 'R' },
        { stringIndex: 1, fret: r5, finger: 1, interval: '2' },
        { stringIndex: 0, fret: r5, finger: 1, interval: '5' },
      ];
    } else if (chordType === 'hendrix7s9') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 2, interval: 'R' },
        { stringIndex: 3, fret: Math.max(0, r5 - 1), finger: 1, interval: '3M' },
        { stringIndex: 2, fret: r5, finger: 3, interval: 'b7' },
        { stringIndex: 1, fret: r5 + 1, finger: 4, interval: '#9' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
      ];
    } else if (chordType === 'm7b5') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: r5 + 1, finger: 2, interval: 'b5' },
        { stringIndex: 2, fret: r5, finger: 1, interval: 'b7' },
        { stringIndex: 1, fret: r5 + 1, finger: 3, interval: 'b3' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
      ];
    } else if (chordType === 'dim7') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 2, interval: 'R' },
        { stringIndex: 3, fret: r5 + 1, finger: 3, interval: 'b5' },
        { stringIndex: 2, fret: Math.max(0, r5 - 1), finger: 1, interval: 'bb7' },
        { stringIndex: 1, fret: r5 + 1, finger: 4, interval: 'b3' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
      ];
    } else if (chordType === 'shell') {
      notes = [
        { stringIndex: 5, fret: null, finger: null, interval: '' },
        { stringIndex: 4, fret: r5, finger: 1, interval: 'R' },
        { stringIndex: 3, fret: null, finger: null, interval: '' },
        { stringIndex: 2, fret: r5, finger: 2, interval: 'b7' },
        { stringIndex: 1, fret: r5 + 2, finger: 3, interval: '3M' },
        { stringIndex: 0, fret: null, finger: null, interval: '' },
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
    // Open Chords
    if (key === 'C') {
      if (chordType === 'hendrix7s9') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 3, finger: 2, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 1, interval: '3M' },
          { stringIndex: 2, fret: 3, finger: 3, interval: 'b7' },
          { stringIndex: 1, fret: 4, finger: 4, interval: '#9' },
          { stringIndex: 0, fret: null, finger: null, interval: '' },
        ];
      } else if (chordType === 'major') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 3, finger: 3, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 2, interval: '3M' },
          { stringIndex: 2, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 1, fret: 1, finger: 1, interval: 'R' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '3M' },
        ];
      } else if (chordType === 'sus2') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 3, finger: 3, interval: 'R' },
          { stringIndex: 3, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 2, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 1, fret: 1, finger: 1, interval: 'R' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '2' },
        ];
      } else {
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
      if (chordType === 'sus2') {
        notes = [
          { stringIndex: 5, fret: null, finger: null, interval: '' },
          { stringIndex: 4, fret: 0, finger: 0, interval: 'R' },
          { stringIndex: 3, fret: 2, finger: 1, interval: '5' },
          { stringIndex: 2, fret: 2, finger: 2, interval: 'R' },
          { stringIndex: 1, fret: 0, finger: 0, interval: '2' },
          { stringIndex: 0, fret: 0, finger: 0, interval: '5' },
        ];
      } else if (chordType === 'minor' || chordType === 'm7') {
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
    } else if (key === 'E') {
      if (chordType === 'hendrix7s9') {
        notes = [
          { stringIndex: 5, fret: 0, finger: 0, interval: 'R' },
          { stringIndex: 4, fret: 7, finger: 2, interval: 'R' },
          { stringIndex: 3, fret: 6, finger: 1, interval: '3M' },
          { stringIndex: 2, fret: 7, finger: 3, interval: 'b7' },
          { stringIndex: 1, fret: 8, finger: 4, interval: '#9' },
          { stringIndex: 0, fret: null, finger: null, interval: '' },
        ];
      } else if (chordType === 'sus2') {
        notes = [
          { stringIndex: 5, fret: 0, finger: 0, interval: 'R' },
          { stringIndex: 4, fret: 2, finger: 1, interval: '5' },
          { stringIndex: 3, fret: 4, finger: 3, interval: '2' },
          { stringIndex: 2, fret: 4, finger: 4, interval: '5' },
          { stringIndex: 1, fret: 0, finger: 0, interval: '5' },
          { stringIndex: 0, fret: 0, finger: 0, interval: 'R' },
        ];
      } else if (chordType === 'minor' || chordType === 'm7') {
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
    } else {
      // General open/low CAGED position
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
// -------------------------------------------------------------
function getBassVoicing(
  instrument: InstrumentType,
  key: MusicalKey,
  rootIdx: number,
  chordType: ChordVoicingType,
  shapeId: VoicingShapeId
): ChordVoicingDef {
  const is5 = instrument === 'bass_5';
  const rE = (rootIdx - 4 + 12) % 12;
  const rootFretE = rE === 0 ? 12 : rE;

  const rA = (rootIdx - 9 + 12) % 12;
  const rootFretA = rA === 0 ? 12 : rA;

  const isMinor =
    chordType === 'minor' || chordType === 'm7' || chordType === 'm7b5' || chordType === 'dim7';
  const tenthOffset = isMinor ? 3 : 4;

  let notes: VoicingNote[] = [];

  if (shapeId === 'open') {
    notes = [
      { stringIndex: 0, fret: (rootFretE + tenthOffset) % 12, finger: 2, interval: isMinor ? 'b3' : '3M' },
      { stringIndex: 1, fret: rootFretE + 2, finger: 4, interval: '5' },
      { stringIndex: 2, fret: null, finger: null, interval: '' },
      { stringIndex: 3, fret: rootFretE, finger: 1, interval: 'R' },
    ];
  } else if (shapeId === 'root6_barre') {
    notes = [
      { stringIndex: 0, fret: rootFretE + (tenthOffset - 1), finger: 3, interval: isMinor ? 'b3' : '3M' },
      { stringIndex: 1, fret: null, finger: null, interval: '' },
      { stringIndex: 2, fret: null, finger: null, interval: '' },
      { stringIndex: 3, fret: rootFretE, finger: 1, interval: 'R' },
    ];
  } else if (shapeId === 'root5_barre') {
    notes = [
      { stringIndex: 0, fret: rootFretA + (tenthOffset - 1), finger: 4, interval: isMinor ? 'b3' : '3M' },
      { stringIndex: 1, fret: rootFretA + 2, finger: 3, interval: '5' },
      { stringIndex: 2, fret: rootFretA, finger: 1, interval: 'R' },
      { stringIndex: 3, fret: null, finger: null, interval: '' },
    ];
  } else {
    // Shell / Power chord
    notes = [
      { stringIndex: 0, fret: rootFretA + 2, finger: 4, interval: 'R' },
      { stringIndex: 1, fret: rootFretA + 2, finger: 3, interval: '5' },
      { stringIndex: 2, fret: rootFretA, finger: 1, interval: 'R' },
      { stringIndex: 3, fret: null, finger: null, interval: '' },
    ];
  }

  if (is5) {
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
