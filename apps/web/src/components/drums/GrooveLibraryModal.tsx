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
  Plus,
  Trash2,
  Cloud,
  CheckCircle2,
  Bookmark,
  Radio,
  FileMusic,
} from 'lucide-react';
import { GrooveCategory, GroovePattern, DrumPieceId, DrumMeasure } from '@/types/drum';
import {
  GROOVES_DATA,
  GROOVE_CATEGORIES,
  convertDrumMeasureToGrooveMeasures,
} from '@/lib/groovesData';
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
  currentMeasures?: DrumMeasure[];
  currentBpm?: number;
  currentTimeSignature?: [number, number];
  currentSwing?: number;
}

const ITEMS_PER_PAGE = 12;
const LOCAL_STORAGE_KEY = 'sonora_custom_grooves';

export default function GrooveLibraryModal({
  isOpen,
  onClose,
  measuresCount = 1,
  selectedMeasureIndex = 0,
  onApplyGroove,
  onPlayHit,
  currentMeasures,
  currentBpm = 120,
  currentTimeSignature = [4, 4],
  currentSwing = 0,
}: GrooveLibraryModalProps) {
  const totalMeasures = Math.max(1, measuresCount);

  // State
  const [customGrooves, setCustomGrooves] = useState<GroovePattern[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GrooveCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [onlySyncopated, setOnlySyncopated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [insertedNotice, setInsertedNotice] = useState<string | null>(null);

  // Target measure multi-selection (e.g. [0] or [0, 1, 2, 3])
  const [selectedMeasures, setSelectedMeasures] = useState<number[]>([selectedMeasureIndex]);

  // Sync options
  const [syncBpm, setSyncBpm] = useState(true);
  const [syncSwing, setSyncSwing] = useState(true);
  const [syncTimeSig, setSyncTimeSig] = useState(true);

  // Save Modal Dialog State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveGenre, setSaveGenre] = useState<GrooveCategory>('Mis Grooves');
  const [saveDifficulty, setSaveDifficulty] = useState<string>('Intermedio');
  const [saveSourceMeasureIndex, setSaveSourceMeasureIndex] = useState<number>(selectedMeasureIndex);
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const previewTimersRef = useRef<NodeJS.Timeout[]>([]);
  const isPreviewingRef = useRef(false);

  // 1. Load custom grooves from localStorage & database API on mount
  useEffect(() => {
    let localSaved: GroovePattern[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localSaved = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }
    setCustomGrooves(localSaved);

    // Fetch from database API
    fetch('/api/grooves')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.grooves && Array.isArray(data.grooves)) {
          setCustomGrooves((prev) => {
            const map = new Map<string, GroovePattern>();
            // Add server grooves first
            data.grooves.forEach((g: GroovePattern) => map.set(g.id, g));
            // Add any local ones that might not be synced yet
            prev.forEach((g) => {
              if (!map.has(g.id)) map.set(g.id, g);
            });
            const merged = Array.from(map.values());
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch (err) {}
            return merged;
          });
        }
      })
      .catch((err) => {
        console.warn('API /api/grooves unavailable, continuing with local storage.', err);
      });
  }, []);

  // Update source measure when selectedMeasureIndex changes
  useEffect(() => {
    setSaveSourceMeasureIndex(Math.max(0, Math.min(totalMeasures - 1, selectedMeasureIndex)));
  }, [selectedMeasureIndex, totalMeasures]);

  // Combined Grooves list (Custom grooves first)
  const allGrooves = useMemo(() => {
    return [...customGrooves, ...GROOVES_DATA];
  }, [customGrooves]);

  // Live count of syncopated groove patterns
  const syncopatedCount = useMemo(() => {
    return allGrooves.filter(
      (g) =>
        g.isSyncopated ||
        g.tags?.includes('Sincopado') ||
        g.description.toLowerCase().includes('síncopa') ||
        g.description.toLowerCase().includes('sincopad')
    ).length;
  }, [allGrooves]);

  // Live count of custom grooves
  const customGroovesCount = customGrooves.length;

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
      setIsSaveModalOpen(false);
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
    return allGrooves.filter((item) => {
      const isItemSyncopated =
        item.isSyncopated ||
        item.tags?.includes('Sincopado') ||
        item.description.toLowerCase().includes('síncopa') ||
        item.description.toLowerCase().includes('sincopad');

      if (onlySyncopated && !isItemSyncopated) {
        return false;
      }

      let matchesCategory = false;
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'Mis Grooves') {
        matchesCategory = item.isCustom === true || item.category === 'Mis Grooves';
      } else {
        matchesCategory = item.category === selectedCategory;
      }

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
  }, [allGrooves, selectedCategory, selectedDifficulty, searchQuery, onlySyncopated]);

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

  // Delete Custom Groove
  const handleDeleteCustomGroove = async (grooveId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este groove de tu biblioteca?')) {
      return;
    }

    setCustomGrooves((prev) => {
      const updated = prev.filter((g) => g.id !== grooveId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    try {
      await fetch(`/api/grooves/${grooveId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete request failed (may have been local-only)', err);
    }

    setInsertedNotice('Groove eliminado de tu biblioteca.');
    setTimeout(() => setInsertedNotice(null), 3000);
  };

  // Prepare Live Preview for the Save Dialog
  const liveSourceMeasure: DrumMeasure | undefined =
    currentMeasures && currentMeasures[saveSourceMeasureIndex]
      ? currentMeasures[saveSourceMeasureIndex]
      : currentMeasures?.[0];

  const livePreviewGroove: GroovePattern | null = useMemo(() => {
    if (!liveSourceMeasure) return null;
    const { measures: capturedMeasures, subdivision } = convertDrumMeasureToGrooveMeasures(liveSourceMeasure);
    return {
      id: 'save-modal-live-preview',
      name: saveName.trim() || 'Nuevo Groove Personalizado',
      category: saveGenre,
      subCategory: 'Creado por Mí',
      difficulty: saveDifficulty as any,
      suggestedBpm: currentBpm,
      timeSignature: `${currentTimeSignature[0]}/${currentTimeSignature[1]}` as any,
      swingRatio: currentSwing,
      measuresCount: 1,
      subdivision: subdivision as any,
      description: saveDescription.trim() || 'Groove capturado directamente desde la partitura.',
      isCustom: true,
      measures: capturedMeasures,
    };
  }, [liveSourceMeasure, saveName, saveGenre, saveDifficulty, currentBpm, currentTimeSignature, currentSwing, saveDescription]);

  // Handle Save Groove Form Submission
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim() || !liveSourceMeasure) return;

    setIsSaving(true);
    const { measures: capturedMeasures, subdivision } = convertDrumMeasureToGrooveMeasures(liveSourceMeasure);
    const tempId = `custom-${Date.now()}`;
    const timeSigStr = `${currentTimeSignature[0]}/${currentTimeSignature[1]}`;

    const payload = {
      name: saveName.trim(),
      genre: saveGenre,
      subCategory: 'Creado por Mí',
      difficulty: saveDifficulty,
      suggestedBpm: currentBpm,
      timeSignature: timeSigStr,
      swingRatio: currentSwing,
      measuresCount: 1,
      subdivision,
      description: saveDescription.trim() || 'Groove capturado en Sonora Drum Lab.',
      measures: capturedMeasures,
    };

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

    setCustomGrooves((prev) => {
      const updated = [savedItem, ...prev.filter((g) => g.id !== savedItem.id)];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    setIsSaving(false);
    setIsSaveModalOpen(false);
    setSelectedCategory('Mis Grooves');
    setInsertedNotice(`¡"${savedItem.name}" guardado exitosamente en tu Groove Vault!`);
    setTimeout(() => setInsertedNotice(null), 4000);
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
                      {allGrooves.length} Patrones
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  Biblioteca profesional de ritmos divididos por estilo, métrica y sensación
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Save Current Groove Button */}
              {currentMeasures && currentMeasures.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSaveName(`Mi Ritmo C${selectedMeasureIndex + 1}`);
                    setSaveSourceMeasureIndex(selectedMeasureIndex);
                    setIsSaveModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500/25 via-purple-500/25 to-pink-500/25 hover:from-cyan-500/35 hover:via-purple-500/35 hover:to-pink-500/35 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  title="Capturar y guardar el compás actual de tu partitura en el Groove Vault"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span className="hidden sm:inline">+ Guardar Groove Actual en Vault</span>
                  <span className="sm:hidden">+ Guardar</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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
                      : 'border-white/5 bg-surface-slate text-gray-400 hover:text-white'
                  }`}
                >
                  {diff === 'all' ? 'Todas las Dificultades' : diff}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs with Dynamic Live Counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Todos Tab */}
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
              Todos ({allGrooves.length})
            </button>

            {/* Dedicated "Mis Grooves" Dynamic Filter Tab */}
            <button
              onClick={() => {
                setSelectedCategory('Mis Grooves');
                setOnlySyncopated(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                selectedCategory === 'Mis Grooves' && !onlySyncopated
                  ? 'bg-gradient-to-r from-cyan-500/30 via-purple-500/30 to-pink-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.4)] font-black'
                  : 'bg-surface-slate border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10'
              }`}
              title="Grooves y ritmos personalizados creados y guardados por ti"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mis Grooves</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  selectedCategory === 'Mis Grooves'
                    ? 'bg-cyan-400/30 text-white'
                    : 'bg-cyan-500/20 text-cyan-300'
                }`}
              >
                {customGroovesCount}
              </span>
            </button>

            {/* Sincopados Filter Tab */}
            <button
              onClick={() => setOnlySyncopated((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                onlySyncopated
                  ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:border-amber-400 hover:bg-amber-500/20'
              }`}
              title="Filtrar patrones sincopados característicos"
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

            {/* Standard Categories Tabs */}
            {GROOVE_CATEGORIES.filter((c) => c.id !== 'Mis Grooves').map((cat) => {
              const count = allGrooves.filter((g) => g.category === cat.id).length;
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

        {/* Notice Banner */}
        {insertedNotice && (
          <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 border-b border-cyan-500/30 text-xs font-mono text-cyan-200 flex items-center justify-between gap-2 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{insertedNotice}</span>
            </div>
            <button
              onClick={() => setInsertedNotice(null)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Grooves Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 scrollbar-thin">
          {filteredGrooves.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-surface-slate/20 border border-white/5">
              <Disc3 className="w-10 h-10 text-gray-600 mb-2 animate-pulse" />
              <p className="text-gray-400 text-sm font-mono mb-1">
                {selectedCategory === 'Mis Grooves'
                  ? 'Aún no has guardado ningún groove personalizado.'
                  : 'No se encontraron grooves con los filtros aplicados.'}
              </p>
              {selectedCategory === 'Mis Grooves' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSaveName(`Mi Ritmo C${selectedMeasureIndex + 1}`);
                    setSaveSourceMeasureIndex(selectedMeasureIndex);
                    setIsSaveModalOpen(true);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar el compás actual ahora</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedDifficulty('all');
                    setOnlySyncopated(false);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-mono transition-colors cursor-pointer"
                >
                  Restablecer Filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedGrooves.map((groove) => {
                const isPreviewing = previewingId === groove.id;
                const catMeta = GROOVE_CATEGORIES.find((c) => c.id === groove.category);

                return (
                  <div
                    key={groove.id}
                    className={`rounded-2xl p-4 transition-all border flex flex-col justify-between gap-3 ${
                      groove.isCustom
                        ? isPreviewing
                          ? 'bg-surface-slate/90 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'bg-surface-slate/50 border-cyan-500/20 hover:border-cyan-500/40'
                        : isPreviewing
                        ? 'bg-surface-slate/80 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'bg-surface-slate/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Top Bar of Card */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Category Badge */}
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                                catMeta?.badge || 'bg-white/10 text-gray-300 border-white/10'
                              }`}
                            >
                              {catMeta?.label || groove.category}
                            </span>

                            {/* Custom Badge */}
                            {groove.isCustom && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1 shadow-sm">
                                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                <span>Creado por Mí</span>
                              </span>
                            )}

                            {/* Syncopated Badge */}
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-500">
                          {groove.measuresCount} compás
                        </span>

                        {/* Delete Custom Groove Button */}
                        {groove.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomGroove(groove.id)}
                            className="p-1 rounded-md text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                            title="Eliminar groove de mi biblioteca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

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
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-2 text-gray-300">
                Pág. {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL / DRAWER: GUARDAR GROOVE ACTUAL EN VAULT                  */}
      {/* ============================================================== */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0B0F19] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] p-6 space-y-5 overflow-hidden">
            {/* Modal Title */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Guardar Groove Actual en Vault</h3>
                  <p className="text-xs text-gray-400 font-mono">
                    Captura el ritmo del secuenciador y almacénalo en la nube
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                  Nombre del Groove *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: Funk Sincopado en C1, Ghost Pocket..."
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

              {/* Source Measure Selection */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                  Compás de Origen a Capturar
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
              </div>

              {/* Instant Mini Score Preview */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>Previsualización en Partitura</span>
                  <span className="text-[10px] text-cyan-400 font-normal">
                    {currentTimeSignature[0]}/{currentTimeSignature[1]} • {currentBpm} BPM
                  </span>
                </label>
                {livePreviewGroove ? (
                  <MiniScorePreview groove={livePreviewGroove} width={280} height={70} />
                ) : (
                  <div className="h-[70px] rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-center text-xs text-gray-500 font-mono">
                    Sin compás seleccionado
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Notas sobre el groove, instrumentación o tempo sugerido..."
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !saveName.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black font-bold text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
      )}
    </div>
  );
}
