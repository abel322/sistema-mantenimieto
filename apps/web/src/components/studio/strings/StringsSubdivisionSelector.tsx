'use client';

import React from 'react';
import { PracticeSubdivision, STRINGS_SUBDIVISIONS } from '@/types/strings';
import { Zap, Sparkles } from 'lucide-react';

export interface StringsSubdivisionSelectorProps {
  currentSubdivision?: PracticeSubdivision;
  onChangeSubdivision?: (sub: PracticeSubdivision) => void;
  value?: PracticeSubdivision;
  onChange?: (sub: PracticeSubdivision) => void;
  compact?: boolean;
}

export default function StringsSubdivisionSelector({
  currentSubdivision,
  onChangeSubdivision,
  value,
  onChange,
  compact = false,
}: StringsSubdivisionSelectorProps) {
  const selectedSub = value ?? currentSubdivision ?? '8n';
  const triggerChange = (sub: PracticeSubdivision) => {
    if (onChange) onChange(sub);
    if (onChangeSubdivision) onChangeSubdivision(sub);
  };

  const regularSubdivisions = STRINGS_SUBDIVISIONS.filter((s) => !s.isTuplet);
  const tupletSubdivisions = STRINGS_SUBDIVISIONS.filter((s) => s.isTuplet);

  return (
    <div className="flex items-center gap-2 flex-wrap text-xs font-mono select-none">
      {/* 1. Panel de Figuras Regulares */}
      <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 shadow-sm flex-wrap">
        <span className="text-[10px] text-cyan-400 font-extrabold uppercase px-1.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Regulares:
        </span>
        {regularSubdivisions.map((sub) => {
          const isSelected = selectedSub === sub.id;

          return (
            <button
              key={`sub-regular-${sub.id}`}
              type="button"
              onClick={() => triggerChange(sub.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title={sub.desc}
            >
              <span className="opacity-75 text-[10px] mr-1">{sub.badge}</span>
              <span>{sub.nameEs}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Panel de Subdivisiones Irregulares (Tuplets / Polirritmia) */}
      <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 shadow-sm flex-wrap">
        <span className="text-[10px] text-purple-400 font-extrabold uppercase px-1.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Tuplets:
        </span>
        {tupletSubdivisions.map((sub) => {
          const isSelected = selectedSub === sub.id;

          return (
            <button
              key={`sub-tuplet-${sub.id}`}
              type="button"
              onClick={() => triggerChange(sub.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title={sub.desc}
            >
              <span className="opacity-75 text-[10px] mr-1 font-mono">{sub.badge}</span>
              <span>{sub.nameEs}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
