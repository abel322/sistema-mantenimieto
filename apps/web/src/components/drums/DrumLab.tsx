'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDrumAudio } from '@/hooks/useDrumAudio';
import { useDrumScore } from '@/hooks/useDrumScore';
import { useDrumStorage } from '@/hooks/useDrumStorage';
import DrumScoreRenderer from './DrumScoreRenderer';
import DrumSequencerGrid from './DrumSequencerGrid';
import DrumTransport from './DrumTransport';
import DrumSubdivisionBar from './DrumSubdivisionBar';
import DrumLegendModal from './DrumLegendModal';
import RudimentLibraryModal from './RudimentLibraryModal';
import GrooveLibraryModal from './GrooveLibraryModal';
import SaveExerciseModal from './SaveExerciseModal';
import ExerciseLibraryModal from './ExerciseLibraryModal';
import WorkoutBuilderModal from './WorkoutBuilderModal';
import { DrumPieceId, DrumPreset, DRUM_PIECES, GroovePattern } from '@/types/drum';
import { convertGrooveToDrumMeasures } from '@/lib/groovesData';
import {
  Layers,
  Music,
  Headphones,
  Sliders,
  Sparkles,
  Info,
  Activity,
  Maximize2,
  Save,
  FolderOpen,
} from 'lucide-react';

export default function DrumLab() {
  const [viewMode, setViewMode] = useState<'both' | 'score' | 'grid'>('both');
  const [scoreLayoutMode, setScoreLayoutMode] = useState<'paginated' | 'runway'>('paginated');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isRudimentsOpen, setIsRudimentsOpen] = useState(false);
  const [isGroovesOpen, setIsGroovesOpen] = useState(false);
  const [isWorkoutBuilderOpen, setIsWorkoutBuilderOpen] = useState(false);
  const [isSaveExerciseOpen, setIsSaveExerciseOpen] = useState(false);
  const [isExerciseLibraryOpen, setIsExerciseLibraryOpen] = useState(false);
  const [highlightSyncopations, setHighlightSyncopations] = useState(false);

  const audio = useDrumAudio();
  const score = useDrumScore('classic-rock');
  const storage = useDrumStorage();

  const hasRestoredSessionRef = useRef(false);

  // Restore draft session on mount
  useEffect(() => {
    if (hasRestoredSessionRef.current) return;
    const draft = storage.loadDraftSession();
    if (draft && Array.isArray(draft.measures) && draft.measures.length > 0) {
      score.loadScoreData(
        draft.measures,
        draft.timeSignature,
        draft.activePresetId,
        draft.selectedMeasureIndex ?? 0,
        draft.selectedBeatIndex ?? 0,
        draft.selectedStepIndex ?? 0
      );
      if (draft.bpm) {
        audio.setBpm(draft.bpm);
      }
    }
    hasRestoredSessionRef.current = true;
  }, [storage, score, audio]);

  // Auto-save draft session on changes (debounced in storage hook)
  useEffect(() => {
    if (!hasRestoredSessionRef.current) return;
    storage.saveDraftSession({
      measures: score.measures,
      bpm: audio.bpm,
      timeSignature: score.timeSignature,
      activePresetId: score.activePresetId,
      selectedMeasureIndex: score.selectedMeasureIndex,
      selectedBeatIndex: score.selectedBeatIndex,
      selectedStepIndex: score.selectedStepIndex,
    });
  }, [
    score.measures,
    audio.bpm,
    score.timeSignature,
    score.activePresetId,
    score.selectedMeasureIndex,
    score.selectedBeatIndex,
    score.selectedStepIndex,
    storage,
  ]);

  // Keep audio transport scheduled with updated score measures
  useEffect(() => {
    if (audio.isPlaying) {
      audio.scheduleScore(score.measures);
    }
  }, [score.measures, audio.isPlaying, audio.scheduleScore]);

  // Preview drum piece sound on click
  const handlePreviewHit = useCallback(
    (pieceId: DrumPieceId) => {
      audio.playHit(pieceId);
    },
    [audio]
  );

  // Toggle drum piece and play preview sound
  const handleTogglePiece = useCallback(
    (
      pieceId: DrumPieceId,
      mIdx: number = score.selectedMeasureIndex,
      bIdx: number = score.selectedBeatIndex,
      sIdx: number = score.selectedStepIndex
    ) => {
      score.toggleDrumPiece(pieceId, mIdx, bIdx, sIdx);
      audio.playHit(pieceId);
    },
    [score, audio]
  );

  // Unified handler for Rest toggle (Keyboard 'Z'/'0' and Button click)
  const handleToggleRest = useCallback(() => {
    if (score.selectedBeatIndex === null && score.selectedStepIndex === null) return;
    score.toggleRest(score.selectedMeasureIndex, score.selectedBeatIndex, score.selectedStepIndex);
  }, [score]);

  // Unified handler for Accent toggle
  const handleToggleAccent = useCallback(() => {
    score.toggleAccent();
  }, [score]);

  // Unified handler for Ghost note toggle
  const handleToggleGhost = useCallback(() => {
    score.toggleGhost();
  }, [score]);

  // Unified handler for Clear step
  const handleClearStep = useCallback(() => {
    score.clearStep();
  }, [score]);

  // Unified handler for Síncopa / Push [S]
  const handleToggleSyncopate = useCallback(() => {
    score.toggleSyncopate();
  }, [score]);

  // Toggle pedagogical highlight for syncopated rhythms
  const handleToggleHighlightSyncopations = useCallback(() => {
    setHighlightSyncopations((prev) => !prev);
  }, []);

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    audio.togglePlay(score.measures);
  }, [audio, score.measures]);

  // Keep Tone.js playback schedule and loop boundaries synced when measures change during playback
  useEffect(() => {
    if (audio.isPlaying) {
      audio.scheduleScore(score.measures);
    }
  }, [score.measures, audio.isPlaying, audio.scheduleScore]);

  // Load Preset
  const handleSelectPreset = useCallback(
    (preset: DrumPreset) => {
      audio.stop();
      score.loadPreset(preset);
      audio.setBpm(preset.bpm);
    },
    [audio, score]
  );

  // Apply Groove from Groove Vault (Multi-measure sync, BPM, Swing feel)
  const handleApplyGroove = useCallback(
    (
      groove: GroovePattern,
      targetMeasures: number[],
      options: { setBpm?: boolean; setSwing?: boolean; setTimeSig?: boolean }
    ) => {
      audio.stop();

      // Convert groove pattern to Sonora DrumMeasure[]
      const converted = convertGrooveToDrumMeasures(
        groove,
        targetMeasures,
        score.measures.length
      );

      // Determine time signature
      const [numStr, denStr] = groove.timeSignature.split('/');
      const beatsCount = parseInt(numStr, 10) || 4;
      const beatValue = parseInt(denStr, 10) || 4;
      const newTimeSig: [number, number] = [beatsCount, beatValue];

      score.loadScoreData(
        converted,
        options.setTimeSig ? newTimeSig : undefined,
        groove.id,
        targetMeasures[0] || 0,
        0,
        0
      );

      if (options.setBpm && groove.suggestedBpm) {
        audio.setBpm(groove.suggestedBpm);
      }

      if (options.setSwing) {
        audio.setSwing(groove.swingRatio ?? 0);
      }
    },
    [audio, score]
  );

  // Global Keyboard Shortcuts (Guitar Pro style rapid entry)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.repeat
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      // Transport: Spacebar to toggle Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      // Navigation: Arrows
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        score.navigateStep('left');
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        score.navigateStep('right');
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        score.navigateStep('up');
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        score.navigateStep('down');
        return;
      }

      // Quick drum piece insertions:
      // K = Kick, S = Snare, H = Hi-Hat, C = Crash, R = Ride, T = Tom alto, M = Tom medio, F = Floor Tom
      // Síncopa / Push: Shift+S or P
      if ((e.shiftKey && key === 'S') || key === 'P') {
        e.preventDefault();
        handleToggleSyncopate();
        return;
      }

      if (key === 'K') {
        e.preventDefault();
        handleTogglePiece('kick');
        return;
      }
      if (key === 'S') {
        e.preventDefault();
        handleTogglePiece('snare');
        return;
      }
      if (key === 'H') {
        e.preventDefault();
        handleTogglePiece('hihatClosed');
        return;
      }
      if (key === 'O') {
        e.preventDefault();
        handleTogglePiece('hihatOpen');
        return;
      }
      if (key === 'C') {
        e.preventDefault();
        handleTogglePiece('crash');
        return;
      }
      if (key === 'R') {
        e.preventDefault();
        handleTogglePiece('ride');
        return;
      }
      if (key === 'T') {
        e.preventDefault();
        handleTogglePiece('tom1');
        return;
      }
      if (key === 'M') {
        e.preventDefault();
        handleTogglePiece('tom2');
        return;
      }
      if (key === 'F') {
        e.preventDefault();
        handleTogglePiece('floorTom');
        return;
      }

      // Articulations:
      // A or > = Accent
      if (key === 'A' || e.key === '>') {
        e.preventDefault();
        handleToggleAccent();
        return;
      }
      // G or ( = Ghost
      if (key === 'G' || e.key === '(') {
        e.preventDefault();
        handleToggleGhost();
        return;
      }

      // Rest (Silencio): Z or 0
      if (key === 'Z' || key === '0') {
        e.preventDefault();
        handleToggleRest();
        return;
      }

      // Whole note (Redonda 1/1): W
      if (key === 'W') {
        e.preventDefault();
        score.changeBeatSubdivision(0.25);
        return;
      }

      // Half note (Blanca 1/2): Y
      if (key === 'Y') {
        e.preventDefault();
        score.changeBeatSubdivision(0.5);
        return;
      }

      // Delete / Backspace: Clear step
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleClearStep();
        return;
      }

      // Number keys 1-9: Quick subdivision changer (includes 9:8 Nonillo)
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        score.changeBeatSubdivision(num);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePlay,
    handleTogglePiece,
    handleToggleAccent,
    handleToggleGhost,
    handleToggleRest,
    handleToggleSyncopate,
    handleClearStep,
    score,
  ]);

  // Derived properties of current step
  const currentStepHits = score.selectedStep?.hits || [];
  const currentHasAccent = currentStepHits.some((h) => h.accent);
  const currentHasGhost = currentStepHits.some((h) => h.ghost);
  const isCurrentSelectionRest = !score.selectedStep || !!score.selectedStep.isRest || currentStepHits.length === 0;

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-gradient-electric text-white shadow-glow-violet">
              <Headphones className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-synth-cyan font-bold">
              SONORA PERCUSSION LAB
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-semibold border border-emerald-500/20">
              Web Audio 2.0 • Tone.js
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sonora Drum Lab - Interactive Percussion Studio & Polyrhythmic Sequencer
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Editor ágil de batería en clave de percusión estándar con soporte para tresillos, quintillos, seisillos y reproducción sincronizada en tiempo real.
          </p>
        </div>

        {/* Header Actions: Routines, Rudiments Vault & View Mode Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Save Exercise Button */}
          <button
            type="button"
            onClick={() => setIsSaveExerciseOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-100/90 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 hover:dark:bg-slate-700 text-xs font-semibold font-mono transition-all cursor-pointer shadow-sm"
            title="Guardar el ejercicio actual como rutina de práctica"
          >
            <Save className="w-3.5 h-3.5 text-emerald-700 dark:text-slate-300" />
            <span>Guardar Ejercicio</span>
          </button>

          {/* Exercise Library (Mis Rutinas) Button */}
          <button
            type="button"
            onClick={() => setIsExerciseLibraryOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-purple-100/80 hover:bg-purple-200 text-purple-900 border border-purple-300 dark:bg-purple-950/40 dark:border-purple-500/40 dark:text-purple-300 hover:dark:bg-purple-900/50 text-xs font-semibold font-mono transition-all cursor-pointer shadow-sm"
            title="Ver mis rutinas de práctica guardadas"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-700 dark:text-purple-300" />
            <span>Mis Rutinas</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 border border-purple-300 dark:bg-purple-500/30 dark:text-purple-200 dark:border-transparent font-bold">
              {storage.exercises.length}
            </span>
          </button>

          {/* Rudiments & Fills Vault Button */}
          <button
            type="button"
            onClick={() => setIsRudimentsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-cyan-100/80 hover:bg-cyan-200 text-cyan-900 border border-cyan-300 dark:bg-cyan-950/40 dark:border-cyan-500/40 dark:text-cyan-300 hover:dark:bg-cyan-900/50 text-xs font-semibold font-mono transition-all shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.25)] cursor-pointer"
            title="Abrir Catálogo y Generador Inteligente de Rudimentos y Fills"
          >
            <span className="text-base">🥁</span>
            <span>Rudimentos & Fills</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-cyan-200 text-cyan-950 dark:bg-cyan-500/30 dark:text-cyan-200 uppercase font-mono font-bold">
              Vault
            </span>
          </button>

          {/* Groove Vault Button */}
          <button
            type="button"
            onClick={() => setIsGroovesOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-300 hover:dark:bg-amber-900/50 text-xs font-semibold font-mono transition-all shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
            title="Abrir Groove Vault (85+ patrones listos para tocar)"
          >
            <span className="text-base">⚡</span>
            <span>Groove Vault</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200 uppercase font-mono font-bold">
              85+
            </span>
          </button>

          {/* View Layout Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'both'
                  ? 'bg-gradient-electric text-white shadow-glow-violet'
                  : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Vista Completa
            </button>
            <button
              onClick={() => setViewMode('score')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'score'
                  ? 'bg-gradient-electric text-white shadow-glow-violet'
                  : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Partitura VexFlow
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-gradient-electric text-white shadow-glow-violet'
                  : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Matriz DAW
            </button>
          </div>
        </div>
      </div>

      {/* 1. Master Transport Bar (Play/Stop/BPM/Presets/Meter) - Sticky Floating Bar */}
      <div className="sticky top-2 z-40 rounded-2xl">
        <DrumTransport
          isPlaying={audio.isPlaying}
          bpm={audio.bpm}
          isMetronomeActive={audio.isMetronomeActive}
          metronomeMode={audio.metronomeMode}
          metronomeVolume={audio.metronomeVolume}
          isSyncopationDrill={audio.isSyncopationDrill}
          currentBeatFlash={audio.currentBeatFlash}
          isLooping={audio.isLooping}
          timeSignature={score.timeSignature}
          activePresetId={score.activePresetId}
          measuresCount={score.measures.length}
          selectedMeasureIndex={score.selectedMeasureIndex}
          savedExercisesCount={storage.exercises.length}
          onTogglePlay={handleTogglePlay}
          onStop={audio.stop}
          onSetBpm={audio.setBpm}
          onToggleMetronome={audio.toggleMetronome}
          onSetMetronomeMode={audio.setMetronomeMode}
          onSetMetronomeVolume={audio.setMetronomeVolume}
          onToggleSyncopationDrill={audio.toggleSyncopationDrill}
          onToggleLoop={audio.toggleLoop}
          onSelectPreset={handleSelectPreset}
          onSetTimeSignature={score.setTimeSignature}
          onAddMeasure={score.addMeasure}
          onRemoveMeasure={score.removeMeasure}
          onClearMeasure={score.clearMeasure}
          onSelectMeasureIndex={(idx) => {
            score.selectStep(idx, 0, 0);
            audio.seekToStep(idx, 0, 0);
          }}
          onOpenRudiments={() => setIsRudimentsOpen(true)}
          onOpenGrooves={() => setIsGroovesOpen(true)}
          onOpenWorkoutBuilder={() => setIsWorkoutBuilderOpen(true)}
          onOpenSaveExercise={() => setIsSaveExerciseOpen(true)}
          onOpenExerciseLibrary={() => setIsExerciseLibraryOpen(true)}
        />
      </div>

      {/* 2. Rapid Subdivision & Dynamics Bar */}
      <DrumSubdivisionBar
        selectedBeatIndex={score.selectedBeatIndex}
        selectedMeasureIndex={score.selectedMeasureIndex}
        measuresCount={score.measures.length}
        currentSubdivision={score.selectedBeat?.subdivision || 4}
        isTuplet={score.selectedBeat?.isTuplet}
        hasAccent={currentHasAccent}
        hasGhost={currentHasGhost}
        hasHits={currentStepHits.length > 0}
        isAccentMode={score.isAccentMode}
        isGhostMode={score.isGhostMode}
        isRest={isCurrentSelectionRest}
        isSyncopated={!!score.selectedStep?.isSyncopated}
        isTied={!!score.selectedStep?.tiedToNext || !!score.selectedStep?.tiedFromPrev}
        highlightSyncopations={highlightSyncopations || audio.isSyncopationDrill}
        onChangeSubdivision={(sub) => score.changeBeatSubdivision(sub)}
        onToggleAccent={handleToggleAccent}
        onToggleGhost={handleToggleGhost}
        onToggleRest={handleToggleRest}
        onToggleSyncopate={handleToggleSyncopate}
        onToggleHighlightSyncopations={handleToggleHighlightSyncopations}
        onClearStep={handleClearStep}
        onClearMeasure={score.clearMeasure}
        onRemoveMeasure={() => score.removeMeasure(score.selectedMeasureIndex)}
        onOpenLegend={() => setIsLegendOpen(true)}
      />

      {/* 3. Percussion Score View (VexFlow Standard 5-line Clef) */}
      {(viewMode === 'both' || viewMode === 'score') && (
        <section className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-300 px-1 font-mono">
            <span className="flex items-center gap-1.5 text-cyan-800 dark:text-synth-cyan">
              <Music className="w-4 h-4" />
              MÓDULO 1: PARTITURA DE BATERÍA VEXFLOW (5 LÍNEAS & TUPLETS)
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle: Paginated (Multiline) vs Runway (Continuous Strip) */}
              <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 dark:text-slate-200 select-none">
                <button
                  type="button"
                  onClick={() => setScoreLayoutMode('paginated')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    scoreLayoutMode === 'paginated'
                      ? 'bg-gradient-electric text-white shadow-glow-violet'
                      : 'text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Vista Partitura: Páginas / Multilínea (2 compases por fila)"
                >
                  <span>⊞</span>
                  <span>Páginas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScoreLayoutMode('runway')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    scoreLayoutMode === 'runway'
                      ? 'bg-synth-cyan text-black shadow-glow-cyan font-extrabold'
                      : 'text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-white/10 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Modo Ensayo Horizontal: Cinta Continua / Runway con Auto-Scroll sincronizado"
                >
                  <span>⇄</span>
                  <span>Modo Runway</span>
                  {scoreLayoutMode === 'runway' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  )}
                </button>
              </div>

              {/* Zoom Controls (80%, 100%, 120%) */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 select-none">
                <span className="text-[10px] text-slate-500 dark:text-slate-300 px-1 font-semibold">ZOOM:</span>
                {[0.8, 1.0, 1.2].map((z) => (
                  <button
                    key={`zoom-lab-${z}`}
                    type="button"
                    onClick={() => setZoomLevel(z)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      zoomLevel === z
                        ? 'bg-synth-cyan text-black shadow-glow-cyan'
                        : 'text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-white/10 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-slate-700'
                    }`}
                  >
                    {Math.round(z * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DrumScoreRenderer
            measures={score.measures}
            selectedMeasureIndex={score.selectedMeasureIndex}
            selectedBeatIndex={score.selectedBeatIndex}
            selectedStepIndex={score.selectedStepIndex}
            playhead={audio.playhead}
            isPlaying={audio.isPlaying}
            highlightSyncopations={highlightSyncopations}
            isSyncopationDrill={audio.isSyncopationDrill}
            currentBeatFlash={audio.currentBeatFlash}
            layoutMode={scoreLayoutMode}
            onToggleLayoutMode={setScoreLayoutMode}
            zoomLevel={zoomLevel}
            onChangeZoomLevel={setZoomLevel}
            onToggleHighlightSyncopations={handleToggleHighlightSyncopations}
            onSelectStep={(m, b, s) => {
              score.selectStep(m, b, s);
              audio.seekToStep(m, b, s);
            }}
            onTogglePiece={handleTogglePiece}
            onRemoveMeasure={score.removeMeasure}
            getTransportSeconds={audio.getTransportSeconds}
            seekToSeconds={audio.seekToSeconds}
            seekToStep={audio.seekToStep}
            bpm={audio.bpm}
            onSetBpm={audio.setBpm}
            onTogglePlay={handleTogglePlay}
            onStop={audio.stop}
            isMetronomeActive={audio.isMetronomeActive}
            onToggleMetronome={audio.toggleMetronome}
            isLooping={audio.isLooping}
            onToggleLoop={audio.toggleLoop}
          />
        </section>
      )}

      {/* 4. DAW Matrix & Subdivision Lane View */}
      {(viewMode === 'both' || viewMode === 'grid') && (
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-mono">
            <span className="flex items-center gap-1.5 text-synth-violet">
              <Sliders className="w-4 h-4" />
              MÓDULO 2: SECUENCIADOR MULTIPISTA & EDITOR DE POLIRRITMIAS
            </span>
            <span>9 Pistas • Modulación Métrica • Resaltado Síncopas Ámbar</span>
          </div>

          <DrumSequencerGrid
            measure={score.selectedMeasure}
            measureIndex={score.selectedMeasureIndex}
            selectedBeatIndex={score.selectedBeatIndex}
            selectedStepIndex={score.selectedStepIndex}
            playhead={audio.playhead}
            isPlaying={audio.isPlaying}
            highlightSyncopations={highlightSyncopations}
            onToggleHighlightSyncopations={handleToggleHighlightSyncopations}
            onSelectStep={score.selectStep}
            onTogglePiece={handleTogglePiece}
            onPreviewHit={handlePreviewHit}
          />
        </section>
      )}

      {/* Hardware & Web Audio Specs Footer Banner */}
      <div className="p-4 rounded-xl bg-surface-card/60 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 shadow-glass">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-synth-cyan flex-shrink-0" />
          <span>
            Motor de percusión sintetizado vía Tone.js (MembraneSynth + NoiseSynth) a 48kHz con latencia ultra baja y cero dependencias externas de CORS.
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            AUDIO ENGINE: ACTIVE
          </span>
          <span>LATENCY: &lt; 5MS</span>
        </div>
      </div>

      {/* Help & Notation Legend Modal */}
      <DrumLegendModal isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />

      {/* Rudiment & Fill Vault Modal */}
      <RudimentLibraryModal
        isOpen={isRudimentsOpen}
        onClose={() => setIsRudimentsOpen(false)}
        measuresCount={score.measures.length}
        beatsPerMeasure={score.timeSignature[0]}
        selectedMeasureIndex={score.selectedMeasureIndex}
        selectedBeatIndex={score.selectedBeatIndex}
        onBatchInsert={score.batchInsertRudiment}
        onFillMeasuresBatch={score.fillMeasuresWithRudiment}
        onInsertInBeat={score.insertRudimentAtBeat}
        onFillMeasure={score.fillMeasureWithRudiment}
        onPlayHit={audio.playHit}
      />

      {/* Groove Vault Modal */}
      <GrooveLibraryModal
        isOpen={isGroovesOpen}
        onClose={() => setIsGroovesOpen(false)}
        measuresCount={score.measures.length}
        selectedMeasureIndex={score.selectedMeasureIndex}
        onApplyGroove={handleApplyGroove}
        onPlayHit={audio.playHit}
      />

      {/* Save Exercise Modal */}
      <SaveExerciseModal
        isOpen={isSaveExerciseOpen}
        onClose={() => setIsSaveExerciseOpen(false)}
        bpm={audio.bpm}
        timeSignature={score.timeSignature}
        measures={score.measures}
        onSave={(title, tags) => {
          storage.saveExercise({
            title,
            tags,
            bpm: audio.bpm,
            timeSignature: score.timeSignature,
            measures: score.measures,
          });
        }}
      />

      {/* Exercise Library Modal ("Mis Rutinas") */}
      <ExerciseLibraryModal
        isOpen={isExerciseLibraryOpen}
        onClose={() => setIsExerciseLibraryOpen(false)}
        exercises={storage.exercises}
        onLoadExercise={(exercise) => {
          audio.stop();
          score.loadScoreData(exercise.measures, exercise.timeSignature, null, 0, 0, 0);
          audio.setBpm(exercise.bpm);
        }}
        onDeleteExercise={storage.deleteExercise}
        onExportExercise={storage.exportExerciseToJson}
        onExportAll={storage.exportAllExercisesToJson}
        onImportJson={storage.importExercisesFromJson}
        onOpenSaveCurrent={() => setIsSaveExerciseOpen(true)}
      />

      {/* Workout / Routine Builder Modal */}
      <WorkoutBuilderModal
        isOpen={isWorkoutBuilderOpen}
        onClose={() => setIsWorkoutBuilderOpen(false)}
        onGenerateWorkout={(routine) => {
          audio.stop();
          score.loadScoreData(routine.measures, [4, 4], 'workout-routine', 0, 0, 0);
          audio.setBpm(routine.bpm);
          setScoreLayoutMode('runway');
        }}
        onPlayHit={audio.playHit}
      />
    </div>
  );
}
