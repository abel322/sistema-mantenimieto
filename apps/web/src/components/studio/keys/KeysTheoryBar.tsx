'use client';

import React, { useState } from 'react';
import {
  CHROMATIC_NOTES,
  SCALE_CATALOG,
  CHORD_CATALOG,
  PROGRESSION_PRESETS,
  VoicingType,
  LabelType,
  AccompanimentTexture,
  ScaleDefinition,
  ChordDefinition,
  ProgressionPreset,
} from '@/services/theory/keysTheoryEngine';
import {
  BookOpen,
  Globe,
  Rocket,
  Sliders,
  Music,
  Sparkles,
  Layers,
  ChevronDown,
  Eye,
} from 'lucide-react';

interface KeysTheoryBarProps {
  rootNote: string;
  onRootNoteChange: (root: string) => void;
  selectedCategory: 'scale' | 'chord' | 'progression';
  onCategoryChange: (cat: 'scale' | 'chord' | 'progression') => void;
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
  const [activeTab, setActiveTab] = useState<'scales' | 'chords' | 'progressions'>('chords');

  const currentScale = SCALE_CATALOG.find((s) => s.id === selectedItemId);
  const currentChord = CHORD_CATALOG.find((c) => c.id === selectedItemId);
  const currentProgression = PROGRESSION_PRESETS.find((p) => p.id === selectedItemId);

  return (
    <div className={`w-full flex flex-col gap-4 p-5 rounded-2xl bg-[#080d1e]/95 border border-slate-800 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Header Bar & Global Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              Enciclopedia Armónica Sonora
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Motor de Voicings, Escalas y Progresiones de Jazz / Neo-Soul
            </p>
          </div>
        </div>

        {/* Global Key Root & Circle of Fifths Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Root Selector */}
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

      {/* Main Catalog Tabs (Escalas | Acordes | Progresiones) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab('chords');
              onCategoryChange('chord');
              onItemSelect(CHORD_CATALOG[0].id);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'chords'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Acordes &amp; Voicings
          </button>
          <button
            onClick={() => {
              setActiveTab('scales');
              onCategoryChange('scale');
              onItemSelect(SCALE_CATALOG[0].id);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'scales'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Escalas &amp; Modos
          </button>
          <button
            onClick={() => {
              setActiveTab('progressions');
              onCategoryChange('progression');
              onItemSelect(PROGRESSION_PRESETS[0].id);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'progressions'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Progresiones &amp; Géneros
          </button>
        </div>

        {/* Voicing Style Dropdown (When Chords or Progressions selected) */}
        {(selectedCategory === 'chord' || selectedCategory === 'progression') && (
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
              <option value="rootless" className="bg-slate-900 text-slate-100">Rootless (Estilo Bill Evans)</option>
              <option value="quartal" className="bg-slate-900 text-slate-100">Armonía Cuartal (McCoy Tyner)</option>
            </select>
          </div>
        )}
      </div>

      {/* Catalog Items Selector Grid */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
        {selectedCategory === 'chord' && (
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {CHORD_CATALOG.map((chord) => (
              <button
                key={chord.id}
                onClick={() => onItemSelect(chord.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  selectedItemId === chord.id
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {rootNote}
                {chord.symbol} <span className="text-[10px] opacity-75 font-normal">({chord.name})</span>
              </button>
            ))}
          </div>
        )}

        {selectedCategory === 'scale' && (
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {SCALE_CATALOG.map((scale) => (
              <button
                key={scale.id}
                onClick={() => onItemSelect(scale.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  selectedItemId === scale.id
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {rootNote} {scale.name}
              </button>
            ))}
          </div>
        )}

        {selectedCategory === 'progression' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
            {PROGRESSION_PRESETS.map((prog) => (
              <button
                key={prog.id}
                onClick={() => onItemSelect(prog.id)}
                className={`p-2 rounded-lg text-left font-mono transition-all border ${
                  selectedItemId === prog.id
                    ? 'bg-purple-950 text-purple-200 border-purple-500 shadow-md'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-cyan-400 font-bold uppercase">{prog.genre}</div>
                <div className="text-xs font-bold text-slate-100">{prog.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Item Active Description & Formula */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="space-y-1">
          <div className="font-extrabold text-cyan-400 font-mono flex items-center gap-2">
            <span>
              {selectedCategory === 'chord' && currentChord ? `${rootNote} ${currentChord.name}` : ''}
              {selectedCategory === 'scale' && currentScale ? `${rootNote} ${currentScale.name}` : ''}
              {selectedCategory === 'progression' && currentProgression ? `${currentProgression.name} (${currentProgression.genre})` : ''}
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            {currentChord?.description || currentScale?.description || currentProgression?.description}
          </p>
        </div>

        {/* Accompaniment Texture Selector & Master Load Button */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
