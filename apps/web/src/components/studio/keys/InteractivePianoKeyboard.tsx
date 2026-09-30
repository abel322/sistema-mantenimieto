'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  NoteInfo,
  KeyboardRange,
  LabelType,
  CHROMATIC_NOTES,
  midiToNoteInfo,
} from '@/services/theory/keysTheoryEngine';
import { HandFocus } from '@/data/practiceWorkoutsData';
import { keysAudioEngine } from '@/services/audio/keysAudioEngine';
import { Layers, Zap, Hand, Sliders, ChevronLeft, ChevronRight, Shield, Keyboard } from 'lucide-react';

interface InteractivePianoKeyboardProps {
  range: KeyboardRange;
  onRangeChange?: (range: KeyboardRange) => void;
  activeNotesMap?: Map<number, NoteInfo>; // Notes triggered by Runway or Theory engine
  activeLabelType?: LabelType;
  splitPointMidi?: number;
  smartKeyGuardMode?: boolean;
  targetNotesSet?: Set<number>; // Root and 5th (Golden Keys)
  safeNotesSet?: Set<number>;   // In-scale notes (Bright Cyan)
  blockWrongKeys?: boolean;
  pcKeyLabelsMap?: Map<number, string>; // Maps midi to keyboard letter (e.g. 60 -> 'A')
  onKeyTrigger?: (note: NoteInfo, isDown: boolean) => void;
  handFocus?: HandFocus;
  className?: string;
}

export default function InteractivePianoKeyboard({
  range = 61,
  onRangeChange,
  activeNotesMap = new Map(),
  activeLabelType = 'notes',
  splitPointMidi = 60,
  smartKeyGuardMode = false,
  targetNotesSet = new Set(),
  safeNotesSet = new Set(),
  blockWrongKeys = false,
  pcKeyLabelsMap = new Map(),
  onKeyTrigger,
  handFocus = 'both',
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

  // Check if a note is playable under Smart Guard
  const isPlayable = useCallback(
    (midi: number) => {
      if (!smartKeyGuardMode || !blockWrongKeys) return true;
      return targetNotesSet.has(midi) || safeNotesSet.has(midi);
    },
    [smartKeyGuardMode, blockWrongKeys, targetNotesSet, safeNotesSet]
  );

  // Handle note attack / release
  const handleNoteStart = useCallback(
    (note: NoteInfo) => {
      if (!isPlayable(note.midi)) return;
      keysAudioEngine.playNote(note.fullNote);
      setPressedMidis((prev) => new Set(prev).add(note.midi));
      onKeyTrigger?.(note, true);
    },
    [isPlayable, onKeyTrigger]
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

  // Keyboard shortcut mapping (Middle octave or Smart Guard PC keys)
  useEffect(() => {
    // If smart guard has custom PC key mapping, invert it for key listening
    const invertedPcMap: { [key: string]: number } = {};
    pcKeyLabelsMap.forEach((letter, midi) => {
      invertedPcMap[letter.toLowerCase()] = midi;
    });

    const defaultKeyMap: { [key: string]: number } = {
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
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const lower = e.key.toLowerCase();

      if (e.code === 'Space') {
        e.preventDefault();
        keysAudioEngine.setSustainPedal(true);
        return;
      }

      if (smartKeyGuardMode && invertedPcMap[lower] !== undefined) {
        const targetMidi = invertedPcMap[lower];
        const note = midiToNoteInfo(targetMidi);
        handleNoteStart(note);
        return;
      }

      if (defaultKeyMap[lower]) {
        const targetMidi = defaultKeyMap[lower] + octaveOffset * 12;
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

      if (smartKeyGuardMode && invertedPcMap[lower] !== undefined) {
        const targetMidi = invertedPcMap[lower];
        const note = midiToNoteInfo(targetMidi);
        handleNoteEnd(note);
        return;
      }

      if (defaultKeyMap[lower]) {
        const targetMidi = defaultKeyMap[lower] + octaveOffset * 12;
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
  }, [smartKeyGuardMode, pcKeyLabelsMap, handleNoteStart, handleNoteEnd, octaveOffset]);

  const whiteKeyWidthPercent = 100 / whiteKeys.length;

  return (
    <div className={`w-full flex flex-col gap-3 p-4 rounded-2xl bg-[#0b1329]/95 border border-slate-800 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Keyboard Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Interactive Piano Keyboard</span>
          </div>

          {smartKeyGuardMode && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold animate-pulse">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>Smart Key Guard Activo</span>
            </span>
          )}

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
          {!smartKeyGuardMode ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
              {handFocus === 'left' && (
                <>
                  <Hand className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-purple-300 font-bold">Mano Izquierda (&lt; C4)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,1)]"></span>
                  <span className="text-purple-400/80 text-[10px] ml-0.5">(Violeta/Índigo)</span>
                </>
              )}
              {handFocus === 'right' && (
                <>
                  <Hand className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-300 font-bold">Mano Derecha (&ge; C4)</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]"></span>
                  <span className="text-cyan-400/80 text-[10px] ml-0.5">(Cyan Brillante)</span>
                </>
              )}
              {handFocus === 'both' && (
                <>
                  <Hand className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-purple-300 font-bold">LH (&lt; C4)</span>
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span className="text-slate-500">|</span>
                  <span className="text-cyan-300 font-bold">RH (&ge; C4)</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]"></span>
              <span className="text-amber-300 font-bold">Target (1 / 5)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] ml-2"></span>
              <span className="text-cyan-300 font-bold">Escala Segura</span>
            </div>
          )}
        </div>
      </div>

      {/* SVG / HTML5 Keyboard Canvas Box */}
      <div className="relative w-full h-44 sm:h-52 select-none overflow-hidden rounded-xl border border-slate-800 bg-[#050914] shadow-inner p-1">
        {/* White Keys Row */}
        <div className="flex w-full h-full">
          {whiteKeys.map((keyInfo) => {
            const isManualPressed = pressedMidis.has(keyInfo.midi);
            const activeTheoryNote = activeNotesMap.get(keyInfo.midi);
            const isLH = activeTheoryNote
              ? (activeTheoryNote.hand === 'LH' || (activeTheoryNote.midi < splitPointMidi && activeTheoryNote.hand !== 'RH'))
              : (handFocus === 'left' ? true : (handFocus === 'right' ? false : keyInfo.midi < splitPointMidi));
            const isHandAllowed = handFocus === 'both' || !!activeTheoryNote || (handFocus === 'left' ? isLH : !isLH);
            const isActive = (isManualPressed || !!activeTheoryNote) && isHandAllowed;

            // Smart Guard Status
            const isTarget = smartKeyGuardMode && targetNotesSet.has(keyInfo.midi);
            const isSafe = smartKeyGuardMode && safeNotesSet.has(keyInfo.midi);
            const isOutOfKey = smartKeyGuardMode && !isTarget && !isSafe;
            const pcKeyLabel = pcKeyLabelsMap.get(keyInfo.midi);

            // Display Label Text
            let labelText = '';
            if (activeLabelType === 'notes') {
              labelText = keyInfo.fullNote;
            } else if (activeLabelType === 'intervals' && activeTheoryNote?.interval) {
              labelText = activeTheoryNote.interval;
            } else if (activeLabelType === 'fingers' && activeTheoryNote?.finger) {
              labelText = `F${activeTheoryNote.finger}`;
            }

            // Determine styling
            let keyStyleClass = 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] hover:bg-slate-100 text-slate-700';

            if (smartKeyGuardMode) {
              if (isTarget) {
                keyStyleClass = isActive
                  ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-[0_0_24px_rgba(245,158,11,1)] scale-[0.99] translate-y-1'
                  : 'bg-gradient-to-b from-amber-300/90 via-yellow-200 to-amber-400/90 text-slate-900 border-b-4 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]';
              } else if (isSafe) {
                keyStyleClass = isActive
                  ? 'bg-gradient-to-b from-cyan-300 via-sky-400 to-blue-500 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,1)] scale-[0.99] translate-y-1'
                  : 'bg-gradient-to-b from-cyan-100 via-sky-100 to-cyan-200 text-slate-900 border-b-4 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]';
              } else if (isOutOfKey) {
                keyStyleClass = blockWrongKeys
                  ? 'bg-[#0f172a]/40 text-slate-600 opacity-20 cursor-not-allowed border-r border-slate-900'
                  : 'bg-slate-300/40 text-slate-500 opacity-40';
              }
            } else if (isActive) {
              keyStyleClass = isLH
                ? 'bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-700 text-white shadow-[0_0_18px_rgba(147,51,234,0.9)] scale-[0.99] translate-y-1 font-black'
                : 'bg-gradient-to-b from-cyan-300 via-cyan-400 to-sky-400 text-slate-950 shadow-[0_0_18px_rgba(6,182,212,0.95)] scale-[0.99] translate-y-1 font-black';
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
                className={`group relative h-full flex flex-col justify-between items-center py-2 cursor-pointer border-r border-slate-300/40 rounded-b-md transition-all duration-75 ${keyStyleClass}`}
              >
                {/* Top Badge: PC Key Mapping or Finger / Hand Split */}
                <div className="flex flex-col items-center gap-1">
                  {pcKeyLabel && (
                    <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-slate-950 text-amber-300 border border-amber-400/80 shadow-md">
                      [{pcKeyLabel}]
                    </span>
                  )}

                  {!smartKeyGuardMode && activeTheoryNote && isHandAllowed && (
                    <div
                      className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full shadow-sm ${
                        isLH ? 'bg-purple-900/90 text-purple-200' : 'bg-cyan-950/90 text-cyan-200'
                      }`}
                    >
                      {activeTheoryNote.finger ? `F${activeTheoryNote.finger}` : isLH ? 'LH' : 'RH'}
                    </div>
                  )}

                  {smartKeyGuardMode && isTarget && !pcKeyLabel && (
                    <span className="text-[8px] font-black uppercase px-1 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-600">
                      Target
                    </span>
                  )}
                </div>

                {/* Bottom Key Label */}
                {labelText && (
                  <span
                    className={`text-[10px] font-extrabold font-mono tracking-tighter ${
                      isActive || isTarget || isSafe ? 'text-slate-950 font-black' : 'text-slate-600 group-hover:text-slate-900'
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

          const precedingWhiteCount = whiteKeys.filter((wk) => wk.midi < keyInfo.midi).length;
          const leftPercent = precedingWhiteCount * whiteKeyWidthPercent - whiteKeyWidthPercent * 0.35;
          const blackWidthPercent = whiteKeyWidthPercent * 0.7;

          const isManualPressed = pressedMidis.has(keyInfo.midi);
          const activeTheoryNote = activeNotesMap.get(keyInfo.midi);
          const isLH = activeTheoryNote
            ? (activeTheoryNote.hand === 'LH' || (activeTheoryNote.midi < splitPointMidi && activeTheoryNote.hand !== 'RH'))
            : (handFocus === 'left' ? true : (handFocus === 'right' ? false : keyInfo.midi < splitPointMidi));
          const isHandAllowed = handFocus === 'both' || !!activeTheoryNote || (handFocus === 'left' ? isLH : !isLH);
          const isActive = (isManualPressed || !!activeTheoryNote) && isHandAllowed;

          const isTarget = smartKeyGuardMode && targetNotesSet.has(keyInfo.midi);
          const isSafe = smartKeyGuardMode && safeNotesSet.has(keyInfo.midi);
          const isOutOfKey = smartKeyGuardMode && !isTarget && !isSafe;
          const pcKeyLabel = pcKeyLabelsMap.get(keyInfo.midi);

          let labelText = '';
          if (activeLabelType === 'notes') {
            labelText = keyInfo.name;
          } else if (activeLabelType === 'intervals' && activeTheoryNote?.interval) {
            labelText = activeTheoryNote.interval;
          } else if (activeLabelType === 'fingers' && activeTheoryNote?.finger) {
            labelText = `F${activeTheoryNote.finger}`;
          }

          let blackStyleClass = 'bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#020617] hover:from-[#334155] hover:to-[#0f172a] text-slate-400 border border-slate-900';

          if (smartKeyGuardMode) {
            if (isTarget) {
              blackStyleClass = isActive
                ? 'bg-gradient-to-b from-amber-400 via-yellow-400 to-amber-600 text-slate-950 font-black shadow-[0_0_24px_rgba(245,158,11,1)] border border-amber-300 translate-y-0.5'
                : 'bg-gradient-to-b from-amber-600 via-yellow-600 to-amber-700 text-white font-bold border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]';
            } else if (isSafe) {
              blackStyleClass = isActive
                ? 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,1)] border border-cyan-300 translate-y-0.5'
                : 'bg-gradient-to-b from-cyan-700 via-sky-800 to-cyan-900 text-cyan-200 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]';
            } else if (isOutOfKey) {
              blackStyleClass = blockWrongKeys
                ? 'bg-black/60 text-slate-700 opacity-20 cursor-not-allowed border border-slate-950'
                : 'bg-slate-950/70 text-slate-600 opacity-35 border border-slate-900';
            }
          } else if (isActive) {
            blackStyleClass = isLH
              ? 'bg-gradient-to-b from-indigo-600 via-purple-600 to-indigo-800 text-white shadow-[0_0_18px_rgba(147,51,234,0.95)] translate-y-0.5'
              : 'bg-gradient-to-b from-cyan-400 via-cyan-500 to-sky-600 text-slate-950 font-black shadow-[0_0_18px_rgba(6,182,212,0.95)] translate-y-0.5';
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
              className={`absolute top-0 h-[62%] rounded-b-md cursor-pointer z-10 flex flex-col justify-between items-center py-1.5 transition-all duration-75 shadow-xl ${blackStyleClass}`}
            >
              {/* PC Key Badge or Finger Tag */}
              <div className="flex flex-col items-center">
                {pcKeyLabel && (
                  <span className="text-[9px] font-black font-mono px-1 rounded bg-slate-950 text-amber-300 border border-amber-400/80 shadow">
                    [{pcKeyLabel}]
                  </span>
                )}
                {!smartKeyGuardMode && activeTheoryNote && isHandAllowed && (
                  <div
                    className={`text-[8px] font-bold font-mono px-1 rounded ${
                      isLH ? 'bg-purple-950 text-purple-200' : 'bg-cyan-950 text-cyan-200'
                    }`}
                  >
                    {activeTheoryNote.finger ? `F${activeTheoryNote.finger}` : '•'}
                  </div>
                )}
              </div>

              {labelText && (
                <span className="text-[9px] font-bold font-mono tracking-tighter">
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
