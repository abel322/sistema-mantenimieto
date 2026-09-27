'use client';

import React from 'react';
import { DrumMeasure, DrumPieceId, DRUM_ORDER, DRUM_PIECES } from '@/types/drum';
import { PlayheadPosition } from '@/hooks/useDrumAudio';
import { Volume2, Sparkles, AlertCircle } from 'lucide-react';

interface DrumSequencerGridProps {
  measure: DrumMeasure;
  measureIndex: number;
  selectedBeatIndex: number;
  selectedStepIndex: number;
  playhead: PlayheadPosition;
  isPlaying: boolean;
  highlightSyncopations?: boolean;
  onToggleHighlightSyncopations?: () => void;
  onSelectStep: (mIdx: number, bIdx: number, sIdx: number) => void;
  onTogglePiece: (pieceId: DrumPieceId, mIdx: number, bIdx: number, sIdx: number) => void;
  onPreviewHit: (pieceId: DrumPieceId) => void;
}

export default function DrumSequencerGrid({
  measure,
  measureIndex,
  selectedBeatIndex,
  selectedStepIndex,
  playhead,
  isPlaying,
  highlightSyncopations = false,
  onToggleHighlightSyncopations,
  onSelectStep,
  onTogglePiece,
  onPreviewHit,
}: DrumSequencerGridProps) {
  return (
    <div className="w-full box-border rounded-2xl bg-white/95 dark:bg-surface-card border border-slate-200 dark:border-white/10 p-5 shadow-sm dark:shadow-glass space-y-4">
      {/* Sequencer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-cyan-800 dark:text-synth-cyan font-bold">
            DAW DRUM MATRIX & SUBDIVISION LANES
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-mono font-medium">
            Compás {measureIndex + 1}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-gray-400 font-mono flex-wrap">
          {onToggleHighlightSyncopations && (
            <button
              type="button"
              onClick={onToggleHighlightSyncopations}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all flex items-center gap-1 border cursor-pointer select-none ${
                highlightSyncopations
                  ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-400 text-amber-900 dark:text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.35)]'
                  : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-amber-800 dark:hover:text-amber-300'
              }`}
              title="Resaltar en ámbar neón las celdas y notas sincopadas"
            >
              <span>𝄐 Destacar Síncopas</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  highlightSyncopations ? 'bg-amber-500 dark:bg-amber-400 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'
                }`}
              />
            </button>
          )}
          <span className="hidden sm:inline">Click celda: Activar/Desactivar</span>
          <span className="text-slate-400 dark:text-gray-600 hidden sm:inline">•</span>
          <span className="text-cyan-800 dark:text-synth-cyan font-medium">Atajos: K, S, H, C, R, T, F</span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 pb-2">
        <div className="min-w-[700px] space-y-1.5">
          {/* Header Row: Beats and Subdivision steps */}
          <div className="flex items-center gap-1.5 pb-1 text-[11px] font-mono text-gray-400">
            {/* Instrument label spacer */}
            <div className="w-36 flex-shrink-0 text-right pr-3 font-semibold text-gray-500">
              INSTRUMENTO
            </div>

            {/* Beat groups */}
            <div className="flex-1 flex gap-2">
              {measure.beats.map((beat, bIdx) => {
                const isSelectedBeat = bIdx === selectedBeatIndex;
                return (
                  <div
                    key={`header-beat-${bIdx}`}
                    className={`flex-1 flex flex-col items-center py-1 px-1.5 rounded-lg border transition-all ${
                      isSelectedBeat
                        ? 'bg-synth-cyan/10 border-synth-cyan/40 text-synth-cyan'
                        : 'bg-white/[0.02] border-white/5 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-1 text-[10px]">
                      <span className="font-bold">TIEMPO {bIdx + 1}</span>
                      <span className="text-[9px] opacity-75 font-mono">
                        {beat.subdivision === 0.25
                          ? '1/1'
                          : beat.subdivision === 0.5
                          ? '1/2'
                          : beat.subdivision === 1
                          ? '1/4'
                          : beat.subdivision === 2
                          ? '1/8'
                          : beat.subdivision === 3
                          ? '3:2'
                          : beat.subdivision === 4
                          ? '1/16'
                          : beat.subdivision === 5
                          ? '5:4'
                          : beat.subdivision === 6
                          ? '6:4'
                          : beat.subdivision === 7
                          ? '7:4'
                          : beat.subdivision === 8
                          ? '1/32'
                          : beat.subdivision === 9
                          ? '9:8'
                          : beat.subdivision}{' '}
                        {beat.isTuplet ? 'Tup' : ''}
                      </span>
                    </div>

                    {/* Step sub-pills */}
                    <div className="flex w-full gap-1 mt-1">
                      {beat.steps.map((_, sIdx) => {
                        const isStepSelected = isSelectedBeat && sIdx === selectedStepIndex;
                        const isPlayheadHere =
                          isPlaying &&
                          measureIndex === playhead.measureIndex &&
                          bIdx === playhead.beatIndex &&
                          sIdx === playhead.stepIndex;

                        return (
                          <button
                            key={`step-btn-${bIdx}-${sIdx}`}
                            onClick={() => onSelectStep(measureIndex, bIdx, sIdx)}
                            className={`flex-1 h-3 rounded-sm transition-all ${
                              isStepSelected
                                ? 'bg-synth-cyan shadow-[0_0_8px_#22d3ee]'
                                : isPlayheadHere
                                ? 'bg-synth-violet shadow-[0_0_8px_#7c3aed]'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                            title={`Seleccionar Tiempo ${bIdx + 1}, Subdivisión ${sIdx + 1}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Instrument Rows */}
          {DRUM_ORDER.map((pieceId) => {
            const piece = DRUM_PIECES[pieceId];

            return (
              <div
                key={`grid-row-${pieceId}`}
                className="flex items-center gap-1.5 group hover:bg-white/[0.02] rounded-lg p-0.5 transition-colors"
              >
                {/* Instrument Header Button (Triggers preview on click) */}
                <button
                  onClick={() => onPreviewHit(pieceId)}
                  className="w-36 flex-shrink-0 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-slate border border-white/5 hover:border-synth-cyan/40 text-left transition-all group-hover:shadow-sm"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: piece.color }}
                    />
                    <span className="text-xs font-semibold text-gray-200 truncate">
                      {piece.shortName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-gray-400 group-hover:text-synth-cyan">
                      [{piece.shortcut}]
                    </span>
                  </div>
                </button>

                {/* Steps across all beats */}
                <div className="flex-1 flex gap-2">
                  {measure.beats.map((beat, bIdx) => {
                    const isSelectedBeat = bIdx === selectedBeatIndex;

                    return (
                      <div
                        key={`row-${pieceId}-b${bIdx}`}
                        className={`flex-1 flex gap-1 p-1 rounded-lg border transition-colors ${
                          isSelectedBeat
                            ? 'bg-synth-cyan/[0.04] border-synth-cyan/20'
                            : 'bg-white/[0.01] border-white/5'
                        }`}
                      >
                        {beat.steps.map((step, sIdx) => {
                          const hit = step.hits.find((h) => h.pieceId === pieceId);
                          const isHitActive = !!hit;
                          const isAccent = !!hit?.accent;
                          const isGhost = !!hit?.ghost;
                          const isStepSyncopated =
                            step.isSyncopated ||
                            step.tiedToNext ||
                            step.tiedFromPrev ||
                            hit?.isSyncopated ||
                            hit?.tiedToNext;
                          const isVisualSyncopated = highlightSyncopations && isStepSyncopated;

                          const isSelectedStep =
                            isSelectedBeat && sIdx === selectedStepIndex;

                          const isPlayheadHere =
                            isPlaying &&
                            measureIndex === playhead.measureIndex &&
                            bIdx === playhead.beatIndex &&
                            sIdx === playhead.stepIndex;

                          return (
                            <button
                              key={`cell-${pieceId}-${bIdx}-${sIdx}`}
                              onClick={() => {
                                onSelectStep(measureIndex, bIdx, sIdx);
                                onTogglePiece(pieceId, measureIndex, bIdx, sIdx);
                              }}
                              className={`flex-1 h-9 rounded-md flex items-center justify-center relative transition-all duration-100 ${
                                isHitActive
                                  ? isVisualSyncopated
                                    ? 'bg-amber-400 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.7)] border-2 border-amber-200 scale-[1.04] ring-1 ring-amber-400'
                                    : isAccent
                                    ? 'bg-amber-400 text-black font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-amber-300 scale-[1.03]'
                                    : isGhost
                                    ? 'bg-purple-900/60 text-purple-300 border border-purple-400/50 shadow-inner'
                                    : 'border border-white/20 text-black font-bold shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                                  : isVisualSyncopated
                                  ? 'bg-amber-500/10 border border-amber-500/30'
                                  : 'bg-surface-slate/80 hover:bg-white/10 border border-white/5'
                              } ${
                                isSelectedStep
                                  ? 'ring-2 ring-synth-cyan ring-offset-1 ring-offset-obsidian'
                                  : ''
                              } ${
                                isPlayheadHere
                                  ? 'brightness-150 scale-[1.05]'
                                  : ''
                              }`}
                              style={
                                isHitActive && !isAccent && !isGhost && !isVisualSyncopated
                                  ? { backgroundColor: piece.color }
                                  : {}
                              }
                              title={`${piece.name} - Tiempo ${bIdx + 1}.${sIdx + 1}${
                                isAccent ? ' (Acento)' : isGhost ? ' (Ghost)' : ''
                              }${isStepSyncopated ? ' [𝄐 Síncopa / Tie]' : ''}`}
                            >
                              {/* Inner Hit Label */}
                              {isHitActive && (
                                <div className="flex flex-col items-center justify-center leading-none">
                                  <span className="text-[10px] font-mono font-bold leading-none">
                                    {isAccent ? '>' : isGhost ? '(g)' : piece.shortcut}
                                  </span>
                                  {isVisualSyncopated && (
                                    <span className="text-[8px] font-extrabold leading-none text-black mt-0.5">
                                      {step.tiedToNext ? '𝄐→' : step.tiedFromPrev ? '←𝄐' : '𝄐'}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Playhead Sweep Beam Highlight */}
                              {isPlayheadHere && (
                                <div className="absolute inset-0 bg-synth-cyan/30 rounded-md animate-ping pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
