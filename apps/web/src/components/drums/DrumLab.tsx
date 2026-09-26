'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useDrumAudio } from '@/hooks/useDrumAudio';
import { useDrumScore } from '@/hooks/useDrumScore';
import DrumScoreRenderer from './DrumScoreRenderer';
import DrumSequencerGrid from './DrumSequencerGrid';
import DrumTransport from './DrumTransport';
import DrumSubdivisionBar from './DrumSubdivisionBar';
import DrumLegendModal from './DrumLegendModal';
import { DrumPieceId, DrumPreset, DRUM_PIECES } from '@/types/drum';
import {
  Layers,
  Music,
  Headphones,
  Sliders,
  Sparkles,
  Info,
  Activity,
  Maximize2,
} from 'lucide-react';

export default function DrumLab() {
  const [viewMode, setViewMode] = useState<'both' | 'score' | 'grid'>('both');
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const audio = useDrumAudio();
  const score = useDrumScore('classic-rock');

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

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    audio.togglePlay(score.measures);
  }, [audio, score.measures]);

  // Load Preset
  const handleSelectPreset = useCallback(
    (preset: DrumPreset) => {
      audio.stop();
      score.loadPreset(preset);
      audio.setBpm(preset.bpm);
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
        score.toggleAccent();
        return;
      }
      // G or ( = Ghost
      if (key === 'G' || e.key === '(') {
        e.preventDefault();
        score.toggleGhost();
        return;
      }

      // Delete / Backspace: Clear step
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        score.clearStep();
        return;
      }

      // Number keys 1-8: Quick subdivision changer
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 8) {
        e.preventDefault();
        score.changeBeatSubdivision(num);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleTogglePiece, score]);

  // Derived properties of current step
  const currentStepHits = score.selectedStep?.hits || [];
  const currentHasAccent = currentStepHits.some((h) => h.accent);
  const currentHasGhost = currentStepHits.some((h) => h.ghost);

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

        {/* View Layout Mode Selector */}
        <div className="flex items-center gap-1.5 bg-surface-card p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'both'
                ? 'bg-gradient-electric text-white shadow-glow-violet'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Vista Completa
          </button>
          <button
            onClick={() => setViewMode('score')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'score'
                ? 'bg-gradient-electric text-white shadow-glow-violet'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Partitura VexFlow
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-gradient-electric text-white shadow-glow-violet'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Matriz DAW
          </button>
        </div>
      </div>

      {/* 1. Master Transport Bar (Play/Stop/BPM/Presets/Meter) */}
      <DrumTransport
        isPlaying={audio.isPlaying}
        bpm={audio.bpm}
        isMetronomeActive={audio.isMetronomeActive}
        isLooping={audio.isLooping}
        timeSignature={score.timeSignature}
        activePresetId={score.activePresetId}
        onTogglePlay={handleTogglePlay}
        onStop={audio.stop}
        onSetBpm={audio.setBpm}
        onToggleMetronome={audio.toggleMetronome}
        onToggleLoop={audio.toggleLoop}
        onSelectPreset={handleSelectPreset}
        onSetTimeSignature={score.setTimeSignature}
        onAddMeasure={score.addMeasure}
        onClearMeasure={score.clearMeasure}
      />

      {/* 2. Rapid Subdivision & Dynamics Bar */}
      <DrumSubdivisionBar
        selectedBeatIndex={score.selectedBeatIndex}
        currentSubdivision={score.selectedBeat?.subdivision || 4}
        isTuplet={score.selectedBeat?.isTuplet}
        hasAccent={currentHasAccent}
        hasGhost={currentHasGhost}
        hasHits={currentStepHits.length > 0}
        onChangeSubdivision={(sub) => score.changeBeatSubdivision(sub)}
        onToggleAccent={score.toggleAccent}
        onToggleGhost={score.toggleGhost}
        onClearStep={score.clearStep}
        onClearMeasure={score.clearMeasure}
        onOpenLegend={() => setIsLegendOpen(true)}
      />

      {/* 3. Percussion Score View (VexFlow Standard 5-line Clef) */}
      {(viewMode === 'both' || viewMode === 'score') && (
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400 px-1 font-mono">
            <span className="flex items-center gap-1.5 text-synth-cyan">
              <Music className="w-4 h-4" />
              MÓDULO 1: PARTITURA DE BATERÍA VEXFLOW (5 LÍNEAS & TUPLETS)
            </span>
            <span>Clave Percusión • Playhead Láser • Edición Directa</span>
          </div>

          <DrumScoreRenderer
            measures={score.measures}
            selectedMeasureIndex={score.selectedMeasureIndex}
            selectedBeatIndex={score.selectedBeatIndex}
            selectedStepIndex={score.selectedStepIndex}
            playhead={audio.playhead}
            isPlaying={audio.isPlaying}
            onSelectStep={score.selectStep}
            onTogglePiece={handleTogglePiece}
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
            <span>9 Pistas • Modulación Métrica • Síntesis Sonora Tone.js</span>
          </div>

          <DrumSequencerGrid
            measure={score.selectedMeasure}
            measureIndex={score.selectedMeasureIndex}
            selectedBeatIndex={score.selectedBeatIndex}
            selectedStepIndex={score.selectedStepIndex}
            playhead={audio.playhead}
            isPlaying={audio.isPlaying}
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
    </div>
  );
}
