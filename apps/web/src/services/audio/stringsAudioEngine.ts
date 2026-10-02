import * as Tone from 'tone';
import { InstrumentType, StringArticulation } from '@/types/strings';

// Chromatic note names
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Calculates chromatic note and scientific pitch notation from base pitch + fret
 * E.g. base "E1", fret 5 -> "A1"
 */
export function calculateFretNote(basePitch: string, fret: number): {
  noteName: string;
  octave: number;
  fullNote: string;
  midi: number;
} {
  const match = basePitch.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) {
    return { noteName: 'C', octave: 2, fullNote: 'C2', midi: 36 };
  }

  const [, rawNote, rawOctave] = match;
  let rootNote = rawNote.toUpperCase();
  // Standardize flats to sharps
  if (rootNote === 'DB') rootNote = 'C#';
  else if (rootNote === 'EB') rootNote = 'D#';
  else if (rootNote === 'GB') rootNote = 'F#';
  else if (rootNote === 'AB') rootNote = 'G#';
  else if (rootNote === 'BB') rootNote = 'A#';

  const baseIndex = CHROMATIC_NOTES.indexOf(rootNote);
  const baseOctave = parseInt(rawOctave, 10);
  const baseMidi = (baseOctave + 1) * 12 + (baseIndex !== -1 ? baseIndex : 0);

  const targetMidi = baseMidi + fret;
  const targetOctave = Math.floor(targetMidi / 12) - 1;
  const targetNoteIndex = targetMidi % 12;
  const targetNote = CHROMATIC_NOTES[targetNoteIndex];
  const fullNote = `${targetNote}${targetOctave}`;

  return {
    noteName: targetNote,
    octave: targetOctave,
    fullNote,
    midi: targetMidi,
  };
}

class StringsAudioEngine {
  private isInitialized = false;

  // Bass Synth Chain
  private bassSynth: Tone.PolySynth | null = null;
  private bassFilter: Tone.Filter | null = null;
  private bassDistortion: Tone.Distortion | null = null;
  private bassEQ: Tone.EQ3 | null = null;
  private bassCompressor: Tone.Compressor | null = null;

  // Guitar Synth Chain
  private guitarSynth: Tone.PolySynth | null = null;
  private guitarFilter: Tone.Filter | null = null;
  private guitarChorus: Tone.Chorus | null = null;
  private guitarReverb: Tone.Freeverb | null = null; // Freeverb: no buffer creation, safe to instantiate synchronously

  // Master Volume
  private masterVol: Tone.Volume | null = null;

  private isInitializing = false;

  /**
   * Initializes AudioContext on user interaction.
   * Must be called from a direct user gesture to satisfy browser autoplay policy.
   */
  public async ensureStarted(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;
    this.isInitializing = true;
    try {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }
      // Guard: never build audio graph before AudioContext is running
      const sampleRate = Tone.getContext().sampleRate;
      if (!sampleRate || sampleRate === 0) {
        console.warn('[StringsAudioEngine] AudioContext sampleRate=0, deferring init');
        return false;
      }
      if (!this.isInitialized) {
        this.initSynths();
        this.isInitialized = true;
      }
      return true;
    } catch (e) {
      console.warn('[StringsAudioEngine] Audio start deferred:', e);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  private initSynths() {
    this.masterVol = new Tone.Volume(0).toDestination();

    // --- 1. Electric Bass Processing Chain ---
    this.bassCompressor = new Tone.Compressor({
      threshold: -20,
      ratio: 4,
      attack: 0.005,
      release: 0.15,
    });

    this.bassEQ = new Tone.EQ3({
      low: 4,
      mid: -2,
      high: 2,
      lowFrequency: 100,
      highFrequency: 2500,
    });

    this.bassDistortion = new Tone.Distortion(0.06);

    this.bassFilter = new Tone.Filter({
      frequency: 2200,
      type: 'lowpass',
      rolloff: -24,
      Q: 1.8,
    });

    // Connect Bass Chain: Filter -> Distortion -> EQ -> Compressor -> Master
    this.bassFilter.chain(
      this.bassDistortion,
      this.bassEQ,
      this.bassCompressor,
      this.masterVol
    );

    this.bassSynth = new Tone.PolySynth(Tone.MonoSynth, {
      oscillator: {
        type: 'sawtooth4',
      },
      filter: {
        Q: 2,
        type: 'lowpass',
        rolloff: -12,
      },
      envelope: {
        attack: 0.005,
        decay: 0.6,
        sustain: 0.4,
        release: 0.4,
      },
      filterEnvelope: {
        attack: 0.005,
        decay: 0.25,
        sustain: 0.2,
        release: 0.3,
        baseFrequency: 180,
        octaves: 3.5,
      },
    });
    this.bassSynth.connect(this.bassFilter);
    this.bassSynth.volume.value = 2;

    // --- 2. Electric Guitar Processing Chain ---
    this.guitarFilter = new Tone.Filter({
      frequency: 4500,
      type: 'lowpass',
      rolloff: -12,
    });

    this.guitarChorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.4,
      wet: 0.25,
    }).start();

    // Freeverb: algorithmic reverb — does NOT call Tone.Offline() or create an
    // AudioBuffer, so it is safe to instantiate without awaiting reverb.generate().
    // This prevents the "channelData must be a non-empty array" crash.
    this.guitarReverb = new Tone.Freeverb({
      roomSize: 0.4,
      dampening: 3500,
      wet: 0.2,
    });

    this.guitarFilter.chain(this.guitarChorus, this.guitarReverb, this.masterVol);

    this.guitarSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.005,
        decay: 1.0,
        sustain: 0.15,
        release: 0.6,
      },
    });
    this.guitarSynth.connect(this.guitarFilter);
    this.guitarSynth.volume.value = 0;
  }

  /**
   * Plays a single note with optional articulation
   */
  public async playNote(
    instrument: InstrumentType,
    fullNote: string,
    articulation: StringArticulation = 'normal',
    duration: string = '8n',
    time?: number
  ) {
    await this.ensureStarted();

    const isBass = instrument.startsWith('bass');

    if (isBass && this.bassSynth && this.bassFilter) {
      const now = time ?? Tone.now();

      if (articulation === 'slap') {
        // Slap: punchy, high-mid presence, quick decay
        this.bassFilter.frequency.setValueAtTime(3800, now);
        this.bassSynth.triggerAttackRelease(fullNote, '16n', now, 1.0);
        this.bassFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.15);
      } else if (articulation === 'pop') {
        // Pop: sharp transient, bright treble snap
        this.bassFilter.frequency.setValueAtTime(5000, now);
        this.bassSynth.triggerAttackRelease(fullNote, '16n', now, 1.0);
        this.bassFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.12);
      } else if (articulation === 'ghost') {
        // Ghost: percussive muted thud
        this.bassFilter.frequency.setValueAtTime(450, now);
        this.bassSynth.triggerAttackRelease(fullNote, '32n', now, 0.4);
      } else {
        // Normal finger/pick bass note
        this.bassFilter.frequency.setValueAtTime(2200, now);
        this.bassSynth.triggerAttackRelease(fullNote, duration, now, 0.85);
      }
    } else if (!isBass && this.guitarSynth && this.guitarFilter) {
      const now = time ?? Tone.now();

      if (articulation === 'palmmute') {
        // Palm Mute: heavy filter damping, quick release
        this.guitarFilter.frequency.setValueAtTime(900, now);
        this.guitarSynth.triggerAttackRelease(fullNote, '16n', now, 0.7);
      } else {
        this.guitarFilter.frequency.setValueAtTime(4800, now);
        this.guitarSynth.triggerAttackRelease(fullNote, duration, now, 0.8);
      }
    }
  }

  /**
   * Strum / play multiple notes simultaneously with humanized strumming
   */
  public async playChord(
    instrument: InstrumentType,
    notes: string[],
    articulation: StringArticulation = 'normal',
    time?: number
  ) {
    if (notes.length === 0) return;
    await this.ensureStarted();

    const baseTime = time ?? Tone.now();
    const isUpstroke = articulation === 'upstroke';
    const strumDelay = 0.025; // 25ms humanized strum dispersion

    const orderedNotes = isUpstroke ? [...notes].reverse() : notes;

    orderedNotes.forEach((note, idx) => {
      this.playNote(instrument, note, articulation, '2n', baseTime + idx * strumDelay);
    });
  }

  /**
   * Plays notes sequentially as an arpeggio (ascending or pattern)
   */
  public async playArpeggio(
    instrument: InstrumentType,
    notes: string[],
    stepSeconds: number = 0.18
  ) {
    if (notes.length === 0) return;
    await this.ensureStarted();
    const baseTime = Tone.now();

    notes.forEach((note, idx) => {
      this.playNote(instrument, note, 'normal', '8n', baseTime + idx * stepSeconds);
    });
  }

  /**
   * Humanized chord strum with ~25ms dispersion between strings
   */
  public async playStrum(
    instrument: InstrumentType,
    notes: string[],
    strumDelayMs: number = 25
  ) {
    if (notes.length === 0) return;
    await this.ensureStarted();
    const baseTime = Tone.now();
    const delaySec = Math.max(0.005, strumDelayMs / 1000);

    notes.forEach((note, idx) => {
      this.playNote(instrument, note, 'downstroke', '2n', baseTime + idx * delaySec);
    });
  }

  /**
   * Set master volume in decibels (-60 to +6)
   */
  public setVolume(db: number) {
    if (this.masterVol) {
      this.masterVol.volume.value = Math.max(-60, Math.min(6, db));
    }
  }

  /**
   * Stop all sounding synths
   */
  public stopAll() {
    try {
      if (this.bassSynth) this.bassSynth.releaseAll();
      if (this.guitarSynth) this.guitarSynth.releaseAll();
    } catch {
      // Ignored if already silent
    }
  }
}

export const stringsAudioEngine = new StringsAudioEngine();
