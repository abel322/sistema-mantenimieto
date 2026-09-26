'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Sparkles, Plus, Check } from 'lucide-react';
import { DrumMeasure } from '@/types/drum';

interface SaveExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  bpm: number;
  timeSignature: [number, number];
  measures: DrumMeasure[];
  onSave: (title: string, tags: string[]) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `Rutina ${bpm} BPM`;
    onSave(finalTitle, selectedTags);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-deep/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-card border border-white/10 shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-glow-cyan">
              <Save className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Guardar Ejercicio / Rutina
              </h2>
              <p className="text-xs text-gray-400">
                Almacena tu composición para practicarla y recuperarla en cualquier momento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Preview Bar */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-surface-slate border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">TEMPO</div>
            <div className="text-sm font-bold text-synth-cyan font-mono">{bpm} BPM</div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-slate border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">MÉTRICA</div>
            <div className="text-sm font-bold text-synth-violet font-mono">
              {timeSignature[0]}/{timeSignature[1]}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-slate border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">COMPASES</div>
            <div className="text-sm font-bold text-amber-400 font-mono">{measures.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-slate border border-white/5">
            <div className="text-[10px] font-mono text-gray-400">GOLPES</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{totalHitsCount}</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-1.5">
              Título del Ejercicio
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Práctica Paradiddle 110 BPM, Fill Gospel Compás 2..."
              className="w-full px-4 py-2.5 rounded-xl bg-surface-dark border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-synth-cyan focus:ring-1 focus:ring-synth-cyan transition-all"
            />
          </div>

          {/* Tags Selection */}
          <div>
            <label className="block text-xs font-mono font-bold text-gray-300 uppercase mb-2">
              Etiquetas / Categorías
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {DEFAULT_TAG_OPTIONS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm font-bold'
                        : 'bg-surface-slate border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-cyan-400" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Tag input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag(e);
                  }
                }}
                placeholder="+ Agregar etiqueta personalizada..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-surface-dark border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-synth-cyan"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 hover:text-white"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-slate border border-white/10 text-xs font-mono text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-electric hover:opacity-95 text-white text-xs font-mono font-bold transition-all shadow-glow-violet flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar en Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
