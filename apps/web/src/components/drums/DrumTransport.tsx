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
  Sliders,
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
    <div className="w-full rounded-2xl bg-white/95 dark:bg-[#0B0F19]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white p-3 sm:p-4 shadow-2xl space-y-3 transition-colors duration-200">
      {/* ======================================================== */}
      {/* FILA 1: Controles de Reproducción y Métricas             */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
        {/* Grupo Izquierdo: [PLAY], [STOP], [LOOP], [CLICK] y [Modo Anclaje] */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg select-none cursor-pointer flex-shrink-0 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25'
                : 'bg-gradient-electric hover:opacity-95 text-white shadow-glow-violet'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                <span>PAUSA</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                <span>PLAY</span>
              </>
            )}
          </button>

          {/* Stop Button */}
          <button
            type="button"
            onClick={onStop}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-rose-500 hover:border-rose-500/40 transition-all cursor-pointer flex-shrink-0"
            title="Detener [Spacebar]"
          >
            <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
          </button>

          {/* Loop Button */}
          <button
            type="button"
            onClick={onToggleLoop}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
              isLooping
                ? 'bg-cyan-100 dark:bg-synth-cyan/20 border-cyan-400 dark:border-synth-cyan/70 text-cyan-900 dark:text-synth-cyan shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                : 'bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Repetición en bucle (Loop)"
          >
            <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Metronome Group: CLICK + LED Flash + Settings */}
          <div className="relative flex items-center flex-shrink-0" ref={metronomeSettingsRef}>
            <div className="flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 transition-all bg-slate-100 dark:bg-[#111827]">
              <button
                type="button"
                onClick={onToggleMetronome}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isPlaying && currentBeatFlash
                    ? currentBeatFlash.isDownbeat
                      ? 'bg-synth-cyan/35 text-synth-cyan shadow-[0_0_18px_rgba(34,211,238,0.7)]'
                      : 'bg-synth-violet/30 text-synth-violet shadow-[0_0_14px_rgba(168,85,247,0.6)]'
                    : isMetronomeActive
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Activar / Desactivar Metrónomo [Click]"
              >
                <Bell className={`w-3.5 h-3.5 ${isPlaying && currentBeatFlash ? 'animate-bounce' : ''}`} />
                <span>CLICK</span>

                {/* 4-beat LED indicators */}
                <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200 dark:border-white/10">
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
                            : 'bg-slate-300 dark:bg-white/20'
                        }`}
                      />
                    );
                  })}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsMetronomeSettingsOpen((prev) => !prev)}
                className={`px-1.5 py-2 transition-all cursor-pointer border-l border-slate-200 dark:border-white/10 ${
                  isMetronomeSettingsOpen
                    ? 'bg-cyan-200 dark:bg-synth-cyan/20 text-cyan-900 dark:text-synth-cyan'
                    : isMetronomeActive
                    ? 'bg-emerald-200/50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/20'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Configuración de Metrónomo"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metronome Settings Popover Floating Menu */}
            {isMetronomeSettingsOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border border-slate-200 dark:border-white/15 p-4 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 dark:text-gray-200">
                    <Sliders className="w-3.5 h-3.5 text-cyan-600 dark:text-synth-cyan" />
                    <span>METRÓNOMO TONE.JS</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-synth-cyan/15 text-cyan-900 dark:text-synth-cyan font-semibold">
                    1600/800/400 Hz
                  </span>
                </div>

                {/* Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-gray-400 flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-slate-500 dark:text-gray-400" />
                      <span>Volumen</span>
                    </span>
                    <span className="font-mono text-[11px] text-cyan-800 dark:text-synth-cyan font-bold">
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
                    className="w-full accent-cyan-600 dark:accent-synth-cyan cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400 dark:text-gray-500">
                    <span>-24 dB</span>
                    <span>0 dB</span>
                    <span>+6 dB</span>
                  </div>
                </div>

                {/* Metronome Mode Level Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-600 dark:text-gray-400 font-mono block">Nivel de marcación:</span>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      type="button"
                      onClick={() => onSetMetronomeMode?.('downbeat')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left flex items-center justify-between transition-all cursor-pointer ${
                        metronomeMode === 'downbeat'
                          ? 'bg-cyan-100 dark:bg-synth-cyan/20 border border-cyan-400 dark:border-synth-cyan/60 text-cyan-900 dark:text-synth-cyan font-bold shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <span>Solo Tiempos Fuertes</span>
                      <span className="text-[10px] text-slate-500 dark:text-gray-500">1600 Hz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSetMetronomeMode?.('beats')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left flex items-center justify-between transition-all cursor-pointer ${
                        metronomeMode === 'beats'
                          ? 'bg-cyan-100 dark:bg-synth-cyan/20 border border-cyan-400 dark:border-synth-cyan/60 text-cyan-900 dark:text-synth-cyan font-bold shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <span>Pulsos 1-2-3-4</span>
                      <span className="text-[10px] text-slate-500 dark:text-gray-500">1600 / 800 Hz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSetMetronomeMode?.('subdivision')}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono text-left flex items-center justify-between transition-all cursor-pointer ${
                        metronomeMode === 'subdivision'
                          ? 'bg-cyan-100 dark:bg-synth-cyan/20 border border-cyan-400 dark:border-synth-cyan/60 text-cyan-900 dark:text-synth-cyan font-bold shadow-sm'
                          : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'
                      }`}
                    >
                      <span>Subdivisión Completa</span>
                      <span className="text-[10px] text-slate-500 dark:text-gray-500">+400 Hz</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 🎯 Modo Anclaje / Syncopation Drill */}
          {onToggleSyncopationDrill && (
            <button
              type="button"
              onClick={onToggleSyncopationDrill}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer select-none flex-shrink-0 ${
                isSyncopationDrill
                  ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-400 text-amber-900 dark:text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.4)] ring-1 ring-amber-400'
                  : 'bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-amber-800 dark:hover:text-amber-300 hover:border-amber-400'
              }`}
              title="🎯 Modo Anclaje: Fuerza pulsos 1-2-3-4 a tierra y resalta síncopas"
            >
              <span>🎯</span>
              <span>Modo Anclaje</span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSyncopationDrill ? 'bg-amber-500 dark:bg-amber-400 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'
                }`}
              />
            </button>
          )}
        </div>

        {/* Grupo Derecho: BPM [input + slider + tap] + COMPÁS [4/4 3/4 5/4 6/8 7/8] + [+] [-] [↺] */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between lg:justify-end shrink-0">
          {/* Cápsula de BPM */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#111827] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
            <span className="text-xs font-mono text-slate-600 dark:text-gray-400 font-bold">BPM:</span>
            <input
              type="number"
              min={40}
              max={260}
              value={bpm}
              onChange={(e) => onSetBpm(Number(e.target.value))}
              className="w-14 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-lg px-1 py-0.5 text-center font-mono text-xs font-bold text-cyan-800 dark:text-synth-cyan focus:outline-none focus:border-synth-cyan"
            />
            <input
              type="range"
              min={40}
              max={240}
              value={bpm}
              onChange={(e) => onSetBpm(Number(e.target.value))}
              className="w-20 sm:w-24 accent-cyan-600 dark:accent-synth-cyan cursor-pointer"
            />
            <button
              type="button"
              onClick={handleTapTempo}
              className="px-2 py-0.5 rounded-lg bg-slate-200/70 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[10px] font-mono text-slate-700 dark:text-gray-300 hover:text-cyan-800 dark:hover:text-synth-cyan transition-all active:scale-95 cursor-pointer"
              title="Tap Tempo"
            >
              TAP
            </button>
          </div>

          {/* Selector de Compás */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111827] p-1 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400 px-1 font-bold">COMPÁS</span>
            {timeSignatureOptions.map(([num, den]) => {
              const isSelected = timeSignature[0] === num && timeSignature[1] === den;
              return (
                <button
                  key={`${num}/${den}`}
                  type="button"
                  onClick={() => onSetTimeSignature([num, den])}
                  className={`px-1.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-synth-violet text-white shadow-glow-violet'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {num}/{den}
                </button>
              );
            })}
          </div>

          {/* Botones de Acción de Compás: Add, Remove, Clear */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onAddMeasure}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-synth-cyan hover:border-synth-cyan/40 transition-all cursor-pointer"
              title="Añadir Compás"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onRemoveMeasure?.(measuresCount - 1)}
              disabled={measuresCount <= 1}
              className={`p-1.5 rounded-xl border transition-all select-none ${
                measuresCount <= 1
                  ? 'bg-slate-100/50 dark:bg-[#111827]/40 border-slate-200/50 dark:border-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-40'
                  : 'bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:text-rose-500 hover:border-rose-500/40 cursor-pointer'
              }`}
              title={measuresCount <= 1 ? 'Mínimo 1 compás' : 'Eliminar Último Compás'}
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClearMeasure}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:text-rose-500 hover:border-rose-500/40 transition-all cursor-pointer"
              title="Limpiar Compás Activo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FILA 2: Navegación de Compases y Franja de Presets / Vault */}
      {/* ======================================================== */}
      <div className="pt-2.5 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 w-full">
        {/* Lado Izquierdo: [ IR A: C1 C2 ... ] */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#111827] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 shrink-0 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold flex-shrink-0">
            IR A:
          </span>
          <div className="flex items-center gap-1 flex-nowrap">
            {Array.from({ length: measuresCount }).map((_, idx) => {
              const isCurrent = selectedMeasureIndex === idx;
              return (
                <div key={`m-pill-${idx}`} className="group/pill relative flex items-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectMeasureIndex?.(idx)}
                    className={`font-mono text-xs cursor-pointer flex items-center gap-1 transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 font-bold px-2 py-0.5 rounded-lg shadow-glow-cyan'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:text-cyan-300 dark:hover:bg-white/10 px-2 py-0.5 rounded-lg'
                    }`}
                    title={`Ir al Compás ${idx + 1}`}
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
                      className="opacity-0 group-hover/pill:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-500 transition-all cursor-pointer -ml-1 mr-0.5"
                      title={`Eliminar Compás C${idx + 1}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Separador vertical tenue en escritorio */}
        <div className="hidden md:block w-px h-6 bg-slate-300 dark:bg-white/10 shrink-0" />

        {/* Lado Derecho: Franja Scrolleable de PRESETS & VAULT */}
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar flex items-center gap-2 py-0.5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-gray-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-synth-cyan" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 whitespace-nowrap">
              Presets:
            </span>
          </div>

          {onOpenRudiments && (
            <button
              type="button"
              onClick={onOpenRudiments}
              className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-cyan-300 bg-cyan-100/80 hover:bg-cyan-200 text-cyan-900 dark:bg-cyan-950/40 dark:border-cyan-500/40 dark:text-cyan-300 hover:dark:bg-cyan-900/50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Abrir Catálogo de Rudimentos y Fills"
            >
              <span>🥁</span>
              <span>Rudimentos & Fills</span>
              <span className="text-[9px] px-1 rounded bg-cyan-200 text-cyan-950 dark:bg-cyan-500/30 dark:text-cyan-200 font-bold">
                Vault
              </span>
            </button>
          )}

          {onOpenGrooves && (
            <button
              type="button"
              onClick={onOpenGrooves}
              className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-amber-300 bg-amber-100/80 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-500/40 dark:text-amber-300 hover:dark:bg-amber-900/50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Abrir Groove Vault"
            >
              <span>⚡</span>
              <span>Groove Vault</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-950 dark:bg-amber-500/30 dark:text-amber-200 font-bold">
                85+
              </span>
            </button>
          )}

          {onOpenWorkoutBuilder && (
            <button
              type="button"
              onClick={onOpenWorkoutBuilder}
              className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-emerald-300 bg-emerald-100/80 hover:bg-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/40 dark:text-emerald-300 hover:dark:bg-emerald-900/50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Abrir Workout Builder: Pirámides y Rutinas"
            >
              <span>⚙️</span>
              <span>Workout Builder</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-200 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-200 font-bold">
                Modular
              </span>
            </button>
          )}

          {onOpenExerciseLibrary && (
            <button
              type="button"
              onClick={onOpenExerciseLibrary}
              className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-purple-300 bg-purple-100/80 hover:bg-purple-200 text-purple-900 dark:bg-purple-950/40 dark:border-purple-500/40 dark:text-purple-300 hover:dark:bg-purple-900/50 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Ver mis rutinas de práctica guardadas"
            >
              <span>📁</span>
              <span>Mis Rutinas</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-200 text-purple-900 dark:bg-purple-500/30 dark:text-purple-200 font-bold">
                {savedExercisesCount}
              </span>
            </button>
          )}

          {onOpenSaveExercise && (
            <button
              type="button"
              onClick={onOpenSaveExercise}
              className="flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border border-slate-200 hover:border-emerald-300 bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 hover:dark:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Guardar el ejercicio actual"
            >
              <span>💾</span>
              <span>Guardar</span>
            </button>
          )}

          {/* Quick presets buttons */}
          {DRUM_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-electric text-white border-transparent shadow-glow-violet'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 hover:dark:text-white hover:dark:border-slate-600'
                }`}
              >
                <span>{preset.name}</span>
                <span className="text-[10px] font-mono opacity-80">
                  {preset.bpm} BPM
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
