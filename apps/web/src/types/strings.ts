export type InstrumentType = 'bass_4' | 'bass_5' | 'guitar_6';

export type TuningId = 'standard' | 'drop_d' | 'half_step_down';

export interface TuningConfig {
  id: TuningId;
  name: string;
  notes: string[]; // High string to low string or low to high (we will standardize)
  // Low to high MIDI notes or pitch notation
  stringPitches: string[]; // e.g. ['E1', 'A1', 'D2', 'G2']
}

export type FretboardOverlayMode = 'notes' | 'intervals' | 'fingering';

export type MusicalKey = 'C' | 'G' | 'D' | 'A' | 'E' | 'B' | 'F#' | 'Db' | 'Ab' | 'Eb' | 'Bb' | 'F';

export type ScaleType = 'major' | 'minor' | 'minor_pentatonic' | 'major_pentatonic' | 'dorian' | 'mixolydian' | 'blues';

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
