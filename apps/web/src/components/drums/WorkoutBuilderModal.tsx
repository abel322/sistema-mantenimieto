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
  Plus,
  Trash2,
  Music,
  Target,
} from 'lucide-react';
import { DrumMeasure, DrumBeat, DrumStep, DrumHit, DrumPieceId } from '@/types/drum';

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
  value: number; // 1, 2, 3, 4, 5, 6, 8
  label: string; // '1/4', '1/8', '3:2', '1/16', '5:4', '6:4', '1/32'
  nameEs: string;
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

// 5 primary interactive subdivision chips
export const CHIP_SUBDIVISIONS = WORKOUT_SUBDIVISION_OPTIONS.filter((s) =>
  [2, 4, 3, 6, 8].includes(s.value)
);

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
  { id: 'snare-only', label: 'Caja Sola', desc: 'Práctica pura en caja o pad', icon: '🥁' },
  { id: 'snare-kick-downbeat', label: 'Caja + Bombo', desc: 'Anclaje en cada tiempo fuerte', icon: '⚡' },
  { id: 'toms-cascade', label: 'Cascada Toms', desc: 'Distribución melódica por el set', icon: '🌀' },
  { id: 'full-kit-chops', label: 'Full Kit Chops', desc: 'Chops modernos en todo el kit', icon: '💥' },
];

export interface WorkoutPhase {
  id: string;
  measuresCount: number;
  subdivisionValue: number;
  orchestration: BlockOrchestration;
}

export interface WorkoutPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  phases: Array<{ measuresCount: number; subdivisionValue: number; orchestration: BlockOrchestration }>;
}

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: 'classic-pyramid',
    name: 'Pirámide Clásica (1/8 → 1/16 → 6:4 → 1/32)',
    icon: '⚡',
    description: 'Aceleración progresiva estándar de 4 fases.',
    phases: [
      { measuresCount: 4, subdivisionValue: 2, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 4, subdivisionValue: 4, orchestration: 'toms-cascade' },
      { measuresCount: 4, subdivisionValue: 6, orchestration: 'toms-cascade' },
      { measuresCount: 4, subdivisionValue: 8, orchestration: 'full-kit-chops' },
    ],
  },
  {
    id: 'warmup',
    name: 'Calentamiento Progresivo (1/8 → 1/16)',
    icon: '🔥',
    description: 'Control de pulso, relajación y fluidez técnica.',
    phases: [
      { measuresCount: 4, subdivisionValue: 2, orchestration: 'snare-only' },
      { measuresCount: 4, subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
    ],
  },
  {
    id: 'blues-12',
    name: 'Forma Blues 12 Compases',
    icon: '🎷',
    description: 'Estructura ternaria de 12 compases con shuffle y dinámicas.',
    phases: [
      { measuresCount: 4, subdivisionValue: 3, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 4, subdivisionValue: 3, orchestration: 'toms-cascade' },
      { measuresCount: 4, subdivisionValue: 6, orchestration: 'full-kit-chops' },
    ],
  },
  {
    id: 'endurance',
    name: 'Endurance / Resistencia',
    icon: '🛡️',
    description: 'Misma subdivisión constante en 16 compases para desarrollar solidez.',
    phases: [
      { measuresCount: 8, subdivisionValue: 4, orchestration: 'snare-only' },
      { measuresCount: 8, subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
    ],
  },
  {
    id: 'custom-free',
    name: 'Workout Personalizado Libre',
    icon: '✨',
    description: 'Estructura limpia y flexible lista para personalizar.',
    phases: [
      { measuresCount: 4, subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 4, subdivisionValue: 6, orchestration: 'full-kit-chops' },
    ],
  },
];

export const QUICK_MEASURE_OPTIONS = [4, 8, 12, 16, 24, 32];

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
  // Pattern & Tempo
  const [selectedPatternId, setSelectedPatternId] = useState<string>('single-paradiddle');
  const [patternSearch, setPatternSearch] = useState<string>('');
  const [bpm, setBpm] = useState<number>(105);
  const [progressiveOrchestration, setProgressiveOrchestration] = useState<boolean>(true);

  // Modular Phases System
  const [phases, setPhases] = useState<WorkoutPhase[]>([
    { id: 'phase-1', measuresCount: 4, subdivisionValue: 2, orchestration: 'snare-kick-downbeat' },
    { id: 'phase-2', measuresCount: 4, subdivisionValue: 4, orchestration: 'toms-cascade' },
    { id: 'phase-3', measuresCount: 4, subdivisionValue: 6, orchestration: 'toms-cascade' },
    { id: 'phase-4', measuresCount: 4, subdivisionValue: 8, orchestration: 'full-kit-chops' },
  ]);

  const [activePresetId, setActivePresetId] = useState<string | null>('classic-pyramid');

  // Total measures calculation
  const totalMeasures = useMemo(() => {
    return phases.reduce((acc, p) => acc + p.measuresCount, 0);
  }, [phases]);

  // Bar range boundaries per phase
  const phaseRanges = useMemo(() => {
    let currentStart = 1;
    return phases.map((phase) => {
      const startBar = currentStart;
      const endBar = currentStart + phase.measuresCount - 1;
      currentStart = endBar + 1;
      return { startBar, endBar, count: phase.measuresCount };
    });
  }, [phases]);

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

  // Set target total measures and distribute cleanly across existing phases
  const handleSetTotalMeasuresTarget = (target: number) => {
    const safeTarget = Math.max(1, Math.min(64, target));
    setActivePresetId(null);

    setPhases((prevPhases) => {
      const numPhases = prevPhases.length;
      if (numPhases === 0) return prevPhases;

      const base = Math.floor(safeTarget / numPhases);
      const remainder = safeTarget % numPhases;

      return prevPhases.map((phase, idx) => {
        let count = base + (idx < remainder ? 1 : 0);
        if (count < 1) count = 1;
        return { ...phase, measuresCount: count };
      });
    });
  };

  // Phase manipulation handlers
  const handleUpdatePhaseMeasures = (phaseId: string, count: number) => {
    const safeCount = Math.max(1, Math.min(32, count));
    setActivePresetId(null);
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, measuresCount: safeCount } : p))
    );
  };

  const handleUpdatePhaseSubdivision = (phaseId: string, subValue: number) => {
    setActivePresetId(null);
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, subdivisionValue: subValue } : p))
    );
  };

  const handleUpdatePhaseOrchestration = (phaseId: string, orchestration: BlockOrchestration) => {
    setActivePresetId(null);
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, orchestration } : p))
    );
  };

  const handleAddPhase = () => {
    if (phases.length >= 8) return;
    setActivePresetId(null);

    const lastPhase = phases[phases.length - 1];
    const nextSub = lastPhase
      ? lastPhase.subdivisionValue === 2
        ? 4
        : lastPhase.subdivisionValue === 4
        ? 6
        : lastPhase.subdivisionValue === 6
        ? 8
        : 4
      : 4;

    const nextOrch: BlockOrchestration = lastPhase
      ? lastPhase.orchestration === 'snare-only'
        ? 'snare-kick-downbeat'
        : lastPhase.orchestration === 'snare-kick-downbeat'
        ? 'toms-cascade'
        : 'full-kit-chops'
      : 'toms-cascade';

    const newPhase: WorkoutPhase = {
      id: `phase-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      measuresCount: Math.max(2, Math.round(totalMeasures / (phases.length + 1)) || 4),
      subdivisionValue: nextSub,
      orchestration: nextOrch,
    };

    setPhases((prev) => [...prev, newPhase]);
  };

  const handleRemovePhase = (phaseId: string) => {
    if (phases.length <= 1) return;
    setActivePresetId(null);
    setPhases((prev) => prev.filter((p) => p.id !== phaseId));
  };

  const handleApplyPreset = (preset: WorkoutPreset) => {
    setActivePresetId(preset.id);
    const newPhases = preset.phases.map((p, idx) => ({
      id: `phase-${idx + 1}-${Date.now()}`,
      measuresCount: p.measuresCount,
      subdivisionValue: p.subdivisionValue,
      orchestration: p.orchestration,
    }));
    setPhases(newPhases);
  };

  // Drum sound mapping for each step depending on chosen orchestration
  const getHitsForStep = (
    stepDef: WorkoutPatternDef['stickingCycle'][number],
    orchestration: BlockOrchestration,
    bIdx: number,
    sIdx: number
  ): DrumHit[] => {
    const hits: DrumHit[] = [];

    // Hand is 'K' (Kick)
    if (stepDef.hand === 'K') {
      hits.push({
        pieceId: 'kick',
        accent: stepDef.accent ?? true,
        sticking: 'K',
      });
      return hits;
    }

    // Mode 1: Pure Snare
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

    // Mode 2: Snare + Kick on Downbeats
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

    // Mode 3: Toms Cascade (Snare -> Tom1 -> Tom2 -> FloorTom)
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

    // Mode 4: Full Kit Chops
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

    hits.push({
      pieceId: 'snare',
      accent: stepDef.accent,
      ghost: stepDef.ghost,
      flam: stepDef.flam,
      sticking: stepDef.hand,
    });
    return hits;
  };

  // Full score generator across all dynamic phases
  const handleGenerate = () => {
    const cycle = currentPattern.stickingCycle;
    const measures: DrumMeasure[] = [];
    let cycleIndex = 0;
    let measureIndexTracker = 1;

    for (const phase of phases) {
      const subOption =
        WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === phase.subdivisionValue) ||
        WORKOUT_SUBDIVISION_OPTIONS[1];
      const sub = subOption.value;

      for (let m = 0; m < phase.measuresCount; m++) {
        const beats: DrumBeat[] = [];

        for (let bIdx = 0; bIdx < 4; bIdx++) {
          const steps: DrumStep[] = [];

          for (let sIdx = 0; sIdx < sub; sIdx++) {
            const stepDef = cycle[cycleIndex % cycle.length];
            cycleIndex++;

            const hits = getHitsForStep(
              stepDef,
              progressiveOrchestration ? phase.orchestration : 'snare-only',
              bIdx,
              sIdx
            );

            steps.push({
              id: `m${measureIndexTracker}-b${bIdx}-s${sIdx}`,
              hits,
              isRest: false,
              sticking: stepDef.hand,
              flam: stepDef.flam,
            });
          }

          beats.push({
            id: `m${measureIndexTracker}-b${bIdx}`,
            beatIndex: bIdx,
            subdivision: sub,
            isTuplet: subOption.isTuplet,
            tupletRatio: subOption.ratio,
            steps,
          });
        }

        measures.push({
          id: `m${measureIndexTracker}`,
          timeSignature: [4, 4],
          beats,
        });

        measureIndexTracker++;
      }
    }

    onGenerateWorkout({
      title: `Workout: ${currentPattern.name} (${totalMeasures} C)`,
      measures,
      bpm,
      measuresCount: totalMeasures,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full h-[92vh] sm:h-auto sm:max-h-[92vh] sm:max-w-6xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden bg-[#0B0F19] border-t sm:border border-white/10 shadow-2xl">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Modal Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#0B0F19]/95 backdrop-blur-md border-b border-white/10 p-3 sm:p-4 flex justify-between items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                  Workout Builder: Pirámide Modular
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex-shrink-0">
                  {totalMeasures} Compases
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate hidden sm:block">
                Diseña rutinas dinámicas por fases sin restricciones de compases ni bloques fijos.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Strip (1 Clic) */}
        <div className="bg-slate-950/90 border-b border-white/10 px-3 sm:px-5 py-2 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 flex-shrink-0">
          <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1 shrink-0">
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            Plantillas:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {WORKOUT_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body (2 Paneles Limpios) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ======================================================== */}
            {/* PANEL IZQUIERDO: Parámetros Base (~35% -> lg:col-span-4) */}
            {/* ======================================================== */}
            <div className="lg:col-span-4 space-y-4">
              {/* 1. Longitud Total Deseada (Libre) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                    LONGITUD TOTAL:
                  </label>
                  <span className="text-cyan-300 font-bold font-mono">
                    {totalMeasures} compases
                  </span>
                </div>

                {/* Acceso Rápido */}
                <div className="grid grid-cols-3 gap-1.5">
                  {QUICK_MEASURE_OPTIONS.map((val) => {
                    const isSelected = totalMeasures === val;
                    return (
                      <button
                        key={`quick-bar-${val}`}
                        type="button"
                        onClick={() => handleSetTotalMeasuresTarget(val)}
                        className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                            : 'bg-slate-950/60 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {val} C
                      </button>
                    );
                  })}
                </div>

                {/* Stepper Manual + Input Directo (1 a 64 C) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                  <span className="text-[10px] font-mono text-gray-400">Ajuste fino:</span>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => handleSetTotalMeasuresTarget(totalMeasures - 1)}
                      disabled={totalMeasures <= 1}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold text-sm cursor-pointer transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={64}
                      value={totalMeasures}
                      onChange={(e) => handleSetTotalMeasuresTarget(Number(e.target.value))}
                      className="w-12 bg-transparent text-center font-mono text-xs font-black text-cyan-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSetTotalMeasuresTarget(totalMeasures + 1)}
                      disabled={totalMeasures >= 64}
                      className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold text-sm cursor-pointer transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Célula / Rudimento Base */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between text-xs font-mono">
                  <label className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-purple-400" />
                    CÉLULA / RUDIMENTO:
                  </label>
                  <span className="text-[10px] text-purple-300 font-mono">
                    {WORKOUT_PATTERNS.length} patrones
                  </span>
                </div>

                {/* Buscador Compacto */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={patternSearch}
                    onChange={(e) => setPatternSearch(e.target.value)}
                    placeholder="Buscar paradiddle, roll, chops..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-purple-400 transition-all"
                  />
                </div>

                {/* Lista Compacta de Patrones con Sticking Preview */}
                <div className="max-h-[190px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {filteredPatterns.map((pattern) => {
                    const isSelected = selectedPatternId === pattern.id;
                    return (
                      <div
                        key={pattern.id}
                        onClick={() => {
                          setSelectedPatternId(pattern.id);
                          setBpm(pattern.defaultBpm);
                        }}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-400'
                            : 'bg-slate-950/60 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">
                              {pattern.name}
                            </span>
                          </div>
                          {/* Mini Sticking Chips */}
                          <div className="flex items-center gap-1 overflow-x-hidden pt-0.5">
                            {pattern.stickingCycle.slice(0, 8).map((st, sIdx) => (
                              <span
                                key={`st-${pattern.id}-${sIdx}`}
                                className={`text-[8px] font-mono px-1 py-0.2 rounded font-black ${
                                  st.hand === 'R'
                                    ? 'bg-cyan-500/25 text-cyan-300'
                                    : st.hand === 'L'
                                    ? 'bg-purple-500/25 text-purple-300'
                                    : 'bg-emerald-500/25 text-emerald-300'
                                }`}
                              >
                                {st.accent ? `>${st.hand}` : st.ghost ? `(${st.hand})` : st.hand}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onPlayHit && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlayHit('snare');
                              }}
                              className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-all cursor-pointer"
                              title="Probar sonido"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          )}
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-purple-400 bg-purple-400 text-black'
                                : 'border-white/20 text-transparent'
                            }`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Tempo Objetivo (Slider Numérico Estilizado) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    TEMPO OBJETIVO:
                  </span>
                  <span className="text-amber-300 font-bold font-mono text-sm">
                    {bpm} BPM
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="range"
                    min={50}
                    max={220}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={50}
                    max={220}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-14 bg-slate-950 border border-white/15 rounded-lg px-1.5 py-0.5 text-center font-mono text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Switch de Orquestación Progresiva */}
                <div
                  onClick={() => setProgressiveOrchestration((prev) => !prev)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    progressiveOrchestration
                      ? 'bg-amber-500/15 border-amber-400/60 text-white'
                      : 'bg-slate-950/60 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-[11px] font-mono leading-tight">
                    <span className="font-bold block text-white">
                      🥁 Orquestación Progresiva
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {progressiveOrchestration
                        ? 'Acentos y notas en toms/bombo/crash'
                        : 'Solo caja (modo pad)'}
                    </span>
                  </div>
                  <div
                    className={`w-8 h-4 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                      progressiveOrchestration ? 'bg-amber-400 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-black shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PANEL DERECHO: Timeline Modular & Fases (~65% -> lg:col-span-8) */}
            {/* ======================================================== */}
            <div className="lg:col-span-8 space-y-4">
              {/* 1. Línea de Tiempo Visual Horizontal Interactiva */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Línea de Tiempo Modular ({totalMeasures} Compases en Total):
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {phases.length} {phases.length === 1 ? 'fase' : 'fases'} activas
                  </span>
                </div>

                {/* Barra Segmentada Proporcional */}
                <div className="w-full h-12 rounded-xl bg-slate-950/80 border border-white/10 p-1 flex items-center gap-1 shadow-inner overflow-hidden">
                  {phases.map((phase, idx) => {
                    const range = phaseRanges[idx];
                    const subInfo =
                      WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === phase.subdivisionValue) ||
                      WORKOUT_SUBDIVISION_OPTIONS[1];
                    const orchInfo = BLOCK_ORCHESTRATION_OPTIONS.find(
                      (o) => o.id === phase.orchestration
                    );
                    const widthPct = Math.max(8, (phase.measuresCount / totalMeasures) * 100);

                    return (
                      <div
                        key={`timeline-segment-${phase.id}`}
                        style={{ width: `${widthPct}%` }}
                        className={`h-full rounded-lg border ${subInfo.borderColor} ${subInfo.badgeColor} px-2 flex items-center justify-between transition-all select-none relative group overflow-hidden`}
                        title={`Fase ${idx + 1}: C${range.startBar} - C${range.endBar} (${phase.measuresCount} C) • ${subInfo.label} • ${orchInfo?.label}`}
                      >
                        <div className="min-w-0 flex items-center gap-1.5 truncate">
                          <span className="w-4 h-4 rounded-full bg-white/20 text-white font-mono text-[9px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-black text-xs text-white shrink-0">
                            {subInfo.label}
                          </span>
                          <span className="text-[10px] text-gray-200 font-mono hidden sm:inline truncate">
                            C{range.startBar}–C{range.endBar}
                          </span>
                        </div>

                        <span className="text-xs shrink-0">{orchInfo?.icon}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Lista Limpia de Fases Activas Configuradas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Fases de Aceleración y Orquestación:
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Personaliza subdivisión y kit en cada fase
                  </span>
                </div>

                <div className="space-y-2.5">
                  {phases.map((phase, idx) => {
                    const range = phaseRanges[idx];
                    const subInfo =
                      WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === phase.subdivisionValue) ||
                      WORKOUT_SUBDIVISION_OPTIONS[1];

                    return (
                      <div
                        key={phase.id}
                        className={`p-3 sm:p-3.5 rounded-2xl border ${subInfo.borderColor} bg-slate-900/80 hover:bg-slate-900 transition-all space-y-2.5 shadow-md`}
                      >
                        {/* Cabecera de la Fase */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-lg ${subInfo.badgeColor} border flex items-center justify-center font-mono font-black text-xs text-white`}
                            >
                              {idx + 1}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white font-mono">
                                Fase {idx + 1}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/10">
                                Compases {range.startBar} al {range.endBar} ({phase.measuresCount} C)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            {/* Stepper de Compases para esta Fase */}
                            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-white/10">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdatePhaseMeasures(phase.id, phase.measuresCount - 1)
                                }
                                disabled={phase.measuresCount <= 1}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center text-xs font-mono font-bold cursor-pointer transition-all"
                                title="Reducir 1 compás"
                              >
                                -
                              </button>
                              <span className="w-10 text-center font-mono text-xs font-bold text-white">
                                {phase.measuresCount} C
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdatePhaseMeasures(phase.id, phase.measuresCount + 1)
                                }
                                disabled={phase.measuresCount >= 32}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center text-xs font-mono font-bold cursor-pointer transition-all"
                                title="Añadir 1 compás"
                              >
                                +
                              </button>
                            </div>

                            {/* Botón Eliminar Fase */}
                            {phases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePhase(phase.id)}
                                className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Eliminar fase"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Controles de Subdivisión & Orquestación en Chips Interactivos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-white/5">
                          {/* Subdivisión Chips */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                              Subdivisión:
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {CHIP_SUBDIVISIONS.map((opt) => {
                                const isSelected = phase.subdivisionValue === opt.value;
                                return (
                                  <button
                                    key={`sub-${phase.id}-${opt.value}`}
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePhaseSubdivision(phase.id, opt.value)
                                    }
                                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                      isSelected
                                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                        : 'bg-slate-950/80 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                    title={`${opt.label} (${opt.nameEs}) • ${opt.density}`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Orquestación Chips */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                              Orquestación:
                            </span>
                            <div className="flex items-center gap-1 flex-wrap">
                              {BLOCK_ORCHESTRATION_OPTIONS.map((orch) => {
                                const isSelected = phase.orchestration === orch.id;
                                return (
                                  <button
                                    key={`orch-${phase.id}-${orch.id}`}
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePhaseOrchestration(phase.id, orch.id)
                                    }
                                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                                      isSelected
                                        ? 'bg-amber-500/25 text-amber-300 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                                        : 'bg-slate-950/80 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                    title={orch.desc}
                                  >
                                    <span>{orch.icon}</span>
                                    <span>{orch.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Botón Añadir Fase de Aceleración */}
                {phases.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddPhase}
                    className="w-full py-2.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-emerald-400/50 bg-slate-900/40 hover:bg-emerald-500/5 text-gray-400 hover:text-emerald-300 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono text-xs font-bold"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>+ Añadir Fase de Aceleración</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-[#0B0F19]/95 backdrop-blur-md border-t border-white/10 px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono text-gray-300 truncate text-center sm:text-left">
            Generando rutina de <span className="text-white font-bold">{totalMeasures} compases</span> ({phases.length} fases) con{' '}
            <span className="text-emerald-300 font-bold">{currentPattern.name}</span> a{' '}
            <span className="text-cyan-400 font-bold">{bpm} BPM</span>.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
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
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs font-mono tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial active:scale-95"
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
