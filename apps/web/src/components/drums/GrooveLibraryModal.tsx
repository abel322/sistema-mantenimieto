'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Search,
  Sparkles,
  Play,
  Square,
  Sliders,
  Check,
  Disc3,
  Layers,
  ChevronLeft,
  ChevronRight,
  Flame,
  Gauge,
  Music,
} from 'lucide-react';
import { GrooveCategory, GroovePattern, DrumPieceId } from '@/types/drum';
import { GROOVES_DATA, GROOVE_CATEGORIES } from '@/lib/groovesData';
import MiniScorePreview from './MiniScorePreview';

interface GrooveLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  measuresCount: number;
  selectedMeasureIndex: number;
  onApplyGroove: (
    groove: GroovePattern,
    targetMeasures: number[],
    options: { setBpm?: boolean; setSwing?: boolean; setTimeSig?: boolean }
  ) => void;
  onPlayHit: (pieceId: DrumPieceId, accent?: boolean, ghost?: boolean) => void;
}

const ITEMS_PER_PAGE = 12;

export default function GrooveLibraryModal({
  isOpen,
  onClose,
  measuresCount = 1,
  selectedMeasureIndex = 0,
  onApplyGroove,
  onPlayHit,
}: GrooveLibraryModalProps) {
  const totalMeasures = Math.max(1, measuresCount);

  const [selectedCategory, setSelectedCategory] = useState<GrooveCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [onlySyncopated, setOnlySyncopated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [insertedNotice, setInsertedNotice] = useState<string | null>(null);

  // Live count of syncopated groove patterns
  const syncopatedCount = useMemo(() => {
    return GROOVES_DATA.filter(
      (g) =>
        g.isSyncopated ||
        g.tags?.includes('Sincopado') ||
        g.description.toLowerCase().includes('síncopa') ||
        g.description.toLowerCase().includes('sincopad')
    ).length;
  }, []);

  // Target measure multi-selection (e.g. [0] or [0, 1, 2, 3])
  const [selectedMeasures, setSelectedMeasures] = useState<number[]>([selectedMeasureIndex]);

  // Sync options
  const [syncBpm, setSyncBpm] = useState(true);
  const [syncSwing, setSyncSwing] = useState(true);
  const [syncTimeSig, setSyncTimeSig] = useState(true);

  const previewTimersRef = useRef<NodeJS.Timeout[]>([]);
  const isPreviewingRef = useRef(false);

  // Stop any active preview
  const stopPreview = useCallback(() => {
    previewTimersRef.current.forEach((t) => clearTimeout(t));
    previewTimersRef.current = [];
    setPreviewingId(null);
    isPreviewingRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopPreview();
    } else {
      setSelectedMeasures([Math.max(0, Math.min(totalMeasures - 1, selectedMeasureIndex))]);
      setCurrentPage(1);
    }
  }, [isOpen, selectedMeasureIndex, totalMeasures, stopPreview]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, [stopPreview]);

  // Destination measures controls
  const toggleMeasure = (mIdx: number) => {
    setSelectedMeasures((prev) => {
      if (prev.includes(mIdx)) {
        if (prev.length === 1) return prev; // At least one measure
        return prev.filter((idx) => idx !== mIdx);
      } else {
        return [...prev, mIdx].sort((a, b) => a - b);
      }
    });
  };

  const selectAllMeasures = () => {
    const all = Array.from({ length: totalMeasures }, (_, i) => i);
    if (selectedMeasures.length === totalMeasures) {
      setSelectedMeasures([selectedMeasureIndex]);
    } else {
      setSelectedMeasures(all);
    }
  };

  // Filter grooves by category, difficulty, syncopation and search query
  const filteredGrooves = useMemo(() => {
    return GROOVES_DATA.filter((item) => {
      const isItemSyncopated =
        item.isSyncopated ||
        item.tags?.includes('Sincopado') ||
        item.description.toLowerCase().includes('síncopa') ||
        item.description.toLowerCase().includes('sincopad');

      if (onlySyncopated && !isItemSyncopated) {
        return false;
      }

      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchesDifficulty =
        selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory && matchesDifficulty;

      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(query)) ||
        item.timeSignature.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.suggestedBpm.toString().includes(query) ||
        item.difficulty.toLowerCase().includes(query) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(query)));

      return matchesCategory && matchesDifficulty && matchesSearch;
    });
  }, [selectedCategory, selectedDifficulty, searchQuery, onlySyncopated]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedDifficulty, searchQuery, onlySyncopated]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredGrooves.length / ITEMS_PER_PAGE));
  const paginatedGrooves = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGrooves.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGrooves, currentPage]);

  // Preview Loop with Web Audio / Tone.js
  const handlePreviewGroove = (groove: GroovePattern) => {
    if (previewingId === groove.id) {
      stopPreview();
      return;
    }

    stopPreview();
    setPreviewingId(groove.id);
    isPreviewingRef.current = true;

    const [numStr, denStr] = groove.timeSignature.split('/');
    const beatsCount = parseInt(numStr, 10) || 4;
    const beatValue = parseInt(denStr, 10) || 4;
    const bpm = groove.suggestedBpm || 110;
    const beatMs = (60 / bpm) * (4 / beatValue) * 1000;

    const measureTemplate = groove.measures[0];
    if (!measureTemplate) return;

    const scheduleMeasureLoop = (iteration: number = 0) => {
      if (!isPreviewingRef.current) return;
      if (iteration >= 4) {
        stopPreview();
        return;
      }

      let currentOffsetMs = 0;

      for (let bIdx = 0; bIdx < beatsCount; bIdx++) {
        const beatTemplate = measureTemplate.beats[bIdx % measureTemplate.beats.length];
        const subs = beatTemplate?.subdivisions || [];
        const stepCount = subs.length > 0 ? subs.length : 4;
        const stepMs = beatMs / stepCount;

        for (let sIdx = 0; sIdx < stepCount; sIdx++) {
          const hits = subs[sIdx] || [];
          let swingOffsetMs = 0;
          if (groove.swingRatio && stepCount === 4 && sIdx % 2 === 1) {
            swingOffsetMs = stepMs * groove.swingRatio * 0.45;
          }

          const scheduledTime = currentOffsetMs + sIdx * stepMs + swingOffsetMs;

          const timer = setTimeout(() => {
            if (!isPreviewingRef.current) return;
            hits.forEach((h) => {
              const pieceId = (h.instrument === 'hihat' ? 'hihatClosed' : h.instrument) as DrumPieceId;
              onPlayHit(pieceId, h.accent, h.ghost);
            });
          }, scheduledTime);

          previewTimersRef.current.push(timer);
        }

        currentOffsetMs += beatMs;
      }

      const nextLoopTimer = setTimeout(() => {
        scheduleMeasureLoop(iteration + 1);
      }, currentOffsetMs);
      previewTimersRef.current.push(nextLoopTimer);
    };

    scheduleMeasureLoop(0);
  };

  // Apply groove to selected target measures
  const handleApply = (groove: GroovePattern) => {
    const targets = selectedMeasures.length > 0 ? selectedMeasures : [selectedMeasureIndex];
    onApplyGroove(groove, targets, {
      setBpm: syncBpm,
      setSwing: syncSwing && groove.swingRatio !== undefined,
      setTimeSig: syncTimeSig,
    });

    const targetLabel =
      targets.length === totalMeasures
        ? 'todos los compases'
        : targets.map((idx) => `C${idx + 1}`).join(', ');

    setInsertedNotice(`Groove "${groove.name}" aplicado a ${targetLabel} con éxito.`);
    setTimeout(() => {
      setInsertedNotice(null);
    }, 3500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] flex flex-col rounded-3xl bg-surface-base border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-surface-card/60 backdrop-blur flex-shrink-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-synth-cyan/20 border border-amber-500/30 flex items-center justify-center shadow-glow-amber">
                <Disc3 className="w-5 h-5 text-amber-400 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Groove Vault</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
                      85+ Patrones
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Biblioteca profesional de ritmos divididos por estilo, métrica y sensación
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Destination Selector & Sync Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-surface-slate/60 border border-white/5">
            {/* Target measures */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-synth-cyan uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                Aplicar en:
              </span>
              <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-white/5">
                {Array.from({ length: totalMeasures }, (_, i) => {
                  const isSelected = selectedMeasures.includes(i);
                  return (
                    <button
                      key={`m-pill-${i}`}
                      type="button"
                      onClick={() => toggleMeasure(i)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-synth-cyan text-black shadow-glow-cyan font-black'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={`Compás ${i + 1}`}
                    >
                      C{i + 1}
                    </button>
                  );
                })}
              </div>

              {totalMeasures > 1 && (
                <button
                  type="button"
                  onClick={selectAllMeasures}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                    selectedMeasures.length === totalMeasures
                      ? 'border-synth-cyan text-synth-cyan bg-synth-cyan/15'
                      : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {selectedMeasures.length === totalMeasures ? 'Todos Activos' : 'Seleccionar Todos'}
                </button>
              )}
            </div>

            {/* Sync Toggles */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={syncBpm}
                  onChange={(e) => setSyncBpm(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-0"
                />
                <span>Ajustar BPM</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={syncSwing}
                  onChange={(e) => setSyncSwing(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-synth-cyan focus:ring-0"
                />
                <span>Swing Feel</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={syncTimeSig}
                  onChange={(e) => setSyncTimeSig(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-synth-violet focus:ring-0"
                />
                <span>Métrica</span>
              </label>
            </div>
          </div>

          {/* Search bar and Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, estilo, métrica ('7/8', 'shuffle', 'bossa') o BPM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-slate border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-amber-400 transition-all font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {['all', 'Principiante', 'Intermedio', 'Avanzado', 'Virtuoso'].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono transition-all border whitespace-nowrap cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'border-amber-400/60 bg-amber-500/20 text-amber-200 font-bold'
                      : 'border-white/5 bg-surface-slate text-gray-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {diff === 'all' ? 'Todas las Dificultades' : diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs with Live Counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setOnlySyncopated(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all' && !onlySyncopated
                  ? 'bg-amber-500 text-black shadow-glow-amber'
                  : 'bg-surface-slate border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Todos ({GROOVES_DATA.length})
            </button>

            {/* Sincopado Dedicated Filter Button */}
            <button
              onClick={() => setOnlySyncopated((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                onlySyncopated
                  ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20'
              }`}
              title="Filtrar patrones sincopados característicos (Bossa Nova, Funk syncopations, Partido Alto, Latin Clave, Offbeat pushes)"
            >
              <span className="text-sm">𝄐</span>
              <span>Sincopados</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  onlySyncopated ? 'bg-black/20 text-black' : 'bg-amber-500/25 text-amber-200'
                }`}
              >
                {syncopatedCount}
              </span>
              {onlySyncopated && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
            </button>

            {GROOVE_CATEGORIES.map((cat) => {
              const count = GROOVES_DATA.filter((g) => g.category === cat.id).length;
              const isSelected = selectedCategory === cat.id && !onlySyncopated;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setOnlySyncopated(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                    isSelected
                      ? `${cat.badge} shadow-lg font-black`
                      : 'bg-surface-slate border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {insertedNotice && (
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{insertedNotice}</span>
          </div>
        )}

        {/* Groove Cards Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {filteredGrooves.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-mono text-sm space-y-2">
              <p>No se encontraron ritmos que coincidan con la búsqueda.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedDifficulty('all');
                  setSearchQuery('');
                }}
                className="text-amber-400 hover:underline text-xs cursor-pointer"
              >
                Restablecer todos los filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedGrooves.map((groove) => {
                const isPreviewing = previewingId === groove.id;
                const catMeta = GROOVE_CATEGORIES.find((c) => c.id === groove.category);

                return (
                  <div
                    key={groove.id}
                    className={`rounded-2xl p-4 transition-all border flex flex-col justify-between gap-3 ${
                      isPreviewing
                        ? 'bg-surface-slate/90 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                        : 'bg-surface-slate/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Top Bar of Card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                                catMeta?.badge || 'bg-white/10 text-gray-300 border-white/10'
                              }`}
                            >
                              {catMeta?.label}
                            </span>
                            {(groove.isSyncopated || groove.tags?.includes('Sincopado')) && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1 shadow-sm">
                                <span>𝄐</span>
                                <span>Sincopado</span>
                              </span>
                            )}
                            {groove.subCategory && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-gray-300">
                                {groove.subCategory}
                              </span>
                            )}
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400">
                              {groove.difficulty}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white leading-tight">
                            {groove.name}
                          </h3>
                        </div>

                        {/* Preview Audio Button */}
                        <button
                          type="button"
                          onClick={() => handlePreviewGroove(groove)}
                          className={`p-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                            isPreviewing
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-white/5 text-gray-300 hover:text-amber-400 hover:bg-white/10 border border-white/10'
                          }`}
                          title="Escuchar bucle de 1 compás"
                        >
                          {isPreviewing ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span className="text-[10px]">Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current text-amber-400" />
                              <span className="text-[10px]">Preview</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Musical Specs Badges */}
                      <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-gray-400 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-synth-cyan">
                          Métrica: {groove.timeSignature}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-amber-300">
                          {groove.suggestedBpm} BPM
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-black/40 border border-white/5 text-purple-300">
                          Sub: {groove.subdivision}
                        </span>
                        {groove.swingRatio !== undefined && groove.swingRatio > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-synth-violet/20 border border-synth-violet/40 text-violet-200">
                            Swing {Math.round(groove.swingRatio * 100)}%
                          </span>
                        )}
                      </div>

                      {/* Mini Score Preview Visualizer */}
                      <MiniScorePreview groove={groove} className="mb-2.5" />

                      {/* Description */}
                      <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-2">
                        {groove.description}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-gray-500">
                        {groove.measuresCount} compás
                      </span>

                      <button
                        type="button"
                        onClick={() => handleApply(groove)}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Cargar Groove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-surface-card/60 backdrop-blur flex items-center justify-between gap-3 text-xs font-mono text-gray-400 flex-shrink-0">
          <div>
            Mostrando {paginatedGrooves.length} de {filteredGrooves.length} grooves
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded-lg border transition-all ${
                  currentPage === 1
                    ? 'border-white/5 text-gray-600 cursor-not-allowed'
                    : 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-gray-300">
                Pág. {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded-lg border transition-all ${
                  currentPage === totalPages
                    ? 'border-white/5 text-gray-600 cursor-not-allowed'
                    : 'border-white/10 text-gray-300 hover:text-white hover:bg-white/5 cursor-pointer'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
