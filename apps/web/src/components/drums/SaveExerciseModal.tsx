'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Plus, Check, Loader2, AlertCircle } from 'lucide-react';
import { DrumMeasure } from '@/types/drum';
import MiniScorePreview from './MiniScorePreview';

interface SaveExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
  timeSignature: [number, number];
  measures: DrumMeasure[];
  onSave: (title: string, tags: string[]) => Promise<any> | void;
}

const DEFAULT_TAG_OPTIONS = [
  'Groove',
  'Fills',
  'Rudimentos',
  'Independencia',
  'Técnica',
  'Polirritmia',
  'Gospel Chops',
  'Rock Pocket',
];

export default function SaveExerciseModal({
  isOpen,
  onClose,
  bpm,
  timeSignature,
  measures,
  onSave,
}: SaveExerciseModalProps) {
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Groove']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Count total hits across all measures
  const totalHitsCount = measures.reduce((acc, m) => {
    return (
      acc +
      m.beats.reduce((bAcc, b) => {
        return bAcc + b.steps.reduce((sAcc, s) => sAcc + (s.hits?.length || 0), 0);
      }, 0)
    );
  }, 0);

  useEffect(() => {
    if (isOpen) {
      const defaultName = `Rutina ${bpm} BPM (${measures.length} ${
        measures.length === 1 ? 'compás' : 'compases'
      })`;
      setTitle(defaultName);
      setIsSaving(false);
      setErrorMessage(null);
    }
  }, [isOpen, bpm, measures.length]);

  if (!isOpen) return null;

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTagInput.trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags([...selectedTags, clean]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `Rutina ${bpm} BPM`;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await onSave(finalTitle, selectedTags);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al persistir la rutina en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-[#0B0F19] border border-white/10 text-white rounded-2xl shadow-2xl p-6 flex flex-col gap-5 custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] flex-shrink-0">
              <Save className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white tracking-tight truncate">
                Guardar Ejercicio / Rutina
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Almacena tu composición en la nube para practicarla en cualquier momento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stats Preview Bar */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase">TEMPO</div>
            <div className="text-sm font-bold text-cyan-400 font-mono">{bpm} BPM</div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase">MÉTRICA</div>
            <div className="text-sm font-bold text-purple-400 font-mono">
              {timeSignature[0]}/{timeSignature[1]}
            </div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase">COMPASES</div>
            <div className="text-sm font-bold text-amber-400 font-mono">{measures.length}</div>
          </div>
          <div className="bg-black/50 border border-white/10 rounded-xl p-2.5 text-center">
            <div className="text-[10px] font-mono text-slate-400 uppercase">GOLPES</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{totalHitsCount}</div>
          </div>
        </div>

        {/* Mini Score Preview */}
        {measures.length > 0 && (
          <div className="rounded-xl bg-black/50 border border-white/10 p-3 flex flex-col gap-2 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Previsualización de Notación Guardada
              </span>
              <span className="text-slate-500 text-[10px]">
                {measures.length === 1 ? '1 Compás' : `Primeros compases de ${measures.length}`}
              </span>
            </div>
            <div className="w-full flex justify-center py-1 bg-slate-950/60 rounded-lg border border-white/5">
              <MiniScorePreview
                measures={measures.slice(0, 2)}
                timeSignature={timeSignature}
                width={440}
                height={74}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1.5">
              Título del Ejercicio
            </label>
            <input
              type="text"
              required
              disabled={isSaving}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Práctica Paradiddle 110 BPM, Fill Gospel Compás 2..."
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm font-mono transition-all disabled:opacity-50"
            />
          </div>

          {/* Tags Selection */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-2">
              Etiquetas / Categorías
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {DEFAULT_TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleToggleTag(tag)}
                    data-selected={isSelected}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer border bg-slate-800/80 border-white/10 text-slate-300 hover:border-cyan-400 data-[selected=true]:bg-cyan-500/20 data-[selected=true]:border-cyan-500 data-[selected=true]:text-cyan-300 data-[selected=true]:font-bold shadow-sm disabled:opacity-50"
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Tag input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                disabled={isSaving}
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(e);
                  }
                }}
                placeholder="+ Agregar etiqueta personalizada..."
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isSaving || !customTagInput.trim()}
                onClick={handleAddCustomTag}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-40"
              >
                + Agregar
              </button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Guardando en la Nube...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar en la Nube</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
