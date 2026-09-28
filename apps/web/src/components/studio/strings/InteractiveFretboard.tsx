'use client';

import React, { useMemo } from 'react';
import {
  InstrumentType,
  TuningId,
  FretboardOverlayMode,
  TheoryMode,
  MusicalKey,
  ScaleType,
  ChordType,
} from '@/types/strings';
import { calculateFretNote, stringsAudioEngine } from '@/services/audio/stringsAudioEngine';

export interface ActiveFretHit {
  stringIndex: number; // 0 to N-1
  fret: number; // 0 to 24
  articulation?: string;
}

interface InteractiveFretboardProps {
  instrument: InstrumentType;
  tuning: TuningId;
  overlayMode: FretboardOverlayMode;
  theoryMode?: TheoryMode;
  musicalKey: MusicalKey;
  scaleType: ScaleType;
  chordType?: ChordType;
  activeHits?: ActiveFretHit[];
  onFretClick?: (stringIndex: number, fret: number) => void;
  className?: string;
}

// Semitone distances from chromatic C
const CHROMATIC_INDEX: Record<string, number> = {
  C: 0,
  'C#': 1,
  DB: 1,
  D: 2,
  'D#': 3,
  EB: 3,
  E: 4,
  F: 5,
  'F#': 6,
  GB: 6,
  G: 7,
  'G#': 8,
  AB: 8,
  A: 9,
  'A#': 10,
  BB: 10,
  B: 11,
};

// Interval function names
const INTERVAL_NAMES: Record<number, string> = {
  0: 'R',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3M',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7M',
};

// Scale formulas (semitone offsets from root)
export const SCALE_SEMITONES: Record<ScaleType, number[]> = {
  minor_pentatonic: [0, 3, 5, 7, 10],
  major_pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
};

// Chord / Arpeggio formulas (semitone offsets from root)
export const CHORD_SEMITONES: Record<ChordType, number[]> = {
  major: [0, 4, 7], // 1, 3, 5
  minor: [0, 3, 7], // 1, b3, 5
  dom7: [0, 4, 7, 10], // 1, 3, 5, b7
  maj7: [0, 4, 7, 11], // 1, 3, 5, 7
  m7: [0, 3, 7, 10], // 1, b3, 5, b7
  m7b5: [0, 3, 6, 10], // 1, b3, b5, b7
  sus4: [0, 5, 7], // 1, 4, 5
  sus2: [0, 2, 7], // 1, 2, 5
};

// Key frets that have pearl inlays or rule highlights
const KEY_FRETS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
const SINGLE_DOT_FRETS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOT_FRETS = [12, 24];

// Instrument String Configurations (Ordered from Top string to Bottom string on Fretboard)
export function getInstrumentStrings(
  instrument: InstrumentType,
  tuning: TuningId
): { name: string; basePitch: string; gauge: number }[] {
  if (instrument === 'bass_4') {
    if (tuning === 'drop_d') {
      return [
        { name: 'G', basePitch: 'G2', gauge: 1.5 },
        { name: 'D', basePitch: 'D2', gauge: 2.2 },
        { name: 'A', basePitch: 'A1', gauge: 3.0 },
        { name: 'D', basePitch: 'D1', gauge: 4.2 },
      ];
    }
    if (tuning === 'half_step_down') {
      return [
        { name: 'Gb', basePitch: 'F#2', gauge: 1.5 },
        { name: 'Db', basePitch: 'C#2', gauge: 2.2 },
        { name: 'Ab', basePitch: 'G#1', gauge: 3.0 },
        { name: 'Eb', basePitch: 'D#1', gauge: 4.0 },
      ];
    }
    // Standard 4-string bass: G D A E
    return [
      { name: 'G', basePitch: 'G2', gauge: 1.5 },
      { name: 'D', basePitch: 'D2', gauge: 2.2 },
      { name: 'A', basePitch: 'A1', gauge: 3.0 },
      { name: 'E', basePitch: 'E1', gauge: 4.0 },
    ];
  }

  if (instrument === 'bass_5') {
    if (tuning === 'half_step_down') {
      return [
        { name: 'Gb', basePitch: 'F#2', gauge: 1.5 },
        { name: 'Db', basePitch: 'C#2', gauge: 2.2 },
        { name: 'Ab', basePitch: 'G#1', gauge: 3.0 },
        { name: 'Eb', basePitch: 'D#1', gauge: 4.0 },
        { name: 'Bb', basePitch: 'A#0', gauge: 5.0 },
      ];
    }
    // 5-string bass: G D A E B
    return [
      { name: 'G', basePitch: 'G2', gauge: 1.5 },
      { name: 'D', basePitch: 'D2', gauge: 2.2 },
      { name: 'A', basePitch: 'A1', gauge: 3.0 },
      { name: 'E', basePitch: 'E1', gauge: 4.0 },
      { name: 'B', basePitch: 'B0', gauge: 5.0 },
    ];
  }

  // guitar_6: e B G D A E
  if (tuning === 'drop_d') {
    return [
      { name: 'e', basePitch: 'E4', gauge: 1.0 },
      { name: 'B', basePitch: 'B3', gauge: 1.2 },
      { name: 'G', basePitch: 'G3', gauge: 1.5 },
      { name: 'D', basePitch: 'D3', gauge: 2.0 },
      { name: 'A', basePitch: 'A2', gauge: 2.5 },
      { name: 'D', basePitch: 'D2', gauge: 3.0 },
    ];
  }
  if (tuning === 'half_step_down') {
    return [
      { name: 'eb', basePitch: 'D#4', gauge: 1.0 },
      { name: 'Bb', basePitch: 'A#3', gauge: 1.2 },
      { name: 'Gb', basePitch: 'F#3', gauge: 1.5 },
      { name: 'Db', basePitch: 'C#3', gauge: 2.0 },
      { name: 'Ab', basePitch: 'G#2', gauge: 2.5 },
      { name: 'Eb', basePitch: 'D#2', gauge: 3.0 },
    ];
  }
  return [
    { name: 'e', basePitch: 'E4', gauge: 1.0 },
    { name: 'B', basePitch: 'B3', gauge: 1.2 },
    { name: 'G', basePitch: 'G3', gauge: 1.5 },
    { name: 'D', basePitch: 'D3', gauge: 2.0 },
    { name: 'A', basePitch: 'A2', gauge: 2.5 },
    { name: 'E', basePitch: 'E2', gauge: 3.0 },
  ];
}

export default function InteractiveFretboard({
  instrument,
  tuning,
  overlayMode,
  theoryMode = 'scale',
  musicalKey,
  scaleType,
  chordType = 'major',
  activeHits = [],
  onFretClick,
  className = '',
}: InteractiveFretboardProps) {
  const stringsConfig = useMemo(() => getInstrumentStrings(instrument, tuning), [instrument, tuning]);
  const numStrings = stringsConfig.length;
  const numFrets = 24;

  // Real exponential fret spacing calculation
  // Standard luthiery formula: d = L * (1 - 2^(-n / 17.817))
  const nutX = 72;
  const fretXPositions = useMemo(() => {
    const scaleLength = 2300;
    const positions: number[] = [nutX]; // Fret 0 at nutX

    for (let f = 1; f <= numFrets; f++) {
      const distanceRatio = 1 - Math.pow(2, -f / 17.817);
      const x = nutX + distanceRatio * scaleLength;
      positions.push(Math.round(x));
    }
    return positions;
  }, [numFrets]);

  const fretboardWidth = 1520;
  const svgHeight = 220;

  // Board vertical limits
  const boardTopY = 28;
  const boardBottomY = 192;
  const boardHeight = boardBottomY - boardTopY;
  const boardCenterY = (boardTopY + boardBottomY) / 2;

  // Ruler vertical positions
  const topRulerY = 17;
  const bottomRulerY = 208;

  // String vertical positions (proportional within board height)
  const stringYPositions = useMemo(() => {
    if (numStrings === 4) {
      const pad = 26;
      const step = (boardHeight - pad * 2) / 3;
      return [
        boardTopY + pad,
        boardTopY + pad + step,
        boardTopY + pad + step * 2,
        boardTopY + pad + step * 3,
      ];
    }
    if (numStrings === 5) {
      const pad = 22;
      const step = (boardHeight - pad * 2) / 4;
      return [
        boardTopY + pad,
        boardTopY + pad + step,
        boardTopY + pad + step * 2,
        boardTopY + pad + step * 3,
        boardTopY + pad + step * 4,
      ];
    }
    // 6 strings
    const pad = 18;
    const step = (boardHeight - pad * 2) / 5;
    return [
      boardTopY + pad,
      boardTopY + pad + step,
      boardTopY + pad + step * 2,
      boardTopY + pad + step * 3,
      boardTopY + pad + step * 4,
      boardTopY + pad + step * 5,
    ];
  }, [numStrings, boardHeight, boardTopY]);

  // Root note index
  const rootIndex = CHROMATIC_INDEX[musicalKey] ?? 0;

  // Active semitones according to theory mode
  const activeSemitones = useMemo(() => {
    if (theoryMode === 'scale') {
      return SCALE_SEMITONES[scaleType] || SCALE_SEMITONES.minor_pentatonic;
    }
    if (theoryMode === 'chord') {
      return CHORD_SEMITONES[chordType] || CHORD_SEMITONES.major;
    }
    // 'free' mode: all 12 chromatic semitones
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }, [theoryMode, scaleType, chordType]);

  // Audio audition handler on fret click
  const handleFretInteraction = (stringIdx: number, fret: number) => {
    const stringDef = stringsConfig[stringIdx];
    if (!stringDef) return;
    const noteInfo = calculateFretNote(stringDef.basePitch, fret);
    stringsAudioEngine.playNote(instrument, noteInfo.fullNote, 'normal');
    if (onFretClick) {
      onFretClick(stringIdx, fret);
    }
  };

  // Center X for any fret slot (0 to 24)
  const getFretSlotCenterX = (fret: number) => {
    if (fret === 0) {
      return (14 + nutX) / 2; // Midpoint between headstock edge and nut
    }
    return (fretXPositions[fret - 1] + fretXPositions[fret]) / 2;
  };

  return (
    <div className={`w-full overflow-x-auto custom-scrollbar py-4 bg-[#0a0f1d] border border-white/10 rounded-2xl shadow-inner ${className}`}>
      <div style={{ minWidth: `${fretboardWidth}px` }} className="relative mx-auto px-4 select-none">
        <svg
          viewBox={`0 0 ${fretboardWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* ======================================================= */}
            {/* 1. ACABADO REALISTA DE MADERA (Palisandro / Rosewood)   */}
            {/* ======================================================= */}
            <linearGradient id="rosewoodWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#382216" />
              <stop offset="50%" stopColor="#2b1910" />
              <stop offset="100%" stopColor="#1e110a" />
            </linearGradient>

            {/* Headstock dark finish */}
            <linearGradient id="headstockWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#24140a" />
              <stop offset="100%" stopColor="#140a05" />
            </linearGradient>

            {/* Fret wire shadow filter */}
            <filter id="fretWireShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="1" dy="0" stdDeviation="0.6" floodColor="#000000" floodOpacity="0.6" />
            </filter>

            {/* Nut shadow filter */}
            <filter id="nutShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="2" dy="0" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
            </filter>

            {/* Metallic String Gradient */}
            <linearGradient id="stringMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="45%" stopColor="#f8fafc" />
              <stop offset="85%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Glowing active sequencer hit */}
            <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Amber Root Glow */}
            <filter id="amberRootGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#f59e0b" floodOpacity="0.85" />
            </filter>

            {/* Electric Cyan Scale Glow */}
            <filter id="cyanScaleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.8" floodColor="#06b6d4" floodOpacity="0.75" />
            </filter>
          </defs>

          {/* ======================================================= */}
          {/* CUERPO DEL DIAPASÓN Y RIBETES (BINDING)                  */}
          {/* ======================================================= */}

          {/* Headstock Area (Pala) */}
          <rect
            x={10}
            y={boardTopY}
            width={nutX - 10}
            height={boardHeight}
            rx={4}
            fill="url(#headstockWood)"
            stroke="#1c0f07"
            strokeWidth="1.2"
          />

          {/* Fretboard Wooden Neck Slab (Rosewood / Palisandro) */}
          <rect
            x={nutX}
            y={boardTopY}
            width={fretXPositions[numFrets] - nutX + 16}
            height={boardHeight}
            rx={3}
            fill="url(#rosewoodWood)"
            stroke="#1e110a"
            strokeWidth="1.5"
          />

          {/* Ribete (Binding) color crema/marfil superior e inferior */}
          <line
            x1={nutX}
            y1={boardTopY}
            x2={fretXPositions[numFrets] + 16}
            y2={boardTopY}
            stroke="#fef3c7"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <line
            x1={nutX}
            y1={boardBottomY}
            x2={fretXPositions[numFrets] + 16}
            y2={boardBottomY}
            stroke="#fef3c7"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />

          {/* ======================================================= */}
          {/* MARCADORES DE POSICIÓN PERLADOS (INLAYS / DOTS)          */}
          {/* ======================================================= */}

          {/* Single Dots (Trastes 3, 5, 7, 9, 15, 17, 19, 21) */}
          {SINGLE_DOT_FRETS.map((fret) => {
            const midX = getFretSlotCenterX(fret);
            return (
              <circle
                key={`single-dot-${fret}`}
                cx={midX}
                cy={boardCenterY}
                r={5}
                fill="#e2e8f0"
                opacity={0.75}
                stroke="#94a3b8"
                strokeWidth="0.8"
              />
            );
          })}

          {/* Double Dots (Trastes 12 y 24) */}
          {DOUBLE_DOT_FRETS.map((fret) => {
            const midX = getFretSlotCenterX(fret);
            const dotY1 = boardTopY + boardHeight * 0.3;
            const dotY2 = boardTopY + boardHeight * 0.7;

            return (
              <g key={`double-dot-${fret}`}>
                <circle
                  cx={midX}
                  cy={dotY1}
                  r={4.2}
                  fill="#e2e8f0"
                  opacity={0.75}
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                />
                <circle
                  cx={midX}
                  cy={dotY2}
                  r={4.2}
                  fill="#e2e8f0"
                  opacity={0.75}
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                />
              </g>
            );
          })}

          {/* ======================================================= */}
          {/* TRASTES METÁLICOS NIQUELADOS Y CEJUELA                   */}
          {/* ======================================================= */}

          {/* Fret Wires (Trastes 1 al 24) */}
          {fretXPositions.map((x, f) => {
            if (f === 0) return null; // Nut rendered below
            const isOctaveFret = f === 12 || f === 24;

            return (
              <g key={`fret-wire-${f}`}>
                {/* Main nickel fret wire with subtle shadow */}
                <line
                  x1={x}
                  y1={boardTopY}
                  x2={x}
                  y2={boardBottomY}
                  stroke="#cbd5e1"
                  strokeWidth={isOctaveFret ? 2.8 : 2.2}
                  strokeLinecap="round"
                  filter="url(#fretWireShadow)"
                />
                {/* Specular line highlight */}
                <line
                  x1={x - 0.4}
                  y1={boardTopY + 2}
                  x2={x - 0.4}
                  y2={boardBottomY - 2}
                  stroke="#ffffff"
                  strokeWidth="0.7"
                  opacity={0.7}
                />
              </g>
            );
          })}

          {/* Cejuela (Nut / Traste 0): Color hueso / marfil con sombra */}
          <line
            x1={nutX}
            y1={boardTopY}
            x2={nutX}
            y2={boardBottomY}
            stroke="#f5efe6"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#nutShadow)"
          />
          {/* Cejuela specular accent */}
          <line
            x1={nutX - 1.5}
            y1={boardTopY + 3}
            x2={nutX - 1.5}
            y2={boardBottomY - 3}
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.65}
          />

          {/* ======================================================= */}
          {/* REGLA NUMÉRICA SUPERIOR E INFERIOR (0 AL 24)             */}
          {/* ======================================================= */}
          {Array.from({ length: numFrets + 1 }).map((_, f) => {
            const midX = getFretSlotCenterX(f);
            const isKeyFret = KEY_FRETS.includes(f);
            const isOctave = f === 12 || f === 24;

            let textColor = '#94a3b8';
            if (isOctave) {
              textColor = '#f59e0b'; // Amber for Octaves
            } else if (isKeyFret) {
              textColor = '#38bdf8'; // Sky blue for Key Frets
            }

            return (
              <g key={`ruler-number-${f}`}>
                {/* Upper Fret Ruler */}
                <text
                  x={midX}
                  y={topRulerY}
                  fill={textColor}
                  fontSize="11"
                  fontWeight={isKeyFret ? 'bold' : '600'}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  textAnchor="middle"
                >
                  {f}
                </text>

                {/* Lower Fret Ruler */}
                <text
                  x={midX}
                  y={bottomRulerY}
                  fill={textColor}
                  fontSize="11"
                  fontWeight={isKeyFret ? 'bold' : '600'}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  textAnchor="middle"
                >
                  {f}
                </text>
              </g>
            );
          })}

          {/* ======================================================= */}
          {/* CUERDAS HORIZONTALES CON CALIBRE REAL                    */}
          {/* ======================================================= */}
          {stringsConfig.map((str, sIdx) => {
            const stringY = stringYPositions[sIdx];

            return (
              <g key={`string-line-${sIdx}`}>
                {/* String shadow on wood */}
                <line
                  x1={12}
                  y1={stringY + str.gauge * 0.4}
                  x2={fretXPositions[numFrets] + 16}
                  y2={stringY + str.gauge * 0.4}
                  stroke="#050811"
                  strokeWidth={str.gauge + 1.2}
                  opacity={0.65}
                />
                {/* Continuous metallic string wire */}
                <line
                  x1={12}
                  y1={stringY}
                  x2={fretXPositions[numFrets] + 16}
                  y2={stringY}
                  stroke="url(#stringMetallic)"
                  strokeWidth={str.gauge}
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {/* ======================================================= */}
          {/* NOTAS Y LÓGICA DE ILUMINACIÓN REACTIVA                  */}
          {/* ======================================================= */}
          {stringsConfig.map((str, sIdx) => {
            const stringY = stringYPositions[sIdx];
            const slotHeight =
              numStrings === 4 ? 37 : numStrings === 5 ? 30 : 25;

            return (
              <g key={`fret-notes-${sIdx}`}>
                {Array.from({ length: numFrets + 1 }).map((_, fret) => {
                  const x1 = fret === 0 ? 10 : fretXPositions[fret - 1];
                  const x2 = fret === 0 ? nutX : fretXPositions[fret];
                  const noteX = getFretSlotCenterX(fret);

                  const noteInfo = calculateFretNote(str.basePitch, fret);
                  const noteDistance =
                    (CHROMATIC_INDEX[noteInfo.noteName] - rootIndex + 12) % 12;

                  const isSelectedTheoryNote = activeSemitones.includes(noteDistance);
                  const isRoot = noteDistance === 0;

                  // Active check from sequencer playhead
                  const isActive = activeHits.some(
                    (hit) => hit.stringIndex === sIdx && hit.fret === fret
                  );

                  // Suggested fingering (1 to 4)
                  const finger = fret === 0 ? 0 : ((fret - 1) % 4) + 1;

                  // Label according to overlay mode
                  let label = noteInfo.noteName;
                  if (overlayMode === 'intervals') {
                    label = INTERVAL_NAMES[noteDistance] || '';
                  } else if (overlayMode === 'fingering') {
                    label = fret === 0 ? '0' : String(finger);
                  }

                  // Determine visibility and badge colors
                  // In scale or chord mode: notes outside are hidden/atenuadas
                  const isHighlighted =
                    theoryMode === 'free'
                      ? true
                      : isSelectedTheoryNote;

                  // Color styling
                  let badgeFill = '#06b6d4'; // Cyan default for scale/chord
                  let badgeStroke = '#22d3ee';
                  let textColor = '#ffffff';
                  let textFontWeight = 'bold';
                  let badgeFilter = 'url(#cyanScaleGlow)';

                  if (isRoot) {
                    // TÓNICA: Círculo ámbar/dorado neón con texto negro
                    badgeFill = '#f59e0b';
                    badgeStroke = '#fcd34d';
                    textColor = '#000000';
                    textFontWeight = '900';
                    badgeFilter = 'url(#amberRootGlow)';
                    if (overlayMode === 'intervals') {
                      label = 'R';
                    }
                  } else if (isActive) {
                    badgeFill = '#38bdf8';
                    badgeStroke = '#ffffff';
                    textColor = '#000000';
                    textFontWeight = '900';
                    badgeFilter = 'url(#activeGlow)';
                  } else if (theoryMode === 'free') {
                    // In free mode, use dark slate styling for non-roots
                    if (!isRoot) {
                      badgeFill = '#1e293b';
                      badgeStroke = '#475569';
                      textColor = '#cbd5e1';
                      textFontWeight = 'bold';
                      badgeFilter = undefined as any;
                    }
                  }

                  return (
                    <g
                      key={`interactive-cell-${sIdx}-${fret}`}
                      className="cursor-pointer group"
                      onClick={() => handleFretInteraction(sIdx, fret)}
                    >
                      <title>{`Cuerda ${str.name} • Traste ${fret} (${noteInfo.fullNote})${isRoot ? ' • [TÓNICA]' : ''}`}</title>

                      {/* Wide clickable slot hitbox */}
                      <rect
                        x={x1}
                        y={stringY - slotHeight / 2}
                        width={Math.max(18, x2 - x1)}
                        height={slotHeight}
                        fill="transparent"
                        className="transition-colors hover:fill-amber-500/10"
                      />

                      {/* Ghost dot or faint placeholder when NOT highlighted in scale mode */}
                      {!isHighlighted && !isActive && (
                        <circle
                          cx={noteX}
                          cy={stringY}
                          r={3}
                          fill="#451a03"
                          opacity={0.25}
                          className="group-hover:opacity-60 transition-opacity"
                        />
                      )}

                      {/* Interactive Illuminated Note Badge */}
                      {isHighlighted && (
                        <g filter={badgeFilter}>
                          {/* Pulsing ring when active in sequencer */}
                          {isActive && (
                            <circle
                              cx={noteX}
                              cy={stringY}
                              r={14}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="1.8"
                              opacity="0.85"
                              className="animate-ping"
                            />
                          )}

                          {/* Note circle badge */}
                          <circle
                            cx={noteX}
                            cy={stringY}
                            r={isRoot || isActive ? 10.5 : 9}
                            fill={badgeFill}
                            stroke={badgeStroke}
                            strokeWidth={isRoot || isActive ? 2.4 : 1.5}
                            className="transition-transform duration-150 group-hover:scale-125"
                          />

                          {/* Note text label */}
                          <text
                            x={noteX}
                            y={stringY + 3.2}
                            fill={textColor}
                            fontSize={label.length > 2 ? '7' : '8.5'}
                            fontWeight={textFontWeight}
                            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            {label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
