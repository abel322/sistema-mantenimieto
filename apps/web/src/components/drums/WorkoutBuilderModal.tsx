'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  Layers,
  Check,
  ChevronRight,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { DrumMeasure, DrumBeat, DrumStep, DrumHit, DrumPieceId, DRUM_PIECES } from '@/types/drum';

export interface WorkoutPatternDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: 'paradiddles' | 'rolls' | 'linear' | 'triplets';
  defaultBpm: number;
  stickingCycle: {
    hand: 'R' | 'L' | 'K';
    accent?: boolean;
    ghost?: boolean;
    flam?: boolean;
  }[];
}

export const WORKOUT_PATTERNS: WorkoutPatternDef[] = [
  {
    id: 'single-paradiddle',
    name: 'Single Paradiddle',
    subtitle: 'R L R R  L R L L',
    description: 'Equilibrio simétrico de manos combinando golpes simples y dobles.',
    category: 'paradiddles',
    defaultBpm: 105,
    stickingCycle: [
      { hand: 'R', accent: true },
      { hand: 'L', ghost: true },
      { hand: 'R', ghost: true },
      { hand: 'R', ghost: true },
      { hand: 'L', accent: true },
      { hand: 'R', ghost: true },
      { hand: 'L', ghost: true },
      { hand: 'L', ghost: true },
    ],
  },
  {
    id: 'double-stroke-roll',
    name: 'Double Stroke Roll',
    subtitle: 'R R L L  R R L L',
    description: 'Control de rebote puro y fluidez dinámica para redobles extendidos.',
    category: 'rolls',
    defaultBpm: 110,
    stickingCycle: [
      { hand: 'R', accent: true },
      { hand: 'R' },
      { hand: 'L', accent: true },
      { hand: 'L' },
      { hand: 'R', accent: true },
      { hand: 'R' },
      { hand: 'L', accent: true },
      { hand: 'L' },
    ],
  },
  {
    id: 'linear-6-chops',
    name: 'Linear 6 Chops',
    subtitle: 'R L K K  R L',
    description: 'Patrón contemporáneo Gospel/Funk manos-bombo sin golpes superpuestos.',
    category: 'linear',
    defaultBpm: 100,
    stickingCycle: [
      { hand: 'R', accent: true },
      { hand: 'L', ghost: true },
      { hand: 'K' },
      { hand: 'K' },
      { hand: 'R', accent: true },
      { hand: 'L', ghost: true },
    ],
  },
  {
    id: 'six-stroke-roll',
    name: 'Six Stroke Roll',
    subtitle: 'R L L R R L',
    description: 'Estructura de fill con acentos en los extremos y diddles centrales suaves.',
    category: 'rolls',
    defaultBpm: 105,
    stickingCycle: [
      { hand: 'R', accent: true },
      { hand: 'L', ghost: true },
      { hand: 'L', ghost: true },
      { hand: 'R', ghost: true },
      { hand: 'R', ghost: true },
      { hand: 'L', accent: true },
    ],
  },
  {
    id: 'single-stroke-speed',
    name: 'Single Stroke Endurance',
    subtitle: 'R L R L  R L R L',
    description: 'Alternancia estricta para desarrollo de velocidad máxima y resistencia.',
    category: 'rolls',
    defaultBpm: 115,
    stickingCycle: [
      { hand: 'R', accent: true },
      { hand: 'L' },
      { hand: 'R' },
      { hand: 'L' },
      { hand: 'R', accent: true },
      { hand: 'L' },
      { hand: 'R' },
      { hand: 'L' },
    ],
  },
  {
    id: 'herta-chops',
    name: 'Herta Burst Chops',
    subtitle: 'R L R L (Doble Rápido)',
    description: 'Fraseo moderno agresivo con micro-aceleración de doble golpe.',
    category: 'linear',
    defaultBpm: 95,
    stickingCycle: [
      { hand: 'R', accent: true },
      { hand: 'L', ghost: true },
      { hand: 'R' },
      { hand: 'L' },
    ],
  },
  {
    id: 'swiss-army-triplet',
    name: 'Swiss Army Triplet',
    subtitle: 'Flam-R R L  Flam-R R L',
    description: 'Potente rudimento polirrítmico con flam y dobles de mano derecha.',
    category: 'triplets',
    defaultBpm: 90,
    stickingCycle: [
      { hand: 'R', accent: true, flam: true },
      { hand: 'R', ghost: true },
      { hand: 'L' },
      { hand: 'R', accent: true, flam: true },
      { hand: 'R', ghost: true },
      { hand: 'L' },
    ],
  },
];

interface WorkoutBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateWorkout: (routine: {
    title: string;
    measures: DrumMeasure[];
    bpm: number;
    measuresCount: number;
  }) => void;
  onPlayHit?: (pieceId: DrumPieceId) => void;
}

export default function WorkoutBuilderModal({
  isOpen,
  onClose,
  onGenerateWorkout,
  onPlayHit,
}: WorkoutBuilderModalProps) {
  const [lengthBars, setLengthBars] = useState<8 | 16 | 24>(16);
  const [selectedPatternId, setSelectedPatternId] = useState<string>('single-paradiddle');
  const [progressiveOrchestration, setProgressiveOrchestration] = useState<boolean>(true);
  const [bpm, setBpm] = useState<number>(105);

  if (!isOpen) return null;

  const currentPattern =
    WORKOUT_PATTERNS.find((p) => p.id === selectedPatternId) || WORKOUT_PATTERNS[0];

  // Calculate Pyramid Blocks allocation based on selected length
  const blocksInfo = [
    {
      block: 'Bloque A',
      bars: lengthBars === 8 ? 'Compases 1 - 2' : lengthBars === 16 ? 'Compases 1 - 4' : 'Compases 1 - 6',
      subdivision: '1/8 (Corcheas)',
      subdivisionNum: 2,
      density: '2 notas/pulso',
      focus: 'Anclaje a tierra, articulación limpia y digitación precisa.',
      orchestration: progressiveOrchestration
        ? 'Caja pura (Snare) + Bombo de anclaje en el downbeat'
        : 'Caja pura (Snare)',
      color: 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10',
      badgeColor: 'bg-cyan-500/20 text-cyan-200',
    },
    {
      block: 'Bloque B',
      bars: lengthBars === 8 ? 'Compases 3 - 4' : lengthBars === 16 ? 'Compases 5 - 8' : 'Compases 7 - 12',
      subdivision: '1/16 (Semicorcheas)',
      subdivisionNum: 4,
      density: '4 notas/pulso',
      focus: 'Duplicación de tempo interno, dinámicas de acentos vs ghost notes.',
      orchestration: progressiveOrchestration
        ? 'Acentos en Tom Alto (Tom 1) + notas fantasma en Caja'
        : 'Caja con acentos y ghost notes',
      color: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
      badgeColor: 'bg-purple-500/20 text-purple-200',
    },
    {
      block: 'Bloque C',
      bars: lengthBars === 8 ? 'Compases 5 - 6' : lengthBars === 16 ? 'Compases 9 - 12' : 'Compases 13 - 18',
      subdivision: '6:4 (Seisillos / Triplets)',
      subdivisionNum: 6,
      density: '6 notas/pulso',
      focus: 'Sensación polirrítmica ternaria fluida y velocidad media-alta.',
      orchestration: progressiveOrchestration
        ? 'Cascada melódica: Caja → Tom 1 → Tom 2 → Floor Tom'
        : 'Caja pura en seisillos (6:4)',
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      badgeColor: 'bg-amber-500/20 text-amber-200',
    },
    {
      block: 'Bloque D',
      bars: lengthBars === 8 ? 'Compases 7 - 8' : lengthBars === 16 ? 'Compases 13 - 16' : 'Compases 19 - 24',
      subdivision: '1/32 (Fusas / Chops)',
      subdivisionNum: 8,
      density: '8 notas/pulso',
      focus: 'Pico de la pirámide: Chops a máxima velocidad, rebote y resistencia.',
      orchestration: progressiveOrchestration
        ? 'Full Kit Chops: Crash + Bombo en T1, toms y platillos'
        : 'Caja a alta velocidad (32nds)',
      color: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
      badgeColor: 'bg-rose-500/20 text-rose-200',
    },
  ];

  // Generator: Builds full DrumMeasure[] sequence based on parameters
  const handleGenerate = () => {
    const cycle = currentPattern.stickingCycle;
    const measures: DrumMeasure[] = [];
    let cycleIndex = 0;

    const barsPerBlock = lengthBars / 4;

    for (let mIdx = 0; mIdx < lengthBars; mIdx++) {
      // Determine which block this measure belongs to (0: A, 1: B, 2: C, 3: D)
      const blockIdx = Math.min(3, Math.floor(mIdx / barsPerBlock));
      const sub = blockIdx === 0 ? 2 : blockIdx === 1 ? 4 : blockIdx === 2 ? 6 : 8;

      const beats: DrumBeat[] = [];

      for (let bIdx = 0; bIdx < 4; bIdx++) {
        const steps: DrumStep[] = [];

        for (let sIdx = 0; sIdx < sub; sIdx++) {
          const stepDef = cycle[cycleIndex % cycle.length];
          cycleIndex++;

          const hits: DrumHit[] = [];

          if (!progressiveOrchestration) {
            // Snare / Practice Pad Only Mode
            if (stepDef.hand === 'K') {
              hits.push({
                pieceId: 'kick',
                accent: stepDef.accent,
                sticking: 'K',
              });
            } else {
              hits.push({
                pieceId: 'snare',
                accent: stepDef.accent,
                ghost: stepDef.ghost,
                flam: stepDef.flam,
                sticking: stepDef.hand,
              });
            }
          } else {
            // Progressive Kit Orchestration Mode
            if (stepDef.hand === 'K') {
              hits.push({
                pieceId: 'kick',
                accent: true,
                sticking: 'K',
              });
            } else if (blockIdx === 0) {
              // Block A (Corcheas): Snare centered, kick on measure downbeat
              hits.push({
                pieceId: 'snare',
                accent: stepDef.accent,
                ghost: stepDef.ghost,
                flam: stepDef.flam,
                sticking: stepDef.hand,
              });
              if (bIdx === 0 && sIdx === 0) {
                hits.push({ pieceId: 'kick', accent: true });
              }
            } else if (blockIdx === 1) {
              // Block B (Semicorcheas): Accents on Tom 1 / Crash, inner notes on Snare
              const pieceId: DrumPieceId = stepDef.accent
                ? bIdx % 2 === 0
                  ? 'tom1'
                  : 'tom2'
                : 'snare';
              hits.push({
                pieceId,
                accent: stepDef.accent,
                ghost: stepDef.ghost,
                sticking: stepDef.hand,
              });
              if (bIdx === 0 && sIdx === 0) {
                hits.push({ pieceId: 'kick', accent: true });
              }
            } else if (blockIdx === 2) {
              // Block C (Seisillos 6:4): Melodic descending cascade across toms
              let pieceId: DrumPieceId = 'snare';
              if (bIdx === 0) pieceId = 'snare';
              else if (bIdx === 1) pieceId = 'tom1';
              else if (bIdx === 2) pieceId = 'tom2';
              else if (bIdx === 3) pieceId = 'floorTom';

              if (stepDef.accent && bIdx === 0 && sIdx === 0) {
                hits.push({ pieceId: 'crash', accent: true });
                hits.push({ pieceId: 'kick', accent: true });
              }
              hits.push({
                pieceId,
                accent: stepDef.accent,
                ghost: stepDef.ghost,
                sticking: stepDef.hand,
              });
            } else {
              // Block D (32nds): High-energy chops
              let pieceId: DrumPieceId = 'snare';
              if (sIdx === 0 && bIdx === 0) {
                hits.push({ pieceId: 'crash', accent: true });
                hits.push({ pieceId: 'kick', accent: true });
                pieceId = 'snare';
              } else if (bIdx === 1) {
                pieceId = 'tom1';
              } else if (bIdx === 2) {
                pieceId = 'tom2';
              } else if (bIdx === 3) {
                pieceId = 'floorTom';
              }

              hits.push({
                pieceId,
                accent: stepDef.accent,
                ghost: stepDef.ghost,
                sticking: stepDef.hand,
              });
            }
          }

          steps.push({
            id: `m${mIdx + 1}-b${bIdx}-s${sIdx}`,
            hits,
            isRest: false,
            sticking: stepDef.hand,
            flam: stepDef.flam,
          });
        }

        beats.push({
          id: `m${mIdx + 1}-b${bIdx}`,
          beatIndex: bIdx,
          subdivision: sub,
          isTuplet: sub === 6,
          tupletRatio: sub === 6 ? [6, 4] : undefined,
          steps,
        });
      }

      measures.push({
        id: `m${mIdx + 1}`,
        timeSignature: [4, 4],
        beats,
      });
    }

    onGenerateWorkout({
      title: `Workout: ${currentPattern.name} (${lengthBars} C)`,
      measures,
      bpm,
      measuresCount: lengthBars,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-surface-card/95 border border-white/15 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-surface-dark/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Workout Builder: Pirámide de Aceleración
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                  8 / 16 / 24 Compases
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Diseña secuencias estructuradas de práctica técnica con progresión de subdivisiones y orquestación.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {/* 1. Selector de Longitud de Secuencia */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <span>1. Longitud de la Secuencia de Ensayo:</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[8, 16, 24].map((bars) => {
                const isSelected = lengthBars === bars;
                return (
                  <button
                    key={`bars-${bars}`}
                    type="button"
                    onClick={() => setLengthBars(bars as 8 | 16 | 24)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                        : 'bg-surface-slate border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-extrabold text-white">
                        {bars} Compases
                      </span>
                      {isSelected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 mt-2 font-mono">
                      {bars === 8
                        ? 'Calentamiento ágil (2 compases por bloque)'
                        : bars === 16
                        ? 'Estándar Sonora (4 compases por bloque)'
                        : 'Máxima resistencia (6 compases por bloque)'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Selector de Célula / Rudimento Base */}
          <div className="space-y-2.5">
            <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <span>2. Selecciona la Célula o Rudimento Base:</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {WORKOUT_PATTERNS.map((pattern) => {
                const isSelected = selectedPatternId === pattern.id;
                return (
                  <div
                    key={pattern.id}
                    onClick={() => {
                      setSelectedPatternId(pattern.id);
                      setBpm(pattern.defaultBpm);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-synth-cyan/15 border-synth-cyan text-white shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-synth-cyan'
                        : 'bg-surface-slate border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{pattern.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-synth-cyan font-semibold">
                          {pattern.subtitle}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-1">{pattern.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {onPlayHit && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayHit('snare');
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
                          title="Probar sonido"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-synth-cyan bg-synth-cyan text-black'
                            : 'border-white/20 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Progresión de la Pirámide de Subdivisiones */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>3. Estructura de Aceleración (Pirámide de Subdivisiones):</span>
              </label>
              <span className="text-[11px] font-mono text-gray-400">
                Transición progresiva continua
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {blocksInfo.map((b) => (
                <div
                  key={b.block}
                  className={`p-3.5 rounded-2xl border ${b.color} flex flex-col justify-between space-y-2`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider font-mono">
                        {b.block}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${b.badgeColor}`}>
                        {b.bars}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white">{b.subdivision}</div>
                    <div className="text-[11px] font-mono opacity-80">{b.density}</div>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-1">
                    <p className="text-[10px] text-gray-300 leading-relaxed">{b.focus}</p>
                    <p className="text-[9px] font-mono opacity-75 text-amber-200">
                      ⚡ {b.orchestration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Opciones de Orquestación y Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            {/* Orquestación Progresiva Toggle */}
            <div
              onClick={() => setProgressiveOrchestration((prev) => !prev)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                progressiveOrchestration
                  ? 'bg-amber-500/15 border-amber-400/80 text-white'
                  : 'bg-surface-slate border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    🥁 Orquestación Progresiva en el Kit
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      progressiveOrchestration
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {progressiveOrchestration ? 'ACTIVADA' : 'SÓLO CAJA'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {progressiveOrchestration
                    ? 'Distribuye automáticamente acentos y frases entre toms, bombo y platillos.'
                    : 'Mantiene toda la secuencia en caja pura (estilo pad de estudio de rudimentos).'}
                </p>
              </div>

              <div
                className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                  progressiveOrchestration ? 'bg-amber-400 justify-end' : 'bg-white/20 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-black shadow-md" />
              </div>
            </div>

            {/* Tempo BPM Adjuster */}
            <div className="p-4 rounded-2xl bg-surface-slate border border-white/10 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gray-300">
                  TEMPO OBJETIVO (BPM):
                </span>
                <span className="text-sm font-mono font-bold text-synth-cyan">
                  {bpm} BPM
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={50}
                  max={220}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="flex-1 accent-synth-cyan cursor-pointer"
                />
                <input
                  type="number"
                  min={50}
                  max={220}
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-16 bg-surface-card border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold text-synth-cyan focus:outline-none focus:border-synth-cyan"
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500">
                Sugerencia para {currentPattern.name}: {currentPattern.defaultBpm} BPM
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 bg-surface-dark/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-gray-400">
            Generará <span className="text-white font-bold">{lengthBars} compases</span> con{' '}
            <span className="text-emerald-300 font-bold">{currentPattern.name}</span> a{' '}
            <span className="text-synth-cyan font-bold">{bpm} BPM</span>.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs font-mono tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>GENERAR Y CARGAR RUTINA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
