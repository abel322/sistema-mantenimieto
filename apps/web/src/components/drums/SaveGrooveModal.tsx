'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Bookmark,
  Cloud,
  Play,
  Square,
  Sparkles,
  Sliders,
  RotateCcw,
  Volume2,
  Camera,
  Grid3X3,
  Wand2,
} from 'lucide-react';
import {
  GrooveCategory,
  GroovePattern,
  GrooveHit,
  DrumPieceId,
  DrumMeasure,
} from '@/types/drum';
import { convertDrumMeasureToGrooveMeasures } from '@/lib/groovesData';
import MiniScorePreview from './MiniScorePreview';

export type HiHatStepState = 'off' | 'closed' | 'open' | 'accent';
export type SnareStepState = 'off' | 'normal' | 'ghost' | 'accent';
export type KickStepState = 'off' | 'normal' | 'accent';

export interface SaveGrooveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (savedGroove: GroovePattern) => void;
  onPlayHit: (pieceId: DrumPieceId, accent?: boolean, ghost?: boolean) => void;
  currentMeasures?: DrumMeasure[];
  totalMeasures?: number;
  selectedMeasureIndex?: number;
  currentBpm?: number;
  currentTimeSignature?: [number, number];
  currentSwing?: number;
}

// 16 steps labels for 4/4 in 16th notes
const STEP_LABELS = [
  '1', 'e', '&', 'a',
  '2', 'e', '&', 'a',
  '3', 'e', '&', 'a',
  '4', 'e', '&', 'a',
];

// Helper to build 4/4 GroovePattern measures from matrix state
function buildGrooveMeasuresFromMatrix(
  hihats: HiHatStepState[],
  snares: SnareStepState[],
  kicks: KickStepState[]
) {
  const beats: { subdivisions: GrooveHit[][] }[] = [];

  for (let bIdx = 0; bIdx < 4; bIdx++) {
    const subdivisions: GrooveHit[][] = [];
    for (let sIdx = 0; sIdx < 4; sIdx++) {
      const stepIdx = bIdx * 4 + sIdx;
      const stepHits: GrooveHit[] = [];

      // Hi-Hat
      const hState = hihats[stepIdx];
      if (hState === 'closed') {
        stepHits.push({ instrument: 'hihat' });
      } else if (hState === 'open') {
        stepHits.push({ instrument: 'hihatOpen' });
      } else if (hState === 'accent') {
        stepHits.push({ instrument: 'hihat', accent: true });
      }

      // Snare
      const sState = snares[stepIdx];
      if (sState === 'normal') {
        stepHits.push({ instrument: 'snare' });
      } else if (sState === 'ghost') {
        stepHits.push({ instrument: 'snare', ghost: true });
      } else if (sState === 'accent') {
        stepHits.push({ instrument: 'snare', accent: true });
      }

      // Kick
      const kState = kicks[stepIdx];
      if (kState === 'normal') {
        stepHits.push({ instrument: 'kick' });
      } else if (kState === 'accent') {
        stepHits.push({ instrument: 'kick', accent: true });
      }

      subdivisions.push(stepHits);
    }
    beats.push({ subdivisions });
  }

  return [{ beats }];
}

export default function SaveGrooveModal({
  isOpen,
  onClose,
  onSaveSuccess,
  onPlayHit,
  currentMeasures,
  totalMeasures = 1,
  selectedMeasureIndex = 0,
  currentBpm = 120,
  currentTimeSignature = [4, 4],
  currentSwing = 0,
}: SaveGrooveModalProps) {
  // Input Mode: 'capture' (from current sequence) or 'matrix' (interactive sequencer)
  const [originMode, setOriginMode] = useState<'capture' | 'matrix'>('capture');

  // Basic Form State
  const [saveName, setSaveName] = useState('');
  const [saveGenre, setSaveGenre] = useState<GrooveCategory>('Mis Grooves');
  const [saveDifficulty, setSaveDifficulty] = useState<string>('Intermedio');
  const [saveSourceMeasureIndex, setSaveSourceMeasureIndex] = useState<number>(selectedMeasureIndex);
  const [saveDescription, setSaveDescription] = useState('');
  const [saveBpm, setSaveBpm] = useState<number>(currentBpm);
  const [isSaving, setIsSaving] = useState(false);

  // Audio Preview State
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentPlaybackStep, setCurrentPlaybackStep] = useState<number | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewStepIndexRef = useRef<number>(0);

  // Step Sequencer Matrix State (16 steps for 4/4)
  // Default to Rock Básico
  const [hihatSteps, setHihatSteps] = useState<HiHatStepState[]>([
    'closed', 'off', 'closed', 'off',
    'closed', 'off', 'closed', 'off',
    'closed', 'off', 'closed', 'off',
    'closed', 'off', 'closed', 'off',
  ]);
  const [snareSteps, setSnareSteps] = useState<SnareStepState[]>([
    'off', 'off', 'off', 'off',
    'normal', 'off', 'off', 'off',
    'off', 'off', 'off', 'off',
    'normal', 'off', 'off', 'off',
  ]);
  const [kickSteps, setKickSteps] = useState<KickStepState[]>([
    'normal', 'off', 'off', 'off',
    'off', 'off', 'off', 'off',
    'normal', 'off', 'normal', 'off',
    'off', 'off', 'off', 'off',
  ]);

  // Sync props on open
  useEffect(() => {
    if (isOpen) {
      setSaveSourceMeasureIndex(Math.max(0, Math.min(totalMeasures - 1, selectedMeasureIndex)));
      setSaveBpm(currentBpm);
    }
  }, [isOpen, selectedMeasureIndex, totalMeasures, currentBpm]);

  // Stop playback on modal close or unmount
  const stopPreviewAudio = useCallback(() => {
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setIsPlayingPreview(false);
    setCurrentPlaybackStep(null);
    previewStepIndexRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopPreviewAudio();
    }
    return () => {
      stopPreviewAudio();
    };
  }, [isOpen, stopPreviewAudio]);

  // Presets Handlers
  const handleApplyPreset = (preset: 'clear' | 'rock' | 'fourOnFloor' | 'funk') => {
    stopPreviewAudio();
    if (preset === 'clear') {
      setHihatSteps(new Array(16).fill('off'));
      setSnareSteps(new Array(16).fill('off'));
      setKickSteps(new Array(16).fill('off'));
    } else if (preset === 'rock') {
      setHihatSteps([
        'closed', 'off', 'closed', 'off',
        'closed', 'off', 'closed', 'off',
        'closed', 'off', 'closed', 'off',
        'closed', 'off', 'closed', 'off',
      ]);
      setSnareSteps([
        'off', 'off', 'off', 'off',
        'normal', 'off', 'off', 'off',
        'off', 'off', 'off', 'off',
        'normal', 'off', 'off', 'off',
      ]);
      setKickSteps([
        'normal', 'off', 'off', 'off',
        'off', 'off', 'off', 'off',
        'normal', 'off', 'normal', 'off',
        'off', 'off', 'off', 'off',
      ]);
    } else if (preset === 'fourOnFloor') {
      setHihatSteps([
        'closed', 'off', 'open', 'off',
        'closed', 'off', 'open', 'off',
        'closed', 'off', 'open', 'off',
        'closed', 'off', 'open', 'off',
      ]);
      setSnareSteps([
        'off', 'off', 'off', 'off',
        'accent', 'off', 'off', 'off',
        'off', 'off', 'off', 'off',
        'accent', 'off', 'off', 'off',
      ]);
      setKickSteps([
        'normal', 'off', 'off', 'off',
        'normal', 'off', 'off', 'off',
        'normal', 'off', 'off', 'off',
        'normal', 'off', 'off', 'off',
      ]);
    } else if (preset === 'funk') {
      setHihatSteps([
        'accent', 'closed', 'closed', 'closed',
        'accent', 'closed', 'closed', 'closed',
        'accent', 'closed', 'closed', 'closed',
        'accent', 'closed', 'closed', 'closed',
      ]);
      setSnareSteps([
        'off', 'off', 'off', 'off',
        'normal', 'off', 'off', 'ghost',
        'off', 'ghost', 'off', 'off',
        'normal', 'off', 'off', 'ghost',
      ]);
      setKickSteps([
        'normal', 'off', 'off', 'off',
        'off', 'off', 'normal', 'off',
        'off', 'off', 'normal', 'off',
        'off', 'off', 'off', 'off',
      ]);
    }
  };

  // Step Toggling Logic
  const handleToggleHihat = (index: number) => {
    setHihatSteps((prev) => {
      const next = [...prev];
      const cur = next[index];
      const nextVal: HiHatStepState =
        cur === 'off'
          ? 'closed'
          : cur === 'closed'
          ? 'open'
          : cur === 'open'
          ? 'accent'
          : 'off';
      next[index] = nextVal;

      // Audio feedback
      if (nextVal === 'closed') onPlayHit('hihatClosed', false, false);
      else if (nextVal === 'open') onPlayHit('hihatOpen', false, false);
      else if (nextVal === 'accent') onPlayHit('hihatClosed', true, false);

      return next;
    });
  };

  const handleToggleSnare = (index: number) => {
    setSnareSteps((prev) => {
      const next = [...prev];
      const cur = next[index];
      const nextVal: SnareStepState =
        cur === 'off'
          ? 'normal'
          : cur === 'normal'
          ? 'ghost'
          : cur === 'ghost'
          ? 'accent'
          : 'off';
      next[index] = nextVal;

      // Audio feedback
      if (nextVal === 'normal') onPlayHit('snare', false, false);
      else if (nextVal === 'ghost') onPlayHit('snare', false, true);
      else if (nextVal === 'accent') onPlayHit('snare', true, false);

      return next;
    });
  };

  const handleToggleKick = (index: number) => {
    setKickSteps((prev) => {
      const next = [...prev];
      const cur = next[index];
      const nextVal: KickStepState =
        cur === 'off' ? 'normal' : cur === 'normal' ? 'accent' : 'off';
      next[index] = nextVal;

      // Audio feedback
      if (nextVal === 'normal') onPlayHit('kick', false, false);
      else if (nextVal === 'accent') onPlayHit('kick', true, false);

      return next;
    });
  };

  // Capture mode: live source measure from outer sequencer
  const liveSourceMeasure: DrumMeasure | undefined =
    currentMeasures && currentMeasures[saveSourceMeasureIndex]
      ? currentMeasures[saveSourceMeasureIndex]
      : currentMeasures?.[0];

  // Build active GroovePattern object for live preview and database payload
  const activePreviewGroove: GroovePattern | null = useMemo(() => {
    if (originMode === 'matrix') {
      const measures = buildGrooveMeasuresFromMatrix(hihatSteps, snareSteps, kickSteps);
      return {
        id: 'save-modal-matrix-preview',
        name: saveName.trim() || 'Nuevo Groove en Matriz',
        category: saveGenre,
        subCategory: 'Diseñado en Matriz',
        difficulty: saveDifficulty as any,
        suggestedBpm: saveBpm,
        timeSignature: '4/4',
        swingRatio: currentSwing,
        measuresCount: 1,
        subdivision: '1/16',
        description: saveDescription.trim() || 'Groove diseñado con el secuenciador interactivo de Sonora.',
        isCustom: true,
        measures,
      };
    } else {
      if (!liveSourceMeasure) return null;
      const { measures, subdivision } = convertDrumMeasureToGrooveMeasures(liveSourceMeasure);
      return {
        id: 'save-modal-capture-preview',
        name: saveName.trim() || 'Nuevo Groove Capturado',
        category: saveGenre,
        subCategory: 'Capturado de Partitura',
        difficulty: saveDifficulty as any,
        suggestedBpm: saveBpm,
        timeSignature: `${currentTimeSignature[0]}/${currentTimeSignature[1]}` as any,
        swingRatio: currentSwing,
        measuresCount: 1,
        subdivision: subdivision as any,
        description: saveDescription.trim() || 'Groove capturado directamente desde la partitura.',
        isCustom: true,
        measures,
      };
    }
  }, [
    originMode,
    hihatSteps,
    snareSteps,
    kickSteps,
    liveSourceMeasure,
    saveName,
    saveGenre,
    saveDifficulty,
    saveBpm,
    currentSwing,
    currentTimeSignature,
    saveDescription,
  ]);

  // Audio Preview Loop handler
  const handleTogglePreviewAudio = () => {
    if (isPlayingPreview) {
      stopPreviewAudio();
      return;
    }

    if (!activePreviewGroove) return;

    setIsPlayingPreview(true);
    previewStepIndexRef.current = 0;
    setCurrentPlaybackStep(0);

    // 16th note step duration in ms: (60000 / BPM) / 4
    const stepDurationMs = Math.max(50, (60000 / (saveBpm || 120)) / 4);

    const playCurrentStep = () => {
      const step = previewStepIndexRef.current;
      setCurrentPlaybackStep(step);

      if (originMode === 'matrix') {
        const h = hihatSteps[step];
        const s = snareSteps[step];
        const k = kickSteps[step];

        if (h === 'closed') onPlayHit('hihatClosed', false, false);
        else if (h === 'open') onPlayHit('hihatOpen', false, false);
        else if (h === 'accent') onPlayHit('hihatClosed', true, false);

        if (s === 'normal') onPlayHit('snare', false, false);
        else if (s === 'ghost') onPlayHit('snare', false, true);
        else if (s === 'accent') onPlayHit('snare', true, false);

        if (k === 'normal') onPlayHit('kick', false, false);
        else if (k === 'accent') onPlayHit('kick', true, false);
      } else {
        // Capture mode playback
        const measureTemplate = activePreviewGroove.measures[0];
        if (measureTemplate) {
          const bIdx = Math.floor(step / 4);
          const sIdx = step % 4;
          const hits = measureTemplate.beats[bIdx]?.subdivisions?.[sIdx] || [];
          hits.forEach((hit) => {
            const pieceId = (hit.instrument === 'hihat' ? 'hihatClosed' : hit.instrument) as DrumPieceId;
            onPlayHit(pieceId, hit.accent, hit.ghost);
          });
        }
      }

      previewStepIndexRef.current = (step + 1) % 16;
    };

    // Play initial step immediately
    playCurrentStep();

    previewTimerRef.current = setInterval(() => {
      playCurrentStep();
    }, stepDurationMs);
  };

  // Submit and Save to Cloud / Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim() || !activePreviewGroove) return;

    setIsSaving(true);
    stopPreviewAudio();

    const timeSigStr = originMode === 'matrix' ? '4/4' : `${currentTimeSignature[0]}/${currentTimeSignature[1]}`;
    const payload = {
      name: saveName.trim(),
      genre: saveGenre,
      subCategory: originMode === 'matrix' ? 'Diseñado en Mini Matriz' : 'Capturado de Partitura',
      difficulty: saveDifficulty,
      suggestedBpm: saveBpm,
      timeSignature: timeSigStr,
      swingRatio: currentSwing,
      measuresCount: 1,
      subdivision: activePreviewGroove.subdivision || '1/16',
      description: saveDescription.trim() || (originMode === 'matrix' ? 'Groove diseñado con el secuenciador interactivo.' : 'Groove capturado en Sonora Drum Lab.'),
      measures: activePreviewGroove.measures,
    };

    const tempId = `custom-${Date.now()}`;
    let savedItem: GroovePattern = {
      id: tempId,
      ...payload,
      category: saveGenre,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/grooves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.groove) {
          savedItem = data.groove;
        }
      }
    } catch (err) {
      console.warn('Database save failed, keeping in localStorage backup.', err);
    }

    onSaveSuccess(savedItem);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden bg-[#0B0F19] border-t sm:border border-white/10 shadow-2xl">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#0B0F19]/95 backdrop-blur-md border-b border-white/10 p-3 sm:p-4 flex justify-between items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex-shrink-0">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight truncate">
                  Guardar Groove en Vault
                </h3>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold flex-shrink-0">
                  Personalizado
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-mono truncate hidden sm:block">
                Captura de partitura o diseña en la mini matriz secuenciadora interactiva
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form wrapping body + sticky footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {/* 1. Selector de Modo de Entrada (Tabs) */}
            <div className="p-1 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  stopPreviewAudio();
                  setOriginMode('capture');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  originMode === 'capture'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📷 Capturar de Partitura</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopPreviewAudio();
                  setOriginMode('matrix');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  originMode === 'matrix'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(192,132,252,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>🎛️ Diseñar en Mini Matriz</span>
              </button>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ======================================================== */}
              {/* COLUMNA 1: Configuración & Entrada de Ritmo */}
              {/* ======================================================== */}
              <div className="space-y-3.5">
                {/* Name Input */}
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                    Nombre del Groove *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej: Funk Sincopado en C1, Ghost Pocket, 4-on-Floor..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>

                {/* Genre & Difficulty Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Category / Genre */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                      Género / Categoría
                    </label>
                    <select
                      value={saveGenre}
                      onChange={(e) => setSaveGenre(e.target.value as GrooveCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                    >
                      <option value="Mis Grooves">Mis Grooves (Personal)</option>
                      <option value="Rock & Metal">Rock & Metal</option>
                      <option value="Funk & Gospel">Funk & Gospel</option>
                      <option value="Hip-Hop & Electronic">Hip-Hop & Electronic</option>
                      <option value="Latin & World">Latin & World</option>
                      <option value="Jazz & Blues">Jazz & Blues</option>
                      <option value="Prog & Odd-Meter">Prog & Odd-Meter</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                      Dificultad
                    </label>
                    <select
                      value={saveDifficulty}
                      onChange={(e) => setSaveDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                    >
                      <option value="Principiante">Principiante</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                      <option value="Virtuoso">Virtuoso</option>
                    </select>
                  </div>
                </div>

                {/* Input Mode Dynamic Section */}
                {originMode === 'capture' ? (
                  /* Modo Captura: Selección de compás exterior */
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                    <label className="block text-xs font-mono font-bold text-gray-300">
                      Compás de Origen a Capturar:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Array.from({ length: totalMeasures }, (_, i) => {
                        const isSelected = saveSourceMeasureIndex === i;
                        return (
                          <button
                            key={`save-src-m-${i}`}
                            type="button"
                            onClick={() => setSaveSourceMeasureIndex(i)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            Compás C{i + 1}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 pt-1">
                      Lee exactamente las notas, acentos y polifonía programados en el compás seleccionado.
                    </p>
                  </div>
                ) : (
                  /* Modo Mini Matriz Secuenciadora Interactiva */
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5">
                    {/* Presets Rápidos */}
                    <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] font-mono">
                      <span className="text-gray-400 font-bold flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-purple-400" />
                        Presets:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('rock')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                        >
                          Rock Básico
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('fourOnFloor')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-emerald-300 border border-white/10 transition-colors cursor-pointer"
                        >
                          4-on-Floor
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('funk')}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-amber-300 border border-white/10 transition-colors cursor-pointer"
                        >
                          Funk Pocket
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('clear')}
                          className="px-1.5 py-0.5 rounded bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                          title="Limpiar matriz"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    {/* Matrix Grid: 16 Steps across 3 Instruments */}
                    <div className="space-y-1.5 pt-1">
                      {/* Cabecera de Tiempos (1 e & a 2 e & a 3 e & a 4 e & a) */}
                      <div className="flex items-center gap-1">
                        <div className="w-7 text-[10px] font-mono text-gray-500 font-bold text-center">
                          P
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          {[0, 1, 2, 3].map((bIdx) => (
                            <div key={`beat-header-${bIdx}`} className="grid grid-cols-4 gap-0.5">
                              {[0, 1, 2, 3].map((sIdx) => {
                                const stepNum = bIdx * 4 + sIdx;
                                const isDownbeat = sIdx === 0;
                                const isCurrent = currentPlaybackStep === stepNum;
                                return (
                                  <div
                                    key={`step-lbl-${stepNum}`}
                                    className={`h-4.5 rounded text-[9px] font-mono flex items-center justify-center font-bold transition-all ${
                                      isCurrent
                                        ? 'bg-amber-400 text-black shadow-[0_0_8px_#f59e0b]'
                                        : isDownbeat
                                        ? 'bg-white/15 text-cyan-300 border border-white/20'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {STEP_LABELS[stepNum]}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fila 1: Hi-Hat / Cymbals (H) */}
                      <div className="flex items-center gap-1">
                        <div className="w-7 text-[10px] font-mono font-bold text-sky-400 text-center py-1 rounded bg-sky-950/40 border border-sky-500/30">
                          H
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          {[0, 1, 2, 3].map((bIdx) => (
                            <div key={`hh-beat-${bIdx}`} className="grid grid-cols-4 gap-0.5">
                              {[0, 1, 2, 3].map((sIdx) => {
                                const stepNum = bIdx * 4 + sIdx;
                                const state = hihatSteps[stepNum];
                                const isCurrent = currentPlaybackStep === stepNum;

                                return (
                                  <button
                                    key={`hh-${stepNum}`}
                                    type="button"
                                    onClick={() => handleToggleHihat(stepNum)}
                                    className={`h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer border ${
                                      isCurrent
                                        ? 'ring-1 ring-amber-400 shadow-[0_0_6px_#f59e0b]'
                                        : ''
                                    } ${
                                      state === 'closed'
                                        ? 'bg-sky-500/30 border-sky-400 text-sky-200'
                                        : state === 'open'
                                        ? 'bg-sky-400 border-white text-black shadow-[0_0_8px_rgba(56,189,248,0.6)] font-black'
                                        : state === 'accent'
                                        ? 'bg-gradient-to-tr from-sky-500 to-cyan-300 border-white text-black font-black'
                                        : 'bg-slate-900 border-white/10 hover:border-white/30 text-gray-700'
                                    }`}
                                    title={`Paso ${stepNum + 1}: ${state}`}
                                  >
                                    {state === 'closed'
                                      ? 'x'
                                      : state === 'open'
                                      ? 'O'
                                      : state === 'accent'
                                      ? '>x'
                                      : '·'}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fila 2: Snare / Caja (S) */}
                      <div className="flex items-center gap-1">
                        <div className="w-7 text-[10px] font-mono font-bold text-purple-400 text-center py-1 rounded bg-purple-950/40 border border-purple-500/30">
                          S
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          {[0, 1, 2, 3].map((bIdx) => (
                            <div key={`snare-beat-${bIdx}`} className="grid grid-cols-4 gap-0.5">
                              {[0, 1, 2, 3].map((sIdx) => {
                                const stepNum = bIdx * 4 + sIdx;
                                const state = snareSteps[stepNum];
                                const isCurrent = currentPlaybackStep === stepNum;

                                return (
                                  <button
                                    key={`snare-${stepNum}`}
                                    type="button"
                                    onClick={() => handleToggleSnare(stepNum)}
                                    className={`h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer border ${
                                      isCurrent
                                        ? 'ring-1 ring-amber-400 shadow-[0_0_6px_#f59e0b]'
                                        : ''
                                    } ${
                                      state === 'normal'
                                        ? 'bg-purple-500/35 border-purple-400 text-purple-200'
                                        : state === 'ghost'
                                        ? 'bg-purple-950/50 border-purple-500/40 text-purple-400 text-[9px]'
                                        : state === 'accent'
                                        ? 'bg-purple-500 border-white text-white font-black shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                                        : 'bg-slate-900 border-white/10 hover:border-white/30 text-gray-700'
                                    }`}
                                    title={`Paso ${stepNum + 1}: ${state}`}
                                  >
                                    {state === 'normal'
                                      ? 'S'
                                      : state === 'ghost'
                                      ? '(•)'
                                      : state === 'accent'
                                      ? '>S'
                                      : '·'}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Fila 3: Kick / Bombo (K) */}
                      <div className="flex items-center gap-1">
                        <div className="w-7 text-[10px] font-mono font-bold text-emerald-400 text-center py-1 rounded bg-emerald-950/40 border border-emerald-500/30">
                          K
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-1">
                          {[0, 1, 2, 3].map((bIdx) => (
                            <div key={`kick-beat-${bIdx}`} className="grid grid-cols-4 gap-0.5">
                              {[0, 1, 2, 3].map((sIdx) => {
                                const stepNum = bIdx * 4 + sIdx;
                                const state = kickSteps[stepNum];
                                const isCurrent = currentPlaybackStep === stepNum;

                                return (
                                  <button
                                    key={`kick-${stepNum}`}
                                    type="button"
                                    onClick={() => handleToggleKick(stepNum)}
                                    className={`h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer border ${
                                      isCurrent
                                        ? 'ring-1 ring-amber-400 shadow-[0_0_6px_#f59e0b]'
                                        : ''
                                    } ${
                                      state === 'normal'
                                        ? 'bg-emerald-500/35 border-emerald-400 text-emerald-200'
                                        : state === 'accent'
                                        ? 'bg-emerald-500 border-white text-black font-black shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                                        : 'bg-slate-900 border-white/10 hover:border-white/30 text-gray-700'
                                    }`}
                                    title={`Paso ${stepNum + 1}: ${state}`}
                                  >
                                    {state === 'normal'
                                      ? 'K'
                                      : state === 'accent'
                                      ? '>K'
                                      : '·'}
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Guía de clicks */}
                    <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span>Clic para ciclar: normal → ghost (•) → acento &gt;</span>
                      <span className="text-cyan-400">16 pasos (4/4)</span>
                    </div>
                  </div>
                )}

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 mb-1">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notas sobre el groove, instrumentación o tempo sugerido..."
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    className="w-full px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all resize-none"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* COLUMNA 2: Resumen, BPM & Previsualización en Tiempo Real */}
              {/* ======================================================== */}
              <div className="space-y-3.5 flex flex-col justify-between">
                {/* Resumen Técnico & Tempo Ajustable */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="font-bold text-cyan-400">Origen de Secuencia:</span>
                    <span className="text-gray-400">
                      {originMode === 'matrix' ? 'Mini Matriz (16 pasos)' : `Compás C${saveSourceMeasureIndex + 1}`}
                    </span>
                  </div>

                  {/* BPM Adjuster for Preview and Save */}
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tempo de Referencia:</span>
                      <span className="text-amber-300 font-bold">{saveBpm} BPM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={50}
                        max={220}
                        value={saveBpm}
                        onChange={(e) => setSaveBpm(Number(e.target.value))}
                        className="flex-1 accent-amber-400 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={50}
                        max={220}
                        value={saveBpm}
                        onChange={(e) => setSaveBpm(Number(e.target.value))}
                        className="w-14 bg-slate-900 border border-white/15 rounded-lg px-1.5 py-0.5 text-center font-mono text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                    <span>
                      Métrica:{' '}
                      <strong className="text-white">
                        {originMode === 'matrix' ? '4/4' : `${currentTimeSignature[0]}/${currentTimeSignature[1]}`}
                      </strong>
                    </span>
                    {currentSwing > 0 && (
                      <span>
                        Swing: <strong className="text-purple-300">{Math.round(currentSwing * 100)}%</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Previsualización en Partitura con Botón Escuchar Previa */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-gray-300">Previsualización en Partitura:</span>
                    
                    {/* Botón Escuchar Previa */}
                    <button
                      type="button"
                      onClick={handleTogglePreviewAudio}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isPlayingPreview
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-cyan-300 hover:border-cyan-400'
                      }`}
                    >
                      {isPlayingPreview ? (
                        <>
                          <Square className="w-3 h-3 fill-current text-amber-400" />
                          <span>Detener</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-cyan-400" />
                          <span>▶ Escuchar Previa</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Lienzo Mini Score Preview */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center min-h-[90px] relative overflow-hidden">
                    {activePreviewGroove ? (
                      <MiniScorePreview groove={activePreviewGroove} width={340} height={70} />
                    ) : (
                      <div className="h-[70px] rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-center text-xs text-gray-500 font-mono">
                        Sin compás seleccionado
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-mono text-gray-500 text-center">
                    Renderizado reactivo con voces polifónicas, acentos y notas fantasma
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-10 bg-[#0B0F19]/95 backdrop-blur-md border-t border-white/10 p-3 sm:p-4 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                stopPreviewAudio();
                onClose();
              }}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5 transition-colors cursor-pointer text-xs font-mono text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || !saveName.trim()}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold shadow-lg hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 fill-current" />
                  <span>Confirmar y Guardar en la Nube</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
