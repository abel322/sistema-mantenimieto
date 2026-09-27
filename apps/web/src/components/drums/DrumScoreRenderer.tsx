'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { X, Play, Pause, Square, Bell, Repeat } from 'lucide-react';
import { DrumMeasure, DrumPieceId, DRUM_PIECES } from '@/types/drum';
import { PlayheadPosition, BeatFlash } from '@/hooks/useDrumAudio';

interface DrumScoreRendererProps {
  measures: DrumMeasure[];
  selectedMeasureIndex: number;
  selectedBeatIndex: number;
  selectedStepIndex: number;
  playhead: PlayheadPosition;
  isPlaying: boolean;
  highlightSyncopations?: boolean;
  isSyncopationDrill?: boolean;
  currentBeatFlash?: BeatFlash | null;
  layoutMode?: 'paginated' | 'runway';
  onToggleLayoutMode?: (mode: 'paginated' | 'runway') => void;
  zoomLevel?: number;
  onChangeZoomLevel?: (zoom: number) => void;
  onToggleHighlightSyncopations?: () => void;
  onSelectStep: (mIdx: number, bIdx: number, sIdx: number) => void;
  onTogglePiece?: (pieceId: DrumPieceId) => void;
  onRemoveMeasure?: (index: number) => void;
  getTransportSeconds?: () => number;
  seekToSeconds?: (seconds: number) => void;
  seekToStep?: (measureIndex: number, beatIndex?: number, stepIndex?: number) => void;
  bpm?: number;
  onSetBpm?: (bpm: number) => void;
  onTogglePlay?: () => void;
  onStop?: () => void;
  isMetronomeActive?: boolean;
  onToggleMetronome?: () => void;
  isLooping?: boolean;
  onToggleLoop?: () => void;
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
  highlightSyncopations = false,
  isSyncopationDrill = false,
  currentBeatFlash = null,
  layoutMode = 'paginated',
  onToggleLayoutMode,
  zoomLevel = 1.0,
  onChangeZoomLevel,
  onToggleHighlightSyncopations,
  onSelectStep,
  onRemoveMeasure,
  getTransportSeconds,
  seekToSeconds,
  seekToStep,
  bpm = 110,
  onSetBpm,
  onTogglePlay,
  onStop,
  isMetronomeActive = false,
  onToggleMetronome,
  isLooping = true,
  onToggleLoop,
}: DrumScoreRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const laserRef = useRef<HTMLDivElement>(null);
  const timelineRulerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const isDraggingTimelineRef = useRef(false);
  const prevIsPlayingRef = useRef(isPlaying);
  const [containerWidth, setContainerWidth] = useState(880);
  const [notePositions, setNotePositions] = useState<NoteXPosition[]>([]);
  const [renderError, setRenderError] = useState<string | null>(null);

  const isRunway = layoutMode === 'runway';

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

  // Calculate layout dimensions with responsive stave line-wrapping or continuous horizontal runway
  const minMeasureWidth = 400;
  const measuresPerRow = isRunway
    ? measures.length
    : Math.max(1, Math.min(measures.length, Math.floor((containerWidth - 40) / minMeasureWidth)));

  const baseMeasureWidth = Math.round(410 * zoomLevel);
  const currentMeasureWidth = isRunway
    ? baseMeasureWidth
    : Math.floor((containerWidth - 40) / measuresPerRow);

  const rowHeight = Math.round(175 * zoomLevel);
  const numRows = isRunway ? 1 : Math.ceil(measures.length / measuresPerRow);

  const totalWidth = isRunway
    ? Math.max(containerWidth, measures.length * currentMeasureWidth + 80)
    : containerWidth;

  const totalHeight = isRunway
    ? Math.round(220 * zoomLevel)
    : Math.max(200, numRows * rowHeight + 35);

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
          StaveTie,
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
        const allRenderedNotes: any[] = [];

        measures.forEach((measure, mIdx) => {
          const [beatsCount, beatValue] = measure.timeSignature;
          const rowIndex = isRunway ? 0 : Math.floor(mIdx / measuresPerRow);
          const colIndex = isRunway ? mIdx : mIdx % measuresPerRow;
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
                  'd/4': 0, // hihat foot
                  'f/4': 1, // kick
                  'a/4': 2, // floor tom
                  'b/4': 3, // mid tom
                  'c/5': 4, // snare
                  'd/5': 5, // high tom
                  'e/5': 5.5, // cowbell
                  'f/5': 6, // ride
                  'g/5': 7, // hi-hat
                  'a/5': 8, // crash
                  'b/5': 9, // china
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

                // Flam or Drag grace notes (or fallback annotation)
                const isFlam = step.flam || step.hits.some((h) => h.flam);
                const isDrag = step.drag || step.hits.some((h) => h.drag);
                if (isFlam || isDrag) {
                  let graceAdded = false;
                  if (GraceNote && GraceNoteGroup) {
                    try {
                      const graceKey = DRUM_PIECES[sortedHits[0]?.pieceId]?.keyPos || 'c/5';
                      const graceNotes = isDrag
                        ? [
                            new GraceNote({
                              keys: [graceKey],
                              duration: '32',
                              slash: false,
                              clef: 'percussion',
                            }),
                            new GraceNote({
                              keys: [graceKey],
                              duration: '32',
                              slash: false,
                              clef: 'percussion',
                            }),
                          ]
                        : [
                            new GraceNote({
                              keys: [graceKey],
                              duration: '16',
                              slash: true,
                              clef: 'percussion',
                            }),
                          ];
                      graceNotes.forEach((g: any) =>
                        g.setStyle({ fillStyle: '#94A3B8', strokeStyle: '#94A3B8' })
                      );
                      const graceGroup = new GraceNoteGroup(graceNotes, true);
                      staveNote.addModifier(graceGroup, 0);
                      graceAdded = true;
                    } catch (_) {}
                  }
                  if (!graceAdded && Annotation) {
                    try {
                      const graceAnn = new Annotation(isDrag ? 'drag' : 'flam');
                      graceAnn.setFont('sans-serif', 9, 'bold');
                      graceAnn.setVerticalJustification(Annotation.VerticalJustify.TOP);
                      staveNote.addModifier(graceAnn, 0);
                    } catch (_) {}
                  }
                }

                // Note styling (amber neon if syncopated and highlighted, else cyan)
                const isStepSyncopated =
                  step.isSyncopated ||
                  step.tiedToNext ||
                  step.tiedFromPrev ||
                  (step.hits && step.hits.some((h: any) => h.isSyncopated || h.tiedToNext));

                const shouldHighlightSync = highlightSyncopations || isSyncopationDrill;
                const noteColor = shouldHighlightSync && isStepSyncopated ? '#F59E0B' : '#38BDF8';
                staveNote.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
                if (staveNote.noteHeads) {
                  staveNote.noteHeads.forEach((nh: any) => {
                    nh.setStyle({ fillStyle: noteColor, strokeStyle: noteColor });
                  });
                }
              }

              beatNotes.push(staveNote);
              measureNotes.push(staveNote);
              stepMapping.push({ bIdx, sIdx, note: staveNote });
              allRenderedNotes.push({
                mIdx,
                bIdx,
                sIdx,
                note: staveNote,
                step,
                isRest,
              });
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

        // ---------------------------------------------------------
        // Rhythmic Prolongation Ties (StaveTie)
        // ---------------------------------------------------------
        for (let i = 0; i < allRenderedNotes.length; i++) {
          const currentEntry = allRenderedNotes[i];
          const isTied =
            currentEntry.step.tiedToNext ||
            (currentEntry.step.hits && currentEntry.step.hits.some((h: any) => h.tiedToNext));

          if (isTied) {
            const nextEntry = allRenderedNotes[i + 1];
            if (nextEntry && !nextEntry.isRest) {
              try {
                const tie = new StaveTie({
                  first_note: currentEntry.note,
                  last_note: nextEntry.note,
                  firstNote: currentEntry.note,
                  lastNote: nextEntry.note,
                  first_indices: [0],
                  last_indices: [0],
                  firstIndexes: [0],
                  lastIndexes: [0],
                });

                const shouldHighlightSync = highlightSyncopations || isSyncopationDrill;
                const tieColor = shouldHighlightSync ? '#F59E0B' : '#38BDF8';
                try {
                  tie.setStyle({ fillStyle: tieColor, strokeStyle: tieColor });
                } catch (_) {}

                tie.setContext(context).draw();
              } catch (tieErr) {
                console.warn('VexFlow StaveTie draw error:', tieErr);
              }
            }
          }
        }

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
  }, [measures, totalWidth, totalHeight, measuresPerRow, currentMeasureWidth, rowHeight, highlightSyncopations, isSyncopationDrill, isRunway, zoomLevel]);

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

  // Calculate exact continuous subpixel X position from Web Audio seconds
  const getTimeXPosition = useCallback(
    (t: number): { x: number; measureIndex: number; beatIndex: number } => {
      let accumulatedTime = 0;
      for (let m = 0; m < measures.length; m++) {
        const [beatsCount, beatValue] = measures[m].timeSignature;
        const beatDuration = (60 / bpm) * (4 / beatValue);
        const measureDuration = beatsCount * beatDuration;
        const measureStartX = 20 + m * currentMeasureWidth;

        if (t >= accumulatedTime && t < accumulatedTime + measureDuration) {
          const timeInMeasure = t - accumulatedTime;
          const fractionInMeasure = timeInMeasure / measureDuration;
          const beatIdx = Math.min(beatsCount - 1, Math.floor(timeInMeasure / beatDuration));
          return {
            x: measureStartX + fractionInMeasure * currentMeasureWidth,
            measureIndex: m,
            beatIndex: beatIdx,
          };
        }
        accumulatedTime += measureDuration;
      }

      if (measures.length > 0) {
        const lastIdx = measures.length - 1;
        return {
          x: 20 + lastIdx * currentMeasureWidth + currentMeasureWidth,
          measureIndex: lastIdx,
          beatIndex: (measures[lastIdx].timeSignature[0] || 4) - 1,
        };
      }
      return { x: 20, measureIndex: 0, beatIndex: 0 };
    },
    [measures, bpm, currentMeasureWidth]
  );

  // Continuous 60 FPS Runway Smooth Scroll & Laser Playhead animation loop
  useEffect(() => {
    if (!isRunway || !isPlaying || !scrollContainerRef.current) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const container = scrollContainerRef.current;
    // Critical: Disable CSS smooth scroll during RAF loop to eliminate frame-rate fighting/stutter
    container.style.scrollBehavior = 'auto';

    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      if (getTransportSeconds) {
        const t = getTransportSeconds();
        const { x: exactX } = getTimeXPosition(t);

        // Hardware GPU-accelerated translate3d on the laser playhead (smooth subpixel motion)
        if (laserRef.current) {
          laserRef.current.style.transform = `translate3d(${exactX}px, 0, 0)`;
        }

        // Keep reading line fixed in the first third (around 28% from left) for optimal lookahead
        if (!isDraggingTimelineRef.current) {
          const containerVisibleWidth = container.clientWidth;
          const focusPoint = Math.max(140, containerVisibleWidth * 0.28);
          const targetScrollLeft = Math.max(0, exactX - focusPoint);
          container.scrollLeft = targetScrollLeft;
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
  }, [isRunway, isPlaying, getTimeXPosition, getTransportSeconds]);

  // Handle explicit Stop action (smooth reset to start)
  const handleStop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    }
    if (laserRef.current) {
      laserRef.current.style.transform = `translate3d(20px, 0, 0)`;
    }
    if (onStop) {
      onStop();
    }
  }, [onStop]);

  // Graceful smooth reset to start (measure 1) ONLY when explicitly stopped at origin
  useEffect(() => {
    if (!isPlaying && scrollContainerRef.current) {
      const transportTime = getTransportSeconds ? getTransportSeconds() : 0;
      const isAtOrigin =
        playhead.measureIndex === 0 &&
        playhead.beatIndex === 0 &&
        playhead.stepIndex === 0 &&
        transportTime === 0;

      // Only scroll back to origin if explicitly stopped at 0, NEVER when pausing mid-playback!
      if (isAtOrigin && prevIsPlayingRef.current) {
        scrollContainerRef.current.scrollTo({
          left: 0,
          behavior: 'smooth',
        });
        if (laserRef.current) {
          laserRef.current.style.transform = `translate3d(20px, 0, 0)`;
        }
      }
    }
    prevIsPlayingRef.current = isPlaying;
  }, [isPlaying, playhead, getTransportSeconds]);

  // Center selected step when clicking or navigating while paused (at 28% focus)
  useEffect(() => {
    if (!isRunway || isPlaying || !selectedStepPos || !scrollContainerRef.current) {
      return;
    }
    const container = scrollContainerRef.current;
    const containerVisibleWidth = container.clientWidth;
    const currentScroll = container.scrollLeft;

    if (
      selectedStepPos.x < currentScroll + 50 ||
      selectedStepPos.x > currentScroll + containerVisibleWidth - 80
    ) {
      const focusPoint = Math.max(140, containerVisibleWidth * 0.28);
      container.scrollTo({
        left: Math.max(0, selectedStepPos.x - focusPoint),
        behavior: 'smooth',
      });
    }
  }, [isRunway, isPlaying, selectedStepPos]);

  // Interactive timeline scrub handlers (click or drag to seek in Runway mode)
  const handleTimelineSeek = useCallback(
    (clientX: number) => {
      if (!scrollContainerRef.current) return;
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const clickX = clientX - rect.left + scrollLeft;

      const relativeX = Math.max(0, clickX - 20);
      const mIdx = Math.min(measures.length - 1, Math.floor(relativeX / currentMeasureWidth));
      const measureOffsetX = relativeX - mIdx * currentMeasureWidth;
      const fraction = Math.max(0, Math.min(0.999, measureOffsetX / currentMeasureWidth));

      const measure = measures[mIdx];
      if (!measure) return;

      const [beatsCount, beatValue] = measure.timeSignature;
      const targetBeat = Math.min(beatsCount - 1, Math.floor(fraction * beatsCount));
      const beat = measure.beats[targetBeat];
      const numSteps = beat?.steps?.length || 4;
      const fractionInBeat = fraction * beatsCount - targetBeat;
      const targetStep = Math.min(numSteps - 1, Math.floor(fractionInBeat * numSteps));

      onSelectStep(mIdx, targetBeat, targetStep);

      if (seekToStep) {
        seekToStep(mIdx, targetBeat, targetStep);
      } else if (seekToSeconds) {
        let time = 0;
        for (let m = 0; m < mIdx; m++) {
          const [bc, bv] = measures[m].timeSignature;
          time += bc * (60 / bpm) * (4 / bv);
        }
        const beatDur = (60 / bpm) * (4 / beatValue);
        const sub = beat?.subdivision || 1;
        const stepDur = sub === 0.25 ? beatDur * 4 : sub === 0.5 ? beatDur * 2 : beatDur / sub;
        time += targetBeat * beatDur + targetStep * stepDur;
        seekToSeconds(time);
      }
    },
    [measures, currentMeasureWidth, bpm, onSelectStep, seekToStep, seekToSeconds]
  );

  const handleTimelineMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingTimelineRef.current = true;
      handleTimelineSeek(e.clientX);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (isDraggingTimelineRef.current) {
          handleTimelineSeek(moveEvent.clientX);
        }
      };

      const handleMouseUp = () => {
        isDraggingTimelineRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [handleTimelineSeek]
  );

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

        <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono">
          {/* Mini Floating Transport Bar (Always accessible alongside score) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-dark/95 border border-white/10 shadow-lg select-none">
            {onTogglePlay && (
              <button
                type="button"
                onClick={onTogglePlay}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer shadow-md ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
                    : 'bg-synth-cyan hover:bg-cyan-300 text-black shadow-glow-cyan'
                }`}
                title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>PAUSA</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PLAY</span>
                  </>
                )}
              </button>
            )}

            {onStop && (
              <button
                type="button"
                onClick={handleStop}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/40 transition-all cursor-pointer"
                title="Detener y volver al Compás 1"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            )}

            {onSetBpm && bpm && (
              <div className="flex items-center px-1 py-0.5 rounded-lg bg-white/5 border border-white/10 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => onSetBpm(bpm - 5)}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Bajar 5 BPM"
                >
                  -
                </button>
                <span className="px-1.5 text-synth-cyan font-bold min-w-[50px] text-center">
                  {bpm} <span className="text-[9px] text-gray-400 font-normal">BPM</span>
                </span>
                <button
                  type="button"
                  onClick={() => onSetBpm(bpm + 5)}
                  className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="Subir 5 BPM"
                >
                  +
                </button>
              </div>
            )}

            {onToggleMetronome && (
              <button
                type="button"
                onClick={onToggleMetronome}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isMetronomeActive
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title={isMetronomeActive ? 'Desactivar Metrónomo (Click)' : 'Activar Metrónomo (Click)'}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
            )}

            {onToggleLoop && (
              <button
                type="button"
                onClick={onToggleLoop}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isLooping
                    ? 'bg-synth-cyan/20 border-synth-cyan text-synth-cyan shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title={isLooping ? 'Loop Activado' : 'Loop Desactivado'}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Paginated (Multiline) vs Runway (Continuous strip) */}
          {onToggleLayoutMode && (
            <div className="flex items-center p-0.5 rounded-xl bg-surface-dark/90 border border-white/10 select-none">
              <button
                type="button"
                onClick={() => onToggleLayoutMode('paginated')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isRunway
                    ? 'bg-gradient-electric text-white shadow-glow-violet'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Vista Partitura: Páginas / Multilínea (2 compases por fila)"
              >
                <span>⊞</span>
                <span className="hidden sm:inline">Páginas</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleLayoutMode('runway')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isRunway
                    ? 'bg-synth-cyan text-black shadow-glow-cyan font-extrabold'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Modo Ensayo Horizontal: Cinta Continua / Runway con Auto-Scroll sincronizado"
              >
                <span>⇄</span>
                <span>Runway</span>
                {isRunway && (
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                )}
              </button>
            </div>
          )}

          {/* Zoom Level Selector (80%, 100%, 120%) */}
          {onChangeZoomLevel && (
            <div className="flex items-center gap-1 bg-surface-dark/90 p-0.5 rounded-xl border border-white/10 select-none">
              <span className="text-[10px] text-gray-500 px-1 font-semibold">ZOOM:</span>
              {[0.8, 1.0, 1.2].map((z) => (
                <button
                  key={`zoom-btn-${z}`}
                  type="button"
                  onClick={() => onChangeZoomLevel(z)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    zoomLevel === z
                      ? 'bg-synth-cyan text-black shadow-glow-cyan'
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          )}

          {/* Synchronized Beat Flash Counter (Cyan on 1, Violet on 2, 3, 4) */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-[11px]">
            <span className="text-gray-400 text-[10px] mr-1">PULSO:</span>
            {[0, 1, 2, 3].map((b) => {
              const isCurrent = isPlaying && currentBeatFlash?.beatIndex === b;
              return (
                <span
                  key={`score-beat-${b}`}
                  className={`px-1.5 py-0.2 rounded font-bold transition-all duration-75 ${
                    isCurrent
                      ? b === 0
                        ? 'bg-synth-cyan text-black shadow-[0_0_12px_#22d3ee] scale-110'
                        : 'bg-synth-violet text-white shadow-[0_0_10px_#a855f7] scale-110'
                      : 'text-gray-500 bg-white/5'
                  }`}
                >
                  T{b + 1}
                </span>
              );
            })}
          </div>

          {/* Pedagogical Toggle Switch for Syncopations */}
          {onToggleHighlightSyncopations && (
            <button
              type="button"
              onClick={onToggleHighlightSyncopations}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
                highlightSyncopations || isSyncopationDrill
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-1 ring-amber-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-amber-300 hover:border-amber-500/40'
              }`}
              title="Resaltar visualmente notas y ligaduras sincopadas (Ámbar neón #F59E0B)"
            >
              <span className="text-sm">𝄐</span>
              <span>Destacar Síncopas</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  highlightSyncopations || isSyncopationDrill ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'
                }`}
              />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-gray-300">Active Hit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300 font-semibold">𝄐 Síncopa / Tie</span>
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

      {/* Syncopation & Anchor Drill Pedagogical Info Banner */}
      {(highlightSyncopations || isSyncopationDrill) && (
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between text-[11px] font-mono text-amber-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">{isSyncopationDrill ? '🎯' : '𝄐'}</span>
            <span>
              {isSyncopationDrill ? (
                <>
                  <strong>Modo Anclaje / Syncopation Drill Activo:</strong> El metrónomo marca estrictamente los 4 pulsos a tierra con timbre percusivo (woodblock digital). Las guías punteadas <strong>⚓ T1-T4 (Tierra)</strong> señalan los tiempos fuertes silenciados o esquivados, manteniendo las notas sincopadas en <strong>ámbar neón (#F59E0B)</strong>.
                </>
              ) : (
                <>
                  <strong>Modo Pedagógico Activo:</strong> Cabezas de nota y ligaduras en <strong>ámbar neón (#F59E0B)</strong> muestran cómo el ritmo desplaza los acentos a contratiempo y esquiva el impacto en los tiempos fuertes.
                </>
              )}
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold uppercase border border-amber-400/30">
            {isSyncopationDrill ? 'Sync Drill' : 'Sincopado'}
          </span>
        </div>
      )}

      {/* Main Score Scroll Container (Horizontal Runway or Paginated) */}
      <div
        ref={scrollContainerRef}
        className={`relative overflow-y-hidden py-4 ${
          isRunway
            ? 'overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [will-change:scroll-position]'
            : 'overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'
        }`}
      >
        <div
          className="relative mx-auto transition-all"
          style={{ width: `${totalWidth}px`, height: `${totalHeight + (isRunway ? 28 : 0)}px`, minHeight: '190px' }}
        >
          {/* Runway Continuous Scrub & Timeline Ruler */}
          {isRunway && (
            <div
              ref={timelineRulerRef}
              onMouseDown={handleTimelineMouseDown}
              className="absolute top-0 left-0 right-0 h-6 bg-surface-dark/95 border-b border-white/10 rounded-t-xl overflow-hidden cursor-crosshair select-none z-25 group/timeline shadow-inner"
              title="Línea de Tiempo Runway: Haz clic o arrastra para situar el cursor / reproducir desde aquí"
            >
              {measures.map((m, mIdx) => {
                const measureX = 20 + mIdx * currentMeasureWidth;
                const [beatsCount] = m.timeSignature;
                const isPlayingHere = isPlaying && playhead.measureIndex === mIdx;

                return (
                  <div
                    key={`timeline-bar-${mIdx}`}
                    className={`absolute inset-y-0 border-r flex items-center text-[10px] font-mono transition-colors ${
                      isPlayingHere
                        ? 'border-synth-cyan/60 bg-synth-cyan/15 text-cyan-200'
                        : 'border-white/15 text-gray-400 hover:bg-white/5'
                    }`}
                    style={{ left: `${measureX}px`, width: `${currentMeasureWidth}px` }}
                  >
                    <span className="px-1.5 font-bold text-synth-cyan text-[10px]">C{mIdx + 1}</span>
                    <div className="flex-1 flex h-full">
                      {Array.from({ length: beatsCount }).map((_, bIdx) => {
                        const isCurrentBeat = isPlayingHere && playhead.beatIndex === bIdx;
                        return (
                          <div
                            key={`tick-${mIdx}-${bIdx}`}
                            className={`flex-1 border-r border-white/5 flex items-center justify-center text-[9px] transition-colors ${
                              isCurrentBeat
                                ? 'bg-synth-cyan/35 text-white font-bold'
                                : 'text-gray-500 hover:text-white hover:bg-synth-cyan/15'
                            }`}
                          >
                            {bIdx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VexFlow Render Canvas Container */}
          <div ref={containerRef} className="w-full h-full pointer-events-none" />

          {/* Measure Section Badges and Active Playing Perimeter Glow */}
          {measures.map((_, mIdx) => {
            const rowIndex = isRunway ? 0 : Math.floor(mIdx / measuresPerRow);
            const colIndex = isRunway ? mIdx : mIdx % measuresPerRow;
            const measureX = 20 + colIndex * currentMeasureWidth;
            const measureY = 25 + rowIndex * rowHeight;
            const isMeasureSelected = selectedMeasureIndex === mIdx;
            const isMeasurePlaying = isPlaying && playhead.measureIndex === mIdx;

            return (
              <React.Fragment key={`measure-group-${mIdx}`}>
                {/* Active Playing Measure Perimeter Glow */}
                {isMeasurePlaying && (
                  <div
                    className="absolute rounded-2xl pointer-events-none transition-all duration-150 z-5 border-2 border-synth-cyan/80 bg-gradient-to-b from-synth-cyan/[0.08] via-synth-violet/[0.04] to-transparent shadow-[0_0_24px_rgba(34,211,238,0.3),inset_0_0_12px_rgba(34,211,238,0.1)] animate-pulse-subtle"
                    style={{
                      left: `${measureX + 2}px`,
                      top: `${measureY - 16}px`,
                      width: `${currentMeasureWidth - 4}px`,
                      height: `${rowHeight + 6}px`,
                    }}
                  >
                    {isRunway && (
                      <div className="absolute top-1 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-synth-cyan/25 border border-synth-cyan/60 text-[9px] font-mono text-cyan-200 shadow-[0_0_8px_#22d3ee]">
                        <span className="w-1.5 h-1.5 rounded-full bg-synth-cyan animate-ping" />
                        <span className="font-bold">ON RUNWAY</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Measure Section Badge with Contextual Delete Action */}
                <div
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
                      isMeasurePlaying
                        ? 'bg-synth-cyan/30 border-synth-cyan text-synth-cyan shadow-[0_0_10px_rgba(34,211,238,0.4)] ring-1 ring-synth-cyan'
                        : isMeasureSelected
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
              </React.Fragment>
            );
          })}

          {/* Ground Anchor Visual Guides for Syncopation Drill */}
          {isSyncopationDrill &&
            notePositions
              .filter((pos) => pos.stepIndex === 0)
              .map((pos) => {
                const stepData =
                  measures[pos.measureIndex]?.beats[pos.beatIndex]?.steps[pos.stepIndex];
                const isGroundSilenced =
                  stepData?.tiedFromPrev ||
                  stepData?.isRest ||
                  !stepData?.hits ||
                  stepData.hits.length === 0;

                if (!isGroundSilenced) return null;

                const isBeatActive = isPlaying && currentBeatFlash?.beatIndex === pos.beatIndex;

                return (
                  <div
                    key={`ground-anchor-${pos.measureIndex}-${pos.beatIndex}`}
                    className="absolute -translate-x-1/2 pointer-events-none z-15 flex flex-col items-center select-none transition-all"
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y - 14}px`,
                      height: '146px',
                    }}
                  >
                    {/* Ground Anchor Pill Badge */}
                    <div
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border transition-all duration-75 flex items-center gap-1 ${
                        isBeatActive
                          ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_14px_#f59e0b] scale-110'
                          : 'bg-surface-dark/95 border-amber-500/50 text-amber-300/90 shadow-sm'
                      }`}
                      title={`Tiempo a tierra ${pos.beatIndex + 1} silenciado por síncopa (referencia de anclaje)`}
                    >
                      <span>⚓</span>
                      <span>T{pos.beatIndex + 1}</span>
                      <span className="text-[8px] opacity-75 font-normal">Tierra</span>
                    </div>

                    {/* Vertical Dashed Reference Line */}
                    <div
                      className={`w-0 flex-1 border-l-2 border-dashed mt-1 transition-colors duration-75 ${
                        isBeatActive
                          ? 'border-amber-400 opacity-100 shadow-[0_0_8px_#f59e0b]'
                          : 'border-amber-400/40 opacity-70'
                      }`}
                    />
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

          {/* Continuous GPU-Accelerated Laser Playhead (Runway Mode) */}
          {isRunway && (
            <div
              ref={laserRef}
              className={`absolute top-0 left-0 pointer-events-none z-30 transition-opacity duration-150 ${
                isPlaying || (getTransportSeconds && getTransportSeconds() > 0.01) ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: 'translate3d(20px, 0, 0)',
                height: `${totalHeight + 28}px`,
                willChange: 'transform',
              }}
            >
              {/* Laser Core Beam (Cyan when playing, Amber when paused) */}
              <div
                className={`w-[2px] h-full ${
                  isPlaying
                    ? 'bg-synth-cyan shadow-[0_0_14px_#22d3ee,0_0_28px_#38bdf8]'
                    : 'bg-amber-400 shadow-[0_0_14px_#f59e0b,0_0_24px_#f59e0b]'
                }`}
              />
              {/* Top Reading Diamond */}
              <div
                className={`absolute -top-1 -left-[5px] w-3 h-3 rotate-45 ${
                  isPlaying
                    ? 'bg-synth-cyan shadow-[0_0_12px_#22d3ee]'
                    : 'bg-amber-400 shadow-[0_0_12px_#f59e0b]'
                }`}
              />
              {/* Glowing reading core dot at stave center */}
              <div className="absolute top-[88px] -left-[3px] w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#fff]" />
            </div>
          )}

          {/* Discrete Step Laser Playhead (Paginated Mode) */}
          {!isRunway && isPlaying && activePlayheadPos && (
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
          {(selectedStep?.tiedToNext || selectedStep?.tiedFromPrev || selectedStep?.isSyncopated) && (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
              <span>𝄐</span>
              <span>
                {selectedStep.tiedToNext
                  ? 'Ligada (Tie →)'
                  : selectedStep.tiedFromPrev
                  ? 'Ligada (← Tied)'
                  : 'Síncopa'}
              </span>
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
