'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { MetronomeMode, BeatFlash } from '@/hooks/useDrumAudio';

interface DrumTransportProps {
  isPlaying: boolean;
  bpm: number;
  isMetronomeActive: boolean;
  metronomeMode?: MetronomeMode;
  metronomeVolume?: number;
  isSyncopationDrill?: boolean;
  currentBeatFlash?: BeatFlash | null;
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
  onSetMetronomeMode?: (mode: MetronomeMode) => void;
  onSetMetronomeVolume?: (vol: number) => void;
  onToggleSyncopationDrill?: () => void;
  onToggleLoop: () => void;
  onSelectPreset: (preset: DrumPreset) => void;
  onSetTimeSignature: (ts: [number, number]) => void;
  onAddMeasure: () => void;
  onRemoveMeasure?: (index?: number) => void;
  onClearMeasure: () => void;
  onSelectMeasureIndex?: (index: number) => void;
  onOpenRudiments?: () => void;
  onOpenGrooves?: () => void;
  onOpenWorkoutBuilder?: () => void;
  onOpenSaveExercise?: () => void;
  onOpenExerciseLibrary?: () => void;
}

export default function DrumTransport({
  isPlaying,
  bpm,
  isMetronomeActive,
  metronomeMode = 'beats',
  metronomeVolume = 0,
  isSyncopationDrill = false,
  currentBeatFlash = null,
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
  onSetMetronomeMode,
  onSetMetronomeVolume,
  onToggleSyncopationDrill,
  onToggleLoop,
  onSelectPreset,
  onSetTimeSignature,
  onAddMeasure,
  onRemoveMeasure,
  onClearMeasure,
  onSelectMeasureIndex,
  onOpenRudiments,
  onOpenGrooves,
  onOpenWorkoutBuilder,
  onOpenSaveExercise,
  onOpenExerciseLibrary,
}: DrumTransportProps) {
  const [isMetronomeSettingsOpen, setIsMetronomeSettingsOpen] = useState(false);
  const metronomeSettingsRef = useRef<HTMLDivElement>(null);

  // Close metronome settings popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        metronomeSettingsRef.current &&
        !metronomeSettingsRef.current.contains(event.target as Node)
      ) {
        setIsMetronomeSettingsOpen(false);
      }
    }
    if (isMetronomeSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMetronomeSettingsOpen]);

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

          {/* Metronome Group: CLICK + Beat Flash + 4-Beat LEDs + Settings Popover */}
          <div className="relative flex items-center" ref={metronomeSettingsRef}>
            {/* Main CLICK button with real-time flash and LED dots */}
            <div className="flex items-center rounded-xl overflow-hidden border border-white/10 transition-all">
              <button
                type="button"
                onClick={onToggleMetronome}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isPlaying && currentBeatFlash
                    ? currentBeatFlash.isDownbeat
                      ? 'bg-synth-cyan/35 text-synth-cyan shadow-[0_0_18px_rgba(34,211,238,0.7)]'
                      : 'bg-synth-violet/30 text-synth-violet shadow-[0_0_14px_rgba(168,85,247,0.6)]'
                    : isMetronomeActive
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-surface-slate text-gray-400 hover:text-white'
                }`}
                title="Activar / Desactivar Metrónomo [Click]"
              >
                <Bell className={`w-3.5 h-3.5 ${isPlaying && currentBeatFlash ? 'animate-bounce' : ''}`} />
                <span>CLICK</span>

                {/* Visual 4-beat LED indicators */}
                <div className="flex items-center gap-1 pl-1.5 border-l border-white/10">
                  {[0, 1, 2, 3].map((b) => {
                    const isBeatActive = isPlaying && currentBeatFlash?.beatIndex === b;
                    return (
                      <span
                        key={`beat-led-${b}`}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-75 ${
                          isBeatActive
                            ? b === 0
                              ? 'bg-synth-cyan shadow-[0_0_8px_#22d3ee] scale-150'
                              : 'bg-synth-violet shadow-[0_0_8px_#a855f7] scale-150'
                            : 'bg-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
              </button>

              {/* Settings Dropdown Button for Metronome */}
              <button
                type="button"
                onClick={() => setIsMetronomeSettingsOpen((prev) => !prev)}
                className={`px-1.5 py-2 transition-all cursor-pointer border-l border-white/10 ${
                  isMetronomeSettingsOpen
                    ? 'bg-synth-cyan/20 text-synth-cyan'
                    : isMetronomeActive
                    ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-surface-slate text-gray-400 hover:text-white'
                }`}
                title="Configuración de Metrónomo: Volumen y Subdivisiones"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metronome Settings Popover Floating Menu */}
            {isMetronomeSettingsOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-surface-card/95 backdrop-blur-xl border border-white/15 p-4 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-200">
                    <Sliders className="w-3.5 h-3.5 text-synth-cyan" />
                    <span>METRÓNOMO TONE.JS</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-synth-cyan/15 text-synth-cyan font-semibold">
                    1600/800/400 Hz
                  </span>
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-gray-400" />
                      <span>Volumen</span>
                    </span>
                    <span className="font-mono text-[11px] text-synth-cyan font-bold">
                      {metronomeVolume > 0 ? `+${metronomeVolume}` : metronomeVolume} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-24}
                    max={6}
                    step={1}
                    value={metronomeVolume}
                    onChange={(e) => onSetMetronomeVolume?.(Number(e.target.value))}
                    className="w-full accent-synth-cyan cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>-24 dB</span>
                    <span>0 dB (Normal)</span>
                    <span>+6 dB</span>
                  </div>
                </div>

                {/* Metronome Mode Level Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-gray-400 font-mono block">Nivel de marcación:</span>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      type="button"
                      onClick={() => onSetMetronomeMode?.('downbeat')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left flex items-center justify-between transition-all cursor-pointer ${
                        metronomeMode === 'downbeat'
                          ? 'bg-synth-cyan/20 border border-synth-cyan/60 text-synth-cyan font-bold shadow-sm'
                          : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>Solo Tiempos Fuertes</span>
                      <span className="text-[10px] text-gray-500">1600 Hz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSetMetronomeMode?.('beats')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left flex items-center justify-between transition-all cursor-pointer ${
                        metronomeMode === 'beats'
                          ? 'bg-synth-cyan/20 border border-synth-cyan/60 text-synth-cyan font-bold shadow-sm'
                          : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>Pulsos 1-2-3-4</span>
                      <span className="text-[10px] text-gray-500">1600 / 800 Hz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSetMetronomeMode?.('subdivision')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left flex items-center justify-between transition-all cursor-pointer ${
                        metronomeMode === 'subdivision'
                          ? 'bg-synth-cyan/20 border border-synth-cyan/60 text-synth-cyan font-bold shadow-sm'
                          : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>Subdivisión Completa</span>
                      <span className="text-[10px] text-gray-500">+400 Hz (-6dB)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🎯 Modo Anclaje / Syncopation Drill Quick Toggle Button */}
          {onToggleSyncopationDrill && (
            <button
              type="button"
              onClick={onToggleSyncopationDrill}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer select-none ${
                isSyncopationDrill
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.4)] ring-1 ring-amber-400'
                  : 'bg-surface-slate border-white/10 text-gray-400 hover:text-amber-300 hover:border-amber-500/40'
              }`}
              title="🎯 Modo Anclaje / Syncopation Drill: Fuerza pulsos 1-2-3-4 a tierra (woodblock digital) y resalta tiempos vacíos en la partitura"
            >
              <span>🎯</span>
              <span className="hidden sm:inline">Modo Anclaje</span>
              <span className="sm:hidden">Anclaje</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSyncopationDrill ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'
                }`}
              />
            </button>
          )}
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

          {onOpenWorkoutBuilder && (
            <button
              type="button"
              onClick={onOpenWorkoutBuilder}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
              title="Abrir Workout Builder (Generador de Rutinas y Pirámides de 8, 16 y 24 compases)"
            >
              <span className="text-sm">⚙️</span>
              <span>Workout Builder</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/30 text-emerald-200 font-bold">
                8-24 C
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
