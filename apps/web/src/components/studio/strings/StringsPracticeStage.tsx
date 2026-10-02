'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Tone from 'tone';
import { useStringsPractice, StringNoteEvent } from '@/context/StringsPracticeContext';
import {
  InstrumentType,
  TuningId,
  StringTrack,
  SequencerStepCell,
} from '@/types/strings';
import {
  stringsAudioEngine,
  calculateFretNote,
} from '@/services/audio/stringsAudioEngine';
import {
  getInstrumentStrings,
  ActiveFretHit,
  ActiveHitNote,
} from './InteractiveFretboard';
import InteractiveFretboard from './InteractiveFretboard';
import StringsRunwayView from './StringsRunwayView';
import StringsSequencerGrid from './StringsSequencerGrid';
import {
  Play,
  Pause,
  Square,
  Repeat,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Zap,
  Music,
  Activity,
  Radio,
  Clock,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function StringsPracticeStage() {
  const router = useRouter();
  const {
    title,
    instrument,
    tuning,
    bpm,
    timeSignature,
    measuresCount,
    tracks,
    activeTheory,
    displayMode,
    isMetronomeActive,
    updateBpm,
    setDisplayMode,
    toggleMetronome,
  } = useStringsPractice();

  // Estados de montaje y fullscreen
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [zoom, setZoom] = useState<1 | 2 | 4>(2);

  // Active glowing notes on fretboard
  const [activeHits, setActiveHits] = useState<ActiveFretHit[]>([]);
  const [activeHitNotes, setActiveHitNotes] = useState<ActiveHitNote[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ stringIndex: number; stepIndex: number } | null>(null);

  // Tap tempo state
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);

  // Metronome pulse indicator
  const [currentBeatFlash, setCurrentBeatFlash] = useState<{ beatIndex: number; timestamp: number } | null>(null);

  // Tone.js clock interval ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;

  const totalSteps = measuresCount * 16;
  const beatsPerMeasure = timeSignature[0] || 4;

  // Mount effect
  useEffect(() => {
    setMounted(true);
    stringsAudioEngine.ensureStarted().catch(() => {});
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen toggle error:', e);
    }
  };

  // Tap tempo handler
  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const newTaps = [...tapTimestamps.filter((t) => now - t < 3000), now];
    setTapTimestamps(newTaps);

    if (newTaps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 260) {
        updateBpm(calculatedBpm);
      }
    }
  }, [tapTimestamps, updateBpm]);

  // Audio note trigger handler from runway
  const handleNoteTrigger = useCallback(
    (note: { stringIndex: number; fret: number; duration?: string }) => {
      const track = tracks[note.stringIndex];
      if (!track) return;

      // Play audio synth note
      stringsAudioEngine.playFret(instrument, track.basePitch, note.fret);

      // Light up note on fretboard
      const hitId = `${note.stringIndex}-${note.fret}-${Date.now()}`;
      setActiveHitNotes((prev) => [...prev, { stringIndex: note.stringIndex, fret: note.fret, id: hitId }]);
      setActiveHits((prev) => [...prev, { stringIndex: note.stringIndex, fret: note.fret }]);

      setTimeout(() => {
        setActiveHitNotes((prev) => prev.filter((h) => h.id !== hitId));
        setActiveHits((prev) => prev.filter((h) => !(h.stringIndex === note.stringIndex && h.fret === note.fret)));
      }, 240);
    },
    [instrument, tracks]
  );

  // Playback timer loop
  const stopPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      Tone.getTransport().stop();
    } catch (_) {}
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(async () => {
    await stringsAudioEngine.ensureStarted();
    try {
      await Tone.start();
      Tone.getTransport().bpm.value = bpm;
      Tone.getTransport().start();
    } catch (_) {}

    setIsPlaying(true);
    const stepDurationMs = (60000 / (bpm * 4));

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const nextStep = (currentStepRef.current + 1) % totalSteps;
      setCurrentStep(nextStep);

      // Beat flash indicator
      if (nextStep % 4 === 0) {
        const beatIdx = (nextStep / 4) % beatsPerMeasure;
        setCurrentBeatFlash({ beatIndex: beatIdx, timestamp: Date.now() });

        // Metronome click sound
        if (isMetronomeActive) {
          try {
            const freq = beatIdx === 0 ? 1200 : 800;
            const synth = new Tone.Synth({
              oscillator: { type: 'sine' },
              envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
            }).toDestination();
            synth.triggerAttackRelease(freq, '32n');
          } catch (_) {}
        }
      }

      // Trigger notes for this step
      tracks.forEach((track, sIdx) => {
        const cell = track.steps[nextStep];
        if (cell && cell.fret !== null) {
          handleNoteTrigger({
            stringIndex: sIdx,
            fret: cell.fret,
            duration: cell.duration || '16n',
          });
        }
      });
    }, stepDurationMs);
  }, [bpm, totalSteps, beatsPerMeasure, isMetronomeActive, tracks, handleNoteTrigger]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, stopPlayback, startPlayback]);

  const handleReset = useCallback(() => {
    stopPlayback();
    setCurrentStep(0);
    currentStepRef.current = 0;
  }, [stopPlayback]);

  // Clean timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        Tone.getTransport().stop();
      } catch (_) {}
    };
  }, []);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMetronome();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setIsLooping((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleReset, toggleMetronome]);

  // Format instrument and tuning label
  const instrumentLabel = useMemo(() => {
    switch (instrument) {
      case 'bass_4':
        return 'Bajo 4 Cuerdas';
      case 'bass_5':
        return 'Bajo 5 Cuerdas';
      case 'guitar_6':
        return 'Guitarra 6 Cuerdas';
      default:
        return 'Cuerdas';
    }
  }, [instrument]);

  const tuningLabel = useMemo(() => {
    switch (tuning) {
      case 'drop_d':
        return 'Drop D';
      case 'half_step_down':
        return 'Eb Standard';
      default:
        return 'Standard';
    }
  }, [tuning]);

  // Safe early return placed strictly after all hooks
  if (!mounted) {
    return (
      <div className="w-full min-h-[60vh] bg-[#080c14] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-amber-400">
            Cargando Escenario Synthesia Strings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[#080c14] text-slate-100 flex flex-col justify-start py-6 px-3 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-6 select-none">
        {/* ================================================================= */}
        {/* A) TOP HUD MINIMALISTA                                            */}
        {/* ================================================================= */}
        <header className="w-full p-3 sm:p-4 rounded-2xl bg-[#0a0f1d]/95 border border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Botón Volver al Editor + Info de Rutina */}
        <div className="flex items-center gap-3">
          <Link
            href="/studio/strings"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-2 text-xs font-bold font-mono group cursor-pointer shadow-sm"
            title="Volver al Taller DAW para editar notas y teoría"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Volver al Editor</span>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Título & Metadatos */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            <h1 className="text-sm sm:text-base font-black text-slate-100 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {title || activeTheory.title}
            </h1>
            <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/80 font-bold">
              {instrumentLabel} • {tuningLabel}
            </span>
          </div>
        </div>

        {/* Center: Controles de Transporte Compactos */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
          {/* Play / Pausa */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.6)] scale-105'
                : 'bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95'
            }`}
            title="Reproducir / Pausar (Barra Espaciadora)"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
            )}
          </button>

          {/* Reset / Stop (C1.1) */}
          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Reiniciar al compás 1 pulso 1 (Tecla R)"
          >
            <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
          </button>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isLooping
                ? 'bg-amber-950 text-amber-300 border border-amber-700/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
            title="Bucle Continuo (Tecla L)"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* BPM Adjustment */}
          <div className="flex items-center gap-1.5 px-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">BPM</span>
            <button
              type="button"
              onClick={() => updateBpm(bpm - 5)}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-amber-300">{bpm}</span>
            <button
              type="button"
              onClick={() => updateBpm(bpm + 5)}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleTapTempo}
              className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-400 text-[10px] font-bold border border-slate-800 cursor-pointer"
              title="Haz clic a tempo para calcular BPM"
            >
              TAP
            </button>
          </div>

          {/* Metronome Toggle con Lámparas de Pulso */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              type="button"
              onClick={toggleMetronome}
              className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                isMetronomeActive
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Click Metrónomo (Tecla M)"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="text-[10px]">CLICK</span>
            </button>

            {/* Lámparas de pulso (T1..T4) */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: beatsPerMeasure }).map((_, bIdx) => {
                const isFlash =
                  isPlaying &&
                  currentBeatFlash?.beatIndex === bIdx &&
                  Date.now() - (currentBeatFlash?.timestamp || 0) < 180;

                return (
                  <div
                    key={`beat-lamp-${bIdx}`}
                    className={`w-2 h-2 rounded-full transition-all ${
                      isFlash
                        ? bIdx === 0
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-125'
                          : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] scale-110'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Selector de Modo Visual & Pantalla Completa */}
        <div className="flex items-center gap-2">
          {/* Mode Selector: Runway vs Tab */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <button
              type="button"
              onClick={() => setDisplayMode('runway')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                displayMode === 'runway'
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black shadow-glow-amber'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Runway</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('tab')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                displayMode === 'tab'
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-950 font-black shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Tablatura</span>
            </button>
          </div>

          {/* Fullscreen API Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de Pantalla Completa' : 'Modo Pantalla Completa Inmersivo'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* B) ESCENARIO PRINCIPAL SYNTHESIA / ROCKSMITH                      */}
      {/* ================================================================= */}
      <main className="w-full flex flex-col gap-6">
        {/* Pista Superior: Runway Multi-Cuerda a 60 FPS */}
        <div className="w-full rounded-2xl bg-[#0a0f1d] border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col">
          {displayMode === 'runway' ? (
            <StringsRunwayView
              instrument={instrument}
              tracks={tracks}
              measuresCount={measuresCount}
              currentStep={currentStep}
              isPlaying={isPlaying}
              bpm={bpm}
              zoom={zoom}
              activeHits={activeHits}
              activeHitNotes={activeHitNotes}
              selectedCell={selectedCell}
              onSelectCell={setSelectedCell}
              onUpdateStep={() => {}}
              onNoteTrigger={handleNoteTrigger}
            />
          ) : (
            <div className="w-full h-full min-h-[260px] overflow-y-auto p-4 custom-scrollbar">
              <StringsSequencerGrid
                instrument={instrument}
                tracks={tracks}
                measuresCount={measuresCount}
                currentStep={currentStep}
                isPlaying={isPlaying}
                bpm={bpm}
                subdivision="8n"
                onSubdivisionChange={() => {}}
                activeHits={activeHits}
                activeHitNotes={activeHitNotes}
                selectedCell={selectedCell}
                onSelectCell={setSelectedCell}
                onUpdateStep={() => {}}
                onClearGrid={() => {}}
                onLoadPreset={() => {}}
                onNoteTrigger={handleNoteTrigger}
              />
            </div>
          )}
        </div>

        {/* Diapasón Sincronizado en Tiempo Real (Fretboard Trastes 0 a 24) */}
        <div className="w-full rounded-2xl bg-[#0e1526]/95 border border-slate-800/80 p-3 sm:p-4 shadow-2xl relative overflow-hidden flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              DIAPASÓN SINCRONIZADO (TRASTES 0 AL 24) • DIGITACIÓN EN VIVO
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-amber-300 font-bold">Tónica (Oro)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                <span className="text-cyan-300 font-bold">Intervalos (Cian)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 bg-emerald-950/60" />
                <span className="text-emerald-300 font-bold">Cuerda al Aire (○)</span>
              </span>
            </div>
          </div>

          <InteractiveFretboard
            instrument={instrument}
            tuning={tuning}
            overlayMode="notes"
            theoryMode={activeTheory.mode}
            musicalKey={activeTheory.key}
            scaleType={activeTheory.scaleType}
            arpeggioType={activeTheory.arpeggioType}
            arpeggioRange={activeTheory.range}
            chordVoicingType={activeTheory.chordVoicingType}
            voicingShapeId={activeTheory.voicingShapeId}
            activeHits={activeHits}
            activeHitNotes={activeHitNotes}
            onFretClick={(sIdx, f) => {
              const track = tracks[sIdx];
              if (track) {
                stringsAudioEngine.playFret(instrument, track.basePitch, f);
              }
            }}
          />
        </div>
      </main>
    </div>
  </div>
  );
}
