'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CHROMATIC_NOTES,
  SCALE_CATALOG,
  CHORD_CATALOG,
  VoicingType,
  RunwayNoteEvent,
  ArpeggioOctaveSpan,
  ArpeggioMotionPattern,
  ArpeggioSubdivision,
  buildUnifiedExecutionEvents,
} from '@/services/theory/keysTheoryEngine';
import { HARMONIC_VAULT, HarmonicFormula } from '@/data/harmonicVaultData';
import { PracticeRoutine, HandFocus, CustomWorkout } from '@/data/practiceWorkoutsData';
import {
  X,
  Sparkles,
  Rocket,
  Music,
  ChevronDown,
  Check,
  Search,
  Zap,
  Hand,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Pencil,
  Save,
} from 'lucide-react';

export interface CustomWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndLoad: (routine: PracticeRoutine) => void;
  workoutToEdit?: PracticeRoutine | CustomWorkout | null;
}

export default function CustomWorkoutModal({
  isOpen,
  onClose,
  onSaveAndLoad,
  workoutToEdit,
}: CustomWorkoutModalProps) {
  // =========================================================================
  // HOOKS SIEMPRE DECLARADOS EN EL NIVEL SUPERIOR (SIN CONDICIÓN PREVIA)
  // =========================================================================

  const isEditing = Boolean(workoutToEdit);

  // 1. Título Opcional
  const [title, setTitle] = useState('');

  // 2. Fuente Teórica
  const [selectedCategory, setSelectedCategory] = useState<'progression' | 'cadence' | 'chord' | 'scale'>('progression');
  const [selectedItemId, setSelectedItemId] = useState('prog_251_major_classic');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 3. Tónica / Tonalidad
  const [rootNote, setRootNote] = useState('C');

  // 4. Modo de Ejecución (Textura & Articulación: Bloque vs Arpegio Extendido)
  const [executionMode, setExecutionMode] = useState<'block' | 'arpeggio'>('arpeggio');
  const [arpeggioOctaveSpan, setArpeggioOctaveSpan] = useState<ArpeggioOctaveSpan>(2);
  const [arpeggioPattern, setArpeggioPattern] = useState<ArpeggioMotionPattern>('up');
  const [arpeggioSubdivision, setArpeggioSubdivision] = useState<ArpeggioSubdivision>('16n');

  // 5. Asignación / Enfoque de Mano
  const [handFocus, setHandFocus] = useState<HandFocus>('both');

  // 6. Rango de BPM
  const [bpm, setBpm] = useState(85);

  // Voicing Type
  const [voicingType, setVoicingType] = useState<VoicingType>('close');

  // Sincronización cuando entra una rutina a editar o se abre en modo creación
  useEffect(() => {
    if (!isOpen) return;

    if (workoutToEdit) {
      setTitle(workoutToEdit.title || '');
      setHandFocus(workoutToEdit.handFocus || 'both');
      setRootNote(workoutToEdit.rootNote || 'C');
      setBpm(workoutToEdit.bpm || 85);
      setVoicingType(workoutToEdit.voicingType || 'close');

      // Categoría
      const cat = workoutToEdit.category;
      const normalizedCat: 'progression' | 'cadence' | 'chord' | 'scale' =
        cat === 'cadencia' ? 'cadence' : cat === 'progresion' ? 'progression' : (cat as any) || 'progression';
      setSelectedCategory(normalizedCat);
      setSelectedItemId(workoutToEdit.targetItemId);

      // Modo & Parámetros de Arpegio
      const isArp =
        workoutToEdit.executionMode === 'arpeggio' ||
        workoutToEdit.texture?.startsWith('arpeggio') ||
        workoutToEdit.texture === 'alberti_bass' ||
        workoutToEdit.objective?.toLowerCase().includes('arpegio');
      setExecutionMode(isArp ? 'arpeggio' : 'block');

      if (workoutToEdit.arpeggioOctaveSpan) {
        setArpeggioOctaveSpan(workoutToEdit.arpeggioOctaveSpan as ArpeggioOctaveSpan);
      } else {
        const obj = workoutToEdit.objective || '';
        if (obj.includes('1 Oct')) setArpeggioOctaveSpan(1);
        else if (obj.includes('3 Oct')) setArpeggioOctaveSpan(3);
        else if (obj.includes('Full')) setArpeggioOctaveSpan('full');
        else setArpeggioOctaveSpan(2);
      }

      if (workoutToEdit.arpeggioPattern) {
        setArpeggioPattern(workoutToEdit.arpeggioPattern as ArpeggioMotionPattern);
      } else if (workoutToEdit.texture === 'arpeggio_desc') {
        setArpeggioPattern('down');
      } else if (workoutToEdit.texture === 'arpeggio_updown') {
        setArpeggioPattern('upDown');
      } else if (workoutToEdit.texture === 'alberti_bass') {
        setArpeggioPattern('broken_alberti');
      } else if (workoutToEdit.texture === 'arpeggio_broken') {
        setArpeggioPattern('broken_neosoul');
      } else if (workoutToEdit.texture === 'arpeggio_sweep') {
        setArpeggioPattern('handCross');
      } else {
        setArpeggioPattern('up');
      }

      if (workoutToEdit.subdivision) {
        const sub = workoutToEdit.subdivision;
        if (sub === '8n' || sub === '1/8') setArpeggioSubdivision('8n');
        else if (sub === '3T' || sub === '3:2_eighth' || sub.includes('trip')) setArpeggioSubdivision('3T');
        else if (sub === '6T') setArpeggioSubdivision('6T');
        else setArpeggioSubdivision('16n');
      } else {
        setArpeggioSubdivision('16n');
      }
    } else {
      // Valores por defecto al crear nueva rutina
      setTitle('');
      setSelectedCategory('progression');
      setSelectedItemId('prog_251_major_classic');
      setSearchQuery('');
      setIsDropdownOpen(false);
      setRootNote('C');
      setExecutionMode('arpeggio');
      setArpeggioOctaveSpan(2);
      setArpeggioPattern('up');
      setArpeggioSubdivision('16n');
      setHandFocus('both');
      setBpm(85);
      setVoicingType('close');
    }
  }, [isOpen, workoutToEdit]);

  // Separación estricta por Fuente Teórica
  const progressionItems = useMemo(
    () =>
      HARMONIC_VAULT
        ? HARMONIC_VAULT.filter(
            (item) => item.type === 'progresion' || (item.type as any) === 'progression'
          )
        : [],
    []
  );

  const cadenceItems = useMemo(
    () =>
      HARMONIC_VAULT
        ? HARMONIC_VAULT.filter(
            (item) => item.type === 'cadencia' || (item.type as any) === 'cadence'
          )
        : [],
    []
  );

  // Filtrado memorizado seguro en top-level (Reglas estrictas de Hooks)
  const filteredHarmonics = useMemo(() => {
    if (!HARMONIC_VAULT) return [];
    return HARMONIC_VAULT.filter((item) => {
      const matchesCategory =
        selectedCategory === 'progression'
          ? item.type === 'progresion' || (item.type as any) === 'progression'
          : selectedCategory === 'cadence'
          ? item.type === 'cadencia' || (item.type as any) === 'cadence'
          : true;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.genre && item.genre.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Géneros canónicos ordenados (9 secciones visuales)
  const GENRE_GROUPS = useMemo(
    () => [
      'Jazz & Bebop',
      'Neo-Soul & R&B',
      'Gospel & Worship',
      'Pop & Baladas',
      'Rock, Blues & Country',
      'Música Clásica & Barroco',
      'Latin, Bossa & Salsa',
      'Cinemático & BSO',
      'Modal & Experimental',
    ],
    []
  );

  // Pool de fórmulas activas (Progresiones o Cadencias)
  const currentVaultPool = useMemo(() => {
    return selectedCategory === 'progression' ? progressionItems : cadenceItems;
  }, [selectedCategory, progressionItems, cadenceItems]);

  // Filtrado reactivo en tiempo real con buscador interactivo
  const filteredVaultItems = useMemo(() => {
    if (selectedCategory !== 'progression' && selectedCategory !== 'cadence') return [];
    if (!searchQuery.trim()) return currentVaultPool;
    const q = searchQuery.toLowerCase().trim();
    return currentVaultPool.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchRoman = item.romanNumerals.join(' ').toLowerCase().includes(q);
      const matchGenre = item.genre.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchName || matchRoman || matchGenre || matchDesc;
    });
  }, [selectedCategory, currentVaultPool, searchQuery]);

  // Agrupación por Secciones Visuales / Géneros
  const groupedVaultItems = useMemo(() => {
    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const groups: { [g: string]: HarmonicFormula[] } = {};
    GENRE_GROUPS.forEach((g) => {
      groups[g] = [];
    });

    filteredVaultItems.forEach((item) => {
      const itemGenreNorm = normalize(item.genre);
      const matchedCanonical =
        GENRE_GROUPS.find((g) => normalize(g) === itemGenreNorm) || item.genre;
      if (!groups[matchedCanonical]) {
        groups[matchedCanonical] = [];
      }
      groups[matchedCanonical].push(item);
    });

    return groups;
  }, [GENRE_GROUPS, filteredVaultItems]);

  const activeVaultItem = useMemo(() => {
    if (!HARMONIC_VAULT) return undefined;
    return HARMONIC_VAULT.find((x) => x.id === selectedItemId);
  }, [selectedItemId]);

  // =========================================================================
  // RETORNO CONDICIONAL SOLO DESPUÉS DE DECLARAR TODOS LOS HOOKS
  // =========================================================================
  if (!isOpen) return null;

  // Handle source category change
  const handleCategoryChange = (cat: 'progression' | 'cadence' | 'chord' | 'scale') => {
    setSelectedCategory(cat);
    setSearchQuery('');
    setIsDropdownOpen(false);
    if (cat === 'scale') setSelectedItemId(SCALE_CATALOG[0].id);
    else if (cat === 'chord') setSelectedItemId(CHORD_CATALOG[2]?.id || CHORD_CATALOG[0].id);
    else if (cat === 'progression') setSelectedItemId(progressionItems[0]?.id || 'prog_251_major_classic');
    else if (cat === 'cadence') setSelectedItemId(cadenceItems[0]?.id || 'cad_pac');
  };

  // Get human name of selected item
  const getItemName = () => {
    if (selectedCategory === 'scale') {
      const s = SCALE_CATALOG.find((x) => x.id === selectedItemId);
      return s ? `Escala ${s.name}` : selectedItemId;
    }
    if (selectedCategory === 'chord') {
      const c = CHORD_CATALOG.find((x) => x.id === selectedItemId);
      return c ? `${c.symbol} (${c.name})` : selectedItemId;
    }
    const v = activeVaultItem;
    return v ? `[${v.genre}] ${v.name} (${v.romanNumerals.join(' - ')})` : selectedItemId;
  };

  // Generación Matemática Unificada de Notas
  const generateNotesForRoutine = (): RunwayNoteEvent[] => {
    const routineCategory = selectedCategory === 'cadence' ? 'cadencia' : (selectedCategory as any);
    return buildUnifiedExecutionEvents({
      rootNote,
      category: routineCategory,
      targetItemId: selectedItemId,
      config: {
        mode: executionMode,
        voicingType,
        octaveSpan: arpeggioOctaveSpan,
        pattern: arpeggioPattern,
        subdivision: arpeggioSubdivision,
        handMode: handFocus,
        keyboardRange: 88,
        totalBars: 4,
      },
    });
  };

  // Save & Load handler con inyección inmediata en Runway
  const handleSaveAndLoad = () => {
    const finalId = workoutToEdit ? workoutToEdit.id : `custom_${Date.now()}`;
    const itemName = getItemName();
    const finalTitle = title.trim() || `Rutina: ${rootNote} ${itemName} (${executionMode === 'arpeggio' ? 'Arpegio' : 'Bloques'})`;

    let leftInstruction = '';
    let rightInstruction = '';

    if (handFocus === 'left') {
      leftInstruction = `Mano Izquierda: Articulación y soporte armónico en registro grave (< C4).`;
      rightInstruction = `Mano Derecha en reposo sobre el regazo o marcando el pulso.`;
    } else if (handFocus === 'right') {
      leftInstruction = `Mano Izquierda en reposo para concentrar la técnica en mano derecha.`;
      rightInstruction = `Mano Derecha: Fraseo melódico, cascada o acordes en registro agudo (≥ C4).`;
    } else {
      leftInstruction = `Mano Izquierda: Línea de bajo y arpegios graves coordinados.`;
      rightInstruction = `Mano Derecha: Complemento melódico y extensiones en agudo.`;
    }

    const generatedNotes = generateNotesForRoutine();
    const routineCategory = selectedCategory === 'cadence' ? 'cadencia' : selectedCategory;

    const savedRoutine: PracticeRoutine = {
      id: finalId,
      title: finalTitle,
      objective: `Entrenamiento personalizado creado por el estudiante. Modo: ${
        executionMode === 'arpeggio' ? `Arpegio Extendido (${arpeggioOctaveSpan} Oct, ${arpeggioPattern})` : 'Bloques de Acordes'
      }. Enfoque: ${
        handFocus === 'left' ? 'Mano Izquierda' : handFocus === 'right' ? 'Mano Derecha' : 'Ambas Manos'
      } sobre ${rootNote} ${itemName}.`,
      bpm,
      bpmRange: `${Math.max(40, bpm - 10)} - ${Math.min(200, bpm + 10)} BPM`,
      rootNote,
      texture: executionMode === 'arpeggio' ? (arpeggioPattern === 'down' ? 'arpeggio_desc' : arpeggioPattern === 'upDown' ? 'arpeggio_updown' : 'arpeggio_asc') : 'comping',
      voicingType,
      category: routineCategory,
      targetItemId: selectedItemId,
      targetItemName: `${rootNote} ${itemName}`,
      leftHandInstruction: leftInstruction,
      rightHandInstruction: rightInstruction,
      pedagogicalTip:
        'Mantén la relajación muscular en muñeca y antebrazo. Deja que el peso del brazo guíe cada pulsación en el teclado.',
      handFocus,
      subdivision: arpeggioSubdivision,
      notes: generatedNotes,
      executionMode,
      arpeggioOctaveSpan,
      arpeggioPattern,
    };

    // Save to localStorage
    try {
      const stored = localStorage.getItem('sonora_keys_custom_workouts');
      const list: PracticeRoutine[] = stored ? JSON.parse(stored) : [];
      if (workoutToEdit) {
        const idx = list.findIndex((r) => r.id === workoutToEdit.id);
        if (idx >= 0) {
          list[idx] = savedRoutine;
        } else {
          list.unshift(savedRoutine);
        }
      } else {
        list.unshift(savedRoutine);
      }
      localStorage.setItem('sonora_keys_custom_workouts', JSON.stringify(list));
    } catch (e) {
      console.error('Error saving custom workout to localStorage', e);
    }

    onSaveAndLoad(savedRoutine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#0e172e] via-[#091024] to-[#060a17] border border-cyan-500/30 shadow-2xl p-5 sm:p-7 text-white flex flex-col gap-6">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                {isEditing ? (
                  <Pencil className="w-5 h-5 text-cyan-300" />
                ) : (
                  <Sparkles className="w-5 h-5 text-cyan-300" />
                )}
              </span>
              <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Sonora Academy • Laboratorio Pedagógico
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isEditing ? '✏️ Editar Entrenamiento Personalizado' : 'Crear Entrenamiento Personalizado'}
            </h2>
            <p className="text-xs text-slate-300">
              {isEditing
                ? 'Actualiza los parámetros de tu rutina: acorde, escala, arpegio, tempo y asignación técnica de mano.'
                : 'Diseña una rutina a la medida de tus metas técnicas: cualquier acorde, escala o cadencia en bloques armónicos o arpegio extendido.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-5 text-xs">
          {/* Título Opcional */}
          <div className="space-y-1.5">
            <label className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <span>Título de la práctica:</span>
              <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='ej. "Cascadas en Dm9", "Velocidad en Alberti Bass", "Exploración Neo-Soul"...'
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-sans transition-all"
            />
          </div>

          {/* ========================================================================= */}
          {/* PASO 1: ELEGIR FUENTE TEÓRICA                                             */}
          {/* ========================================================================= */}
          <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold text-cyan-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]"></span>
                <span>Paso 1: Fuente Teórica de la Librería</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedCategory === 'chord'
                  ? `${CHORD_CATALOG.length} Acordes & Voicings`
                  : selectedCategory === 'scale'
                  ? `${SCALE_CATALOG.length} Escalas & Modos`
                  : `${HARMONIC_VAULT.length} Fórmulas del Vault`}
              </span>
            </div>

            {/* Categorías Principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'chord', label: '🎹 Acordes & Voicings', count: CHORD_CATALOG.length },
                { id: 'scale', label: '🎼 Escalas & Modos', count: SCALE_CATALOG.length },
                { id: 'progression', label: '🏛️ Progresiones', count: progressionItems.length },
                { id: 'cadence', label: '📚 Cadencias Vault', count: cadenceItems.length },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryChange(c.id as any)}
                  className={`p-2.5 rounded-xl font-mono font-bold text-[11px] transition-all border flex flex-col items-center justify-center gap-1 ${
                    selectedCategory === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-400 border border-slate-800">
                    {c.count} opciones
                  </span>
                </button>
              ))}
            </div>

            {/* Selector de Fórmula / Ítem */}
            {selectedCategory === 'progression' || selectedCategory === 'cadence' ? (
              <div className="relative space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/90 text-cyan-300 font-mono font-bold border border-cyan-500/40 hover:border-cyan-400 focus:outline-none transition-all flex items-center justify-between shadow-lg text-left group"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs shrink-0">
                      {selectedCategory === 'progression' ? '🏛️' : '📚'}
                    </span>
                    <span className="truncate text-xs text-cyan-200">
                      {activeVaultItem
                        ? `[${activeVaultItem.genre}] ${activeVaultItem.name} (${activeVaultItem.romanNumerals.join(' - ')})`
                        : 'Seleccionar fórmula armónica...'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeVaultItem && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {activeVaultItem.level}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Panel Flotante de Selección */}
                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDropdownOpen(false)}
                    />

                    <div className="relative z-30 w-full rounded-2xl bg-[#091024] border border-cyan-500/40 shadow-2xl p-3 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                      {/* Búsqueda */}
                      <div className="relative flex items-center bg-slate-950/90 rounded-xl border border-slate-800 focus-within:border-cyan-500/80 px-3 py-2 transition-all">
                        <Search className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Buscar por nombre o grados (ej: ii-V-I, Coltrane, Andaluza, Neo-Soul)..."
                          className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none font-sans"
                          autoFocus
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="p-1 rounded text-slate-400 hover:text-white mr-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/20 shrink-0">
                          {filteredVaultItems.length}
                        </span>
                      </div>

                      {/* Lista con Scroll */}
                      <div className="max-h-64 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {GENRE_GROUPS.map((genre) => {
                          const items = groupedVaultItems[genre] || [];
                          if (items.length === 0) return null;

                          return (
                            <div key={genre} className="space-y-1.5">
                              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider bg-slate-900/90 rounded-lg border-l-4 border-amber-400">
                                <span>{genre}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {items.length}
                                </span>
                              </div>

                              <div className="flex flex-col gap-1">
                                {items.map((item) => {
                                  const isSelected = item.id === selectedItemId;
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedItemId(item.id);
                                        setIsDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 border ${
                                        isSelected
                                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/20'
                                          : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700 text-slate-200'
                                      }`}
                                    >
                                      <div className="flex flex-col gap-0.5 truncate">
                                        <span className="truncate font-mono">
                                          [{item.genre}] {item.name} ({item.romanNumerals.join(' - ')})
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                                          {item.level}
                                        </span>
                                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 text-cyan-300 font-mono font-bold border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
              >
                {selectedCategory === 'scale' &&
                  SCALE_CATALOG.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.formula})
                    </option>
                  ))}

                {selectedCategory === 'chord' &&
                  CHORD_CATALOG.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.symbol} - {c.name} ({c.formula})
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PASO 2: TÓNICA / TONALIDAD                                                */}
          {/* ========================================================================= */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]"></span>
                <span>Paso 2: Tónica / Tonalidad</span>
              </label>
              <span className="text-amber-400 font-black font-mono text-xs">
                Fundamental Activa: {rootNote}
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {CHROMATIC_NOTES.map((note) => {
                const isSelected = rootNote === note;
                return (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setRootNote(note)}
                    className={`py-2 rounded-lg font-mono font-black text-xs transition-all border ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30 scale-105'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {note}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASO 3: MODO DE EJECUCIÓN (TEXTURA & ARTICULACIÓN)                        */}
          {/* ========================================================================= */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold text-purple-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,1)]"></span>
                <span>Paso 3: Modo de Ejecución</span>
              </label>
              <span className="text-purple-300 font-mono text-[11px] font-bold">
                {executionMode === 'arpeggio' ? '🌊 Arpegio Extendido' : '🎹 Bloque Armónico'}
              </span>
            </div>

            {/* Switch Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExecutionMode('block')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  executionMode === 'block'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black border-amber-300 shadow-lg shadow-amber-500/25 scale-[1.01]'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>🎹 Bloques de Acordes / Comping</span>
              </button>

              <button
                type="button"
                onClick={() => setExecutionMode('arpeggio')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  executionMode === 'arpeggio'
                    ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 text-slate-950 font-black border-cyan-300 shadow-lg shadow-cyan-500/25 scale-[1.01]'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>🌊 Activar Arpegio Extendido</span>
              </button>
            </div>

            {/* Parámetros de Arpegio Extendido */}
            {executionMode === 'arpeggio' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
                {/* a) Rango de Octavas */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                    a) Rango de Octavas:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    {[
                      { id: 1, label: '1 Octava' },
                      { id: 2, label: '2 Octavas' },
                      { id: 3, label: '3 Octavas' },
                      { id: 'full', label: 'Full Keyboard' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setArpeggioOctaveSpan(item.id as ArpeggioOctaveSpan)}
                        className={`py-2 px-2 rounded-xl border text-center font-bold transition-all text-xs ${
                          arpeggioOctaveSpan === item.id
                            ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* b) Patrón de Movimiento */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                    b) Patrón de Movimiento (Articulación):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                    {[
                      { id: 'up', name: 'Ascendente (↗)', icon: ArrowUpRight },
                      { id: 'down', name: 'Descendente (↘)', icon: ArrowDownRight },
                      { id: 'upDown', name: 'Ida y Vuelta (↗↘)', icon: ArrowLeftRight },
                      { id: 'broken_alberti', name: 'Alberti Clásico (1-5-3-5)', icon: Music },
                      { id: 'broken_neosoul', name: 'Neo-Soul Waves (1-3-5-7-9...)', icon: Zap },
                      { id: 'handCross', name: 'Manos Cruzadas (Sweep)', icon: Hand },
                    ].map((pat) => {
                      const Icon = pat.icon;
                      const isSelected = arpeggioPattern === pat.id;
                      return (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => setArpeggioPattern(pat.id as ArpeggioMotionPattern)}
                          className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-400'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="truncate text-[11px] font-bold">{pat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* c) Subdivisión Rítmica */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                    c) Subdivisión Rítmica:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    {[
                      { id: '8n', label: '1/8 Corcheas' },
                      { id: '16n', label: '1/16 Semicorcheas' },
                      { id: '3T', label: '3T Tresillos' },
                      { id: '6T', label: '6T Seiscillos' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setArpeggioSubdivision(s.id as ArpeggioSubdivision)}
                        className={`py-2 px-2 rounded-xl border text-center font-bold transition-all text-xs ${
                          arpeggioSubdivision === s.id
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                            : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PASO 4: ASIGNACIÓN Y ENFOQUE DE MANO                                      */}
          {/* ========================================================================= */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-mono font-bold text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]"></span>
                <span>Paso 4: Asignación y Enfoque de Mano</span>
              </label>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                {handFocus === 'left' ? 'Registro grave < C4' : handFocus === 'right' ? 'Registro agudo ≥ C4' : 'Ambos registros'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setHandFocus('both')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  handFocus === 'both'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-500/30 scale-[1.01]'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">👐</span>
                <span>Ambas Manos</span>
              </button>

              <button
                type="button"
                onClick={() => setHandFocus('left')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  handFocus === 'left'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-600/30 scale-[1.01]'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">🤚</span>
                <span>Mano Izquierda</span>
              </button>

              <button
                type="button"
                onClick={() => setHandFocus('right')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  handFocus === 'right'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/30 scale-[1.01]'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">✋</span>
                <span>Mano Derecha</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PASO 5: TEMPO / BPM                                                       */}
          {/* ========================================================================= */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between font-mono">
              <span className="font-bold text-slate-300">Tempo / BPM (Metrónomo):</span>
              <span className="px-2.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-black text-xs">
                {bpm} BPM
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>50 (Lento)</span>
              <span>105 (Moderato)</span>
              <span>160 (Rápido)</span>
            </div>
          </div>

          {/* Pedagogical Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                Resumen de Rutina Matemática
              </span>
              <p className="text-slate-200 font-bold">
                {rootNote} {getItemName()} • {executionMode === 'arpeggio' ? `Arpegio ${arpeggioOctaveSpan === 'full' ? 'Full' : `${arpeggioOctaveSpan} Oct`} (${arpeggioPattern})` : 'Bloques Armónicos'} • {bpm} BPM
              </p>
              <p className="text-[11px] text-slate-400">
                Asignación:{' '}
                <span className="font-bold text-amber-300">
                  {handFocus === 'left' ? 'Solo Mano Izquierda' : handFocus === 'right' ? 'Solo Mano Derecha' : 'Ambas Manos'}
                </span>
                {executionMode === 'arpeggio' && (
                  <span className="text-cyan-400 ml-2">
                    Subdivisión: {arpeggioSubdivision}
                  </span>
                )}
              </p>
            </div>
            <div className="flex-shrink-0">
              <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 inline-block">
                <Music className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAndLoad}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-cyan-500/25 hover:brightness-110 flex items-center justify-center gap-2"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4 fill-current" />
                <span>💾 Actualizar y Guardar Cambios</span>
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 fill-current" />
                <span>🚀 Guardar y Cargar en Runway</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
