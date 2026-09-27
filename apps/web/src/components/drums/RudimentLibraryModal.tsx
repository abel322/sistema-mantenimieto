'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Sparkles,
  Play,
  Square,
  Sliders,
  Check,
  Zap,
  Disc3,
  Layers,
  Plus,
  Trash2,
  Bookmark,
  Cloud,
  FileMusic,
  CheckCircle2,
  Keyboard,
  Target,
} from 'lucide-react';
import {
  RudimentItem,
  RudimentCategory,
  RudimentStep,
  VoicingMode,
  DrumPieceId,
  DrumMeasure,
} from '@/types/drum';
import { RUDIMENTS_DATA, RUDIMENT_CATEGORIES } from '@/lib/rudimentsData';
import MiniScorePreview from './MiniScorePreview';

interface RudimentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  measuresCount?: number;
  beatsPerMeasure?: number;
  selectedMeasureIndex: number;
  selectedBeatIndex: number;
  onInsertInBeat?: (rudiment: RudimentItem, voicing: VoicingMode) => void;
  onFillMeasure?: (rudiment: RudimentItem, voicing: VoicingMode) => void;
  onBatchInsert?: (
    rudiment: RudimentItem,
    voicing: VoicingMode,
    measureIndices: number[],
    beatIndices: number[]
  ) => void;
  onFillMeasuresBatch?: (
    rudiment: RudimentItem,
    voicing: VoicingMode,
    measureIndices: number[]
  ) => void;
  onPlayHit: (pieceId: DrumPieceId, accent?: boolean, ghost?: boolean) => void;
  currentMeasures?: DrumMeasure[];
}

const LOCAL_STORAGE_KEY = 'sonora_custom_rudiments';

// Parser helper for quick manual text entry (e.g. "R L R R L R L L", ">R L (R) fL")
function parseManualSticking(raw: string): RudimentStep[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const tokens = trimmed.includes(' ')
    ? trimmed.split(/\s+/)
    : trimmed.match(/(?:>[A-Za-z]|\([A-Za-z]\)|[fFdD][A-Za-z]|[A-Za-z])/g) || [trimmed];

  return tokens.map((tok) => {
    let accent = false;
    let ghost = false;
    let flam = false;
    let drag = false;
    let piece: DrumPieceId = 'snare';
    let clean = tok;

    if (clean.startsWith('>')) {
      accent = true;
      clean = clean.slice(1);
    }
    if (clean.startsWith('(') && clean.endsWith(')')) {
      ghost = true;
      clean = clean.slice(1, -1);
    }
    if (clean.startsWith('f') || clean.startsWith('F')) {
      flam = true;
      clean = clean.slice(1);
    }
    if (clean.startsWith('d') || clean.startsWith('D')) {
      drag = true;
      clean = clean.slice(1);
    }

    const upper = clean.toUpperCase();
    let hand = 'R';
    if (upper === 'L') hand = 'L';
    else if (upper === 'K') {
      hand = 'K';
      piece = 'kick';
    } else if (upper === 'B') hand = 'B';
    else hand = 'R';

    return {
      sticking: hand,
      accent,
      ghost,
      flam,
      drag,
      kitPiece: piece,
    };
  });
}

export default function RudimentLibraryModal({
  isOpen,
  onClose,
  measuresCount = 1,
  beatsPerMeasure = 4,
  selectedMeasureIndex,
  selectedBeatIndex,
  onInsertInBeat,
  onFillMeasure,
  onBatchInsert,
  onFillMeasuresBatch,
  onPlayHit,
  currentMeasures,
}: RudimentLibraryModalProps) {
  const totalMeasures = Math.max(1, measuresCount);
  const totalBeats = Math.max(1, beatsPerMeasure);

  // State
  const [customRudiments, setCustomRudiments] = useState<RudimentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RudimentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [voicing, setVoicing] = useState<VoicingMode>('kit');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [insertedNotice, setInsertedNotice] = useState<string | null>(null);

  // Multi-select destination state
  const [selectedMeasures, setSelectedMeasures] = useState<number[]>([selectedMeasureIndex]);
  const [selectedBeats, setSelectedBeats] = useState<number[]>([selectedBeatIndex]);

  // Save Modal Dialog State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState<RudimentCategory>('custom');
  const [saveDifficulty, setSaveDifficulty] = useState<string>('Intermedio');
  const [saveSubdivision, setSaveSubdivision] = useState<number>(4); // default 4 = 1/16
  const [saveOriginMode, setSaveOriginMode] = useState<'score' | 'manual'>('score');
  const [saveScope, setSaveScope] = useState<'beat' | 'measure'>('beat');
  const [saveSourceMeasureIndex, setSaveSourceMeasureIndex] = useState<number>(selectedMeasureIndex);
  const [saveSourceBeatIndex, setSaveSourceBeatIndex] = useState<number>(selectedBeatIndex);
  const [manualStickingText, setManualStickingText] = useState('R L R R L R L L');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const previewTimersRef = useRef<NodeJS.Timeout[]>([]);

  // 1. Load custom rudiments from localStorage and /api/rudiments on mount
  useEffect(() => {
    let localSaved: RudimentItem[] = [];
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localSaved = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading from localStorage', e);
    }
    setCustomRudiments(localSaved);

    fetch('/api/rudiments')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.rudiments && Array.isArray(data.rudiments)) {
          setCustomRudiments((prev) => {
            const map = new Map<string, RudimentItem>();
            data.rudiments.forEach((r: RudimentItem) => map.set(r.id, r));
            prev.forEach((r) => {
              if (!map.has(r.id)) map.set(r.id, r);
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
        console.warn('API /api/rudiments offline, continuing with local storage.', err);
      });
  }, []);

  // Update source indices when selectedMeasureIndex or selectedBeatIndex changes
  useEffect(() => {
    setSaveSourceMeasureIndex(Math.max(0, Math.min(totalMeasures - 1, selectedMeasureIndex)));
    setSaveSourceBeatIndex(Math.max(0, Math.min(totalBeats - 1, selectedBeatIndex)));
  }, [selectedMeasureIndex, selectedBeatIndex, totalMeasures, totalBeats]);

  // Combined Rudiments list (Custom rudiments first)
  const allRudiments = useMemo(() => {
    return [...customRudiments, ...RUDIMENTS_DATA];
  }, [customRudiments]);

  // Stop any ongoing preview playback
  const stopPreview = () => {
    previewTimersRef.current.forEach((t) => clearTimeout(t));
    previewTimersRef.current = [];
    setPreviewingId(null);
  };

  useEffect(() => {
    if (!isOpen) {
      stopPreview();
      setIsSaveModalOpen(false);
    } else {
      setSelectedMeasures([Math.max(0, Math.min(totalMeasures - 1, selectedMeasureIndex))]);
      setSelectedBeats([Math.max(0, Math.min(totalBeats - 1, selectedBeatIndex))]);
    }
  }, [isOpen, selectedMeasureIndex, selectedBeatIndex, totalMeasures, totalBeats]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  // Filter rudiments by category and search query
  const filteredRudiments = useMemo(() => {
    return allRudiments.filter((item) => {
      let matchesCategory = false;
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'custom') {
        matchesCategory = item.isCustom === true || item.category === 'custom';
      } else {
        matchesCategory = item.category === selectedCategory;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const cleanQuery = query.replace(/[\s\-_]+/g, '');
      const stickingSpaced = item.steps.map((s) => s.sticking).join(' ').toLowerCase();
      const stickingJoined = item.steps.map((s) => s.sticking).join('').toLowerCase();

      const matchesQuery =
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(query))) ||
        stickingSpaced.includes(query) ||
        stickingJoined.includes(cleanQuery) ||
        (item.sticking && item.sticking.join(' ').toLowerCase().includes(query)) ||
        (item.sticking && item.sticking.join('').toLowerCase().includes(cleanQuery));

      return matchesCategory && matchesQuery;
    });
  }, [allRudiments, selectedCategory, searchQuery]);

  // Multi-selection handlers
  const toggleMeasure = (mIdx: number) => {
    setSelectedMeasures((prev) => {
      if (prev.includes(mIdx)) {
        if (prev.length === 1) return prev;
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

  const toggleBeat = (bIdx: number) => {
    setSelectedBeats((prev) => {
      if (prev.includes(bIdx)) {
        if (prev.length === 1) return prev;
        return prev.filter((idx) => idx !== bIdx);
      } else {
        return [...prev, bIdx].sort((a, b) => a - b);
      }
    });
  };

  const selectAllBeats = () => {
    setSelectedBeats(Array.from({ length: totalBeats }, (_, i) => i));
  };

  const selectHalfMeasureFill = () => {
    const half = Math.floor(totalBeats / 2);
    const fillBeats = Array.from({ length: totalBeats - half }, (_, i) => half + i);
    setSelectedBeats(fillBeats);
  };

  const selectLastBeat = () => {
    setSelectedBeats([totalBeats - 1]);
  };

  // Format dynamic labels for UI buttons
  const measuresLabel = useMemo(() => {
    if (selectedMeasures.length === 0) return `C${selectedMeasureIndex + 1}`;
    if (selectedMeasures.length === totalMeasures) {
      return totalMeasures > 1 ? `Todos (C1-C${totalMeasures})` : 'C1';
    }
    return selectedMeasures.map((m) => `C${m + 1}`).join(', ');
  }, [selectedMeasures, totalMeasures, selectedMeasureIndex]);

  const beatsLabel = useMemo(() => {
    if (selectedBeats.length === 0) return `T${selectedBeatIndex + 1}`;
    if (selectedBeats.length === totalBeats) return 'Compás Completo';
    return selectedBeats.map((b) => `T${b + 1}`).join(', ');
  }, [selectedBeats, totalBeats, selectedBeatIndex]);

  // Insert actions
  const handleInsertBatch = (rudiment: RudimentItem) => {
    if (onBatchInsert) {
      onBatchInsert(rudiment, voicing, selectedMeasures, selectedBeats);
    } else if (onInsertInBeat) {
      onInsertInBeat(rudiment, voicing);
    }

    setInsertedNotice(`Insertado "${rudiment.name}" en ${measuresLabel} • ${beatsLabel}`);
    setTimeout(() => setInsertedNotice(null), 3500);
  };

  const handleFillMeasures = (rudiment: RudimentItem) => {
    if (onFillMeasuresBatch) {
      onFillMeasuresBatch(rudiment, voicing, selectedMeasures);
    } else if (onFillMeasure) {
      onFillMeasure(rudiment, voicing);
    }

    setInsertedNotice(`Compases ${measuresLabel} llenados con "${rudiment.name}"`);
    setTimeout(() => setInsertedNotice(null), 3500);
  };

  // Preview Audio using Tone.js synthesizers
  const handlePreviewAudio = (rudiment: RudimentItem) => {
    if (previewingId === rudiment.id) {
      stopPreview();
      return;
    }

    stopPreview();
    setPreviewingId(rudiment.id);

    const sub = rudiment.subdivision || 4;
    const bpm = rudiment.defaultBpm || 100;
    const quarterMs = (60 / bpm) * 1000;
    const stepDurationMs = quarterMs / sub;

    rudiment.steps.forEach((step, idx) => {
      const scheduledTime = idx * stepDurationMs;

      const timer = setTimeout(() => {
        let piece: DrumPieceId = 'snare';
        if (voicing === 'kit' && step.kitPiece) {
          piece = step.kitPiece;
        } else if (step.sticking === 'K') {
          piece = 'kick';
        }

        if (step.flam) {
          onPlayHit('snare', false, true);
          setTimeout(() => {
            onPlayHit(piece, step.accent, step.ghost);
          }, 25);
        } else if (step.drag) {
          onPlayHit('snare', false, true);
          setTimeout(() => {
            onPlayHit('snare', false, true);
            setTimeout(() => {
              onPlayHit(piece, step.accent, step.ghost);
            }, 20);
          }, 20);
        } else {
          onPlayHit(piece, step.accent, step.ghost);
        }

        if (idx === rudiment.steps.length - 1) {
          setTimeout(() => {
            setPreviewingId(null);
          }, stepDurationMs);
        }
      }, scheduledTime);

      previewTimersRef.current.push(timer);
    });
  };

  // Delete Custom Rudiment
  const handleDeleteCustomRudiment = async (rudimentId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este rudimento de tu biblioteca?')) {
      return;
    }

    setCustomRudiments((prev) => {
      const updated = prev.filter((r) => r.id !== rudimentId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    try {
      await fetch(`/api/rudiments/${rudimentId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete request failed', err);
    }

    setInsertedNotice('Rudimento eliminado de tu biblioteca.');
    setTimeout(() => setInsertedNotice(null), 3000);
  };

  // Build live preview steps for save modal
  const livePreviewSteps: RudimentStep[] = useMemo(() => {
    if (saveOriginMode === 'manual') {
      return parseManualSticking(manualStickingText);
    }

    // Capture from current score
    const targetMeasure = currentMeasures?.[saveSourceMeasureIndex] || currentMeasures?.[0];
    if (!targetMeasure) return parseManualSticking('R L R R L R L L');

    const steps: RudimentStep[] = [];

    if (saveScope === 'beat') {
      const targetBeat = targetMeasure.beats?.[saveSourceBeatIndex] || targetMeasure.beats?.[0];
      const rawSteps = targetBeat?.steps || [];

      rawSteps.forEach((st, idx) => {
        const primaryHit = st.hits?.[0];
        const defaultHand = idx % 2 === 0 ? 'R' : 'L';
        const sticking = st.sticking || primaryHit?.sticking || defaultHand;
        const pieceId = primaryHit?.pieceId || (sticking === 'K' ? 'kick' : 'snare');

        steps.push({
          sticking,
          accent: st.hits?.some((h) => h.accent) || false,
          ghost: st.hits?.some((h) => h.ghost) || false,
          flam: st.hits?.some((h) => h.flam) || false,
          drag: st.hits?.some((h) => h.drag) || false,
          kitPiece: pieceId,
        });
      });
    } else {
      // Whole measure
      (targetMeasure.beats || []).forEach((b) => {
        (b.steps || []).forEach((st, idx) => {
          const primaryHit = st.hits?.[0];
          const defaultHand = idx % 2 === 0 ? 'R' : 'L';
          const sticking = st.sticking || primaryHit?.sticking || defaultHand;
          const pieceId = primaryHit?.pieceId || (sticking === 'K' ? 'kick' : 'snare');

          steps.push({
            sticking,
            accent: st.hits?.some((h) => h.accent) || false,
            ghost: st.hits?.some((h) => h.ghost) || false,
            flam: st.hits?.some((h) => h.flam) || false,
            drag: st.hits?.some((h) => h.drag) || false,
            kitPiece: pieceId,
          });
        });
      });
    }

    return steps.length > 0 ? steps : parseManualSticking('R L R R L R L L');
  }, [saveOriginMode, manualStickingText, currentMeasures, saveSourceMeasureIndex, saveSourceBeatIndex, saveScope]);

  // Live preview rudiment object for <MiniScorePreview />
  const livePreviewRudiment: RudimentItem = useMemo(() => {
    return {
      id: 'preview-rudiment',
      name: saveName.trim() || 'Nuevo Rudimento',
      category: saveCategory,
      difficulty: saveDifficulty as any,
      description: saveDescription.trim() || 'Rudimento creado en Sonora Academy.',
      subdivision: saveSubdivision,
      defaultBpm: 100,
      steps: livePreviewSteps,
      tags: ['Personal', 'Custom', saveCategory],
      isCustom: true,
    };
  }, [saveName, saveCategory, saveDifficulty, saveDescription, saveSubdivision, livePreviewSteps]);

  // Save Rudiment Form Submission
  const handleSaveRudimentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim() || livePreviewSteps.length === 0) return;

    setIsSaving(true);
    const tempId = `custom-rudiment-${Date.now()}`;
    const stickingArray = livePreviewSteps.map((s) => s.sticking);

    const payload = {
      name: saveName.trim(),
      category: saveCategory,
      difficulty: saveDifficulty,
      subdivision: saveSubdivision === 4 ? '1/16' : saveSubdivision === 2 ? '1/8' : saveSubdivision === 3 ? '3:2' : saveSubdivision === 6 ? '6:4' : '1/16',
      sticking: stickingArray,
      steps: livePreviewSteps,
      description: saveDescription.trim() || 'Rudimento creado en Sonora Academy.',
    };

    let savedItem: RudimentItem = {
      id: tempId,
      name: payload.name,
      category: saveCategory,
      difficulty: saveDifficulty as any,
      description: payload.description,
      subdivision: saveSubdivision,
      defaultBpm: 100,
      steps: livePreviewSteps,
      sticking: stickingArray,
      tags: ['Personal', 'Custom', saveCategory],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/rudiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rudiment) {
          savedItem = data.rudiment;
        }
      }
    } catch (err) {
      console.warn('Database save failed, keeping in localStorage backup.', err);
    }

    setCustomRudiments((prev) => {
      const updated = [savedItem, ...prev.filter((r) => r.id !== savedItem.id)];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });

    setIsSaving(false);
    setIsSaveModalOpen(false);
    setSelectedCategory('custom');
    setInsertedNotice(`¡"${savedItem.name}" guardado exitosamente en tu Vault!`);
    setTimeout(() => setInsertedNotice(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-5xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 border-t sm:border border-slate-200 dark:border-white/10 shadow-2xl transition-colors duration-200">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Header Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md flex-shrink-0 space-y-2.5">
          {/* Row 1: Title, count badge, and close button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(34,211,238,0.2)] flex-shrink-0">
                <Disc3 className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-700 dark:text-synth-cyan animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    Rudiment & Fill Vault
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-mono font-bold border border-cyan-300 dark:border-cyan-500/30 flex-shrink-0">
                    {allRudiments.length}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 mt-0.5 font-mono truncate hidden sm:block">
                  Biblioteca inteligente de rudimentos percusivos con inyector multi-compás y digitaciones R/L
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-surface-slate border border-slate-200 dark:border-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer flex-shrink-0"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Row 2: Secondary action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5">
            {/* Create / Save Custom Rudiment Button */}
            <button
              type="button"
              onClick={() => {
                setSaveName(`Mi Rudimento #${customRudiments.length + 1}`);
                setIsSaveModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-pink-500/20 hover:from-cyan-500/30 hover:via-violet-500/30 hover:to-pink-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              title="Crear o guardar un rudimento personalizado en el Vault"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Crear / Guardar</span>
            </button>

            {/* Voicing Mode Toggle */}
            <div className="flex items-center gap-1 p-0.5 bg-surface-dark rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setVoicing('snare')}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  voicing === 'snare'
                    ? 'bg-amber-500/25 border border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Toda la digitación en la caja (Pad de práctica)"
              >
                <span>🥁</span>
                <span>Caja Sola</span>
              </button>
              <button
                type="button"
                onClick={() => setVoicing('kit')}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  voicing === 'kit'
                    ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Orquestación automática distribuida entre toms, caja y bombo"
              >
                <span>⚡</span>
                <span>Kit / Chops</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter, Search & Destination Bar */}
        <div className="p-3.5 sm:p-4 border-b border-white/5 space-y-2.5 bg-surface-slate/20">
          {/* Search Row */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, digitación (ej: R L R R), etiqueta..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-dark border border-white/10 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-synth-cyan transition-all font-mono"
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

          {/* Interactive Multi-Measure & Multi-Beat Destination Selector ("APLICAR EN:") */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-surface-dark/90 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
            {/* A) Selector de Compases */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-synth-cyan" />
                Compás:
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
                          ? 'bg-synth-cyan text-black shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={`Compás ${i + 1}`}
                    >
                      C{i + 1}
                    </button>
                  );
                })}
                {totalMeasures > 1 && (
                  <button
                    type="button"
                    onClick={selectAllMeasures}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                      selectedMeasures.length === totalMeasures
                        ? 'border-synth-cyan text-synth-cyan bg-synth-cyan/15'
                        : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {selectedMeasures.length === totalMeasures ? 'Activo' : 'Todos'}
                  </button>
                )}
              </div>
            </div>

            {/* B) Selector de Pulsos / Tiempos + Presets Rápidos */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                Pulsos:
              </span>
              <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-white/5">
                {Array.from({ length: totalBeats }, (_, i) => {
                  const isSelected = selectedBeats.includes(i);
                  return (
                    <button
                      key={`b-pill-${i}`}
                      type="button"
                      onClick={() => toggleBeat(i)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-synth-violet text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      title={`Tiempo ${i + 1}`}
                    >
                      T{i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Quick Beat Presets */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={selectAllBeats}
                  className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedBeats.length === totalBeats
                      ? 'border-purple-400 bg-purple-500/25 text-purple-200 font-bold'
                      : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Todos los tiempos del compás"
                >
                  Compás Completo
                </button>
                <button
                  type="button"
                  onClick={selectHalfMeasureFill}
                  className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedBeats.length === totalBeats - Math.floor(totalBeats / 2) &&
                    selectedBeats.every((b) => b >= Math.floor(totalBeats / 2))
                      ? 'border-purple-400 bg-purple-500/25 text-purple-200 font-bold'
                      : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Segunda mitad del compás (ideal para fills)"
                >
                  Medio Compás / Fill
                </button>
                <button
                  type="button"
                  onClick={selectLastBeat}
                  className={`px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    selectedBeats.length === 1 && selectedBeats[0] === totalBeats - 1
                      ? 'border-purple-400 bg-purple-500/25 text-purple-200 font-bold'
                      : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Solo el último pulso del compás"
                >
                  Final Compás
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-synth-cyan text-black shadow-glow-cyan'
                  : 'bg-surface-slate border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Todos ({allRudiments.length})
            </button>

            {/* Dedicated "Mis Rudimentos" Tab */}
            <button
              onClick={() => setSelectedCategory('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
                selectedCategory === 'custom'
                  ? 'bg-gradient-to-r from-violet-500/30 to-cyan-500/30 border-violet-400 text-cyan-200 shadow-[0_0_15px_rgba(168,85,247,0.4)] font-black'
                  : 'bg-surface-slate border-violet-500/30 text-violet-300 hover:bg-violet-500/10'
              }`}
              title="Rudimentos personalizados creados por ti"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mis Rudimentos</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  selectedCategory === 'custom'
                    ? 'bg-violet-400/30 text-white'
                    : 'bg-violet-500/20 text-violet-300'
                }`}
              >
                {customRudiments.length}
              </span>
            </button>

            {RUDIMENT_CATEGORIES.filter((c) => c.id !== 'custom').map((cat) => {
              const count = allRudiments.filter((r) => r.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
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
          <div className="mx-4 sm:mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
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

        {/* Rudiments Grid List */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {filteredRudiments.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-mono text-sm space-y-2">
              <p>
                {selectedCategory === 'custom'
                  ? 'Aún no has guardado ningún rudimento personalizado.'
                  : 'No se encontraron rudimentos con esos criterios de búsqueda.'}
              </p>
              {selectedCategory === 'custom' ? (
                <button
                  type="button"
                  onClick={() => {
                    setSaveName('Mi Rudimento');
                    setIsSaveModalOpen(true);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 text-xs font-mono font-bold hover:bg-violet-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear mi primer rudimento</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-synth-cyan hover:underline text-xs cursor-pointer"
                >
                  Restablecer filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRudiments.map((rudiment) => {
                const isPreviewing = previewingId === rudiment.id;
                const catMeta = RUDIMENT_CATEGORIES.find((c) => c.id === rudiment.category);

                return (
                  <div
                    key={rudiment.id}
                    className={`rounded-2xl p-4 transition-all border flex flex-col justify-between gap-3 ${
                      rudiment.isCustom
                        ? isPreviewing
                          ? 'bg-surface-slate/90 border-violet-400 shadow-[0_0_25px_rgba(168,85,247,0.3)] ring-1 ring-violet-400'
                          : 'bg-surface-slate/50 border-violet-500/25 hover:border-violet-500/50'
                        : isPreviewing
                        ? 'bg-surface-slate/80 border-synth-cyan shadow-[0_0_20px_rgba(34,211,238,0.2)]'
                        : 'bg-surface-slate/40 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Top Bar of Card */}
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-semibold ${
                                catMeta?.badge || 'bg-white/10 text-gray-300 border-white/10'
                              }`}
                            >
                              {catMeta?.label || rudiment.category}
                            </span>

                            {rudiment.isCustom && (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-gradient-to-r from-violet-500/20 to-cyan-500/20 text-cyan-300 border border-violet-500/40 font-bold flex items-center gap-1 shadow-sm">
                                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                <span>Personal</span>
                              </span>
                            )}

                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400">
                              {rudiment.difficulty}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400">
                              Sub: 1/{rudiment.subdivision === 0.25 ? '1' : rudiment.subdivision}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-1">
                            {rudiment.name}
                          </h3>
                        </div>

                        {/* Preview Audio Button */}
                        <button
                          type="button"
                          onClick={() => handlePreviewAudio(rudiment)}
                          className={`p-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0 ${
                            isPreviewing
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                              : 'bg-white/5 text-gray-300 hover:text-synth-cyan hover:bg-white/10 border border-white/10'
                          }`}
                          title="Escuchar audio de muestra"
                        >
                          {isPreviewing ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span className="text-[10px]">Stop</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current text-synth-cyan" />
                              <span className="text-[10px]">Preview</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-gray-400 leading-relaxed mb-3">
                        {rudiment.description}
                      </p>

                      {/* Mini Score Preview Visualizer */}
                      <MiniScorePreview
                        rudiment={rudiment}
                        voicing={voicing}
                        className="mb-3"
                      />
                    </div>

                    {/* Stamping Action Buttons (Dynamic Targets) */}
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInsertBatch(rudiment)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-sky-500/20 hover:from-cyan-500/30 hover:to-sky-500/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm truncate"
                        title={`Insertar en ${measuresLabel} • ${beatsLabel}`}
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">Insertar en {measuresLabel} • {beatsLabel}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillMeasures(rudiment)}
                        className="py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
                        title={`Llenar todos los tiempos de ${measuresLabel} con este rudimento`}
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span>Llenar {measuresLabel}</span>
                      </button>

                      {rudiment.isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomRudiment(rudiment.id)}
                          className="p-1.5 rounded-xl border border-transparent hover:border-rose-500/30 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Eliminar rudimento personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 px-6 border-t border-white/10 bg-surface-slate/40 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 font-mono gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-synth-cyan" />
            <span>
              Tip: Puedes seleccionar múltiples compases y tiempos a la vez para estampar patrones o fills instantáneamente.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar Vault
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL / DRAWER: CREAR / GUARDAR RUDIMENTO EN VAULT             */}
      {/* ============================================================== */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full h-[92vh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 border-t sm:border border-slate-200 dark:border-white/10 shadow-2xl transition-colors duration-200">
            {/* Mobile Pull Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-3 sm:p-4 flex justify-between items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-800 dark:text-cyan-300 flex-shrink-0">
                  <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                    Crear / Guardar Rudimento
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 font-mono truncate hidden sm:block">
                    Guarda patrones, diddles o fills personalizados en la base de datos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form wrapping body + sticky footer */}
            <form onSubmit={handleSaveRudimentSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Form Body: scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Columna 1 (Inputs de configuración) */}
                  <div className="space-y-3.5">
                    {/* Nombre */}
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                        Nombre del Rudimento / Fill *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="Ej: Mi Paradiddle Invertido, Linear Gospel Chop 6..."
                        value={saveName}
                        onChange={(e) => setSaveName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                      />
                    </div>

                    {/* Categoría, Dificultad y Subdivisión en 1 fila de 3 selects */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                          Categoría
                        </label>
                        <select
                          value={saveCategory}
                          onChange={(e) => setSaveCategory(e.target.value as RudimentCategory)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                        >
                          <option value="custom">Mis Rudimentos</option>
                          <option value="diddles">Diddles</option>
                          <option value="rolls">Rolls</option>
                          <option value="flams">Flams</option>
                          <option value="drags">Drags</option>
                          <option value="linear-chops">Chops & Fills</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                          Dificultad
                        </label>
                        <select
                          value={saveDifficulty}
                          onChange={(e) => setSaveDifficulty(e.target.value)}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                        >
                          <option value="Principiante">Principiante</option>
                          <option value="Intermedio">Intermedio</option>
                          <option value="Avanzado">Avanzado</option>
                          <option value="Virtuoso">Virtuoso</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                          Subdivisión
                        </label>
                        <select
                          value={saveSubdivision}
                          onChange={(e) => setSaveSubdivision(Number(e.target.value))}
                          className="w-full px-2 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                        >
                          <option value={4}>1/16</option>
                          <option value={2}>1/8</option>
                          <option value={3}>3:2</option>
                          <option value={6}>6:4</option>
                          <option value={8}>1/32</option>
                        </select>
                      </div>
                    </div>

                    {/* Modo de Origen */}
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                        Modo de Entrada / Origen
                      </label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setSaveOriginMode('score')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            saveOriginMode === 'score'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>Capturar de Partitura</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSaveOriginMode('manual')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            saveOriginMode === 'manual'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 shadow-sm'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          <Keyboard className="w-3.5 h-3.5" />
                          <span>Digitación Manual</span>
                        </button>
                      </div>
                    </div>

                    {/* Configuración de Captura de Partitura */}
                    {saveOriginMode === 'score' && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-gray-400">Ámbito:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSaveScope('beat')}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                                saveScope === 'beat'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              1 Pulso
                            </button>
                            <button
                              type="button"
                              onClick={() => setSaveScope('measure')}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                                saveScope === 'measure'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Compás Completo
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                          <span className="text-gray-400">Compás:</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalMeasures }, (_, i) => (
                              <button
                                key={`save-rud-m-${i}`}
                                type="button"
                                onClick={() => setSaveSourceMeasureIndex(i)}
                                className={`px-2 py-0.5 rounded-md border text-[11px] transition-all cursor-pointer ${
                                  saveSourceMeasureIndex === i
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                                    : 'border-white/10 text-gray-400 hover:text-white'
                                }`}
                              >
                                C{i + 1}
                              </button>
                            ))}
                          </div>

                          {saveScope === 'beat' && (
                            <>
                              <span className="text-gray-400 ml-1">Pulso:</span>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: totalBeats }, (_, i) => (
                                  <button
                                    key={`save-rud-b-${i}`}
                                    type="button"
                                    onClick={() => setSaveSourceBeatIndex(i)}
                                    className={`px-2 py-0.5 rounded-md border text-[11px] transition-all cursor-pointer ${
                                      saveSourceBeatIndex === i
                                        ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold'
                                        : 'border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    T{i + 1}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Descripción Opcional (reducida a 2 filas) */}
                    <div>
                      <label className="block text-xs font-mono font-bold text-gray-300 mb-1">
                        Descripción (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Comentario sobre la digitación, velocidad o técnica..."
                        value={saveDescription}
                        onChange={(e) => setSaveDescription(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Columna 2 (Digitación y Previsualización) */}
                  <div className="space-y-3.5 flex flex-col justify-between">
                    {/* Digitación Manual / Estado de Captura */}
                    {saveOriginMode === 'manual' ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <label className="font-bold text-gray-300">
                            Digitación R/L
                          </label>
                          <span className="text-[10px] text-gray-500">
                            &gt;R (acento), (L) (ghost), fR (flam)
                          </span>
                        </div>
                        <input
                          type="text"
                          value={manualStickingText}
                          onChange={(e) => setManualStickingText(e.target.value)}
                          placeholder="R L R R L R L L"
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-cyan-300 font-mono text-sm tracking-widest focus:outline-none focus:border-purple-400 transition-all"
                        />
                        {/* Quick token insertion buttons */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5 text-[10px] font-mono">
                          <span className="text-gray-500">Insertar:</span>
                          {['R', 'L', 'K', '>R', '>L', '(R)', '(L)', 'fR', 'fL', 'dR', 'dL'].map((tok) => (
                            <button
                              key={tok}
                              type="button"
                              onClick={() => {
                                setManualStickingText((prev) =>
                                  prev ? `${prev.trim()} ${tok}` : tok
                                );
                              }}
                              className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-gray-300 hover:text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
                            >
                              {tok}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-gray-300">
                          <span className="font-bold text-cyan-400">Origen de Partitura:</span>
                          <span className="text-gray-400">
                            {saveScope === 'beat'
                              ? `Compás ${saveSourceMeasureIndex + 1} • Tiempo ${saveSourceBeatIndex + 1}`
                              : `Compás ${saveSourceMeasureIndex + 1} Completo`}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Se han capturado {livePreviewSteps.length} notas con sus acentos, notas fantasma y asignación de instrumentos.
                        </p>
                      </div>
                    )}

                    {/* Previsualización en Partitura */}
                    <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-gray-300">Previsualización en Partitura:</span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          {livePreviewSteps.length} notas • Sub: 1/{saveSubdivision}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center min-h-[90px]">
                        <MiniScorePreview
                          rudiment={livePreviewRudiment}
                          voicing={voicing}
                          width={340}
                          height={70}
                        />
                      </div>
                      <p className="text-[10px] font-mono text-gray-500 text-center">
                        Renderizado dinámico de notación según voicing ({voicing === 'kit' ? 'Kit / Chops' : 'Caja Sola'})
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 p-3 sm:p-4 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-mono text-center"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !saveName.trim() || livePreviewSteps.length === 0}
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
                      <span>Guardar en Base de Datos</span>
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
