'use client';

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  Bell,
  Plus,
  Minus,
  X,
  RotateCcw,
  Sparkles,
  Music,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { DRUM_PRESETS } from '@/lib/drumPresets';
import { DrumPreset } from '@/types/drum';

interface DrumTransportProps {
  isPlaying: boolean;
  bpm: number;
  isMetronomeActive: boolean;
  isLooping: boolean;
  timeSignature: [number, number];
  activePresetId: string | null;
  measuresCount?: number;
  selectedMeasureIndex?: number;
  savedExercisesCount?: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onSetBpm: (bpm: number) => void;
  onToggleMetronome: () => void;
  onToggleLoop: () => void;
  onSelectPreset: (preset: DrumPreset) => void;
  onSetTimeSignature: (ts: [number, number]) => void;
  onAddMeasure: () => void;
  onRemoveMeasure?: (index?: number) => void;
  onClearMeasure: () => void;
  onSelectMeasureIndex?: (index: number) => void;
  onOpenRudiments?: () => void;
  onOpenGrooves?: () => void;
  onOpenSaveExercise?: () => void;
  onOpenExerciseLibrary?: () => void;
}

export default function DrumTransport({
  isPlaying,
  bpm,
  isMetronomeActive,
  isLooping,
  timeSignature,
  activePresetId,
  measuresCount = 1,
  selectedMeasureIndex = 0,
  savedExercisesCount = 0,
  onTogglePlay,
  onStop,
  onSetBpm,
  onToggleMetronome,
  onToggleLoop,
  onSelectPreset,
  onSetTimeSignature,
  onAddMeasure,
  onRemoveMeasure,
  onClearMeasure,
  onSelectMeasureIndex,
  onOpenRudiments,
  onOpenGrooves,
  onOpenSaveExercise,
  onOpenExerciseLibrary,
}: DrumTransportProps) {
  // Tap tempo logic
  const tapTimesRef = useRef<number[]>([]);
  const handleTapTempo = () => {
    const now = Date.now();
    const times = tapTimesRef.current.filter((t) => now - t < 3000);
    times.push(now);
    tapTimesRef.current = times;

    if (times.length >= 2) {
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 260) {
        onSetBpm(calculatedBpm);
      }
    }
  };

  const timeSignatureOptions: [number, number][] = [
    [4, 4],
    [3, 4],
    [5, 4],
    [6, 8],
    [7, 8],
  ];

  return (
    <div className="w-full rounded-2xl bg-surface-card border border-white/10 p-5 shadow-glass space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Playback Controls (Play/Pause, Stop, Loop, Metronome) */}
        <div className="flex items-center gap-3">
          {/* Main Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25'
                : 'bg-gradient-electric hover:opacity-95 text-white shadow-glow-violet'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>PLAY</span>
              </>
            )}
          </button>

          {/* Stop Button */}
          <button
            onClick={onStop}
            className="p-2.5 rounded-xl bg-surface-slate border border-white/10 text-gray-300 hover:text-rose-400 hover:border-rose-500/40 transition-all"
            title="Stop [Spacebar al parar]"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          {/* Loop Button */}
          <button
            onClick={onToggleLoop}
            className={`p-2.5 rounded-xl border transition-all ${
              isLooping
                ? 'bg-synth-cyan/20 border-synth-cyan/70 text-synth-cyan shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'bg-surface-slate border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Repetición de bucle (Loop)"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Metronome Button */}
          <button
            onClick={onToggleMetronome}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
              isMetronomeActive
                ? 'bg-emerald-500/20 border-emerald-500/70 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                : 'bg-surface-slate border-white/10 text-gray-400 hover:text-white'
            }`}
            title="Metrónomo acústico"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>CLICK</span>
          </button>
        </div>

        {/* BPM Tempo Slider & Tap Control */}
        <div className="flex items-center gap-3 bg-surface-slate px-4 py-2 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400 font-semibold">BPM:</span>
            <input
              type="number"
              min={40}
              max={260}
              value={bpm}
              onChange={(e) => onSetBpm(Number(e.target.value))}
              className="w-16 bg-surface-card border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-sm font-bold text-synth-cyan focus:outline-none focus:border-synth-cyan"
            />
          </div>

          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => onSetBpm(Number(e.target.value))}
            className="w-24 sm:w-32 accent-synth-cyan cursor-pointer"
          />

          <button
            onClick={handleTapTempo}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-gray-300 hover:text-synth-cyan transition-all active:scale-95"
            title="Haz click varias veces para calcular el tempo"
          >
            TAP
          </button>
        </div>

        {/* Time Signature & Measure Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Signature Selector */}
          <div className="flex items-center gap-1 bg-surface-slate p-1 rounded-xl border border-white/5">
            <span className="text-[10px] font-mono text-gray-500 px-2 font-semibold">COMPÁS</span>
            {timeSignatureOptions.map(([num, den]) => {
              const isSelected = timeSignature[0] === num && timeSignature[1] === den;
              return (
                <button
                  key={`${num}/${den}`}
                  onClick={() => onSetTimeSignature([num, den])}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-synth-violet text-white shadow-glow-violet'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {num}/{den}
                </button>
              );
            })}
          </div>

          {/* Measure Switcher if multiple measures exist */}
          {measuresCount > 1 && (
            <div className="flex items-center gap-1 bg-surface-slate p-1 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono text-gray-500 px-1 font-semibold">IR A:</span>
              {Array.from({ length: measuresCount }).map((_, idx) => {
                const isCurrent = selectedMeasureIndex === idx;
                return (
                  <div key={`m-btn-${idx}`} className="group/pill relative flex items-center">
                    <button
                      type="button"
                      onClick={() => onSelectMeasureIndex?.(idx)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-synth-cyan text-black shadow-glow-cyan'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={`Seleccionar Compás ${idx + 1}`}
                    >
                      <span>C{idx + 1}</span>
                    </button>
                    {measuresCount > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMeasure?.(idx);
                        }}
                        className="opacity-0 group-hover/pill:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-all cursor-pointer -ml-1 mr-0.5"
                        title={`Eliminar Compás C${idx + 1}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Measure */}
          <button
            type="button"
            onClick={onAddMeasure}
            className="p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-300 hover:text-synth-cyan hover:border-synth-cyan/40 transition-all cursor-pointer"
            title="Añadir Compás"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Remove Measure */}
          <button
            type="button"
            onClick={() => onRemoveMeasure?.(measuresCount - 1)}
            disabled={measuresCount <= 1}
            className={`p-2 rounded-xl border transition-all select-none ${
              measuresCount <= 1
                ? 'bg-surface-slate/30 border-white/5 text-gray-600 cursor-not-allowed opacity-40'
                : 'bg-surface-slate border-white/10 text-gray-300 hover:text-rose-400 hover:border-rose-500/40 cursor-pointer'
            }`}
            title={measuresCount <= 1 ? 'Mínimo 1 compás requerido' : 'Eliminar Último Compás'}
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Clear Measure */}
          <button
            type="button"
            onClick={onClearMeasure}
            className="p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer"
            title="Limpiar Compás Activo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Grooves Bar */}
      <div className="pt-3 border-t border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-synth-cyan" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gray-300">
            Presets & Vault:
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-none">
          {onOpenRudiments && (
            <button
              type="button"
              onClick={onOpenRudiments}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-synth-cyan/50 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 text-synth-cyan hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.2)] cursor-pointer"
              title="Abrir Catálogo y Generador Inteligente de Rudimentos y Fills"
            >
              <span className="text-sm">🥁</span>
              <span>Rudimentos & Fills</span>
              <span className="text-[9px] px-1 rounded bg-synth-cyan/30 text-cyan-200">Vault</span>
            </button>
          )}

          {onOpenGrooves && (
            <button
              type="button"
              onClick={onOpenGrooves}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-amber-500/50 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)] cursor-pointer"
              title="Abrir Groove Vault (85+ ritmos clasificados)"
            >
              <span className="text-sm">⚡</span>
              <span>Groove Vault</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/30 text-amber-200 font-bold">
                85+
              </span>
            </button>
          )}

          {onOpenExerciseLibrary && (
            <button
              type="button"
              onClick={onOpenExerciseLibrary}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Ver mis rutinas de práctica guardadas"
            >
              <span>📁</span>
              <span>Mis Rutinas</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/30 text-purple-200 font-bold">
                {savedExercisesCount}
              </span>
            </button>
          )}

          {onOpenSaveExercise && (
            <button
              type="button"
              onClick={onOpenSaveExercise}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-white/10 hover:border-emerald-500/40 bg-white/5 hover:bg-emerald-500/15 text-gray-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Guardar el ejercicio actual"
            >
              <span>💾</span>
              <span>Guardar</span>
            </button>
          )}

          {DRUM_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-electric text-white border-transparent shadow-glow-violet font-semibold'
                    : 'bg-surface-slate border-white/5 text-gray-300 hover:text-white hover:border-white/20'
                }`}
              >
                <span>{preset.name}</span>
                <span className="text-[10px] font-mono opacity-80">
                  {preset.bpm} BPM • {preset.timeSignature[0]}/{preset.timeSignature[1]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
