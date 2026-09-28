'use client';

import React, { useMemo } from 'react';
import {
  InstrumentType,
  TuningId,
  FretboardOverlayMode,
  MusicalKey,
  ScaleType,
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
  musicalKey: MusicalKey;
  scaleType: ScaleType;
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

const INTERVAL_NAMES: Record<number, string> = {
  0: 'R',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'b5',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7',
};

// Scale formulas (semitone offsets from root)
const SCALE_SEMITONES: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  minor_pentatonic: [0, 3, 5, 7, 10],
  major_pentatonic: [0, 2, 4, 7, 9],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  blues: [0, 3, 5, 6, 7, 10],
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
  musicalKey,
  scaleType,
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
      // 4 strings (Bass 4): G, D, A, E
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
      // 5 strings (Bass 5): G, D, A, E, B
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
    // 6 strings (Guitar 6): e, B, G, D, A, E
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

  // Key and scale calculation
  const rootIndex = CHROMATIC_INDEX[musicalKey] ?? 0;
  const scaleSemitones = SCALE_SEMITONES[scaleType] || SCALE_SEMITONES.minor_pentatonic;

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
            {/* Dark Ebony / Rosewood Fretboard Wood Finish */}
            <linearGradient id="fretboardWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#121826" />
              <stop offset="35%" stopColor="#182236" />
              <stop offset="70%" stopColor="#141c2d" />
              <stop offset="100%" stopColor="#0f1523" />
            </linearGradient>

            {/* Headstock dark wood */}
            <linearGradient id="headstockWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0b101c" />
              <stop offset="100%" stopColor="#080c15" />
            </linearGradient>

            {/* Metallic Fret Wire Gradient */}
            <linearGradient id="fretWireGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Mother of Pearl Inlay Radial Gradient */}
            <radialGradient id="pearlInlay" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#94a3b8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#475569" stopOpacity="0.9" />
            </radialGradient>

            {/* Double dot pearl inlay */}
            <radialGradient id="pearlInlayDouble" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.9" />
            </radialGradient>

            {/* Metallic String Gradients */}
            <linearGradient id="stringMetallic" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="45%" stopColor="#f8fafc" />
              <stop offset="85%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Glowing active note filter */}
            <filter id="activeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Cyan Root Note Glow */}
            <filter id="rootGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ======================================================= */}
          {/* 1. ESTRUCTURA BASE Y FONDOS DEL DIAPASÓN                */}
          {/* ======================================================= */}

          {/* Headstock Area (Traste 0 / Cejuela Zone) */}
          <rect
            x={10}
            y={boardTopY}
            width={nutX - 10}
            height={boardHeight}
            rx={4}
            fill="url(#headstockWood)"
            stroke="#1e293b"
            strokeWidth="1.2"
          />

          {/* Fretboard Wooden Neck Slab (Ebony / Palisandro) */}
          <rect
            x={nutX}
            y={boardTopY}
            width={fretXPositions[numFrets] - nutX + 16}
            height={boardHeight}
            rx={4}
            fill="url(#fretboardWood)"
            stroke="#1e293b"
            strokeWidth="1.5"
          />

          {/* Subtle Fretboard Top and Bottom Binding */}
          <line
            x1={nutX}
            y1={boardTopY}
            x2={fretXPositions[numFrets] + 16}
            y2={boardTopY}
            stroke="#334155"
            strokeWidth="2"
          />
          <line
            x1={nutX}
            y1={boardBottomY}
            x2={fretXPositions[numFrets] + 16}
            y2={boardBottomY}
            stroke="#334155"
            strokeWidth="2"
          />

          {/* ======================================================= */}
          {/* 2. INLAYS / MARCADORES DE POSICIÓN PERLADOS (DOTS)       */}
          {/* ======================================================= */}

          {/* Single Pearl Dots (Trastes 3, 5, 7, 9, 15, 17, 19, 21) */}
          {SINGLE_DOT_FRETS.map((fret) => {
            const midX = getFretSlotCenterX(fret);
            return (
              <circle
                key={`single-dot-${fret}`}
                cx={midX}
                cy={boardCenterY}
                r={5}
                fill="url(#pearlInlay)"
                stroke="#334155"
                strokeWidth="1"
                opacity={0.8}
              />
            );
          })}

          {/* Double Pearl Dots (Trastes 12 y 24) */}
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
                  fill="url(#pearlInlayDouble)"
                  stroke="#0284c7"
                  strokeWidth="1"
                  opacity={0.85}
                />
                <circle
                  cx={midX}
                  cy={dotY2}
                  r={4.2}
                  fill="url(#pearlInlayDouble)"
                  stroke="#0284c7"
                  strokeWidth="1"
                  opacity={0.85}
                />
              </g>
            );
          })}

          {/* ======================================================= */}
          {/* 3. CEJUELA Y TRASTES METÁLICOS (FRET WIRES 1 AL 24)     */}
          {/* ======================================================= */}

          {/* Fret Wires (Trastes 1 a 24) */}
          {fretXPositions.map((x, f) => {
            if (f === 0) return null; // Nut rendered separately below
            const isOctaveFret = f === 12 || f === 24;

            return (
              <g key={`fret-wire-${f}`}>
                {/* Main metallic fret wire */}
                <line
                  x1={x}
                  y1={boardTopY}
                  x2={x}
                  y2={boardBottomY}
                  stroke={isOctaveFret ? '#64748b' : '#475569'}
                  strokeWidth={isOctaveFret ? 2.8 : 2.2}
                  strokeLinecap="round"
                />
                {/* Fret specular highlight */}
                <line
                  x1={x - 0.5}
                  y1={boardTopY + 2}
                  x2={x - 0.5}
                  y2={boardBottomY - 2}
                  stroke="#cbd5e1"
                  strokeWidth="0.8"
                  opacity={0.65}
                />
              </g>
            );
          })}

          {/* Cejuela (Traste 0 / Nut): Barra vertical gruesa */}
          <line
            x1={nutX}
            y1={boardTopY}
            x2={nutX}
            y2={boardBottomY}
            stroke="#f1f5f9"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Cejuela highlight sutil */}
          <line
            x1={nutX - 1.5}
            y1={boardTopY + 3}
            x2={nutX - 1.5}
            y2={boardBottomY - 3}
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.7}
          />

          {/* ======================================================= */}
          {/* 4. REGLA NUMÉRICA SUPERIOR E INFERIOR (0 AL 24)         */}
          {/* ======================================================= */}
          {Array.from({ length: numFrets + 1 }).map((_, f) => {
            const midX = getFretSlotCenterX(f);
            const isKeyFret = KEY_FRETS.includes(f);
            const isOctave = f === 12 || f === 24;

            // Highlight colors for ruler
            let textColor = '#94a3b8';
            if (isOctave) {
              textColor = '#22d3ee'; // Bright Cyan for Octaves
            } else if (isKeyFret) {
              textColor = '#38bdf8'; // Sky Blue for Key Frets
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
          {/* 5. CUERDAS HORIZONTALES CON CALIBRE REAL                */}
          {/* ======================================================= */}
          {stringsConfig.map((str, sIdx) => {
            const stringY = stringYPositions[sIdx];

            return (
              <g key={`string-line-${sIdx}`}>
                {/* String Drop Shadow on Wood */}
                <line
                  x1={12}
                  y1={stringY + str.gauge * 0.4}
                  x2={fretXPositions[numFrets] + 16}
                  y2={stringY + str.gauge * 0.4}
                  stroke="#050811"
                  strokeWidth={str.gauge + 1.2}
                  opacity={0.65}
                />
                {/* Continuous Metallic String Wire */}
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
          {/* 6. NOTAS Y PUNTOS INTERACTIVOS (POR CASILLA DE TRASTE)  */}
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
                  const isScaleNote = scaleSemitones.includes(noteDistance);
                  const isRoot = noteDistance === 0;

                  // Active check from sequencer playhead
                  const isActive = activeHits.some(
                    (hit) => hit.stringIndex === sIdx && hit.fret === fret
                  );

                  // Suggested fingering (1 to 4)
                  const finger = fret === 0 ? 0 : ((fret - 1) % 4) + 1;

                  // Text label according to overlay mode
                  let label = noteInfo.noteName;
                  if (overlayMode === 'intervals') {
                    label = INTERVAL_NAMES[noteDistance] || '';
                  } else if (overlayMode === 'fingering') {
                    label = fret === 0 ? '0' : String(finger);
                  }

                  // Badge color logic
                  let badgeFill = '#1e293b';
                  let badgeBorder = '#475569';
                  let textColor = '#e2e8f0';
                  let shouldShowBadge = isScaleNote || isActive || fret === 0;

                  if (isRoot) {
                    badgeFill = '#0891b2'; // Cyan root
                    badgeBorder = '#22d3ee';
                    textColor = '#ffffff';
                  } else if (isScaleNote) {
                    badgeFill = '#1e293b';
                    badgeBorder = '#475569';
                    textColor = '#cbd5e1';
                  }

                  if (isActive) {
                    badgeFill = '#06b6d4'; // Glowing Electric Cyan on hit
                    badgeBorder = '#ffffff';
                    textColor = '#ffffff';
                  }

                  return (
                    <g
                      key={`interactive-cell-${sIdx}-${fret}`}
                      className="cursor-pointer group"
                      onClick={() => handleFretInteraction(sIdx, fret)}
                    >
                      <title>{`Cuerda ${str.name} • Traste ${fret} (${noteInfo.fullNote})`}</title>

                      {/* Wide clickable slot hitbox */}
                      <rect
                        x={x1}
                        y={stringY - slotHeight / 2}
                        width={Math.max(18, x2 - x1)}
                        height={slotHeight}
                        fill="transparent"
                        className="transition-colors hover:fill-cyan-500/10"
                      />

                      {/* Interactive Note Badge */}
                      {shouldShowBadge && (
                        <g filter={isActive ? 'url(#activeGlow)' : isRoot ? 'url(#rootGlow)' : undefined}>
                          {/* Pulsing ring when active */}
                          {isActive && (
                            <circle
                              cx={noteX}
                              cy={stringY}
                              r={13}
                              fill="none"
                              stroke="#22d3ee"
                              strokeWidth="1.5"
                              opacity="0.8"
                              className="animate-ping"
                            />
                          )}

                          {/* Note circle badge */}
                          <circle
                            cx={noteX}
                            cy={stringY}
                            r={isRoot || isActive ? 10 : 8.5}
                            fill={badgeFill}
                            stroke={badgeBorder}
                            strokeWidth={isRoot || isActive ? 2 : 1.2}
                            className="transition-transform duration-150 group-hover:scale-125"
                          />

                          {/* Note text label */}
                          <text
                            x={noteX}
                            y={stringY + 3.2}
                            fill={textColor}
                            fontSize={label.length > 2 ? '7.5' : '9'}
                            fontWeight="bold"
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
