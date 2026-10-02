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
  staffTopY: number;
  staffBottomY: number;
}

interface TimedNote {
  measureIndex: number;
  beatIndex: number;
  stepIndex: number;
  time: number;
  duration: number;
  x: number;
  width: number;
  staffTopY: number;
  staffBottomY: number;
  key: string;
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
  const [activeHitKey, setActiveHitKey] = useState<string | null>(null);
  const lastActiveHitKeyRef = useRef<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);

  // Synchronize VexFlow engraving with document theme (dark/light)
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkTheme(isDark);
    };
    checkTheme();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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

  const baseMeasureWidth = Math.round(560 * zoomLevel);
  const currentMeasureWidth = isRunway
    ? baseMeasureWidth
    : Math.floor((containerWidth - 40) / measuresPerRow);

  const rowHeight = Math.round(270 * zoomLevel);
  const numRows = isRunway ? 1 : Math.ceil(measures.length / measuresPerRow);

  const totalWidth = isRunway
    ? Math.max(containerWidth, measures.length * currentMeasureWidth + 80)
    : containerWidth;

  const totalHeight = isRunway
    ? Math.round(315 * zoomLevel)
    : Math.max(300, numRows * rowHeight + 35);

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

        // Cyber-glass clean, elegant slate lines (subtle & non-competing)
        const staveColor = isDarkTheme ? 'rgba(148, 163, 184, 0.25)' : 'rgba(71, 85, 105, 0.35)';
        const staveFill = isDarkTheme ? 'rgba(148, 163, 184, 0.25)' : 'rgba(71, 85, 105, 0.35)';

        context.setFillStyle(staveFill);
        context.setStrokeStyle(staveColor);
        context.setLineWidth(1.6);

        const recordedPositions: NoteXPosition[] = [];
        const allRenderedNotes: any[] = [];

        measures.forEach((measure, mIdx) => {
          const [beatsCount, beatValue] = measure.timeSignature;
          const rowIndex = isRunway ? 0 : Math.floor(mIdx / measuresPerRow);
          const colIndex = isRunway ? mIdx : mIdx % measuresPerRow;
          const measureX = 20 + colIndex * currentMeasureWidth;
          const measureY = (isRunway ? 28 : 16) + rowIndex * rowHeight;

          // Create percussion stave with Cyber-Glass lines (spacing: 22px, dominant & expanded)
          const stave = new Stave(measureX, measureY, currentMeasureWidth, {
            spacingBetweenLinesPx: 22,
            spaceAboveStaffLn: 2.8,
            spaceBelowStaffLn: 2.5,
          });
          stave.setStyle({ fillStyle: staveFill, strokeStyle: staveColor, lineWidth: 1.6 });

          // Clef at the start of each line (scaled to span lines 1 to 5)
          if (colIndex === 0) {
            stave.addClef('percussion');
            try {
              const clef = stave
                .getModifiers()
                .find(
                  (m: any) =>
                    m.type === 'percussion' ||
                    (m.getCategory && m.getCategory() === 'clefs')
                );
              if (clef) {
                clef.fontScale = 1.45;
                clef.setStyle({
                  fillStyle: isDarkTheme ? '#22D3EE' : '#0891B2',
                  strokeStyle: isDarkTheme ? '#22D3EE' : '#0891B2',
                });
              }
            } catch (_) {}
          }

          // Meter signature at the start of the score
          if (mIdx === 0) {
            stave.addTimeSignature(`${beatsCount}/${beatValue}`);
          }

          // Measure section badge (e.g., C1, C2...) (in Paginated mode only, since Runway mode has it integrated in the ruler)
          if (!isRunway) {
            try {
              stave.setSection(`C${mIdx + 1}`, 0);
            } catch (_) {}
          }

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
                const restColor = isDarkTheme ? '#64748B' : '#475569';
                staveNote.setStyle({ fillStyle: restColor, strokeStyle: restColor });
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
                staveNote.fontScale = 1.35;

                // Plicas (stems) bien definidas, nítidas y gruesas
                try {
                  if (typeof staveNote.setStemStyle === 'function') {
                    staveNote.setStemStyle({
                      strokeStyle: isDarkTheme ? '#CBD5E1' : '#475569',
                      lineWidth: 2.6,
                    });
                  }
                } catch (_) {}

                // Accent articulation (a>) en dorado neón
                const hasAccent = step.hits.some((h) => h.accent);
                if (hasAccent) {
                  try {
                    const artic = new Articulation('a>');
                    artic.setStyle({ fillStyle: '#F59E0B', strokeStyle: '#F59E0B' });
                    staveNote.addModifier(artic, 0);
                  } catch (_) {}
                }

                // Ghost note: Encapsuladas entre paréntesis con opacidad del 60%
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
                        ann.setFont('sans-serif', 12, 'bold');
                        ann.setVerticalJustification(Annotation.VerticalJustify.CENTER);
                        staveNote.addModifier(ann, keyIndex);
                      } catch (_) {}
                    }
                  }
                });

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
                      graceAnn.setFont('sans-serif', 10, 'bold');
                      graceAnn.setVerticalJustification(Annotation.VerticalJustify.TOP);
                      staveNote.addModifier(graceAnn, 0);
                    } catch (_) {}
                  }
                }

                // Cabezas de Nota (Noteheads) llamativas y ampliadas al 180%
                const isStepSyncopated =
                  step.isSyncopated ||
                  step.tiedToNext ||
                  step.tiedFromPrev ||
                  (step.hits && step.hits.some((h: any) => h.isSyncopated || h.tiedToNext));
                const shouldHighlightSync = highlightSyncopations || isSyncopationDrill;

                if (staveNote.noteHeads) {
                  sortedHits.forEach((hit, keyIndex) => {
                    const pieceInfo = DRUM_PIECES[hit.pieceId];
                    const noteHead = staveNote.noteHeads[keyIndex];

                    if (noteHead) {
                      noteHead.fontScale = 1.45;
                      if (noteHead.renderOptions) {
                        noteHead.renderOptions.strokePx = 2.8;
                      }

                      if (noteHead.glyphProps) {
                        if (pieceInfo?.notehead === 'x') {
                          noteHead.glyphProps.codeHead = Glyphs.noteheadXBlack || '';
                        } else if (pieceInfo?.notehead === 'circle-x') {
                          noteHead.glyphProps.codeHead = Glyphs.noteheadCircleX || '';
                        }
                      }

                      // Código de colores de alta gama:
                      // - Caja / Snare: Óvalos blancos con borde sutil cian
                      // - Bombo / Kick: Círculos esmeralda luminosos (#10b981)
                      // - Hi-Hat / Platillos: Cruces 'x' en cian brillante (#22d3ee) con stroke-width 2.8
                      let fillCol = isDarkTheme ? '#F8FAFC' : '#0F172A';
                      let strokeCol = fillCol;
                      let strokeW = 1.8;

                      if (shouldHighlightSync && (isStepSyncopated || hit.isSyncopated)) {
                        fillCol = '#F59E0B'; // Ámbar neón síncopa
                        strokeCol = '#F59E0B';
                        strokeW = 2.2;
                      } else if (hit.ghost) {
                        fillCol = 'rgba(148, 163, 184, 0.6)'; // Ghost Note 60% opacidad
                        strokeCol = 'rgba(148, 163, 184, 0.6)';
                      } else {
                        const pId = hit.pieceId;
                        if (
                          pId === 'hihat' ||
                          pId === 'hihatOpen' ||
                          pId === 'hihatClosed' ||
                          pId === 'crash' ||
                          pId === 'ride' ||
                          pId === 'china' ||
                          pieceInfo?.notehead === 'x' ||
                          pieceInfo?.notehead === 'circle-x'
                        ) {
                          fillCol = '#22D3EE'; // Cian brillante (#22d3ee)
                          strokeCol = '#22D3EE';
                          strokeW = 2.8; // Cruces '×' con stroke-width="2.8"
                        } else if (pId === 'kick' || pId === 'hihatFoot') {
                          fillCol = '#10B981'; // Círculos esmeralda luminosos (#10b981)
                          strokeCol = '#10B981';
                          strokeW = 2.2;
                        } else if (pId === 'snare') {
                          fillCol = hit.accent ? '#FBBF24' : '#FFFFFF'; // Óvalo moderno blanco
                          strokeCol = hit.accent ? '#F59E0B' : '#22D3EE'; // Borde sutil cian
                          strokeW = 1.8;
                        } else if (pId === 'tom1' || pId === 'tom2' || pId === 'floorTom') {
                          fillCol = '#38BDF8'; // Azul cielo brillante para toms
                          strokeCol = '#38BDF8';
                          strokeW = 2.0;
                        }
                      }

                      if (typeof noteHead.setStyle === 'function') {
                        noteHead.setStyle({ fillStyle: fillCol, strokeStyle: strokeCol, lineWidth: strokeW });
                      }
                    }
                  });
                }

                staveNote.fontScale = 1.45;
                if (staveNote.renderOptions) {
                  staveNote.renderOptions.strokePx = 2.8;
                }
                if (staveNote.stem) {
                  staveNote.stem.stemExtension = 14;
                  try {
                    staveNote.stem.setStyle({
                      fillStyle: isDarkTheme ? '#F8FAFC' : '#0F172A',
                      strokeStyle: isDarkTheme ? '#F8FAFC' : '#0F172A',
                      lineWidth: 3.2,
                    });
                  } catch (_) {}
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

            // Barras de unión (beams) gruesas y sólidas (5.0px) con esquinas limpias
            measureBeams.forEach((beam) => {
              try {
                if (typeof (beam as any).setStyle === 'function') {
                  (beam as any).setStyle({
                    fillStyle: isDarkTheme ? '#F8FAFC' : '#0F172A',
                    strokeStyle: isDarkTheme ? '#F8FAFC' : '#0F172A',
                    lineWidth: 5.0,
                  });
                }
                if ((beam as any).renderOptions) {
                  (beam as any).renderOptions.beamWidth = 8.5;
                }
                beam.setContext(context).draw();
              } catch (_) {}
            });

            // Draw Tuplets with theme styling
            measureTuplets.forEach((tuplet) => {
              try {
                if (typeof (tuplet as any).setStyle === 'function') {
                  (tuplet as any).setStyle({
                    fillStyle: isDarkTheme ? '#F8FAFC' : '#0F172A',
                    strokeStyle: isDarkTheme ? '#F8FAFC' : '#0F172A',
                  });
                }
                tuplet.setContext(context).draw();
              } catch (_) {}
            });

            // Record exact X and Y coordinates for playhead and click interaction
            const staffTopY =
              typeof stave.getYForLine === 'function' ? stave.getYForLine(0) : measureY + 62;
            const staffBottomY =
              typeof stave.getYForLine === 'function' ? stave.getYForLine(4) : staffTopY + 4 * 22;

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
                  staffTopY,
                  staffBottomY,
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
                const tieColor = shouldHighlightSync
                  ? isDarkTheme
                    ? '#F59E0B'
                    : '#D97706'
                  : isDarkTheme
                  ? '#F8FAFC'
                  : '#0F172A';
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
  }, [
    measures,
    totalWidth,
    totalHeight,
    measuresPerRow,
    currentMeasureWidth,
    rowHeight,
    highlightSyncopations,
    isSyncopationDrill,
    isRunway,
    zoomLevel,
    isDarkTheme,
  ]);

  // Find position of active playhead step
  const activePlayheadPos = useMemo(() => {
    if (notePositions.length === 0) return null;

    if (activeHitKey) {
      const activeMatch = notePositions.find(
        (p) => `${p.measureIndex}-${p.beatIndex}-${p.stepIndex}` === activeHitKey
      );
      if (activeMatch) return activeMatch;
    }

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
  }, [notePositions, playhead, activeHitKey]);

  // Find position of the currently selected step (cursor)
  const selectedStepPos = useMemo(() => {
    return notePositions.find(
      (p) =>
        p.measureIndex === selectedMeasureIndex &&
        p.beatIndex === selectedBeatIndex &&
        p.stepIndex === selectedStepIndex
    );
  }, [notePositions, selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]);

  // Timed notes cache: map every step in the score to its exact scheduled audio time & rendered X position
  const timedNotes = useMemo<TimedNote[]>(() => {
    if (notePositions.length === 0 || measures.length === 0) return [];

    const list: TimedNote[] = [];
    let accumulatedTime = 0;

    for (let m = 0; m < measures.length; m++) {
      const measure = measures[m];
      const [beatsCount, beatValue] = measure.timeSignature;
      const beatDuration = (60 / bpm) * (4 / beatValue);

      measure.beats.forEach((beat, bIdx) => {
        const sub = beat.subdivision || 1;
        const stepDuration =
          sub === 0.25 ? beatDuration * 4 : sub === 0.5 ? beatDuration * 2 : beatDuration / sub;

        beat.steps.forEach((_, sIdx) => {
          const stepTime = accumulatedTime + bIdx * beatDuration + sIdx * stepDuration;
          const pos = notePositions.find(
            (p) => p.measureIndex === m && p.beatIndex === bIdx && p.stepIndex === sIdx
          );

          if (pos) {
            list.push({
              measureIndex: m,
              beatIndex: bIdx,
              stepIndex: sIdx,
              time: stepTime,
              duration: stepDuration,
              x: pos.x,
              width: pos.width,
              staffTopY: pos.staffTopY,
              staffBottomY: pos.staffBottomY,
              key: `${m}-${bIdx}-${sIdx}`,
            });
          }
        });
      });

      const measureDuration = beatsCount * beatDuration;
      accumulatedTime += measureDuration;
    }

    return list.sort((a, b) => a.time - b.time);
  }, [notePositions, measures, bpm]);

  // Total duration of all measures in seconds
  const totalScoreDuration = useMemo(() => {
    let dur = 0;
    for (const m of measures) {
      const [beatsCount, beatValue] = m.timeSignature;
      dur += beatsCount * (60 / bpm) * (4 / beatValue);
    }
    return dur > 0 ? dur : 2;
  }, [measures, bpm]);

  // Calculate exact continuous subpixel X position from Web Audio seconds directly synchronized with rendered notes
  const getTimeXPosition = useCallback(
    (rawT: number): { x: number; measureIndex: number; beatIndex: number; activeKey: string | null } => {
      if (measures.length === 0) {
        return { x: 20, measureIndex: 0, beatIndex: 0, activeKey: null };
      }

      const t =
        totalScoreDuration > 0
          ? ((rawT % totalScoreDuration) + totalScoreDuration) % totalScoreDuration
          : rawT;

      // Fallback: linear calculation if notes are still being rendered
      if (timedNotes.length === 0) {
        let accumulatedTime = 0;
        for (let m = 0; m < measures.length; m++) {
          const [beatsCount, beatValue] = measures[m].timeSignature;
          const beatDuration = (60 / bpm) * (4 / beatValue);
          const measureDuration = beatsCount * beatDuration;
          const measureStartX = 20 + m * currentMeasureWidth;

          if (t >= accumulatedTime && t < accumulatedTime + measureDuration) {
            const timeInMeasure = t - accumulatedTime;
            const fractionInMeasure = timeInMeasure / measureDuration;
            const currentX = measureStartX + fractionInMeasure * currentMeasureWidth;
            const beatIdx = Math.min(beatsCount - 1, Math.floor(timeInMeasure / beatDuration));
            return {
              x: currentX,
              measureIndex: m,
              beatIndex: beatIdx,
              activeKey: null,
            };
          }
          accumulatedTime += measureDuration;
        }
        return { x: 20, measureIndex: 0, beatIndex: 0, activeKey: null };
      }

      // Identify active note hit window for audio-visual lockstep
      let activeKey: string | null = null;
      for (let i = 0; i < timedNotes.length; i++) {
        const n = timedNotes[i];
        const delta = t - n.time;
        const hitWindow = Math.min(0.12, n.duration * 0.75);
        if (delta >= -0.015 && delta < hitWindow) {
          activeKey = n.key;
          break;
        }
      }

      // 1. Before first note: smoothly move from stave start to first note X
      const firstNote = timedNotes[0];
      if (t < firstNote.time) {
        const fraction = firstNote.time > 0 ? Math.max(0, t / firstNote.time) : 1;
        const startX = 20;
        const currentX = startX + fraction * (firstNote.x - startX);
        return {
          x: currentX,
          measureIndex: firstNote.measureIndex,
          beatIndex: firstNote.beatIndex,
          activeKey,
        };
      }

      // 2. Between notes: continuous 60 FPS subpixel interpolation (hits note center at exact audio time)
      for (let i = 0; i < timedNotes.length - 1; i++) {
        const curr = timedNotes[i];
        const next = timedNotes[i + 1];

        if (t >= curr.time && t < next.time) {
          const span = next.time - curr.time;
          const fraction = span > 0 ? (t - curr.time) / span : 0;
          const currentX = curr.x + fraction * (next.x - curr.x);
          return {
            x: currentX,
            measureIndex: curr.measureIndex,
            beatIndex: curr.beatIndex,
            activeKey,
          };
        }
      }

      // 3. After last note: smoothly traverse towards the end barline of the score
      const lastNote = timedNotes[timedNotes.length - 1];
      const lastMeasureEndX = 20 + measures.length * currentMeasureWidth;
      const remainingTime = totalScoreDuration - lastNote.time;
      const fraction =
        remainingTime > 0 ? Math.min(1, Math.max(0, (t - lastNote.time) / remainingTime)) : 0;
      const currentX = lastNote.x + fraction * (lastMeasureEndX - lastNote.x);

      return {
        x: currentX,
        measureIndex: lastNote.measureIndex,
        beatIndex: lastNote.beatIndex,
        activeKey,
      };
    },
    [measures, currentMeasureWidth, totalScoreDuration, timedNotes, bpm]
  );

  // Clear active hit key when stopping playback
  useEffect(() => {
    if (!isPlaying) {
      setActiveHitKey(null);
      lastActiveHitKeyRef.current = null;
    }
  }, [isPlaying]);

  // Continuous 60 FPS Runway Smooth Scroll & Single Laser Playhead animation loop
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
        const { x: exactX, activeKey } = getTimeXPosition(t);

        // Instantaneous note hit flash & sticking chip illumination in lockstep with audio
        if (activeKey !== lastActiveHitKeyRef.current) {
          lastActiveHitKeyRef.current = activeKey;
          setActiveHitKey(activeKey);
        }

        // Hardware GPU-accelerated translate3d on the single laser playhead (smooth subpixel motion)
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
    setActiveHitKey(null);
    lastActiveHitKeyRef.current = null;
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
    <div className="relative w-full h-full box-border bg-gradient-to-b from-slate-900/90 via-[#090e1a] to-[#060a12] border border-cyan-500/20 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)] overflow-hidden select-none text-slate-100 flex flex-col justify-between">
      {/* Main Score Scroll Container (Horizontal Runway or Paginated) */}
      <div
        ref={scrollContainerRef}
        className={`relative overflow-y-hidden py-3 ${
          isRunway
            ? 'overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [will-change:scroll-position]'
            : 'overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent'
        }`}
      >
        <div
          className="relative mx-auto transition-all"
          style={{ width: `${totalWidth}px`, height: `${totalHeight + (isRunway ? 28 : 0)}px`, minHeight: '300px' }}
        >
          {/* Runway Continuous Scrub & Timeline Ruler */}
          {isRunway && (
            <div
              ref={timelineRulerRef}
              onMouseDown={handleTimelineMouseDown}
              className="absolute top-0 left-0 right-0 h-7 bg-slate-950/90 border-b border-cyan-500/20 backdrop-blur-md rounded-t-xl overflow-hidden cursor-crosshair select-none z-25 group/timeline shadow-inner"
              title="Línea de Tiempo Runway: Haz clic o arrastra para situar el cursor / reproducir desde aquí"
            >
              {measures.map((m, mIdx) => {
                const measureX = 20 + mIdx * currentMeasureWidth;
                const [beatsCount] = m.timeSignature;
                const isPlayingHere = isPlaying && playhead.measureIndex === mIdx;

                return (
                  <div
                    key={`timeline-bar-${mIdx}`}
                    className={`absolute inset-y-0 border-r flex items-center text-xs font-mono transition-colors group/timeline-bar ${
                      isPlayingHere
                        ? 'border-cyan-500/40 bg-cyan-500/10'
                        : 'border-white/10 hover:bg-white/[0.04]'
                    }`}
                    style={{ left: `${measureX}px`, width: `${currentMeasureWidth}px` }}
                  >
                    {/* Insignia flotante en cápsula moderna con borde cian tenue */}
                    <div className="flex items-center gap-1.5 pl-2 pr-2.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStep(mIdx, 0, 0);
                          if (seekToStep) seekToStep(mIdx, 0, 0);
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border select-none ${
                          isPlayingHere || selectedMeasureIndex === mIdx
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.4)]'
                            : 'bg-slate-900/90 border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:text-white backdrop-blur-md shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                        }`}
                        title={`Compás ${mIdx + 1} (Clic para enfocar / reproducir)`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isPlayingHere ? 'bg-cyan-300 animate-ping' : 'bg-cyan-400'}`} />
                        <span>Compás {mIdx + 1}</span>
                      </button>

                      {measures.length > 1 && onRemoveMeasure && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveMeasure(mIdx);
                          }}
                          className="opacity-0 group-hover/timeline-bar:opacity-100 p-0.5 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-opacity cursor-pointer"
                          title={`Eliminar Compás C${mIdx + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Números de pulso (1, 2, 3, 4) y separadores sutiles */}
                    <div className="flex-1 flex h-full items-center">
                      {Array.from({ length: beatsCount }).map((_, bIdx) => {
                        const isCurrentBeat = isPlayingHere && playhead.beatIndex === bIdx;
                        return (
                          <div
                            key={`tick-${mIdx}-${bIdx}`}
                            className={`flex-1 h-full border-r border-white/5 flex items-center justify-center transition-all ${
                              isCurrentBeat
                                ? 'bg-cyan-500/25 text-amber-300 font-bold text-sm scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                                : 'text-slate-400 font-mono text-xs hover:text-white hover:bg-cyan-500/10'
                            }`}
                          >
                            <span>{bIdx + 1}</span>
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

          {/* Floating Beat Numbers (1, 2, 3, 4) - Flotando arriba sin proyectar líneas hacia abajo */}
          {measures.map((m, mIdx) => {
            const [beatsCount] = m.timeSignature;
            const rowIndex = isRunway ? 0 : Math.floor(mIdx / measuresPerRow);
            const colIndex = isRunway ? mIdx : mIdx % measuresPerRow;
            const measureX = 20 + colIndex * currentMeasureWidth;
            const measureY = (isRunway ? 28 : 16) + rowIndex * rowHeight;
            const mPos = notePositions.find((p) => p.measureIndex === mIdx);
            const staffTopY = mPos?.staffTopY || measureY + 62;

            return Array.from({ length: beatsCount }).map((_, bIdx) => {
              const matchingPos = notePositions.find(
                (p) => p.measureIndex === mIdx && p.beatIndex === bIdx && p.stepIndex === 0
              );
              const beatX = matchingPos
                ? matchingPos.x
                : measureX + (bIdx + 0.5) * (currentMeasureWidth / beatsCount);
              const isCurrentBeat =
                isPlaying && playhead.measureIndex === mIdx && playhead.beatIndex === bIdx;

              return (
                <div
                  key={`beat-grid-${mIdx}-${bIdx}`}
                  className="absolute pointer-events-none z-10 flex flex-col items-center"
                  style={{
                    left: `${beatX}px`,
                    top: `${staffTopY - 44}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Número de Pulso Sutil en Ámbar/Slate sin ninguna línea hacia abajo */}
                  <span
                    className={`font-mono text-xs font-bold transition-all duration-75 select-none ${
                      isCurrentBeat
                        ? 'text-amber-300 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                        : 'text-slate-400/60'
                    }`}
                  >
                    {bIdx + 1}
                  </span>
                </div>
              );
            });
          })}

          {/* Measure Section Badges (Paginated Mode only - Sin recuadros perimetrales pesados) */}
          {!isRunway &&
            measures.map((_, mIdx) => {
              const rowIndex = Math.floor(mIdx / measuresPerRow);
              const colIndex = mIdx % measuresPerRow;
              const measureX = 20 + colIndex * currentMeasureWidth;
              const measureY = 16 + rowIndex * rowHeight;
              const mPos = notePositions.find((p) => p.measureIndex === mIdx);
              const staffTopY = mPos?.staffTopY || measureY + 62;
              const isMeasureSelected = selectedMeasureIndex === mIdx;
              const isMeasurePlaying = isPlaying && playhead.measureIndex === mIdx;

              return (
                <div
                  key={`measure-hdr-${mIdx}`}
                  className="group/stave-hdr absolute z-25 flex items-center gap-1.5 transition-all"
                  style={{
                    left: `${measureX + (colIndex === 0 ? 32 : 12)}px`,
                    top: `${staffTopY - 48}px`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectStep(mIdx, 0, 0)}
                    className={`px-3 py-0.5 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 border select-none ${
                      isMeasurePlaying || isMeasureSelected
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.4)]'
                        : 'bg-slate-900/90 border-cyan-500/30 text-cyan-300 hover:border-cyan-400 hover:text-white backdrop-blur-md shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                    }`}
                    title={`Compás ${mIdx + 1} (Clic para enfocar)`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isMeasurePlaying ? 'bg-cyan-300 animate-ping' : 'bg-cyan-400'
                      }`}
                    />
                    <span>Compás {mIdx + 1}</span>
                  </button>

                  {measures.length > 1 && onRemoveMeasure && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveMeasure(mIdx);
                      }}
                      className="opacity-0 group-hover/stave-hdr:opacity-100 p-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-400 hover:border-rose-500/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                      title={`Eliminar Compás C${mIdx + 1}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

          {/* Ground Anchor Visual Guides for Syncopation Drill (Sin líneas punteadas que crucen el pentagrama) */}
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
                      top: `${pos.staffTopY - 24}px`,
                    }}
                  >
                    {/* Ground Anchor Pill Badge */}
                    <div
                      className={`px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border transition-all duration-75 flex items-center gap-1 ${
                        isBeatActive
                          ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_14px_#f59e0b] scale-110'
                          : 'bg-slate-900/90 border-amber-500/50 text-amber-300/90 shadow-sm'
                      }`}
                      title={`Tiempo a tierra ${pos.beatIndex + 1} silenciado por síncopa (referencia de anclaje)`}
                    >
                      <span>⚓</span>
                      <span>T{pos.beatIndex + 1}</span>
                      <span className="text-[8px] opacity-75 font-normal">Tierra</span>
                    </div>
                  </div>
                );
              })}

          {/* Interactive Step Click Zones, Note Hits & Floating Badges */}
          {notePositions.map((pos) => {
            const isSelected =
              pos.measureIndex === selectedMeasureIndex &&
              pos.beatIndex === selectedBeatIndex &&
              pos.stepIndex === selectedStepIndex;

            const isPlayheadHere =
              isPlaying &&
              (activeHitKey !== null
                ? activeHitKey === `${pos.measureIndex}-${pos.beatIndex}-${pos.stepIndex}`
                : pos.measureIndex === playhead.measureIndex &&
                  pos.beatIndex === playhead.beatIndex &&
                  pos.stepIndex === playhead.stepIndex);

            const stepData =
              measures[pos.measureIndex]?.beats[pos.beatIndex]?.steps[pos.stepIndex];
            const hasHits = stepData && stepData.hits && stepData.hits.length > 0;
            const hasAccent = Boolean(
              (stepData as any)?.accent || (stepData?.hits && stepData.hits.some((h) => h.accent))
            );
            const rawSticking = stepData?.sticking || stepData?.hits?.find((h) => h.sticking)?.sticking;
            const sticking = rawSticking ? String(rawSticking).trim().toUpperCase() : null;

            return (
              <React.Fragment key={`step-pos-group-${pos.measureIndex}-${pos.beatIndex}-${pos.stepIndex}`}>
                {/* Floating Accent Arrow (Neon Gold #F59E0B): Margin limpio por encima del pentagrama (staffTopY - 18px) */}
                {hasAccent && (
                  <div
                    className="absolute -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center transition-transform"
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.staffTopY - 18}px`,
                    }}
                  >
                    <span
                      className={`font-black text-base select-none leading-none transition-all ${
                        isPlayheadHere
                          ? 'text-amber-300 scale-125 drop-shadow-[0_0_14px_rgba(251,191,36,1)]'
                          : 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.85)]'
                      }`}
                    >
                      &gt;
                    </span>
                  </div>
                )}

                {/* Modern Sticking Chip (Floating R / L / B / K Badge): Estrictamente DEBAJO del pentagrama (staffBottomY + 32px) */}
                {sticking && (
                  <div
                    className="absolute -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center transition-all duration-75 select-none"
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.staffBottomY + 32}px`,
                    }}
                  >
                    {sticking === 'R' ? (
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-sm transition-all duration-75 select-none ${
                          isPlayheadHere
                            ? 'bg-cyan-400/50 border-2 border-cyan-300 text-white font-black scale-110 shadow-[0_0_16px_rgba(34,211,238,0.9)] brightness-125'
                            : 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        }`}
                      >
                        R
                      </span>
                    ) : sticking === 'L' ? (
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-sm transition-all duration-75 select-none ${
                          isPlayheadHere
                            ? 'bg-fuchsia-400/50 border-2 border-fuchsia-300 text-white font-black scale-110 shadow-[0_0_16px_rgba(217,70,239,0.9)] brightness-125'
                            : 'bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-300 shadow-[0_0_8px_rgba(217,70,239,0.3)]'
                        }`}
                      >
                        L
                      </span>
                    ) : sticking === 'B' ? (
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-sm transition-all duration-75 select-none ${
                          isPlayheadHere
                            ? 'bg-amber-400/50 border-2 border-amber-300 text-white font-black scale-110 shadow-[0_0_16px_rgba(245,158,11,0.9)] brightness-125'
                            : 'bg-amber-500/20 border border-amber-400/50 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                        }`}
                      >
                        B
                      </span>
                    ) : sticking === 'K' ? (
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-sm transition-all duration-75 select-none ${
                          isPlayheadHere
                            ? 'bg-emerald-400/50 border-2 border-emerald-300 text-white font-black scale-110 shadow-[0_0_16px_rgba(16,185,129,0.9)] brightness-125'
                            : 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        }`}
                      >
                        K
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-600/50 text-slate-300 font-extrabold text-sm shadow-[0_0_8px_rgba(148,163,184,0.2)]">
                        {sticking}
                      </span>
                    )}
                  </div>
                )}

                {/* Interactive Click Zone / Hitbox (Sin caja B1 tosca ni indicadores compitiendo) */}
                <div
                  onClick={() => onSelectStep(pos.measureIndex, pos.beatIndex, pos.stepIndex)}
                  className={`group absolute -translate-x-1/2 cursor-pointer transition-colors flex flex-col items-center justify-between ${
                    isSelected ? 'z-20' : 'z-10 hover:bg-white/[0.04]'
                  }`}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.staffTopY - 24}px`,
                    height: `${pos.staffBottomY - pos.staffTopY + 84}px`,
                    width: `${Math.max(28, pos.width * 0.9)}px`,
                  }}
                >
                  {/* Subtle Selection Outline (Only when manually selected by user) */}
                  {isSelected && (
                    <div className="absolute inset-y-1 inset-x-0 border-2 border-cyan-400/80 bg-cyan-400/10 rounded-xl shadow-[0_0_14px_rgba(34,211,238,0.35)] pointer-events-none" />
                  )}

                  {/* Active Note Hit Pulse: Flash de impacto sutil y aura al momento exacto del golpe */}
                  {isPlayheadHere && hasHits && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-25"
                      style={{
                        top: `${(pos.staffTopY + pos.staffBottomY) / 2 - (pos.staffTopY - 24)}px`,
                      }}
                    >
                      <div className="w-9 h-9 rounded-full bg-cyan-400/35 border border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.9)] animate-ping" />
                      <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white shadow-[0_0_14px_#ffffff] scale-110" />
                    </div>
                  )}

                  {/* Hits Summary Tag on Hover */}
                  {hasHits && (
                    <div className="opacity-0 group-hover:opacity-100 absolute -bottom-2 bg-slate-900/95 border border-slate-700/80 rounded px-1.5 py-0.5 text-[9px] font-mono text-cyan-300 shadow-md whitespace-nowrap pointer-events-none transition-opacity z-30">
                      {stepData.hits.map((h) => DRUM_PIECES[h.pieceId]?.shortName || h.pieceId).join('+')}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}

          {/* Continuous GPU-Accelerated Single Laser Playhead (Runway Mode) */}
          {isRunway && (
            <div
              ref={laserRef}
              className={`absolute top-0 left-0 pointer-events-none z-30 transition-opacity duration-150 ${
                isPlaying || (getTransportSeconds && getTransportSeconds() > 0.01) ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                transform: 'translate3d(20px, 0, 0)',
                height: `${Math.max(260, totalHeight + 10)}px`,
                willChange: 'transform',
              }}
            >
              {/* Single Laser Core Beam (Fine 2.5px neon cyan line) */}
              <div className="w-[2.5px] h-full bg-cyan-400 shadow-[0_0_12px_#22d3ee,0_0_24px_rgba(34,211,238,0.6)]" />
              {/* Top Cyan Diamond Pointer Moving Through Timeline Ruler */}
              <div className="absolute -top-1.5 -left-[4.75px] w-3 h-3 rotate-45 bg-cyan-300 border border-white shadow-[0_0_12px_#22d3ee]" />
              {/* Reading Core Spark Dot at Stave Center */}
              <div className="absolute top-[134px] -left-[2.75px] w-2 h-2 rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
            </div>
          )}

          {/* Discrete Step Single Laser Playhead (Paginated Mode) */}
          {!isRunway && isPlaying && activePlayheadPos && (
            <div
              className="absolute -translate-x-1/2 pointer-events-none z-30 transition-all duration-75 ease-linear"
              style={{
                left: `${activePlayheadPos.x}px`,
                top: `${activePlayheadPos.staffTopY - 26}px`,
                height: `${activePlayheadPos.staffBottomY - activePlayheadPos.staffTopY + 84}px`,
              }}
            >
              {/* Single Laser Core Beam */}
              <div className="w-[2.5px] h-full bg-cyan-400 shadow-[0_0_12px_#22d3ee,0_0_24px_rgba(34,211,238,0.6)]" />
              {/* Laser Top Rombo Pointer */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-cyan-300 border border-white shadow-[0_0_12px_#22d3ee]" />
            </div>
          )}
        </div>
      </div>

      {/* Selected Step Mini Inspector Footer */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-800 dark:text-gray-300 font-semibold">Cursor activo:</span>
          <span className="font-mono text-cyan-800 dark:text-synth-cyan font-bold">
            Compás {selectedMeasureIndex + 1} • Tiempo {selectedBeatIndex + 1} • Subdivisión{' '}
            {selectedStepIndex + 1}/{selectedBeat?.subdivision || 4}
          </span>
          {selectedBeat?.isTuplet && (
            <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-500/20 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 text-[10px] font-mono font-bold">
              Tuplet {selectedBeat.tupletRatio ? `${selectedBeat.tupletRatio[0]}:${selectedBeat.tupletRatio[1]}` : ''}
            </span>
          )}
          {(selectedStep?.tiedToNext || selectedStep?.tiedFromPrev || selectedStep?.isSyncopated) && (
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[10px] font-mono font-bold flex items-center gap-1">
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
              <span className="text-slate-600 dark:text-gray-400 font-medium">Notas:</span>
              {selectedStep.hits.map((h: { pieceId: DrumPieceId; accent?: boolean; ghost?: boolean }, i: number) => {
                const piece = DRUM_PIECES[h.pieceId];
                return (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${piece?.badgeBg} ${piece?.badgeBorder} text-white flex items-center gap-1`}
                  >
                    <span>{piece?.shortName || h.pieceId}</span>
                    {h.accent && <span className="text-amber-300 font-bold">&gt;</span>}
                    {h.ghost && <span className="text-purple-200">(g)</span>}
                  </span>
                );
              })}
            </div>
          ) : (
            <span className="text-slate-500 dark:text-gray-400 italic">Silencio (pulsa K, S, H, C, R, T o F para añadir)</span>
          )}
        </div>
      </div>
    </div>
  );
}
