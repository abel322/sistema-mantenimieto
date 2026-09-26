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
  ArrowRight,
  Disc3,
  Layers,
  Volume2,
} from 'lucide-react';
import { RudimentItem, RudimentCategory, VoicingMode, DrumPieceId, DRUM_PIECES } from '@/types/drum';
import { RUDIMENTS_DATA, RUDIMENT_CATEGORIES } from '@/lib/rudimentsData';

interface RudimentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMeasureIndex: number;
  selectedBeatIndex: number;
  onInsertInBeat: (rudiment: RudimentItem, voicing: VoicingMode) => void;
  onFillMeasure: (rudiment: RudimentItem, voicing: VoicingMode) => void;
  onPlayHit: (pieceId: DrumPieceId, accent?: boolean, ghost?: boolean) => void;
}

export default function RudimentLibraryModal({
  isOpen,
  onClose,
  selectedMeasureIndex,
  selectedBeatIndex,
  onInsertInBeat,
  onFillMeasure,
  onPlayHit,
}: RudimentLibraryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<RudimentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [voicing, setVoicing] = useState<VoicingMode>('kit');
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [insertedNotice, setInsertedNotice] = useState<string | null>(null);

  const previewTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Stop any ongoing preview playback
  const stopPreview = () => {
    previewTimersRef.current.forEach((t) => clearTimeout(t));
    previewTimersRef.current = [];
    setPreviewingId(null);
  };

  useEffect(() => {
    if (!isOpen) {
      stopPreview();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  // Filter rudiments by category and search query
  const filteredRudiments = useMemo(() => {
    return RUDIMENTS_DATA.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query)) ||
        item.steps.map((s) => s.sticking).join('').toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Handle interactive preview playback
  const handlePreviewAudio = (rudiment: RudimentItem) => {
    if (previewingId === rudiment.id) {
      stopPreview();
      return;
    }

    stopPreview();
    setPreviewingId(rudiment.id);

    const bpm = rudiment.defaultBpm;
    // Beat duration in ms: 60000 / BPM
    const beatDurationMs = 60000 / bpm;
    // Step duration depends on subdivision
    const stepDurationMs = beatDurationMs / rudiment.subdivision;

    // Play 2 cycles of the pattern
    const totalSteps = [...rudiment.steps, ...rudiment.steps];

    totalSteps.forEach((step, idx) => {
      const delay = idx * stepDurationMs;
      const timer = setTimeout(() => {
        let piece: DrumPieceId = 'snare';
        if (voicing === 'snare') {
          piece = step.sticking === 'K' ? 'kick' : 'snare';
        } else {
          piece = step.kitPiece || (step.sticking === 'K' ? 'kick' : 'snare');
        }

        // If it's a flam, trigger grace hit right before main hit
        if (step.flam) {
          onPlayHit('snare', false, true);
          setTimeout(() => {
            onPlayHit(piece, step.accent, false);
          }, 35);
        } else {
          onPlayHit(piece, step.accent, step.ghost);
        }

        // When the final note plays, reset previewing indicator
        if (idx === totalSteps.length - 1) {
          const endTimer = setTimeout(() => {
            setPreviewingId(null);
          }, stepDurationMs);
          previewTimersRef.current.push(endTimer);
        }
      }, delay);

      previewTimersRef.current.push(timer);
    });
  };

  const handleInsertBeat = (rudiment: RudimentItem) => {
    onInsertInBeat(rudiment, voicing);
    setInsertedNotice(`¡"${rudiment.name}" insertado en el Tiempo ${selectedBeatIndex + 1}!`);
    setTimeout(() => setInsertedNotice(null), 2500);
  };

  const handleFillMeasure = (rudiment: RudimentItem) => {
    onFillMeasure(rudiment, voicing);
    setInsertedNotice(`¡"${rudiment.name}" extendido a todo el Compás ${selectedMeasureIndex + 1}!`);
    setTimeout(() => setInsertedNotice(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-deep/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-surface-card border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-slate/40">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-glow-cyan">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Rudiment & Fill Vault
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  PAS 40 & Chops
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Biblioteca inteligente de rudimentos percusivos, digitaciones R/L y drum fills con orquestación automática
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Voicing Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-surface-dark rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setVoicing('snare')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
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
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
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

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/5 space-y-3 bg-surface-slate/20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, digitación (ej: R L R R), etiqueta..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-dark border border-white/10 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-synth-cyan transition-all"
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

            {/* Target indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-dark border border-white/5 text-[11px] font-mono text-gray-400 flex-shrink-0">
              <span className="w-2 h-2 rounded-full bg-synth-cyan animate-pulse" />
              <span>
                Destino activo: <strong className="text-white">Compás {selectedMeasureIndex + 1}</strong> •{' '}
                <strong className="text-synth-cyan">Tiempo {selectedBeatIndex + 1}</strong>
              </span>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-synth-cyan text-black shadow-glow-cyan'
                  : 'bg-surface-slate border border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              Todos ({RUDIMENTS_DATA.length})
            </button>

            {RUDIMENT_CATEGORIES.map((cat) => {
              const count = RUDIMENTS_DATA.filter((r) => r.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border ${
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
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{insertedNotice}</span>
          </div>
        )}

        {/* Rudiments Grid List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {filteredRudiments.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-mono text-sm space-y-2">
              <p>No se encontraron rudimentos con esos criterios de búsqueda.</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-synth-cyan hover:underline text-xs"
              >
                Restablecer filtros
              </button>
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
                      isPreviewing
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
                              {catMeta?.label}
                            </span>
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
                          className={`p-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
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

                      {/* Sticking / Dynamic Sequence Visualizer */}
                      <div className="p-2.5 rounded-xl bg-surface-dark border border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none mb-3">
                        <span className="text-[10px] font-mono text-gray-500 uppercase mr-1">
                          Digitación:
                        </span>
                        {rudiment.steps.map((st, sIdx) => {
                          const isR = st.sticking === 'R';
                          const isL = st.sticking === 'L';
                          const isK = st.sticking === 'K';

                          let badgeColor = 'bg-white/10 text-gray-300 border-white/20';
                          if (isR) badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
                          else if (isL) badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                          else if (isK) badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                          const activeKitPiece =
                            voicing === 'kit'
                              ? st.kitPiece || (st.sticking === 'K' ? 'kick' : 'snare')
                              : st.sticking === 'K' ? 'kick' : 'snare';
                          const pieceMeta = DRUM_PIECES[activeKitPiece];

                          return (
                            <div
                              key={sIdx}
                              className="flex flex-col items-center gap-0.5"
                              title={`${st.sticking} • ${pieceMeta?.name || 'Snare'}${
                                st.accent ? ' (Acento)' : ''
                              }${st.ghost ? ' (Ghost)' : ''}${st.flam ? ' (Flam)' : ''}`}
                            >
                              <div
                                className={`w-6 h-6 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center border relative select-none ${badgeColor} ${
                                  st.accent
                                    ? 'ring-1 ring-amber-400 font-black shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                    : ''
                                } ${st.ghost ? 'opacity-60 scale-90' : ''}`}
                              >
                                {st.flam && (
                                  <span className="text-[8px] font-serif absolute -top-1.5 -left-1 text-amber-400">
                                    º
                                  </span>
                                )}
                                <span>{st.ghost ? `(${st.sticking})` : st.sticking}</span>
                              </div>
                              <span className="text-[8px] font-mono text-gray-500 truncate max-w-[28px]">
                                {pieceMeta?.shortName.slice(0, 3) || 'Snr'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stamping Action Buttons */}
                    <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInsertBeat(rudiment)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-sky-500/20 hover:from-cyan-500/30 hover:to-sky-500/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        title={`Insertar en el Tiempo ${selectedBeatIndex + 1} de la medida actual`}
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Pulso T{selectedBeatIndex + 1}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleFillMeasure(rudiment)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 border border-purple-500/40 hover:border-purple-400 text-purple-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        title={`Llenar todo el Compás ${selectedMeasureIndex + 1} con este rudimento`}
                      >
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span>Compás C{selectedMeasureIndex + 1}</span>
                      </button>
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
              Tip: Los rudimentos insertados sincronizan dinámicas y anotaciones R/L directamente en la partitura VexFlow.
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
    </div>
  );
}
