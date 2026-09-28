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

// Instrument String Configurations (Ordered from Top string to Bottom string on Fretboard)
export function getInstrumentStrings(
  instrument: InstrumentType,
  tuning: TuningId
): { name: string; basePitch: string; gauge: number }[] {
  if (instrument === 'bass_4') {
    if (tuning === 'drop_d') {
      return [
        { name: 'G', basePitch: 'G2', gauge: 1.6 },
        { name: 'D', basePitch: 'D2', gauge: 2.4 },
        { name: 'A', basePitch: 'A1', gauge: 3.2 },
        { name: 'D', basePitch: 'D1', gauge: 4.4 },
      ];
    }
    if (tuning === 'half_step_down') {
      return [
        { name: 'Gb', basePitch: 'F#2', gauge: 1.6 },
        { name: 'Db', basePitch: 'C#2', gauge: 2.4 },
        { name: 'Ab', basePitch: 'G#1', gauge: 3.2 },
        { name: 'Eb', basePitch: 'D#1', gauge: 4.2 },
      ];
    }
    // Standard 4-string bass: G D A E
    return [
      { name: 'G', basePitch: 'G2', gauge: 1.6 },
      { name: 'D', basePitch: 'D2', gauge: 2.4 },
      { name: 'A', basePitch: 'A1', gauge: 3.2 },
      { name: 'E', basePitch: 'E1', gauge: 4.2 },
    ];
  }

  if (instrument === 'bass_5') {
    // 5-string bass: G D A E B
    return [
      { name: 'G', basePitch: 'G2', gauge: 1.4 },
      { name: 'D', basePitch: 'D2', gauge: 2.0 },
      { name: 'A', basePitch: 'A1', gauge: 2.8 },
      { name: 'E', basePitch: 'E1', gauge: 3.8 },
      { name: 'B', basePitch: 'B0', gauge: 4.8 },
    ];
  }

  // guitar_6: e B G D A E
  if (tuning === 'drop_d') {
    return [
      { name: 'e', basePitch: 'E4', gauge: 1.0 },
      { name: 'B', basePitch: 'B3', gauge: 1.3 },
      { name: 'G', basePitch: 'G3', gauge: 1.7 },
      { name: 'D', basePitch: 'D3', gauge: 2.3 },
      { name: 'A', basePitch: 'A2', gauge: 3.0 },
      { name: 'D', basePitch: 'D2', gauge: 3.8 },
    ];
  }
  if (tuning === 'half_step_down') {
    return [
      { name: 'eb', basePitch: 'D#4', gauge: 1.0 },
      { name: 'Bb', basePitch: 'A#3', gauge: 1.3 },
      { name: 'Gb', basePitch: 'F#3', gauge: 1.7 },
      { name: 'Db', basePitch: 'C#3', gauge: 2.3 },
      { name: 'Ab', basePitch: 'G#2', gauge: 3.0 },
      { name: 'Eb', basePitch: 'D#2', gauge: 3.8 },
    ];
  }
  return [
    { name: 'e', basePitch: 'E4', gauge: 1.0 },
    { name: 'B', basePitch: 'B3', gauge: 1.3 },
    { name: 'G', basePitch: 'G3', gauge: 1.7 },
    { name: 'D', basePitch: 'D3', gauge: 2.3 },
    { name: 'A', basePitch: 'A2', gauge: 3.0 },
    { name: 'E', basePitch: 'E2', gauge: 3.8 },
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
  // Total fretboard scale length
  const fretXPositions = useMemo(() => {
    const nutX = 54;
    const totalLength = 1180;
    const positions: number[] = [nutX]; // Fret 0 at nutX

    // 1 - 2^(-n/17.817) standard luthiery formula scaled to canvas
    for (let f = 1; f <= numFrets; f++) {
      const distanceRatio = 1 - Math.pow(2, -f / 17.817);
      const x = nutX + distanceRatio * totalLength * 1.38;
      positions.push(Math.round(x));
    }
    return positions;
  }, [numFrets]);

  const fretboardWidth = fretXPositions[numFrets] + 30;
  const stringSpacing = numStrings === 4 ? 30 : numStrings === 5 ? 26 : 24;
  const boardTopY = 22;
  const boardHeight = (numStrings - 1) * stringSpacing + 28;
  const boardBottomY = boardTopY + boardHeight;
  const svgHeight = boardBottomY + 36;

  // Single dot frets: 3, 5, 7, 9, 15, 17, 19, 21
  // Double dot frets: 12, 24
  const singleDotFrets = [3, 5, 7, 9, 15, 17, 19, 21];
  const doubleDotFrets = [12, 24];

  const rootIndex = CHROMATIC_INDEX[musicalKey] ?? 0;
  const scaleSemitones = SCALE_SEMITONES[scaleType] || SCALE_SEMITONES.minor_pentatonic;

  // Handle direct audio audition on fret click
  const handleFretInteraction = (stringIdx: number, fret: number) => {
    const stringDef = stringsConfig[stringIdx];
    if (!stringDef) return;
    const noteInfo = calculateFretNote(stringDef.basePitch, fret);
    stringsAudioEngine.playNote(instrument, noteInfo.fullNote, 'normal');
    if (onFretClick) {
      onFretClick(stringIdx, fret);
    }
  };

  return (
    <div className={`w-full overflow-x-auto custom-scrollbar select-none py-2 ${className}`}>
      <div style={{ minWidth: `${fretboardWidth}px` }} className="relative mx-auto">
        <svg
          viewBox={`0 0 ${fretboardWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dark Rosewood / Ebony Fretboard Wood Gradient */}
            <linearGradient id="fretboardWood" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#121826" />
              <stop offset="50%" stopColor="#1A2333" />
              <stop offset="100%" stopColor="#0F1521" />
            </linearGradient>

            {/* Glowing active note filter */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Fret wire metallic gradient */}
            <linearGradient id="fretWire" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748B" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Metallic string gradient */}
            <linearGradient id="woundString" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
          </defs>

          {/* Fretboard Wooden Neck Slab */}
          <rect
            x={fretXPositions[0]}
            y={boardTopY}
            width={fretXPositions[numFrets] - fretXPositions[0]}
            height={boardHeight}
            rx={6}
            fill="url(#fretboardWood)"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* Fret Position Markers (Pearl Inlays) */}
          {singleDotFrets.map((fret) => {
            const x1 = fretXPositions[fret - 1];
            const x2 = fretXPositions[fret];
            const midX = (x1 + x2) / 2;
            const midY = boardTopY + boardHeight / 2;

            return (
              <circle
                key={`single-dot-${fret}`}
                cx={midX}
                cy={midY}
                r={5.5}
                fill="#334155"
                opacity={0.7}
                stroke="#475569"
                strokeWidth="1"
              />
            );
          })}

          {doubleDotFrets.map((fret) => {
            const x1 = fretXPositions[fret - 1];
            const x2 = fretXPositions[fret];
            const midX = (x1 + x2) / 2;
            const y1 = boardTopY + boardHeight * 0.28;
            const y2 = boardTopY + boardHeight * 0.72;

            return (
              <g key={`double-dot-${fret}`}>
                <circle cx={midX} cy={y1} r={4.5} fill="#38BDF8" opacity={0.5} stroke="#0284C7" strokeWidth="1" />
                <circle cx={midX} cy={y2} r={4.5} fill="#38BDF8" opacity={0.5} stroke="#0284C7" strokeWidth="1" />
              </g>
            );
          })}

          {/* Fret Wires (Trastes metálicos) */}
          {fretXPositions.map((x, f) => {
            if (f === 0) return null; // Nut rendered separately
            const isMarkerFret = singleDotFrets.includes(f) || doubleDotFrets.includes(f);

            return (
              <g key={`fret-wire-${f}`}>
                <line
                  x1={x}
                  y1={boardTopY}
                  x2={x}
                  y2={boardBottomY}
                  stroke="url(#fretWire)"
                  strokeWidth={f === 12 || f === 24 ? 2.5 : 2}
                  strokeLinecap="round"
                />
                {/* Fret number underneath */}
                <text
                  x={x}
                  y={boardBottomY + 18}
                  fill={isMarkerFret ? '#38BDF8' : '#64748B'}
                  fontSize={isMarkerFret ? '10' : '8.5'}
                  fontWeight={isMarkerFret ? 'bold' : 'normal'}
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                >
                  {f}
                </text>
              </g>
            );
          })}

          {/* Bone / Graphite Nut (Cejuela Traste 0) */}
          <rect
            x={fretXPositions[0] - 6}
            y={boardTopY - 2}
            width={7}
            height={boardHeight + 4}
            rx={2}
            fill="#E2E8F0"
            stroke="#94A3B8"
            strokeWidth="1.2"
          />
          <text
            x={fretXPositions[0] - 3}
            y={boardBottomY + 18}
            fill="#94A3B8"
            fontSize="9"
            fontWeight="bold"
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
          >
            0
          </text>

          {/* Instrument Strings and Fretted Notes */}
          {stringsConfig.map((str, sIdx) => {
            const stringY = boardTopY + 14 + sIdx * stringSpacing;

            return (
              <g key={`string-${sIdx}`}>
                {/* String Tuning Head Label on Left */}
                <g
                  className="cursor-pointer group"
                  onClick={() => handleFretInteraction(sIdx, 0)}
                >
                  <title>{`Cuerda ${str.name} al aire (Traste 0)`}</title>
                  <circle cx="22" cy={stringY} r="14" fill="#0E1526" stroke="#334155" strokeWidth="1.5" />
                  <text
                    x="22"
                    y={stringY + 4}
                    fill="#38BDF8"
                    fontSize="11"
                    fontWeight="extrabold"
                    fontFamily="ui-monospace, monospace"
                    textAnchor="middle"
                    className="group-hover:fill-cyan-300 transition-colors"
                  >
                    {str.name}
                  </text>
                </g>

                {/* Physical Metallic String Wire */}
                <line
                  x1={fretXPositions[0]}
                  y1={stringY}
                  x2={fretXPositions[numFrets]}
                  y2={stringY}
                  stroke="url(#woundString)"
                  strokeWidth={str.gauge}
                  opacity={0.9}
                />

                {/* Interactive Clickable Fret Hitboxes across all 0 to 24 frets */}
                {Array.from({ length: numFrets + 1 }).map((_, fret) => {
                  const x1 = fret === 0 ? fretXPositions[0] - 20 : fretXPositions[fret - 1];
                  const x2 = fret === 0 ? fretXPositions[0] : fretXPositions[fret];
                  const noteX = fret === 0 ? fretXPositions[0] - 10 : (x1 + x2) / 2;

                  const noteInfo = calculateFretNote(str.basePitch, fret);
                  const noteDistance = (CHROMATIC_INDEX[noteInfo.noteName] - rootIndex + 12) % 12;
                  const isScaleNote = scaleSemitones.includes(noteDistance);
                  const isRoot = noteDistance === 0;

                  // Check if this fret is currently actively triggered by sequencer playhead
                  const isActive = activeHits.some((hit) => hit.stringIndex === sIdx && hit.fret === fret);

                  // Fingering suggestion (1 to 4)
                  const finger = fret === 0 ? 0 : ((fret - 1) % 4) + 1;

                  // Text to display according to overlay mode
                  let label = noteInfo.noteName;
                  if (overlayMode === 'intervals') {
                    label = INTERVAL_NAMES[noteDistance] || '';
                  } else if (overlayMode === 'fingering') {
                    label = fret === 0 ? '0' : String(finger);
                  }

                  // Visual badges color scheme
                  let badgeFill = '#0F172A';
                  let badgeBorder = '#334155';
                  let textColor = '#64748B';
                  let shouldShowBadge = isScaleNote || isActive || fret === 0;

                  if (isRoot) {
                    badgeFill = '#0891B2'; // Cyan
                    badgeBorder = '#22D3EE';
                    textColor = '#FFFFFF';
                  } else if (isScaleNote) {
                    badgeFill = '#1E293B';
                    badgeBorder = '#475569';
                    textColor = '#CBD5E1';
                  }

                  if (isActive) {
                    badgeFill = '#F59E0B'; // Amber / Gold Glow
                    badgeBorder = '#FCD34D';
                    textColor = '#000000';
                  }

                  return (
                    <g
                      key={`hitbox-${sIdx}-${fret}`}
                      className="cursor-pointer group"
                      onClick={() => handleFretInteraction(sIdx, fret)}
                    >
                      {/* Invisible wider hitbox for touch/click ease */}
                      <rect
                        x={x1}
                        y={stringY - stringSpacing / 2}
                        width={Math.max(16, x2 - x1)}
                        height={stringSpacing}
                        fill="transparent"
                      />

                      {/* Animated Note Badge */}
                      {shouldShowBadge && (
                        <g filter={isActive ? 'url(#neonGlow)' : undefined}>
                          <circle
                            cx={noteX}
                            cy={stringY}
                            r={isRoot || isActive ? 9.5 : 8}
                            fill={badgeFill}
                            stroke={badgeBorder}
                            strokeWidth={isRoot || isActive ? 2 : 1}
                            className="transition-all duration-100 group-hover:stroke-cyan-400 group-hover:scale-110"
                          />
                          <text
                            x={noteX}
                            y={stringY + 3.2}
                            fill={textColor}
                            fontSize={label.length > 2 ? '7' : '8.5'}
                            fontWeight="bold"
                            fontFamily="ui-monospace, monospace"
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
