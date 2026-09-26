export type DrumPieceId =
  | 'crash'
  | 'china'
  | 'ride'
  | 'cowbell'
  | 'hihatOpen'
  | 'hihatClosed'
  | 'hihat'
  | 'hihatFoot'
  | 'tom1'
  | 'snare'
  | 'tom2'
  | 'floorTom'
  | 'kick';

export interface DrumPieceInfo {
  id: DrumPieceId;
  name: string;
  shortName: string;
  shortcut: string;
  keyPos: string; // Vexflow notation position (e.g. 'g/5', 'c/5', 'f/4')
  notehead: 'normal' | 'x' | 'circle-x';
  staffPositionDesc: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

export const DRUM_PIECES: Record<DrumPieceId, DrumPieceInfo> = {
  crash: {
    id: 'crash',
    name: 'Crash Cymbal',
    shortName: 'Crash',
    shortcut: 'C',
    keyPos: 'a/5',
    notehead: 'x',
    staffPositionDesc: 'Línea flotante superior (A5) con "x"',
    color: '#38BDF8', // Sky 400
    badgeBg: 'bg-sky-500/20',
    badgeBorder: 'border-sky-500/40',
  },
  china: {
    id: 'china',
    name: 'China Cymbal',
    shortName: 'China',
    shortcut: 'N',
    keyPos: 'b/5',
    notehead: 'x',
    staffPositionDesc: 'Espacio sobre línea superior (B5) con "x"',
    color: '#06B6D4', // Cyan 500
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/40',
  },
  ride: {
    id: 'ride',
    name: 'Ride Cymbal',
    shortName: 'Ride',
    shortcut: 'R',
    keyPos: 'f/5',
    notehead: 'x',
    staffPositionDesc: 'Línea superior pentagrama (F5) con "x"',
    color: '#22D3EE', // Cyan 400
    badgeBg: 'bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/40',
  },
  cowbell: {
    id: 'cowbell',
    name: 'Cowbell / Cencerro',
    shortName: 'Cowbell',
    shortcut: 'W',
    keyPos: 'e/5',
    notehead: 'normal',
    staffPositionDesc: 'Cuarto espacio/línea (E5)',
    color: '#EAB308', // Yellow 500
    badgeBg: 'bg-yellow-500/20',
    badgeBorder: 'border-yellow-500/40',
  },
  hihatOpen: {
    id: 'hihatOpen',
    name: 'Hi-Hat (Open)',
    shortName: 'H.H. Open',
    shortcut: 'O',
    keyPos: 'g/5',
    notehead: 'circle-x',
    staffPositionDesc: 'Espacio sobre pentagrama (G5) con "x" circulada',
    color: '#A78BFA', // Violet 400
    badgeBg: 'bg-violet-500/20',
    badgeBorder: 'border-violet-500/40',
  },
  hihatClosed: {
    id: 'hihatClosed',
    name: 'Hi-Hat (Closed)',
    shortName: 'H.H. Closed',
    shortcut: 'H',
    keyPos: 'g/5',
    notehead: 'x',
    staffPositionDesc: 'Espacio sobre pentagrama (G5) con cruz "x"',
    color: '#818CF8', // Indigo 400
    badgeBg: 'bg-indigo-500/20',
    badgeBorder: 'border-indigo-500/40',
  },
  hihat: {
    id: 'hihat',
    name: 'Hi-Hat (Closed)',
    shortName: 'H.H.',
    shortcut: 'H',
    keyPos: 'g/5',
    notehead: 'x',
    staffPositionDesc: 'Espacio sobre pentagrama (G5) con cruz "x"',
    color: '#818CF8', // Indigo 400
    badgeBg: 'bg-indigo-500/20',
    badgeBorder: 'border-indigo-500/40',
  },
  hihatFoot: {
    id: 'hihatFoot',
    name: 'Hi-Hat (Foot Chick)',
    shortName: 'H.H. Foot',
    shortcut: 'P',
    keyPos: 'd/4',
    notehead: 'x',
    staffPositionDesc: 'Espacio bajo pentagrama (D4) con cruz "x"',
    color: '#6366F1', // Indigo 500
    badgeBg: 'bg-indigo-600/20',
    badgeBorder: 'border-indigo-600/40',
  },
  tom1: {
    id: 'tom1',
    name: 'Rack Tom 1 (High)',
    shortName: 'Hi-Tom',
    shortcut: 'T',
    keyPos: 'd/5',
    notehead: 'normal',
    staffPositionDesc: 'Cuarto espacio (D5)',
    color: '#F472B6', // Pink 400
    badgeBg: 'bg-pink-500/20',
    badgeBorder: 'border-pink-500/40',
  },
  snare: {
    id: 'snare',
    name: 'Snare Drum',
    shortName: 'Snare',
    shortcut: 'S',
    keyPos: 'c/5',
    notehead: 'normal',
    staffPositionDesc: 'Tercer espacio (C5)',
    color: '#F59E0B', // Amber 500
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-500/40',
  },
  tom2: {
    id: 'tom2',
    name: 'Rack Tom 2 (Mid)',
    shortName: 'Mid-Tom',
    shortcut: 'M',
    keyPos: 'b/4',
    notehead: 'normal',
    staffPositionDesc: 'Tercera línea (B4)',
    color: '#FB7185', // Rose 400
    badgeBg: 'bg-rose-500/20',
    badgeBorder: 'border-rose-500/40',
  },
  floorTom: {
    id: 'floorTom',
    name: 'Floor Tom (Low)',
    shortName: 'Floor Tom',
    shortcut: 'F',
    keyPos: 'a/4',
    notehead: 'normal',
    staffPositionDesc: 'Segundo espacio (A4)',
    color: '#C084FC', // Purple 400
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-500/40',
  },
  kick: {
    id: 'kick',
    name: 'Bass Drum (Kick)',
    shortName: 'Kick',
    shortcut: 'K',
    keyPos: 'f/4',
    notehead: 'normal',
    staffPositionDesc: 'Primer espacio inferior (F4)',
    color: '#10B981', // Emerald 500
    badgeBg: 'bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/40',
  },
};

export const DRUM_ORDER: DrumPieceId[] = [
  'crash',
  'china',
  'ride',
  'cowbell',
  'hihatOpen',
  'hihatClosed',
  'hihatFoot',
  'tom1',
  'snare',
  'tom2',
  'floorTom',
  'kick',
];

export interface DrumHit {
  pieceId: DrumPieceId;
  accent?: boolean;
  ghost?: boolean;
  sticking?: 'R' | 'L' | 'K' | 'B' | string;
  flam?: boolean;
  drag?: boolean;
}

export interface DrumStep {
  id: string;
  hits: DrumHit[];
  isRest?: boolean;
  sticking?: 'R' | 'L' | 'K' | 'B' | string;
  flam?: boolean;
  drag?: boolean;
}

export type VoicingMode = 'snare' | 'kit';

export type RudimentCategory = 'rolls' | 'diddles' | 'flams' | 'drags' | 'linear-chops';

export interface RudimentStep {
  sticking: 'R' | 'L' | 'K' | 'B' | string; // Right hand, Left hand, Kick, Both
  accent?: boolean;
  ghost?: boolean;
  flam?: boolean;
  drag?: boolean;
  kitPiece?: DrumPieceId; // Voicing assignment when in Kit/Chops mode
  instrument?: DrumPieceId;
  hand?: 'R' | 'L' | 'K' | 'B' | string;
}

export interface RudimentItem {
  id: string;
  name: string;
  category: RudimentCategory;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  description: string;
  subdivision: number; // 4 (16th), 3 (triplet 3:2), 6 (sextuplet 6:4), 2 (8th), 5 (quintuplet 5:4), 8 (32nd)
  defaultBpm: number;
  steps: RudimentStep[];
  tags: string[];
  sticking?: string[];
  kitVoicing?: DrumPieceId[];
}

export interface DrumBeat {
  id: string;
  beatIndex: number;
  subdivision: number; // 0.25 (whole), 0.5 (half), 1 (quarter), 2 (8th), 3 (triplet 3:2), 4 (16th), 5 (quintuplet 5:4), 6 (sextuplet 6:4), 7 (septuplet 7:4), 8 (32nd), 9 (nonuplet 9:8)
  noteDurationType?: 'w' | 'h' | 'q' | '8' | '16' | '32';
  isTuplet?: boolean;
  tupletRatio?: [number, number];
  steps: DrumStep[];
}

export interface DrumMeasure {
  id: string;
  timeSignature: [number, number]; // [beats, beatValue], e.g. [4, 4] or [7, 8]
  beats: DrumBeat[];
}

export interface DrumPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  bpm: number;
  timeSignature: [number, number];
  measures: DrumMeasure[];
}

export interface SavedDrumExercise {
  id: string;
  title: string;
  tags?: string[];
  createdAt: string; // ISO string
  updatedAt?: string;
  bpm: number;
  timeSignature: [number, number];
  totalMeasures: number;
  measures: DrumMeasure[];
  notes?: string;
}

export interface DrumDraftSession {
  measures: DrumMeasure[];
  bpm: number;
  timeSignature: [number, number];
  activePresetId: string | null;
  selectedMeasureIndex?: number;
  selectedBeatIndex?: number;
  selectedStepIndex?: number;
  savedAt: number;
}

export interface SubdivisionOption {
  value: number;
  label: string;
  nameEs: string;
  shortcut: string;
  isTuplet: boolean;
  ratio?: [number, number];
  vexDuration: string;
}

export const SUBDIVISION_OPTIONS: SubdivisionOption[] = [
  { value: 0.25, label: '1/1', nameEs: 'Redonda', shortcut: 'W', isTuplet: false, vexDuration: 'w' },
  { value: 0.5, label: '1/2', nameEs: 'Blanca', shortcut: 'Y', isTuplet: false, vexDuration: 'h' },
  { value: 1, label: '1/4', nameEs: 'Negra', shortcut: '1', isTuplet: false, vexDuration: '4' },
  { value: 2, label: '1/8', nameEs: 'Corchea', shortcut: '2', isTuplet: false, vexDuration: '8' },
  { value: 4, label: '1/16', nameEs: 'Semicorchea', shortcut: '4', isTuplet: false, vexDuration: '16' },
  { value: 8, label: '1/32', nameEs: 'Fusa', shortcut: '8', isTuplet: false, vexDuration: '32' },
  // Tuplets
  { value: 3, label: '3:2', nameEs: 'Tresillo', shortcut: '3', isTuplet: true, ratio: [3, 2], vexDuration: '8' },
  { value: 5, label: '5:4', nameEs: 'Quintillo', shortcut: '5', isTuplet: true, ratio: [5, 4], vexDuration: '16' },
  { value: 6, label: '6:4', nameEs: 'Seisillo', shortcut: '6', isTuplet: true, ratio: [6, 4], vexDuration: '16' },
  { value: 7, label: '7:4', nameEs: 'Septillo', shortcut: '7', isTuplet: true, ratio: [7, 4], vexDuration: '16' },
  { value: 9, label: '9:8', nameEs: 'Nonillo', shortcut: '9', isTuplet: true, ratio: [9, 8], vexDuration: '32' },
];

export type GrooveCategory =
  | 'Rock & Metal'
  | 'Funk & Gospel'
  | 'Hip-Hop & Electronic'
  | 'Latin & World'
  | 'Jazz & Blues'
  | 'Prog & Odd-Meter';

export interface GrooveHit {
  instrument:
    | 'kick'
    | 'snare'
    | 'hihat'
    | 'hihatOpen'
    | 'hihatFoot'
    | 'crash'
    | 'ride'
    | 'tom1'
    | 'tom2'
    | 'floorTom'
    | 'cowbell'
    | 'china';
  accent?: boolean;
  ghost?: boolean;
  flam?: boolean;
  velocity?: number;
}

export interface GroovePattern {
  id: string;
  name: string;
  category: GrooveCategory;
  subCategory?: string; // Ej: 'Metal/Double-Bass', 'Afro-Cuban', 'Trap', 'Shuffle'
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado' | 'Virtuoso';
  suggestedBpm: number;
  timeSignature: '4/4' | '3/4' | '5/4' | '7/4' | '7/8' | '9/8' | '11/8' | '6/8' | '12/8';
  swingRatio?: number; // 0.0 (Straight) a 0.7 (Heavy Swing/Dilla)
  measuresCount: 1 | 2;
  description: string;
  subdivision: '1/8' | '1/16' | '1/32' | '3:2' | '6:4' | '5:4' | '7:4';
  measures: Array<{
    beats: Array<{
      subdivisions: Array<Array<{
        instrument:
          | 'kick'
          | 'snare'
          | 'hihat'
          | 'hihatOpen'
          | 'hihatFoot'
          | 'crash'
          | 'ride'
          | 'tom1'
          | 'tom2'
          | 'floorTom'
          | 'cowbell'
          | 'china';
        accent?: boolean;
        ghost?: boolean;
        flam?: boolean;
        velocity?: number;
      }>>;
    }>;
  }>;
}

