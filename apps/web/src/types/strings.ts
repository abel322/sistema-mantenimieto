export type InstrumentType = 'bass_4' | 'bass_5' | 'guitar_6';

export type TuningId = 'standard' | 'drop_d' | 'half_step_down';

export interface TuningConfig {
  id: TuningId;
  name: string;
  notes: string[];
  stringPitches: string[];
}

export type FretboardOverlayMode = 'notes' | 'intervals' | 'fingering';

// 5 distinct pedagogical theory modes:
// 1. Free Mode (visualize whatever overlay without filtering)
// 2. Scales (12 complete scales: 7 Greek modes + Minor & Blues family)
// 3. Arpeggios (12 melodic arpeggios, with range box and audition)
// 4. Chords / Voicings (12 real hand fingerings with shapes, mute/open indicators, strum)
// 5. Progressions & Cadences (10 harmonic progressions synced with fretboard and timeline)
export type TheoryMode = 'free' | 'scale' | 'arpeggio' | 'chord_voicing' | 'progression';

export type MusicalKey =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B';

// 12 Scales: 7 Greek Modes + 5 Minor & Blues
export type ScaleType =
  | 'ionian'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'aeolian'
  | 'locrian'
  | 'harmonic_minor'
  | 'melodic_minor'
  | 'minor_pentatonic'
  | 'major_pentatonic'
  | 'blues'
  | 'major' // alias for ionian
  | 'minor'; // alias for aeolian

// 12 Arpeggio Types
export type ArpeggioType =
  | 'major_triad'
  | 'minor_triad'
  | 'dim_triad'
  | 'aug_triad'
  | 'dom7'
  | 'maj7'
  | 'm7'
  | 'm_maj7'
  | 'm7b5'
  | 'dim7'
  | 'dom9'
  | 'm9'
  | 'aug'; // alias for aug_triad

// 12 Chord Voicing Families
export type ChordVoicingType =
  | 'major'
  | 'minor'
  | 'dom7'
  | 'maj7'
  | 'm7'
  | 'sus4'
  | 'sus2'
  | 'm7b5'
  | 'dim7'
  | 'add9'
  | 'hendrix7s9'
  | 'shell';

// Backward compatibility alias
export type ChordType = ChordVoicingType;

// Voicing Shapes
export type VoicingShapeId =
  | 'open'
  | 'root6_barre'
  | 'root5_barre'
  | 'triad_high'
  | 'drop2';

export interface VoicingNote {
  stringIndex: number; // 0 (highest string) to N-1 (lowest)
  fret: number | null; // null = muted (✕), 0 = open (○), 1..24 = fretted
  finger: number | null; // 1, 2, 3, 4 or null (0 for open)
  interval: string; // 'R', '3M', 'b3', '5', '7M', 'b7', '#9', etc.
}

export interface ChordVoicingDef {
  id: string;
  name: string;
  shapeId: VoicingShapeId;
  description: string;
  notes: VoicingNote[]; // 1 entry per string on instrument
}

export type BassArticulation = 'normal' | 'slap' | 'pop' | 'ghost';
export type GuitarArticulation = 'normal' | 'downstroke' | 'upstroke' | 'palmmute';
export type StringArticulation = BassArticulation | GuitarArticulation;

export interface SequencerStepCell {
  fret: number | null; // null means rest / no hit, 0 is open string, 1-24 are frets
  articulation?: StringArticulation;
  finger?: number; // suggested 1, 2, 3, 4
  duration?: string; // e.g. '4n', '8n', '16n', '32n', '8t', '4t'
  timeOffsetRatio?: number; // fractional step micro-timing (-0.5 to 0.5) for tuplets
  tupletBadge?: string; // '3', '5', '6'
  chordName?: string; // e.g. 'Dm7', 'G7'
}

export interface StringTrack {
  stringIndex: number; // 0 is highest string, N-1 is lowest
  stringName: string; // e.g. "G", "D", "A", "E"
  basePitch: string; // e.g. "G2"
  gauge: number; // string thickness in pt
  steps: SequencerStepCell[];
}

export interface StringsPattern {
  id: string;
  name: string;
  instrument: InstrumentType;
  tuning: TuningId;
  bpm: number;
  measuresCount: number; // 1, 2, 3, 4
  tracks: StringTrack[];
}

export type PracticePattern = 'ascending' | 'descending' | 'up_down' | 'broken';

// Regular and Irregular / Tuplets subdivisions
export type PracticeSubdivision =
  | '4n' // 1/4 Negras (4 notas/compás)
  | '8n' // 1/8 Corcheas (8 notas/compás)
  | '16n' // 1/16 Semicorcheas (16 notas/compás)
  | '32n' // 1/32 Fusas (32 notas/compás)
  | 'quarter_triplet' // 3:2 Tresillo de Negras (6 notas/compás)
  | 'eighth_triplet' // 3:2 Tresillo de Corcheas (12 notas/compás)
  | 'sextuplet' // 6:4 Seiscillos (24 notas/compás)
  | 'quintuplet'; // 5:4 Quintillos (20 notas/compás)

export interface StringsSubdivisionConfig {
  id: PracticeSubdivision;
  label: string;
  nameEs: string;
  notesPerMeasure: number; // in 4/4
  isTuplet: boolean;
  ratio?: string;
  toneDuration: string;
  badge: string;
  desc: string;
}

export const STRINGS_SUBDIVISIONS: StringsSubdivisionConfig[] = [
  // Figuras Regulares
  {
    id: '4n',
    label: '1/4',
    nameEs: 'Negras',
    notesPerMeasure: 4,
    isTuplet: false,
    toneDuration: '4n',
    badge: '1/4',
    desc: '4 notas por compás 4/4',
  },
  {
    id: '8n',
    label: '1/8',
    nameEs: 'Corcheas',
    notesPerMeasure: 8,
    isTuplet: false,
    toneDuration: '8n',
    badge: '1/8',
    desc: '8 notas por compás',
  },
  {
    id: '16n',
    label: '1/16',
    nameEs: 'Semicorcheas',
    notesPerMeasure: 16,
    isTuplet: false,
    toneDuration: '16n',
    badge: '1/16',
    desc: '16 notas por compás',
  },
  {
    id: '32n',
    label: '1/32',
    nameEs: 'Fusas',
    notesPerMeasure: 32,
    isTuplet: false,
    toneDuration: '32n',
    badge: '1/32',
    desc: '32 notas para chops rápidos y fills de bajo',
  },
  // Subdivisions Irregulares (Tuplets)
  {
    id: 'quarter_triplet',
    label: '3:2',
    nameEs: 'Tresillo de Negras',
    notesPerMeasure: 6,
    isTuplet: true,
    ratio: '3:2',
    toneDuration: '4t',
    badge: '3:2 ♩',
    desc: '3 notas en 2 tiempos (6 por compás 4/4)',
  },
  {
    id: 'eighth_triplet',
    label: '3:2',
    nameEs: 'Tresillo de Corcheas',
    notesPerMeasure: 12,
    isTuplet: true,
    ratio: '3:2',
    toneDuration: '8t',
    badge: '3:2 ♪',
    desc: '12 notas por compás (esencial para blues, shuffle y swing)',
  },
  {
    id: 'sextuplet',
    label: '6:4',
    nameEs: 'Seiscillos',
    notesPerMeasure: 24,
    isTuplet: true,
    ratio: '6:4',
    toneDuration: '16t',
    badge: '6:4',
    desc: 'Sweep picking, funk fills y virtuosismo',
  },
  {
    id: 'quintuplet',
    label: '5:4',
    nameEs: 'Quintillos',
    notesPerMeasure: 20,
    isTuplet: true,
    ratio: '5:4',
    toneDuration: '16n',
    badge: '5:4',
    desc: '5 notas por tiempo - fraseo moderno neo-soul y prog',
  },
];

// Estilos de acompañamiento armónico
export type ProgressionAccompanimentStyle =
  | 'roots_fifths'
  | 'walking_bass'
  | 'rhythmic_arpeggio'
  | 'guitar_comping';

export interface ProgressionChordStep {
  measureIndex: number; // 0-based
  chordSymbol: string; // e.g. 'Dm7', 'G7', 'Cmaj7'
  rootNote: MusicalKey;
  chordType: ChordVoicingType;
  degreeRoman: string; // 'ii7', 'V7', 'Imaj7'
  guideTones: {
    root: number; // semitone distance from C (0..11)
    third: number; // semitone distance from C
    seventh?: number; // semitone distance from C
    fifth?: number;
  };
  notesEs: string; // e.g. 'Re - Fa - La - Do'
}

export interface HarmonicProgressionDef {
  id: string;
  name: string;
  category: 'Cadencias' | 'Música Popular & Moderna';
  degreesText: string;
  defaultKey: MusicalKey;
  measuresCount: number;
  description: string;
  context: string;
  chords: (key: MusicalKey) => ProgressionChordStep[];
}
