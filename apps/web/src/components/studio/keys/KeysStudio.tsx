'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  NoteInfo,
  RunwayStepNote,
  KeyboardRange,
  VoicingType,
  LabelType,
  AccompanimentTexture,
  CHORD_CATALOG,
  SCALE_CATALOG,
  PROGRESSION_PRESETS,
  getChordNotes,
  getScaleNotes,
  getTransposedFormulaChords,
  generateRunwaySequence,
} from '@/services/theory/keysTheoryEngine';
import { HARMONIC_VAULT } from '@/data/harmonicVaultData';
import { keysAudioEngine, TimbreType } from '@/services/audio/keysAudioEngine';
import InteractivePianoKeyboard from './InteractivePianoKeyboard';
import KeysRunwaySequencer from './KeysRunwaySequencer';
import KeysTheoryBar from './KeysTheoryBar';
import CircleOfFifthsModal from './CircleOfFifthsModal';
import {
  Headphones,
  Sliders,
  Sparkles,
  Music,
  ArrowLeft,
  Volume2,
  VolumeX,
  Zap,
  Disc,
} from 'lucide-react';

export default function KeysStudio() {
  // Audio Engine Controls
  const [timbre, setTimbre] = useState<TimbreType>('grand');
  const [sustainActive, setSustainActive] = useState(false);
  const [volumeDb, setVolumeDb] = useState(0);

  // Theory & Keyboard State
  const [rootNote, setRootNote] = useState('C');
  const [category, setCategory] = useState<'scale' | 'chord' | 'progression' | 'cadencia'>('cadencia');
  const [selectedItemId, setSelectedItemId] = useState('cad_pac');
  const [voicingType, setVoicingType] = useState<VoicingType>('close');
  const [texture, setTexture] = useState<AccompanimentTexture>('comping');
  const [labelType, setLabelType] = useState<LabelType>('notes');
  const [keyboardRange, setKeyboardRange] = useState<KeyboardRange>(61);

  // Modal State
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);

  // Sequencer & Active Notes State
  const [bpm, setBpm] = useState(115);
  const [stepRecordActive, setStepRecordActive] = useState(false);
  const [lastKeyboardTriggerNote, setLastKeyboardTriggerNote] = useState<NoteInfo | null>(null);
  const [activeNotesMap, setActiveNotesMap] = useState<Map<number, NoteInfo>>(new Map());

  // Runway Sequence array
  const [sequenceNotes, setSequenceNotes] = useState<RunwayStepNote[]>([]);

  // Update Timbre & Audio settings
  const handleTimbreChange = (newTimbre: TimbreType) => {
    setTimbre(newTimbre);
    keysAudioEngine.setTimbre(newTimbre);
  };

  const handleSustainToggle = () => {
    const next = !sustainActive;
    setSustainActive(next);
    keysAudioEngine.setSustainPedal(next);
  };

  const handleVolumeChange = (v: number) => {
    setVolumeDb(v);
    keysAudioEngine.setVolume(v);
  };

  // Generate Theory Preview Notes on Keyboard when theory selection changes
  useEffect(() => {
    const map = new Map<number, NoteInfo>();

    const vaultFormula = HARMONIC_VAULT.find((f) => f.id === selectedItemId);
    if (vaultFormula) {
      const transposed = getTransposedFormulaChords(vaultFormula, rootNote, voicingType);
      if (transposed.length > 0) {
        transposed[0].notes.forEach((n) => map.set(n.midi, n));
      }
    } else if (category === 'chord') {
      const notes = getChordNotes(rootNote, selectedItemId, voicingType, 4);
      notes.forEach((n) => map.set(n.midi, n));
    } else if (category === 'scale') {
      const notes = getScaleNotes(rootNote, selectedItemId, 4);
      notes.forEach((n) => map.set(n.midi, n));
    } else if (category === 'progression') {
      const prog = PROGRESSION_PRESETS.find((p) => p.id === selectedItemId);
      if (prog && prog.chords.length > 0) {
        const c0 = prog.chords[0];
        const notes = getChordNotes(rootNote, c0.chordId, voicingType, 4);
        notes.forEach((n) => map.set(n.midi, n));
      }
    }

    setActiveNotesMap(map);
  }, [rootNote, category, selectedItemId, voicingType]);

  // Master Action: Load calculated sequence into Runway
  const handleLoadIntoRunway = useCallback(() => {
    const seq = generateRunwaySequence(
      rootNote,
      selectedItemId,
      category,
      texture,
      voicingType,
      bpm
    );
    setSequenceNotes(seq);
  }, [rootNote, selectedItemId, category, texture, voicingType, bpm]);

  // Initial load into runway
  useEffect(() => {
    handleLoadIntoRunway();
  }, []);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/studio"
              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors mr-1"
              title="Volver al Studio"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="p-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black">
              <Headphones className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-extrabold">
              KEYS &amp; ADVANCED HARMONY WORKSTATION
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-semibold">
              Tone.js PolySynth
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Estudio Interactivo de Teclado, Piano &amp; Armonía Moderna
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Módulo aislado para práctica de piano, voicings de Jazz/Neo-Soul, secuenciador continuo Runway y enciclopedia teórica.
          </p>
        </div>

        {/* Timbre Switcher & Master Audio Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timbre Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => handleTimbreChange('grand')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                timbre === 'grand'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🎹 Grand Piano Acústico</span>
            </button>
            <button
              onClick={() => handleTimbreChange('rhodes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                timbre === 'rhodes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡ Neo-Soul EP (Rhodes)</span>
            </button>
          </div>

          {/* Sustain Pedal Button */}
          <button
            onClick={handleSustainToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
              sustainActive
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            Pedal Sustain {sustainActive ? '[ON]' : '[OFF]'}
          </button>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <input
              type="range"
              min="-40"
              max="6"
              value={volumeDb}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 1. Theory Bar & Harmonic Catalog */}
      <KeysTheoryBar
        rootNote={rootNote}
        onRootNoteChange={setRootNote}
        selectedCategory={category}
        onCategoryChange={setCategory}
        selectedItemId={selectedItemId}
        onItemSelect={setSelectedItemId}
        voicingType={voicingType}
        onVoicingChange={setVoicingType}
        texture={texture}
        onTextureChange={setTexture}
        labelType={labelType}
        onLabelTypeChange={setLabelType}
        onOpenCircleOfFifths={() => setIsCircleModalOpen(true)}
        onLoadIntoRunway={handleLoadIntoRunway}
      />

      {/* 2. Interactive Piano Keyboard */}
      <InteractivePianoKeyboard
        range={keyboardRange}
        onRangeChange={setKeyboardRange}
        activeNotesMap={activeNotesMap}
        activeLabelType={labelType}
        onKeyTrigger={(note, isDown) => {
          if (isDown) setLastKeyboardTriggerNote(note);
        }}
      />

      {/* 3. Runway Sequencer */}
      <KeysRunwaySequencer
        sequenceNotes={sequenceNotes}
        onSequenceUpdate={setSequenceNotes}
        onActiveNotesChange={setActiveNotesMap}
        bpm={bpm}
        onBpmChange={setBpm}
        stepRecordActive={stepRecordActive}
        onStepRecordToggle={setStepRecordActive}
        lastKeyboardTriggerNote={lastKeyboardTriggerNote}
      />

      {/* 4. Circle of Fifths Modal */}
      <CircleOfFifthsModal
        isOpen={isCircleModalOpen}
        onClose={() => setIsCircleModalOpen(false)}
        onSelectKey={(k) => setRootNote(k)}
        activeKey={rootNote}
      />
    </div>
  );
}
