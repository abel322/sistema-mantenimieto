'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { DrumMeasure, DrumPieceId, DrumHit } from '@/types/drum';

export interface PlayheadPosition {
  measureIndex: number;
  beatIndex: number;
  stepIndex: number;
  progress: number; // 0.0 to 1.0 of the current measure or loop
}

export type MetronomeMode = 'downbeat' | 'beats' | 'subdivision';

export interface BeatFlash {
  beatIndex: number;
  isDownbeat: boolean;
  timestamp: number;
}

export function useDrumAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpmState] = useState(110);
  const [swing, setSwingState] = useState(0);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [metronomeMode, setMetronomeModeState] = useState<MetronomeMode>('beats');
  const [metronomeVolume, setMetronomeVolumeState] = useState<number>(0); // in dB
  const [isSyncopationDrill, setIsSyncopationDrillState] = useState(false);
  const [currentBeatFlash, setCurrentBeatFlash] = useState<BeatFlash | null>(null);
  const [isLooping, setIsLooping] = useState(true);
  const [playhead, setPlayhead] = useState<PlayheadPosition>({
    measureIndex: 0,
    beatIndex: 0,
    stepIndex: 0,
    progress: 0,
  });

  const ToneRef = useRef<any>(null);
  const synthsRef = useRef<any>(null);
  const isAudioReadyRef = useRef(false);
  const loopEventIdsRef = useRef<number[]>([]);
  const currentMeasuresRef = useRef<DrumMeasure[]>([]);
  const bpmRef = useRef(110);
  const swingRef = useRef(0);
  const isPlayingRef = useRef(false);
  const isMetronomeRef = useRef(false);
  const metronomeModeRef = useRef<MetronomeMode>('beats');
  const metronomeVolumeRef = useRef<number>(0);
  const isSyncopationDrillRef = useRef(false);
  const isLoopingRef = useRef(true);
  const totalDurationRef = useRef(2);

  // Sync refs with state
  useEffect(() => {
    bpmRef.current = bpm;
    if (ToneRef.current?.Transport) {
      ToneRef.current.Transport.bpm.value = bpm;
    }
  }, [bpm]);

  useEffect(() => {
    swingRef.current = swing;
    if (ToneRef.current?.Transport) {
      ToneRef.current.Transport.swing = swing;
      ToneRef.current.Transport.swingSubdivision = '16n';
    }
  }, [swing]);

  useEffect(() => {
    isMetronomeRef.current = isMetronomeActive;
  }, [isMetronomeActive]);

  useEffect(() => {
    metronomeModeRef.current = metronomeMode;
  }, [metronomeMode]);

  useEffect(() => {
    metronomeVolumeRef.current = metronomeVolume;
    if (synthsRef.current?.metronomeBus) {
      synthsRef.current.metronomeBus.volume.value = metronomeVolume;
    }
  }, [metronomeVolume]);

  useEffect(() => {
    isSyncopationDrillRef.current = isSyncopationDrill;
  }, [isSyncopationDrill]);

  useEffect(() => {
    isLoopingRef.current = isLooping;
    if (ToneRef.current?.Transport) {
      ToneRef.current.Transport.loop = isLooping;
    }
  }, [isLooping]);

  // Auto-clear visual beat pulse after 120ms
  useEffect(() => {
    if (!currentBeatFlash) return;
    const timer = setTimeout(() => {
      setCurrentBeatFlash(null);
    }, 120);
    return () => clearTimeout(timer);
  }, [currentBeatFlash]);

  // Lazy initialization of Web Audio + Tone.js synths
  const initAudio = useCallback(async () => {
    if (isAudioReadyRef.current && synthsRef.current) return;

    try {
      const Tone = await import('tone');
      ToneRef.current = Tone;
      await Tone.start();

      // Master output stage with gentle compression & limiter
      const masterLimiter = new Tone.Limiter(-0.5).toDestination();
      const masterComp = new Tone.Compressor({
        threshold: -14,
        ratio: 3.5,
        attack: 0.005,
        release: 0.15,
      }).connect(masterLimiter);

      const drumBus = new Tone.Volume(0).connect(masterComp);

      // 1. Kick: Punchy MembraneSynth
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.045,
        octaves: 7,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.32,
          sustain: 0.0,
          release: 0.35,
        },
      }).connect(drumBus);

      // 2. Snare: Dual layer (Tuned body + Crisp white noise)
      const snareBody = new Tone.MembraneSynth({
        pitchDecay: 0.02,
        octaves: 2.5,
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.001,
          decay: 0.14,
          sustain: 0.0,
          release: 0.15,
        },
      }).connect(drumBus);

      const snareFilter = new Tone.Filter({
        frequency: 1800,
        type: 'highpass',
      }).connect(drumBus);

      const snareNoise = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.18,
          sustain: 0.0,
        },
      }).connect(snareFilter);

      // 3. Hi-Hat Closed: Fast filtered metallic noise
      const hhFilter = new Tone.Filter({
        frequency: 7500,
        type: 'highpass',
      }).connect(drumBus);

      const hihatClosed = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.045,
          sustain: 0.0,
        },
      }).connect(hhFilter);

      // 4. Hi-Hat Open: Longer decay
      const hihatOpen = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.002,
          decay: 0.38,
          sustain: 0.0,
        },
      }).connect(hhFilter);

      // 5. Ride Cymbal: Resonant metallic bell
      const ride = new Tone.MetalSynth({
        envelope: {
          attack: 0.001,
          decay: 0.65,
          release: 0.2,
        },
        harmonicity: 5.1,
        modulationIndex: 28,
        resonance: 3800,
        octaves: 1.5,
      }).connect(drumBus);
      ride.frequency.value = 340;
      ride.volume.value = -6;

      // 6. Crash Cymbal: Shimmering explosive burst
      const crashMetal = new Tone.MetalSynth({
        envelope: {
          attack: 0.002,
          decay: 1.2,
          release: 0.5,
        },
        harmonicity: 4.8,
        modulationIndex: 40,
        resonance: 4800,
        octaves: 1.8,
      }).connect(drumBus);
      crashMetal.frequency.value = 260;
      crashMetal.volume.value = -4;

      const crashNoise = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: {
          attack: 0.002,
          decay: 1.1,
          sustain: 0.0,
        },
      }).connect(hhFilter);
      crashNoise.volume.value = -10;

      // 7. Rack Tom 1 (High Tom: G2 ~ 98Hz)
      const tom1 = new Tone.MembraneSynth({
        pitchDecay: 0.04,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.002,
          decay: 0.26,
          sustain: 0.0,
          release: 0.3,
        },
      }).connect(drumBus);

      // 8. Rack Tom 2 (Mid Tom: D2 ~ 73Hz)
      const tom2 = new Tone.MembraneSynth({
        pitchDecay: 0.045,
        octaves: 4.5,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.002,
          decay: 0.32,
          sustain: 0.0,
          release: 0.35,
        },
      }).connect(drumBus);

      // 9. Floor Tom (Low Tom: A1 ~ 55Hz)
      const floorTom = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 5,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.002,
          decay: 0.42,
          sustain: 0.0,
          release: 0.45,
        },
      }).connect(drumBus);

      // 10. Hi-Hat Foot (Chick sound: filtered tight white noise)
      const hhFootFilter = new Tone.Filter({
        frequency: 8500,
        type: 'highpass',
      }).connect(drumBus);

      const hihatFoot = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.038,
          sustain: 0,
        },
      }).connect(hhFootFilter);
      hihatFoot.volume.value = -4;

      // 11. Cowbell (Classic resonant dual metal harmonics)
      const cowbell = new Tone.MetalSynth({
        envelope: {
          attack: 0.001,
          decay: 0.12,
          release: 0.04,
        },
        harmonicity: 1.45,
        modulationIndex: 12,
        resonance: 1400,
        octaves: 1.2,
      }).connect(drumBus);
      cowbell.frequency.value = 560;
      cowbell.volume.value = -5;

      // 12. China Cymbal (Trashy, explosive dark burst)
      const chinaMetal = new Tone.MetalSynth({
        envelope: {
          attack: 0.002,
          decay: 0.85,
          release: 0.35,
        },
        harmonicity: 5.2,
        modulationIndex: 42,
        resonance: 2800,
        octaves: 2.0,
      }).connect(drumBus);
      chinaMetal.frequency.value = 210;
      chinaMetal.volume.value = -3;

      // Independent Metronome Bus with dedicated master volume
      const metronomeBus = new Tone.Volume(metronomeVolumeRef.current).toDestination();

      // 13. Metronome synth: High-precision synth for acoustic/digital click (1600Hz / 800Hz / 400Hz)
      const clickSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.0005,
          decay: 0.02,
          sustain: 0,
          release: 0.015,
        },
      }).connect(metronomeBus);

      // 14. Syncopation Drill Anchor Synths: Woodblock / digital rimshot
      const anchorSynth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2.2,
        oscillator: { type: 'sine' },
        envelope: {
          attack: 0.001,
          decay: 0.045,
          sustain: 0,
          release: 0.03,
        },
      }).connect(metronomeBus);
      anchorSynth.volume.value = 2;

      const anchorNoise = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: 0.012,
          sustain: 0,
        },
      }).connect(metronomeBus);
      anchorNoise.volume.value = -10;

      synthsRef.current = {
        kick,
        snareBody,
        snareNoise,
        hihatClosed,
        hihatOpen,
        hihatFoot,
        ride,
        crashMetal,
        crashNoise,
        chinaMetal,
        cowbell,
        tom1,
        tom2,
        floorTom,
        metronomeBus,
        clickSynth,
        anchorSynth,
        anchorNoise,
      };

      Tone.Transport.bpm.value = bpmRef.current;
      Tone.Transport.swing = swingRef.current;
      Tone.Transport.swingSubdivision = '16n';
      Tone.Transport.loop = isLoopingRef.current;
      isAudioReadyRef.current = true;
    } catch (e) {
      console.warn('Tone.js audio chain initialization awaiting gesture:', e);
    }
  }, []);

  // Trigger sound instantly for previews or interactive hits
  const playHit = useCallback(
    async (pieceId: DrumPieceId, accent: boolean = false, ghost: boolean = false, time?: number) => {
      await initAudio();
      const synths = synthsRef.current;
      const Tone = ToneRef.current;
      if (!synths || !Tone) return;

      const triggerTime = time !== undefined ? time : Tone.now();

      // Velocity scaling: accent = 1.0, normal = 0.72, ghost = 0.28
      let velocity = accent ? 1.0 : ghost ? 0.28 : 0.72;

      switch (pieceId) {
        case 'kick':
          synths.kick.triggerAttackRelease('C1', '8n', triggerTime, velocity);
          break;

        case 'snare':
          synths.snareBody.triggerAttackRelease(ghost ? 'E2' : 'D2', '16n', triggerTime, velocity);
          synths.snareNoise.triggerAttackRelease('16n', triggerTime, velocity * 0.9);
          break;

        case 'hihat':
        case 'hihatClosed':
          synths.hihatClosed.triggerAttackRelease('32n', triggerTime, velocity * 0.85);
          break;

        case 'hihatOpen':
          synths.hihatOpen.triggerAttackRelease('8n', triggerTime, velocity * 0.85);
          break;

        case 'hihatFoot':
          synths.hihatFoot.triggerAttackRelease('32n', triggerTime, velocity * 0.8);
          break;

        case 'cowbell':
          synths.cowbell.triggerAttackRelease('16n', triggerTime, velocity * 0.85);
          break;

        case 'china':
          synths.chinaMetal.triggerAttackRelease('4n', triggerTime, velocity);
          break;

        case 'ride':
          synths.ride.triggerAttackRelease('8n', triggerTime, velocity * 0.75);
          break;

        case 'crash':
          synths.crashMetal.triggerAttackRelease('4n', triggerTime, velocity);
          synths.crashNoise.triggerAttackRelease('4n', triggerTime, velocity * 0.6);
          break;

        case 'tom1':
          synths.tom1.triggerAttackRelease('G2', '8n', triggerTime, velocity);
          break;

        case 'tom2':
          synths.tom2.triggerAttackRelease('D2', '8n', triggerTime, velocity);
          break;

        case 'floorTom':
          synths.floorTom.triggerAttackRelease('A1', '8n', triggerTime, velocity);
          break;
      }
    },
    [initAudio]
  );

  // Play metronome click / anchor pulse
  const playClick = useCallback(
    (beatIndex: number, isDownbeat: boolean, isSubdivision: boolean, time: number) => {
      const synths = synthsRef.current;
      if (!synths) return;
      if (!isMetronomeRef.current && !isSyncopationDrillRef.current) return;

      if (isSyncopationDrillRef.current) {
        // Modo Anclaje / Syncopation Drill:
        // Acoustic woodblock / digital rimshot timbre strictly marking the 4 ground beats
        if (isSubdivision) return;
        if (isDownbeat) {
          // Downbeat (Tiempo 1 fuerte)
          synths.anchorSynth.triggerAttackRelease('A4', '32n', time, 1.0);
          synths.anchorNoise.triggerAttackRelease('32n', time, 0.45);
        } else {
          // Ground beats 2, 3, 4 (Pulsos a tierra)
          synths.anchorSynth.triggerAttackRelease('F#4', '32n', time, 0.8);
          synths.anchorNoise.triggerAttackRelease('32n', time, 0.25);
        }
        return;
      }

      // Standard Metronome
      if (isSubdivision) {
        // Clic de subdivisión: Frecuencia 400 Hz a volumen atenuado (-6 dB ~ 0.35 vel)
        synths.clickSynth.triggerAttackRelease(400, '32n', time, 0.35);
      } else if (isDownbeat) {
        // Tiempo 1 (Downbeat fuerte): Frecuencia 1600 Hz (clic agudo y penetrante)
        synths.clickSynth.triggerAttackRelease(1600, '32n', time, 1.0);
      } else {
        // Tiempos 2, 3 y 4 (Pulsos a tierra): Frecuencia 800 Hz
        synths.clickSynth.triggerAttackRelease(800, '32n', time, 0.75);
      }
    },
    []
  );

  // Schedule all measures on Tone.Transport
  const scheduleScore = useCallback(
    async (measures: DrumMeasure[]) => {
      await initAudio();
      const Tone = ToneRef.current;
      if (!Tone) return;

      currentMeasuresRef.current = measures;

      // Clear existing scheduled events
      Tone.Transport.cancel();
      loopEventIdsRef.current = [];

      let totalMeasureTime = 0;
      let tiedPiecesFromPrev = new Set<string>();

      measures.forEach((measure, mIdx) => {
        const [beatsCount, beatValue] = measure.timeSignature;
        // In 4/4, beat is a quarter note (4n). In 7/8, beat is an 8th note (8n)
        const beatNote = `${beatValue}n`;
        const beatDuration = Tone.Time(beatNote).toSeconds();
        const measureDuration = beatsCount * beatDuration;
        const measureStartTime = totalMeasureTime;

        measure.beats.forEach((beat, bIdx) => {
          const beatStartTime = measureStartTime + bIdx * beatDuration;
          const sub = beat.subdivision || 1;
          const stepDuration =
            sub === 0.25
              ? beatDuration * 4
              : sub === 0.5
              ? beatDuration * 2
              : beatDuration / sub;

          // Schedule metronome click and visual beat flash at beat start
          Tone.Transport.schedule((time: number) => {
            const isDownbeat = bIdx === 0;
            const mode = metronomeModeRef.current;
            const drill = isSyncopationDrillRef.current;
            const active = isMetronomeRef.current || drill;

            if (active) {
              if (drill || mode === 'beats' || mode === 'subdivision' || (mode === 'downbeat' && isDownbeat)) {
                playClick(bIdx, isDownbeat, false, time);
              }
            }

            // Visual beat pulse synchronized with Tone.Transport
            Tone.Draw.schedule(() => {
              setCurrentBeatFlash({
                beatIndex: bIdx,
                isDownbeat,
                timestamp: Date.now(),
              });
            }, time);
          }, beatStartTime);

          beat.steps.forEach((step, sIdx) => {
            const stepTime = beatStartTime + sIdx * stepDuration;

            // Schedule subdivision metronome clicks if enabled and not in drill
            if (sIdx > 0) {
              Tone.Transport.schedule((time: number) => {
                if (isMetronomeRef.current && !isSyncopationDrillRef.current && metronomeModeRef.current === 'subdivision') {
                  playClick(bIdx, false, true, time);
                }
              }, stepTime);
            }

            // Determine which hits are tied into this step from previous
            const currentTiedFromPrev = new Set(tiedPiecesFromPrev);

            // Prepare tied pieces for the next step
            tiedPiecesFromPrev = new Set<string>();
            if (step.tiedToNext && step.hits) {
              step.hits.forEach((h) => tiedPiecesFromPrev.add(h.pieceId));
            } else if (step.hits) {
              step.hits.forEach((h) => {
                if (h.tiedToNext) tiedPiecesFromPrev.add(h.pieceId);
              });
            }

            Tone.Transport.schedule((time: number) => {
              // Trigger hits for this step only if NOT a rest
              if (!step.isRest && step.hits && step.hits.length > 0) {
                step.hits.forEach((hit) => {
                  // Omit hit if tied from previous to simulate rhythmic prolongation (letting cymbals sustain or percussive suspension)
                  const isTied = step.tiedFromPrev || currentTiedFromPrev.has(hit.pieceId);
                  if (!isTied) {
                    playHit(hit.pieceId, hit.accent, hit.ghost, time);
                  }
                });
              }

              // Update playhead visual position via Tone.Draw for UI sync
              Tone.Draw.schedule(() => {
                const progress = totalDuration > 0 ? (stepTime / totalDuration) : 0;
                setPlayhead({
                  measureIndex: mIdx,
                  beatIndex: bIdx,
                  stepIndex: sIdx,
                  progress,
                });
              }, time);
            }, stepTime);
          });
        });

        totalMeasureTime += measureDuration;
      });

      const totalDuration = totalMeasureTime > 0 ? totalMeasureTime : 2;
      totalDurationRef.current = totalDuration;
      Tone.Transport.loopStart = 0;
      Tone.Transport.loopEnd = totalDuration;
      Tone.Transport.loop = isLoopingRef.current;
    },
    [initAudio, playHit, playClick]
  );

  // Play / Pause / Stop controls
  const play = useCallback(async (measures?: DrumMeasure[]) => {
    await initAudio();
    const Tone = ToneRef.current;
    if (!Tone) return;

    if (measures) {
      scheduleScore(measures);
    } else if (currentMeasuresRef.current.length > 0) {
      scheduleScore(currentMeasuresRef.current);
    }

    Tone.Transport.start();
    setIsPlaying(true);
    isPlayingRef.current = true;
  }, [initAudio, scheduleScore]);

  const pause = useCallback(() => {
    if (ToneRef.current) {
      ToneRef.current.Transport.pause();
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, []);

  const stop = useCallback(() => {
    if (ToneRef.current) {
      ToneRef.current.Transport.stop();
      ToneRef.current.Transport.seconds = 0;
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
    setPlayhead({
      measureIndex: 0,
      beatIndex: 0,
      stepIndex: 0,
      progress: 0,
    });
  }, []);

  const togglePlay = useCallback(
    (measures?: DrumMeasure[]) => {
      if (isPlayingRef.current) {
        pause();
      } else {
        play(measures);
      }
    },
    [pause, play]
  );

  const setBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(30, Math.min(280, Math.round(newBpm)));
    setBpmState(clamped);
    if (ToneRef.current?.Transport) {
      ToneRef.current.Transport.bpm.value = clamped;
    }
  }, []);

  const setSwing = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(0.7, Number(val.toFixed(2))));
    setSwingState(clamped);
    if (ToneRef.current?.Transport) {
      ToneRef.current.Transport.swing = clamped;
      ToneRef.current.Transport.swingSubdivision = '16n';
    }
  }, []);

  const toggleMetronome = useCallback(() => {
    setIsMetronomeActive((prev) => !prev);
  }, []);

  const setMetronomeMode = useCallback((mode: MetronomeMode) => {
    setMetronomeModeState(mode);
    metronomeModeRef.current = mode;
  }, []);

  const setMetronomeVolume = useCallback((db: number) => {
    setMetronomeVolumeState(db);
    metronomeVolumeRef.current = db;
    if (synthsRef.current?.metronomeBus) {
      synthsRef.current.metronomeBus.volume.value = db;
    }
  }, []);

  const toggleSyncopationDrill = useCallback(() => {
    setIsSyncopationDrillState((prev) => {
      const next = !prev;
      isSyncopationDrillRef.current = next;
      return next;
    });
  }, []);

  const setSyncopationDrill = useCallback((active: boolean) => {
    setIsSyncopationDrillState(active);
    isSyncopationDrillRef.current = active;
  }, []);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  // Continuous high-precision transport queries and seeking
  const getTransportSeconds = useCallback(() => {
    if (!ToneRef.current?.Transport) return 0;
    return ToneRef.current.Transport.seconds || 0;
  }, []);

  const getTransportProgress = useCallback(() => {
    if (!ToneRef.current?.Transport || totalDurationRef.current <= 0) return 0;
    return (ToneRef.current.Transport.seconds % totalDurationRef.current) / totalDurationRef.current;
  }, []);

  const getTotalDuration = useCallback(() => {
    return totalDurationRef.current;
  }, []);

  const seekToSeconds = useCallback((sec: number) => {
    if (ToneRef.current?.Transport) {
      const maxSec = totalDurationRef.current > 0 ? totalDurationRef.current : 100;
      const clamped = Math.max(0, Math.min(maxSec - 0.001, sec));
      ToneRef.current.Transport.seconds = clamped;
    }
  }, []);

  const seekToStep = useCallback((measureIndex: number, beatIndex: number = 0, stepIndex: number = 0) => {
    const measures = currentMeasuresRef.current;
    if (!measures || measures.length === 0) return;

    let time = 0;
    for (let m = 0; m < measures.length; m++) {
      const [beatsCount, beatValue] = measures[m].timeSignature;
      const beatDuration = (60 / bpmRef.current) * (4 / beatValue);
      const measureDuration = beatsCount * beatDuration;

      if (m === measureIndex) {
        const beat = measures[m].beats[beatIndex];
        const sub = beat?.subdivision || 1;
        const stepDuration =
          sub === 0.25
            ? beatDuration * 4
            : sub === 0.5
            ? beatDuration * 2
            : beatDuration / sub;
        time += beatIndex * beatDuration + stepIndex * stepDuration;
        break;
      }
      time += measureDuration;
    }

    if (ToneRef.current?.Transport) {
      ToneRef.current.Transport.seconds = time;
    }

    const progress = totalDurationRef.current > 0 ? time / totalDurationRef.current : 0;
    setPlayhead({
      measureIndex,
      beatIndex,
      stepIndex,
      progress,
    });
  }, []);

  return {
    isPlaying,
    bpm,
    swing,
    isMetronomeActive,
    metronomeMode,
    metronomeVolume,
    isSyncopationDrill,
    currentBeatFlash,
    isLooping,
    playhead,
    play,
    pause,
    stop,
    togglePlay,
    setBpm,
    setSwing,
    toggleMetronome,
    setMetronomeMode,
    setMetronomeVolume,
    toggleSyncopationDrill,
    setSyncopationDrill,
    toggleLoop,
    playHit,
    scheduleScore,
    initAudio,
    getTransportSeconds,
    getTransportProgress,
    getTotalDuration,
    seekToSeconds,
    seekToStep,
  };
}
