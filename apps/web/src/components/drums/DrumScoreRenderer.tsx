'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { DrumMeasure, DrumPieceId, DRUM_PIECES } from '@/types/drum';
import { PlayheadPosition } from '@/hooks/useDrumAudio';

interface DrumScoreRendererProps {
  measures: DrumMeasure[];
  selectedMeasureIndex: number;
  selectedBeatIndex: number;
  selectedStepIndex: number;
  playhead: PlayheadPosition;
  isPlaying: boolean;
  onSelectStep: (mIdx: number, bIdx: number, sIdx: number) => void;
  onTogglePiece?: (pieceId: DrumPieceId) => void;
  onRemoveMeasure?: (index: number) => void;
}

interface NoteXPosition {
  measureIndex: number;
  beatIndex: number;
  stepIndex: number;
  x: number;
  y: number;
  width: number;
}

export default function DrumScoreRenderer({
  measures,
  selectedMeasureIndex,
  selectedBeatIndex,
  selectedStepIndex,
  playhead,
  isPlaying,
  onSelectStep,
  onRemoveMeasure,
}: DrumScoreRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(880);
  const [notePositions, setNotePositions] = useState<NoteXPosition[]>([]);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Responsive container width tracking
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current?.parentElement) {
        setContainerWidth(Math.max(820, containerRef.current.parentElement.clientWidth));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Calculate layout dimensions with responsive stave line-wrapping
  const minMeasureWidth = 400;
  const measuresPerRow = Math.max(
    1,
    Math.min(measures.length, Math.floor((containerWidth - 40) / minMeasureWidth))
  );
  const currentMeasureWidth = Math.floor((containerWidth - 40) / measuresPerRow);
  const rowHeight = 170;
  const numRows = Math.ceil(measures.length / measuresPerRow);
  const totalWidth = containerWidth;
  const totalHeight = Math.max(200, numRows * rowHeight + 35);

  // Render VexFlow score onto container
  useEffect(() => {
    let isCancelled = false;

    async function renderVexScore() {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';
      setRenderError(null);

      try {
        const vf = await import('vexflow');
        if (isCancelled || !containerRef.current) return;

        const {
          Renderer,
          Stave,
          StaveNote,
          Voice,
          Formatter,
          Beam,
          Tuplet,
          Articulation,
          Annotation,
          Parenthesis,
          Modifier,
          GraceNote,
          GraceNoteGroup,
        } = vf as any;
        const Glyphs = (vf as any).Glyphs || {};

        // Initialize SVG Renderer
        const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
        renderer.resize(totalWidth, totalHeight);
        const context = renderer.getContext();

        // Dark mode color styles for musical engraving
        context.setFillStyle('#E2E8F0'); // Slate 200
        context.setStrokeStyle('#94A3B8'); // Slate 400

        const recordedPositions: NoteXPosition[] = [];

        measures.forEach((measure, mIdx) => {
          const [beatsCount, beatValue] = measure.timeSignature;
          const rowIndex = Math.floor(mIdx / measuresPerRow);
          const colIndex = mIdx % measuresPerRow;
          const measureX = 20 + colIndex * currentMeasureWidth;
          const measureY = 25 + rowIndex * rowHeight;

          // Create percussion stave
          const stave = new Stave(measureX, measureY, currentMeasureWidth);
          stave.setStyle({ fillStyle: '#94A3B8', strokeStyle: '#64748B' });

          // Clef at the start of each line
          if (colIndex === 0) {
            stave.addClef('percussion');
          }

          // Meter signature at the start of the score
          if (mIdx === 0) {
            stave.addTimeSignature(`${beatsCount}/${beatValue}`);
          }

          // Measure section badge (e.g., C1, C2...)
          try {
            stave.setSection(`C${mIdx + 1}`, 0);
          } catch (_) {}

          stave.setContext(context).draw();

          const measureNotes: any[] = [];
          const measureBeams: any[] = [];
          const measureTuplets: any[] = [];

          const stepMapping: { bIdx: number; sIdx: number; note: any }[] = [];

          measure.beats.forEach((beat, bIdx) => {
            const beatNotes: any[] = [];

            beat.steps.forEach((step, sIdx) => {
              const sub = beat.subdivision || 1;
              let vexDuration = '16';
              if (sub === 0.25 || beat.noteDurationType === 'w') vexDuration = 'w';
              else if (sub === 0.5 || beat.noteDurationType === 'h') vexDuration = 'h';
              else if (sub === 1 || beat.noteDurationType === 'q') vexDuration = '4';
              else if (sub === 2 || sub === 3) vexDuration = '8';
              else if (sub === 4 || sub === 5 || sub === 6 || sub === 7) vexDuration = '16';
              else if (sub === 8 || sub === 9) vexDuration = '32';

              const hasHits = step.hits && step.hits.length > 0;
              const isRest = step.isRest || !hasHits;

              let staveNote: any;

              if (isRest) {
                // Render as rest centered on standard middle line (b/4)
                staveNote = new StaveNote({
                  keys: ['b/4'],
                  duration: `${vexDuration}r`,
                  clef: 'percussion',
                });
                staveNote.setStyle({ fillStyle: '#64748B', strokeStyle: '#64748B' });
              } else {
                // Sort keys from lowest to highest pitch to prevent stem collisions
                const pitchPriority: Record<string, number> = {
                  'f/4': 1, // kick
                  'a/4': 2, // floor tom
                  'b/4': 3, // mid tom
                  'c/5': 4, // snare
                  'd/5': 5, // high tom
                  'f/5': 6, // ride
                  'g/5': 7, // hi-hat
                  'a/5': 8, // crash
                };

                const sortedHits = [...step.hits].sort((a, b) => {
                  const keyA = DRUM_PIECES[a.pieceId]?.keyPos || 'c/5';
                  const keyB = DRUM_PIECES[b.pieceId]?.keyPos || 'c/5';
                  return (pitchPriority[keyA] || 0) - (pitchPriority[keyB] || 0);
                });

                const keys = sortedHits.map((h) => DRUM_PIECES[h.pieceId]?.keyPos || 'c/5');

                staveNote = new StaveNote({
                  keys,
                  duration: vexDuration,
                  clef: 'percussion',
                });

                // Apply custom noteheads (e.g. cross 'x' for hi-hat/ride/crash)
                if (staveNote.noteHeads) {
                  sortedHits.forEach((hit, keyIndex) => {
                    const pieceInfo = DRUM_PIECES[hit.pieceId];
                    const noteHead = staveNote.noteHeads[keyIndex];

                    if (noteHead && noteHead.glyphProps) {
                      if (pieceInfo?.notehead === 'x') {
                        noteHead.glyphProps.codeHead = Glyphs.noteheadXBlack || '';
                      } else if (pieceInfo?.notehead === 'circle-x') {
                        noteHead.glyphProps.codeHead = Glyphs.noteheadCircleX || '';
                      }
                    }
                  });
                }

                // Accent articulation (a>)
                const hasAccent = step.hits.some((h) => h.accent);
                if (hasAccent) {
                  try {
                    staveNote.addModifier(new Articulation('a>'), 0);
                  } catch (_) {}
                }

                // Ghost note: Enclose notehead directly in parentheses without displacing stems/beams
                sortedHits.forEach((hit, keyIndex) => {
                  if (hit.ghost) {
                    let attached = false;
                    if (Parenthesis && Modifier?.Position) {
                      try {
                        const leftParen = new Parenthesis(Modifier.Position.LEFT);
                        const rightParen = new Parenthesis(Modifier.Position.RIGHT);
                        staveNote.addModifier(leftParen, keyIndex);
                        staveNote.addModifier(rightParen, keyIndex);
                        attached = true;
                      } catch (_) {}
                    }
                    if (!attached) {
                      try {
                        const ann = new Annotation('( )');
                        ann.setFont('sans-serif', 11, 'bold');
                        ann.setVerticalJustification(Annotation.VerticalJustify.CENTER);
                        staveNote.addModifier(ann, keyIndex);
                      } catch (_) {}
                    }
                  }
                });

                // Sticking annotation (R / L / K)
                const sticking = step.sticking || step.hits.find((h) => h.sticking)?.sticking;
                if (sticking && Annotation) {
                  try {
                    const stickingAnn = new Annotation(sticking);
                    stickingAnn.setFont('monospace', 10, 'bold');
                    stickingAnn.setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
                    staveNote.addModifier(stickingAnn, 0);
                  } catch (_) {}
                }

                // Flam grace note (or fallback annotation)
                const isFlam = step.flam || step.hits.some((h) => h.flam);
                if (isFlam) {
                  let flamAdded = false;
                  if (GraceNote && GraceNoteGroup) {
                    try {
                      const graceKey = DRUM_PIECES[sortedHits[0]?.pieceId]?.keyPos || 'c/5';
                      const graceNote = new GraceNote({
                        keys: [graceKey],
                        duration: '16',
                        slash: true,
                        clef: 'percussion',
                      });
                      graceNote.setStyle({ fillStyle: '#94A3B8', strokeStyle: '#94A3B8' });
                      const graceGroup = new GraceNoteGroup([graceNote], true);
                      staveNote.addModifier(graceGroup, 0);
                      flamAdded = true;
                    } catch (_) {}
                  }
                  if (!flamAdded && Annotation) {
                    try {
                      const flamAnn = new Annotation('flam');
                      flamAnn.setFont('sans-serif', 9, 'bold');
                      flamAnn.setVerticalJustification(Annotation.VerticalJustify.TOP);
                      staveNote.addModifier(flamAnn, 0);
                    } catch (_) {}
                  }
                }

                // Note styling (cyan/violet neon vibe)
                staveNote.setStyle({ fillStyle: '#38BDF8', strokeStyle: '#38BDF8' });
              }

              beatNotes.push(staveNote);
              measureNotes.push(staveNote);
              stepMapping.push({ bIdx, sIdx, note: staveNote });
            });

            // Handle Tuplets (3:2, 5:4, 6:4, 7:4, 9:8)
            if (beat.isTuplet && beatNotes.length > 1) {
              try {
                const ratioMap: Record<number, [number, number]> = {
                  3: [3, 2],
                  5: [5, 4],
                  6: [6, 4],
                  7: [7, 4],
                  9: [9, 8],
                };
                const ratio =
                  beat.tupletRatio ||
                  ratioMap[beat.subdivision] || [
                    beat.subdivision,
                    beat.subdivision <= 3 ? 2 : beat.subdivision === 9 ? 8 : 4,
                  ];
                const tuplet = new Tuplet(beatNotes, {
                  numNotes: ratio[0],
                  notesOccupied: ratio[1],
                });
                tuplet.setBracketed(true);
                measureTuplets.push(tuplet);
              } catch (e) {
                console.warn('Tuplet formatting skipped:', e);
              }
            } else if (beatNotes.length >= 2 && beat.subdivision >= 2) {
              // Beaming for regular subdivisions (8ths, 16ths, 32nds)
              try {
                const beams = Beam.generateBeams(beatNotes);
                beams.forEach((b: any) => measureBeams.push(b));
              } catch (_) {}
            }
          });

          // Create Voice and Format
          try {
            const voice = new Voice({
              numBeats: beatsCount,
              beatValue: beatValue,
            }).setStrict(false);

            voice.addTickables(measureNotes);

            const formatPadding = colIndex === 0 && mIdx === 0 ? 85 : colIndex === 0 ? 65 : 40;
            new Formatter()
              .joinVoices([voice])
              .format([voice], Math.max(100, currentMeasureWidth - formatPadding));

            voice.draw(context, stave);

            // Draw Beams
            measureBeams.forEach((beam) => {
              try {
                beam.setContext(context).draw();
              } catch (_) {}
            });

            // Draw Tuplets
            measureTuplets.forEach((tuplet) => {
              try {
                tuplet.setContext(context).draw();
              } catch (_) {}
            });

            // Record exact X and Y coordinates for playhead and click interaction
            stepMapping.forEach(({ bIdx, sIdx, note }) => {
              try {
                const x = note.getAbsoluteX();
                recordedPositions.push({
                  measureIndex: mIdx,
                  beatIndex: bIdx,
                  stepIndex: sIdx,
                  x: typeof x === 'number' ? x : measureX + 50,
                  y: measureY,
                  width: currentMeasureWidth / (beatsCount * 2),
                });
              } catch (_) {}
            });
          } catch (formatErr) {
            console.warn('VexFlow measure voice formatting warning:', formatErr);
          }
        });

        if (!isCancelled) {
          setNotePositions(recordedPositions);
        }
      } catch (err: any) {
        console.error('VexFlow score rendering error:', err);
        if (!isCancelled) {
          setRenderError(err?.message || 'Error rendering score');
        }
      }
    }

    renderVexScore();

    return () => {
      isCancelled = true;
    };
  }, [measures, totalWidth, totalHeight, measuresPerRow, currentMeasureWidth, rowHeight]);

  // Find position of active playhead step
  const activePlayheadPos = useMemo(() => {
    if (notePositions.length === 0) return null;

    const matchedPos = notePositions.find(
      (p) =>
        p.measureIndex === playhead.measureIndex &&
        p.beatIndex === playhead.beatIndex &&
        p.stepIndex === playhead.stepIndex
    );

    if (matchedPos) return matchedPos;

    // Fallback: look for positions in the current measure
    const measurePositions = notePositions.filter((p) => p.measureIndex === playhead.measureIndex);
    if (measurePositions.length > 0) {
      const stepIdx = Math.min(
        measurePositions.length - 1,
        Math.floor((playhead.beatIndex * 4 + playhead.stepIndex) % measurePositions.length)
      );
      return measurePositions[stepIdx] || measurePositions[0];
    }

    return null;
  }, [notePositions, playhead]);

  // Find position of the currently selected step (cursor)
  const selectedStepPos = useMemo(() => {
    return notePositions.find(
      (p) =>
        p.measureIndex === selectedMeasureIndex &&
        p.beatIndex === selectedBeatIndex &&
        p.stepIndex === selectedStepIndex
    );
  }, [notePositions, selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]);

  const selectedBeat = measures[selectedMeasureIndex]?.beats[selectedBeatIndex];
  const selectedStep = selectedBeat?.steps[selectedStepIndex];

  return (
    <div className="relative w-full rounded-2xl bg-surface-card border border-white/10 p-5 shadow-glass overflow-hidden select-none">
      {/* Score Header Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5 text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 font-mono text-[11px] text-synth-cyan">
            <span className="w-2 h-2 rounded-full bg-synth-cyan animate-pulse" />
            PERCUSSION CLEF (5-LINE STANDARD)
          </span>
          <span className="text-gray-300 font-mono">
            {measures[0]?.timeSignature[0]}/{measures[0]?.timeSignature[1]} Meter
          </span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400 font-mono">
            {measures.length} {measures.length === 1 ? 'Measure' : 'Measures'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-gray-300">Active Hit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold text-xs">&gt;</span>
            <span className="text-gray-300">Accent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400 font-bold">(•)</span>
            <span className="text-gray-300">Ghost Note</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-rose-400 font-mono text-xs">x</span>
            <span className="text-gray-300">Cymbals/Hi-Hat</span>
          </div>
        </div>
      </div>

      {/* Main Score Scroll Container */}
      <div className="relative overflow-x-auto overflow-y-hidden py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div
          className="relative mx-auto"
          style={{ width: `${totalWidth}px`, height: `${totalHeight}px`, minHeight: '190px' }}
        >
          {/* VexFlow Render Canvas Container */}
          <div ref={containerRef} className="w-full h-full pointer-events-none" />

          {/* Measure Section Badges with Contextual Delete Action */}
          {measures.map((_, mIdx) => {
            const rowIndex = Math.floor(mIdx / measuresPerRow);
            const colIndex = mIdx % measuresPerRow;
            const measureX = 20 + colIndex * currentMeasureWidth;
            const measureY = 25 + rowIndex * rowHeight;
            const isMeasureSelected = selectedMeasureIndex === mIdx;

            return (
              <div
                key={`measure-badge-${mIdx}`}
                className="group/stave-hdr absolute z-25 flex items-center gap-1 transition-all"
                style={{
                  left: `${measureX + (colIndex === 0 ? 32 : 12)}px`,
                  top: `${measureY - 14}px`,
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelectStep(mIdx, 0, 0)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 border select-none ${
                    isMeasureSelected
                      ? 'bg-synth-cyan/20 border-synth-cyan/60 text-synth-cyan shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                      : 'bg-surface-dark/90 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                  title={`Compás ${mIdx + 1} (Clic para enfocar)`}
                >
                  <span>Compás {mIdx + 1}</span>
                </button>

                {measures.length > 1 && onRemoveMeasure && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveMeasure(mIdx);
                    }}
                    className="opacity-0 group-hover/stave-hdr:opacity-100 p-0.5 rounded bg-surface-dark/95 hover:bg-rose-500/25 text-gray-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer"
                    title={`Eliminar Compás C${mIdx + 1}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Interactive Step Click Zones & Selection Highlights */}
          {notePositions.map((pos) => {
            const isSelected =
              pos.measureIndex === selectedMeasureIndex &&
              pos.beatIndex === selectedBeatIndex &&
              pos.stepIndex === selectedStepIndex;

            const isPlayheadHere =
              isPlaying &&
              pos.measureIndex === playhead.measureIndex &&
              pos.beatIndex === playhead.beatIndex &&
              pos.stepIndex === playhead.stepIndex;

            const stepData =
              measures[pos.measureIndex]?.beats[pos.beatIndex]?.steps[pos.stepIndex];
            const hasHits = stepData && stepData.hits.length > 0;

            return (
              <div
                key={`step-hitbox-${pos.measureIndex}-${pos.beatIndex}-${pos.stepIndex}`}
                onClick={() => onSelectStep(pos.measureIndex, pos.beatIndex, pos.stepIndex)}
                className={`group absolute -translate-x-1/2 cursor-pointer transition-all flex flex-col items-center justify-between ${
                  isSelected
                    ? 'z-20'
                    : isPlayheadHere
                    ? 'z-10'
                    : 'z-0 hover:bg-white/[0.04]'
                }`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y + 4}px`,
                  height: '135px',
                  width: `${Math.max(26, pos.width * 0.9)}px`,
                }}
              >
                {/* Top Beat/Step Indicator Pill */}
                <div
                  className={`text-[9px] font-mono px-1 py-0.2 rounded transition-all ${
                    isSelected
                      ? 'bg-synth-cyan text-black font-bold shadow-[0_0_10px_#22d3ee]'
                      : isPlayheadHere
                      ? 'bg-synth-violet text-white font-bold'
                      : 'text-gray-500 opacity-0 group-hover:opacity-100 bg-white/10'
                  }`}
                >
                  {pos.stepIndex === 0 ? `B${pos.beatIndex + 1}` : `.${pos.stepIndex + 1}`}
                </div>

                {/* Selected Step Glowing Cursor Box */}
                {isSelected && (
                  <div className="absolute inset-y-4 inset-x-0 border-2 border-synth-cyan/80 bg-synth-cyan/10 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.35)] pointer-events-none animate-pulse-subtle" />
                )}

                {/* Hits Summary Tag on Hover */}
                {hasHits && (
                  <div className="opacity-0 group-hover:opacity-100 absolute -bottom-2 bg-obsidian-deep/95 border border-white/20 rounded px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 shadow-md whitespace-nowrap pointer-events-none transition-opacity z-30">
                    {stepData.hits.map((h) => DRUM_PIECES[h.pieceId]?.shortName || h.pieceId).join('+')}
                  </div>
                )}
              </div>
            );
          })}

          {/* Real-time Laser Playhead */}
          {isPlaying && activePlayheadPos && (
            <div
              className="absolute -translate-x-1/2 pointer-events-none z-30 transition-all duration-75 ease-linear"
              style={{
                left: `${activePlayheadPos.x}px`,
                top: `${activePlayheadPos.y + 8}px`,
                height: '115px',
              }}
            >
              {/* Laser Core Beam */}
              <div className="w-[2px] h-full bg-synth-cyan shadow-[0_0_12px_#22d3ee,0_0_24px_#38bdf8]" />
              {/* Laser Top Diamond Indicator */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-synth-cyan rotate-45 shadow-[0_0_10px_#22d3ee]" />
            </div>
          )}
        </div>
      </div>

      {/* Selected Step Mini Inspector Footer */}
      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="text-gray-300 font-semibold">Cursor activo:</span>
          <span className="font-mono text-synth-cyan">
            Compás {selectedMeasureIndex + 1} • Tiempo {selectedBeatIndex + 1} • Subdivisión{' '}
            {selectedStepIndex + 1}/{selectedBeat?.subdivision || 4}
          </span>
          {selectedBeat?.isTuplet && (
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
              Tuplet {selectedBeat.tupletRatio ? `${selectedBeat.tupletRatio[0]}:${selectedBeat.tupletRatio[1]}` : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {selectedStep?.hits && selectedStep.hits.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-400">Notas:</span>
              {selectedStep.hits.map((h: { pieceId: DrumPieceId; accent?: boolean; ghost?: boolean }, i: number) => {
                const piece = DRUM_PIECES[h.pieceId];
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${piece?.badgeBg} ${piece?.badgeBorder} text-white flex items-center gap-1`}
                  >
                    <span>{piece?.shortName || h.pieceId}</span>
                    {h.accent && <span className="text-amber-400 font-bold">&gt;</span>}
                    {h.ghost && <span className="text-purple-300">(g)</span>}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-gray-400 italic">Silencio (pulsa K, S, H, C, R, T o F para añadir)</span>
          )}
        </div>
      </div>
    </div>
  );
}
