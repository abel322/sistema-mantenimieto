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
    <div className="w-full box-border rounded-2xl bg-[#0E1526]/90 backdrop-blur-md border border-white/10 p-3 sm:p-4 shadow-xl text-white">
      {/* ======================================================== */}
      {/* Botones de figuras y dinámicas juntos y alineados sin huecos */}
      {/* ======================================================== */}
      <div className="flex items-center justify-start gap-3 flex-wrap w-full">
        {/* Label Identificador */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="p-1 rounded-md bg-gradient-electric text-white">
            <Zap className="w-3.5 h-3.5" />
          </span>
          <span className="text-xs font-mono font-bold text-gray-200 whitespace-nowrap">
            FIGURA / SUBDIVISIÓN T{selectedBeatIndex + 1}:
          </span>
        </div>

        {/* Botones Regulares (1/1, 1/2, 1/4, 1/8, 1/16, 1/32) */}
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-white/10 flex-shrink-0">
          <span className="text-[10px] font-mono text-gray-400 uppercase px-1.5 font-semibold">
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
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
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
        <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-white/10 flex-shrink-0">
          <span className="text-[10px] font-mono text-purple-400 uppercase px-1.5 font-semibold flex items-center gap-1">
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
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 select-none cursor-pointer flex-shrink-0 whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-glow-violet'
                    : 'text-purple-300 hover:text-white hover:bg-white/5'
                }`}
                title={`${opt.nameEs} (${opt.label}) - Atajo [${opt.shortcut}]`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] opacity-75 font-normal hidden xs:inline">[{opt.shortcut}]</span>
              </button>
            );
          })}
        </div>

        {/* Separador vertical sutil */}
        <div className="hidden sm:block w-px h-6 bg-white/10 mx-0.5" />

        {/* Botones de dinámica rítmica (Acento, Ghost, Silencio, Síncopa) */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {/* Accent Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleAccent}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none flex-shrink-0 whitespace-nowrap ${
              isAccentActive
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.45)] ring-1 ring-amber-400'
                : 'bg-[#111827] border-white/10 text-gray-300 hover:border-amber-500/40 hover:text-amber-300'
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
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none flex-shrink-0 whitespace-nowrap ${
              isGhostActive
                ? 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.45)] ring-1 ring-purple-400'
                : 'bg-[#111827] border-white/10 text-gray-300 hover:border-purple-500/40 hover:text-purple-300'
            }`}
            title="Alternar Ghost Note (Atajo: G o ()"
          >
            <span className="text-xs font-bold">(•)</span>
            <span>Ghost [G]</span>
            {isGhostActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse ml-0.5" />}
          </button>

          {/* Rest Button */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleRest}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none flex-shrink-0 whitespace-nowrap ${
              isRest
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400'
                : 'bg-[#111827] border-white/10 text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300'
            }`}
            title="Alternar Silencio (Atajo: Z o 0)"
          >
            <span className="text-sm font-serif font-black mr-0.5">𝄽</span>
            <span>Silencio [Z]</span>
            {isRest && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />}
          </button>

          {/* Syncopate Button */}
          {onToggleSyncopate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onToggleSyncopate}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none flex-shrink-0 whitespace-nowrap ${
                isSyncopated || isTied
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-1 ring-amber-400'
                  : 'bg-[#111827] border-white/10 text-gray-300 hover:border-amber-500/40 hover:text-amber-300'
              }`}
              title="𝄐 Síncopa / Push: Anticipa el golpe [Atajo: S o P]"
            >
              <span className="text-sm leading-none">𝄐</span>
              <span>Síncopa [S]</span>
              {(isSyncopated || isTied) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
              )}
            </button>
          )}

          {/* Switch: Destacar Síncopas */}
          {onToggleHighlightSyncopations && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onToggleHighlightSyncopations}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none flex-shrink-0 whitespace-nowrap ${
                highlightSyncopations
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-400'
                  : 'bg-[#111827] border-white/10 text-gray-400 hover:text-amber-300 hover:border-amber-400'
              }`}
              title="Activar switch pedagógico para destacar notas sincopadas y ligaduras"
            >
              <span className="text-sm">𝄐</span>
              <span>Destacar Síncopas</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  highlightSyncopations ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'
                }`}
              />
            </button>
          )}

          {/* Clear & Delete Options Popover Menu */}
          <div className="relative flex-shrink-0" ref={trashMenuRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsTrashMenuOpen((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 flex-shrink-0 ${
                isTrashMenuOpen
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'bg-[#111827] border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/40'
              }`}
              title="Opciones de borrado"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {isTrashMenuOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 bottom-full mb-2 w-64 rounded-2xl bg-[#0E1526]/95 border border-white/15 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 flex flex-col gap-1 text-xs font-mono text-white">
                <div className="px-2.5 py-1 text-[10px] text-gray-500 uppercase tracking-wider font-bold border-b border-white/10 mb-1">
                  Opciones de Borrado
                </div>

                {/* Vaciar compás */}
                <button
                  type="button"
                  onClick={() => {
                    onClearMeasure();
                    setIsTrashMenuOpen(false);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left hover:bg-amber-500/15 hover:text-amber-300 text-gray-300 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold">Vaciar compás C{selectedMeasureIndex + 1}</span>
                    <span className="text-[10px] text-gray-500">Convierte todas las notas en silencios</span>
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
                      ? 'opacity-40 cursor-not-allowed text-gray-600'
                      : 'hover:bg-rose-500/15 hover:text-rose-300 text-gray-300 cursor-pointer'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold">Eliminar compás por completo</span>
                    <span className="text-[10px] text-gray-500">
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
                  className="w-full px-2.5 py-1.5 rounded-xl text-left hover:bg-white/5 text-gray-400 hover:text-white transition-all flex items-center gap-2 cursor-pointer border-t border-white/10 mt-1"
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
            className="px-3 py-1.5 rounded-xl bg-[#111827] border border-white/10 hover:border-synth-cyan/50 text-xs font-mono text-gray-300 hover:text-synth-cyan transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap"
            title="Ver Guía de Notación y Atajos"
          >
            <HelpCircle className="w-3.5 h-3.5 text-synth-cyan" />
            <span>Atajos</span>
          </button>
        </div>
      </div>
    </div>
  );
}
