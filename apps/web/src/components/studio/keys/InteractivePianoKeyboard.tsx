'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  NoteInfo,
  KeyboardRange,
  LabelType,
  CHROMATIC_NOTES,
  midiToNoteInfo,
} from '@/services/theory/keysTheoryEngine';
import { keysAudioEngine } from '@/services/audio/keysAudioEngine';
import { Layers, Zap, Hand, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

interface InteractivePianoKeyboardProps {
  range: KeyboardRange;
  onRangeChange?: (range: KeyboardRange) => void;
  activeNotesMap?: Map<number, NoteInfo>; // Notes triggered by Runway or Theory engine
  activeLabelType?: LabelType;
  splitPointMidi?: number;
  onKeyTrigger?: (note: NoteInfo, isDown: boolean) => void;
  className?: string;
}

export default function InteractivePianoKeyboard({
  range = 61,
  onRangeChange,
  activeNotesMap = new Map(),
  activeLabelType = 'notes',
  splitPointMidi = 60,
  onKeyTrigger,
  className = '',
}: InteractivePianoKeyboardProps) {
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [pressedMidis, setPressedMidis] = useState<Set<number>>(new Set());
  const isMouseDownRef = useRef(false);

  // Compute key bounds
  // 61 keys: C2 (36) to C7 (96)
  // 88 keys: A0 (21) to C8 (108)
  const startMidi = (range === 61 ? 36 : 21) + octaveOffset * 12;
  const endMidi = (range === 61 ? 96 : 108) + octaveOffset * 12;

  // Build array of all keys within current range
  const allKeys: NoteInfo[] = [];
  for (let m = startMidi; m <= endMidi; m++) {
    allKeys.push(midiToNoteInfo(m));
  }

  const whiteKeys = allKeys.filter((k) => !k.isBlack);

  // Handle note attack / release
  const handleNoteStart = useCallback(
    (note: NoteInfo) => {
      keysAudioEngine.playNote(note.fullNote);
      setPressedMidis((prev) => new Set(prev).add(note.midi));
      onKeyTrigger?.(note, true);
    },
    [onKeyTrigger]
  );

  const handleNoteEnd = useCallback(
    (note: NoteInfo) => {
      keysAudioEngine.releaseNote(note.fullNote);
      setPressedMidis((prev) => {
        const next = new Set(prev);
        next.delete(note.midi);
        return next;
      });
      onKeyTrigger?.(note, false);
    },
    [onKeyTrigger]
  );

  // Global mouse up handler to clean active drag states
  useEffect(() => {
    const onGlobalMouseUp = () => {
      isMouseDownRef.current = false;
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // Keyboard shortcut mapping (Middle octave playing with QWERTY keys)
  useEffect(() => {
    const keyMap: { [key: string]: number } = {
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
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const lower = e.key.toLowerCase();

      if (e.code === 'Space') {
        e.preventDefault();
        keysAudioEngine.setSustainPedal(true);
        return;
      }

      if (keyMap[lower]) {
        const targetMidi = keyMap[lower] + octaveOffset * 12;
        const note = midiToNoteInfo(targetMidi);
        handleNoteStart(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const lower = e.key.toLowerCase();

      if (e.code === 'Space') {
        keysAudioEngine.setSustainPedal(false);
        return;
      }

      if (keyMap[lower]) {
        const targetMidi = keyMap[lower] + octaveOffset * 12;
        const note = midiToNoteInfo(targetMidi);
        handleNoteEnd(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNoteStart, handleNoteEnd, octaveOffset]);

  // Determine key positions for overlay of black keys
  const whiteKeyWidthPercent = 100 / whiteKeys.length;

  return (
    <div className={`w-full flex flex-col gap-3 p-4 rounded-2xl bg-[#0b1329]/90 border border-slate-800 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Keyboard Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Interactive Piano Keyboard</span>
          </div>
          <span className="text-slate-500">|</span>
          {/* 61 vs 88 keys range toggle */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-700/60">
            <button
              onClick={() => onRangeChange?.(61)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                range === 61
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              61 Teclas (C2-C7)
            </button>
            <button
              onClick={() => onRangeChange?.(88)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                range === 88
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              88 Teclas (A0-C8)
            </button>
          </div>
        </div>

        {/* Octave Shift Controls & Split Indicator */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 text-[11px]">Octava:</span>
            <button
              onClick={() => setOctaveOffset((prev) => Math.max(-2, prev - 1))}
              className="p-1 text-slate-300 hover:text-cyan-400 transition-colors"
              title="Bajar una octava"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-cyan-400 px-1">{octaveOffset >= 0 ? `+${octaveOffset}` : octaveOffset}</span>
            <button
              onClick={() => setOctaveOffset((prev) => Math.min(2, prev + 1))}
              className="p-1 text-slate-300 hover:text-cyan-400 transition-colors"
              title="Subir una octava"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
            <Hand className="w-3.5 h-3.5 text-purple-400" />
            <span>Mano Izquierda (&lt;C4)</span>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span className="ml-1 text-cyan-400 font-bold">Mano Derecha (&ge;C4)</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          </div>
        </div>
      </div>

      {/* SVG / HTML5 Keyboard Canvas Box */}
      <div className="relative w-full h-44 sm:h-52 select-none overflow-hidden rounded-xl border border-slate-800 bg-[#050914] shadow-inner p-1">
        {/* White Keys Row */}
        <div className="flex w-full h-full">
          {whiteKeys.map((keyInfo, whiteIdx) => {
            const isManualPressed = pressedMidis.has(keyInfo.midi);
            const activeTheoryNote = activeNotesMap.get(keyInfo.midi);
            const isActive = isManualPressed || !!activeTheoryNote;
            const isLH = keyInfo.midi < splitPointMidi;

            // Display Label Text
            let labelText = '';
            if (activeLabelType === 'notes') {
              labelText = keyInfo.fullNote;
            } else if (activeLabelType === 'intervals' && activeTheoryNote?.interval) {
              labelText = activeTheoryNote.interval;
            } else if (activeLabelType === 'fingers' && activeTheoryNote?.finger) {
              labelText = `F${activeTheoryNote.finger}`;
            }

            return (
              <div
                key={`white-${keyInfo.midi}`}
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
                className={`group relative h-full flex flex-col justify-end items-center pb-2 cursor-pointer border-r border-slate-300/40 rounded-b-md transition-all duration-75 ${
                  isActive
                    ? isLH
                      ? 'bg-gradient-to-b from-purple-500 via-purple-400 to-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.9)] scale-[0.99] translate-y-1'
                      : 'bg-gradient-to-b from-amber-400 via-amber-300 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.9)] scale-[0.99] translate-y-1'
                    : 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] hover:bg-slate-100 text-slate-700'
                }`}
              >
                {/* Finger or Hand Split Tag */}
                {activeTheoryNote && (
                  <div
                    className={`absolute top-2 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full shadow-sm ${
                      isLH ? 'bg-purple-900/90 text-purple-200' : 'bg-cyan-950/90 text-cyan-200'
                    }`}
                  >
                    {activeTheoryNote.finger ? `F${activeTheoryNote.finger}` : isLH ? 'LH' : 'RH'}
                  </div>
                )}

                {/* Key Label */}
                {labelText && (
                  <span
                    className={`text-[10px] font-extrabold font-mono tracking-tighter ${
                      isActive ? 'text-slate-950 font-black' : 'text-slate-600 group-hover:text-slate-900'
                    }`}
                  >
                    {labelText}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Black Keys Layer (Positioned absolute over white keys) */}
        {allKeys.map((keyInfo) => {
          if (!keyInfo.isBlack) return null;

          // Find preceding white key index to position black key exactly over seam
          const precedingWhiteCount = whiteKeys.filter((wk) => wk.midi < keyInfo.midi).length;
          const leftPercent = precedingWhiteCount * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.35;
          const blackWidthPercent = whiteKeyWidthPercent * 0.7;

          const isManualPressed = pressedMidis.has(keyInfo.midi);
          const activeTheoryNote = activeNotesMap.get(keyInfo.midi);
          const isActive = isManualPressed || !!activeTheoryNote;
          const isLH = keyInfo.midi < splitPointMidi;

          let labelText = '';
          if (activeLabelType === 'notes') {
            labelText = keyInfo.name;
          } else if (activeLabelType === 'intervals' && activeTheoryNote?.interval) {
            labelText = activeTheoryNote.interval;
          } else if (activeLabelType === 'fingers' && activeTheoryNote?.finger) {
            labelText = `F${activeTheoryNote.finger}`;
          }

          return (
            <div
              key={`black-${keyInfo.midi}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                isMouseDownRef.current = true;
                handleNoteStart(keyInfo);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
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
                e.stopPropagation();
                e.preventDefault();
                handleNoteStart(keyInfo);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleNoteEnd(keyInfo);
              }}
              style={{
                left: `${leftPercent}%`,
                width: `${blackWidthPercent}%`,
              }}
              className={`absolute top-0 h-[62%] rounded-b-md cursor-pointer z-10 flex flex-col justify-end items-center pb-2 transition-all duration-75 border border-slate-900 shadow-xl ${
                isActive
                  ? isLH
                    ? 'bg-gradient-to-b from-purple-600 via-purple-500 to-purple-700 text-white shadow-[0_0_16px_rgba(168,85,247,0.95)] translate-y-0.5'
                    : 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-cyan-600 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.95)] translate-y-0.5'
                  : 'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] hover:from-[#334155] hover:to-[#0f172a] text-slate-400'
              }`}
            >
              {/* Black Key Top Bevel Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-slate-600/40 rounded-t-sm" />

              {/* Finger tag */}
              {activeTheoryNote && (
                <div
                  className={`absolute top-1 text-[8px] font-bold font-mono px-1 rounded ${
                    isLH ? 'bg-purple-950 text-purple-200' : 'bg-cyan-950 text-cyan-200'
                  }`}
                >
                  {activeTheoryNote.finger ? `F${activeTheoryNote.finger}` : '•'}
                </div>
              )}

              {labelText && (
                <span className="text-[9px] font-bold font-mono tracking-tighter text-slate-200">
                  {labelText}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
