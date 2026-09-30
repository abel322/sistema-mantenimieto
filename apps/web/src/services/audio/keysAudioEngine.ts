import * as Tone from 'tone';

export type TimbreType = 'grand' | 'rhodes';

class KeysAudioEngine {
  private isInitialized = false;
  private currentTimbre: TimbreType = 'grand';
  private sustainPedalActive = false;

  // Active sounding notes set (to track sustain pedal release)
  private activeNotes = new Set<string>();
  private sustainedNotes = new Set<string>();

  // Master Chain
  private masterVol: Tone.Volume | null = null;
  private masterReverb: Tone.Reverb | null = null;
  private masterCompressor: Tone.Compressor | null = null;

  // Timbre 1: Acoustic Grand Piano
  private grandSynth: Tone.PolySynth | null = null;
  private grandFilter: Tone.Filter | null = null;

  // Timbre 2: Neo-Soul EP (Rhodes)
  private rhodesSynth: Tone.PolySynth | null = null;
  private rhodesChorus: Tone.Chorus | null = null;
  private rhodesTremolo: Tone.Tremolo | null = null;
  private rhodesFilter: Tone.Filter | null = null;

  /**
   * Initializes AudioContext & Synthesis Chains on user interaction
   */
  public async ensureStarted(): Promise<boolean> {
    try {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      if (!this.isInitialized) {
        this.initAudioNodes();
        this.isInitialized = true;
      }
      return true;
    } catch (e) {
      console.warn('Keys Audio Engine start deferred:', e);
      return false;
    }
  }

  public async init(): Promise<boolean> {
    return this.ensureStarted();
  }

  private initAudioNodes() {
    this.masterVol = new Tone.Volume(0).toDestination();

    this.masterCompressor = new Tone.Compressor({
      threshold: -16,
      ratio: 3.5,
      attack: 0.008,
      release: 0.25,
    });

    this.masterReverb = new Tone.Reverb({
      decay: 2.2,
      preDelay: 0.02,
      wet: 0.18,
    });

    // Connect Master chain: Reverb -> Compressor -> Master Volume
    this.masterReverb.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterVol);

    // --- 1. Acoustic Grand Piano Synth Chain ---
    this.grandFilter = new Tone.Filter({
      frequency: 5200,
      type: 'lowpass',
      rolloff: -12,
    });
    this.grandFilter.connect(this.masterReverb);

    this.grandSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'triangle',
      },
      envelope: {
        attack: 0.005,
        decay: 3.2,
        sustain: 0.25,
        release: 1.8,
      },
    });
    this.grandSynth.connect(this.grandFilter);
    this.grandSynth.volume.value = 0;

    // --- 2. Neo-Soul EP (Rhodes) Chain ---
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
      oscillator: {
        type: 'sine',
      },
      envelope: {
        attack: 0.008,
        decay: 2.4,
        sustain: 0.35,
        release: 1.4,
      },
      modulation: {
        type: 'triangle',
      },
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
    await this.ensureStarted();
    const now = time ?? Tone.now();

    this.activeNotes.add(fullNote);
    this.sustainedNotes.add(fullNote);

    if (this.currentTimbre === 'grand' && this.grandSynth) {
      this.grandSynth.triggerAttack(fullNote, now, velocity);
    } else if (this.currentTimbre === 'rhodes' && this.rhodesSynth) {
      this.rhodesSynth.triggerAttack(fullNote, now, velocity);
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
    await this.ensureStarted();
    const now = time ?? Tone.now();

    if (this.currentTimbre === 'grand' && this.grandSynth) {
      this.grandSynth.triggerAttackRelease(fullNote, duration, now, velocity);
    } else if (this.currentTimbre === 'rhodes' && this.rhodesSynth) {
      this.rhodesSynth.triggerAttackRelease(fullNote, duration, now, velocity);
    }
  }

  /**
   * Plays a full chord simultaneously
   */
  public async playChord(notes: string[], duration = '4n', time?: number) {
    if (notes.length === 0) return;
    await this.ensureStarted();
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
