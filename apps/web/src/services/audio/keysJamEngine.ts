import * as Tone from 'tone';
import { installAudioBufferProtections } from './safeAudioBuffer';

installAudioBufferProtections();

export type JamStyle = 'lofi' | 'funk' | 'jazz' | 'neo_soul';

export interface JamStyleConfig {
  id: JamStyle;
  name: string;
  tag: string;
  defaultBpm: number;
  description: string;
  recommendedScale: string;
  chordsProgression: { roman: string; semitones: number[]; duration: string }[];
}

export const JAM_STYLES: JamStyleConfig[] = [
  {
    id: 'lofi',
    name: 'Lofi Chill',
    tag: '☕ Relax & Study',
    defaultBpm: 75,
    description: 'Beat relajado con swing sutil, kick suave, caja con textura vinilo y acordes melancólicos de Neo-Soul/Lofi.',
    recommendedScale: 'dorian',
    chordsProgression: [
      { roman: 'ii9', semitones: [2, 5, 9, 12, 16], duration: '2m' },
      { roman: 'V13', semitones: [7, 11, 14, 17, 21], duration: '2m' },
      { roman: 'Imaj9', semitones: [0, 4, 7, 11, 14], duration: '2m' },
      { roman: 'vi7', semitones: [9, 12, 16, 19], duration: '2m' },
    ],
  },
  {
    id: 'funk',
    name: 'Funk Groove',
    tag: '⚡ Groove & Síncopa',
    defaultBpm: 100,
    description: 'Rhythm section electrizante con bajo funk sincopado, semicorcheas en charlestón y vamp bailable.',
    recommendedScale: 'dorian',
    chordsProgression: [
      { roman: 'i9', semitones: [0, 3, 7, 10, 14], duration: '2m' },
      { roman: 'IV13', semitones: [5, 9, 12, 15, 19], duration: '2m' },
      { roman: 'i9', semitones: [0, 3, 7, 10, 14], duration: '2m' },
      { roman: 'bVII9', semitones: [10, 14, 17, 20, 24], duration: '2m' },
    ],
  },
  {
    id: 'jazz',
    name: 'Jazz Swing',
    tag: '🎷 Classic Trio',
    defaultBpm: 120,
    description: 'Trío acústico tradicional con ride de swing con tresillo, contrabajo en walking y comping sincopado.',
    recommendedScale: 'blues',
    chordsProgression: [
      { roman: 'ii7', semitones: [2, 5, 9, 12], duration: '2m' },
      { roman: 'V7', semitones: [7, 11, 14, 17], duration: '2m' },
      { roman: 'Imaj7', semitones: [0, 4, 7, 11], duration: '2m' },
      { roman: 'VI7b9', semitones: [9, 13, 16, 19, 22], duration: '2m' },
    ],
  },
  {
    id: 'neo_soul',
    name: 'Neo-Soul Slow Jam',
    tag: '🟣 Laid-Back Vibe',
    defaultBpm: 72,
    description: 'Cadencia rica y espaciosa inspirada en D\'Angelo y Erykah Badu con 9sus4 y novenas expandidas.',
    recommendedScale: 'pentatonic_minor',
    chordsProgression: [
      { roman: 'Imaj9', semitones: [0, 4, 7, 11, 14], duration: '2m' },
      { roman: 'iv9', semitones: [5, 8, 12, 15, 19], duration: '2m' },
      { roman: 'bVII9sus4', semitones: [10, 15, 17, 20, 24], duration: '2m' },
      { roman: 'Imaj9', semitones: [0, 4, 7, 11, 14], duration: '2m' },
    ],
  },
];

class KeysJamEngine {
  private isInitialized = false;
  private isJamming = false;
  private currentStyle: JamStyle = 'lofi';
  private currentKeyRoot = 'C';
  private currentBpm = 75;

  // Audio Nodes
  private masterOutput: Tone.Volume | null = null;
  private kickSynth: Tone.MembraneSynth | null = null;
  private snareSynth: Tone.NoiseSynth | null = null;
  private hihatSynth: Tone.NoiseSynth | null = null;
  private bassSynth: Tone.MonoSynth | null = null;
  private chordPadSynth: Tone.PolySynth | null = null;
  private chordFilter: Tone.Filter | null = null;

  // Tone.js Loop / Events
  private drumLoopId: number | null = null;
  private bassLoopId: number | null = null;
  private chordLoopId: number | null = null;

  public async init() {
    if (this.isInitialized) return;
    try {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      this.masterOutput = new Tone.Volume(-8).toDestination();

      // Drum: Kick
      this.kickSynth = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.4 },
      }).connect(this.masterOutput);
      this.kickSynth.volume.value = -3;

      // Drum: Snare / Rim
      this.snareSynth = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.002, decay: 0.18, sustain: 0 },
      }).connect(this.masterOutput);
      this.snareSynth.volume.value = -10;

      // Drum: Hi-Hat
      this.hihatSynth = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
      }).connect(this.masterOutput);
      this.hihatSynth.volume.value = -16;

      // Bass: Mono Synth
      this.bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'triangle' },
        filter: { Q: 2, type: 'lowpass', rolloff: -12 },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.4 },
        filterEnvelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.4, baseFrequency: 180, octaves: 2.5 },
      }).connect(this.masterOutput);
      this.bassSynth.volume.value = -4;

      // Chords: Gentle Warm Pad
      this.chordFilter = new Tone.Filter({
        frequency: 2400,
        type: 'lowpass',
        rolloff: -12,
      }).connect(this.masterOutput);

      this.chordPadSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sine' },
        envelope: { attack: 0.08, decay: 1.2, sustain: 0.5, release: 1.2 },
      }).connect(this.chordFilter);
      this.chordPadSynth.volume.value = -12;

      this.isInitialized = true;
    } catch (e) {
      console.warn('Jam engine init deferred:', e);
    }
  }

  public async startJam(
    style: JamStyle = 'lofi',
    keyRoot = 'C',
    bpm = 75,
    onStep?: (beat: number, chordRoman: string) => void
  ) {
    await this.init();
    this.stopJam();

    this.currentStyle = style;
    this.currentKeyRoot = keyRoot;
    this.currentBpm = bpm;

    Tone.getTransport().bpm.value = bpm;

    const styleConfig = JAM_STYLES.find((s) => s.id === style) || JAM_STYLES[0];
    const chromaticMap: { [note: string]: number } = {
      C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
      'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
    };
    const rootSemitone = chromaticMap[keyRoot] ?? 0;
    const notesNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    let stepCounter = 0;

    // Schedule 16-step rhythmic pattern per measure (loop of 8 bars = 32 beats)
    this.drumLoopId = Tone.getTransport().scheduleRepeat((time) => {
      const beat = (stepCounter % 16) / 4;
      const sub16 = stepCounter % 16;
      const bar = Math.floor(stepCounter / 16) % 8;

      // 1. Drums
      if (this.currentStyle === 'lofi') {
        // Kick on 1 and 2.5
        if (sub16 === 0 || sub16 === 6 || sub16 === 10) {
          this.kickSynth?.triggerAttackRelease('C1', '8n', time, 0.7);
        }
        // Snare / Rim on 2 and 4
        if (sub16 === 4 || sub16 === 12) {
          this.snareSynth?.triggerAttackRelease('16n', time, 0.65);
        }
        // Hihat on 8ths with laid-back feel
        if (sub16 % 2 === 0) {
          this.hihatSynth?.triggerAttackRelease('32n', time, sub16 % 4 === 0 ? 0.4 : 0.25);
        }
      } else if (this.currentStyle === 'funk') {
        // Funk groove
        if (sub16 === 0 || sub16 === 3 || sub16 === 8 || sub16 === 11) {
          this.kickSynth?.triggerAttackRelease('C1', '16n', time, 0.85);
        }
        if (sub16 === 4 || sub16 === 12) {
          this.snareSynth?.triggerAttackRelease('16n', time, 0.9);
        }
        this.hihatSynth?.triggerAttackRelease('32n', time, sub16 % 4 === 2 ? 0.6 : 0.3);
      } else if (this.currentStyle === 'jazz') {
        // Jazz ride pattern (1, 2, 2-and, 3, 4, 4-and)
        if (sub16 === 0) {
          this.kickSynth?.triggerAttackRelease('C1', '16n', time, 0.4); // Feathering
        }
        if (sub16 === 4 || sub16 === 12) {
          this.hihatSynth?.triggerAttackRelease('32n', time, 0.8); // Charleston foot
        }
        if (sub16 === 0 || sub16 === 4 || sub16 === 6 || sub16 === 8 || sub16 === 12 || sub16 === 14) {
          this.snareSynth?.triggerAttackRelease('32n', time, 0.35); // Brush/Ride
        }
      } else {
        // Neo-Soul
        if (sub16 === 0 || sub16 === 7) {
          this.kickSynth?.triggerAttackRelease('C1', '8n', time, 0.8);
        }
        if (sub16 === 4 || sub16 === 12) {
          this.snareSynth?.triggerAttackRelease('16n', time, 0.7);
        }
        if (sub16 % 2 === 0) {
          this.hihatSynth?.triggerAttackRelease('32n', time, 0.3);
        }
      }

      // 2. Chords & Bass progression trigger (each chord lasts 2 bars = 32 sixteenth steps)
      const chordIndex = Math.floor(bar / 2) % styleConfig.chordsProgression.length;
      const currentChordConfig = styleConfig.chordsProgression[chordIndex];

      if (sub16 === 0 && (bar % 2 === 0)) {
        // Calculate chord notes in key
        const chordNotes = currentChordConfig.semitones.map((semi) => {
          const totalSemi = rootSemitone + semi;
          const noteName = notesNames[totalSemi % 12];
          const octave = 3 + Math.floor(totalSemi / 12);
          return `${noteName}${octave}`;
        });

        // Trigger chord pad
        try {
          this.chordPadSynth?.triggerAttackRelease(chordNotes, '2m', time, 0.5);
        } catch {
          // Ignored
        }

        // Bass root on 1
        const bassNoteName = notesNames[(rootSemitone + currentChordConfig.semitones[0]) % 12];
        try {
          this.bassSynth?.triggerAttackRelease(`${bassNoteName}2`, '1m', time, 0.75);
        } catch {
          // Ignored
        }

        onStep?.(beat, currentChordConfig.roman);
      }

      stepCounter++;
    }, '16n');

    Tone.getTransport().start();
    this.isJamming = true;
  }

  public stopJam() {
    try {
      Tone.getTransport().stop();
      if (this.drumLoopId !== null) {
        Tone.getTransport().clear(this.drumLoopId);
        this.drumLoopId = null;
      }
      this.chordPadSynth?.releaseAll();
    } catch {
      // Ignored
    }
    this.isJamming = false;
  }

  public isRunning(): boolean {
    return this.isJamming;
  }

  public setVolume(db: number) {
    if (this.masterOutput) {
      this.masterOutput.volume.value = Math.max(-40, Math.min(6, db));
    }
  }
}

export const keysJamEngine = new KeysJamEngine();
