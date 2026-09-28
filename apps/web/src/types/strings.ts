export type InstrumentType = 'bass_4' | 'bass_5' | 'guitar_6';

export type TuningId = 'standard' | 'drop_d' | 'half_step_down';

export interface TuningConfig {
  id: TuningId;
  name: string;
  notes: string[];
  stringPitches: string[];
}

export type FretboardOverlayMode = 'notes' | 'intervals' | 'fingering';

export type TheoryMode = 'free' | 'scale' | 'chord';

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

export type ChordType =
  | 'major'
  | 'minor'
  | 'dom7'
  | 'maj7'
  | 'm7'
  | 'm7b5'
  | 'sus4'
  | 'sus2';

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
