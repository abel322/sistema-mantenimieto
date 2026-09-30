'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  CHROMATIC_NOTES,
  SCALE_CATALOG,
  CHORD_CATALOG,
  ChordDefinition,
  ChordFamily,
  DominantAcousticType,
  VoicingType,
  LabelType,
  AccompanimentTexture,
  KeyboardRange,
  RunwayNoteEvent,
  ArpeggioOctaveSpan,
  ArpeggioMotionPattern,
  ArpeggioSubdivision,
  ArpeggioHandMode,
  buildExtendedArpeggioNotes,
  getChordNotes,
  getTransposedFormulaChords,
  noteToMidi,
} from '@/services/theory/keysTheoryEngine';
import {
  HARMONIC_VAULT,
  HarmonicFormula,
  HarmonicType,
  HarmonicLevel,
  HarmonicGenre,
} from '@/data/harmonicVaultData';
import { keysAudioEngine } from '@/services/audio/keysAudioEngine';
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
  Volume2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Shuffle,
  Hand,
  Sliders,
  ChevronRight,
  Play,
  RotateCcw,
} from 'lucide-react';

export type MasterTab = 'acordes' | 'escalas' | 'armonia' | 'arpegios';

interface KeysTheoryBarProps {
  rootNote: string;
  onRootNoteChange: (root: string) => void;
  selectedCategory: 'scale' | 'chord' | 'progression' | 'cadencia' | 'progresion';
  onCategoryChange: (cat: 'scale' | 'chord' | 'progression' | 'cadencia' | 'progresion') => void;
  selectedItemId: string;
  onItemSelect: (itemId: string) => void;
  voicingType: VoicingType;
  onVoicingChange: (voicing: VoicingType) => void;
  texture: AccompanimentTexture;
  onTextureChange: (texture: AccompanimentTexture) => void;
  labelType: LabelType;
  onLabelTypeChange: (label: LabelType) => void;
  onOpenCircleOfFifths: () => void;
  onLoadIntoRunway: (customNotes?: RunwayNoteEvent[]) => void;
  keyboardRange?: KeyboardRange;
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
  keyboardRange = 88,
  className = '',
}: KeysTheoryBarProps) {
  // Master Navigation Tab State
  const [activeMainTab, setActiveMainTab] = useState<MasterTab>(
    selectedCategory === 'scale' ? 'escalas' : selectedCategory === 'chord' ? 'acordes' : 'armonia'
  );

  // Sub-filter for Chord Families
  const [chordFamilyFilter, setChordFamilyFilter] = useState<'all' | ChordFamily>('all');
  const [dominantSubFilter, setDominantSubFilter] = useState<'all' | DominantAcousticType>('all');

  // Arpeggio Extended Engine State
  const [arpeggioOctaveSpan, setArpeggioOctaveSpan] = useState<ArpeggioOctaveSpan>(2);
  const [arpeggioStartOctave, setArpeggioStartOctave] = useState<number>(2);
  const [arpeggioPattern, setArpeggioPattern] = useState<ArpeggioMotionPattern>('up');
  const [arpeggioSubdivision, setArpeggioSubdivision] = useState<ArpeggioSubdivision>('16n');
  const [arpeggioHandMode, setArpeggioHandMode] = useState<ArpeggioHandMode>('both');
  const [isAuditioningArp, setIsAuditioningArp] = useState(false);
  const [showArpSettingsInline, setShowArpSettingsInline] = useState(false);

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

  // Filtered Chords Catalog
  const filteredChords = useMemo(() => {
    return CHORD_CATALOG.filter((chord) => {
      if (chordFamilyFilter !== 'all') {
        if (chordFamilyFilter === 'dominant') {
          if (chord.family !== 'dominant') return false;
          if (dominantSubFilter !== 'all' && chord.dominantType !== dominantSubFilter) return false;
        } else if (chord.family !== chordFamilyFilter) {
          return false;
        }
      }
      return true;
    });
  }, [chordFamilyFilter, dominantSubFilter]);

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
    } else if (tab === 'arpegios') {
      onCategoryChange('chord');
      if (!CHORD_CATALOG.some((c) => c.id === selectedItemId)) {
        onItemSelect(CHORD_CATALOG[0].id);
      }
    } else {
      onCategoryChange('cadencia');
      if (!HARMONIC_VAULT.some((f) => f.id === selectedItemId)) {
        onItemSelect(HARMONIC_VAULT[0].id);
      }
    }
  };

  // Generate Extended Arpeggio Notes Events
  const handleGenerateExtendedArpeggio = useCallback((): RunwayNoteEvent[] => {
    let formula: string | number[] | ChordDefinition | undefined;
    if (activeChord) {
      formula = activeChord;
    } else if (activeScale) {
      formula = activeScale.intervals;
    } else if (activeVaultFormula) {
      const transposed = getTransposedFormulaChords(activeVaultFormula, rootNote, voicingType);
      if (transposed.length > 0) {
        formula = transposed[0].notes.map((n) => n.midi % 12);
      }
    }

    return buildExtendedArpeggioNotes({
      rootNote,
      chordFormula: formula || '1 - 3 - 5',
      chordId: activeChord?.id || selectedItemId,
      octaveSpan: arpeggioOctaveSpan,
      startOctave: arpeggioStartOctave,
      pattern: arpeggioPattern,
      subdivision: arpeggioSubdivision,
      handMode: arpeggioHandMode,
      keyboardRange: (keyboardRange as 61 | 88) || 88,
      totalBars: 4,
    });
  }, [
    activeChord,
    activeScale,
    activeVaultFormula,
    rootNote,
    voicingType,
    selectedItemId,
    arpeggioOctaveSpan,
    arpeggioStartOctave,
    arpeggioPattern,
    arpeggioSubdivision,
    arpeggioHandMode,
    keyboardRange,
  ]);

  // Load Arpeggio directly into Runway
  const handleLoadArpeggioToRunway = () => {
    const events = handleGenerateExtendedArpeggio();
    onLoadIntoRunway(events);
  };

  // Quick Audition Audio Cascade
  const handleAuditionArpeggio = async () => {
    if (isAuditioningArp) return;
    setIsAuditioningArp(true);
    const events = handleGenerateExtendedArpeggio();
    const sample = events.slice(0, 16);
    const speedMs =
      arpeggioSubdivision === '6T'
        ? 80
        : arpeggioSubdivision === '3T'
        ? 120
        : arpeggioSubdivision === '16n'
        ? 110
        : 180;
    for (let i = 0; i < sample.length; i++) {
      const ev = sample[i];
      const toneDur =
        ev.duration === '6T' ? '16t' : ev.duration === '3T' ? '8t' : ev.duration;
      keysAudioEngine.playNoteDuration(ev.note, toneDur, 0.85);
      await new Promise((resolve) => setTimeout(resolve, speedMs));
    }
    setIsAuditioningArp(false);
  };

  // Chord Click Audition & Selection Handler
  const handleChordClick = (chord: ChordDefinition) => {
    onCategoryChange('chord');
    onItemSelect(chord.id);

    // Instant polyphonic audition with selected voicing
    const chordNotes = getChordNotes(rootNote, chord.id, voicingType, 4);
    keysAudioEngine.playChord(
      chordNotes.map((n) => n.fullNote),
      '2n'
    );
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
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 font-mono font-bold">
              {CHORD_CATALOG.length}
            </span>
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
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 font-mono font-bold">
              {SCALE_CATALOG.length}
            </span>
          </button>

          <button
            onClick={() => handleSelectMasterTab('arpegios')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeMainTab === 'arpegios'
                ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30 scale-[1.01]'
                : 'bg-[#131b2e] text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>🌊 Arpegios Extendidos</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-950 text-cyan-300 font-mono font-bold">
              Multi-Octava
            </span>
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
            <span>📚 Mega-Librería Armónica (Cadencias 200+)</span>
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

      {/* TAB 1: ACORDES & VOICINGS CON SUB-FILTROS DE FAMILIAS */}
      {activeMainTab === 'acordes' && (
        <div className="flex flex-col gap-3">
          {/* Sub-Filters Navigation Bar for Chord Families */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
              <button
                onClick={() => setChordFamilyFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chordFamilyFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                Todos ({CHORD_CATALOG.length})
              </button>

              <button
                onClick={() => setChordFamilyFilter('triad')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chordFamilyFilter === 'triad'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                🟢 Tríadas Básicas
              </button>

              <button
                onClick={() => setChordFamilyFilter('seventh')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chordFamilyFilter === 'seventh'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                🔵 Séptimas / Tétradas
              </button>

              <button
                onClick={() => setChordFamilyFilter('dominant')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chordFamilyFilter === 'dominant'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                ⚡ Acordes Dominantes (26)
              </button>

              <button
                onClick={() => setChordFamilyFilter('extended')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chordFamilyFilter === 'extended'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                🟣 Extensiones (9, 11, 13)
              </button>

              <button
                onClick={() => setChordFamilyFilter('suspended_add')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chordFamilyFilter === 'suspended_add'
                    ? 'bg-yellow-600 text-white shadow-md shadow-yellow-600/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                🟡 Suspendidos &amp; Add
              </button>

              <button
                onClick={() => setChordFamilyFilter('altered_dim')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  chordFamilyFilter === 'altered_dim'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                🔴 Disminuidos &amp; Alterados
              </button>
            </div>

            {/* Voicing Style Selector */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Voicing:</span>
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

          {/* Specialized Dominant Sub-Classification Filter Bar */}
          {chordFamilyFilter === 'dominant' && (
            <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 font-mono text-xs">
              <span className="text-amber-400 font-bold flex items-center gap-1.5 pl-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Naturaleza Acústica:</span>
              </span>
              <button
                onClick={() => setDominantSubFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  dominantSubFilter === 'all'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos los Dominantes
              </button>
              <button
                onClick={() => setDominantSubFilter('primary')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  dominantSubFilter === 'primary'
                    ? 'bg-indigo-500 text-white font-black shadow-md shadow-indigo-500/20'
                    : 'bg-slate-950 text-indigo-300 hover:text-white'
                }`}
              >
                🔵 Primarios &amp; Naturales
              </button>
              <button
                onClick={() => setDominantSubFilter('suspended')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  dominantSubFilter === 'suspended'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-cyan-300 hover:text-white'
                }`}
              >
                🔷 Suspendidos / Modales
              </button>
              <button
                onClick={() => setDominantSubFilter('altered')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  dominantSubFilter === 'altered'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black shadow-md'
                    : 'bg-slate-950 text-amber-300 hover:text-white'
                }`}
              >
                🔥 Alterados / Jazz &amp; V7
              </button>
            </div>
          )}

          {/* Redesigned Chords Grid (grid-cols-2 to 6, max-h-[440px]) */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 max-h-[440px] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
              {filteredChords.map((chord) => {
                const isSelected = selectedItemId === chord.id;

                // Color badge based on family and dominant acoustic type
                let badgeClass = 'bg-slate-900 text-slate-400 border-slate-800';
                let familyTag = 'Acorde';

                if (chord.family === 'triad') {
                  badgeClass = 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80';
                  familyTag = 'Tríada';
                } else if (chord.family === 'seventh') {
                  badgeClass = 'bg-blue-950/90 text-blue-300 border-blue-800/80';
                  familyTag = 'Séptima';
                } else if (chord.family === 'dominant') {
                  if (chord.dominantType === 'primary') {
                    badgeClass = 'bg-indigo-950/90 text-indigo-300 border-indigo-700/80';
                    familyTag = 'Dom Natural';
                  } else if (chord.dominantType === 'suspended') {
                    badgeClass = 'bg-cyan-950/90 text-cyan-300 border-cyan-800/80';
                    familyTag = 'Dom Sus';
                  } else {
                    badgeClass = 'bg-gradient-to-r from-amber-950/90 to-rose-950/90 text-amber-200 border-amber-700/80';
                    familyTag = 'Dom Alterado';
                  }
                } else if (chord.family === 'extended') {
                  badgeClass = 'bg-purple-950/90 text-purple-300 border-purple-800/80';
                  familyTag = 'Extensión';
                } else if (chord.family === 'suspended_add') {
                  badgeClass = 'bg-yellow-950/90 text-yellow-300 border-yellow-800/80';
                  familyTag = 'Sus / Add';
                } else if (chord.family === 'altered_dim') {
                  badgeClass = 'bg-rose-950/90 text-rose-300 border-rose-800/80';
                  familyTag = 'Disminuido';
                }

                return (
                  <button
                    key={chord.id}
                    onClick={() => handleChordClick(chord)}
                    className={`group relative p-3 rounded-xl border text-left font-mono transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 scale-[0.99] ring-1 ring-cyan-500'
                        : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/90'
                    }`}
                  >
                    {/* Header with Family Badge & Audio Icon */}
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeClass}`}>
                        {familyTag}
                      </span>
                      <Volume2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>

                    {/* Main Chord Symbol (Prominent White Display) */}
                    <div>
                      <div className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                        {rootNote}{chord.symbol}
                      </div>
                      <div className="text-[11px] text-slate-300 font-bold truncate">
                        {chord.name}
                      </div>
                    </div>

                    {/* Formula Pill */}
                    <div className="text-[10px] text-cyan-400 bg-slate-950/90 px-2 py-0.5 rounded border border-slate-800/90 font-mono font-bold tracking-tight truncate">
                      {chord.formula}
                    </div>
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

      {/* TAB: SUITE DE ARPEGIOS EXTENDIDOS & VIRTUOSISMO MULTI-OCTAVA */}
      {activeMainTab === 'arpegios' && (
        <div className="flex flex-col gap-4">
          {/* Header de la Suite con Acorde Activo & Quick-Select Chords */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-3.5 rounded-xl border border-cyan-800/40 shadow-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black uppercase tracking-wider border border-cyan-400/30">
                  Modo Arpegio Virtuoso
                </span>
                <span className="text-white font-mono font-black text-sm sm:text-base">
                  {rootNote}{activeChord?.symbol || 'Maj'} — {activeChord?.name || 'Acorde Base'}
                </span>
                <span className="text-xs text-cyan-400 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {activeChord?.formula || '1 - 3 - 5'}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-mono">
                Genera cascadas multi-octava a lo largo de todo el teclado ({keyboardRange} teclas) con asignación de manos y tempo dinámico.
              </p>
            </div>

            {/* Selector de Acorde Base para el Arpegio */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-slate-400 mr-1">Cambiar Tríada/Tétrada:</span>
              {['maj', 'min', '7', 'maj7', 'm7', '9', 'm9', 'add9', 'sus4', 'dim7'].map((cId) => {
                const cDef = CHORD_CATALOG.find((c) => c.id === cId);
                if (!cDef) return null;
                const isSelected = selectedItemId === cDef.id;
                return (
                  <button
                    key={cDef.id}
                    onClick={() => {
                      onCategoryChange('chord');
                      onItemSelect(cDef.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-black'
                        : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    {rootNote}{cDef.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1. SELECTOR DE RANGO Y OCTAVAS (Octave Span) & Octava de Inicio */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]"></span>
                <span className="text-xs font-mono font-black uppercase tracking-wider text-cyan-300">
                  A) Selector de Rango y Extensión de Octavas (Octave Span)
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Octava de inicio:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  {[1, 2, 3, 4].map((oct) => (
                    <button
                      key={oct}
                      onClick={() => setArpeggioStartOctave(oct)}
                      className={`px-2 py-0.5 rounded font-bold transition-all text-xs ${
                        arpeggioStartOctave === oct
                          ? 'bg-cyan-400 text-slate-950'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {rootNote}{oct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pills de Rango de Octavas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 font-mono text-xs">
              <button
                onClick={() => setArpeggioOctaveSpan(1)}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 ${
                  arpeggioOctaveSpan === 1
                    ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-white font-extrabold">1 Octava</span>
                <span className="text-[10px] text-slate-400">Registro Local</span>
              </button>

              <button
                onClick={() => setArpeggioOctaveSpan(2)}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 ${
                  arpeggioOctaveSpan === 2
                    ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-white font-extrabold">2 Octavas</span>
                <span className="text-[10px] text-slate-400">Estándar Clásico/Pop</span>
              </button>

              <button
                onClick={() => setArpeggioOctaveSpan(3)}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 ${
                  arpeggioOctaveSpan === 3
                    ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-white font-extrabold">3 Octavas</span>
                <span className="text-[10px] text-slate-400">Barrido Extendido</span>
              </button>

              <button
                onClick={() => setArpeggioOctaveSpan(4)}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 ${
                  arpeggioOctaveSpan === 4
                    ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500 shadow-md ring-1 ring-cyan-500'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-white font-extrabold">4 Octavas</span>
                <span className="text-[10px] text-slate-400">Virtuosismo Chopin</span>
              </button>

              <button
                onClick={() => setArpeggioOctaveSpan('full')}
                className={`p-2.5 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1 col-span-2 sm:col-span-1 ${
                  arpeggioOctaveSpan === 'full'
                    ? 'bg-gradient-to-br from-indigo-950 via-purple-950 to-cyan-950 text-cyan-200 border-cyan-400 shadow-lg ring-1 ring-cyan-400'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-amber-300 font-black">🎹 Teclado Completo</span>
                <span className="text-[10px] text-slate-400">Full ({keyboardRange} Teclas)</span>
              </button>
            </div>
          </div>

          {/* 2. DIRECCIONES Y PATRONES EXTENDIDOS (Motion Patterns) */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,1)]"></span>
              <span className="text-xs font-mono font-black uppercase tracking-wider text-purple-300">
                B) Direcciones y Patrones Extendidos (Motion Patterns)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 font-mono text-xs">
              {/* Pattern 1: Up */}
              <button
                onClick={() => setArpeggioPattern('up')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  arpeggioPattern === 'up'
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <ArrowUpRight className="w-4 h-4 text-cyan-400" />
                    <span>Ascendente continuo (↗)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Recorre todas las notas del arpegio hacia el agudo a lo largo de las octavas seleccionadas.
                </p>
              </button>

              {/* Pattern 2: Down */}
              <button
                onClick={() => setArpeggioPattern('down')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  arpeggioPattern === 'down'
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <ArrowDownRight className="w-4 h-4 text-cyan-400" />
                    <span>Descendente continuo (↘)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Desciende desde el registro más agudo hasta el grave de forma fluida.
                </p>
              </button>

              {/* Pattern 3: UpDown Ping-Pong */}
              <button
                onClick={() => setArpeggioPattern('upDown')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  arpeggioPattern === 'upDown'
                    ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                    <span>Ida y Vuelta (↗↘)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sube hasta la cima y baja fluidamente sin repetir la nota cumbre.
                </p>
              </button>

              {/* Pattern 4: Alberti */}
              <button
                onClick={() => setArpeggioPattern('broken_alberti')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  arpeggioPattern === 'broken_alberti'
                    ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Music className="w-4 h-4 text-amber-400" />
                    <span>Alberti Clásico (1-5-3-5)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Patrón quebrado clásico de piano en acompañamiento y agilidad técnica.
                </p>
              </button>

              {/* Pattern 5: Neo-Soul */}
              <button
                onClick={() => setArpeggioPattern('broken_neosoul')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  arpeggioPattern === 'broken_neosoul'
                    ? 'bg-slate-900 border-purple-500 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Neo-Soul / Addict</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ondulación melódica 1 - 3 - 5 - 7 - 9 - 7 - 5 - 3 para textura jazzística moderna.
                </p>
              </button>

              {/* Pattern 6: Salto de Octavas */}
              <button
                onClick={() => setArpeggioPattern('broken_octave')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  arpeggioPattern === 'broken_octave'
                    ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Shuffle className="w-4 h-4 text-emerald-400" />
                    <span>Salto de Octavas (Displacement)</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Salta entre octava grave y media/aguda alternadamente (entrenamiento de saltos).
                </p>
              </button>

              {/* Pattern 7: Hand-to-Hand Sweep */}
              <button
                onClick={() => setArpeggioPattern('handCross')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 col-span-1 sm:col-span-2 ${
                  arpeggioPattern === 'handCross'
                    ? 'bg-gradient-to-r from-purple-950/80 to-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Hand className="w-4 h-4 text-cyan-400" />
                    <span>Manos Cruzadas / Hand Sweep</span>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    LH + RH Turnados
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Distribución automática: Mano izquierda ejecuta bajo y fundamental, mano derecha toma tercera y quinta, turnándose en cascada ascendente.
                </p>
              </button>
            </div>
          </div>

          {/* 3. SUBDIVISIÓN RÍTMICA & MODO DE MANOS (Dual Column Controls) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* C) Subdivisión */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]"></span>
                <span className="text-xs font-mono font-black uppercase tracking-wider text-amber-300">
                  C) Subdivisión Rítmica
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  onClick={() => setArpeggioSubdivision('8n')}
                  className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                    arpeggioSubdivision === '8n'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="font-extrabold">8n (Corcheas)</div>
                  <div className="text-[10px] opacity-80">2 notas / beat</div>
                </button>

                <button
                  onClick={() => setArpeggioSubdivision('16n')}
                  className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                    arpeggioSubdivision === '16n'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="font-extrabold">16n (Semicorcheas)</div>
                  <div className="text-[10px] opacity-80">4 notas / beat</div>
                </button>

                <button
                  onClick={() => setArpeggioSubdivision('3T')}
                  className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                    arpeggioSubdivision === '3T'
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="font-extrabold">3T (Tresillos)</div>
                  <div className="text-[10px] opacity-80">3 notas / beat</div>
                </button>

                <button
                  onClick={() => setArpeggioSubdivision('6T')}
                  className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                    arpeggioSubdivision === '6T'
                      ? 'bg-gradient-to-r from-cyan-400 to-sky-300 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <div className="font-extrabold">6T (Seiscillos)</div>
                  <div className="text-[10px] opacity-80">Cascada rápida</div>
                </button>
              </div>
            </div>

            {/* D) Modo de Manos */}
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]"></span>
                <span className="text-xs font-mono font-black uppercase tracking-wider text-cyan-300">
                  D) Modo de Manos &amp; Digitación
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <button
                  onClick={() => setArpeggioHandMode('both')}
                  className={`p-2.5 rounded-lg border text-center font-bold transition-all flex flex-col items-center justify-between gap-1 ${
                    arpeggioHandMode === 'both'
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-extrabold">Ambas Manos</span>
                  <span className="text-[9px] opacity-90">LH &lt; C4 / RH &ge; C4</span>
                </button>

                <button
                  onClick={() => setArpeggioHandMode('left')}
                  className={`p-2.5 rounded-lg border text-center font-bold transition-all flex flex-col items-center justify-between gap-1 ${
                    arpeggioHandMode === 'left'
                      ? 'bg-purple-600 text-white font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-extrabold">Solo Izquierda</span>
                  <span className="text-[9px] opacity-90">Todo Violeta (LH)</span>
                </button>

                <button
                  onClick={() => setArpeggioHandMode('right')}
                  className={`p-2.5 rounded-lg border text-center font-bold transition-all flex flex-col items-center justify-between gap-1 ${
                    arpeggioHandMode === 'right'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-extrabold">Solo Derecha</span>
                  <span className="text-[9px] opacity-90">Todo Cyan (RH)</span>
                </button>
              </div>
            </div>
          </div>

          {/* E) BARRA DE ACCIÓN Y EJECUCIÓN DIRECTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-cyan-800/60 shadow-xl">
            <div className="flex items-center gap-3 font-mono text-xs text-slate-300">
              <span className="text-cyan-400 font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Arpegio Configurado:</span>
              </span>
              <span className="text-white font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                {rootNote}{activeChord?.symbol || 'Maj'} • {arpeggioOctaveSpan === 'full' ? 'Full Keyboard' : `${arpeggioOctaveSpan} Octavas`} • {arpeggioSubdivision}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleAuditionArpeggio}
                disabled={isAuditioningArp}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 text-cyan-300 hover:bg-slate-700 font-bold font-mono text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
              >
                <Volume2 className={`w-4 h-4 ${isAuditioningArp ? 'animate-bounce text-amber-400' : ''}`} />
                <span>{isAuditioningArp ? 'Escuchando...' : 'Audición Rápida'}</span>
              </button>

              <button
                onClick={handleLoadArpeggioToRunway}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 hover:brightness-110 flex items-center justify-center gap-2"
              >
                <Rocket className="w-4 h-4 fill-current" />
                <span>🚀 CARGAR EN RUNWAY</span>
              </button>
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
              {activeChord ? `${rootNote}${activeChord.symbol} - ${activeChord.name}` : ''}
              {activeScale ? `${rootNote} ${activeScale.name}` : ''}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] max-w-xl">
            {activeVaultFormula?.description || activeChord?.description || activeScale?.description}
          </p>
        </div>

        {/* Accompaniment Texture Selector, Arp Drawer Toggle & Master Button */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Texture Selector */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Textura:</span>
            <select
              value={texture}
              onChange={(e) => {
                const val = e.target.value as AccompanimentTexture;
                onTextureChange(val);
                if (val.startsWith('arpeggio') || val === 'alberti_bass') {
                  if (val === 'arpeggio_asc') setArpeggioPattern('up');
                  else if (val === 'arpeggio_desc') setArpeggioPattern('down');
                  else if (val === 'arpeggio_updown') setArpeggioPattern('upDown');
                  else if (val === 'alberti_bass') setArpeggioPattern('broken_alberti');
                  else if (val === 'arpeggio_broken') setArpeggioPattern('broken_neosoul');
                  else if (val === 'arpeggio_sweep') setArpeggioPattern('handCross');
                }
              }}
              className="bg-transparent text-cyan-300 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="comping" className="bg-slate-900 text-slate-100">Bloques de Acordes / Comping</option>
              <option value="arpeggio_asc" className="bg-slate-900 text-slate-100">Arpegio Ascendente (↗)</option>
              <option value="arpeggio_desc" className="bg-slate-900 text-slate-100">Arpegio Descendente (↘)</option>
              <option value="arpeggio_updown" className="bg-slate-900 text-slate-100">Arpegio Ida y Vuelta (↗↘)</option>
              <option value="alberti_bass" className="bg-slate-900 text-slate-100">Alberti Bass (1-5-3-5)</option>
              <option value="arpeggio_broken" className="bg-slate-900 text-slate-100">Arpegio Neo-Soul / Addict</option>
              <option value="arpeggio_sweep" className="bg-slate-900 text-slate-100">Manos Cruzadas / Sweep</option>
              <option value="lh_bass_rh_chord" className="bg-slate-900 text-slate-100">Bajo Izquierda + Acorde Derecha</option>
              <option value="walking_bass" className="bg-slate-900 text-slate-100">Walking Bassline + Extensiones</option>
            </select>
          </div>

          {/* Quick Arpeggio Suite Shortcut */}
          {(texture.startsWith('arpeggio') || texture === 'alberti_bass' || activeMainTab === 'arpegios') && (
            <button
              onClick={() => {
                if (activeMainTab !== 'arpegios') {
                  handleSelectMasterTab('arpegios');
                } else {
                  setShowArpSettingsInline((prev) => !prev);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold hover:bg-cyan-900/80 flex items-center gap-1.5 transition-all shadow-sm"
              title="Abrir Suite Completa de Arpegios"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ajustar Rango ({arpeggioOctaveSpan === 'full' ? 'Full' : `${arpeggioOctaveSpan} Oct`})</span>
            </button>
          )}

          {/* MASTER BUTTON "CARGAR EN RUNWAY" */}
          <button
            onClick={() => {
              if (
                activeMainTab === 'arpegios' ||
                texture.startsWith('arpeggio') ||
                texture === 'alberti_bass'
              ) {
                handleLoadArpeggioToRunway();
              } else {
                onLoadIntoRunway();
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4 fill-current" />
            <span>🚀 Cargar en Runway</span>
          </button>
        </div>
      </div>
    </div>
  );
}
