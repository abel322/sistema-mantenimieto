'use client';

import React, { useMemo } from 'react';
import {
  InstrumentType,
  TuningId,
  FretboardOverlayMode,
  TheoryMode,
  MusicalKey,
  ScaleType,
  ArpeggioType,
  ChordVoicingType,
  VoicingShapeId,
  ProgressionChordStep,
} from '@/types/strings';
import { calculateFretNote, stringsAudioEngine } from '@/services/audio/stringsAudioEngine';
import {
  CHROMATIC_INDEX,
  INTERVAL_NAMES,
  SCALE_CATALOGUE,
  ARPEGGIO_CATALOGUE,
  getChordVoicing,
} from '@/services/audio/stringsTheoryEngine';

export interface ActiveFretHit {
  stringIndex: number; // 0 to N-1
  fret: number; // 0 to 24
  articulation?: string;
}

export interface ActiveHitNote {
  stringIndex: number;
  fret: number;
  id: string;
}

interface InteractiveFretboardProps {
  instrument: InstrumentType;
  tuning: TuningId;
  overlayMode: FretboardOverlayMode;
  theoryMode?: TheoryMode; // 'free' | 'scale' | 'arpeggio' | 'chord_voicing' | 'progression'
  musicalKey: MusicalKey;
  scaleType?: ScaleType;
  arpeggioType?: ArpeggioType;
  arpeggioRange?: 'all' | 'box_root' | 'box_octave';
  chordVoicingType?: ChordVoicingType;
  voicingShapeId?: VoicingShapeId;
  activeProgressionChord?: ProgressionChordStep;
  activeHits?: ActiveFretHit[];
  activeHitNotes?: ActiveHitNote[];
  onFretClick?: (stringIndex: number, fret: number) => void;
  className?: string;
}

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
  scaleType = 'ionian',
  arpeggioType = 'major_triad',
  arpeggioRange = 'all',
  chordVoicingType = 'major',
  voicingShapeId = 'root6_barre',
  activeProgressionChord,
  activeHits = [],
  activeHitNotes = [],
  onFretClick,
  className = '',
}: InteractiveFretboardProps) {
  const stringsConfig = useMemo(() => getInstrumentStrings(instrument, tuning), [instrument, tuning]);
  const numStrings = stringsConfig.length;
  const numFrets = 24;

  // Real exponential fret spacing calculation
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

  // Root note chromatic index
  const rootIndex = CHROMATIC_INDEX[musicalKey] ?? 0;

  // 1. Active semitones for Scales
  const activeScaleDef = useMemo(() => {
    return (
      SCALE_CATALOGUE.find((s) => s.id === scaleType) ||
      (scaleType === 'major' ? SCALE_CATALOGUE.find((s) => s.id === 'ionian') : null) ||
      (scaleType === 'minor' ? SCALE_CATALOGUE.find((s) => s.id === 'aeolian') : null) ||
      SCALE_CATALOGUE[0]
    );
  }, [scaleType]);

  // 2. Active semitones for Arpeggios
  const activeArpeggioDef = useMemo(() => {
    return (
      ARPEGGIO_CATALOGUE.find((a) => a.id === arpeggioType) ||
      (arpeggioType === 'aug' ? ARPEGGIO_CATALOGUE.find((a) => a.id === 'aug_triad') : null) ||
      ARPEGGIO_CATALOGUE[0]
    );
  }, [arpeggioType]);

  // 3. Active Chord Voicing (1 note per string max)
  const activeVoicing = useMemo(() => {
    return getChordVoicing(instrument, musicalKey, chordVoicingType, voicingShapeId);
  }, [instrument, musicalKey, chordVoicingType, voicingShapeId]);

  // Arpeggio Fret Range calculation for box filtering
  const arpeggioFretFilter = useMemo(() => {
    if (theoryMode !== 'arpeggio' || arpeggioRange === 'all') {
      return (fret: number) => true;
    }
    const lowestString = stringsConfig[numStrings - 1];
    const match = lowestString.basePitch.match(/^([A-Ga-g][#b]?)/);
    const lowBaseName = match ? match[1].toUpperCase() : 'E';
    const lowBaseIdx = CHROMATIC_INDEX[lowBaseName] ?? 4;
    const rootFretLow = (rootIndex - lowBaseIdx + 12) % 12;

    if (arpeggioRange === 'box_root') {
      const minF = Math.max(0, rootFretLow - 1);
      const maxF = Math.min(24, rootFretLow + 4);
      return (fret: number) => fret >= minF && fret <= maxF;
    }
    if (arpeggioRange === 'box_octave') {
      const minF = Math.max(0, rootFretLow + 11);
      const maxF = Math.min(24, rootFretLow + 16);
      return (fret: number) => fret >= minF && fret <= maxF;
    }
    return (fret: number) => true;
  }, [theoryMode, arpeggioRange, rootIndex, stringsConfig, numStrings]);

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
      return (14 + nutX) / 2;
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
            {/* 1. ACABADO REALISTA DE MADERA (Palisandro / Rosewood) */}
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

            {/* Voicing Sky Glow */}
            <filter id="voicingGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* CUERPO DEL DIAPASÓN Y RIBETES (BINDING) */}
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

          {/* INLAYS PERLADOS (DOTS) */}
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

          {/* TRASTES METÁLICOS NIQUELADOS Y CEJUELA */}
          {fretXPositions.map((x, f) => {
            if (f === 0) return null;
            const isOctaveFret = f === 12 || f === 24;

            return (
              <g key={`fret-wire-${f}`}>
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

          {/* Cejuela hueso / marfil */}
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

          {/* REGLA NUMÉRICA (0 AL 24) */}
          {Array.from({ length: numFrets + 1 }).map((_, f) => {
            const midX = getFretSlotCenterX(f);
            const isKeyFret = KEY_FRETS.includes(f);
            const isOctave = f === 12 || f === 24;

            let textColor = '#94a3b8';
            if (isOctave) {
              textColor = '#f59e0b';
            } else if (isKeyFret) {
              textColor = '#38bdf8';
            }

            return (
              <g key={`ruler-number-${f}`}>
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

          {/* CUERDAS HORIZONTALES CON CALIBRE REAL */}
          {stringsConfig.map((str, sIdx) => {
            const stringY = stringYPositions[sIdx];

            return (
              <g key={`string-line-${sIdx}`}>
                <line
                  x1={12}
                  y1={stringY + str.gauge * 0.4}
                  x2={fretXPositions[numFrets] + 16}
                  y2={stringY + str.gauge * 0.4}
                  stroke="#050811"
                  strokeWidth={str.gauge + 1.2}
                  opacity={0.65}
                />
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

          {/* NOTAS Y LÓGICA DE ILUMINACIÓN SEGÚN LOS 4 MODOS */}
          {stringsConfig.map((str, sIdx) => {
            const stringY = stringYPositions[sIdx];
            const slotHeight =
              numStrings === 4 ? 37 : numStrings === 5 ? 30 : 25;

            const voicingNote =
              theoryMode === 'chord_voicing'
                ? activeVoicing.notes.find((n) => n.stringIndex === sIdx)
                : null;

            return (
              <g key={`fret-notes-${sIdx}`}>
                {/* Voicing Indicators: Muted (✕) or Open (○) to left of Nut */}
                {theoryMode === 'chord_voicing' && (
                  <g key={`voicing-nut-indicator-${sIdx}`}>
                    {voicingNote?.fret === null ? (
                      <g className="select-none">
                        <title>{`Cuerda ${str.name}: SILENCIADA (✕)`}</title>
                        <circle cx="42" cy={stringY} r="9.5" fill="#450a0a" stroke="#f43f5e" strokeWidth="1.5" />
                        <text
                          x="42"
                          y={stringY + 3.8}
                          fill="#fb7185"
                          fontSize="11"
                          fontWeight="900"
                          fontFamily="ui-monospace, monospace"
                          textAnchor="middle"
                        >
                          ✕
                        </text>
                      </g>
                    ) : voicingNote?.fret === 0 ? (
                      <g
                        className="select-none cursor-pointer group"
                        onClick={() => handleFretInteraction(sIdx, 0)}
                      >
                        <title>{`Cuerda ${str.name}: AL AIRE (○)`}</title>
                        <circle
                          cx="42"
                          cy={stringY}
                          r="9.5"
                          fill="#064e3b"
                          stroke="#10b981"
                          strokeWidth="1.8"
                          className="group-hover:scale-110 transition-transform"
                        />
                        <text
                          x="42"
                          y={stringY + 3.8}
                          fill="#34d399"
                          fontSize="11"
                          fontWeight="900"
                          fontFamily="ui-monospace, monospace"
                          textAnchor="middle"
                        >
                          ○
                        </text>
                      </g>
                    ) : (
                      <g
                        className="select-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                        onClick={() => handleFretInteraction(sIdx, 0)}
                      >
                        <title>{`Cuerda ${str.name} (Tuning: ${str.basePitch})`}</title>
                        <circle cx="42" cy={stringY} r="7.5" fill="#1c1917" stroke="#44403c" strokeWidth="1" />
                        <text
                          x="42"
                          y={stringY + 3}
                          fill="#a8a29e"
                          fontSize="8.5"
                          fontWeight="bold"
                          fontFamily="ui-monospace, monospace"
                          textAnchor="middle"
                        >
                          {str.name}
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Frets 0 to 24 slots */}
                {Array.from({ length: numFrets + 1 }).map((_, fret) => {
                  const x1 = fret === 0 ? 10 : fretXPositions[fret - 1];
                  const x2 = fret === 0 ? nutX : fretXPositions[fret];
                  const noteX = getFretSlotCenterX(fret);

                  const noteInfo = calculateFretNote(str.basePitch, fret);
                  const noteDistance =
                    (CHROMATIC_INDEX[noteInfo.noteName] - rootIndex + 12) % 12;
                  const isRoot = noteDistance === 0;

                  const isActive =
                    (activeHitNotes && activeHitNotes.some((hit) => hit.stringIndex === sIdx && hit.fret === fret)) ||
                    (activeHits && activeHits.some((hit) => hit.stringIndex === sIdx && hit.fret === fret));

                  const genericFinger = fret === 0 ? 0 : ((fret - 1) % 4) + 1;

                  let isHighlighted = false;
                  let badgeFill = '#06b6d4';
                  let badgeStroke = '#22d3ee';
                  let textColor = '#ffffff';
                  let textFontWeight = 'bold';
                  let badgeFilter: string | undefined = 'url(#cyanScaleGlow)';
                  let label = noteInfo.noteName;

                  if (theoryMode === 'chord_voicing') {
                    const isVoicingFret =
                      voicingNote?.fret !== null && voicingNote?.fret === fret;

                    isHighlighted = isVoicingFret;
                    if (isVoicingFret) {
                      const fingerNum = voicingNote?.finger ?? genericFinger;
                      if (overlayMode === 'intervals') {
                        label = voicingNote?.interval || INTERVAL_NAMES[noteDistance] || 'R';
                      } else if (overlayMode === 'notes') {
                        label = noteInfo.noteName;
                      } else {
                        label = fret === 0 ? '○' : String(fingerNum);
                      }

                      if (isRoot) {
                        badgeFill = '#f59e0b';
                        badgeStroke = '#fcd34d';
                        textColor = '#000000';
                        textFontWeight = '900';
                        badgeFilter = 'url(#amberRootGlow)';
                      } else {
                        badgeFill = '#0284c7';
                        badgeStroke = '#38bdf8';
                        textColor = '#ffffff';
                        badgeFilter = 'url(#voicingGlow)';
                      }
                    }
                  } else if (theoryMode === 'scale') {
                    const isScaleNote = activeScaleDef.semitones.includes(noteDistance);
                    isHighlighted = isScaleNote;

                    if (overlayMode === 'intervals') {
                      label = INTERVAL_NAMES[noteDistance] || '';
                    } else if (overlayMode === 'fingering') {
                      label = fret === 0 ? '0' : String(genericFinger);
                    } else {
                      label = noteInfo.noteName;
                    }

                    if (isRoot) {
                      badgeFill = '#f59e0b';
                      badgeStroke = '#fcd34d';
                      textColor = '#000000';
                      textFontWeight = '900';
                      badgeFilter = 'url(#amberRootGlow)';
                      if (overlayMode === 'intervals') label = 'R';
                    }
                  } else if (theoryMode === 'arpeggio') {
                    const isArpNote = activeArpeggioDef.semitones.includes(noteDistance);
                    const isInRange = arpeggioFretFilter(fret);
                    isHighlighted = isArpNote && isInRange;

                    if (overlayMode === 'intervals') {
                      label = INTERVAL_NAMES[noteDistance] || '';
                    } else if (overlayMode === 'fingering') {
                      label = fret === 0 ? '0' : String(genericFinger);
                    } else {
                      label = noteInfo.noteName;
                    }

                    if (isRoot) {
                      badgeFill = '#f59e0b';
                      badgeStroke = '#fcd34d';
                      textColor = '#000000';
                      textFontWeight = '900';
                      badgeFilter = 'url(#amberRootGlow)';
                      if (overlayMode === 'intervals') label = 'R';
                    }
                  } else if (theoryMode === 'progression') {
                    if (activeProgressionChord) {
                      const semitoneC = CHROMATIC_INDEX[noteInfo.noteName] ?? 0;
                      const isChordRoot = semitoneC === activeProgressionChord.guideTones.root;
                      const isChordThird = semitoneC === activeProgressionChord.guideTones.third;
                      const isChordSeventh =
                        activeProgressionChord.guideTones.seventh !== undefined &&
                        semitoneC === activeProgressionChord.guideTones.seventh;
                      const isChordFifth =
                        activeProgressionChord.guideTones.fifth !== undefined &&
                        semitoneC === activeProgressionChord.guideTones.fifth;

                      isHighlighted = isChordRoot || isChordThird || isChordSeventh || isChordFifth;

                      if (isChordRoot) {
                        badgeFill = '#f59e0b'; // Oro Tónica
                        badgeStroke = '#fcd34d';
                        textColor = '#000000';
                        textFontWeight = '900';
                        badgeFilter = 'url(#amberRootGlow)';
                        label = overlayMode === 'intervals' ? 'R' : noteInfo.noteName;
                      } else if (isChordThird) {
                        badgeFill = '#06b6d4'; // Cyan Eléctrico (3ª Guía)
                        badgeStroke = '#67e8f9';
                        textColor = '#ffffff';
                        textFontWeight = 'bold';
                        badgeFilter = 'url(#cyanScaleGlow)';
                        const thirdLabel = activeProgressionChord.chordType.includes('m') ? 'b3' : '3M';
                        label = overlayMode === 'intervals' ? thirdLabel : noteInfo.noteName;
                      } else if (isChordSeventh) {
                        badgeFill = '#a855f7'; // Púrpura Neón (7ª Guía)
                        badgeStroke = '#c084fc';
                        textColor = '#ffffff';
                        textFontWeight = 'bold';
                        badgeFilter = undefined;
                        const seventhLabel = activeProgressionChord.chordType === 'maj7' ? '7M' : 'b7';
                        label = overlayMode === 'intervals' ? seventhLabel : noteInfo.noteName;
                      } else if (isChordFifth) {
                        badgeFill = '#0284c7'; // Azul Cielo (5ª)
                        badgeStroke = '#38bdf8';
                        textColor = '#ffffff';
                        textFontWeight = 'bold';
                        badgeFilter = undefined;
                        label = overlayMode === 'intervals' ? (activeProgressionChord.chordType === 'm7b5' ? 'b5' : '5') : noteInfo.noteName;
                      }
                    } else {
                      isHighlighted = isRoot;
                    }
                  } else {
                    // FREE MODE
                    isHighlighted = true;
                    if (overlayMode === 'intervals') {
                      label = INTERVAL_NAMES[noteDistance] || '';
                    } else if (overlayMode === 'fingering') {
                      label = fret === 0 ? '0' : String(genericFinger);
                    } else {
                      label = noteInfo.noteName;
                    }

                    if (isRoot) {
                      badgeFill = '#f59e0b';
                      badgeStroke = '#fcd34d';
                      textColor = '#000000';
                      textFontWeight = '900';
                      badgeFilter = 'url(#amberRootGlow)';
                      if (overlayMode === 'intervals') label = 'R';
                    } else {
                      badgeFill = '#1e293b';
                      badgeStroke = '#475569';
                      textColor = '#cbd5e1';
                      badgeFilter = undefined;
                    }
                  }

                  if (isActive) {
                    badgeFill = '#38bdf8';
                    badgeStroke = '#ffffff';
                    textColor = '#000000';
                    textFontWeight = '900';
                    badgeFilter = 'url(#activeGlow)';
                    isHighlighted = true;
                  }

                  if (theoryMode === 'chord_voicing' && fret === 0) {
                    return null;
                  }

                  return (
                    <g
                      key={`interactive-cell-${sIdx}-${fret}`}
                      className="cursor-pointer group"
                      onClick={() => handleFretInteraction(sIdx, fret)}
                    >
                      <title>{`Cuerda ${str.name} • Traste ${fret} (${noteInfo.fullNote})${isRoot ? ' • [TÓNICA]' : ''}`}</title>

                      <rect
                        x={x1}
                        y={stringY - slotHeight / 2}
                        width={Math.max(18, x2 - x1)}
                        height={slotHeight}
                        fill="transparent"
                        className="transition-colors hover:fill-amber-500/10"
                      />

                      {!isHighlighted && !isActive && (
                        <circle
                          cx={noteX}
                          cy={stringY}
                          r={2.8}
                          fill="#451a03"
                          opacity={0.25}
                          className="group-hover:opacity-60 transition-opacity"
                        />
                      )}

                      {isHighlighted && (
                        <g filter={badgeFilter}>
                          {isActive && (
                            <>
                              <circle
                                cx={noteX}
                                cy={stringY}
                                r={17}
                                fill="none"
                                stroke="#22d3ee"
                                strokeWidth="2.5"
                                opacity="0.9"
                                className="animate-ping"
                              />
                              <circle
                                cx={noteX}
                                cy={stringY}
                                r={14.5}
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                opacity="0.8"
                              />
                            </>
                          )}

                          <circle
                            cx={noteX}
                            cy={stringY}
                            r={isActive ? 12 : isRoot ? 10.5 : 9}
                            fill={badgeFill}
                            stroke={badgeStroke}
                            strokeWidth={isActive ? 3 : isRoot ? 2.4 : 1.5}
                            className={`transition-transform duration-75 ${
                              isActive ? 'scale-110 drop-shadow-[0_0_12px_#22d3ee]' : 'group-hover:scale-125'
                            }`}
                          />

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
