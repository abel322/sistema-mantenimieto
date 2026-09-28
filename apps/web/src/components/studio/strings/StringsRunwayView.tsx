'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as Tone from 'tone';
import {
  InstrumentType,
  StringTrack,
  SequencerStepCell,
} from '@/types/strings';
import { ActiveFretHit } from './InteractiveFretboard';
import { calculateFretNote } from '@/services/audio/stringsAudioEngine';
import { Zap } from 'lucide-react';

interface StringsRunwayViewProps {
  instrument: InstrumentType;
  tracks: StringTrack[];
  measuresCount: number;
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
  zoom: 1 | 2 | 4; // 1, 2 or 4 measures visible in viewport
  activeHits: ActiveFretHit[];
  activeHitNotes?: { stringIndex: number; fret: number; id: string }[];
  selectedCell: { stringIndex: number; stepIndex: number } | null;
  onSelectCell: (cell: { stringIndex: number; stepIndex: number } | null) => void;
  onUpdateStep: (stringIndex: number, stepIndex: number, stepData: SequencerStepCell) => void;
  onNoteTrigger?: (note: { stringIndex: number; fret: number; duration?: string }) => void;
}

export default function StringsRunwayView({
  instrument,
  tracks,
  measuresCount,
  currentStep,
  isPlaying,
  bpm,
  zoom,
  activeHits,
  activeHitNotes = [],
  selectedCell,
  onSelectCell,
  onUpdateStep,
  onNoteTrigger,
}: StringsRunwayViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const highwayCanvasRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const numStrings = tracks.length;
  const totalSteps = measuresCount * 16;
  const stepDurationSec = 15 / bpm; // 60 / (bpm * 4)
  const loopDurationSec = totalSteps * stepDurationSec;

  // Viewport dimensions
  const [containerWidth, setContainerWidth] = useState<number>(900);
  // Manual scroll scrub offset when paused
  const [scrubStepOffset, setScrubStepOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartOffsetRef = useRef<number>(0);

  // ResizeObserver to adapt dynamically to responsive screen width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Hit Line position (18% from left)
  const hitX = Math.round(containerWidth * 0.18);

  // Calculate stepWidth in pixels based on zoom level:
  // zoom 1: ~16 steps across available lookahead space
  // zoom 2: ~32 steps
  // zoom 4: ~64 steps
  const availableLookaheadWidth = Math.max(300, containerWidth - hitX - 40);
  const visibleStepsCount = zoom * 16;
  const stepWidthPx = Math.max(18, availableLookaheadWidth / visibleStepsCount);

  // String Y vertical positions inside ~240px container
  const stringYPositions = useMemo(() => {
    const topMargin = 42;
    const bottomMargin = 32;
    const usableHeight = 240 - topMargin - bottomMargin;
    const spacing = usableHeight / Math.max(1, numStrings - 1);
    return Array.from({ length: numStrings }, (_, idx) =>
      Math.round(topMargin + idx * spacing)
    );
  }, [numStrings]);

  // Real-time animation position state (fractional step position)
  const [animFractionalStep, setAnimFractionalStep] = useState<number>(0);
  const lastHitStepRef = useRef<number>(-1);

  // Continuous 60fps RAF animation loop synchronized with Tone.Transport
  useEffect(() => {
    if (!isPlaying) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setAnimFractionalStep(currentStep);
      lastHitStepRef.current = -1;
      return;
    }

    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      let fractional = 0;
      try {
        if (Tone.getTransport().state === 'started') {
          const tSec = Tone.getTransport().seconds % loopDurationSec;
          fractional = (tSec / stepDurationSec) % totalSteps;
        } else {
          // High-precision fallback based on currentStep
          fractional = currentStep;
        }
      } catch {
        fractional = currentStep;
      }

      setAnimFractionalStep(fractional);

      // Trigger onNoteTrigger callback at the instant note reaches target hitline
      const currentIntStep = Math.floor(fractional);
      if (currentIntStep !== lastHitStepRef.current) {
        lastHitStepRef.current = currentIntStep;
        if (onNoteTrigger) {
          tracks.forEach((track, sIdx) => {
            const cell = track.steps[currentIntStep];
            if (cell && cell.fret !== null) {
              onNoteTrigger({
                stringIndex: sIdx,
                fret: cell.fret,
                duration: cell.duration || '16n',
              });
            }
          });
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, currentStep, loopDurationSec, stepDurationSec, totalSteps, onNoteTrigger, tracks]);

  // Current effective play position in step units
  const effectiveStep = isPlaying ? animFractionalStep : scrubStepOffset;

  // Drag-to-scrub handlers when playback is stopped
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlaying) return;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = scrubStepOffset;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isPlaying) return;
    const deltaX = e.clientX - dragStartXRef.current;
    // Dragging left advances the timeline (increases step), dragging right rewinds
    const deltaSteps = -deltaX / stepWidthPx;
    const newOffset = Math.max(
      0,
      Math.min(totalSteps - 1, dragStartOffsetRef.current + deltaSteps)
    );
    setScrubStepOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel scrub support
  const handleWheel = (e: React.WheelEvent) => {
    if (isPlaying) return;
    e.preventDefault();
    const deltaSteps = (e.deltaY || e.deltaX) / (stepWidthPx * 1.5);
    setScrubStepOffset((prev) =>
      Math.max(0, Math.min(totalSteps - 1, prev + deltaSteps))
    );
  };

  // Click on string lane to insert/select note at step
  const handleLaneClick = (sIdx: number, e: React.MouseEvent) => {
    if (isDragging) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    // Calculate which step was clicked based on current effectiveStep and hitX
    const stepDiff = (clickX - hitX) / stepWidthPx;
    const rawStep = Math.round(effectiveStep + stepDiff);
    const targetStep = Math.max(0, Math.min(totalSteps - 1, rawStep));

    const track = tracks[sIdx];
    const existing = track?.steps[targetStep];

    if (!existing || existing.fret === null) {
      // Create new note with default fret 0
      onUpdateStep(sIdx, targetStep, {
        fret: 0,
        articulation: 'normal',
      });
      onSelectCell({ stringIndex: sIdx, stepIndex: targetStep });
    } else {
      // Select existing note for editing
      onSelectCell({ stringIndex: sIdx, stepIndex: targetStep });
    }
  };

  // Collect notes that should be rendered on the highway
  // Handles continuous looping wrap-around so notes approaching the loop boundary are visible
  const visibleNotes = useMemo(() => {
    const list: {
      key: string;
      stringIndex: number;
      stepIndex: number;
      fret: number;
      articulation?: string;
      noteName: string;
      tupletBadge?: string;
      chordName?: string;
      x: number;
      y: number;
      isHitting: boolean;
      isSelected: boolean;
    }[] = [];

    tracks.forEach((track, sIdx) => {
      const y = stringYPositions[sIdx];

      track.steps.forEach((cell, stepIdx) => {
        if (cell.fret === null) return;

        const noteInfo = calculateFretNote(track.basePitch, cell.fret);
        const loopWidthPx = totalSteps * stepWidthPx;

        // Primary position (taking into account tuplet micro-timing offset)
        const timeOffsetRatio = cell.timeOffsetRatio || 0;
        let x = hitX + (stepIdx + timeOffsetRatio - effectiveStep) * stepWidthPx;

        // When looping during playback, wrap position to stay on screen
        if (isPlaying) {
          while (x < hitX - 80) {
            x += loopWidthPx;
          }
          while (x > hitX + loopWidthPx - 80) {
            x -= loopWidthPx;
          }
        }

        // Only render if within visible viewport bounds with small buffer
        if (x >= -40 && x <= containerWidth + 60) {
          const distToHit = Math.abs(x - hitX);
          const isHitting =
            distToHit < 14 ||
            (activeHitNotes &&
              activeHitNotes.some(
                (n) => n.stringIndex === sIdx && n.fret === cell.fret
              ));
          const isSelected =
            selectedCell?.stringIndex === sIdx &&
            selectedCell?.stepIndex === stepIdx;

          list.push({
            key: `runway-note-${sIdx}-${stepIdx}-${Math.round(x)}`,
            stringIndex: sIdx,
            stepIndex: stepIdx,
            fret: cell.fret,
            articulation: cell.articulation,
            noteName: noteInfo.noteName,
            tupletBadge: cell.tupletBadge,
            chordName: cell.chordName,
            x,
            y,
            isHitting,
            isSelected,
          });
        }
      });
    });

    return list;
  }, [
    tracks,
    stringYPositions,
    effectiveStep,
    hitX,
    stepWidthPx,
    totalSteps,
    isPlaying,
    containerWidth,
    selectedCell,
  ]);

  // Collect beat tick grid lines moving with the highway
  const beatGridLines = useMemo(() => {
    const lines: {
      key: string;
      stepIndex: number;
      x: number;
      isMeasure: boolean;
      isDownbeat: boolean;
      beatNumber: number;
      measureNumber: number;
    }[] = [];

    const loopWidthPx = totalSteps * stepWidthPx;

    for (let s = 0; s < totalSteps; s++) {
      let x = hitX + (s - effectiveStep) * stepWidthPx;

      if (isPlaying) {
        while (x < hitX - 80) {
          x += loopWidthPx;
        }
        while (x > hitX + loopWidthPx - 80) {
          x -= loopWidthPx;
        }
      }

      if (x >= 0 && x <= containerWidth + 30) {
        const isMeasure = s % 16 === 0;
        const isDownbeat = s % 4 === 0;
        const beatNumber = Math.floor((s % 16) / 4) + 1;
        const measureNumber = Math.floor(s / 16) + 1;

        if (isDownbeat || isMeasure) {
          lines.push({
            key: `grid-line-${s}-${Math.round(x)}`,
            stepIndex: s,
            x,
            isMeasure,
            isDownbeat,
            beatNumber,
            measureNumber,
          });
        }
      }
    }

    return lines;
  }, [totalSteps, stepWidthPx, hitX, effectiveStep, isPlaying, containerWidth]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={`relative w-full h-[240px] bg-[#070B14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-default'
      }`}
      style={{
        background:
          'radial-gradient(circle at 18% 50%, rgba(34, 211, 238, 0.08) 0%, transparent 60%), #070B14',
      }}
    >
      {/* 1. Background Grid: Measure Bars & Downbeat Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {beatGridLines.map((line) => (
          <div
            key={line.key}
            style={{ left: `${line.x}px` }}
            className={`absolute top-0 bottom-0 pointer-events-none transition-opacity ${
              line.isMeasure
                ? 'w-[2px] bg-slate-400/50 border-r border-slate-300/40 z-0'
                : 'w-[1px] bg-slate-700/40 z-0'
            }`}
          >
            {/* Top Measure / Beat Label */}
            {line.isMeasure && (
              <span className="absolute top-2 left-1.5 text-[9px] font-mono font-bold text-amber-400/90 uppercase tracking-widest bg-black/60 px-1 rounded border border-amber-500/30">
                C{line.measureNumber}
              </span>
            )}
            {line.isDownbeat && !line.isMeasure && (
              <span className="absolute top-2 left-1 text-[8.5px] font-mono font-bold text-slate-500/80">
                {line.beatNumber}
              </span>
            )}
          </div>
        ))}

        {/* Step Recording cursor line on Runway when paused */}
        {!isPlaying && selectedCell && (() => {
          const stepX = hitX + (selectedCell.stepIndex - effectiveStep) * stepWidthPx;
          if (stepX < 0 || stepX > containerWidth) return null;
          return (
            <div
              style={{ left: `${stepX}px` }}
              className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 border-r border-cyan-300 shadow-[0_0_12px_#22d3ee] pointer-events-none z-15 animate-pulse"
            >
              <span className="absolute bottom-2 left-1.5 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-500/40 whitespace-nowrap shadow">
                ⏺ Paso {selectedCell.stepIndex + 1}
              </span>
            </div>
          );
        })()}
      </div>

      {/* 2. Horizontal String Highway Lanes */}
      <div ref={highwayCanvasRef} className="absolute inset-0">
        {tracks.map((track, sIdx) => {
          const y = stringYPositions[sIdx];
          const isHitActive =
            activeHits.some((hit) => hit.stringIndex === sIdx) ||
            (activeHitNotes && activeHitNotes.some((hit) => hit.stringIndex === sIdx));

          return (
            <div
              key={`runway-lane-${sIdx}`}
              style={{ top: `${y - 14}px`, height: '28px' }}
              className="absolute left-0 right-0 flex items-center cursor-pointer group/lane"
              onClick={(e) => handleLaneClick(sIdx, e)}
            >
              {/* String Horizontal Line */}
              <div
                className={`absolute left-0 right-0 h-[2px] pointer-events-none transition-colors duration-100 ${
                  isHitActive
                    ? 'bg-cyan-300 shadow-[0_0_12px_#22d3ee]'
                    : 'bg-slate-700/80 group-hover/lane:bg-slate-600'
                }`}
              />

              {/* Lane Click Hover Indicator */}
              {!isPlaying && (
                <div className="w-full h-full opacity-0 group-hover/lane:opacity-100 bg-amber-500/5 transition-opacity" />
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Left String Name Badges (Aligned directly with string lines) */}
      <div
        style={{ width: `${hitX - 10}px` }}
        className="absolute left-0 top-0 bottom-0 pointer-events-none z-20 flex flex-col justify-between pl-3 pr-2"
      >
        {tracks.map((track, sIdx) => {
          const y = stringYPositions[sIdx];
          const isHitActive =
            activeHits.some((hit) => hit.stringIndex === sIdx) ||
            (activeHitNotes && activeHitNotes.some((hit) => hit.stringIndex === sIdx));

          return (
            <div
              key={`string-head-badge-${sIdx}`}
              style={{ top: `${y - 12}px` }}
              className="absolute left-3 flex items-center gap-2 pointer-events-auto"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs transition-all duration-75 shadow-md ${
                  isHitActive
                    ? 'bg-cyan-400 text-slate-950 border border-white shadow-[0_0_18px_#22d3ee] scale-110'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-700/80'
                }`}
                title={`Cuerda ${track.stringName} (${track.basePitch})`}
              >
                {track.stringName}
              </div>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                {track.basePitch}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Target Hit Line (Fixed at left: 18%) */}
      <div
        style={{ left: `${hitX}px` }}
        className="absolute top-0 bottom-0 w-[2.5px] bg-[#22d3ee] shadow-[0_0_14px_#22d3ee] pointer-events-none z-20"
      >
        {/* Top Target Arrow Marker */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-400 absolute -top-1 -translate-x-1/2 left-1/2 drop-shadow-[0_0_8px_#22d3ee]" />

        {/* Bottom Target Arrow Marker */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-cyan-400 absolute -bottom-1 -translate-x-1/2 left-1/2 drop-shadow-[0_0_8px_#22d3ee]" />

        {/* Top Neon Badge */}
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full font-mono text-[9px] font-black text-cyan-400 tracking-widest bg-cyan-950/90 px-1.5 py-0.5 rounded border border-cyan-500/40 shadow-sm flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-cyan-400" />
          HIT
        </span>
      </div>

      {/* 5. Hit Bursts (Visual flash ripples when note strikes target line) */}
      <div className="absolute inset-0 pointer-events-none z-25">
        {tracks.map((_, sIdx) => {
          const y = stringYPositions[sIdx];
          const isHitActive =
            activeHits.some((hit) => hit.stringIndex === sIdx) ||
            (activeHitNotes && activeHitNotes.some((hit) => hit.stringIndex === sIdx));

          if (!isHitActive) return null;

          return (
            <React.Fragment key={`hit-burst-${sIdx}`}>
              {/* Outer Shockwave Ripple */}
              <div
                style={{ left: `${hitX}px`, top: `${y}px` }}
                className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-cyan-400/25 border-2 border-cyan-300 animate-ping"
              />
              {/* Core Flash */}
              <div
                style={{ left: `${hitX}px`, top: `${y}px` }}
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-white shadow-[0_0_20px_#22d3ee] animate-pulse"
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* 6. Dynamic Moving Notes (Traveling to the Target Hit Line) */}
      <div className="absolute inset-0 pointer-events-auto z-15">
        {visibleNotes.map((note) => {
          return (
            <div
              key={note.key}
              style={{
                left: `${note.x}px`,
                top: `${note.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCell({
                  stringIndex: note.stringIndex,
                  stepIndex: note.stepIndex,
                });
              }}
              className={`absolute cursor-pointer flex flex-col items-center justify-center transition-transform ${
                note.isHitting
                  ? 'scale-125 z-30'
                  : note.isSelected
                  ? 'scale-115 z-25'
                  : 'hover:scale-110 z-20'
              }`}
            >
              {/* Tuplet Badge above note if present */}
              {note.tupletBadge && (
                <span className="absolute -top-3.5 px-1 py-0.2 rounded-sm bg-fuchsia-950/90 border border-fuchsia-500/60 text-fuchsia-300 font-mono font-black text-[7.5px] leading-none tracking-tighter shadow-sm pointer-events-none">
                  {note.tupletBadge}
                </span>
              )}

              {/* Note Fret Number Circular Pill */}
              <div
                className={`min-w-[26px] h-[26px] px-1.5 rounded-full flex items-center justify-center font-mono font-black text-xs sm:text-sm border transition-all ${
                  note.isHitting
                    ? 'bg-amber-400 text-black border-white shadow-[0_0_18px_rgba(251,191,36,1)]'
                    : note.isSelected
                    ? 'bg-[#0A0E17] text-cyan-300 border-cyan-400 ring-2 ring-cyan-400 shadow-[0_0_12px_#22d3ee]'
                    : 'bg-[#0A0E17] text-amber-300 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                }`}
              >
                {note.fret}
              </div>

              {/* Articulation Badge underneath note if defined */}
              {note.articulation && note.articulation !== 'normal' && (
                <span className="text-[8.5px] font-mono font-bold text-amber-400/90 leading-none mt-0.5 uppercase tracking-tighter bg-black/80 px-1 rounded">
                  {note.articulation === 'slap'
                    ? 'S'
                    : note.articulation === 'pop'
                    ? 'P'
                    : note.articulation === 'ghost'
                    ? 'x'
                    : note.articulation === 'palmmute'
                    ? 'P.M.'
                    : note.articulation === 'downstroke'
                    ? '⊓'
                    : '∨'}
                </span>
              )}

              {/* Harmonic Chord Name badge underneath note if present */}
              {note.chordName && (
                <span className="absolute -bottom-3.5 px-1 py-0.2 rounded-sm bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-[7.5px] leading-none whitespace-nowrap shadow-sm pointer-events-none">
                  {note.chordName}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 7. Bottom Overlay Hint (Scrubbing / Play status) */}
      <div className="absolute bottom-1 right-3 text-[10px] font-mono text-slate-500 pointer-events-none select-none flex items-center gap-2">
        {isPlaying ? (
          <span className="text-cyan-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            Pista en Movimiento • 60 FPS
          </span>
        ) : (
          <span className="text-slate-400">
            Arrastra o rueda para explorar • Clic en cuerda para añadir notas
          </span>
        )}
      </div>
    </div>
  );
}
