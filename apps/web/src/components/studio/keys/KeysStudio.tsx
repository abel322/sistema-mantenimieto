'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import * as Tone from 'tone';
import {
  NoteInfo,
  RunwayStepNote,
  KeyboardRange,
  VoicingType,
  LabelType,
  AccompanimentTexture,
  CHROMATIC_NOTES,
  CHORD_CATALOG,
  SCALE_CATALOG,
  PROGRESSION_PRESETS,
  getChordNotes,
  getScaleNotes,
  getTransposedFormulaChords,
  generateRunwaySequence,
} from '@/services/theory/keysTheoryEngine';
import { HARMONIC_VAULT } from '@/data/harmonicVaultData';
import {
  WORKOUT_LEVELS,
  PracticeRoutine,
  HandFocus,
} from '@/data/practiceWorkoutsData';
import {
  RunwayNoteEvent,
  generateWorkoutRunwayNotes,
  stepNotesToRunwayNoteEvents,
} from '@/services/theory/workoutEngine';
import { keysAudioEngine, TimbreType } from '@/services/audio/keysAudioEngine';
import InteractivePianoKeyboard from './InteractivePianoKeyboard';
import KeysRunwaySequencer from './KeysRunwaySequencer';
import KeysTheoryBar from './KeysTheoryBar';
import WorkoutsDashboard from './WorkoutsDashboard';
import JamStation from './JamStation';
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
  Target,
  Radio,
  BookOpen,
  Layers,
} from 'lucide-react';

export type WorkflowMode = 'workouts' | 'jam' | 'theory';

export default function KeysStudio() {
  // Master Workflow Mode Selector
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('workouts');

  // Audio Engine Controls
  const [timbre, setTimbre] = useState<TimbreType>('grand');
  const [sustainActive, setSustainActive] = useState(false);
  const [volumeDb, setVolumeDb] = useState(0);

  // Theory & Keyboard State
  const [rootNote, setRootNote] = useState('C');
  const [category, setCategory] = useState<'scale' | 'chord' | 'progression' | 'cadencia' | 'progresion'>('cadencia');
  const [selectedItemId, setSelectedItemId] = useState('cad_pac');
  const [voicingType, setVoicingType] = useState<VoicingType>('close');
  const [texture, setTexture] = useState<AccompanimentTexture>('comping');
  const [labelType, setLabelType] = useState<LabelType>('notes');
  const [keyboardRange, setKeyboardRange] = useState<KeyboardRange>(61);

  // Active Practice Routine (for Level Training Mode)
  const [activeRoutine, setActiveRoutine] = useState<PracticeRoutine | null>(
    WORKOUT_LEVELS[0].routines[0]
  );
  const [handFocus, setHandFocus] = useState<HandFocus>('both');
  const [autoPlayRunway, setAutoPlayRunway] = useState(false);

  // Jam Mode State
  const [selectedJamScaleId, setSelectedJamScaleId] = useState('dorian');
  const [smartGuardActive, setSmartGuardActive] = useState(true);
  const [blockWrongKeys, setBlockWrongKeys] = useState(false);

  // Modal State
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);

  // Sequencer & Active Notes State
  const [bpm, setBpm] = useState(75);
  const [stepRecordActive, setStepRecordActive] = useState(false);
  const [lastKeyboardTriggerNote, setLastKeyboardTriggerNote] = useState<NoteInfo | null>(null);
  const [activeNotesMap, setActiveNotesMap] = useState<Map<number, NoteInfo>>(new Map());

  // Runway Sequence array
  const [sequenceNotes, setSequenceNotes] = useState<RunwayNoteEvent[]>([]);

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

  // Compute Smart Key Guard sets (Target Notes, Safe Notes, and PC keyboard letters)
  const { targetNotesSet, safeNotesSet, pcKeyLabelsMap } = useMemo(() => {
    const targets = new Set<number>();
    const safes = new Set<number>();
    const pcMap = new Map<number, string>();

    const rootIdx = CHROMATIC_NOTES.indexOf(rootNote);
    const validRootIdx = rootIdx >= 0 ? rootIdx : 0;
    const scale = SCALE_CATALOG.find((s) => s.id === selectedJamScaleId) || SCALE_CATALOG[0];

    // Build for octaves 2 to 7
    for (let oct = 2; oct <= 7; oct++) {
      const rootMidi = 12 * (oct + 1) + validRootIdx;
      const fifthMidi = rootMidi + 7;

      targets.add(rootMidi);
      targets.add(fifthMidi);

      scale.intervals.forEach((semi) => {
        const midi = rootMidi + semi;
        if (midi !== rootMidi && midi !== fifthMidi) {
          safes.add(midi);
        }
      });
    }

    // Build PC Keyboard letter mapping starting at Octave 4
    const laptopKeys = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'];
    const scaleMidisOct4: number[] = [];
    for (let oct = 4; oct <= 5; oct++) {
      const rootMidi = 12 * (oct + 1) + validRootIdx;
      scale.intervals.forEach((semi) => {
        scaleMidisOct4.push(rootMidi + semi);
      });
    }

    scaleMidisOct4.slice(0, laptopKeys.length).forEach((midi, idx) => {
      pcMap.set(midi, laptopKeys[idx]);
    });

    return { targetNotesSet: targets, safeNotesSet: safes, pcKeyLabelsMap: pcMap };
  }, [rootNote, selectedJamScaleId]);

  // Generate Theory Preview Notes on Keyboard when theory selection changes
  useEffect(() => {
    if (workflowMode === 'jam') return; // in jam mode, smart guard handles illumination

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
  }, [rootNote, category, selectedItemId, voicingType, workflowMode]);

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
    const events = stepNotesToRunwayNoteEvents(seq);
    setSequenceNotes(events);
    try {
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.seconds = 0;
    } catch (e) {
      console.warn('Tone.Transport error', e);
    }
  }, [rootNote, selectedItemId, category, texture, voicingType, bpm]);

  // Handler: Select a Routine from Workouts Dashboard
  const handleSelectRoutine = (routine: PracticeRoutine) => {
    setActiveRoutine(routine);
    if (routine.handFocus) {
      setHandFocus(routine.handFocus);
    }
    setRootNote(routine.rootNote);
    const targetBpm = routine.bpm || (routine as any).targetBpm || 120;
    setBpm(targetBpm);
    setTexture(routine.texture);
    setVoicingType(routine.voicingType);
    setCategory(routine.category);
    setSelectedItemId(routine.targetItemId);

    // 1. Generate concrete note events for the routine
    const runwayNotes = generateWorkoutRunwayNotes(routine);

    // 2. Set runway sequence directly
    setSequenceNotes(runwayNotes);

    // 3. Adjust Tone.Transport BPM and reset to 0
    try {
      Tone.Transport.bpm.value = targetBpm;
      Tone.Transport.seconds = 0;
    } catch (e) {
      console.warn('Tone.Transport error', e);
    }

    // 4. Auto-trigger playback in Runway!
    setAutoPlayRunway(true);
    setTimeout(() => setAutoPlayRunway(false), 200);
  };

  // Initial load into runway
  useEffect(() => {
    if (activeRoutine) {
      handleSelectRoutine(activeRoutine);
    } else {
      handleLoadIntoRunway();
    }
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
            Sistema pedagógico integral: entrenamientos progresivos por nivel, sala de improvisación guiada y enciclopedia armónica completa.
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
              <span>🎹 Grand Piano</span>
            </button>
            <button
              onClick={() => handleTimbreChange('rhodes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                timbre === 'rhodes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⚡ Neo-Soul Rhodes</span>
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
            Sustain {sustainActive ? '[ON]' : '[OFF]'}
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

      {/* ======================================================= */}
      {/* 1. SELECTOR MAESTRO DE MODALIDAD (Workstation Header)   */}
      {/* ======================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-[#090f21] border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setWorkflowMode('workouts')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              workflowMode === 'workouts'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.01]'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            <Target className="w-4 h-4 fill-current" />
            <span>🎯 Entrenamientos por Nivel</span>
          </button>

          <button
            onClick={() => setWorkflowMode('jam')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              workflowMode === 'jam'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-[1.01]'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>🎷 Modo Jam &amp; Improvisación</span>
          </button>

          <button
            onClick={() => setWorkflowMode('theory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              workflowMode === 'theory'
                ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.01]'
                : 'bg-slate-950/70 text-slate-400 hover:text-white border border-slate-800/80'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📚 Explorador Teórico Libre</span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 pr-3 font-mono text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>
            {workflowMode === 'workouts'
              ? 'Práctica Dirigida: 4 Niveles'
              : workflowMode === 'jam'
              ? 'Sala de Jam: Smart Guard Activo'
              : 'Enciclopedia: 69 Acordes + 200 Cadencias'}
          </span>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 2. DYNAMIC WORKSTATION VIEW (Workouts / Jam / Theory)   */}
      {/* ======================================================= */}
      {workflowMode === 'workouts' && (
        <WorkoutsDashboard
          activeRoutineId={activeRoutine?.id}
          onSelectRoutine={handleSelectRoutine}
          handFocus={handFocus}
          onHandFocusChange={setHandFocus}
        />
      )}

      {workflowMode === 'jam' && (
        <JamStation
          rootNote={rootNote}
          onRootNoteChange={setRootNote}
          selectedScaleId={selectedJamScaleId}
          onSelectScaleId={setSelectedJamScaleId}
          smartGuardActive={smartGuardActive}
          onSmartGuardToggle={setSmartGuardActive}
          blockWrongKeys={blockWrongKeys}
          onBlockWrongKeysToggle={setBlockWrongKeys}
        />
      )}

      {workflowMode === 'theory' && (
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
      )}

      {/* ======================================================= */}
      {/* 3. INTERACTIVE PIANO KEYBOARD (With Smart Guard)        */}
      {/* ======================================================= */}
      <InteractivePianoKeyboard
        range={keyboardRange}
        onRangeChange={setKeyboardRange}
        activeNotesMap={activeNotesMap}
        activeLabelType={labelType}
        smartKeyGuardMode={workflowMode === 'jam' && smartGuardActive}
        targetNotesSet={targetNotesSet}
        safeNotesSet={safeNotesSet}
        blockWrongKeys={blockWrongKeys}
        pcKeyLabelsMap={pcKeyLabelsMap}
        handFocus={handFocus}
        onKeyTrigger={(note, isDown) => {
          if (isDown) setLastKeyboardTriggerNote(note);
        }}
      />

      {/* ======================================================= */}
      {/* 4. RUNWAY SEQUENCER (With Lateral Feedback & Wait Mode) */}
      {/* ======================================================= */}
      <KeysRunwaySequencer
        sequenceNotes={sequenceNotes}
        onSequenceUpdate={setSequenceNotes}
        onActiveNotesChange={setActiveNotesMap}
        bpm={bpm}
        onBpmChange={setBpm}
        stepRecordActive={stepRecordActive}
        onStepRecordToggle={setStepRecordActive}
        lastKeyboardTriggerNote={lastKeyboardTriggerNote}
        activeRoutine={activeRoutine}
        autoPlayTrigger={autoPlayRunway}
        handFocus={handFocus}
      />

      {/* 5. Circle of Fifths Modal */}
      <CircleOfFifthsModal
        isOpen={isCircleModalOpen}
        onClose={() => setIsCircleModalOpen(false)}
        onSelectKey={(k) => setRootNote(k)}
        activeKey={rootNote}
      />
    </div>
  );
}
