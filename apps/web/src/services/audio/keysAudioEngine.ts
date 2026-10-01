import * as Tone from 'tone';

export type TimbreType = 'grand' | 'rhodes';

class KeysAudioEngine {
  private isInitialized = false;
  private isInitializing = false;
  private currentTimbre: TimbreType = 'grand';
  private sustainPedalActive = false;

  // Active sounding notes set (to track sustain pedal release)
  private activeNotes = new Set<string>();
  private sustainedNotes = new Set<string>();

  // Master Chain
  private masterVol: Tone.Volume | null = null;
  private masterReverb: Tone.Freeverb | null = null; // Freeverb: algorithm-based, NO buffer creation
  private masterCompressor: Tone.Compressor | null = null;
  private masterDelay: Tone.FeedbackDelay | null = null;

  // Timbre 1: Acoustic Grand Piano
  private grandSynth: Tone.PolySynth | null = null;
  private grandFilter: Tone.Filter | null = null;

  // Timbre 2: Neo-Soul EP (Rhodes)
  private rhodesSynth: Tone.PolySynth | null = null;
  private rhodesChorus: Tone.Chorus | null = null;
  private rhodesTremolo: Tone.Tremolo | null = null;
  private rhodesFilter: Tone.Filter | null = null;

  /**
   * Initializes AudioContext & Synthesis Chains on user interaction.
   * MUST be called from a direct user gesture (click/touch) handler
   * to satisfy browser autoplay policy.
   */
  public async ensureStarted(): Promise<boolean> {
    // If already initialized or currently initializing, skip
    if (this.isInitialized) return true;
    if (this.isInitializing) return false;

    this.isInitializing = true;
    try {
      // 1. Resume / start AudioContext — MUST be in response to user gesture
      const ctx = Tone.getContext();
      if (ctx.state !== 'running') {
        await Tone.start();
      }

      // 2. Double-check context is running before creating any nodes
      //    (Tone.Reverb internally calls Tone.Offline which needs a running context
      //     with a valid sampleRate > 0 — that's why we replaced it with Freeverb)
      if (Tone.getContext().state !== 'running') {
        console.warn('[KeysAudioEngine] AudioContext not running after Tone.start(), deferring init');
        this.isInitializing = false;
        return false;
      }

      // 3. Build audio graph — safe because context is confirmed running
      this.initAudioNodes();
      this.isInitialized = true;
      return true;
    } catch (e) {
      console.warn('[KeysAudioEngine] start deferred:', e);
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  public async init(): Promise<boolean> {
    return this.ensureStarted();
  }

  private initAudioNodes() {
    // Guard: never build nodes with a closed/suspended context
    const sampleRate = Tone.getContext().sampleRate;
    if (!sampleRate || sampleRate === 0) {
      throw new Error('[KeysAudioEngine] initAudioNodes called with sampleRate=0 — AudioContext not ready');
    }

    // ---- Master Volume (final output) ----
    this.masterVol = new Tone.Volume(0).toDestination();

    // ---- Master Compressor ----
    this.masterCompressor = new Tone.Compressor({
      threshold: -16,
      ratio: 3.5,
      attack: 0.008,
      release: 0.25,
    });

    // ---- Freeverb (algorithm-based reverb, NO Tone.Offline / NO buffer creation) ----
    // Tone.Freeverb is safe to instantiate synchronously, unlike Tone.Reverb which
    // calls Tone.Offline() to generate an impulse response buffer and crashes when
    // the AudioContext sampleRate is 0 or the context hasn't started yet.
    this.masterReverb = new Tone.Freeverb({
      roomSize: 0.5,
      dampening: 3000,
      wet: 0.18,
    });

    // ---- Short stereo delay for presence ----
    this.masterDelay = new Tone.FeedbackDelay({
      delayTime: 0.04,
      feedback: 0.08,
      wet: 0.1,
    });

    // Master chain: Freeverb → Delay → Compressor → Volume → Destination
    this.masterReverb.connect(this.masterDelay);
    this.masterDelay.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterVol);

    // ---- 1. Acoustic Grand Piano Synth Chain ----
    this.grandFilter = new Tone.Filter({
      frequency: 5200,
      type: 'lowpass',
      rolloff: -12,
    });
    this.grandFilter.connect(this.masterReverb);

    this.grandSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.005,
        decay: 3.2,
        sustain: 0.25,
        release: 1.8,
      },
    });
    this.grandSynth.connect(this.grandFilter);
    this.grandSynth.volume.value = 0;

    // ---- 2. Neo-Soul EP (Rhodes) Chain ----
    this.rhodesFilter = new Tone.Filter({
      frequency: 3800,
      type: 'lowpass',
      rolloff: -12,
    });

    this.rhodesChorus = new Tone.Chorus({
      frequency: 2.2,
      delayTime: 4.0,
      depth: 0.5,
      wet: 0.35,
    }).start();

    this.rhodesTremolo = new Tone.Tremolo({
      frequency: 4.5,
      depth: 0.4,
      wet: 0.3,
    }).start();

    this.rhodesFilter.chain(this.rhodesChorus, this.rhodesTremolo, this.masterReverb);

    this.rhodesSynth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 2.0,
      modulationIndex: 1.8,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.008,
        decay: 2.4,
        sustain: 0.35,
        release: 1.4,
      },
      modulation: { type: 'triangle' },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.8,
        sustain: 0.2,
        release: 0.5,
      },
    });
    this.rhodesSynth.connect(this.rhodesFilter);
    this.rhodesSynth.volume.value = -2;
  }

  /**
   * Set Timbre: Acoustic Grand Piano vs Neo-Soul EP
   */
  public setTimbre(timbre: TimbreType) {
    this.currentTimbre = timbre;
  }

  public getTimbre(): TimbreType {
    return this.currentTimbre;
  }

  /**
   * Set Sustain Pedal State
   */
  public setSustainPedal(active: boolean) {
    this.sustainPedalActive = active;

    if (!active) {
      // Release notes that were being sustained but are no longer held physically
      this.sustainedNotes.forEach((note) => {
        if (!this.activeNotes.has(note)) {
          this.releaseNoteSynth(note);
        }
      });
      this.sustainedNotes.clear();
    }
  }

  public isSustainActive(): boolean {
    return this.sustainPedalActive;
  }

  /**
   * Triggers a single note attack
   */
  public async playNote(fullNote: string, velocity = 0.8, time?: number) {
    const started = await this.ensureStarted();
    if (!started) return; // AudioContext not yet running — skip silently

    const now = time ?? Tone.now();
    this.activeNotes.add(fullNote);
    this.sustainedNotes.add(fullNote);

    try {
      if (this.currentTimbre === 'grand' && this.grandSynth) {
        this.grandSynth.triggerAttack(fullNote, now, velocity);
      } else if (this.currentTimbre === 'rhodes' && this.rhodesSynth) {
        this.rhodesSynth.triggerAttack(fullNote, now, velocity);
      }
    } catch (e) {
      console.warn('[KeysAudioEngine] playNote error:', e);
    }
  }

  /**
   * Triggers note release (subject to sustain pedal)
   */
  public releaseNote(fullNote: string, time?: number) {
    this.activeNotes.delete(fullNote);

    if (!this.sustainPedalActive) {
      this.sustainedNotes.delete(fullNote);
      this.releaseNoteSynth(fullNote, time);
    }
  }

  private releaseNoteSynth(fullNote: string, time?: number) {
    if (!this.isInitialized) return;
    const now = time ?? Tone.now();
    try {
      if (this.currentTimbre === 'grand' && this.grandSynth) {
        this.grandSynth.triggerRelease([fullNote], now);
      } else if (this.currentTimbre === 'rhodes' && this.rhodesSynth) {
        this.rhodesSynth.triggerRelease([fullNote], now);
      }
    } catch {
      // Ignored
    }
  }

  /**
   * Plays a note with fixed duration (for automated sequencer playback)
   */
  public async playNoteDuration(fullNote: string, duration = '8n', velocity = 0.85, time?: number) {
    const started = await this.ensureStarted();
    if (!started) return;

    const now = time ?? Tone.now();
    try {
      if (this.currentTimbre === 'grand' && this.grandSynth) {
        this.grandSynth.triggerAttackRelease(fullNote, duration, now, velocity);
      } else if (this.currentTimbre === 'rhodes' && this.rhodesSynth) {
        this.rhodesSynth.triggerAttackRelease(fullNote, duration, now, velocity);
      }
    } catch (e) {
      console.warn('[KeysAudioEngine] playNoteDuration error:', e);
    }
  }

  /**
   * Plays a full chord simultaneously
   */
  public async playChord(notes: string[], duration = '4n', time?: number) {
    // Guard: empty array would cause Web Audio API errors
    if (!Array.isArray(notes) || notes.length === 0) return;

    const started = await this.ensureStarted();
    if (!started) return;

    const now = time ?? Tone.now();
    notes.forEach((note) => {
      this.playNoteDuration(note, duration, 0.85, now);
    });
  }

  /**
   * Master Volume control in decibels (-60 to +6)
   */
  public setVolume(db: number) {
    if (this.masterVol) {
      this.masterVol.volume.value = Math.max(-60, Math.min(6, db));
    }
  }

  /**
   * Stop all active notes immediately
   */
  public stopAll() {
    this.activeNotes.clear();
    this.sustainedNotes.clear();
    try {
      if (this.grandSynth) this.grandSynth.releaseAll();
      if (this.rhodesSynth) this.rhodesSynth.releaseAll();
    } catch {
      // Ignored
    }
  }
}

export const keysAudioEngine = new KeysAudioEngine();
