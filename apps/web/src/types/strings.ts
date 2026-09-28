export type InstrumentType = 'bass_4' | 'bass_5' | 'guitar_6';

export type TuningId = 'standard' | 'drop_d' | 'half_step_down';

export interface TuningConfig {
  id: TuningId;
  name: string;
  notes: string[];
  stringPitches: string[];
}

export type FretboardOverlayMode = 'notes' | 'intervals' | 'fingering';

// 4 distinct pedagogical theory modes:
// 1. Free Mode (visualize whatever overlay without filtering)
// 2. Scales (8 scales across fretboard)
// 3. Arpeggios (8 melodic arpeggios, with range box and audition)
// 4. Chords / Voicings (real hand fingerings, 1 note per string, mute/open indicators, strum button)
export type TheoryMode = 'free' | 'scale' | 'arpeggio' | 'chord_voicing';

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

export type ScaleType =
  | 'minor_pentatonic'
  | 'major_pentatonic'
  | 'blues'
  | 'major'
  | 'minor'
  | 'dorian'
  | 'mixolydian'
  | 'harmonic_minor';

// 8 Arpeggio Types
export type ArpeggioType =
  | 'major_triad'
  | 'minor_triad'
  | 'maj7'
  | 'dom7'
  | 'm7'
  | 'm7b5'
  | 'dim7'
  | 'aug';

// 7 Chord Voicing Families
export type ChordVoicingType =
  | 'major'
  | 'minor'
  | 'dom7'
  | 'maj7'
  | 'm7'
  | 'sus4'
  | 'add9';

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
  interval: string; // 'R', '3M', 'b3', '5', '7M', 'b7', '4', '9'
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
