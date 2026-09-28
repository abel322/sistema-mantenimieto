'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  InstrumentType,
  TuningId,
  FretboardOverlayMode,
  MusicalKey,
  ScaleType,
  StringTrack,
  SequencerStepCell,
} from '@/types/strings';
import {
  getInstrumentStrings,
  ActiveFretHit,
} from './InteractiveFretboard';
import InteractiveFretboard from './InteractiveFretboard';
import StringsSequencerGrid from './StringsSequencerGrid';
import StringsTransportBar from './StringsTransportBar';
import {
  stringsAudioEngine,
  calculateFretNote,
} from '@/services/audio/stringsAudioEngine';
import { Guitar, Sparkles, Activity, Layers, Volume2 } from 'lucide-react';

// Generates blank tracks for an instrument setup
function generateInitialTracks(
  instrument: InstrumentType,
  tuning: TuningId,
  measuresCount: number
): StringTrack[] {
  const strings = getInstrumentStrings(instrument, tuning);
  const totalSteps = measuresCount * 16;

  return strings.map((str, sIdx) => ({
    stringIndex: sIdx,
    stringName: str.name,
    basePitch: str.basePitch,
    gauge: str.gauge,
    steps: Array.from({ length: totalSteps }, () => ({
      fret: null,
      articulation: 'normal',
    })),
  }));
}

export default function FretboardSequencerStudio() {
  // Instrument and Tuning
  const [instrument, setInstrument] = useState<InstrumentType>('bass_4');
  const [tuning, setTuning] = useState<TuningId>('standard');

  // Fretboard Overlays
  const [overlayMode, setOverlayMode] = useState<FretboardOverlayMode>('notes');
  const [musicalKey, setMusicalKey] = useState<MusicalKey>('E');
  const [scaleType, setScaleType] = useState<ScaleType>('minor_pentatonic');

  // Sequencer Settings
  const [measuresCount, setMeasuresCount] = useState<number>(2);
  const [tracks, setTracks] = useState<StringTrack[]>(() =>
    generateInitialTracks('bass_4', 'standard', 2)
  );

  // Transport State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(104);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);

  // Active glowing fret notes currently sounding
  const [activeHits, setActiveHits] = useState<ActiveFretHit[]>([]);

  // Timer Ref for playback clock
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef<number>(0);
  currentStepRef.current = currentStep;

  const tracksRef = useRef<StringTrack[]>(tracks);
  tracksRef.current = tracks;

  const instrumentRef = useRef<InstrumentType>(instrument);
  instrumentRef.current = instrument;

  // Stop playback cleanly
  const stopPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
    setActiveHits([]);
    stringsAudioEngine.stopAll();
  }, []);

  // Update tracks when measures count changes
  const handleMeasuresCountChange = useCallback((newCount: number) => {
    setMeasuresCount(newCount);
    const newTotalSteps = newCount * 16;

    setTracks((prev) =>
      prev.map((track) => {
        const nextSteps: SequencerStepCell[] = [];
        for (let i = 0; i < newTotalSteps; i++) {
          nextSteps.push(
            track.steps[i] || {
              fret: null,
              articulation: 'normal',
            }
          );
        }
        return {
          ...track,
          steps: nextSteps,
        };
      })
    );
  }, []);

  // Update tracks when instrument or tuning changes
  const handleInstrumentChange = useCallback((newInst: InstrumentType) => {
    setInstrument(newInst);
    setTracks(generateInitialTracks(newInst, tuning, measuresCount));
    stopPlayback();
  }, [tuning, measuresCount, stopPlayback]);

  const handleTuningChange = useCallback((newTuning: TuningId) => {
    setTuning(newTuning);
    setTracks(generateInitialTracks(instrument, newTuning, measuresCount));
    stopPlayback();
  }, [instrument, measuresCount, stopPlayback]);

  // Update a single step cell
  const handleUpdateStep = useCallback((stringIdx: number, stepIdx: number, stepData: SequencerStepCell) => {
    setTracks((prev) =>
      prev.map((track, idx) => {
        if (idx !== stringIdx) return track;
        const updatedSteps = [...track.steps];
        updatedSteps[stepIdx] = stepData;
        return {
          ...track,
          steps: updatedSteps,
        };
      })
    );

    // If fret was set, audition note immediately
    if (stepData.fret !== null) {
      const track = tracksRef.current[stringIdx];
      if (track) {
        const note = calculateFretNote(track.basePitch, stepData.fret);
        stringsAudioEngine.playNote(instrumentRef.current, note.fullNote, stepData.articulation || 'normal');
      }
    }
  }, []);

  // Clear all grid notes
  const handleClearGrid = useCallback(() => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        steps: track.steps.map(() => ({ fret: null, articulation: 'normal' })),
      }))
    );
    setActiveHits([]);
  }, []);

  // Playhead Clock Trigger
  const triggerStep = useCallback((stepIdx: number) => {
    const currentTracks = tracksRef.current;
    const currentInst = instrumentRef.current;
    const hitsThisStep: ActiveFretHit[] = [];

    currentTracks.forEach((track, sIdx) => {
      const cell = track.steps[stepIdx];
      if (cell && cell.fret !== null) {
        const noteInfo = calculateFretNote(track.basePitch, cell.fret);
        stringsAudioEngine.playNote(
          currentInst,
          noteInfo.fullNote,
          cell.articulation || 'normal',
          '16n'
        );

        hitsThisStep.push({
          stringIndex: sIdx,
          fret: cell.fret,
          articulation: cell.articulation,
        });
      }
    });

    setActiveHits(hitsThisStep);
  }, []);

  // Playback Loop Runner
  const togglePlay = useCallback(async () => {
    await stringsAudioEngine.ensureStarted();

    if (isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPlaying(false);
      setActiveHits([]);
      stringsAudioEngine.stopAll();
      return;
    }

    setIsPlaying(true);
    const totalSteps = measuresCount * 16;
    const stepDurationMs = (60000 / bpm) / 4;

    // Trigger immediate step 0
    triggerStep(currentStepRef.current);

    timerRef.current = setInterval(() => {
      let nextStep = currentStepRef.current + 1;
      if (nextStep >= totalSteps) {
        if (!isLoop) {
          stopPlayback();
          return;
        }
        nextStep = 0;
      }

      currentStepRef.current = nextStep;
      setCurrentStep(nextStep);
      triggerStep(nextStep);
    }, stepDurationMs);
  }, [isPlaying, measuresCount, bpm, isLoop, triggerStep, stopPlayback]);

  // Handle BPM live changes during playback
  useEffect(() => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      const totalSteps = measuresCount * 16;
      const stepDurationMs = (60000 / bpm) / 4;

      timerRef.current = setInterval(() => {
        let nextStep = currentStepRef.current + 1;
        if (nextStep >= totalSteps) {
          if (!isLoop) {
            stopPlayback();
            return;
          }
          nextStep = 0;
        }

        currentStepRef.current = nextStep;
        setCurrentStep(nextStep);
        triggerStep(nextStep);
      }, stepDurationMs);
    }
  }, [bpm, isPlaying, measuresCount, isLoop, triggerStep, stopPlayback]);

  // Volume slider update
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    stringsAudioEngine.setVolume(vol);
  };

  // Load Presets
  const handleLoadPreset = (presetId: string) => {
    stopPlayback();

    if (presetId === 'bass_slap_funk') {
      setInstrument('bass_4');
      setBpm(108);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      // G cuerda: pop en notas agudas
      // D cuerda: slap notas medias
      // A cuerda: slap
      // E cuerda: slap base
      newTracks[3].steps[0] = { fret: 0, articulation: 'slap' }; // E0 slap
      newTracks[1].steps[2] = { fret: 2, articulation: 'ghost' }; // Ghost
      newTracks[0].steps[3] = { fret: 0, articulation: 'pop' }; // G pop
      newTracks[3].steps[6] = { fret: 3, articulation: 'slap' }; // G slap
      newTracks[0].steps[7] = { fret: 5, articulation: 'pop' }; // C pop
      newTracks[3].steps[8] = { fret: 0, articulation: 'slap' }; // E slap
      newTracks[2].steps[10] = { fret: 5, articulation: 'slap' }; // D slap
      newTracks[0].steps[11] = { fret: 7, articulation: 'pop' }; // D pop
      newTracks[3].steps[14] = { fret: 5, articulation: 'slap' }; // A slap
      setTracks(newTracks);
    } else if (presetId === 'bass_walking_jazz') {
      setInstrument('bass_4');
      setBpm(120);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      newTracks[3].steps[0] = { fret: 0, articulation: 'normal' }; // E
      newTracks[3].steps[4] = { fret: 4, articulation: 'normal' }; // G#
      newTracks[2].steps[8] = { fret: 2, articulation: 'normal' }; // B
      newTracks[1].steps[12] = { fret: 1, articulation: 'normal' }; // D#
      setTracks(newTracks);
    } else if (presetId === 'bass_rock_pump') {
      setInstrument('bass_4');
      setBpm(130);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      for (let i = 0; i < 16; i += 2) {
        newTracks[2].steps[i] = { fret: 0, articulation: 'normal' }; // A 8th notes
      }
      newTracks[2].steps[14] = { fret: 3, articulation: 'normal' }; // C
      setTracks(newTracks);
    } else if (presetId === 'bass_disco_octaves') {
      setInstrument('bass_4');
      setBpm(118);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      for (let i = 0; i < 16; i += 4) {
        newTracks[3].steps[i] = { fret: 5, articulation: 'normal' }; // A1
        newTracks[1].steps[i + 2] = { fret: 7, articulation: 'normal' }; // A2
      }
      setTracks(newTracks);
    } else if (presetId === 'guitar_neo_soul') {
      setInstrument('guitar_6');
      setBpm(84);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      // Emaj9 arpeggio: Low E, B, G, high E
      newTracks[5].steps[0] = { fret: 0, articulation: 'downstroke' }; // E2
      newTracks[3].steps[2] = { fret: 4, articulation: 'downstroke' }; // F#3
      newTracks[2].steps[4] = { fret: 4, articulation: 'downstroke' }; // B3
      newTracks[1].steps[6] = { fret: 4, articulation: 'downstroke' }; // D#4
      newTracks[0].steps[8] = { fret: 2, articulation: 'upstroke' }; // F#4
      newTracks[1].steps[10] = { fret: 4, articulation: 'downstroke' };
      newTracks[2].steps[12] = { fret: 4, articulation: 'downstroke' };
      newTracks[3].steps[14] = { fret: 4, articulation: 'downstroke' };
      setTracks(newTracks);
    } else if (presetId === 'guitar_metal_chug') {
      setInstrument('guitar_6');
      setBpm(140);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      for (let i = 0; i < 16; i++) {
        if (i === 6 || i === 14) {
          newTracks[5].steps[i] = { fret: 3, articulation: 'downstroke' };
          newTracks[4].steps[i] = { fret: 5, articulation: 'downstroke' };
        } else {
          newTracks[5].steps[i] = { fret: 0, articulation: 'palmmute' };
        }
      }
      setTracks(newTracks);
    } else if (presetId === 'guitar_funk_chops') {
      setInstrument('guitar_6');
      setBpm(105);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      [0, 3, 6, 8, 11, 14].forEach((s) => {
        newTracks[0].steps[s] = { fret: 7, articulation: s % 2 === 0 ? 'downstroke' : 'upstroke' };
        newTracks[1].steps[s] = { fret: 8, articulation: s % 2 === 0 ? 'downstroke' : 'upstroke' };
        newTracks[2].steps[s] = { fret: 7, articulation: s % 2 === 0 ? 'downstroke' : 'upstroke' };
      });
      setTracks(newTracks);
    } else if (presetId === 'guitar_indie_riff') {
      setInstrument('guitar_6');
      setBpm(116);
      setMeasuresCount(1);
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      newTracks[0].steps[0] = { fret: 7, articulation: 'downstroke' };
      newTracks[1].steps[2] = { fret: 8, articulation: 'downstroke' };
      newTracks[0].steps[4] = { fret: 5, articulation: 'upstroke' };
      newTracks[1].steps[6] = { fret: 8, articulation: 'downstroke' };
      newTracks[2].steps[8] = { fret: 7, articulation: 'downstroke' };
      newTracks[1].steps[10] = { fret: 8, articulation: 'downstroke' };
      newTracks[0].steps[12] = { fret: 7, articulation: 'downstroke' };
      newTracks[0].steps[14] = { fret: 10, articulation: 'downstroke' };
      setTracks(newTracks);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stringsAudioEngine.stopAll();
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Studio Header Card */}
      <div className="w-full bg-[#0E1526]/80 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0">
            <Guitar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                SONORA STRINGS LAB
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                Bajo & Guitarra 2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Diapasón Interactivo & Secuenciador de Cuerdas
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualiza digitaciones, intervalos y escalas sobre el mástil con audio reactivo en tiempo real
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPlaying ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
            }`}
          />
          <span className="text-slate-300 font-bold">
            {isPlaying ? `Tocando Paso ${currentStep + 1}/${measuresCount * 16}` : 'Estudio Listo'}
          </span>
        </div>
      </div>

      {/* 1. Barra de Transporte */}
      <StringsTransportBar
        isPlaying={isPlaying}
        bpm={bpm}
        isLoop={isLoop}
        measuresCount={measuresCount}
        instrument={instrument}
        tuning={tuning}
        overlayMode={overlayMode}
        musicalKey={musicalKey}
        scaleType={scaleType}
        volume={volume}
        onTogglePlay={togglePlay}
        onStop={stopPlayback}
        onBpmChange={setBpm}
        onToggleLoop={() => setIsLoop((prev) => !prev)}
        onMeasuresCountChange={handleMeasuresCountChange}
        onInstrumentChange={handleInstrumentChange}
        onTuningChange={handleTuningChange}
        onOverlayModeChange={setOverlayMode}
        onKeyChange={setMusicalKey}
        onScaleChange={setScaleType}
        onVolumeChange={handleVolumeChange}
      />

      {/* 2. Diapasón Interactivo */}
      <div className="w-full bg-[#0E1526]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Mástil en Tiempo Real (Trastes 0 al 24)
            </h3>
            <span className="text-xs text-slate-400">
              • Haz clic en cualquier traste para audicionar la nota
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" /> Tónica (R)
            </span>
            <span className="flex items-center gap-1 ml-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Nota Activa
            </span>
          </div>
        </div>

        <InteractiveFretboard
          instrument={instrument}
          tuning={tuning}
          overlayMode={overlayMode}
          musicalKey={musicalKey}
          scaleType={scaleType}
          activeHits={activeHits}
          onFretClick={(sIdx, fret) => {
            // Optional: insert into current sequencer step if desired
          }}
        />
      </div>

      {/* 3. Secuenciador por Pasos & Tablatura */}
      <StringsSequencerGrid
        instrument={instrument}
        tracks={tracks}
        measuresCount={measuresCount}
        currentStep={currentStep}
        isPlaying={isPlaying}
        onUpdateStep={handleUpdateStep}
        onClearGrid={handleClearGrid}
        onLoadPreset={handleLoadPreset}
      />
    </div>
  );
}
