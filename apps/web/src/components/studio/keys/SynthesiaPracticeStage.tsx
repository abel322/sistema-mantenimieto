'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Tone from 'tone';
import { useKeysPractice } from '@/context/KeysPracticeContext';
import {
  NoteInfo,
  KeyboardRange,
  LabelType,
  CHROMATIC_NOTES,
  midiToNoteInfo,
} from '@/services/theory/keysTheoryEngine';
import { RunwayNoteEvent, durationToBeats, midiToNoteName } from '@/services/theory/workoutEngine';
import { keysAudioEngine, TimbreType } from '@/services/audio/keysAudioEngine';
import { HandFocus } from '@/data/practiceWorkoutsData';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Zap,
  Activity,
  Hand,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  Music,
  Radio,
} from 'lucide-react';

export type SynthesiaViewMode = 'waterfall' | 'lateral';
export type PracticeSubdivision = '1/4' | '1/8' | '1/16' | '3T' | '6T';

export default function SynthesiaPracticeStage() {
  const router = useRouter();
  const {
    currentWorkout,
    runwayNotes,
    sourceTheory,
    timbre,
    volumeDb,
    sustainActive,
    updateBpm,
    updateHandFocus,
    updateTimbre,
    updateVolume,
    toggleSustain,
  } = useKeysPractice();

  // ─── Mounted guard (prevents SSR rendering of canvas/audio nodes) ───────────
  // React error #300 "fewer hooks than expected" is caused when the component
  // throws or returns early BEFORE completing all hook calls. By keeping ALL
  // hooks above and using a mounted flag for the early return below, we satisfy
  // the Rules of Hooks: hooks are always called in the same order, every render.
  const [mounted, setMounted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  // Playback & Transport State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [bpm, setBpmState] = useState(currentWorkout.bpm || 80);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [subdivision, setSubdivision] = useState<PracticeSubdivision>('1/8');

  // Mode: Pausa y Espera (Wait for Note)
  const [waitForNoteMode, setWaitForNoteMode] = useState(false);
  const [isWaitingOnStep, setIsWaitingOnStep] = useState(false);
  const [waitingTargetStepIdx, setWaitingTargetStepIdx] = useState<number>(-1);
  const [hitSuccessFlash, setHitSuccessFlash] = useState(false);

  // View Options
  const [viewMode, setViewMode] = useState<SynthesiaViewMode>('waterfall');
  const [keyboardRange, setKeyboardRange] = useState<KeyboardRange>(61);
  const [labelType, setLabelType] = useState<LabelType>('notes');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // USB MIDI state
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);

  // Active sounding / illuminated notes
  const [activeRunwayNotesMap, setActiveRunwayNotesMap] = useState<Map<number, NoteInfo>>(new Map());
  const [pressedMidis, setPressedMidis] = useState<Set<number>>(new Set());

  // Refs for timing & animation loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const triggeredNoteIdsRef = useRef<Set<string>>(new Set());
  const isMouseDownRef = useRef(false);

  // ─── Mount effect: set mounted flag & sync BPM ───────────────────────────────
  // NOTE: The 'mounted' early return below comes AFTER ALL hooks — this is the
  // only safe place for an early return in a component with many hooks.
  useEffect(() => {
    setMounted(true);
    // Sync BPM from context on mount
    if (currentWorkout.bpm) {
      setBpmState(currentWorkout.bpm);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Synchronize BPM when context changes after mount
  useEffect(() => {
    if (!mounted) return;
    if (currentWorkout.bpm) {
      setBpmState(currentWorkout.bpm);
    }
  }, [currentWorkout.bpm, mounted]);


  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(30, Math.min(240, newBpm));
    setBpmState(clamped);
    updateBpm(clamped);
    try {
      if (Tone.Transport) Tone.Transport.bpm.value = clamped;
    } catch (e) {}
  };

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen toggle error:', e);
    }
  };

  // Total beats duration of the session
  const totalBeats = useMemo(() => {
    return Math.max(
      16,
      runwayNotes.reduce((max, s) => {
        const d = durationToBeats(s.duration);
        return Math.max(max, s.time + d);
      }, 16)
    );
  }, [runwayNotes]);

  // Compute key bounds for keyboard
  // 61 keys: C2 (36) to C7 (96)
  // 88 keys: A0 (21) to C8 (108)
  const startMidi = keyboardRange === 61 ? 36 : 21;
  const endMidi = keyboardRange === 61 ? 96 : 108;

  const allKeys = useMemo(() => {
    const keys: NoteInfo[] = [];
    for (let m = startMidi; m <= endMidi; m++) {
      keys.push(midiToNoteInfo(m));
    }
    return keys;
  }, [startMidi, endMidi]);

  const whiteKeys = useMemo(() => allKeys.filter((k) => !k.isBlack), [allKeys]);
  const whiteKeyCount = whiteKeys.length;
  const whiteKeyWidthPercent = 100 / whiteKeyCount;

  // Compute horizontal X and width in percent for any MIDI pitch
  const getNoteHorizontalBounds = useCallback(
    (midi: number): { leftPercent: number; widthPercent: number } => {
      const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
      if (!isBlack) {
        const whiteIdx = whiteKeys.findIndex((wk) => wk.midi === midi);
        if (whiteIdx >= 0) {
          return {
            leftPercent: whiteIdx * whiteKeyWidthPercent,
            widthPercent: whiteKeyWidthPercent,
          };
        }
      } else {
        const precedingWhiteCount = whiteKeys.filter((wk) => wk.midi < midi).length;
        const leftP = precedingWhiteCount * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.35;
        const widthP = whiteKeyWidthPercent * 0.7;
        return {
          leftPercent: Math.max(0, leftP),
          widthPercent: widthP,
        };
      }
      return { leftPercent: 0, widthPercent: 1 };
    },
    [whiteKeys, whiteKeyWidthPercent]
  );

  // Manual Note Triggering (Mouse / Touch / Laptop keys)
  const handleNoteStart = useCallback(
    (note: NoteInfo) => {
      keysAudioEngine.ensureStarted();
      keysAudioEngine.playNote(note.fullNote);
      setPressedMidis((prev) => new Set(prev).add(note.midi));

      // Check Wait-for-Note condition
      if (waitForNoteMode && isWaitingOnStep && waitingTargetStepIdx >= 0) {
        const target = runwayNotes[waitingTargetStepIdx];
        if (target && (target.midi === note.midi || target.note === note.fullNote)) {
          setHitSuccessFlash(true);
          setTimeout(() => setHitSuccessFlash(false), 500);
          setIsWaitingOnStep(false);
          setWaitingTargetStepIdx(-1);
          startTimeRef.current = performance.now() - (target.time + 0.1) * (60 / bpm) * 1000;
        }
      }
    },
    [waitForNoteMode, isWaitingOnStep, waitingTargetStepIdx, runwayNotes, bpm]
  );

  const handleNoteEnd = useCallback((note: NoteInfo) => {
    keysAudioEngine.releaseNote(note.fullNote);
    setPressedMidis((prev) => {
      const next = new Set(prev);
      next.delete(note.midi);
      return next;
    });
  }, []);

  // Web MIDI API: Connect and listen to physical USB MIDI keyboard
  useEffect(() => {
    let midiAccess: any = null;

    const handleMidiMessage = (e: any) => {
      const [status, noteNumber, velocity] = e.data;
      const command = status >> 4;

      if (command === 9 && velocity > 0) {
        // Note On
        const noteName = midiToNoteName(noteNumber);
        const info = midiToNoteInfo(noteNumber);
        handleNoteStart(info);
      } else if (command === 8 || (command === 9 && velocity === 0)) {
        // Note Off
        const info = midiToNoteInfo(noteNumber);
        handleNoteEnd(info);
      }
    };

    if (typeof window !== 'undefined' && 'navigator' in window && (navigator as any).requestMIDIAccess) {
      (navigator as any)
        .requestMIDIAccess()
        .then((access: any) => {
          midiAccess = access;
          const inputs = Array.from(access.inputs.values()) as any[];
          if (inputs.length > 0) {
            setMidiDeviceName(inputs[0].name || 'Dispositivo USB MIDI');
            inputs.forEach((input: any) => {
              input.onmidimessage = handleMidiMessage;
            });
          }
          access.onstatechange = (event: any) => {
            if (event.port.type === 'input') {
              if (event.port.state === 'connected') {
                setMidiDeviceName(event.port.name || 'Dispositivo USB MIDI');
                event.port.onmidimessage = handleMidiMessage;
              } else {
                setMidiDeviceName(null);
              }
            }
          };
        })
        .catch(() => {
          // MIDI not available or permission denied
        });
    }

    return () => {
      if (midiAccess) {
        try {
          const inputs = Array.from(midiAccess.inputs.values()) as any[];
          inputs.forEach((input: any) => {
            input.onmidimessage = null;
          });
        } catch (e) {}
      }
    };
  }, [handleNoteStart, handleNoteEnd]);

  // Global mouse up handler
  useEffect(() => {
    const onGlobalMouseUp = () => {
      isMouseDownRef.current = false;
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // Keyboard Shortcuts & Laptop Key Note Playing (Space, R, Esc, and QWERTY notes)
  useEffect(() => {
    const keyToMidi: { [key: string]: number } = {
      a: 60, // C4
      w: 61, // C#4
      s: 62, // D4
      e: 63, // D#4
      d: 64, // E4
      f: 65, // F4
      t: 66, // F#4
      g: 67, // G4
      y: 68, // G#4
      h: 69, // A4
      u: 70, // A#4
      j: 71, // B4
      k: 72, // C5
      o: 73, // C#5
      l: 74, // D5
      p: 75, // D#5
      ñ: 76, // E5
      ';': 76,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => {
          const next = !prev;
          if (next) {
            keysAudioEngine.ensureStarted();
            if (startTimeRef.current === 0) {
              startTimeRef.current = performance.now() - currentBeat * (60 / bpm) * 1000;
            }
          }
          return next;
        });
        return;
      }

      if (e.code === 'KeyR') {
        e.preventDefault();
        setCurrentBeat(0);
        startTimeRef.current = 0;
        triggeredNoteIdsRef.current.clear();
        setIsWaitingOnStep(false);
        setWaitingTargetStepIdx(-1);
        return;
      }

      if (e.code === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      // Laptop keyboard notes
      if (!e.repeat) {
        const k = e.key.toLowerCase();
        const midi = keyToMidi[k];
        if (midi) {
          const noteInfo = midiToNoteInfo(midi);
          handleNoteStart(noteInfo);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      const midi = keyToMidi[k];
      if (midi) {
        const noteInfo = midiToNoteInfo(midi);
        handleNoteEnd(noteInfo);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [bpm, currentBeat, handleNoteStart, handleNoteEnd]);

  // Continuous Canvas Renderer (60 FPS Synthesia Waterfall or Lateral Runway)
  const drawCanvas = useCallback(
    (beat: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Deep dark cyber-stage background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#060a14');
      bgGrad.addColorStop(0.5, '#080d1a');
      bgGrad.addColorStop(1, '#050812');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      if (viewMode === 'waterfall') {
        // =====================================================================
        // MODE A: SYNTHESIA WATERFALL (Notes fall downwards toward piano keys)
        // =====================================================================
        const hitLineY = h - 6; // Hit line flush right above piano keys
        const visibleWindowBeats = 6; // Shows upcoming 6 beats
        const pixelsPerBeat = (h - 20) / visibleWindowBeats;

        // Draw vertical key track guide lanes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        whiteKeys.forEach((wk, i) => {
          const x = (i * w) / whiteKeyCount;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, hitLineY);
          ctx.stroke();
        });

        // Draw horizontal beat guide lines (moving downwards with transport)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        for (let b = 0; b <= totalBeats; b++) {
          const beatsToHit = b - beat;
          if (beatsToHit >= -0.5 && beatsToHit <= visibleWindowBeats + 1) {
            const y = hitLineY - beatsToHit * pixelsPerBeat;
            if (y >= 0 && y <= hitLineY) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(w, y);
              ctx.stroke();

              if (b % 4 === 0) {
                ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
                ctx.font = '10px monospace';
                ctx.fillText(`Compás ${Math.floor(b / 4) + 1}`, 12, y - 4);
              }
            }
          }
        }

        // Draw Falling Notes
        runwayNotes.forEach((n, idx) => {
          if (currentWorkout.handFocus === 'left' && n.hand === 'right') return;
          if (currentWorkout.handFocus === 'right' && n.hand === 'left') return;

          const durBeats = durationToBeats(n.duration);
          const beatsToHit = n.time - beat;
          const noteHeight = Math.max(16, durBeats * pixelsPerBeat - 2);

          // Top edge of note block
          const noteBottomY = hitLineY - beatsToHit * pixelsPerBeat;
          const noteTopY = noteBottomY - noteHeight;

          if (noteBottomY < 0 || noteTopY > h) return;

          const bounds = getNoteHorizontalBounds(n.midi);
          const noteX = (bounds.leftPercent / 100) * w + 1;
          const noteW = Math.max(12, (bounds.widthPercent / 100) * w - 2);

          const isLH = n.hand === 'left';
          const isHit = beat >= n.time && beat < n.time + durBeats;
          const isWaiting = isWaitingOnStep && waitingTargetStepIdx === idx;

          ctx.save();

          if (isWaiting) {
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 24;
            ctx.fillStyle = '#fef08a';
          } else if (isHit) {
            // Radiant glow at impact line
            ctx.shadowColor = isLH ? '#a855f7' : '#22d3ee';
            ctx.shadowBlur = 20;
            ctx.fillStyle = isLH ? '#c084fc' : '#67e8f9';
          } else {
            // Left Hand: Indigo / Neon Violet (#818cf8 / #a855f7)
            // Right Hand: Electric Cyan (#22d3ee / #06b6d4)
            const noteGrad = ctx.createLinearGradient(noteX, noteTopY, noteX, noteBottomY);
            if (isLH) {
              noteGrad.addColorStop(0, '#6366f1');
              noteGrad.addColorStop(1, '#8b5cf6');
            } else {
              noteGrad.addColorStop(0, '#06b6d4');
              noteGrad.addColorStop(1, '#22d3ee');
            }
            ctx.fillStyle = noteGrad;
          }

          // Rounded note pill
          ctx.beginPath();
          ctx.roundRect(noteX, noteTopY, noteW, noteHeight, 6);
          ctx.fill();

          // Border stroke
          ctx.strokeStyle = isWaiting ? '#ca8a04' : isLH ? '#c084fc' : '#a5f3fc';
          ctx.lineWidth = isHit || isWaiting ? 2 : 1;
          ctx.stroke();

          // Note label text inside the block
          ctx.fillStyle = isHit || isWaiting ? '#020617' : '#ffffff';
          ctx.font = 'bold 11px monospace';
          const textY = Math.max(noteTopY + 12, Math.min(noteBottomY - 4, hitLineY - 6));
          ctx.fillText(n.note, noteX + 4, textY);

          // Finger hint badge if space allows
          if (noteHeight > 28) {
            ctx.fillStyle = isHit || isWaiting ? '#020617' : 'rgba(255, 255, 255, 0.7)';
            ctx.font = '9px monospace';
            ctx.fillText(isLH ? 'LH' : 'RH', noteX + 4, noteTopY + 22);
          }

          ctx.restore();
        });

        // Fixed Cyan Bright Impact Line
        ctx.save();
        ctx.shadowColor = isWaitingOnStep ? '#facc15' : '#22d3ee';
        ctx.shadowBlur = 22;
        ctx.strokeStyle = isWaitingOnStep ? '#facc15' : '#22d3ee';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, hitLineY);
        ctx.lineTo(w, hitLineY);
        ctx.stroke();

        // Impact indicator dots for active notes
        runwayNotes.forEach((n) => {
          const durBeats = durationToBeats(n.duration);
          if (beat >= n.time && beat < n.time + durBeats) {
            const bounds = getNoteHorizontalBounds(n.midi);
            const cx = (bounds.leftPercent / 100) * w + ((bounds.widthPercent / 100) * w) / 2;
            ctx.fillStyle = n.hand === 'left' ? '#c084fc' : '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, hitLineY, 7, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.restore();
      } else {
        // =====================================================================
        // MODE B: RUNWAY LATERAL (Horizontal continuous strip)
        // =====================================================================
        const hitLineX = w * 0.16; // Fixed vertical hit line at 16% from left
        const pixelsPerSecond = 140;

        // Draw vertical measure grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let b = 0; b <= totalBeats; b++) {
          const x = hitLineX + (b - beat) * pixelsPerSecond;
          if (x >= 0 && x <= w) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
            ctx.font = '10px monospace';
            ctx.fillText(`C${b + 1}`, x + 4, 16);
          }
        }

        const minMidi = 21;
        const maxMidi = 108;
        const totalMidis = maxMidi - minMidi + 1;
        const laneH = h / totalMidis;

        runwayNotes.forEach((note, idx) => {
          if (currentWorkout.handFocus === 'left' && note.hand === 'right') return;
          if (currentWorkout.handFocus === 'right' && note.hand === 'left') return;

          const durBeats = durationToBeats(note.duration);
          const noteX = hitLineX + (note.time - beat) * pixelsPerSecond;
          const noteWidth = Math.max(20, durBeats * pixelsPerSecond - 2);

          if (noteX + noteWidth < 0 || noteX > w) return;

          const isHit = beat >= note.time && beat < note.time + durBeats;
          const isWaiting = isWaitingOnStep && waitingTargetStepIdx === idx;
          const isLH = note.hand === 'left';

          const clampedMidi = Math.max(minMidi, Math.min(maxMidi, note.midi));
          const midiOffset = maxMidi - clampedMidi;
          const blockHeight = Math.max(14, laneH * 2.8);
          const noteY = Math.max(0, Math.min(h - blockHeight, midiOffset * laneH));

          ctx.save();
          if (isWaiting) {
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#facc15';
          } else if (isHit) {
            ctx.shadowColor = isLH ? '#a855f7' : '#22d3ee';
            ctx.shadowBlur = 18;
            ctx.fillStyle = isLH ? '#c084fc' : '#67e8f9';
          } else {
            ctx.fillStyle = isLH ? '#818cf8' : '#22d3ee';
          }

          ctx.beginPath();
          ctx.roundRect(noteX, noteY, noteWidth, blockHeight, 4);
          ctx.fill();

          ctx.strokeStyle = isWaiting ? '#ca8a04' : isLH ? '#6366f1' : '#0891b2';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = isHit || isWaiting ? '#020617' : '#083344';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(note.note, noteX + 4, noteY + blockHeight - 3);

          ctx.restore();
        });

        // Fixed Vertical Cyan Hitline at 16%
        ctx.save();
        ctx.shadowColor = isWaitingOnStep ? '#eab308' : '#22d3ee';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = isWaitingOnStep ? '#facc15' : '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hitLineX, 0);
        ctx.lineTo(hitLineX, h);
        ctx.stroke();
        ctx.restore();
      }
    },
    [
      viewMode,
      totalBeats,
      runwayNotes,
      currentWorkout.handFocus,
      getNoteHorizontalBounds,
      whiteKeys,
      whiteKeyCount,
      isWaitingOnStep,
      waitingTargetStepIdx,
    ]
  );

  // Resize canvas according to device pixel ratio
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      drawCanvas(currentBeat);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas, currentBeat]);

  // Main 60 FPS Audio & Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      setActiveRunwayNotesMap(new Map());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      drawCanvas(currentBeat);
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
          setActiveRunwayNotesMap(new Map());
          drawCanvas(0);
          return;
        }
      }

      setCurrentBeat(beat);
      drawCanvas(beat);

      // Check hitline triggers
      const activeMap = new Map<number, NoteInfo>();
      const notesToTriggerNow: string[] = [];

      runwayNotes.forEach((n, idx) => {
        const dBeats = durationToBeats(n.duration);
        const start = n.time;
        const end = start + dBeats;

        if (currentWorkout.handFocus === 'left' && n.hand === 'right') return;
        if (currentWorkout.handFocus === 'right' && n.hand === 'left') return;

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
        const sampleDur = '8n';
        keysAudioEngine.playChord(notesToTriggerNow, sampleDur);
      }

      setActiveRunwayNotesMap(activeMap);
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
    runwayNotes,
    currentWorkout.handFocus,
    isWaitingOnStep,
    waitForNoteMode,
    drawCanvas,
    currentBeat,
  ]);

  // Combined Active Notes for Piano: from Runway and Manual/MIDI Presses
  const currentMeasure = Math.floor(currentBeat / 4) + 1;
  const currentBeatInMeasure = (currentBeat % 4) + 1;

  // Active hand for current measure
  const currentMeasureHand = useMemo(() => {
    const start = (currentMeasure - 1) * 4;
    const end = start + 4;
    const notesInMeasure = runwayNotes.filter((n) => n.time >= start && n.time < end);
    const hasLH = notesInMeasure.some((n) => n.hand === 'left');
    const hasRH = notesInMeasure.some((n) => n.hand === 'right');
    if (hasLH && hasRH) return 'both';
    if (hasLH) return 'left';
    if (hasRH) return 'right';
    return currentWorkout.handFocus;
  }, [currentMeasure, runwayNotes, currentWorkout.handFocus]);

  // ─── SAFE EARLY RETURN — placed AFTER all hooks ─────────────────────────────
  // This must come AFTER every hook call (useState/useRef/useEffect/useMemo/useCallback)
  // to avoid React error #300 "Rendered fewer hooks than expected".
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <span className="text-sm font-mono font-bold tracking-wider uppercase text-cyan-400">
            Cargando Escenario Synthesia...
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {currentWorkout.title}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden bg-[#080c14] text-slate-100 flex flex-col justify-between select-none">
      {/* ================================================================= */}
      {/* A) TOP HUD MINIMALISTA (Barra Superior Flotante Estilo Synthesia)  */}
      {/* ================================================================= */}
      <header className="w-full px-4 py-2.5 bg-[#070b16]/95 border-b border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 z-50">
        {/* Left: Back Button, Title & Badges */}
        <div className="flex items-center gap-3">
          <Link
            href="/studio/keys"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Volver al Taller de Edición y Composición"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Editor</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Exercise Title & Hand Badge */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-100 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {currentWorkout.title}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                {currentWorkout.tonic}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              {currentWorkout.handFocus === 'left' && (
                <span className="text-purple-300 font-bold flex items-center gap-1">
                  <Hand className="w-3 h-3 text-purple-400" /> Mano Izquierda
                </span>
              )}
              {currentWorkout.handFocus === 'right' && (
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <Hand className="w-3 h-3 text-cyan-400" /> Mano Derecha
                </span>
              )}
              {currentWorkout.handFocus === 'both' && (
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  👐 Ambas Manos
                </span>
              )}
              <span>•</span>
              <span className="text-slate-300">
                Compás {currentMeasure} / {Math.ceil(totalBeats / 4)}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Minimalist Transport Controls */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          {/* Play / Pause (Space) */}
          <button
            type="button"
            onClick={() => {
              keysAudioEngine.ensureStarted();
              setIsPlaying(!isPlaying);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.6)] scale-105'
                : 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:scale-105'
            }`}
            title="Reproducir / Pausar (Espacio)"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-slate-950" />
            ) : (
              <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
            )}
          </button>

          {/* Reset / Rewind */}
          <button
            type="button"
            onClick={() => {
              setCurrentBeat(0);
              startTimeRef.current = 0;
              triggeredNoteIdsRef.current.clear();
              setIsWaitingOnStep(false);
              setWaitingTargetStepIdx(-1);
            }}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Reiniciar Secuencia (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              isLooping
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
            title="Bucle Continuo"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* BPM Adjustment */}
          <div className="flex items-center gap-1.5 px-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">BPM</span>
            <button
              type="button"
              onClick={() => handleBpmChange(bpm - 5)}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-cyan-300">{bpm}</span>
            <button
              type="button"
              onClick={() => handleBpmChange(bpm + 5)}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
            >
              +
            </button>
          </div>

          {/* Wait for Note Mode Switch */}
          <button
            type="button"
            onClick={() => setWaitForNoteMode(!waitForNoteMode)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border ${
              waitForNoteMode
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="El reproductor espera a que toques la nota correcta antes de avanzar"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pausa y Espera</span>
            <span>{waitForNoteMode ? '[ON]' : '[OFF]'}</span>
          </button>
        </div>

        {/* Right: Sound, View, Fullscreen & MIDI Info */}
        <div className="flex items-center gap-2">
          {/* USB MIDI Badge */}
          {midiDeviceName ? (
            <span
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold"
              title={`Dispositivo MIDI activo: ${midiDeviceName}`}
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>MIDI: {midiDeviceName.slice(0, 14)}</span>
            </span>
          ) : (
            <span
              className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-500 text-[10px] font-mono"
              title="Conecta un teclado MIDI por USB para tocar directamente"
            >
              <span>🎹 MIDI USB Listo</span>
            </span>
          )}

          {/* Timbre Switcher */}
          <div className="hidden md:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => updateTimbre('grand')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                timbre === 'grand'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grand
            </button>
            <button
              onClick={() => updateTimbre('rhodes')}
              className={`px-2 py-0.5 rounded-lg transition-colors ${
                timbre === 'rhodes'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rhodes
            </button>
          </div>

          {/* View Mode Toggle: Waterfall vs Lateral */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'waterfall' ? 'lateral' : 'waterfall')}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-bold transition-colors"
            title="Cambiar entre modo Cascada Synthesia y Pista Lateral"
          >
            {viewMode === 'waterfall' ? '🌊 Cascada' : '↔️ Lateral'}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Modo Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* B) MAIN STAGE: SYNTHESIA WATERFALL CANVAS + ALIGNED PIANO KEYBOARD */}
      {/* ================================================================= */}
      <main className="flex-1 min-h-0 w-full flex flex-col justify-between relative overflow-hidden bg-[#080c14]">
        {/* Floating Active Measure & Wait Feedback HUD */}
        <div className="absolute top-3 left-4 z-20 pointer-events-none flex flex-col gap-1.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-xs font-mono backdrop-blur-md flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-slate-300 font-bold">
              Compás {currentMeasure} • Tiempo {currentBeatInMeasure.toFixed(1)}
            </span>
            <span className="text-slate-600">|</span>
            <span
              className={`font-black ${
                currentMeasureHand === 'left'
                  ? 'text-purple-400'
                  : currentMeasureHand === 'right'
                  ? 'text-cyan-400'
                  : 'text-amber-400'
              }`}
            >
              Mano: {currentMeasureHand === 'left' ? 'LH' : currentMeasureHand === 'right' ? 'RH' : 'Ambas'}
            </span>
          </div>

          {/* Wait for note alert banner */}
          {isWaitingOnStep && waitingTargetStepIdx >= 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-400/95 text-slate-950 font-black text-xs font-mono shadow-[0_0_25px_rgba(251,191,36,0.8)] border border-amber-300 animate-bounce flex items-center gap-2">
              <span className="text-base">⏸️</span>
              <span>
                ESPERANDO NOTA: Toca [{runwayNotes[waitingTargetStepIdx]?.note}] para avanzar
              </span>
            </div>
          )}

          {/* Hit Success Flash */}
          {hitSuccessFlash && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-black text-xs font-mono shadow-[0_0_20px_rgba(52,211,153,0.9)] animate-pulse flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡EXCELENTE! Continúa...</span>
            </div>
          )}
        </div>

        {/* 1. Continuous Runway / Synthesia Canvas */}
        <div className="w-full flex-1 min-h-0 relative overflow-hidden flex items-stretch">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
          />
        </div>

        {/* 2. Aligned Interactive Piano Keyboard */}
        <div className="w-full relative z-30 select-none bg-[#050914] border-t-2 border-cyan-500/40 shadow-[0_-10px_30px_rgba(6,182,212,0.15)] pb-1">
          {/* Piano Key Bed (White & Black Keys) */}
          <div className="relative w-full h-44 sm:h-52 md:h-60 overflow-hidden px-1">
            {/* White Keys Layer */}
            <div className="flex w-full h-full">
              {whiteKeys.map((keyInfo) => {
                const isManualPressed = pressedMidis.has(keyInfo.midi);
                const activeRunwayNote = activeRunwayNotesMap.get(keyInfo.midi);
                const isWaitingTarget =
                  isWaitingOnStep &&
                  waitingTargetStepIdx >= 0 &&
                  runwayNotes[waitingTargetStepIdx]?.midi === keyInfo.midi;

                const isLH = activeRunwayNote?.hand === 'LH' || keyInfo.midi < 60;
                const isActive = isManualPressed || !!activeRunwayNote;

                let keyStyle =
                  'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#cbd5e1] hover:bg-slate-100 text-slate-700';

                if (isWaitingTarget) {
                  keyStyle =
                    'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[0_0_30px_rgba(245,158,11,1)] scale-[0.98] translate-y-1 animate-pulse';
                } else if (isActive) {
                  keyStyle = isLH
                    ? 'bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-700 text-white shadow-[0_0_24px_rgba(147,51,234,0.95)] scale-[0.98] translate-y-1 font-black ring-2 ring-purple-400'
                    : 'bg-gradient-to-b from-cyan-300 via-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_24px_rgba(6,182,212,0.95)] scale-[0.98] translate-y-1 font-black ring-2 ring-cyan-300';
                }

                return (
                  <div
                    key={`pk-w-${keyInfo.midi}`}
                    onMouseDown={() => {
                      isMouseDownRef.current = true;
                      handleNoteStart(keyInfo);
                    }}
                    onMouseUp={() => {
                      isMouseDownRef.current = false;
                      handleNoteEnd(keyInfo);
                    }}
                    onMouseEnter={() => {
                      if (isMouseDownRef.current) handleNoteStart(keyInfo);
                    }}
                    onMouseLeave={() => {
                      if (isMouseDownRef.current) handleNoteEnd(keyInfo);
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleNoteStart(keyInfo);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleNoteEnd(keyInfo);
                    }}
                    style={{ width: `${whiteKeyWidthPercent}%` }}
                    className={`group relative h-full flex flex-col justify-between items-center py-2 cursor-pointer border-r border-slate-300/40 rounded-b-md transition-all duration-75 ${keyStyle}`}
                  >
                    {/* Top Hand / Finger badge */}
                    <div className="flex flex-col items-center gap-1">
                      {isActive && (
                        <span
                          className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-sm ${
                            isLH ? 'bg-purple-900 text-purple-200' : 'bg-cyan-950 text-cyan-200'
                          }`}
                        >
                          {isLH ? 'LH' : 'RH'}
                        </span>
                      )}
                    </div>

                    {/* Bottom Key Label */}
                    <span
                      className={`text-[10px] sm:text-xs font-mono font-extrabold tracking-tighter ${
                        isActive || isWaitingTarget
                          ? 'text-slate-950 font-black'
                          : 'text-slate-600 group-hover:text-slate-900'
                      }`}
                    >
                      {keyInfo.fullNote}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Black Keys Layer (Absolute over white keys) */}
            {allKeys.map((keyInfo) => {
              if (!keyInfo.isBlack) return null;

              const precedingWhiteCount = whiteKeys.filter((wk) => wk.midi < keyInfo.midi).length;
              const leftPercent =
                precedingWhiteCount * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.35;
              const blackWidthPercent = whiteKeyWidthPercent * 0.7;

              const isManualPressed = pressedMidis.has(keyInfo.midi);
              const activeRunwayNote = activeRunwayNotesMap.get(keyInfo.midi);
              const isWaitingTarget =
                isWaitingOnStep &&
                waitingTargetStepIdx >= 0 &&
                runwayNotes[waitingTargetStepIdx]?.midi === keyInfo.midi;

              const isLH = activeRunwayNote?.hand === 'LH' || keyInfo.midi < 60;
              const isActive = isManualPressed || !!activeRunwayNote;

              let blackStyle =
                'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] hover:from-[#334155] hover:to-[#0f172a] text-slate-400 border border-slate-900';

              if (isWaitingTarget) {
                blackStyle =
                  'bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-600 text-slate-950 font-black shadow-[0_0_28px_rgba(245,158,11,1)] border border-amber-300 translate-y-0.5 animate-pulse';
              } else if (isActive) {
                blackStyle = isLH
                  ? 'bg-gradient-to-b from-purple-500 via-indigo-600 to-purple-800 text-white shadow-[0_0_24px_rgba(168,85,247,1)] border border-purple-300 translate-y-0.5 font-black'
                  : 'bg-gradient-to-b from-cyan-400 via-sky-500 to-blue-600 text-slate-950 shadow-[0_0_24px_rgba(6,182,212,1)] border border-cyan-200 translate-y-0.5 font-black';
              }

              return (
                <div
                  key={`pk-b-${keyInfo.midi}`}
                  onMouseDown={() => {
                    isMouseDownRef.current = true;
                    handleNoteStart(keyInfo);
                  }}
                  onMouseUp={() => {
                    isMouseDownRef.current = false;
                    handleNoteEnd(keyInfo);
                  }}
                  onMouseEnter={() => {
                    if (isMouseDownRef.current) handleNoteStart(keyInfo);
                  }}
                  onMouseLeave={() => {
                    if (isMouseDownRef.current) handleNoteEnd(keyInfo);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleNoteStart(keyInfo);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleNoteEnd(keyInfo);
                  }}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${blackWidthPercent}%`,
                    height: '62%',
                  }}
                  className={`absolute top-0 z-20 flex flex-col justify-between items-center py-1 cursor-pointer rounded-b-md shadow-2xl transition-all duration-75 ${blackStyle}`}
                >
                  <div />
                  <span
                    className={`text-[9px] font-mono font-bold ${
                      isActive || isWaitingTarget ? 'text-slate-950 font-black' : 'text-slate-400'
                    }`}
                  >
                    {keyInfo.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
