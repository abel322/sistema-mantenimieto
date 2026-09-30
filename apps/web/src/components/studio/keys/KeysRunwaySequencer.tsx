'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  NoteInfo,
  CHROMATIC_NOTES,
  midiToNoteInfo,
} from '@/services/theory/keysTheoryEngine';
import { PracticeRoutine, HandFocus } from '@/data/practiceWorkoutsData';
import { RunwayNoteEvent, durationToBeats } from '@/services/theory/workoutEngine';
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
  notes?: RunwayNoteEvent[];
  sequenceNotes?: RunwayNoteEvent[];
  onSequenceUpdate?: (seq: RunwayNoteEvent[]) => void;
  onActiveNotesChange: (notesMap: Map<number, NoteInfo>) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  stepRecordActive?: boolean;
  onStepRecordToggle?: (active: boolean) => void;
  lastKeyboardTriggerNote?: NoteInfo | null;
  activeRoutine?: PracticeRoutine | null;
  autoPlayTrigger?: boolean;
  handFocus?: HandFocus;
  className?: string;
}

export default function KeysRunwaySequencer({
  notes,
  sequenceNotes,
  onSequenceUpdate,
  onActiveNotesChange,
  bpm,
  onBpmChange,
  stepRecordActive = false,
  onStepRecordToggle,
  lastKeyboardTriggerNote,
  activeRoutine,
  autoPlayTrigger,
  handFocus = 'both',
  className = '',
}: KeysRunwaySequencerProps) {
  const [viewMode, setViewMode] = useState<SequencerViewMode>('runway');
  const [subdivision, setSubdivision] = useState<TupletSubdivision>('1/8');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [stepPointer, setStepPointer] = useState(0);

  // Sincronización de notas entrantes con un useEffect
  const [internalNotes, setInternalNotes] = useState<RunwayNoteEvent[]>(
    () => notes || sequenceNotes || []
  );

  useEffect(() => {
    const incoming = notes || sequenceNotes;
    if (incoming && incoming.length > 0) {
      setInternalNotes(incoming);
      setCurrentBeat(0);
      startTimeRef.current = 0;
      triggeredNoteIdsRef.current.clear();
      setIsWaitingOnStep(false);
      setWaitingTargetStepIdx(-1);
    }
  }, [notes, sequenceNotes]);

  // Mode: Wait for Note (Pausa y Espera)
  const [waitForNoteMode, setWaitForNoteMode] = useState(false);
  const [isWaitingOnStep, setIsWaitingOnStep] = useState(false);
  const [waitingTargetStepIdx, setWaitingTargetStepIdx] = useState<number>(-1);
  const [hitSuccessFlash, setHitSuccessFlash] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const triggeredNoteIdsRef = useRef<Set<string>>(new Set());

  // Auto-play when triggered from a routine load
  useEffect(() => {
    if (autoPlayTrigger) {
      keysAudioEngine.init();
      triggeredNoteIdsRef.current.clear();
      startTimeRef.current = performance.now();
      setCurrentBeat(0);
      setIsPlaying(true);
      try {
        Tone.Transport.seconds = 0;
        Tone.Transport.start();
      } catch (e) {
        console.warn('Tone.Transport error', e);
      }
    }
  }, [autoPlayTrigger]);

  // Calculate total beats duration of current sequence
  const totalBeats = Math.max(
    16,
    internalNotes.reduce((max, s) => {
      const d = durationToBeats(s.duration);
      return Math.max(max, s.time + d);
    }, 16)
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
    const durStr =
      stepBeats >= 4 ? '1n' : stepBeats >= 2 ? '2n' : stepBeats >= 1 ? '4n' : stepBeats >= 0.5 ? '8n' : '16n';

    const newNote: RunwayNoteEvent = {
      id: `rec_${Date.now()}_${lastKeyboardTriggerNote.midi}`,
      note: lastKeyboardTriggerNote.fullNote,
      midi: lastKeyboardTriggerNote.midi,
      time: timeBeats,
      step: Math.floor((timeBeats % 4) / stepBeats),
      duration: durStr,
      hand: lastKeyboardTriggerNote.midi < 60 ? 'left' : 'right',
      velocity: 0.85,
    };

    const updated = [...internalNotes, newNote];
    setInternalNotes(updated);
    onSequenceUpdate?.(updated);
    setStepPointer((prev) => prev + 1);
  }, [lastKeyboardTriggerNote, stepRecordActive, subdivision, getSubdivisionStepBeats, internalNotes, onSequenceUpdate]);

  // Wait For Note Check: When user plays a note, check if it matches waiting step
  useEffect(() => {
    if (!waitForNoteMode || !isWaitingOnStep || waitingTargetStepIdx < 0 || !lastKeyboardTriggerNote) return;

    const targetNote = internalNotes[waitingTargetStepIdx];
    if (!targetNote) return;

    const matchesNote =
      targetNote.midi === lastKeyboardTriggerNote.midi || targetNote.note === lastKeyboardTriggerNote.fullNote;
    if (matchesNote) {
      // Success!
      setHitSuccessFlash(true);
      setTimeout(() => setHitSuccessFlash(false), 600);

      // Advance sequence past this step
      setIsWaitingOnStep(false);
      setWaitingTargetStepIdx(-1);
      startTimeRef.current = performance.now() - (targetNote.time + 0.1) * (60 / bpm) * 1000;
    }
  }, [lastKeyboardTriggerNote, waitForNoteMode, isWaitingOnStep, waitingTargetStepIdx, internalNotes, bpm]);

  // Canvas Continuous Runway / Pianoroll Renderer function
  const drawFrame = useCallback(
    (currentTransportTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerWidth = canvas.width;
      const containerHeight = canvas.height;

      ctx.clearRect(0, 0, containerWidth, containerHeight);

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, containerHeight);
      bgGrad.addColorStop(0, '#040814');
      bgGrad.addColorStop(1, '#091124');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, containerWidth, containerHeight);

      if (viewMode === 'runway') {
        // --- MODO RUNWAY ---
        const hitLineX = containerWidth * 0.18; // Fixed vertical hit line at 18% left
        const pixelsPerSecond = 120; // 120 px per beat

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let b = 0; b <= totalBeats; b++) {
          const x = hitLineX + (b - currentTransportTime) * pixelsPerSecond;
          if (x >= 0 && x <= containerWidth) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, containerHeight);
            ctx.stroke();

            ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.font = '10px monospace';
            ctx.fillText(`C${b + 1}`, x + 4, 14);
          }
        }

        // Draw Pitch Lanes
        // Cover full pitch range: minMidi = 21 (A0, bottom), maxMidi = 96 (C7, top)
        const minMidi = 21;
        const maxMidi = 96;
        const totalMidis = maxMidi - minMidi + 1;
        const laneHeight = containerHeight / totalMidis;

        // Draw each note visible on screen
        internalNotes.forEach((note, idx) => {
          // Hand focus filter check: only filter if explicitly focusing on opposite hand
          if (handFocus === 'left' && note.hand === 'right') return;
          if (handFocus === 'right' && note.hand === 'left') return;

          const durBeats = durationToBeats(note.duration);
          const noteX = hitLineX + (note.time - currentTransportTime) * pixelsPerSecond;
          const noteWidth = Math.max(18, durBeats * pixelsPerSecond - 2);

          if (noteX + noteWidth < 0 || noteX > containerWidth) return;

          const isStepWaiting = isWaitingOnStep && waitingTargetStepIdx === idx;
          const isHit =
            currentTransportTime >= note.time && currentTransportTime < note.time + durBeats;
          const isLH = note.hand === 'left';

          // Calculate Y: grave ABAJO (higher Y), agudo ARRIBA (lower Y)
          const clampedMidi = Math.max(minMidi, Math.min(maxMidi, note.midi));
          const midiOffset = maxMidi - clampedMidi;
          const blockHeight = Math.max(12, laneHeight * 2.8);
          const noteY = Math.max(
            0,
            Math.min(
              containerHeight - blockHeight,
              midiOffset * laneHeight - blockHeight / 2 + laneHeight / 2
            )
          );

          ctx.save();
          if (isStepWaiting) {
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#facc15';
          } else if (isHit) {
            // Neon glow when crossing hitline
            ctx.shadowColor = isLH ? '#818cf8' : '#22d3ee';
            ctx.shadowBlur = 16;
            ctx.fillStyle = isLH ? '#a5b4fc' : '#67e8f9';
          } else {
            // Left hand: Bloque violeta/índigo neón (#818cf8 / bg-indigo-500) con el nombre de la nota
            // Right hand: Bloque cyan neón (#22d3ee / bg-cyan-400)
            ctx.fillStyle = isLH ? '#818cf8' : '#22d3ee';
          }

          ctx.beginPath();
          ctx.roundRect(noteX, noteY, noteWidth, blockHeight, 4);
          ctx.fill();

          // Crisp border stroke
          ctx.strokeStyle = isStepWaiting ? '#ca8a04' : isLH ? '#6366f1' : '#0891b2';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Note label text (e.g. C3, G3, C4, E4)
          ctx.fillStyle = isStepWaiting ? '#000000' : isLH ? '#1e1b4b' : '#083344';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(note.note, noteX + 4, noteY + blockHeight - 2.5);

          ctx.restore();
        });

        // Draw Cyan Neon Hitline at 18%
        ctx.save();
        ctx.shadowColor = isWaitingOnStep ? '#eab308' : '#22d3ee';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = isWaitingOnStep ? '#facc15' : '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hitLineX, 0);
        ctx.lineTo(hitLineX, containerHeight);
        ctx.stroke();

        ctx.fillStyle = isWaitingOnStep ? '#eab308' : '#22d3ee';
        ctx.beginPath();
        ctx.arc(hitLineX, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // --- MODO PIANO ROLL DAW ---
        const pixelsPerBeat = containerWidth / totalBeats;
        const minMidi = 21;
        const maxMidi = 96;
        const laneHeight = containerHeight / (maxMidi - minMidi + 1);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let b = 0; b <= totalBeats; b++) {
          const x = b * pixelsPerBeat;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, containerHeight);
          ctx.stroke();
        }

        internalNotes.forEach((n) => {
          if (handFocus === 'left' && n.hand === 'right') return;
          if (handFocus === 'right' && n.hand === 'left') return;

          const durBeats = durationToBeats(n.duration);
          const startX = n.time * pixelsPerBeat;
          const noteWidth = durBeats * pixelsPerBeat - 1;

          const clampedMidi = Math.max(minMidi, Math.min(maxMidi, n.midi));
          const y = (maxMidi - clampedMidi) * laneHeight;
          const isLH = n.hand === 'left';

          ctx.fillStyle = isLH ? '#818cf8' : '#22d3ee';
          ctx.beginPath();
          ctx.roundRect(startX, y, Math.max(6, noteWidth), Math.max(5, laneHeight * 2), 3);
          ctx.fill();
        });

        const playheadX = currentTransportTime * pixelsPerBeat;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, containerHeight);
        ctx.stroke();
      }
    },
    [internalNotes, totalBeats, viewMode, handFocus, isWaitingOnStep, waitingTargetStepIdx]
  );

  // Redraw canvas whenever notes change or transport moves
  useEffect(() => {
    drawFrame(currentBeat);
  }, [internalNotes, drawFrame, currentBeat]);

  // Main Audio & Visual Loop Animation
  useEffect(() => {
    if (!isPlaying) {
      onActiveNotesChange(new Map());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      drawFrame(currentBeat);
      return;
    }

    const secPerBeat = 60 / bpm;
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now() - currentBeat * secPerBeat * 1000;
    }

    const loop = () => {
      if (isWaitingOnStep) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      let beat = elapsedSec / secPerBeat;

      if (beat >= totalBeats) {
        if (isLooping) {
          startTimeRef.current = performance.now();
          triggeredNoteIdsRef.current.clear();
          beat = 0;
          try {
            Tone.Transport.seconds = 0;
          } catch (e) {}
        } else {
          setIsPlaying(false);
          onActiveNotesChange(new Map());
          drawFrame(0);
          return;
        }
      }

      setCurrentBeat(beat);
      drawFrame(beat);

      // Check hitline triggers
      const activeMap = new Map<number, NoteInfo>();
      const notesToTriggerNow: string[] = [];

      internalNotes.forEach((n, idx) => {
        const dBeats = durationToBeats(n.duration);
        const start = n.time;
        const end = start + dBeats;

        if (handFocus === 'left' && n.hand === 'right') return;
        if (handFocus === 'right' && n.hand === 'left') return;

        if (beat >= start && beat < end) {
          const info = midiToNoteInfo(n.midi);
          info.hand = n.hand === 'left' ? 'LH' : 'RH';
          activeMap.set(n.midi, info);

          if (waitForNoteMode && !triggeredNoteIdsRef.current.has(n.id)) {
            triggeredNoteIdsRef.current.add(n.id);
            setIsWaitingOnStep(true);
            setWaitingTargetStepIdx(idx);
            return;
          }

          if (!triggeredNoteIdsRef.current.has(n.id)) {
            triggeredNoteIdsRef.current.add(n.id);
            notesToTriggerNow.push(n.note);
          }
        }
      });

      if (notesToTriggerNow.length > 0) {
        keysAudioEngine.playChord(notesToTriggerNow, '8n');
      }

      onActiveNotesChange(activeMap);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    isPlaying,
    bpm,
    isLooping,
    totalBeats,
    internalNotes,
    onActiveNotesChange,
    isWaitingOnStep,
    waitForNoteMode,
    handFocus,
    drawFrame,
  ]);

  // Compute current active notes for lateral feedback
  const currentActiveNotes = internalNotes.filter((s) => {
    const d = durationToBeats(s.duration);
    return currentBeat >= s.time && currentBeat < s.time + d;
  });

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
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide flex flex-wrap items-center gap-2">
              <span>Secuenciador Polifónico Sonora</span>
              {activeRoutine && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {activeRoutine.title.split(':')[0]}
                </span>
              )}
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  handFocus === 'left'
                    ? 'bg-purple-950 text-purple-300 border-purple-700/80'
                    : handFocus === 'right'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-700/80'
                }`}
              >
                {handFocus === 'left'
                  ? '🤚 Mano Izquierda (< C4)'
                  : handFocus === 'right'
                  ? '✋ Mano Derecha (≥ C4)'
                  : '👐 Ambas Manos'}
              </span>
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
                try {
                  Tone.Transport.pause();
                } catch (e) {}
              } else {
                keysAudioEngine.init();
                triggeredNoteIdsRef.current.clear();
                startTimeRef.current = performance.now() - currentBeat * (60 / bpm) * 1000;
                setIsPlaying(true);
                try {
                  Tone.Transport.start();
                } catch (e) {}
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
              triggeredNoteIdsRef.current.clear();
              setIsWaitingOnStep(false);
              setWaitingTargetStepIdx(-1);
              onActiveNotesChange(new Map());
              drawFrame(0);
              try {
                Tone.Transport.stop();
                Tone.Transport.seconds = 0;
              } catch (e) {}
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
            onClick={() => {
              setInternalNotes([]);
              onSequenceUpdate?.([]);
              drawFrame(0);
            }}
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
              onChange={(e) => {
                const newBpm = parseInt(e.target.value, 10);
                onBpmChange(newBpm);
                try {
                  Tone.Transport.bpm.value = newBpm;
                } catch (err) {}
              }}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-extrabold text-cyan-400 w-8">{bpm}</span>
          </div>

          {/* Step Record Button */}
          <button
            onClick={() => onStepRecordToggle?.(!stepRecordActive)}
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
              <div
                className={`p-2.5 rounded-lg border transition-all ${
                  handFocus === 'left'
                    ? 'bg-purple-900/50 border-purple-500 shadow-lg shadow-purple-950/60 ring-1 ring-purple-400'
                    : handFocus === 'right'
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-50'
                    : 'bg-purple-950/40 border-purple-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Hand className="w-3.5 h-3.5 text-purple-400" />
                    <span>Mano Izquierda (LH &lt; C4):</span>
                  </div>
                  {handFocus === 'left' && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-600">
                      Enfoque Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-purple-200/90 font-sans">
                  {handFocus === 'right'
                    ? 'Mano izquierda en reposo sobre el regazo.'
                    : activeRoutine
                    ? activeRoutine.leftHandInstruction
                    : 'Bajo en tónica o fundamentales en registro grave.'}
                </p>
              </div>

              <div
                className={`p-2.5 rounded-lg border transition-all ${
                  handFocus === 'right'
                    ? 'bg-cyan-900/50 border-cyan-500 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400'
                    : handFocus === 'left'
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-50'
                    : 'bg-cyan-950/40 border-cyan-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <Hand className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mano Derecha (RH &ge; C4):</span>
                  </div>
                  {handFocus === 'right' && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600">
                      Enfoque Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-cyan-200/90 font-sans">
                  {handFocus === 'left'
                    ? 'Mano derecha en reposo sobre el regazo.'
                    : activeRoutine
                    ? activeRoutine.rightHandInstruction
                    : currentActiveNotes.length > 0
                    ? `Toca notas: ${currentActiveNotes
                        .filter((n) => n.hand === 'right' || n.midi >= 60)
                        .map((n) => n.note)
                        .join(' - ') || 'Melodía / Acordes'}`
                    : 'Sigue la trayectoria del Runway.'}
                </p>
              </div>
            </div>

            {/* Current Active Step Notes */}
            {currentActiveNotes.length > 0 && (
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Postura Activa:</span>
                <span className="text-amber-300 font-black">
                  {currentActiveNotes
                    .filter((n) => {
                      if (handFocus === 'left') return n.hand === 'left' || n.midi < 60;
                      if (handFocus === 'right') return n.hand === 'right' || n.midi >= 60;
                      return true;
                    })
                    .map((n) => n.note)
                    .join(' + ') || '(Mano en reposo)'}
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
