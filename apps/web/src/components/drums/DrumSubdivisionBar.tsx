'use client';

import React from 'react';
import { SUBDIVISION_OPTIONS } from '@/types/drum';
import { Sparkles, Zap, Trash2, HelpCircle } from 'lucide-react';

interface DrumSubdivisionBarProps {
  selectedBeatIndex: number;
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
  onOpenLegend: () => void;
}

export default function DrumSubdivisionBar({
  selectedBeatIndex,
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
  onOpenLegend,
}: DrumSubdivisionBarProps) {
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
                onClick={() => onChangeSubdivision(opt.value)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
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
                onClick={() => onChangeSubdivision(opt.value)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
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
          onClick={onToggleAccent}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
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
          onClick={onToggleGhost}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
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
          onClick={onToggleRest}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
            isRest || !hasHits
              ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
              : 'bg-surface-slate border-white/10 text-gray-300 hover:border-sky-500/40 hover:text-sky-300'
          }`}
          title="Convertir pulso/subdivisión en Silencio percusivo (Atajo: Z o 0)"
        >
          <span className="text-sm font-serif font-black">𝄽</span>
          <span>Silencio [Z]</span>
        </button>

        {/* Clear Step Button */}
        <button
          onClick={onClearStep}
          className="p-1.5 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/40 transition-all cursor-pointer"
          title="Borrar Nota Actual [Del / Backspace]"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Legend / Shortcut Help Modal Button */}
        <button
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
