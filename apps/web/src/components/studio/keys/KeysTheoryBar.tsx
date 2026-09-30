'use client';

import React, { useState, useMemo } from 'react';
import {
  CHROMATIC_NOTES,
  SCALE_CATALOG,
  CHORD_CATALOG,
  VoicingType,
  LabelType,
  AccompanimentTexture,
  getTransposedFormulaChords,
} from '@/services/theory/keysTheoryEngine';
import {
  HARMONIC_VAULT,
  HarmonicFormula,
  HarmonicType,
  HarmonicLevel,
  HarmonicGenre,
} from '@/data/harmonicVaultData';
import {
  BookOpen,
  Globe,
  Rocket,
  Search,
  Filter,
  Eye,
  Info,
  Sparkles,
  Layers,
  Zap,
  Music,
} from 'lucide-react';

export type MasterTab = 'acordes' | 'escalas' | 'armonia';

interface KeysTheoryBarProps {
  rootNote: string;
  onRootNoteChange: (root: string) => void;
  selectedCategory: 'scale' | 'chord' | 'progression' | 'cadencia';
  onCategoryChange: (cat: 'scale' | 'chord' | 'progression' | 'cadencia') => void;
  selectedItemId: string;
  onItemSelect: (itemId: string) => void;
  voicingType: VoicingType;
  onVoicingChange: (voicing: VoicingType) => void;
  texture: AccompanimentTexture;
  onTextureChange: (texture: AccompanimentTexture) => void;
  labelType: LabelType;
  onLabelTypeChange: (label: LabelType) => void;
  onOpenCircleOfFifths: () => void;
  onLoadIntoRunway: () => void;
  className?: string;
}

export default function KeysTheoryBar({
  rootNote,
  onRootNoteChange,
  selectedCategory,
  onCategoryChange,
  selectedItemId,
  onItemSelect,
  voicingType,
  onVoicingChange,
  texture,
  onTextureChange,
  labelType,
  onLabelTypeChange,
  onOpenCircleOfFifths,
  onLoadIntoRunway,
  className = '',
}: KeysTheoryBarProps) {
  // Master Navigation Tab State
  const [activeMainTab, setActiveMainTab] = useState<MasterTab>('armonia');

  // Search & Filter State for Mega-Librería
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | HarmonicType>('all');
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<'all' | HarmonicLevel>('all');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<'all' | HarmonicGenre>('all');

  // Compute genres count
  const genreCounts = useMemo(() => {
    const counts: { [g: string]: number } = {};
    HARMONIC_VAULT.forEach((f) => {
      counts[f.genre] = (counts[f.genre] || 0) + 1;
    });
    return counts;
  }, []);

  const genresList: HarmonicGenre[] = [
    'Jazz & Bebop',
    'Neo-Soul & R&B',
    'Gospel & Worship',
    'Pop & Baladas',
    'Rock, Blues & Country',
    'Musica Clasica & Barroco',
    'Latin, Bossa & Salsa',
    'Cinematico & BSO',
    'Modal & Experimental',
  ];

  // Filtered Vault Formulas
  const filteredVaultFormulas = useMemo(() => {
    return HARMONIC_VAULT.filter((f) => {
      if (selectedTypeFilter !== 'all' && f.type !== selectedTypeFilter) return false;
      if (selectedLevelFilter !== 'all' && f.level !== selectedLevelFilter) return false;
      if (selectedGenreFilter !== 'all' && f.genre !== selectedGenreFilter) return false;

      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(query);
        const matchesRoman = f.romanNumerals.join(' ').toLowerCase().includes(query);
        const matchesDesc = f.description.toLowerCase().includes(query);
        const matchesGenre = f.genre.toLowerCase().includes(query);
        if (!matchesName && !matchesRoman && !matchesDesc && !matchesGenre) return false;
      }

      return true;
    });
  }, [searchTerm, selectedTypeFilter, selectedLevelFilter, selectedGenreFilter]);

  // Active items
  const activeVaultFormula = HARMONIC_VAULT.find((f) => f.id === selectedItemId);
  const activeChord = CHORD_CATALOG.find((c) => c.id === selectedItemId);
  const activeScale = SCALE_CATALOG.find((s) => s.id === selectedItemId);

  // Switch Master Tab Handler
  const handleSelectMasterTab = (tab: MasterTab) => {
    setActiveMainTab(tab);
    if (tab === 'acordes') {
      onCategoryChange('chord');
      if (!CHORD_CATALOG.some((c) => c.id === selectedItemId)) {
        onItemSelect(CHORD_CATALOG[0].id);
      }
    } else if (tab === 'escalas') {
      onCategoryChange('scale');
      if (!SCALE_CATALOG.some((s) => s.id === selectedItemId)) {
        onItemSelect(SCALE_CATALOG[0].id);
      }
    } else {
      onCategoryChange('cadencia');
      if (!HARMONIC_VAULT.some((f) => f.id === selectedItemId)) {
        onItemSelect(HARMONIC_VAULT[0].id);
      }
    }
  };

  return (
    <div className={`w-full flex flex-col gap-4 p-5 rounded-2xl bg-[#080d1e]/95 border border-slate-800 shadow-2xl backdrop-blur-md ${className}`}>
      {/* 1. MASTER NAVIGATION TABS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleSelectMasterTab('acordes')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'acordes'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-[#131b2e] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🎹 Acordes &amp; Voicings</span>
          </button>

          <button
            onClick={() => handleSelectMasterTab('escalas')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'escalas'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                : 'bg-[#131b2e] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>🎼 Escalas &amp; Modos</span>
          </button>

          <button
            onClick={() => handleSelectMasterTab('armonia')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'armonia'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-[#131b2e] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>📚 Mega-Librería Armónica (Cadencias &amp; Progresiones 200+)</span>
          </button>
        </div>

        {/* Global Key Root, Label Type & Circle of Fifths Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Key Root Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400">Tónica:</span>
            <select
              value={rootNote}
              onChange={(e) => onRootNoteChange(e.target.value)}
              className="bg-transparent text-cyan-400 font-extrabold focus:outline-none cursor-pointer"
            >
              {CHROMATIC_NOTES.map((note) => (
                <option key={note} value={note} className="bg-slate-900 text-slate-100">
                  {note}
                </option>
              ))}
            </select>
          </div>

          {/* Label Type Toggle */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Etiquetas:</span>
            <select
              value={labelType}
              onChange={(e) => onLabelTypeChange(e.target.value as LabelType)}
              className="bg-transparent text-amber-400 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="notes" className="bg-slate-900 text-slate-100">Notas (C, D, E)</option>
              <option value="intervals" className="bg-slate-900 text-slate-100">Grados (R, 3M, b7, 9)</option>
              <option value="fingers" className="bg-slate-900 text-slate-100">Digitación (1 a 5)</option>
              <option value="none" className="bg-slate-900 text-slate-100">Ninguna</option>
            </select>
          </div>

          {/* Circle of Fifths Trigger Button */}
          <button
            onClick={onOpenCircleOfFifths}
            className="px-3 py-1.5 rounded-xl bg-purple-950/80 text-purple-300 border border-purple-800/80 hover:bg-purple-900 transition-all text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm"
          >
            <Globe className="w-4 h-4 text-purple-400" />
            <span>🌐 Círculo de Quintas</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT VIEW SWITCHER */}

      {/* TAB 1: ACORDES & VOICINGS */}
      {activeMainTab === 'acordes' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <span>Catálogo de Tríadas, Tétradas y Acordes Extendidos en {rootNote}</span>
            </h4>
            {/* Voicing Selector */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Tipo de Voicing:</span>
              <select
                value={voicingType}
                onChange={(e) => onVoicingChange(e.target.value as VoicingType)}
                className="bg-transparent text-purple-300 font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="close" className="bg-slate-900 text-slate-100">Posición Cerrada (Close)</option>
                <option value="open" className="bg-slate-900 text-slate-100">Posición Abierta (Spread)</option>
                <option value="drop2" className="bg-slate-900 text-slate-100">Drop 2 (Jazz Strumming)</option>
                <option value="drop3" className="bg-slate-900 text-slate-100">Drop 3 (Apertura Amplia)</option>
                <option value="rootless" className="bg-slate-900 text-slate-100">Rootless (Bill Evans)</option>
                <option value="quartal" className="bg-slate-900 text-slate-100">Armonía Cuartal (McCoy Tyner)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {CHORD_CATALOG.map((chord) => {
                const isSelected = selectedItemId === chord.id;
                return (
                  <button
                    key={chord.id}
                    onClick={() => {
                      onCategoryChange('chord');
                      onItemSelect(chord.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{rootNote}{chord.symbol}</span>
                    <span className="text-[10px] opacity-75 font-normal">({chord.name})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ESCALAS & MODOS */}
      {activeMainTab === 'escalas' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider font-mono">
              Catálogo de Escalas Tonalidades, Modos Griegos &amp; Simétricas en {rootNote}
            </h4>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {SCALE_CATALOG.map((scale) => {
                const isSelected = selectedItemId === scale.id;
                return (
                  <button
                    key={scale.id}
                    onClick={() => {
                      onCategoryChange('scale');
                      onItemSelect(scale.id);
                    }}
                    className={`p-2.5 rounded-xl text-left font-mono transition-all border flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-cyan-950 text-cyan-200 border-cyan-500 shadow-md'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{rootNote} {scale.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 font-mono">
                        {scale.formula}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate">{scale.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEGA-LIBRERÍA ARMÓNICA (CADENCIAS & PROGRESIONES 200+) */}
      {activeMainTab === 'armonia' && (
        <div className="flex flex-col gap-4">
          {/* Search Bar & Primary Filter Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, grados (ej: ii7, V7, Imaj7) o género..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setSelectedTypeFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedTypeFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({HARMONIC_VAULT.length})
              </button>
              <button
                onClick={() => setSelectedTypeFilter('cadencia')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedTypeFilter === 'cadencia'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cadencias
              </button>
              <button
                onClick={() => setSelectedTypeFilter('progresion')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedTypeFilter === 'progresion'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Progresiones
              </button>
            </div>

            {/* Level Filter Selector */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Nivel:</span>
              <select
                value={selectedLevelFilter}
                onChange={(e) => setSelectedLevelFilter(e.target.value as any)}
                className="bg-transparent text-amber-400 font-extrabold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-slate-100">Todos los Niveles</option>
                <option value="Basico" className="bg-slate-900 text-emerald-400">Básico</option>
                <option value="Intermedio" className="bg-slate-900 text-cyan-400">Intermedio</option>
                <option value="Avanzado" className="bg-slate-900 text-amber-400">Avanzado</option>
                <option value="Experto" className="bg-slate-900 text-rose-400">Experto</option>
              </select>
            </div>
          </div>

          {/* Genre Pills Scrollbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
            <button
              onClick={() => setSelectedGenreFilter('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all ${
                selectedGenreFilter === 'all'
                  ? 'bg-slate-200 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              Todos los Géneros
            </button>
            {genresList.map((g) => {
              const count = genreCounts[g] || 0;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenreFilter(g)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition-all flex items-center gap-1.5 ${
                    selectedGenreFilter === g
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{g}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-cyan-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Optimized Grid Container (max-h-[440px] overflow-y-auto) */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 max-h-[440px] overflow-y-auto space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredVaultFormulas.map((formula) => {
                const isSelected = selectedItemId === formula.id;
                const transposedChords = getTransposedFormulaChords(formula, rootNote, voicingType);

                const isCadence = formula.type === 'cadencia';
                let levelBadgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-800/80';
                if (formula.level === 'Intermedio') levelBadgeBg = 'bg-cyan-950 text-cyan-300 border-cyan-800/80';
                else if (formula.level === 'Avanzado') levelBadgeBg = 'bg-amber-950 text-amber-300 border-amber-800/80';
                else if (formula.level === 'Experto') levelBadgeBg = 'bg-rose-950 text-rose-300 border-rose-800/80';

                return (
                  <div
                    key={formula.id}
                    onClick={() => {
                      onCategoryChange(formula.type as any);
                      onItemSelect(formula.id);
                    }}
                    className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/15 scale-[0.99]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Badges Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-md uppercase border ${
                            isCadence
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          }`}
                        >
                          {formula.type}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${levelBadgeBg}`}>
                          {formula.level}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 truncate max-w-[120px]">
                        {formula.genre}
                      </span>
                    </div>

                    {/* Title & Roman Numerals */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-100 group-hover:text-cyan-400 transition-colors font-mono">
                        {formula.name}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {formula.romanNumerals.map((r, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 text-amber-400 border border-slate-800"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Real Transposed Chord Strip in Active Key Root */}
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono text-xs flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-500">[{rootNote}]:</span>
                      {transposedChords.map((tc, idx) => (
                        <React.Fragment key={idx}>
                          <span className="font-black text-cyan-300">{tc.chordName}</span>
                          {idx < transposedChords.length - 1 && <span className="text-slate-600 text-[10px]">➔</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Voice Leading Tip on Hover */}
                    {formula.voiceLeadingTip && (
                      <div className="text-[10px] text-slate-400 italic bg-purple-950/30 p-1.5 rounded border border-purple-900/40 flex items-start gap-1">
                        <Info className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                        <span>{formula.voiceLeadingTip}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredVaultFormulas.length === 0 && (
              <div className="text-center py-10 text-slate-500 font-mono text-xs">
                No se encontraron cadencias o progresiones con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ACTIVE ITEM DESCRIPTION & MASTER RUNWAY BUTTON */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs mt-1">
        <div className="space-y-1">
          <div className="font-extrabold text-cyan-400 font-mono flex items-center gap-2">
            <span>
              {activeVaultFormula ? `${activeVaultFormula.name} (${rootNote})` : ''}
              {activeChord ? `${rootNote} ${activeChord.name}` : ''}
              {activeScale ? `${rootNote} ${activeScale.name}` : ''}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-xl">
            {activeVaultFormula?.description || activeChord?.description || activeScale?.description}
          </p>
        </div>

        {/* Accompaniment Texture Selector & Master Button */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Texture Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Textura:</span>
            <select
              value={texture}
              onChange={(e) => onTextureChange(e.target.value as AccompanimentTexture)}
              className="bg-transparent text-cyan-300 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="comping" className="bg-slate-900 text-slate-100">Bloques de Acordes / Comping</option>
              <option value="arpeggio_asc" className="bg-slate-900 text-slate-100">Arpegio Ascendente</option>
              <option value="arpeggio_desc" className="bg-slate-900 text-slate-100">Arpegio Descendente</option>
              <option value="lh_bass_rh_chord" className="bg-slate-900 text-slate-100">Bajo Izquierda + Acorde Derecha</option>
              <option value="walking_bass" className="bg-slate-900 text-slate-100">Walking Bassline + Extensiones</option>
            </select>
          </div>

          {/* MASTER BUTTON "CARGAR EN RUNWAY" */}
          <button
            onClick={onLoadIntoRunway}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4 fill-current" />
            <span>🚀 Cargar Ejercicio en Runway</span>
          </button>
        </div>
      </div>
    </div>
  );
}
