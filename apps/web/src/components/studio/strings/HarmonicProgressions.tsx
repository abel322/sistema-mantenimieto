'use client';

import React, { useState, useMemo } from 'react';
import {
  MusicalKey,
  PracticeSubdivision,
  ProgressionAccompanimentStyle,
  HarmonicProgressionDef,
  STRINGS_SUBDIVISIONS,
} from '@/types/strings';
import {
  PROGRESSION_CATALOGUE,
} from '@/services/audio/stringsProgressionsEngine';
import {
  Sparkles,
  Music,
  ArrowRight,
  Layers,
  Rocket,
  Play,
  CheckCircle2,
  Sliders,
  Compass,
} from 'lucide-react';

interface HarmonicProgressionsProps {
  musicalKey: MusicalKey;
  selectedProgressionId: string;
  activeMeasureIndex: number;
  accompanimentStyle: ProgressionAccompanimentStyle;
  subdivision: PracticeSubdivision;
  isPlaying: boolean;
  onSelectProgression: (id: string) => void;
  onSelectMeasure: (measureIdx: number) => void;
  onSelectAccompanimentStyle: (style: ProgressionAccompanimentStyle) => void;
  onSelectSubdivision: (sub: PracticeSubdivision) => void;
  onLoadProgressionToTab: () => void;
}

export default function HarmonicProgressions({
  musicalKey,
  selectedProgressionId,
  activeMeasureIndex,
  accompanimentStyle,
  subdivision,
  isPlaying,
  onSelectProgression,
  onSelectMeasure,
  onSelectAccompanimentStyle,
  onSelectSubdivision,
  onLoadProgressionToTab,
}: HarmonicProgressionsProps) {
  // Filtro de Categoría
  const [filterCategory, setFilterCategory] = useState<'all' | 'Cadencias' | 'Música Popular & Moderna'>('all');

  const selectedProgression = useMemo(() => {
    return (
      PROGRESSION_CATALOGUE.find((p) => p.id === selectedProgressionId) ||
      PROGRESSION_CATALOGUE[0]
    );
  }, [selectedProgressionId]);

  const progressionChords = useMemo(() => {
    return selectedProgression.chords(musicalKey);
  }, [selectedProgression, musicalKey]);

  const filteredCatalog = useMemo(() => {
    if (filterCategory === 'all') return PROGRESSION_CATALOGUE;
    return PROGRESSION_CATALOGUE.filter((p) => p.category === filterCategory);
  }, [filterCategory]);

  const regularSubdivisions = STRINGS_SUBDIVISIONS.filter((s) => !s.isTuplet);
  const tupletSubdivisions = STRINGS_SUBDIVISIONS.filter((s) => s.isTuplet);

  return (
    <div className="flex flex-col gap-4 pt-2 border-t border-white/5 select-none">
      {/* 1. Header con Filtro de Categoría y Botón Principal Cargar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Catálogo Armónico ({PROGRESSION_CATALOGUE.length}):
          </span>

          <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-0.5 rounded-lg text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({PROGRESSION_CATALOGUE.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('Cadencias')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                filterCategory === 'Cadencias'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cadencias & Resoluciones (4)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('Música Popular & Moderna')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                filterCategory === 'Música Popular & Moderna'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pop, Jazz & Blues (6)
            </button>
          </div>
        </div>

        {/* Botón Principal Destacado */}
        <button
          type="button"
          onClick={onLoadProgressionToTab}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-900/40 flex items-center gap-2 cursor-pointer active:scale-95 transition-all text-xs sm:text-sm"
        >
          <Rocket className="w-4 h-4 text-cyan-200" />
          <span>🚀 Cargar Progresión en Runway / TAB</span>
        </button>
      </div>

      {/* 2. Responsive Cards Grid con las 10 Progresiones */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredCatalog.map((prog) => {
          const isSelected = selectedProgression.id === prog.id;

          return (
            <button
              key={prog.id}
              type="button"
              onClick={() => onSelectProgression(prog.id)}
              className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40'
                  : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-xs text-white leading-tight line-clamp-1">
                  {prog.name}
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                  {prog.measuresCount}C
                </span>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-300 w-fit">
                {prog.degreesText}
              </span>

              <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                {prog.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. LÍNEA DE TIEMPO ARMÓNICA INTERACTIVA POR COMPASES */}
      <div className="flex flex-col gap-2 p-3 rounded-2xl bg-black/50 border border-white/10 shadow-inner">
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Línea de Tiempo Armónica ({selectedProgression.name}):
            </span>
            <span className="text-slate-400 text-[10px]">
              • Tonalidad: {musicalKey}
            </span>
          </div>

          <span className="text-[10px] text-cyan-400 font-semibold hidden sm:inline">
            El mástil actualiza sus notas guía en sincronía con cada compás
          </span>
        </div>

        {/* Scrollable Measure Timeline Badges */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 pt-1">
          {progressionChords.map((chord, mIdx) => {
            const isActive = activeMeasureIndex === mIdx;

            return (
              <React.Fragment key={`timeline-step-${mIdx}`}>
                <button
                  type="button"
                  onClick={() => onSelectMeasure(mIdx)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer min-w-[100px] shrink-0 text-center ${
                    isActive
                      ? 'bg-amber-500/25 border-amber-400 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.5)] scale-105 ring-2 ring-amber-400/60'
                      : 'bg-[#0E1526]/80 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">
                    Compás {mIdx + 1}
                  </span>

                  <span className="text-base font-black text-white font-mono leading-none my-1 tracking-tight">
                    {chord.chordSymbol}
                  </span>

                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] font-mono font-bold text-amber-300">
                    {chord.degreeRoman}
                  </span>

                  <span className="text-[8.5px] font-mono text-cyan-300/80 mt-1 line-clamp-1">
                    {chord.notesEs}
                  </span>
                </button>

                {mIdx < progressionChords.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 4. SELECTOR DE ESTILO DE ACOMPAÑAMIENTO Y SUBDIVISIÓN EXPANDIDA */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
        {/* Selector de Estilo de Acompañamiento */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
            Estilo de Acompañamiento:
          </span>
          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5 flex-wrap">
            <button
              type="button"
              onClick={() => onSelectAccompanimentStyle('roots_fifths')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                accompanimentStyle === 'roots_fifths'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🎸 Bajo Sólido (Tónicas & 5ªs)
            </button>
            <button
              type="button"
              onClick={() => onSelectAccompanimentStyle('walking_bass')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                accompanimentStyle === 'walking_bass'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🎷 Walking Bass Jazz
            </button>
            <button
              type="button"
              onClick={() => onSelectAccompanimentStyle('rhythmic_arpeggio')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                accompanimentStyle === 'rhythmic_arpeggio'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🎶 Arpegio Rítmico
            </button>
            <button
              type="button"
              onClick={() => onSelectAccompanimentStyle('guitar_comping')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                accompanimentStyle === 'guitar_comping'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              🎼 Rasgueo Acordes (Comping)
            </button>
          </div>
        </div>

        {/* Dual Panel Subdivisions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Figuras Regulares */}
          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5">
            <span className="text-[9px] text-cyan-400 font-bold px-1 uppercase">Regulares:</span>
            {regularSubdivisions.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubdivision(sub.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  subdivision === sub.id
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={sub.desc}
              >
                {sub.badge} {sub.nameEs}
              </button>
            ))}
          </div>

          {/* Subdivisions Irregulares / Tuplets */}
          <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5">
            <span className="text-[9px] text-purple-400 font-bold px-1 uppercase">Tuplets:</span>
            {tupletSubdivisions.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectSubdivision(sub.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  subdivision === sub.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={sub.desc}
              >
                {sub.badge} {sub.nameEs}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
