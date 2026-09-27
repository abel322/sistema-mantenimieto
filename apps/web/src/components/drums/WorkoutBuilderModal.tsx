'use client';

import React, { useState, useMemo } from 'react';
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
  Search,
  Wand2,
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

export interface BlockSubdivisionDef {
  value: number; // 1, 2, 3, 4, 5, 6, 7, 8
  label: string; // '1/4', '1/8', '3:2', '1/16', '5:4', '6:4', '7:4', '1/32'
  nameEs: string; // 'Negras', 'Corcheas', etc.
  density: string;
  isTuplet: boolean;
  ratio?: [number, number];
  color: string;
  badgeColor: string;
  borderColor: string;
  bgGradient: string;
}

export const WORKOUT_SUBDIVISION_OPTIONS: BlockSubdivisionDef[] = [
  {
    value: 1,
    label: '1/4',
    nameEs: 'Negras',
    density: '1 nota/pulso',
    isTuplet: false,
    color: 'text-blue-400',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    bgGradient: 'from-blue-500/20 to-blue-500/5',
  },
  {
    value: 2,
    label: '1/8',
    nameEs: 'Corcheas',
    density: '2 notas/pulso',
    isTuplet: false,
    color: 'text-cyan-400',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    borderColor: 'border-cyan-500/40',
    bgGradient: 'from-cyan-500/20 to-cyan-500/5',
  },
  {
    value: 3,
    label: '3:2',
    nameEs: 'Tresillos',
    density: '3 notas/pulso',
    isTuplet: true,
    ratio: [3, 2],
    color: 'text-teal-400',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    borderColor: 'border-teal-500/40',
    bgGradient: 'from-teal-500/20 to-teal-500/5',
  },
  {
    value: 4,
    label: '1/16',
    nameEs: 'Semicorcheas',
    density: '4 notas/pulso',
    isTuplet: false,
    color: 'text-purple-400',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    bgGradient: 'from-purple-500/20 to-purple-500/5',
  },
  {
    value: 5,
    label: '5:4',
    nameEs: 'Quintillos',
    density: '5 notas/pulso',
    isTuplet: true,
    ratio: [5, 4],
    color: 'text-pink-400',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    borderColor: 'border-pink-500/40',
    bgGradient: 'from-pink-500/20 to-pink-500/5',
  },
  {
    value: 6,
    label: '6:4',
    nameEs: 'Seisillos',
    density: '6 notas/pulso',
    isTuplet: true,
    ratio: [6, 4],
    color: 'text-amber-400',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    bgGradient: 'from-amber-500/20 to-amber-500/5',
  },
  {
    value: 7,
    label: '7:4',
    nameEs: 'Septillos',
    density: '7 notas/pulso',
    isTuplet: true,
    ratio: [7, 4],
    color: 'text-orange-400',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    borderColor: 'border-orange-500/40',
    bgGradient: 'from-orange-500/20 to-orange-500/5',
  },
  {
    value: 8,
    label: '1/32',
    nameEs: 'Fusas',
    density: '8 notas/pulso',
    isTuplet: false,
    color: 'text-rose-400',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    borderColor: 'border-rose-500/40',
    bgGradient: 'from-rose-500/20 to-rose-500/5',
  },
];

export type BlockOrchestration =
  | 'snare-only'
  | 'snare-kick-downbeat'
  | 'toms-cascade'
  | 'full-kit-chops';

export const BLOCK_ORCHESTRATION_OPTIONS: {
  id: BlockOrchestration;
  label: string;
  desc: string;
  icon: string;
}[] = [
  { id: 'snare-only', label: 'Solo Caja / Snare', desc: 'Práctica pura en caja o pad', icon: '🥁' },
  { id: 'snare-kick-downbeat', label: 'Caja + Bombo en Downbeat', desc: 'Anclaje en cada tiempo fuerte', icon: '⚡' },
  { id: 'toms-cascade', label: 'Cascada Toms (Hi, Mid, Floor)', desc: 'Distribución melódica por el set', icon: '🌀' },
  { id: 'full-kit-chops', label: 'Full Kit Chops (Platillos + Bombo)', desc: 'Chops modernos en todo el kit', icon: '🔥' },
];

export interface BlockConfig {
  subdivisionValue: number;
  orchestration: BlockOrchestration;
}

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
  const [patternSearch, setPatternSearch] = useState<string>('');
  const [progressiveOrchestration, setProgressiveOrchestration] = useState<boolean>(true);
  const [bpm, setBpm] = useState<number>(105);

  // Configuración de los 4 bloques personalizables (A, B, C, D)
  const [blocks, setBlocks] = useState<BlockConfig[]>([
    { subdivisionValue: 2, orchestration: 'snare-kick-downbeat' }, // Bloque A: 1/8
    { subdivisionValue: 4, orchestration: 'toms-cascade' },        // Bloque B: 1/16
    { subdivisionValue: 6, orchestration: 'toms-cascade' },        // Bloque C: 6:4
    { subdivisionValue: 8, orchestration: 'full-kit-chops' },       // Bloque D: 1/32
  ]);

  const currentPattern = useMemo(() => {
    return WORKOUT_PATTERNS.find((p) => p.id === selectedPatternId) || WORKOUT_PATTERNS[0];
  }, [selectedPatternId]);

  const filteredPatterns = useMemo(() => {
    if (!patternSearch.trim()) return WORKOUT_PATTERNS;
    const q = patternSearch.toLowerCase();
    return WORKOUT_PATTERNS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [patternSearch]);

  if (!isOpen) return null;

  const barsPerBlock = lengthBars / 4;

  const getBarRangeText = (blockIndex: number) => {
    const start = blockIndex * barsPerBlock + 1;
    const end = (blockIndex + 1) * barsPerBlock;
    return `Compases ${start} - ${end}`;
  };

  // Botón rápido: Pirámide Clásica Sonora (1/8 -> 1/16 -> 6:4 -> 1/32)
  const handleApplyClassicPyramid = () => {
    setBlocks([
      { subdivisionValue: 2, orchestration: progressiveOrchestration ? 'snare-kick-downbeat' : 'snare-only' },
      { subdivisionValue: 4, orchestration: progressiveOrchestration ? 'toms-cascade' : 'snare-only' },
      { subdivisionValue: 6, orchestration: progressiveOrchestration ? 'toms-cascade' : 'snare-only' },
      { subdivisionValue: 8, orchestration: progressiveOrchestration ? 'full-kit-chops' : 'snare-only' },
    ]);
  };

  const handleUpdateBlockSubdivision = (blockIndex: number, subValue: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIndex] = { ...next[blockIndex], subdivisionValue: subValue };
      return next;
    });
  };

  const handleUpdateBlockOrchestration = (blockIndex: number, orchestration: BlockOrchestration) => {
    setBlocks((prev) => {
      const next = [...prev];
      next[blockIndex] = { ...next[blockIndex], orchestration };
      return next;
    });
  };

  // Asignador inteligente de sonido para cada golpe según orquestación
  const getHitsForStep = (
    stepDef: WorkoutPatternDef['stickingCycle'][number],
    orchestration: BlockOrchestration,
    bIdx: number,
    sIdx: number,
    sub: number
  ): DrumHit[] => {
    const hits: DrumHit[] = [];

    // Hand es 'K' (Bombo / Foot)
    if (stepDef.hand === 'K') {
      hits.push({
        pieceId: 'kick',
        accent: stepDef.accent ?? true,
        sticking: 'K',
      });
      return hits;
    }

    // Modo 1: Solo Caja / Snare
    if (orchestration === 'snare-only') {
      hits.push({
        pieceId: 'snare',
        accent: stepDef.accent,
        ghost: stepDef.ghost,
        flam: stepDef.flam,
        sticking: stepDef.hand,
      });
      return hits;
    }

    // Modo 2: Caja + Bombo en Downbeat
    if (orchestration === 'snare-kick-downbeat') {
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
      return hits;
    }

    // Modo 3: Cascada en Toms (Snare -> Tom1 -> Tom2 -> FloorTom)
    if (orchestration === 'toms-cascade') {
      let pieceId: DrumPieceId = 'snare';
      if (stepDef.ghost) {
        pieceId = 'snare';
      } else {
        if (bIdx === 0) pieceId = 'snare';
        else if (bIdx === 1) pieceId = 'tom1';
        else if (bIdx === 2) pieceId = 'tom2';
        else pieceId = 'floorTom';
      }

      if (bIdx === 0 && sIdx === 0 && stepDef.accent) {
        hits.push({ pieceId: 'crash', accent: true });
        hits.push({ pieceId: 'kick', accent: true });
      }

      hits.push({
        pieceId,
        accent: stepDef.accent,
        ghost: stepDef.ghost,
        flam: stepDef.flam,
        sticking: stepDef.hand,
      });
      return hits;
    }

    // Modo 4: Full Kit Chops (Crash + Bombo en acentos, toms en dinámicas)
    if (orchestration === 'full-kit-chops') {
      let pieceId: DrumPieceId = 'snare';
      if (stepDef.ghost) {
        pieceId = 'snare';
      } else if (stepDef.accent) {
        pieceId = bIdx % 2 === 0 ? 'crash' : 'floorTom';
        if (pieceId === 'crash') {
          hits.push({ pieceId: 'kick', accent: true });
        }
      } else {
        if (bIdx === 0) pieceId = 'snare';
        else if (bIdx === 1) pieceId = 'tom1';
        else if (bIdx === 2) pieceId = 'tom2';
        else pieceId = 'floorTom';
      }

      if (bIdx === 0 && sIdx === 0) {
        if (!hits.some((h) => h.pieceId === 'crash')) {
          hits.push({ pieceId: 'crash', accent: true });
        }
        if (!hits.some((h) => h.pieceId === 'kick')) {
          hits.push({ pieceId: 'kick', accent: true });
        }
      }

      hits.push({
        pieceId,
        accent: stepDef.accent,
        ghost: stepDef.ghost,
        flam: stepDef.flam,
        sticking: stepDef.hand,
      });
      return hits;
    }

    // Fallback estándar
    hits.push({
      pieceId: 'snare',
      accent: stepDef.accent,
      ghost: stepDef.ghost,
      flam: stepDef.flam,
      sticking: stepDef.hand,
    });
    return hits;
  };

  // Generador de la secuencia completa
  const handleGenerate = () => {
    const cycle = currentPattern.stickingCycle;
    const measures: DrumMeasure[] = [];
    let cycleIndex = 0;

    for (let mIdx = 0; mIdx < lengthBars; mIdx++) {
      const blockIdx = Math.min(3, Math.floor(mIdx / barsPerBlock));
      const blockCfg = blocks[blockIdx];
      const subOption =
        WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === blockCfg.subdivisionValue) ||
        WORKOUT_SUBDIVISION_OPTIONS[1];
      const sub = subOption.value;

      const beats: DrumBeat[] = [];

      for (let bIdx = 0; bIdx < 4; bIdx++) {
        const steps: DrumStep[] = [];

        for (let sIdx = 0; sIdx < sub; sIdx++) {
          const stepDef = cycle[cycleIndex % cycle.length];
          cycleIndex++;

          const hits = getHitsForStep(
            stepDef,
            progressiveOrchestration ? blockCfg.orchestration : 'snare-only',
            bIdx,
            sIdx,
            sub
          );

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
          isTuplet: subOption.isTuplet,
          tupletRatio: subOption.ratio,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0B0F19] border border-white/10 shadow-2xl overflow-hidden">
        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#0B0F19]/95 backdrop-blur-md border-b border-white/10 px-5 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Workout Builder: Pirámide de Aceleración
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
                  Personalizable
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400">
                Diseña secuencias estructuradas de práctica técnica con progresión de subdivisiones y orquestación.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* ======================================================== */}
            {/* COLUMNA 1: Parámetros Base (lg:col-span-5) */}
            {/* ======================================================== */}
            <div className="lg:col-span-5 space-y-4">
              {/* 1. Longitud de Secuencia */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                  <span>1. Longitud de Secuencia:</span>
                  <span className="text-[10px] text-emerald-400 font-normal">
                    {barsPerBlock} compases/bloque
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[8, 16, 24].map((bars) => {
                    const isSelected = lengthBars === bars;
                    return (
                      <button
                        key={`bars-${bars}`}
                        type="button"
                        onClick={() => setLengthBars(bars as 8 | 16 | 24)}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-br from-emerald-500/25 to-teal-500/15 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                            : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="font-mono text-xs sm:text-sm font-extrabold text-white">
                          {bars} Compases
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {bars === 8 ? 'Rápido (2 C)' : bars === 16 ? 'Estándar (4 C)' : 'Resistencia (6 C)'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Célula / Rudimento Base */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="font-bold uppercase tracking-wider text-gray-300">
                    2. Célula / Rudimento Base:
                  </label>
                  <span className="text-[10px] text-cyan-400">
                    {WORKOUT_PATTERNS.length} opciones
                  </span>
                </div>

                {/* Filtro rápido */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={patternSearch}
                    onChange={(e) => setPatternSearch(e.target.value)}
                    placeholder="Filtrar paradiddle, roll, linear..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Lista compacta scrolleable */}
                <div className="max-h-[175px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {filteredPatterns.map((pattern) => {
                    const isSelected = selectedPatternId === pattern.id;
                    return (
                      <div
                        key={pattern.id}
                        onClick={() => {
                          setSelectedPatternId(pattern.id);
                          setBpm(pattern.defaultBpm);
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400'
                            : 'bg-slate-900/70 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">
                              {pattern.name}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-semibold shrink-0">
                              {pattern.subtitle}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {pattern.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onPlayHit && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayHit('snare');
                              }}
                              className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all"
                              title="Probar sonido"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-400 text-black'
                                : 'border-white/20 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tempo Objetivo y Orquestación Switch */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                {/* Tempo Objetivo BPM */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-gray-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      TEMPO OBJETIVO:
                    </span>
                    <span className="text-sm font-bold text-cyan-400">
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
                      className="flex-1 accent-cyan-400 cursor-pointer"
                    />
                    <input
                      type="number"
                      min={50}
                      max={220}
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 block">
                    Tempo sugerido para {currentPattern.name}: {currentPattern.defaultBpm} BPM
                  </span>
                </div>

                {/* Orquestación Progresiva en el Kit Switch */}
                <div
                  onClick={() => setProgressiveOrchestration((prev) => !prev)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    progressiveOrchestration
                      ? 'bg-amber-500/15 border-amber-400/80 text-white'
                      : 'bg-slate-900/60 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        🥁 Orquestación Progresiva en el Kit
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          progressiveOrchestration
                            ? 'bg-amber-500/25 text-amber-300'
                            : 'bg-white/10 text-gray-400'
                        }`}
                      >
                        {progressiveOrchestration ? 'ACTIVADA' : 'SÓLO CAJA'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {progressiveOrchestration
                        ? 'Distribuye acentos y frases entre toms, bombo y platillos.'
                        : 'Mantiene toda la secuencia en caja pura (estilo pad de práctica).'}
                    </p>
                  </div>

                  <div
                    className={`w-10 h-5 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                      progressiveOrchestration ? 'bg-amber-400 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUMNA 2: Constructor de la Pirámide Interactiva (lg:col-span-7) */}
            {/* ======================================================== */}
            <div className="lg:col-span-7 space-y-3.5 flex flex-col justify-between">
              {/* Header de la Columna 2 con botón de Pirámide Clásica */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-200">
                    3. Constructor de Bloques de Aceleración:
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleApplyClassicPyramid}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                >
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🪄 Usar Pirámide Clásica Sonora (1/8 → 1/16 → 6:4 → 1/32)</span>
                </button>
              </div>

              {/* Grid 2x2 de los 4 Bloques Personalizables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                {blocks.map((block, idx) => {
                  const blockLetter = ['A', 'B', 'C', 'D'][idx];
                  const subDef =
                    WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === block.subdivisionValue) ||
                    WORKOUT_SUBDIVISION_OPTIONS[1];
                  const barRange = getBarRangeText(idx);

                  return (
                    <div
                      key={`block-card-${blockLetter}`}
                      className={`p-3.5 rounded-2xl border ${subDef.borderColor} bg-gradient-to-b ${subDef.bgGradient} flex flex-col justify-between space-y-3 shadow-lg`}
                    >
                      {/* Cabecera del Bloque */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs ${subDef.badgeColor} border`}
                          >
                            {blockLetter}
                          </span>
                          <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                            Bloque {blockLetter}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">
                          {barRange}
                        </span>
                      </div>

                      {/* Selectores del Bloque */}
                      <div className="space-y-2">
                        {/* Selector de Subdivisión */}
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">
                            Subdivisión Rítmica:
                          </label>
                          <select
                            value={block.subdivisionValue}
                            onChange={(e) =>
                              handleUpdateBlockSubdivision(idx, Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            {WORKOUT_SUBDIVISION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label} ({opt.nameEs}) • {opt.density}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Selector de Orquestación */}
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase mb-1">
                            Orquestación en Batería:
                          </label>
                          <select
                            disabled={!progressiveOrchestration}
                            value={block.orchestration}
                            onChange={(e) =>
                              handleUpdateBlockOrchestration(
                                idx,
                                e.target.value as BlockOrchestration
                              )
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {BLOCK_ORCHESTRATION_OPTIONS.map((orch) => (
                              <option key={orch.id} value={orch.id}>
                                {orch.icon} {orch.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Resumen de Densidad */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                        <span className={`font-bold ${subDef.color}`}>
                          {subDef.label} {subDef.nameEs}
                        </span>
                        <span className="text-gray-400">
                          ⚡ {subDef.density}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips sutiles */}
              <p className="text-[10px] font-mono text-gray-400 text-center">
                Consejo: Puedes crear pirámides simétricas o progresiones irregulares (ej. 1/4 → 3:2 → 5:4 → 7:4).
              </p>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. BARRA VISUAL DE LA LÍNEA DE TIEMPO (Timeline Preview) */}
          {/* ======================================================== */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-gray-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Línea de Tiempo de la Rutina ({lengthBars} Compases en Total):
              </span>
              <span className="text-[10px] text-gray-400">
                {barsPerBlock} compases por cada fase
              </span>
            </div>

            {/* Tira continua con cajas conectadas */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              {blocks.map((b, idx) => {
                const blockLetter = ['A', 'B', 'C', 'D'][idx];
                const subInfo =
                  WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === b.subdivisionValue) ||
                  WORKOUT_SUBDIVISION_OPTIONS[1];
                const orchInfo = BLOCK_ORCHESTRATION_OPTIONS.find(
                  (o) => o.id === b.orchestration
                );
                const startBar = idx * barsPerBlock + 1;
                const endBar = (idx + 1) * barsPerBlock;

                return (
                  <div
                    key={`timeline-strip-${blockLetter}`}
                    className={`p-2.5 rounded-xl border ${subInfo.borderColor} ${subInfo.badgeColor} flex flex-col justify-between transition-all`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="text-white">Bloque {blockLetter}</span>
                      <span className="opacity-90">C{startBar} - C{endBar}</span>
                    </div>

                    <div className="my-1.5 flex items-baseline gap-1.5">
                      <span className="text-base font-black text-white">
                        {subInfo.label}
                      </span>
                      <span className="text-[10px] font-mono font-medium opacity-85">
                        {subInfo.nameEs}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono truncate text-gray-300 flex items-center gap-1">
                      <span>{orchInfo?.icon}</span>
                      <span className="truncate">
                        {progressiveOrchestration ? orchInfo?.label.split(' ')[0] : 'Solo Caja'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-[#0B0F19]/95 backdrop-blur-md border-t border-white/10 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-gray-300">
            Generará <span className="text-white font-bold">{lengthBars} compases</span> con{' '}
            <span className="text-emerald-300 font-bold">{currentPattern.name}</span> a{' '}
            <span className="text-cyan-400 font-bold">{bpm} BPM</span>.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5 transition-colors cursor-pointer text-xs font-mono flex-1 sm:flex-initial text-center"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs font-mono tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>⚡ GENERAR Y CARGAR RUTINA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
