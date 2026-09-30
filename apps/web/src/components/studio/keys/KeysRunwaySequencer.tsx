'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  NoteInfo,
  RunwayStepNote,
  CHROMATIC_NOTES,
  midiToNoteInfo,
} from '@/services/theory/keysTheoryEngine';
import { PracticeRoutine } from '@/data/practiceWorkoutsData';
import { keysAudioEngine } from '@/services/audio/keysAudioEngine';
import {
  Play,
  Pause,
  Square,
  Circle,
  RotateCcw,
  Sliders,
  Sparkles,
  Layers,
  Music,
  Zap,
  Activity,
  Trash2,
  Hand,
  CheckCircle2,
  Hourglass,
  Info,
  Shield,
} from 'lucide-react';

export type SequencerViewMode = 'runway' | 'pianoroll';
export type TupletSubdivision =
  | '1/4'
  | '1/8'
  | '1/16'
  | '1/32'
  | '3:2_quarter'
  | '3:2_eighth'
  | '6:4'
  | '5:4'
  | '7:4';

interface KeysRunwaySequencerProps {
  sequenceNotes: RunwayStepNote[];
  onSequenceUpdate: (seq: RunwayStepNote[]) => void;
  onActiveNotesChange: (notesMap: Map<number, NoteInfo>) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  stepRecordActive: boolean;
  onStepRecordToggle: (active: boolean) => void;
  lastKeyboardTriggerNote?: NoteInfo | null;
  activeRoutine?: PracticeRoutine | null;
  autoPlayTrigger?: boolean;
  className?: string;
}

export default function KeysRunwaySequencer({
  sequenceNotes,
  onSequenceUpdate,
  onActiveNotesChange,
  bpm,
  onBpmChange,
  stepRecordActive,
  onStepRecordToggle,
  lastKeyboardTriggerNote,
  activeRoutine,
  autoPlayTrigger,
  className = '',
}: KeysRunwaySequencerProps) {
  const [viewMode, setViewMode] = useState<SequencerViewMode>('runway');
  const [subdivision, setSubdivision] = useState<TupletSubdivision>('1/8');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [stepPointer, setStepPointer] = useState(0);

  // Mode: Wait for Note (Pausa y Espera)
  const [waitForNoteMode, setWaitForNoteMode] = useState(false);
  const [isWaitingOnStep, setIsWaitingOnStep] = useState(false);
  const [waitingTargetStepIdx, setWaitingTargetStepIdx] = useState<number>(-1);
  const [hitSuccessFlash, setHitSuccessFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastTriggeredStepRef = useRef<number>(-1);
  const pauseTimeOffsetRef = useRef<number>(0);

  // Auto-play when triggered from a routine load
  useEffect(() => {
    if (autoPlayTrigger) {
      setIsPlaying(true);
    }
  }, [autoPlayTrigger]);

  // Calculate total beats duration of current sequence
  const totalBeats = Math.max(
    16,
    sequenceNotes.reduce((max, s) => Math.max(max, s.timeBeats + s.durationBeats), 16)
  );

  const getSubdivisionStepBeats = useCallback((sub: TupletSubdivision): number => {
    switch (sub) {
      case '1/4':
        return 1;
      case '1/8':
        return 0.5;
      case '1/16':
        return 0.25;
      case '1/32':
        return 0.125;
      case '3:2_quarter':
        return 2 / 3;
      case '3:2_eighth':
        return 1 / 3;
      case '6:4':
        return 4 / 6;
      case '5:4':
        return 4 / 5;
      case '7:4':
        return 4 / 7;
      default:
        return 0.5;
    }
  }, []);

  // Step Record Mode: write played note/chord to current step pointer
  useEffect(() => {
    if (!stepRecordActive || !lastKeyboardTriggerNote) return;

    const stepBeats = getSubdivisionStepBeats(subdivision);
    const timeBeats = stepPointer * stepBeats;

    const existingIndex = sequenceNotes.findIndex((s) => Math.abs(s.timeBeats - timeBeats) < 0.01);
    let updated: RunwayStepNote[] = [...sequenceNotes];

    if (existingIndex >= 0) {
      const currentNotes = updated[existingIndex].notes;
      const alreadyHas = currentNotes.some((n) => n.midi === lastKeyboardTriggerNote.midi);
      if (!alreadyHas) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          notes: [...currentNotes, lastKeyboardTriggerNote],
        };
      }
    } else {
      updated.push({
        timeBeats,
        durationBeats: stepBeats,
        notes: [lastKeyboardTriggerNote],
      });
    }

    onSequenceUpdate(updated);
    setStepPointer((prev) => prev + 1);
  }, [lastKeyboardTriggerNote, stepRecordActive, subdivision, getSubdivisionStepBeats]);

  // Wait For Note Check: When user plays a note, check if it matches waiting step
  useEffect(() => {
    if (!waitForNoteMode || !isWaitingOnStep || waitingTargetStepIdx < 0 || !lastKeyboardTriggerNote) return;

    const step = sequenceNotes[waitingTargetStepIdx];
    if (!step) return;

    const matchesNote = step.notes.some((n) => n.midi === lastKeyboardTriggerNote.midi || n.name === lastKeyboardTriggerNote.name);
    if (matchesNote) {
      // Success!
      setHitSuccessFlash(true);
      setTimeout(() => setHitSuccessFlash(false), 600);

      // Advance sequence past this step
      setIsWaitingOnStep(false);
      setWaitingTargetStepIdx(-1);
      startTimeRef.current = performance.now() - (step.timeBeats + 0.1) * (60 / bpm) * 1000;
    }
  }, [lastKeyboardTriggerNote, waitForNoteMode, isWaitingOnStep, waitingTargetStepIdx, sequenceNotes, bpm]);

  // Main Audio & Visual Loop Animation
  useEffect(() => {
    if (!isPlaying) {
      onActiveNotesChange(new Map());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const secPerBeat = 60 / bpm;
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
    }
    lastTriggeredStepRef.current = -1;

    const loop = () => {
      if (isWaitingOnStep) {
        // Paused waiting for user note
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      let beat = elapsedSec / secPerBeat;

      if (beat >= totalBeats) {
        if (isLooping) {
          startTimeRef.current = performance.now();
          lastTriggeredStepRef.current = -1;
          beat = 0;
        } else {
          setIsPlaying(false);
          onActiveNotesChange(new Map());
          return;
        }
      }

      setCurrentBeat(beat);

      // Check hitline triggers
      const activeMap = new Map<number, NoteInfo>();
      sequenceNotes.forEach((stepNote, idx) => {
        const start = stepNote.timeBeats;
        const end = start + stepNote.durationBeats;

        if (beat >= start && beat < end) {
          stepNote.notes.forEach((n) => activeMap.set(n.midi, n));

          // If Wait For Note mode is active, pause when reaching start of step!
          if (waitForNoteMode && idx !== lastTriggeredStepRef.current) {
            lastTriggeredStepRef.current = idx;
            setIsWaitingOnStep(true);
            setWaitingTargetStepIdx(idx);
            return;
          }

          if (lastTriggeredStepRef.current !== idx && beat - start < 0.1) {
            lastTriggeredStepRef.current = idx;
            const fullNotes = stepNote.notes.map((n) => n.fullNote);
            keysAudioEngine.playChord(fullNotes, `${stepNote.durationBeats * secPerBeat}s`);
          }
        }
      });

      onActiveNotesChange(activeMap);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, bpm, isLooping, totalBeats, sequenceNotes, onActiveNotesChange, isWaitingOnStep, waitForNoteMode]);

  // Canvas Continuous Runway / Pianoroll Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#040814');
    bgGrad.addColorStop(1, '#091124');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    if (viewMode === 'runway') {
      // --- MODO RUNWAY ---
      const hitlineX = width * 0.18; // Fixed vertical hit line at 18% left
      const pixelsPerBeat = 120;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let b = 0; b <= totalBeats; b++) {
        const x = hitlineX + (b - currentBeat) * pixelsPerBeat;
        if (x >= 0 && x <= width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();

          ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.font = '10px monospace';
          ctx.fillText(`C${b + 1}`, x + 4, 14);
        }
      }

      // Draw Pitch Lanes
      const minMidi = 36; // C2
      const maxMidi = 96; // C7
      const totalMidis = maxMidi - minMidi + 1;
      const laneHeight = height / totalMidis;

      // Draw Note Blocks
      sequenceNotes.forEach((stepNote, sIdx) => {
        const startX = hitlineX + (stepNote.timeBeats - currentBeat) * pixelsPerBeat;
        const noteWidth = Math.max(12, stepNote.durationBeats * pixelsPerBeat - 2);

        if (startX + noteWidth < 0 || startX > width) return;

        const isStepWaiting = isWaitingOnStep && waitingTargetStepIdx === sIdx;

        stepNote.notes.forEach((note) => {
          const midiOffset = maxMidi - note.midi;
          const y = midiOffset * laneHeight;

          const isHit = currentBeat >= stepNote.timeBeats && currentBeat < stepNote.timeBeats + stepNote.durationBeats;
          const isLH = note.midi < 60;

          ctx.save();
          if (isStepWaiting) {
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#facc15';
          } else if (isHit) {
            ctx.shadowColor = isLH ? '#a855f7' : '#06b6d4';
            ctx.shadowBlur = 12;
            ctx.fillStyle = isLH ? '#c084fc' : '#22d3ee';
          } else {
            ctx.fillStyle = isLH ? '#7e22ce' : '#0284c7';
          }

          ctx.beginPath();
          ctx.roundRect(startX, y + 1, noteWidth, Math.max(6, laneHeight - 2), 4);
          ctx.fill();

          if (noteWidth > 20) {
            ctx.fillStyle = isStepWaiting ? '#000000' : '#ffffff';
            ctx.font = 'bold 9px monospace';
            ctx.fillText(note.name, startX + 4, y + laneHeight - 3);
          }
          ctx.restore();
        });
      });

      // Draw Cyan Neon Hitline
      ctx.save();
      ctx.shadowColor = isWaitingOnStep ? '#eab308' : '#06b6d4';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = isWaitingOnStep ? '#facc15' : '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(hitlineX, 0);
      ctx.lineTo(hitlineX, height);
      ctx.stroke();

      ctx.fillStyle = isWaitingOnStep ? '#eab308' : '#06b6d4';
      ctx.beginPath();
      ctx.arc(hitlineX, 10, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

    } else {
      // --- MODO PIANO ROLL DAW ---
      const pixelsPerBeat = width / totalBeats;
      const minMidi = 36;
      const maxMidi = 96;
      const laneHeight = height / (maxMidi - minMidi + 1);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let b = 0; b <= totalBeats; b++) {
        const x = b * pixelsPerBeat;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      sequenceNotes.forEach((stepNote) => {
        const startX = stepNote.timeBeats * pixelsPerBeat;
        const noteWidth = stepNote.durationBeats * pixelsPerBeat - 1;

        stepNote.notes.forEach((note) => {
          const y = (maxMidi - note.midi) * laneHeight;
          const isLH = note.midi < 60;

          ctx.fillStyle = isLH ? '#a855f7' : '#eab308';
          ctx.beginPath();
          ctx.roundRect(startX, y + 1, Math.max(6, noteWidth), Math.max(5, laneHeight - 2), 3);
          ctx.fill();
        });
      });

      const playheadX = currentBeat * pixelsPerBeat;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [viewMode, sequenceNotes, currentBeat, totalBeats, isWaitingOnStep, waitingTargetStepIdx]);

  // Compute current and next step notes for lateral feedback
  const currentStepNote = sequenceNotes.find(
    (s) => currentBeat >= s.timeBeats && currentBeat < s.timeBeats + s.durationBeats
  );
  const nextStepNote = sequenceNotes.find((s) => s.timeBeats > currentBeat);

  const measureNum = Math.floor(currentBeat / 4) + 1;
  const beatNum = Math.floor(currentBeat % 4) + 1;

  return (
    <div className={`w-full flex flex-col gap-4 p-5 rounded-2xl bg-[#080e1e]/95 border border-slate-800 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Header Bar & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <span>Secuenciador Polifónico Sonora</span>
              {activeRoutine && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {activeRoutine.title.split(':')[0]}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Modo Runway Continuo &amp; DAW Piano Roll
            </p>
          </div>
        </div>

        {/* View Mode & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Wait for Note (Pausa y Espera) Mode Toggle */}
          <button
            onClick={() => {
              setWaitForNoteMode(!waitForNoteMode);
              setIsWaitingOnStep(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              waitForNoteMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/30 font-black'
                : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title="El runway pausa en cada postura y solo avanza cuando tocas las teclas correctas"
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span>Pausa y Espera (Wait for Note) {waitForNoteMode ? '[ON]' : '[OFF]'}</span>
          </button>

          <div className="flex items-center bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              onClick={() => setViewMode('runway')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'runway'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>🚀 Modo Runway</span>
            </button>
            <button
              onClick={() => setViewMode('pianoroll')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'pianoroll'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🎹 Piano Roll DAW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Transport & Subdivision Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                startTimeRef.current = performance.now() - currentBeat * (60 / bpm) * 1000;
                setIsPlaying(true);
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 shadow-lg ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'PAUSA' : 'PLAY'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentBeat(0);
              startTimeRef.current = 0;
              setIsWaitingOnStep(false);
              setWaitingTargetStepIdx(-1);
            }}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Detener / Reiniciar"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-xl text-xs font-bold transition-all ${
              isLooping
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/80'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Bucle Loop"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSequenceUpdate([])}
            className="p-2 rounded-xl bg-rose-950/60 text-rose-400 hover:bg-rose-900 border border-rose-800/60 transition-colors"
            title="Limpiar secuencia"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* BPM & Step Record */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">BPM:</span>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => onBpmChange(parseInt(e.target.value, 10))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-extrabold text-cyan-400 w-8">{bpm}</span>
          </div>

          {/* Step Record Button */}
          <button
            onClick={() => onStepRecordToggle(!stepRecordActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              stepRecordActive
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Circle className={`w-3.5 h-3.5 ${stepRecordActive ? 'fill-current' : ''}`} />
            <span>Step Record {stepRecordActive ? `[Paso ${stepPointer + 1}]` : ''}</span>
          </button>
        </div>

        {/* Subdivisions Dropdown */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">Subdivisión:</span>
          <select
            value={subdivision}
            onChange={(e) => setSubdivision(e.target.value as TupletSubdivision)}
            className="bg-slate-950 text-cyan-300 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500"
          >
            <optgroup label="Regular">
              <option value="1/4">1/4 Negras</option>
              <option value="1/8">1/8 Corcheas</option>
              <option value="1/16">1/16 Semicorcheas</option>
              <option value="1/32">1/32 Fusas</option>
            </optgroup>
            <optgroup label="Irregulares / Tuplets">
              <option value="3:2_quarter">3:2 Tresillo de Negras</option>
              <option value="3:2_eighth">3:2 Tresillo de Corcheas (Blues/Swing)</option>
              <option value="6:4">6:4 Seiscillos (Arpegios Virtuosos)</option>
              <option value="5:4">5:4 Quintillos (Phrasing Neo-Soul)</option>
              <option value="7:4">7:4 Septillos (Contemporáneo)</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Main Workspace Layout: Canvas Runway + Lateral Feedback Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* Runway Canvas Container (3 cols) */}
        <div className="relative lg:col-span-3 h-64 rounded-xl border border-slate-800 overflow-hidden shadow-inner bg-slate-950">
          <canvas ref={canvasRef} width={900} height={256} className="w-full h-full block" />

          {/* Success Flash Overlay */}
          {hitSuccessFlash && (
            <div className="absolute inset-0 bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center pointer-events-none transition-opacity duration-300">
              <span className="text-emerald-300 font-mono font-black text-sm bg-slate-950/80 px-3 py-1.5 rounded-xl border border-emerald-400 shadow-xl">
                ✨ ¡Nota Correcta!
              </span>
            </div>
          )}

          {/* Wait for note indicator overlay on canvas */}
          {isWaitingOnStep && (
            <div className="absolute top-2 right-2 bg-amber-400/90 text-slate-950 font-mono font-black text-[11px] px-3 py-1 rounded-lg shadow-lg animate-pulse flex items-center gap-1.5">
              <Hourglass className="w-3.5 h-3.5" />
              <span>PAUSA: Toca las notas en tu teclado para continuar</span>
            </div>
          )}
        </div>

        {/* Lateral Feedback Card (1 col) */}
        <div className="flex flex-col justify-between p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg font-mono text-xs gap-3">
          <div className="space-y-2">
            {/* Measure & Beat Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400 text-[11px] font-bold">POSICIÓN ACTUAL:</span>
              <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 font-black">
                Compás {measureNum}.{beatNum}
              </span>
            </div>

            {/* Hand Directions */}
            <div className="space-y-2">
              <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-900/50">
                <div className="flex items-center gap-1.5 text-purple-300 font-bold mb-1">
                  <Hand className="w-3.5 h-3.5 text-purple-400" />
                  <span>Mano Izquierda (LH):</span>
                </div>
                <p className="text-[11px] text-purple-200/90 font-sans">
                  {activeRoutine ? activeRoutine.leftHandInstruction : 'Bajo en tónica o fundamentales.'}
                </p>
              </div>

              <div className="bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-900/50">
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold mb-1">
                  <Hand className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mano Derecha (RH):</span>
                </div>
                <p className="text-[11px] text-cyan-200/90 font-sans">
                  {activeRoutine ? activeRoutine.rightHandInstruction : (
                    currentStepNote ? `Toca notas: ${currentStepNote.notes.map((n) => n.name).join(' - ')}` : 'Sigue la trayectoria del Runway.'
                  )}
                </p>
              </div>
            </div>

            {/* Current Active Step Notes */}
            {currentStepNote && (
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Postura Activa:</span>
                <span className="text-amber-300 font-black">
                  {currentStepNote.notes.map((n) => n.name).join(' + ')}
                </span>
              </div>
            )}
          </div>

          {/* Master Pedagogical Tip */}
          {activeRoutine?.pedagogicalTip && (
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 italic flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{activeRoutine.pedagogicalTip}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
