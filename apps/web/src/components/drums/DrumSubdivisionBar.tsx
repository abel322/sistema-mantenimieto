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
  isSyncopated?: boolean;
  isTied?: boolean;
  highlightSyncopations?: boolean;
  onChangeSubdivision: (sub: number) => void;
  onToggleAccent: () => void;
  onToggleGhost: () => void;
  onToggleRest: () => void;
  onToggleSyncopate?: () => void;
  onToggleHighlightSyncopations?: () => void;
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
  isSyncopated,
  isTied,
  highlightSyncopations,
  onChangeSubdivision,
  onToggleAccent,
  onToggleGhost,
  onToggleRest,
  onToggleSyncopate,
  onToggleHighlightSyncopations,
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
    <div className="w-full rounded-2xl bg-white/95 dark:bg-[#0B0F19]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 p-3 sm:p-4 shadow-sm dark:shadow-2xl space-y-2.5 sm:space-y-3 transition-colors duration-200">
      {/* ======================================================== */}
      {/* LÍNEA 1: Selector de Figuras y Subdivisiones             */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-0.5 w-full">
        {/* Label Identificador */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="p-1 rounded-md bg-gradient-electric text-white">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-mono font-bold text-slate-800 dark:text-gray-200 whitespace-nowrap">
            FIGURA / SUBDIVISIÓN T{selectedBeatIndex + 1}:
          </span>
        </div>

        {/* Botones Regulares (1/1, 1/2, 1/4, 1/8, 1/16, 1/32) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111827] p-1 rounded-xl border border-slate-200 dark:border-white/5 flex-shrink-0">
          <span className="text-[10px] font-mono text-slate-500 dark:text-gray-500 uppercase px-1.5 font-semibold">
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
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 select-none cursor-pointer flex-shrink-0 whitespace-nowrap ${
                  isSelected
                    ? 'bg-synth-cyan text-black shadow-glow-cyan'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title={`${opt.nameEs} (${opt.label}) - Atajo [${opt.shortcut}]`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] opacity-75 font-normal hidden xs:inline">[{opt.shortcut}]</span>
              </button>
            );
          })}
        </div>

        {/* Botones Tuplets (3:2, 5:4, 6:4, 7:4, 9:8) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111827] p-1 rounded-xl border border-slate-200 dark:border-white/5 flex-shrink-0">
          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400 uppercase px-1.5 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
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
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 select-none cursor-pointer flex-shrink-0 whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-violet'
                    : 'text-purple-800 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-white/5'
                }`}
                title={`${opt.nameEs} (${opt.label}) - Atajo [${opt.shortcut}]`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] opacity-75 font-normal hidden xs:inline">[{opt.shortcut}]</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* LÍNEA 2: Acciones Rítmicas en Fila Horizontal Fluyente   */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-200 dark:border-white/10 w-full">
        {/* Accent Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleAccent}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
            isAccentActive
              ? 'bg-amber-100 dark:bg-amber-500/25 border-amber-400 text-amber-900 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-1 ring-amber-400'
              : 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-amber-500/40 hover:text-amber-800 dark:hover:text-amber-300'
          }`}
          title="Alternar Acento (Atajo: A o >)"
        >
          <span className="text-sm font-black">&gt;</span>
          <span>Acento [A]</span>
          {isAccentActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse ml-0.5" />}
        </button>

        {/* Ghost Note Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleGhost}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
            isGhostActive
              ? 'bg-purple-100 dark:bg-purple-500/25 border-purple-400 text-purple-900 dark:text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.45)] ring-1 ring-purple-400'
              : 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-purple-500/40 hover:text-purple-800 dark:hover:text-purple-300'
          }`}
          title="Alternar Ghost Note (Atajo: G o ()"
        >
          <span className="text-xs font-bold">(•)</span>
          <span>Ghost [G]</span>
          {isGhostActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse ml-0.5" />}
        </button>

        {/* Rest Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onToggleRest}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
            isRest
              ? 'bg-cyan-100 dark:bg-cyan-500/20 border-cyan-400 text-cyan-900 dark:text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400'
              : 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-cyan-500/40 hover:text-cyan-800 dark:hover:text-cyan-300'
          }`}
          title="Alternar Silencio (Atajo: Z o 0)"
        >
          <span className="text-sm font-serif font-black mr-0.5">𝄽</span>
          <span>Silencio [Z]</span>
          {isRest && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse ml-0.5" />}
        </button>

        {/* Syncopate Button */}
        {onToggleSyncopate && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleSyncopate}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
              isSyncopated || isTied
                ? 'bg-amber-100 dark:bg-amber-500/25 border-amber-400 text-amber-900 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                : 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-amber-500/40 hover:text-amber-800 dark:hover:text-amber-300'
            }`}
            title="𝄐 Síncopa / Push: Anticipa el golpe [Atajo: S o P]"
          >
            <span className="text-sm leading-none">𝄐</span>
            <span>Síncopa [S]</span>
            {(isSyncopated || isTied) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse ml-0.5" />
            )}
          </button>
        )}

        {/* Separador vertical sutil */}
        <div className="hidden sm:block w-px h-5 bg-slate-300 dark:bg-white/10 mx-0.5" />

        {/* Switch: Destacar Síncopas */}
        {onToggleHighlightSyncopations && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleHighlightSyncopations}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
              highlightSyncopations
                ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-400 text-amber-900 dark:text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-400'
                : 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-amber-800 dark:hover:text-amber-300 hover:border-amber-400'
            }`}
            title="Activar switch pedagógico para destacar notas sincopadas y ligaduras"
          >
            <span className="text-sm">𝄐</span>
            <span>Destacar Síncopas</span>
            <span
              className={`w-2 h-2 rounded-full ${
                highlightSyncopations ? 'bg-amber-500 dark:bg-amber-400 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'
              }`}
            />
          </button>
        )}

        {/* Clear & Delete Options Popover Menu */}
        <div className="relative" ref={trashMenuRef}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsTrashMenuOpen((prev) => !prev)}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
              isTrashMenuOpen
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-700 dark:text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                : 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/40'
            }`}
            title="Opciones de borrado"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isTrashMenuOpen && (
            <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 w-64 rounded-2xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200 dark:border-white/15 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 flex flex-col gap-1 text-xs font-mono">
              <div className="px-2.5 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-white/5 mb-1">
                Opciones de Borrado
              </div>

              {/* Vaciar compás */}
              <button
                type="button"
                onClick={() => {
                  onClearMeasure();
                  setIsTrashMenuOpen(false);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-amber-500/15 hover:text-amber-800 dark:hover:text-amber-300 text-slate-700 dark:text-gray-300 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold">Vaciar compás C{selectedMeasureIndex + 1}</span>
                  <span className="text-[10px] text-slate-500 dark:text-gray-500">Convierte todas las notas en silencios</span>
                </div>
              </button>

              {/* Eliminar compás */}
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
                    ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                    : 'hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300 text-slate-700 dark:text-gray-300 cursor-pointer'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold">Eliminar compás por completo</span>
                  <span className="text-[10px] text-slate-500 dark:text-gray-500">
                    {measuresCount <= 1
                      ? 'No permitido (mínimo 1 compás)'
                      : `Remueve el Compás C${selectedMeasureIndex + 1}`}
                  </span>
                </div>
              </button>

              {/* Borrar nota activa */}
              <button
                type="button"
                onClick={() => {
                  onClearStep();
                  setIsTrashMenuOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-slate-200 dark:hover:bg-white/5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer border-t border-slate-200 dark:border-white/5 mt-1"
              >
                <X className="w-3.5 h-3.5 flex-shrink-0" />
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
          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-white/10 hover:border-synth-cyan/50 text-xs font-mono text-slate-700 dark:text-gray-300 hover:text-cyan-800 dark:hover:text-synth-cyan transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          title="Ver Guía de Notación y Atajos"
        >
          <HelpCircle className="w-3.5 h-3.5 text-synth-cyan" />
          <span>Atajos</span>
        </button>
      </div>
    </div>
  );
}
