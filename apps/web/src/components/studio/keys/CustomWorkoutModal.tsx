'use client';

import React, { useState, useMemo } from 'react';
import {
  CHROMATIC_NOTES,
  SCALE_CATALOG,
  CHORD_CATALOG,
  AccompanimentTexture,
  VoicingType,
  RunwayNoteEvent,
  getTransposedFormulaChords,
  generateRunwaySequence,
} from '@/services/theory/keysTheoryEngine';
import { HARMONIC_VAULT, HarmonicFormula } from '@/data/harmonicVaultData';
import { PracticeRoutine, HandFocus } from '@/data/practiceWorkoutsData';
import { stepNotesToRunwayNoteEvents } from '@/services/theory/workoutEngine';
import {
  X,
  Sparkles,
  Rocket,
  Music,
  ChevronDown,
  Check,
  Search,
} from 'lucide-react';

export interface CustomWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndLoad: (routine: PracticeRoutine) => void;
}

export default function CustomWorkoutModal({
  isOpen,
  onClose,
  onSaveAndLoad,
}: CustomWorkoutModalProps) {
  // =========================================================================
  // HOOKS SIEMPRE DECLARADOS EN EL NIVEL SUPERIOR (SIN CONDICIÓN PREVIA)
  // =========================================================================

  // 1. Título
  const [title, setTitle] = useState('');

  // 2. Enfoque de Mano
  const [handFocus, setHandFocus] = useState<HandFocus>('both');

  // 3. Búsqueda y Categoría Teórica
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'progression' | 'cadence' | 'chord' | 'scale'>('progression');
  const [selectedItemId, setSelectedItemId] = useState('prog_251_major_classic');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 4. Tónica / Tonalidad
  const [rootNote, setRootNote] = useState('C');

  // 5. Textura / Patrón
  const [texture, setTexture] = useState<AccompanimentTexture>('arpeggio_asc');

  // 6. Subdivisión Rítmica
  const [subdivision, setSubdivision] = useState<'1/4' | '1/8' | '1/16' | '3:2_eighth'>('1/8');

  // 7. Rango de BPM
  const [bpm, setBpm] = useState(85);

  // Optional Voicing
  const [voicingType, setVoicingType] = useState<VoicingType>('close');

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

  // Helper for texture label
  const getTextureLabel = (t: AccompanimentTexture) => {
    switch (t) {
      case 'arpeggio_asc':
        return 'Arpegio Ascendente';
      case 'arpeggio_desc':
        return 'Arpegio Descendente';
      case 'comping':
        return 'Bloques Rítmicos / Comping';
      case 'alberti_bass':
        return 'Alberti Bass (1-5-3-5)';
      case 'lh_bass_rh_chord':
        return 'Bajo + Acorde Dividido';
      case 'walking_bass':
        return 'Walking Bassline';
      default:
        return t;
    }
  };

  // Inyección Automática en el Runway: resolución de acordes de la fórmula
  const generateNotesForRoutine = (): RunwayNoteEvent[] => {
    if (selectedCategory === 'cadence' || selectedCategory === 'progression') {
      const vaultFormula = HARMONIC_VAULT?.find((item) => item.id === selectedItemId);
      if (vaultFormula) {
        const transposedChords = getTransposedFormulaChords(vaultFormula, rootNote, voicingType);
        const events: RunwayNoteEvent[] = [];
        let currentBeat = 0;
        const durationPerChord = 4; // 4 beats por acorde

        transposedChords.forEach((chordData, chordIdx) => {
          const cNotes = chordData.notes;
          const bassNote = cNotes[0];
          const upperNotes = cNotes.length > 1 ? cNotes.slice(1) : cNotes;

          if (texture === 'comping') {
            [0, 2].forEach((offset) => {
              cNotes.forEach((n) => {
                let assignedHand: 'left' | 'right' = 'right';
                if (handFocus === 'left') assignedHand = 'left';
                else if (handFocus === 'right') assignedHand = 'right';
                else assignedHand = n.midi < 60 ? 'left' : 'right';

                events.push({
                  id: `cust_comp_${chordIdx}_${offset}_${n.midi}`,
                  note: n.fullNote,
                  midi: n.midi,
                  time: currentBeat + offset,
                  step: Math.floor(((currentBeat + offset) % 4) / 0.5),
                  duration: '2n',
                  hand: assignedHand,
                  velocity: 0.85,
                });
              });
            });
          } else if (texture === 'arpeggio_asc') {
            const stepBeats = subdivision === '1/16' ? 0.25 : subdivision === '3:2_eighth' ? 1 / 3 : 0.5;
            const durString = subdivision === '1/16' ? '16n' : subdivision === '3:2_eighth' ? '3T' : '8n';
            cNotes.forEach((n, nIdx) => {
              let assignedHand: 'left' | 'right' = 'right';
              if (handFocus === 'left') assignedHand = 'left';
              else if (handFocus === 'right') assignedHand = 'right';
              else assignedHand = n.midi < 60 ? 'left' : 'right';

              const time = currentBeat + nIdx * stepBeats;
              events.push({
                id: `cust_arp_${chordIdx}_${nIdx}_${n.midi}`,
                note: n.fullNote,
                midi: n.midi,
                time: Number(time.toFixed(4)),
                step: Math.floor((time % 4) / stepBeats),
                duration: durString,
                hand: assignedHand,
                velocity: 0.85,
              });
            });
          } else if (texture === 'arpeggio_desc') {
            const stepBeats = subdivision === '1/16' ? 0.25 : subdivision === '3:2_eighth' ? 1 / 3 : 0.5;
            const durString = subdivision === '1/16' ? '16n' : subdivision === '3:2_eighth' ? '3T' : '8n';
            [...cNotes].reverse().forEach((n, nIdx) => {
              let assignedHand: 'left' | 'right' = 'right';
              if (handFocus === 'left') assignedHand = 'left';
              else if (handFocus === 'right') assignedHand = 'right';
              else assignedHand = n.midi < 60 ? 'left' : 'right';

              const time = currentBeat + nIdx * stepBeats;
              events.push({
                id: `cust_arpd_${chordIdx}_${nIdx}_${n.midi}`,
                note: n.fullNote,
                midi: n.midi,
                time: Number(time.toFixed(4)),
                step: Math.floor((time % 4) / stepBeats),
                duration: durString,
                hand: assignedHand,
                velocity: 0.85,
              });
            });
          } else if (texture === 'alberti_bass') {
            const root = cNotes[0];
            const third = cNotes.length >= 2 ? cNotes[1] : cNotes[0];
            const fifth = cNotes.length >= 3 ? cNotes[2] : cNotes.length >= 2 ? cNotes[1] : cNotes[0];
            const albNotes = [root, fifth, third, fifth, root, fifth, third, fifth];
            albNotes.forEach((n, nIdx) => {
              let assignedHand: 'left' | 'right' = 'right';
              if (handFocus === 'left') assignedHand = 'left';
              else if (handFocus === 'right') assignedHand = 'right';
              else assignedHand = n.midi < 60 ? 'left' : 'right';

              const time = currentBeat + nIdx * 0.5;
              events.push({
                id: `cust_alb_${chordIdx}_${nIdx}_${n.midi}`,
                note: n.fullNote,
                midi: n.midi,
                time: Number(time.toFixed(4)),
                step: Math.floor((time % 4) / 0.5),
                duration: '8n',
                hand: assignedHand,
                velocity: 0.85,
              });
            });
          } else {
            // Bajo LH
            events.push({
              id: `cust_bass_${chordIdx}_0`,
              note: bassNote.fullNote,
              midi: bassNote.midi,
              time: currentBeat,
              step: 0,
              duration: '2n',
              hand: handFocus === 'right' ? 'right' : 'left',
              velocity: 0.9,
            });
            events.push({
              id: `cust_bass_${chordIdx}_2`,
              note: bassNote.fullNote,
              midi: bassNote.midi,
              time: currentBeat + 2,
              step: 4,
              duration: '2n',
              hand: handFocus === 'right' ? 'right' : 'left',
              velocity: 0.9,
            });
            // Acordes RH
            upperNotes.forEach((n) => {
              events.push({
                id: `cust_up_${chordIdx}_${n.midi}_0.5`,
                note: n.fullNote,
                midi: n.midi,
                time: currentBeat + 0.5,
                step: 1,
                duration: '1.5n',
                hand: handFocus === 'left' ? 'left' : 'right',
                velocity: 0.8,
              });
              events.push({
                id: `cust_up_${chordIdx}_${n.midi}_2.5`,
                note: n.fullNote,
                midi: n.midi,
                time: currentBeat + 2.5,
                step: 5,
                duration: '1.5n',
                hand: handFocus === 'left' ? 'left' : 'right',
                velocity: 0.8,
              });
            });
          }

          currentBeat += durationPerChord;
        });

        return events;
      }
    }

    // Default para escalas o acordes individuales
    const seq = generateRunwaySequence(
      rootNote,
      selectedItemId,
      selectedCategory === 'cadence' ? ('cadencia' as any) : (selectedCategory as any),
      texture,
      voicingType,
      bpm
    );
    const evs = stepNotesToRunwayNoteEvents(seq);
    return evs.map((e) => {
      let finalHand = e.hand;
      if (handFocus === 'left') finalHand = 'left';
      else if (handFocus === 'right') finalHand = 'right';
      return {
        ...e,
        hand: finalHand,
      };
    });
  };

  // Save & Load handler con inyección inmediata en Runway
  const handleSaveAndLoad = () => {
    const finalTitle = title.trim() || `Rutina Personalizada: ${rootNote} ${getItemName()}`;
    const itemName = getItemName();

    let leftInstruction = '';
    let rightInstruction = '';

    if (handFocus === 'left') {
      leftInstruction = `Mano Izquierda: Bajo y arpegios en registro grave (< C4) con pulso estable.`;
      rightInstruction = `Mano Derecha en reposo sobre el regazo o marcando el pulso.`;
    } else if (handFocus === 'right') {
      leftInstruction = `Mano Izquierda en reposo para concentrar la técnica en mano derecha.`;
      rightInstruction = `Mano Derecha: Fraseo melódico y acordes en registro agudo (≥ C4).`;
    } else {
      leftInstruction = `Mano Izquierda: Línea de bajo y soporte armónico con dedos 5-1.`;
      rightInstruction = `Mano Derecha: Melodía, acordes o arpegio complementario.`;
    }

    const generatedNotes = generateNotesForRoutine();
    const routineCategory = selectedCategory === 'cadence' ? 'cadencia' : selectedCategory;

    const newRoutine: PracticeRoutine = {
      id: `custom_${Date.now()}`,
      title: finalTitle,
      objective: `Entrenamiento personalizado creado por el estudiante. Enfoque: ${
        handFocus === 'left' ? 'Mano Izquierda' : handFocus === 'right' ? 'Mano Derecha' : 'Ambas Manos'
      } sobre ${rootNote} ${itemName}.`,
      bpm,
      bpmRange: `${Math.max(40, bpm - 10)} - ${Math.min(200, bpm + 10)} BPM`,
      rootNote,
      texture,
      voicingType,
      category: routineCategory,
      targetItemId: selectedItemId,
      targetItemName: `${rootNote} ${itemName}`,
      leftHandInstruction: leftInstruction,
      rightHandInstruction: rightInstruction,
      pedagogicalTip:
        'Concéntrate en la relajación muscular de antebrazo y muñeca. Usa el metrónomo integrado para afianzar el tempo.',
      handFocus,
      subdivision,
      notes: generatedNotes,
    };

    // Save to localStorage
    try {
      const stored = localStorage.getItem('sonora_keys_custom_workouts');
      const list: PracticeRoutine[] = stored ? JSON.parse(stored) : [];
      list.unshift(newRoutine);
      localStorage.setItem('sonora_keys_custom_workouts', JSON.stringify(list));
    } catch (e) {
      console.error('Error saving custom workout to localStorage', e);
    }

    onSaveAndLoad(newRoutine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-b from-[#0e172e] via-[#091024] to-[#060a17] border border-cyan-500/30 shadow-2xl p-5 sm:p-7 text-white flex flex-col gap-6">
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                Sonora Academy • Laboratorio Pedagógico
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Crear Entrenamiento Personalizado
            </h2>
            <p className="text-xs text-slate-300">
              Diseña una rutina a la medida de tus objetivos técnicos. Se inyectará inmediatamente en el Runway interactivo.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex flex-col gap-5 text-xs">
          {/* 1. Título */}
          <div className="space-y-1.5">
            <label className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <span>1. Título de la práctica:</span>
              <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='ej. "Mi rutina matutina de Funk", "Velocidad en Arpegios Menores"...'
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-sans transition-all"
            />
          </div>

          {/* 2. Enfoque de Mano (Hand Focus Selector) */}
          <div className="space-y-2">
            <label className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <span>2. Enfoque de Mano:</span>
              <span className="text-cyan-400 font-mono text-[11px] font-semibold">
                {handFocus === 'left' ? '(Aísla registro grave < C4)' : handFocus === 'right' ? '(Aísla registro agudo ≥ C4)' : '(Ambos planos)'}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setHandFocus('left')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  handFocus === 'left'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-600/30 scale-[1.02]'
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
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black border-cyan-400 shadow-lg shadow-cyan-500/30 scale-[1.02]'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">✋</span>
                <span>Mano Derecha</span>
              </button>

              <button
                type="button"
                onClick={() => setHandFocus('both')}
                className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                  handFocus === 'both'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-500/30 scale-[1.02]'
                    : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-base">👐</span>
                <span>Ambas Manos</span>
              </button>
            </div>
          </div>

          {/* 3. Fuente Teórica */}
          <div className="space-y-2">
            <label className="font-mono font-bold text-slate-300">
              3. Fuente Teórica de la Librería:
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { id: 'progression', label: '🎼 Progresiones Armónicas', count: progressionItems.length },
                { id: 'cadence', label: '🏛️ Cadencias Maestras (Vault)', count: cadenceItems.length },
                { id: 'chord', label: '🎹 Acordes & Voicings', count: CHORD_CATALOG.length },
                { id: 'scale', label: '📐 Escalas & Modos', count: SCALE_CATALOG.length },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryChange(c.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold text-[11px] transition-all border flex items-center gap-1.5 ${
                    selectedCategory === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-400 border border-slate-800">
                    {c.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Selector de Fórmula / Ítem */}
            {selectedCategory === 'progression' || selectedCategory === 'cadence' ? (
              <div className="relative space-y-2">
                {/* Botón Trigger / Desplegable Enriquecido */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/90 text-cyan-300 font-mono font-bold border border-cyan-500/40 hover:border-cyan-400 focus:outline-none transition-all flex items-center justify-between shadow-lg text-left group"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs shrink-0">
                      {selectedCategory === 'progression' ? '🎼' : '🏛️'}
                    </span>
                    <span className="truncate text-xs text-cyan-200">
                      {activeVaultItem
                        ? `[${activeVaultItem.genre}] ${activeVaultItem.name} (${activeVaultItem.romanNumerals.join(' - ')})`
                        : 'Seleccionar fórmula armónica de la Mega-Librería...'}
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

                {/* Panel Desplegable Flotante con Buscador en Tiempo Real y Agrupación */}
                {isDropdownOpen && (
                  <>
                    {/* Backdrop transparente para cerrar al hacer clic fuera */}
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDropdownOpen(false)}
                    />

                    <div className="relative z-30 w-full rounded-2xl bg-[#091024] border border-cyan-500/40 shadow-2xl p-3 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                      {/* Campo de Búsqueda Interactiva */}
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
                          {filteredVaultItems.length} {filteredVaultItems.length === 1 ? 'fórmula' : 'fórmulas'}
                        </span>
                      </div>

                      {/* Lista con Scroll y Agrupación por Géneros (Optgroups / Secciones Visuales) */}
                      <div className="max-h-72 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                        {GENRE_GROUPS.map((genre) => {
                          const items = groupedVaultItems[genre] || [];
                          if (items.length === 0) return null;

                          return (
                            <div key={genre} className="space-y-1.5">
                              {/* Header de la Sección de Género */}
                              <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300 uppercase tracking-wider bg-slate-900/90 rounded-lg border-l-4 border-amber-400">
                                <span>{genre}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {items.length} {items.length === 1 ? 'fórmula' : 'fórmulas'}
                                </span>
                              </div>

                              {/* Opciones dentro del género */}
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
                                        {item.description && (
                                          <span className="text-[10px] text-slate-400 font-sans truncate">
                                            {item.description}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span
                                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                                            item.level === 'Basico'
                                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                              : item.level === 'Intermedio'
                                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                              : item.level === 'Avanzado'
                                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                                          }`}
                                        >
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

                        {filteredVaultItems.length === 0 && (
                          <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                            <span className="text-xl">🔍</span>
                            <span>No se encontraron fórmulas armónicas para &quot;{searchQuery}&quot;</span>
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="text-cyan-400 underline text-xs mt-1 hover:text-cyan-300"
                            >
                              Limpiar búsqueda
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Select estándar para Escalas o Acordes */
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

          {/* 4. Tónica / Tonalidad */}
          <div className="space-y-2">
            <label className="font-mono font-bold text-slate-300 flex items-center justify-between">
              <span>4. Tónica / Tonalidad:</span>
              <span className="text-amber-400 font-black font-mono">Tonalidad: {rootNote}</span>
            </label>
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

          {/* 5. Textura / Patrón */}
          <div className="space-y-2">
            <label className="font-mono font-bold text-slate-300">
              5. Textura / Patrón de Acompañamiento:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { id: 'arpeggio_asc', name: 'Arpegio Ascendente', desc: 'Flujo melódico ascendente continuo' },
                { id: 'arpeggio_desc', name: 'Arpegio Descendente', desc: 'Cascada armónica descendente' },
                { id: 'comping', name: 'Bloques Rítmicos / Comping', desc: 'Acordes en bloque para ritmo y swing' },
                { id: 'alberti_bass', name: 'Alberti Bass (1-5-3-5)', desc: 'Clásico patrón de rotación bajo-quinta-tercera' },
                { id: 'lh_bass_rh_chord', name: 'Bajo + Acorde Dividido', desc: 'Bajo en tónica (LH) y voicing en contratiempo (RH)' },
              ].map((tex) => (
                <button
                  key={tex.id}
                  type="button"
                  onClick={() => setTexture(tex.id as AccompanimentTexture)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                    texture === tex.id
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`font-black text-xs ${texture === tex.id ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {tex.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">{tex.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Subdivisión Rítmica & 7. Rango de BPM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* 6. Subdivisión */}
            <div className="space-y-2">
              <label className="font-mono font-bold text-slate-300">
                6. Subdivisión Rítmica:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '1/4', label: '1/4 Negras' },
                  { id: '1/8', label: '1/8 Corcheas' },
                  { id: '1/16', label: '1/16 Semicorcheas' },
                  { id: '3:2_eighth', label: 'Tresillos 3:2' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubdivision(s.id as any)}
                    className={`py-2 px-2.5 rounded-xl font-mono text-[11px] font-bold border transition-all ${
                      subdivision === s.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Rango de BPM Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-300">7. Tempo / BPM:</span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-black">
                  {bpm} BPM
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
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
            </div>
          </div>

          {/* Pedagogical Summary Pill */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                Resumen de Configuración
              </span>
              <p className="text-slate-200 font-bold">
                {rootNote} {getItemName()} • {getTextureLabel(texture)} • {bpm} BPM
              </p>
              <p className="text-[11px] text-slate-400">
                Enfoque:{' '}
                <span className="font-bold text-amber-300">
                  {handFocus === 'left' ? 'Mano Izquierda' : handFocus === 'right' ? 'Mano Derecha' : 'Ambas Manos'}
                </span>
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
            <Rocket className="w-4 h-4 fill-current" />
            <span>🚀 Guardar y Cargar en Runway</span>
          </button>
        </div>
      </div>
    </div>
  );
}
