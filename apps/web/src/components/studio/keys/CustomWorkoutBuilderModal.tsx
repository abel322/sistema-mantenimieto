'use client';

import React, { useState, useId } from 'react';
import {
  CHROMATIC_NOTES,
  SCALE_CATALOG,
  CHORD_CATALOG,
  PROGRESSION_PRESETS,
  AccompanimentTexture,
  VoicingType,
} from '@/services/theory/keysTheoryEngine';
import { HARMONIC_VAULT } from '@/data/harmonicVaultData';
import { PracticeRoutine, HandFocus } from '@/data/practiceWorkoutsData';
import {
  X,
  Sparkles,
  Sliders,
  Hand,
  Rocket,
  Music,
  BookOpen,
  Zap,
  Layers,
  ChevronRight,
  Gauge,
  Clock,
  Check,
} from 'lucide-react';

interface CustomWorkoutBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndLoad: (routine: PracticeRoutine) => void;
}

export default function CustomWorkoutBuilderModal({
  isOpen,
  onClose,
  onSaveAndLoad,
}: CustomWorkoutBuilderModalProps) {
  // 1. Título
  const [title, setTitle] = useState('');

  // 2. Enfoque de Mano
  const [handFocus, setHandFocus] = useState<HandFocus>('both');

  // 3. Fuente Teórica
  const [sourceCategory, setSourceCategory] = useState<'scale' | 'chord' | 'progression' | 'cadencia'>('chord');
  const [selectedItemId, setSelectedItemId] = useState('maj7');

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

  if (!isOpen) return null;

  // Handle source category change
  const handleCategoryChange = (cat: 'scale' | 'chord' | 'progression' | 'cadencia') => {
    setSourceCategory(cat);
    if (cat === 'scale') setSelectedItemId(SCALE_CATALOG[0].id);
    else if (cat === 'chord') setSelectedItemId(CHORD_CATALOG[2]?.id || CHORD_CATALOG[0].id); // Maj7
    else if (cat === 'progression') setSelectedItemId(PROGRESSION_PRESETS[0].id);
    else if (cat === 'cadencia') setSelectedItemId(HARMONIC_VAULT[0].id);
  };

  // Get human name of selected item
  const getItemName = () => {
    if (sourceCategory === 'scale') {
      const s = SCALE_CATALOG.find((x) => x.id === selectedItemId);
      return s ? `Escala ${s.name}` : selectedItemId;
    }
    if (sourceCategory === 'chord') {
      const c = CHORD_CATALOG.find((x) => x.id === selectedItemId);
      return c ? `${c.symbol} (${c.name})` : selectedItemId;
    }
    if (sourceCategory === 'progression') {
      const p = PROGRESSION_PRESETS.find((x) => x.id === selectedItemId);
      return p ? p.name : selectedItemId;
    }
    const v = HARMONIC_VAULT.find((x) => x.id === selectedItemId);
    return v ? v.name : selectedItemId;
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

  // Save & Load handler
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
      category: sourceCategory,
      targetItemId: selectedItemId,
      targetItemName: `${rootNote} ${itemName}`,
      leftHandInstruction: leftInstruction,
      rightHandInstruction: rightInstruction,
      pedagogicalTip:
        'Concéntrate en la relajación muscular de antebrazo y muñeca. Usa el metrónomo integrado para afianzar el tempo.',
      handFocus,
      subdivision,
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
                { id: 'chord', label: '🎹 Acordes & Voicings' },
                { id: 'scale', label: '🎼 Escalas & Modos' },
                { id: 'progression', label: '🔄 Progresiones Armónicas' },
                { id: 'cadencia', label: '🏛️ Cadencias Maestras (Vault)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleCategoryChange(c.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold text-[11px] transition-all border ${
                    sourceCategory === c.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Select item in chosen category */}
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 text-cyan-300 font-mono font-bold border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs cursor-pointer"
            >
              {sourceCategory === 'scale' &&
                SCALE_CATALOG.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.formula})
                  </option>
                ))}

              {sourceCategory === 'chord' &&
                CHORD_CATALOG.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.symbol} - {c.name} ({c.formula})
                  </option>
                ))}

              {sourceCategory === 'progression' &&
                PROGRESSION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.genre}] {p.name}
                  </option>
                ))}

              {sourceCategory === 'cadencia' &&
                HARMONIC_VAULT.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.genre}] {v.name} ({v.romanNumerals.join(' - ')})
                  </option>
                ))}
            </select>
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
