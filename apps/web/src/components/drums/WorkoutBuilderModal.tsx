'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  Zap,
  Play,
  Square,
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
  Repeat,
  Radio,
  Drum,
} from 'lucide-react';
import {
  DrumMeasure,
  DrumBeat,
  DrumStep,
  DrumHit,
  DrumPieceId,
  GroovePattern,
  GrooveHit,
  RudimentItem,
} from '@/types/drum';
import { RUDIMENTS_DATA } from '@/lib/rudimentsData';
import { GROOVES_DATA } from '@/lib/groovesData';
import MiniScorePreview from './MiniScorePreview';

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

// Primary interactive subdivision chips
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
  contentType: 'groove' | 'rudiment';
  measuresCount: number;
  subdivisionValue: number;
  orchestration: BlockOrchestration;
}

export interface WorkoutPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  phases: Array<{
    measuresCount: number;
    contentType: 'groove' | 'rudiment';
    subdivisionValue: number;
    orchestration: BlockOrchestration;
  }>;
}

export const WORKOUT_PRESETS: WorkoutPreset[] = [
  {
    id: 'phrase-3-1',
    name: '🎯 Fraseo 3+1 (3 Groove + 1 Fill)',
    icon: '🎯',
    description: '3 compases de ritmo sólido + 1 compás de fill con rudimento orquestado.',
    phases: [
      { measuresCount: 3, contentType: 'groove', subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 1, contentType: 'rudiment', subdivisionValue: 4, orchestration: 'toms-cascade' },
    ],
  },
  {
    id: 'call-and-response',
    name: '🔄 Llamada y Respuesta (1+1)',
    icon: '🔄',
    description: 'Alterna compases de groove con respuestas de rudimento / chops.',
    phases: [
      { measuresCount: 1, contentType: 'groove', subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 1, contentType: 'rudiment', subdivisionValue: 4, orchestration: 'full-kit-chops' },
      { measuresCount: 1, contentType: 'groove', subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 1, contentType: 'rudiment', subdivisionValue: 6, orchestration: 'toms-cascade' },
    ],
  },
  {
    id: 'classic-pyramid',
    name: '⚡ Pirámide Técnica Clásica',
    icon: '⚡',
    description: 'Aceleración progresiva (1/8 → 1/16 → 6:4 → 1/32) sobre el rudimento.',
    phases: [
      { measuresCount: 4, contentType: 'rudiment', subdivisionValue: 2, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 4, contentType: 'rudiment', subdivisionValue: 4, orchestration: 'toms-cascade' },
      { measuresCount: 4, contentType: 'rudiment', subdivisionValue: 6, orchestration: 'toms-cascade' },
      { measuresCount: 4, contentType: 'rudiment', subdivisionValue: 8, orchestration: 'full-kit-chops' },
    ],
  },
  {
    id: 'endurance-pocket',
    name: '🔥 Workout de Resistencia / Pocket',
    icon: '🔥',
    description: 'Groove continuo de 8 a 16 compases para desarrollar solidez y tempo.',
    phases: [
      { measuresCount: 8, contentType: 'groove', subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
      { measuresCount: 8, contentType: 'groove', subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
    ],
  },
  {
    id: 'warmup',
    name: '✨ Calentamiento Progresivo (1/8 → 1/16)',
    icon: '✨',
    description: 'Control de pulso, relajación y fluidez técnica en caja.',
    phases: [
      { measuresCount: 4, contentType: 'rudiment', subdivisionValue: 2, orchestration: 'snare-only' },
      { measuresCount: 4, contentType: 'rudiment', subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
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

// ========================================================
// Memoized List Item Components for Silky Smooth Scrolling
// ========================================================

interface RudimentCardItemProps {
  rudiment: RudimentItem;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: (rud: RudimentItem) => void;
  onPlayPreview: (rud: RudimentItem) => void;
}

const RudimentCardItem = React.memo(function RudimentCardItem({
  rudiment,
  isSelected,
  isPlaying,
  onSelect,
  onPlayPreview,
}: RudimentCardItemProps) {
  return (
    <div
      onClick={() => onSelect(rudiment)}
      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
        isSelected
          ? 'bg-purple-500/20 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-400'
          : 'bg-slate-950/60 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
      }`}
    >
      {/* Cabecera de la tarjeta: Nombre, Badge, Botón Play Preview, Checkbox/Radio */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-bold text-xs text-white truncate" title={rudiment.name}>
            {rudiment.name}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
            {rudiment.category}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPreview(rudiment);
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-purple-500 text-white border-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                : 'bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border-white/10'
            }`}
            title={isPlaying ? 'Detener preview' : 'Escuchar rudimento'}
          >
            {isPlaying ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
              isSelected
                ? 'border-purple-400 bg-purple-400 text-black shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                : 'border-white/20 text-transparent'
            }`}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Cuerpo de la tarjeta: MiniScorePreview con fondo sutil oscuro */}
      <div className="w-full bg-black/40 rounded border border-white/5 my-1 p-1 flex justify-center overflow-hidden">
        <MiniScorePreview
          rudiment={rudiment}
          width={270}
          height={60}
          className="border-none bg-transparent !p-0"
        />
      </div>

      {/* Digitación R/L y BPM */}
      <div className="flex items-center justify-between text-[9px] font-mono text-gray-400">
        <div className="flex items-center gap-1 overflow-x-hidden">
          {(rudiment.sticking || []).slice(0, 12).map((st, sIdx) => (
            <span
              key={`st-${rudiment.id}-${sIdx}`}
              className={`text-[8px] font-mono px-1 py-0.2 rounded font-black ${
                st === 'R'
                  ? 'bg-cyan-500/25 text-cyan-300'
                  : st === 'L'
                  ? 'bg-purple-500/25 text-purple-300'
                  : 'bg-emerald-500/25 text-emerald-300'
              }`}
            >
              {st}
            </span>
          ))}
        </div>
        {rudiment.defaultBpm && (
          <span className="text-purple-300/80 font-bold shrink-0">
            {rudiment.defaultBpm} BPM
          </span>
        )}
      </div>
    </div>
  );
});

interface GrooveCardItemProps {
  groove: GroovePattern;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: (grv: GroovePattern) => void;
  onPlayPreview: (grv: GroovePattern) => void;
}

const GrooveCardItem = React.memo(function GrooveCardItem({
  groove,
  isSelected,
  isPlaying,
  onSelect,
  onPlayPreview,
}: GrooveCardItemProps) {
  return (
    <div
      onClick={() => onSelect(groove)}
      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
        isSelected
          ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
          : 'bg-slate-950/60 border-white/10 text-gray-300 hover:border-white/20 hover:text-white'
      }`}
    >
      {/* Cabecera de la tarjeta: Nombre, Badge, Botón Play Preview, Checkbox/Radio */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="font-bold text-xs text-white truncate" title={groove.name}>
            {groove.name}
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
            {groove.timeSignature}
          </span>
          {groove.category && (
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-gray-300 shrink-0 hidden sm:inline truncate max-w-[80px]">
              {groove.category}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPreview(groove);
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-black border-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border-white/10'
            }`}
            title={isPlaying ? 'Detener preview' : 'Escuchar groove'}
          >
            {isPlaying ? (
              <Square className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>

          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
              isSelected
                ? 'border-amber-400 bg-amber-400 text-black shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'border-white/20 text-transparent'
            }`}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>
      </div>

      {/* Cuerpo de la tarjeta: MiniScorePreview con fondo sutil oscuro */}
      <div className="w-full bg-black/40 rounded border border-white/5 my-1 p-1 flex justify-center overflow-hidden">
        <MiniScorePreview
          groove={groove}
          width={270}
          height={60}
          className="border-none bg-transparent !p-0"
        />
      </div>

      {/* Subcategoría y BPM */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
        <span className="truncate">
          {groove.subCategory ? `${groove.category} • ${groove.subCategory}` : groove.category}
        </span>
        {groove.suggestedBpm && (
          <span className="text-amber-400/80 font-bold shrink-0">
            {groove.suggestedBpm} BPM
          </span>
        )}
      </div>
    </div>
  );
});

export default function WorkoutBuilderModal({
  isOpen,
  onClose,
  onGenerateWorkout,
  onPlayHit,
}: WorkoutBuilderModalProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Library Selector Tab in Left Panel
  const [baseLibraryTab, setBaseLibraryTab] = useState<'rudiments' | 'grooves'>('rudiments');

  // Custom Items from LocalStorage
  const [customRudiments, setCustomRudiments] = useState<RudimentItem[]>([]);
  const [customGrooves, setCustomGrooves] = useState<GroovePattern[]>([]);

  // Selected Base Patterns
  const [selectedRudimentId, setSelectedRudimentId] = useState<string>('single-paradiddle');
  const [selectedGrooveId, setSelectedGrooveId] = useState<string>('rock-straight-8th');

  // Filters & Search
  const [patternSearch, setPatternSearch] = useState<string>('');
  const [selectedRudimentCategory, setSelectedRudimentCategory] = useState<string>('all');
  const [selectedGrooveCategory, setSelectedGrooveCategory] = useState<string>('all');

  // Tempo & Settings
  const [bpm, setBpm] = useState<number>(105);
  const [progressiveOrchestration, setProgressiveOrchestration] = useState<boolean>(true);

  // Modular Phases System (Default: 🎯 Fraseo 3+1)
  const [phases, setPhases] = useState<WorkoutPhase[]>([
    { id: 'phase-1', contentType: 'groove', measuresCount: 3, subdivisionValue: 4, orchestration: 'snare-kick-downbeat' },
    { id: 'phase-2', contentType: 'rudiment', measuresCount: 1, subdivisionValue: 4, orchestration: 'toms-cascade' },
  ]);

  const [activePresetId, setActivePresetId] = useState<string | null>('phrase-3-1');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('phase-1');

  // Preview Loop with Web Audio / Tone.js
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const previewTimersRef = useRef<NodeJS.Timeout[]>([]);
  const isPreviewingRef = useRef<boolean>(false);

  const stopPreview = useCallback(() => {
    previewTimersRef.current.forEach((t) => clearTimeout(t));
    previewTimersRef.current = [];
    setPreviewingId(null);
    isPreviewingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  useEffect(() => {
    if (!isOpen) {
      stopPreview();
    }
  }, [isOpen, stopPreview]);

  // Load user's custom patterns on mount
  useEffect(() => {
    try {
      const rawRud = localStorage.getItem('sonora_custom_rudiments');
      if (rawRud) {
        const parsed = JSON.parse(rawRud);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomRudiments(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading custom rudiments from localStorage', e);
    }

    try {
      const rawGrv = localStorage.getItem('sonora_custom_grooves');
      if (rawGrv) {
        const parsed = JSON.parse(rawGrv);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomGrooves(parsed);
        }
      }
    } catch (e) {
      console.warn('Error reading custom grooves from localStorage', e);
    }
  }, []);

  // Merged catalogs
  const allRudiments = useMemo(() => {
    return [...RUDIMENTS_DATA, ...customRudiments];
  }, [customRudiments]);

  const allGrooves = useMemo(() => {
    return [...GROOVES_DATA, ...customGrooves];
  }, [customGrooves]);

  // Active Selected Patterns Objects
  const activeRudiment = useMemo(() => {
    return allRudiments.find((r) => r.id === selectedRudimentId) || allRudiments[0] || RUDIMENTS_DATA[0];
  }, [allRudiments, selectedRudimentId]);

  const activeGroove = useMemo(() => {
    return allGrooves.find((g) => g.id === selectedGrooveId) || allGrooves[0] || GROOVES_DATA[0];
  }, [allGrooves, selectedGrooveId]);

  // Filtered lists
  const filteredRudiments = useMemo(() => {
    let list = allRudiments;
    if (selectedRudimentCategory !== 'all') {
      list = list.filter((r) => r.category === selectedRudimentCategory);
    }
    if (patternSearch.trim()) {
      const q = patternSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q)) ||
          r.sticking?.join(' ').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRudiments, selectedRudimentCategory, patternSearch]);

  const filteredGrooves = useMemo(() => {
    let list = allGrooves;
    if (selectedGrooveCategory !== 'all') {
      list = list.filter((g) => g.category === selectedGrooveCategory);
    }
    if (patternSearch.trim()) {
      const q = patternSearch.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.subCategory?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allGrooves, selectedGrooveCategory, patternSearch]);

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

  if (!isOpen || !mounted) return null;

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
  const handleUpdatePhaseContentType = (phaseId: string, contentType: 'groove' | 'rudiment') => {
    setActivePresetId(null);
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, contentType } : p))
    );
  };

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

  const handleSelectPhase = useCallback((phase: WorkoutPhase) => {
    setSelectedPhaseId(phase.id);
    if (phase.contentType === 'groove') {
      setBaseLibraryTab('grooves');
    } else {
      setBaseLibraryTab('rudiments');
    }
  }, []);

  const handleSelectRudiment = useCallback((rud: RudimentItem) => {
    setSelectedRudimentId(rud.id);
    if (rud.defaultBpm) setBpm(rud.defaultBpm);

    // Sincronización con las fases:
    // Si la fase activa seleccionada en la columna derecha es de tipo 'rudiment', actualiza su subdivisión si corresponde
    setPhases((prevPhases) => {
      const current = prevPhases.find((p) => p.id === selectedPhaseId);
      if (current && current.contentType === 'rudiment') {
        if (rud.subdivision && [1, 2, 3, 4, 5, 6, 8].includes(rud.subdivision)) {
          return prevPhases.map((p) =>
            p.id === current.id ? { ...p, subdivisionValue: rud.subdivision! } : p
          );
        }
      }
      return prevPhases;
    });

    // Si la fase actualmente seleccionada es 'groove', busca si hay alguna fase de tipo rudimento y actívala
    const currentPhase = phases.find((p) => p.id === selectedPhaseId);
    if (currentPhase && currentPhase.contentType === 'groove') {
      const rudPhase = phases.find((p) => p.contentType === 'rudiment');
      if (rudPhase) {
        setSelectedPhaseId(rudPhase.id);
      }
    }
  }, [phases, selectedPhaseId]);

  const handleSelectGroove = useCallback((grv: GroovePattern) => {
    setSelectedGrooveId(grv.id);
    if (grv.suggestedBpm) setBpm(grv.suggestedBpm);

    // Si la fase actualmente seleccionada es 'rudiment', busca si hay alguna fase de tipo groove y actívala
    const currentPhase = phases.find((p) => p.id === selectedPhaseId);
    if (currentPhase && currentPhase.contentType === 'rudiment') {
      const grvPhase = phases.find((p) => p.contentType === 'groove');
      if (grvPhase) {
        setSelectedPhaseId(grvPhase.id);
      }
    }
  }, [phases, selectedPhaseId]);

  // Audio previews for list items
  const handlePreviewRudiment = useCallback((rud: RudimentItem) => {
    if (previewingId === rud.id) {
      stopPreview();
      return;
    }
    stopPreview();
    if (!onPlayHit) return;

    setPreviewingId(rud.id);
    isPreviewingRef.current = true;

    const rawSteps = rud.steps && rud.steps.length > 0
      ? rud.steps
      : (rud.sticking || ['R', 'L']).map((s, i) => ({
          sticking: s,
          accent: i === 0,
          ghost: false,
          flam: false,
        }));

    const sub = typeof rud.subdivision === 'number' ? rud.subdivision : 4;
    const bpmToUse = rud.defaultBpm || 105;
    const beatMs = (60 / bpmToUse) * 1000;
    const stepMs = beatMs / sub;

    // Play 2 cycles
    const totalSteps = Math.min(32, rawSteps.length * 2);
    for (let i = 0; i < totalSteps; i++) {
      const stepDef = rawSteps[i % rawSteps.length];
      const timer = setTimeout(() => {
        if (!isPreviewingRef.current) return;
        const pieceId: DrumPieceId =
          ('kitPiece' in stepDef && stepDef.kitPiece)
            ? (stepDef.kitPiece as DrumPieceId)
            : (stepDef.sticking === 'K' ? 'kick' : 'snare');
        onPlayHit(pieceId);
        if (i === totalSteps - 1) {
          stopPreview();
        }
      }, i * stepMs);
      previewTimersRef.current.push(timer);
    }
  }, [previewingId, stopPreview, onPlayHit]);

  const handlePreviewGroove = useCallback((grv: GroovePattern) => {
    if (previewingId === grv.id) {
      stopPreview();
      return;
    }
    stopPreview();
    if (!onPlayHit) return;

    setPreviewingId(grv.id);
    isPreviewingRef.current = true;

    const [numStr, denStr] = grv.timeSignature.split('/');
    const beatsCount = parseInt(numStr, 10) || 4;
    const beatValue = parseInt(denStr, 10) || 4;
    const bpmToUse = grv.suggestedBpm || 110;
    const beatMs = (60 / bpmToUse) * (4 / beatValue) * 1000;

    const measureTemplate = grv.measures?.[0];
    if (!measureTemplate) return;

    let currentOffsetMs = 0;

    for (let bIdx = 0; bIdx < beatsCount; bIdx++) {
      const beatTemplate = measureTemplate.beats[bIdx % measureTemplate.beats.length];
      const subs = beatTemplate?.subdivisions || [];
      const stepCount = subs.length > 0 ? subs.length : 4;
      const stepMs = beatMs / stepCount;

      for (let sIdx = 0; sIdx < stepCount; sIdx++) {
        const hits = subs[sIdx] || [];
        const scheduledTime = currentOffsetMs + sIdx * stepMs;

        const timer = setTimeout(() => {
          if (!isPreviewingRef.current) return;
          hits.forEach((h) => {
            const pieceId = (h.instrument === 'hihat' ? 'hihatClosed' : h.instrument) as DrumPieceId;
            onPlayHit(pieceId);
          });
        }, scheduledTime);

        previewTimersRef.current.push(timer);
      }
      currentOffsetMs += stepCount * stepMs;
    }

    const endTimer = setTimeout(() => {
      stopPreview();
    }, currentOffsetMs + 100);
    previewTimersRef.current.push(endTimer);
  }, [previewingId, stopPreview, onPlayHit]);

  const handleAddPhase = () => {
    if (phases.length >= 8) return;
    setActivePresetId(null);

    const lastPhase = phases[phases.length - 1];
    const nextType: 'groove' | 'rudiment' = lastPhase?.contentType === 'groove' ? 'rudiment' : 'groove';
    const nextSub = lastPhase?.subdivisionValue || 4;
    const nextOrch: BlockOrchestration = lastPhase?.orchestration || 'toms-cascade';

    const newPhase: WorkoutPhase = {
      id: `phase-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contentType: nextType,
      measuresCount: Math.max(1, Math.round(totalMeasures / (phases.length + 1)) || 2),
      subdivisionValue: nextSub,
      orchestration: nextOrch,
    };

    setPhases((prev) => [...prev, newPhase]);
    setSelectedPhaseId(newPhase.id);
    if (nextType === 'groove') {
      setBaseLibraryTab('grooves');
    } else {
      setBaseLibraryTab('rudiments');
    }
  };

  const handleRemovePhase = (phaseId: string) => {
    if (phases.length <= 1) return;
    setActivePresetId(null);
    setPhases((prev) => {
      const remaining = prev.filter((p) => p.id !== phaseId);
      if (selectedPhaseId === phaseId && remaining.length > 0) {
        setSelectedPhaseId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleApplyPreset = (preset: WorkoutPreset) => {
    setActivePresetId(preset.id);
    const newPhases = preset.phases.map((p, idx) => ({
      id: `phase-${idx + 1}-${Date.now()}`,
      contentType: p.contentType,
      measuresCount: p.measuresCount,
      subdivisionValue: p.subdivisionValue,
      orchestration: p.orchestration,
    }));
    setPhases(newPhases);
    if (newPhases.length > 0) {
      setSelectedPhaseId(newPhases[0].id);
      if (newPhases[0].contentType === 'groove') {
        setBaseLibraryTab('grooves');
      } else {
        setBaseLibraryTab('rudiments');
      }
    }
  };

  // Drum sound mapping for rudiment hits with orchestration
  const getHitsForRudimentStep = (
    stepDef: { sticking: string; accent?: boolean; ghost?: boolean; flam?: boolean; kitPiece?: DrumPieceId },
    orchestration: BlockOrchestration,
    bIdx: number,
    sIdx: number
  ): DrumHit[] => {
    const hits: DrumHit[] = [];

    if (stepDef.sticking === 'K') {
      hits.push({
        pieceId: 'kick',
        accent: stepDef.accent ?? true,
        sticking: 'K',
      });
      return hits;
    }

    if (orchestration === 'snare-only') {
      hits.push({
        pieceId: 'snare',
        accent: stepDef.accent,
        ghost: stepDef.ghost,
        flam: stepDef.flam,
        sticking: stepDef.sticking,
      });
      return hits;
    }

    if (orchestration === 'snare-kick-downbeat') {
      hits.push({
        pieceId: 'snare',
        accent: stepDef.accent,
        ghost: stepDef.ghost,
        flam: stepDef.flam,
        sticking: stepDef.sticking,
      });
      if (bIdx === 0 && sIdx === 0) {
        hits.push({ pieceId: 'kick', accent: true });
      }
      return hits;
    }

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
        sticking: stepDef.sticking,
      });
      return hits;
    }

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
        sticking: stepDef.sticking,
      });
      return hits;
    }

    hits.push({
      pieceId: 'snare',
      accent: stepDef.accent,
      ghost: stepDef.ghost,
      flam: stepDef.flam,
      sticking: stepDef.sticking,
    });
    return hits;
  };

  // Full score generator across all dynamic phases (supporting both Grooves & Rudiments)
  const handleGenerate = () => {
    const measures: DrumMeasure[] = [];
    let globalMeasureNum = 1;
    let rudimentCycleIndex = 0;

    // Build rudiment step sequence
    const rudimentSteps = activeRudiment.steps && activeRudiment.steps.length > 0
      ? activeRudiment.steps
      : (activeRudiment.sticking || ['R', 'L']).map((s, i) => ({
          sticking: s,
          accent: i === 0,
          ghost: false,
          flam: false,
        }));

    for (const phase of phases) {
      if (phase.contentType === 'groove') {
        // --- Inyectar Groove Polifónico Completo ---
        const grooveMeasuresTemplate = activeGroove.measures || [];
        const subValue =
          activeGroove.subdivision === '1/8'
            ? 2
            : activeGroove.subdivision === '1/32'
            ? 8
            : activeGroove.subdivision === '3:2'
            ? 3
            : activeGroove.subdivision === '6:4'
            ? 6
            : 4;
        const isTuplet = activeGroove.subdivision === '3:2' || activeGroove.subdivision === '6:4';
        const tupletRatio: [number, number] | undefined =
          activeGroove.subdivision === '3:2' ? [3, 2] : activeGroove.subdivision === '6:4' ? [6, 4] : undefined;

        for (let m = 0; m < phase.measuresCount; m++) {
          const templateMeasure =
            grooveMeasuresTemplate[m % Math.max(1, grooveMeasuresTemplate.length)] || { beats: [] };
          const beats: DrumBeat[] = [];
          const numBeats = Math.max(4, templateMeasure.beats?.length || 4);

          for (let bIdx = 0; bIdx < numBeats; bIdx++) {
            const beatTemplate = templateMeasure.beats?.[bIdx];
            const rawSubdivisions = beatTemplate?.subdivisions || [];
            const stepsCount = rawSubdivisions.length > 0 ? rawSubdivisions.length : subValue;
            const steps: DrumStep[] = [];

            for (let sIdx = 0; sIdx < stepsCount; sIdx++) {
              const rawHits = rawSubdivisions[sIdx] || [];
              const isRest = rawHits.length === 0;
              const hits: DrumHit[] = rawHits.map((h) => ({
                pieceId: (h.instrument === 'hihat' ? 'hihatClosed' : h.instrument) as DrumPieceId,
                accent: h.accent,
                ghost: h.ghost,
                flam: h.flam,
              }));

              steps.push({
                id: `m${globalMeasureNum}-b${bIdx}-s${sIdx}`,
                hits,
                isRest,
              });
            }

            beats.push({
              id: `m${globalMeasureNum}-b${bIdx}`,
              beatIndex: bIdx,
              subdivision: stepsCount,
              isTuplet,
              tupletRatio,
              steps,
            });
          }

          measures.push({
            id: `m${globalMeasureNum}`,
            timeSignature: [4, 4],
            beats,
          });

          globalMeasureNum++;
        }
      } else {
        // --- Inyectar Rudimento / Fill Orquestado ---
        const subOption =
          WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === phase.subdivisionValue) ||
          WORKOUT_SUBDIVISION_OPTIONS[1];
        const sub = subOption.value;

        for (let m = 0; m < phase.measuresCount; m++) {
          const beats: DrumBeat[] = [];

          for (let bIdx = 0; bIdx < 4; bIdx++) {
            const steps: DrumStep[] = [];

            for (let sIdx = 0; sIdx < sub; sIdx++) {
              const stepDef = rudimentSteps[rudimentCycleIndex % rudimentSteps.length];
              rudimentCycleIndex++;

              const hits = getHitsForRudimentStep(
                stepDef,
                progressiveOrchestration ? phase.orchestration : 'snare-only',
                bIdx,
                sIdx
              );

              steps.push({
                id: `m${globalMeasureNum}-b${bIdx}-s${sIdx}`,
                hits,
                isRest: false,
                sticking: stepDef.sticking,
                flam: stepDef.flam,
              });
            }

            beats.push({
              id: `m${globalMeasureNum}-b${bIdx}`,
              beatIndex: bIdx,
              subdivision: sub,
              isTuplet: subOption.isTuplet,
              tupletRatio: subOption.ratio,
              steps,
            });
          }

          measures.push({
            id: `m${globalMeasureNum}`,
            timeSignature: [4, 4],
            beats,
          });

          globalMeasureNum++;
        }
      }
    }

    const title = `Workout: ${activeGroove.name} + ${activeRudiment.name} (${totalMeasures} C)`;

    onGenerateWorkout({
      title,
      measures,
      bpm,
      measuresCount: totalMeasures,
    });
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] max-h-[820px] bg-[#0B0F19] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Fijo */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0B0F19]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex-shrink-0">
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
                Combina más de 85 Grooves y 46 Rudimentos con orquestación libre por fases.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer flex-shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Strip (Fijo) */}
        <div className="flex-shrink-0 bg-slate-950/90 border-b border-white/10 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono font-bold text-gray-400 flex items-center gap-1 shrink-0">
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            Plantillas de Práctica:
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

        {/* Body: Grid Estricto 2 Columnas Balanceado */}
        <div className="flex-1 overflow-hidden p-5 min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 h-full min-h-0">
            {/* ======================================================== */}
            {/* COLUMNA IZQUIERDA: Catálogo y Parámetros */}
            {/* ======================================================== */}
            <div className="w-full lg:w-[340px] flex flex-col h-full min-h-0 overflow-hidden pr-2 border-r border-white/10 space-y-3">
              {/* 1. Longitud Total Deseada (Libre) */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2 shadow-md shrink-0">
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
                <div className="grid grid-cols-4 gap-1">
                  {QUICK_MEASURE_OPTIONS.map((val) => {
                    const isSelected = totalMeasures === val;
                    return (
                      <button
                        key={`quick-bar-${val}`}
                        type="button"
                        onClick={() => handleSetTotalMeasuresTarget(val)}
                        className={`py-1 rounded-md border text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
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
                  <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => handleSetTotalMeasuresTarget(totalMeasures - 1)}
                      disabled={totalMeasures <= 1}
                      className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold text-xs cursor-pointer transition-all"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={64}
                      value={totalMeasures}
                      onChange={(e) => handleSetTotalMeasuresTarget(Number(e.target.value))}
                      className="w-10 bg-transparent text-center font-mono text-xs font-black text-cyan-300 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSetTotalMeasuresTarget(totalMeasures + 1)}
                      disabled={totalMeasures >= 64}
                      className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold text-xs cursor-pointer transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Célula / Patrón Base (Pestañas Selectoras Vault) */}
              <div className="flex-1 flex flex-col min-h-0 p-3 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2 shadow-md overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono shrink-0">
                  <label className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-purple-400" />
                    CÉLULA / PATRÓN BASE:
                  </label>
                </div>

                {/* Tabs: Rudimentos Vault vs Grooves Vault */}
                <div className="p-1 rounded-xl bg-slate-950 border border-white/10 flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBaseLibraryTab('rudiments');
                      setPatternSearch('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      baseLibraryTab === 'rudiments'
                        ? 'bg-purple-500/25 text-purple-300 border border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span>🥁</span>
                    <span>Rudimentos ({allRudiments.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBaseLibraryTab('grooves');
                      setPatternSearch('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      baseLibraryTab === 'grooves'
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span>⚡</span>
                    <span>Grooves ({allGrooves.length})</span>
                  </button>
                </div>

                {/* Buscador Compacto */}
                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={patternSearch}
                    onChange={(e) => setPatternSearch(e.target.value)}
                    placeholder={
                      baseLibraryTab === 'rudiments'
                        ? 'Buscar paradiddle, roll, flam...'
                        : 'Buscar rock, funk, shuffle...'
                    }
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all"
                  />
                </div>

                {/* Lista Scrolleable según pestaña activa con MiniScorePreview */}
                {baseLibraryTab === 'rudiments' ? (
                  <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-2 pr-1">
                    {filteredRudiments.map((rud) => (
                      <RudimentCardItem
                        key={`rud-${rud.id}`}
                        rudiment={rud}
                        isSelected={selectedRudimentId === rud.id}
                        isPlaying={previewingId === rud.id}
                        onSelect={handleSelectRudiment}
                        onPlayPreview={handlePreviewRudiment}
                      />
                    ))}
                    {filteredRudiments.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-500 font-mono">
                        No se encontraron rudimentos para &quot;{patternSearch}&quot;
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar space-y-2 pr-1">
                    {filteredGrooves.map((grv) => (
                      <GrooveCardItem
                        key={`grv-${grv.id}`}
                        groove={grv}
                        isSelected={selectedGrooveId === grv.id}
                        isPlaying={previewingId === grv.id}
                        onSelect={handleSelectGroove}
                        onPlayPreview={handlePreviewGroove}
                      />
                    ))}
                    {filteredGrooves.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-500 font-mono">
                        No se encontraron grooves para &quot;{patternSearch}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Tempo Objetivo (Slider Numérico Estilizado) */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5 shadow-md shrink-0">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    TEMPO:
                  </span>
                  <span className="text-amber-300 font-bold font-mono text-xs">
                    {bpm} BPM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={50}
                    max={220}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="flex-1 accent-amber-400 cursor-pointer h-1.5"
                  />
                  <input
                    type="number"
                    min={50}
                    max={220}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-12 bg-slate-950 border border-white/15 rounded-md px-1 py-0.5 text-center font-mono text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Switch de Orquestación Progresiva */}
                <div
                  onClick={() => setProgressiveOrchestration((prev) => !prev)}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    progressiveOrchestration
                      ? 'bg-amber-500/15 border-amber-400/60 text-white'
                      : 'bg-slate-950/60 border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <div className="text-[10px] font-mono leading-tight">
                    <span className="font-bold block text-white">
                      🥁 Orquestación Progresiva
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {progressiveOrchestration
                        ? 'Distribuye acentos en toms'
                        : 'Solo caja (pad de práctica)'}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-3.5 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
                      progressiveOrchestration ? 'bg-amber-400 justify-end' : 'bg-white/20 justify-start'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-black shadow-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* PANEL DERECHO: Timeline Modular & Fases */}
            {/* ======================================================== */}
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto pl-1 space-y-4 custom-scrollbar">
              {/* 1. Línea de Tiempo Visual Horizontal Interactiva */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5 shadow-xl shrink-0">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-gray-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Línea de Tiempo Modular ({totalMeasures} Compases en Total):
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                    <span className="text-amber-400">⚡ {activeGroove.name}</span>
                    <span>+</span>
                    <span className="text-purple-400">🥁 {activeRudiment.name}</span>
                  </div>
                </div>

                {/* Barra Segmentada Proporcional */}
                <div className="w-full h-12 rounded-xl bg-slate-950/80 border border-white/10 p-1 flex items-center gap-1 shadow-inner overflow-hidden">
                  {phases.map((phase, idx) => {
                    const range = phaseRanges[idx];
                    const isGroove = phase.contentType === 'groove';
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
                        onClick={() => handleSelectPhase(phase)}
                        style={{ width: `${widthPct}%` }}
                        className={`h-full rounded-lg border px-2 flex items-center justify-between transition-all select-none relative group overflow-hidden cursor-pointer ${
                          selectedPhaseId === phase.id ? 'ring-2 ring-white scale-[1.02] z-10 shadow-lg' : ''
                        } ${
                          isGroove
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : `${subInfo.borderColor} ${subInfo.badgeColor}`
                        }`}
                        title={`Fase ${idx + 1}: C${range.startBar} - C${range.endBar} (${phase.measuresCount} C) • ${
                          isGroove ? `Groove: ${activeGroove.name}` : `Rudimento: ${subInfo.label} (${orchInfo?.label})`
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-1.5 truncate">
                          <span className="w-4 h-4 rounded-full bg-white/20 text-white font-mono text-[9px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-black text-xs text-white shrink-0">
                            {isGroove ? 'GROOVE' : subInfo.label}
                          </span>
                          <span className="text-[10px] text-gray-200 font-mono hidden sm:inline truncate">
                            C{range.startBar}–C{range.endBar}
                          </span>
                        </div>

                        <span className="text-xs shrink-0">
                          {isGroove ? '⚡' : orchInfo?.icon}
                        </span>
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
                    Fases de Aceleración y Asignación de Contenido:
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Define si cada fase ejecuta el Groove base o el Rudimento
                  </span>
                </div>

                <div className="space-y-2.5">
                  {phases.map((phase, idx) => {
                    const range = phaseRanges[idx];
                    const isGroove = phase.contentType === 'groove';
                    const subInfo =
                      WORKOUT_SUBDIVISION_OPTIONS.find((s) => s.value === phase.subdivisionValue) ||
                      WORKOUT_SUBDIVISION_OPTIONS[1];

                    const isPhaseSelected = selectedPhaseId === phase.id;

                    return (
                      <div
                        key={phase.id}
                        onClick={() => handleSelectPhase(phase)}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all space-y-3 shadow-md cursor-pointer ${
                          isPhaseSelected
                            ? isGroove
                              ? 'border-amber-400 bg-amber-950/25 ring-2 ring-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                              : `${subInfo.borderColor} bg-slate-900 ring-2 ring-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.25)]`
                            : isGroove
                            ? 'border-amber-400/40 bg-amber-950/15 hover:border-amber-400/70'
                            : `${subInfo.borderColor} bg-slate-900/80 hover:border-white/30`
                        }`}
                      >
                        {/* Cabecera de la Fase: Badge, Range, Content Toggle, Stepper, Delete */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-lg border flex items-center justify-center font-mono font-black text-xs text-white ${
                                isGroove ? 'bg-amber-500/25 border-amber-400' : `${subInfo.badgeColor}`
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-white font-mono">
                                Fase {idx + 1}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/10">
                                C{range.startBar} al C{range.endBar} ({phase.measuresCount} C)
                              </span>
                              {isPhaseSelected && (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 font-bold uppercase tracking-wider animate-pulse">
                                  Fase Activa
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Toggle: Groove Base vs Rudimento / Fill */}
                          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-xl border border-white/10">
                            <button
                              type="button"
                              onClick={() => handleUpdatePhaseContentType(phase.id, 'groove')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                isGroove
                                  ? 'bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <span>⚡</span>
                              <span>Groove Base</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdatePhaseContentType(phase.id, 'rudiment')}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                !isGroove
                                  ? 'bg-purple-500/25 text-purple-300 border border-purple-400/60 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              <span>🥁</span>
                              <span>Rudimento / Fill</span>
                            </button>
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

                        {/* Configuración Dinámica según Contenido */}
                        {isGroove ? (
                          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2 text-gray-300 truncate">
                              <span className="text-amber-400 font-bold">Groove Activo:</span>
                              <span className="text-white font-bold truncate">{activeGroove.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                                {activeGroove.category}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 hidden sm:inline">
                              Polifonía completa (Charles, Caja y Bombo)
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2.5 pt-1 border-t border-white/5">
                            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2 text-gray-300 truncate">
                                <span className="text-purple-400 font-bold">Célula Técnica:</span>
                                <span className="text-white font-bold truncate">{activeRudiment.name}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                                  {activeRudiment.category}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 hidden sm:inline font-mono">
                                {activeRudiment.sticking ? activeRudiment.sticking.slice(0, 16).join(' ') : ''}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                                Orquestación en Kit:
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
                                          ? 'bg-purple-500/25 text-purple-300 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
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
                      )}
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
                    <span>+ Añadir Fase (Groove o Rudimento)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-white/10 bg-[#0B0F19] gap-3">
          <div className="text-xs font-mono text-gray-300 truncate text-left">
            Generando rutina de <span className="text-white font-bold">{totalMeasures} compases</span> ({phases.length} fases) • Groove:{' '}
            <span className="text-amber-300 font-bold">{activeGroove.name}</span> + Rudimento:{' '}
            <span className="text-purple-300 font-bold">{activeRudiment.name}</span> a{' '}
            <span className="text-cyan-400 font-bold">{bpm} BPM</span>.
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5 transition-colors cursor-pointer text-xs font-mono text-center"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs font-mono tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>⚡ GENERAR Y CARGAR RUTINA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
