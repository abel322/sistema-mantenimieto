'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SUBDIVISION_OPTIONS } from '@/types/drum';
import { Sparkles, Zap, Trash2, HelpCircle, RotateCcw, X } from 'lucide-react';

interface DrumSubdivisionBarProps {
  selectedBeatIndex: number;
  selectedMeasureIndex?: number;
  measuresCount?: number;
  currentSubdivision: number;
  isTuplet?: boolean;
  hasAccent?: boolean;
  hasGhost?: boolean;
  hasHits?: boolean;
  isAccentMode?: boolean;
  isGhostMode?: boolean;
  isRest?: boolean;
  onChangeSubdivision: (sub: number) => void;
  onToggleAccent: () => void;
  onToggleGhost: () => void;
  onToggleRest: () => void;
  onClearStep: () => void;
  onClearMeasure: () => void;
  onRemoveMeasure?: () => void;
  onOpenLegend: () => void;
}

export default function DrumSubdivisionBar({
  selectedBeatIndex,
  selectedMeasureIndex = 0,
  measuresCount = 1,
  currentSubdivision,
  isTuplet,
  hasAccent,
  hasGhost,
  hasHits,
  isAccentMode,
  isGhostMode,
  isRest,
  onChangeSubdivision,
  onToggleAccent,
  onToggleGhost,
  onToggleRest,
  onClearStep,
  onClearMeasure,
  onRemoveMeasure,
  onOpenLegend,
}: DrumSubdivisionBarProps) {
  const [isTrashMenuOpen, setIsTrashMenuOpen] = useState(false);
  const trashMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trashMenuRef.current && !trashMenuRef.current.contains(e.target as Node)) {
        setIsTrashMenuOpen(false);
      }
    };
    if (isTrashMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTrashMenuOpen]);

  const regularOptions = SUBDIVISION_OPTIONS.filter((o) => !o.isTuplet);
  const tupletOptions = SUBDIVISION_OPTIONS.filter((o) => o.isTuplet);

  const isAccentActive = hasAccent || isAccentMode;
  const isGhostActive = hasGhost || isGhostMode;

  return (
    <div className="w-full rounded-2xl bg-surface-card border border-white/10 p-4 shadow-glass flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Beat & Subdivision Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-gradient-electric text-white">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-mono font-bold text-gray-200">
            FIGURA / SUBDIVISIÓN T{selectedBeatIndex + 1}:
          </span>
        </div>

        {/* Regular Subdivisions (Whole 1/1, Half 1/2, Quarter 1/4, 8th 1/8, 16th 1/16, 32nd 1/32) */}
        <div className="flex items-center gap-1 bg-surface-slate p-1 rounded-xl border border-white/5">
          <span className="text-[10px] font-mono text-gray-500 uppercase px-2 font-semibold">
            Regulares
          </span>
          {regularOptions.map((opt) => {
            const isSelected = currentSubdivision === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChangeSubdivision(opt.value)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 select-none cursor-pointer ${
                  isSelected
                    ? 'bg-synth-cyan text-black shadow-glow-cyan'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
                title={`${opt.nameEs} (${opt.label}) - Atajo [${opt.shortcut}]`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] opacity-75 font-normal">[{opt.shortcut}]</span>
              </button>
            );
          })}
        </div>

        {/* Irregular Subdivisions / Tuplets (3:2, 5:4, 6:4, 7:4, 9:8) */}
        <div className="flex items-center gap-1 bg-surface-slate p-1 rounded-xl border border-white/5">
          <span className="text-[10px] font-mono text-purple-400 uppercase px-2 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            Tuplets
          </span>
          {tupletOptions.map((opt) => {
            const isSelected = currentSubdivision === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onChangeSubdivision(opt.value)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 select-none cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-glow-violet'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
                title={`${opt.nameEs} (${opt.label}) - Atajo [${opt.shortcut}]`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] opacity-75 font-normal">[{opt.shortcut}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamics, Rest & Articulations Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Accent Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleAccent}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
            isAccentActive
              ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-1 ring-amber-400'
              : 'bg-surface-slate border-white/10 text-gray-300 hover:border-amber-500/40 hover:text-amber-300'
          }`}
          title="Alternar Acento (Atajo: A o >)"
        >
          <span className="text-sm font-black">&gt;</span>
          <span>Acento [A]</span>
          {isAccentActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />}
        </button>

        {/* Ghost Note Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleGhost}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
            isGhostActive
              ? 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.45)] ring-1 ring-purple-400'
              : 'bg-surface-slate border-white/10 text-gray-300 hover:border-purple-500/40 hover:text-purple-300'
          }`}
          title="Alternar Ghost Note (Atajo: G o ()"
        >
          <span className="text-xs font-bold">(•)</span>
          <span>Ghost [G]</span>
          {isGhostActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse ml-0.5" />}
        </button>

        {/* Rest Toggle Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleRest}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
            isRest
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400'
              : 'bg-surface-slate border-white/10 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300'
          }`}
          title="Alternar Silencio percusivo (Atajo: Z o 0)"
        >
          <span className="text-sm font-serif font-black mr-1.5">𝄽</span>
          <span>Silencio [Z]</span>
          {isRest && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />}
        </button>

        {/* Clear & Delete Options Popover Menu */}
        <div className="relative" ref={trashMenuRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsTrashMenuOpen((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
              isTrashMenuOpen
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-surface-slate border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/40'
            }`}
            title="Opciones de borrado y eliminación de compás"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isTrashMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl bg-surface-dark/95 border border-white/15 p-2 shadow-2xl backdrop-blur-xl z-50 animate-fade-in flex flex-col gap-1 text-xs font-mono">
              <div className="px-2.5 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-white/5 mb-1">
                Opciones de Borrado
              </div>

              {/* Opción 1: Vaciar compás (convertir a silencios) */}
              <button
                type="button"
                onClick={() => {
                  onClearMeasure();
                  setIsTrashMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-amber-500/15 hover:text-amber-300 text-gray-300 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold">Vaciar compás C{selectedMeasureIndex + 1}</span>
                  <span className="text-[10px] text-gray-500">Convierte todas las notas en silencios</span>
                </div>
              </button>

              {/* Opción 2: Eliminar compás por completo */}
              <button
                type="button"
                disabled={measuresCount <= 1}
                onClick={() => {
                  if (onRemoveMeasure) {
                    onRemoveMeasure();
                  }
                  setIsTrashMenuOpen(false);
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-left transition-all flex items-center gap-2 ${
                  measuresCount <= 1
                    ? 'opacity-40 cursor-not-allowed text-gray-600'
                    : 'hover:bg-rose-500/15 hover:text-rose-300 text-gray-300 cursor-pointer'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold">Eliminar compás por completo</span>
                  <span className="text-[10px] text-gray-500">
                    {measuresCount <= 1
                      ? 'No permitido (mínimo 1 compás)'
                      : `Remueve el Compás C${selectedMeasureIndex + 1}`}
                  </span>
                </div>
              </button>

              {/* Opción 3: Borrar nota activa */}
              <button
                type="button"
                onClick={() => {
                  onClearStep();
                  setIsTrashMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-white/5 hover:text-white text-gray-400 transition-all flex items-center gap-2 cursor-pointer border-t border-white/5 mt-1"
              >
                <X className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>Borrar solo nota actual [Del]</span>
              </button>
            </div>
          )}
        </div>

        {/* Legend / Shortcut Help Modal Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onOpenLegend}
          className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-synth-cyan/50 text-xs font-mono text-gray-300 hover:text-synth-cyan transition-all flex items-center gap-1.5 cursor-pointer"
          title="Ver Guía de Notación y Atajos"
        >
          <HelpCircle className="w-3.5 h-3.5 text-synth-cyan" />
          <span>Atajos</span>
        </button>
      </div>
    </div>
  );
}
