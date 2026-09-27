'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Bookmark,
  Cloud,
  Play,
  Square,
  Sparkles,
  Sliders,
  RotateCcw,
  Volume2,
  Camera,
  Grid3X3,
  Wand2,
  Copy,
} from 'lucide-react';
import {
  GrooveCategory,
  GroovePattern,
  GrooveHit,
  DrumPieceId,
  DrumMeasure,
} from '@/types/drum';
import { convertDrumMeasureToGrooveMeasures } from '@/lib/groovesData';
import MiniScorePreview from './MiniScorePreview';

export type HiHatStepState = 'off' | 'closed' | 'open' | 'accent';
export type SnareStepState = 'off' | 'normal' | 'ghost' | 'accent';
export type KickStepState = 'off' | 'normal' | 'accent';

export type SupportedTimeSignature = '4/4' | '3/4' | '6/8' | '12/8' | '5/4' | '7/8';
export type SupportedSubdivisionMode = '1/8' | '1/16' | 'triplet' | 'sextuplet';

export interface BeatStep {
  stepIndex: number;
  label: string;
  isDownbeat: boolean;
}

export interface BeatGroup {
  beatNumber: number;
  label: string;
  steps: BeatStep[];
}

export interface MetricGridConfig {
  timeSignature: SupportedTimeSignature;
  subdivision: SupportedSubdivisionMode;
  totalSteps: number;
  beatGroups: BeatGroup[];
  dbSubdivision: '1/8' | '1/16' | '3:2' | '6:4';
  stepDurationFactor: number; // Multiplier against (60000 / BPM)
}

export interface MeasureMatrixState {
  hihat: HiHatStepState[];
  snare: SnareStepState[];
  kick: KickStepState[];
}

export interface SaveGrooveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (savedGroove: GroovePattern) => void;
  onPlayHit: (pieceId: DrumPieceId, accent?: boolean, ghost?: boolean) => void;
  currentMeasures?: DrumMeasure[];
  totalMeasures?: number;
  selectedMeasureIndex?: number;
  currentBpm?: number;
  currentTimeSignature?: [number, number];
  currentSwing?: number;
}

export const TIME_SIGNATURE_OPTIONS: SupportedTimeSignature[] = [
  '4/4',
  '3/4',
  '6/8',
  '12/8',
  '5/4',
  '7/8',
];

export const SUBDIVISION_MODE_OPTIONS: { id: SupportedSubdivisionMode; label: string; desc: string }[] = [
  { id: '1/8', label: '1/8 (Corcheas)', desc: '2 subdivisiones por pulso' },
  { id: '1/16', label: '1/16 (Semicorcheas)', desc: '4 subdivisiones por pulso' },
  { id: 'triplet', label: 'Ternaria / Shuffle', desc: 'Tresillos (3 por pulso)' },
  { id: 'sextuplet', label: 'Seisillos', desc: '6 subdivisiones por pulso' },
];

/**
 * Calculates dynamic grid grouping, step count, and audio timing for any meter & subdivision
 */
export function getMetricGridConfig(
  timeSig: SupportedTimeSignature,
  subdivision: SupportedSubdivisionMode
): MetricGridConfig {
  let beatGroups: BeatGroup[] = [];
  let dbSubdivision: '1/8' | '1/16' | '3:2' | '6:4' = '1/16';
  let stepDurationFactor = 0.25;
  let currentStep = 0;

  if (timeSig === '4/4' || timeSig === '3/4' || timeSig === '5/4') {
    const numBeats = timeSig === '4/4' ? 4 : timeSig === '3/4' ? 3 : 5;

    if (subdivision === '1/8') {
      dbSubdivision = '1/8';
      stepDurationFactor = 0.5;
      for (let b = 1; b <= numBeats; b++) {
        beatGroups.push({
          beatNumber: b,
          label: `T${b}`,
          steps: [
            { stepIndex: currentStep++, label: `${b}`, isDownbeat: true },
            { stepIndex: currentStep++, label: '&', isDownbeat: false },
          ],
        });
      }
    } else if (subdivision === '1/16') {
      dbSubdivision = '1/16';
      stepDurationFactor = 0.25;
      for (let b = 1; b <= numBeats; b++) {
        beatGroups.push({
          beatNumber: b,
          label: `T${b}`,
          steps: [
            { stepIndex: currentStep++, label: `${b}`, isDownbeat: true },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '&', isDownbeat: false },
            { stepIndex: currentStep++, label: 'a', isDownbeat: false },
          ],
        });
      }
    } else if (subdivision === 'triplet') {
      dbSubdivision = '3:2';
      stepDurationFactor = 1 / 3;
      for (let b = 1; b <= numBeats; b++) {
        beatGroups.push({
          beatNumber: b,
          label: `T${b}`,
          steps: [
            { stepIndex: currentStep++, label: `${b}`, isDownbeat: true },
            { stepIndex: currentStep++, label: 'tri', isDownbeat: false },
            { stepIndex: currentStep++, label: 'plet', isDownbeat: false },
          ],
        });
      }
    } else {
      // sextuplet
      dbSubdivision = '6:4';
      stepDurationFactor = 1 / 6;
      for (let b = 1; b <= numBeats; b++) {
        beatGroups.push({
          beatNumber: b,
          label: `T${b}`,
          steps: [
            { stepIndex: currentStep++, label: `${b}`, isDownbeat: true },
            { stepIndex: currentStep++, label: '2', isDownbeat: false },
            { stepIndex: currentStep++, label: '3', isDownbeat: false },
            { stepIndex: currentStep++, label: '4', isDownbeat: false },
            { stepIndex: currentStep++, label: '5', isDownbeat: false },
            { stepIndex: currentStep++, label: '6', isDownbeat: false },
          ],
        });
      }
    }
  } else if (timeSig === '6/8') {
    // 2 dotted-quarter compound beats: 1 2 3 | 4 5 6
    if (subdivision === '1/8' || subdivision === 'triplet') {
      dbSubdivision = subdivision === 'triplet' ? '3:2' : '1/8';
      stepDurationFactor = 0.5;
      beatGroups = [
        {
          beatNumber: 1,
          label: 'P1 (1-3)',
          steps: [
            { stepIndex: currentStep++, label: '1', isDownbeat: true },
            { stepIndex: currentStep++, label: '2', isDownbeat: false },
            { stepIndex: currentStep++, label: '3', isDownbeat: false },
          ],
        },
        {
          beatNumber: 2,
          label: 'P2 (4-6)',
          steps: [
            { stepIndex: currentStep++, label: '4', isDownbeat: true },
            { stepIndex: currentStep++, label: '5', isDownbeat: false },
            { stepIndex: currentStep++, label: '6', isDownbeat: false },
          ],
        },
      ];
    } else {
      // 1/16 or sextuplet: 12 steps
      dbSubdivision = subdivision === 'sextuplet' ? '6:4' : '1/16';
      stepDurationFactor = 0.25;
      beatGroups = [
        {
          beatNumber: 1,
          label: 'P1 (1..6)',
          steps: [
            { stepIndex: currentStep++, label: '1', isDownbeat: true },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '2', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '3', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
          ],
        },
        {
          beatNumber: 2,
          label: 'P2 (7..12)',
          steps: [
            { stepIndex: currentStep++, label: '4', isDownbeat: true },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '5', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '6', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
          ],
        },
      ];
    }
  } else if (timeSig === '12/8') {
    // 4 dotted-quarter compound beats
    if (subdivision === '1/8' || subdivision === 'triplet') {
      dbSubdivision = subdivision === 'triplet' ? '3:2' : '1/8';
      stepDurationFactor = 0.5;
      for (let b = 1; b <= 4; b++) {
        const startNum = (b - 1) * 3 + 1;
        beatGroups.push({
          beatNumber: b,
          label: `P${b}`,
          steps: [
            { stepIndex: currentStep++, label: `${startNum}`, isDownbeat: true },
            { stepIndex: currentStep++, label: `${startNum + 1}`, isDownbeat: false },
            { stepIndex: currentStep++, label: `${startNum + 2}`, isDownbeat: false },
          ],
        });
      }
    } else {
      // 1/16 or sextuplet: 24 steps
      dbSubdivision = subdivision === 'sextuplet' ? '6:4' : '1/16';
      stepDurationFactor = 0.25;
      for (let b = 1; b <= 4; b++) {
        const startNum = (b - 1) * 3 + 1;
        beatGroups.push({
          beatNumber: b,
          label: `P${b}`,
          steps: [
            { stepIndex: currentStep++, label: `${startNum}`, isDownbeat: true },
            { stepIndex: currentStep++, label: '·', isDownbeat: false },
            { stepIndex: currentStep++, label: `${startNum + 1}`, isDownbeat: false },
            { stepIndex: currentStep++, label: '·', isDownbeat: false },
            { stepIndex: currentStep++, label: `${startNum + 2}`, isDownbeat: false },
            { stepIndex: currentStep++, label: '·', isDownbeat: false },
          ],
        });
      }
    }
  } else if (timeSig === '7/8') {
    // Asymmetric 7 eighth notes grouped 2 + 2 + 3
    if (subdivision === '1/8' || subdivision === 'triplet') {
      dbSubdivision = subdivision === 'triplet' ? '3:2' : '1/8';
      stepDurationFactor = 0.5;
      beatGroups = [
        {
          beatNumber: 1,
          label: '2/8',
          steps: [
            { stepIndex: currentStep++, label: '1', isDownbeat: true },
            { stepIndex: currentStep++, label: '2', isDownbeat: false },
          ],
        },
        {
          beatNumber: 2,
          label: '2/8',
          steps: [
            { stepIndex: currentStep++, label: '3', isDownbeat: true },
            { stepIndex: currentStep++, label: '4', isDownbeat: false },
          ],
        },
        {
          beatNumber: 3,
          label: '3/8',
          steps: [
            { stepIndex: currentStep++, label: '5', isDownbeat: true },
            { stepIndex: currentStep++, label: '6', isDownbeat: false },
            { stepIndex: currentStep++, label: '7', isDownbeat: false },
          ],
        },
      ];
    } else {
      // 14 sixteenth notes (4 + 4 + 6)
      dbSubdivision = subdivision === 'sextuplet' ? '6:4' : '1/16';
      stepDurationFactor = 0.25;
      beatGroups = [
        {
          beatNumber: 1,
          label: '4/16',
          steps: [
            { stepIndex: currentStep++, label: '1', isDownbeat: true },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '2', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
          ],
        },
        {
          beatNumber: 2,
          label: '4/16',
          steps: [
            { stepIndex: currentStep++, label: '3', isDownbeat: true },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '4', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
          ],
        },
        {
          beatNumber: 3,
          label: '6/16',
          steps: [
            { stepIndex: currentStep++, label: '5', isDownbeat: true },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '6', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
            { stepIndex: currentStep++, label: '7', isDownbeat: false },
            { stepIndex: currentStep++, label: 'e', isDownbeat: false },
          ],
        },
      ];
    }
  }

  return {
    timeSignature: timeSig,
    subdivision,
    totalSteps: currentStep,
    beatGroups,
    dbSubdivision,
    stepDurationFactor,
  };
}

/**
 * Resizes an array maintaining existing items and padding with fillVal
 */
function resizeArray<T>(arr: T[], targetLen: number, fillVal: T): T[] {
  if (!arr || arr.length === 0) return new Array(targetLen).fill(fillVal);
  if (arr.length === targetLen) return [...arr];
  if (arr.length < targetLen) {
    return [...arr, ...new Array(targetLen - arr.length).fill(fillVal)];
  }
  return arr.slice(0, targetLen);
}

/**
 * Helper to build GroovePattern measures from multi-measure matrix state
 */
function buildGrooveMeasuresFromMatrix(
  measuresData: MeasureMatrixState[],
  measuresCount: 1 | 2,
  gridConfig: MetricGridConfig
) {
  const resultMeasures: Array<{
    beats: Array<{
      subdivisions: GrooveHit[][];
    }>;
  }> = [];

  const count = Math.min(measuresCount, measuresData.length);

  for (let m = 0; m < count; m++) {
    const measureData = measuresData[m];
    const beats: Array<{ subdivisions: GrooveHit[][] }> = [];

    for (const group of gridConfig.beatGroups) {
      const subdivisions: GrooveHit[][] = [];

      for (const step of group.steps) {
        const sIdx = step.stepIndex;
        const stepHits: GrooveHit[] = [];

        // Hi-Hat
        const hState = measureData?.hihat?.[sIdx];
        if (hState === 'closed') {
          stepHits.push({ instrument: 'hihat' });
        } else if (hState === 'open') {
          stepHits.push({ instrument: 'hihatOpen' });
        } else if (hState === 'accent') {
          stepHits.push({ instrument: 'hihat', accent: true });
        }

        // Snare
        const sState = measureData?.snare?.[sIdx];
        if (sState === 'normal') {
          stepHits.push({ instrument: 'snare' });
        } else if (sState === 'ghost') {
          stepHits.push({ instrument: 'snare', ghost: true });
        } else if (sState === 'accent') {
          stepHits.push({ instrument: 'snare', accent: true });
        }

        // Kick
        const kState = measureData?.kick?.[sIdx];
        if (kState === 'normal') {
          stepHits.push({ instrument: 'kick' });
        } else if (kState === 'accent') {
          stepHits.push({ instrument: 'kick', accent: true });
        }

        subdivisions.push(stepHits);
      }

      beats.push({ subdivisions });
    }

    resultMeasures.push({ beats });
  }

  return resultMeasures;
}

/**
 * Generates tailored musical drum presets for any time signature
 */
export function getPresetsForMeter(
  meter: SupportedTimeSignature,
  subdivision: SupportedSubdivisionMode,
  totalSteps: number
): { id: string; name: string; apply: () => [MeasureMatrixState, MeasureMatrixState] }[] {
  const emptyMeasure = (): MeasureMatrixState => ({
    hihat: new Array(totalSteps).fill('off'),
    snare: new Array(totalSteps).fill('off'),
    kick: new Array(totalSteps).fill('off'),
  });

  const clearPreset = {
    id: 'clear',
    name: 'Limpiar',
    apply: (): [MeasureMatrixState, MeasureMatrixState] => [emptyMeasure(), emptyMeasure()],
  };

  if (meter === '4/4') {
    if (subdivision === 'triplet') {
      return [
        {
          id: 'shuffle',
          name: 'Blues Shuffle',
          apply: () => {
            const m1 = emptyMeasure();
            [0, 2, 3, 5, 6, 8, 9, 11].forEach((s) => {
              if (s < totalSteps) m1.hihat[s] = 'closed';
            });
            if (totalSteps > 0) m1.kick[0] = 'normal';
            if (totalSteps > 6) m1.kick[6] = 'normal';
            if (totalSteps > 3) m1.snare[3] = 'accent';
            if (totalSteps > 9) m1.snare[9] = 'accent';

            const m2: MeasureMatrixState = {
              hihat: [...m1.hihat],
              snare: [...m1.snare],
              kick: [...m1.kick],
            };
            if (totalSteps > 5) m2.kick[5] = 'normal';
            if (totalSteps > 10) m2.snare[10] = 'ghost';
            if (totalSteps > 11) m2.snare[11] = 'normal';

            return [m1, m2];
          },
        },
        clearPreset,
      ];
    }

    return [
      {
        id: 'rock',
        name: 'Rock Básico',
        apply: () => {
          const m1 = emptyMeasure();
          if (totalSteps === 16) {
            for (let i = 0; i < 16; i += 2) m1.hihat[i] = 'closed';
            m1.kick[0] = 'normal';
            m1.kick[8] = 'normal';
            m1.kick[10] = 'normal';
            m1.snare[4] = 'normal';
            m1.snare[12] = 'normal';

            const m2: MeasureMatrixState = {
              hihat: [...m1.hihat],
              snare: [...m1.snare],
              kick: [...m1.kick],
            };
            m2.kick[6] = 'normal';
            m2.snare[14] = 'ghost';
            m2.snare[15] = 'accent';
            return [m1, m2];
          } else {
            for (let i = 0; i < totalSteps; i++) m1.hihat[i] = 'closed';
            if (totalSteps > 0) m1.kick[0] = 'normal';
            if (totalSteps > 2) m1.snare[Math.floor(totalSteps / 4)] = 'normal';
            return [m1, { ...m1, snare: [...m1.snare], kick: [...m1.kick], hihat: [...m1.hihat] }];
          }
        },
      },
      {
        id: 'fourOnFloor',
        name: '4-on-Floor',
        apply: () => {
          const m1 = emptyMeasure();
          if (totalSteps === 16) {
            [0, 4, 8, 12].forEach((s) => (m1.kick[s] = 'normal'));
            [4, 12].forEach((s) => (m1.snare[s] = 'accent'));
            [0, 4, 8, 12].forEach((s) => (m1.hihat[s] = 'closed'));
            [2, 6, 10, 14].forEach((s) => (m1.hihat[s] = 'open'));

            const m2: MeasureMatrixState = {
              hihat: [...m1.hihat],
              snare: [...m1.snare],
              kick: [...m1.kick],
            };
            m2.snare[14] = 'ghost';
            m2.snare[15] = 'accent';
            return [m1, m2];
          }
          return [m1, m1];
        },
      },
      {
        id: 'funk',
        name: 'Funk Pocket',
        apply: () => {
          const m1 = emptyMeasure();
          if (totalSteps === 16) {
            for (let i = 0; i < 16; i++) m1.hihat[i] = i % 4 === 0 ? 'accent' : 'closed';
            m1.kick[0] = 'normal';
            m1.kick[7] = 'normal';
            m1.kick[10] = 'normal';
            m1.snare[4] = 'normal';
            m1.snare[6] = 'ghost';
            m1.snare[12] = 'normal';
            m1.snare[15] = 'ghost';

            const m2: MeasureMatrixState = {
              hihat: [...m1.hihat],
              snare: [...m1.snare],
              kick: [...m1.kick],
            };
            m2.snare[13] = 'ghost';
            m2.snare[14] = 'normal';
            m2.snare[15] = 'accent';
            return [m1, m2];
          }
          return [m1, m1];
        },
      },
      clearPreset,
    ];
  } else if (meter === '3/4') {
    return [
      {
        id: 'waltz',
        name: 'Vals Rock 3/4',
        apply: () => {
          const m1 = emptyMeasure();
          const beats = 3;
          const stepsPerBeat = totalSteps / beats;
          for (let b = 0; b < beats; b++) {
            const step = Math.floor(b * stepsPerBeat);
            if (step < totalSteps) m1.hihat[step] = 'closed';
          }
          if (totalSteps > 0) m1.kick[0] = 'normal';
          const b2 = Math.floor(1 * stepsPerBeat);
          const b3 = Math.floor(2 * stepsPerBeat);
          if (b2 < totalSteps) m1.snare[b2] = 'normal';
          if (b3 < totalSteps) m1.snare[b3] = 'normal';
          return [m1, { ...m1, snare: [...m1.snare], kick: [...m1.kick], hihat: [...m1.hihat] }];
        },
      },
      clearPreset,
    ];
  } else if (meter === '6/8') {
    return [
      {
        id: 'ballad68',
        name: 'Balada / Blues 6/8',
        apply: () => {
          const m1 = emptyMeasure();
          if (totalSteps === 6) {
            for (let i = 0; i < 6; i++) m1.hihat[i] = i === 0 || i === 3 ? 'accent' : 'closed';
            m1.kick[0] = 'normal';
            m1.kick[2] = 'normal';
            m1.snare[3] = 'accent';

            const m2: MeasureMatrixState = {
              hihat: [...m1.hihat],
              snare: [...m1.snare],
              kick: [...m1.kick],
            };
            m2.kick[4] = 'normal';
            m2.snare[5] = 'normal';
            return [m1, m2];
          } else {
            for (let i = 0; i < totalSteps; i += 2) m1.hihat[i] = 'closed';
            if (totalSteps > 0) m1.kick[0] = 'normal';
            if (totalSteps > 6) m1.snare[6] = 'accent';
            return [m1, { ...m1, snare: [...m1.snare], kick: [...m1.kick], hihat: [...m1.hihat] }];
          }
        },
      },
      clearPreset,
    ];
  } else if (meter === '12/8') {
    return [
      {
        id: 'blues128',
        name: 'Slow Blues 12/8',
        apply: () => {
          const m1 = emptyMeasure();
          if (totalSteps === 12) {
            for (let i = 0; i < 12; i++) m1.hihat[i] = i % 3 === 0 ? 'accent' : 'closed';
            m1.kick[0] = 'normal';
            m1.kick[6] = 'normal';
            m1.snare[3] = 'accent';
            m1.snare[9] = 'accent';

            const m2: MeasureMatrixState = {
              hihat: [...m1.hihat],
              snare: [...m1.snare],
              kick: [...m1.kick],
            };
            m2.kick[5] = 'normal';
            m2.snare[11] = 'ghost';
            return [m1, m2];
          }
          return [m1, m1];
        },
      },
      clearPreset,
    ];
  } else if (meter === '5/4') {
    return [
      {
        id: 'takeFive',
        name: 'Take Five / Jazz 5/4',
        apply: () => {
          const m1 = emptyMeasure();
          const beats = 5;
          const stepsPerBeat = totalSteps / beats;
          for (let b = 0; b < beats; b++) {
            const step = Math.floor(b * stepsPerBeat);
            if (step < totalSteps) m1.hihat[step] = 'closed';
          }
          if (totalSteps > 0) m1.kick[0] = 'normal';
          const b4 = Math.floor(3 * stepsPerBeat);
          if (b4 < totalSteps) m1.kick[b4] = 'normal';
          const b2 = Math.floor(1 * stepsPerBeat);
          const b5 = Math.floor(4 * stepsPerBeat);
          if (b2 < totalSteps) m1.snare[b2] = 'normal';
          if (b5 < totalSteps) m1.snare[b5] = 'normal';
          return [m1, { ...m1, snare: [...m1.snare], kick: [...m1.kick], hihat: [...m1.hihat] }];
        },
      },
      clearPreset,
    ];
  } else if (meter === '7/8') {
    return [
      {
        id: 'balkan78',
        name: 'Balkan / Prog (2+2+3)',
        apply: () => {
          const m1 = emptyMeasure();
          if (totalSteps === 7) {
            for (let i = 0; i < 7; i++) m1.hihat[i] = i === 0 || i === 2 || i === 4 ? 'accent' : 'closed';
            m1.kick[0] = 'normal';
            m1.kick[2] = 'normal';
            m1.snare[4] = 'accent';

            const m2: MeasureMatrixState = {
              hihat: [...m1.hihat],
              snare: [...m1.snare],
              kick: [...m1.kick],
            };
            m2.kick[5] = 'normal';
            m2.snare[6] = 'normal';
            return [m1, m2];
          }
          return [m1, m1];
        },
      },
      clearPreset,
    ];
  }

  return [clearPreset];
}

export default function SaveGrooveModal({
  isOpen,
  onClose,
  onSaveSuccess,
  onPlayHit,
  currentMeasures,
  totalMeasures = 1,
  selectedMeasureIndex = 0,
  currentBpm = 120,
  currentTimeSignature = [4, 4],
  currentSwing = 0,
}: SaveGrooveModalProps) {
  // Input Mode: 'capture' (from current sequence) or 'matrix' (interactive sequencer)
  const [originMode, setOriginMode] = useState<'capture' | 'matrix'>('capture');

  // Basic Form State
  const [saveName, setSaveName] = useState('');
  const [saveGenre, setSaveGenre] = useState<GrooveCategory>('Mis Grooves');
  const [saveDifficulty, setSaveDifficulty] = useState<string>('Intermedio');
  const [saveSourceMeasureIndex, setSaveSourceMeasureIndex] = useState<number>(selectedMeasureIndex);
  const [saveDescription, setSaveDescription] = useState('');
  const [saveBpm, setSaveBpm] = useState<number>(currentBpm);
  const [isSaving, setIsSaving] = useState(false);

  // Dynamic Matrix Configuration State
  const [matrixTimeSignature, setMatrixTimeSignature] = useState<SupportedTimeSignature>('4/4');
  const [matrixSubdivision, setMatrixSubdivision] = useState<SupportedSubdivisionMode>('1/16');
  const [matrixMeasuresCount, setMatrixMeasuresCount] = useState<1 | 2>(1);
  const [activeMeasureTab, setActiveMeasureTab] = useState<0 | 1>(0);

  // Compute metric grid configuration reactively
  const gridConfig = useMemo(() => {
    return getMetricGridConfig(matrixTimeSignature, matrixSubdivision);
  }, [matrixTimeSignature, matrixSubdivision]);

  // Multi-Measure Matrix State (Measure 0 and Measure 1)
  const [matrixMeasures, setMatrixMeasures] = useState<[MeasureMatrixState, MeasureMatrixState]>(() => {
    const initialConfig = getMetricGridConfig('4/4', '1/16');
    const presets = getPresetsForMeter('4/4', '1/16', initialConfig.totalSteps);
    const initialRock = presets.find((p) => p.id === 'rock');
    return initialRock ? initialRock.apply() : [
      { hihat: new Array(16).fill('off'), snare: new Array(16).fill('off'), kick: new Array(16).fill('off') },
      { hihat: new Array(16).fill('off'), snare: new Array(16).fill('off'), kick: new Array(16).fill('off') },
    ];
  });

  // Audio Preview State
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [currentPlaybackStep, setCurrentPlaybackStep] = useState<number | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewStepIndexRef = useRef<number>(0);

  // Sync props on modal open
  useEffect(() => {
    if (isOpen) {
      setSaveSourceMeasureIndex(Math.max(0, Math.min(totalMeasures - 1, selectedMeasureIndex)));
      setSaveBpm(currentBpm);

      // Match outer time signature if supported
      const outerTsStr = `${currentTimeSignature[0]}/${currentTimeSignature[1]}` as SupportedTimeSignature;
      if (TIME_SIGNATURE_OPTIONS.includes(outerTsStr)) {
        setMatrixTimeSignature(outerTsStr);
      }
    }
  }, [isOpen, selectedMeasureIndex, totalMeasures, currentBpm, currentTimeSignature]);

  // Stop playback on modal close or unmount
  const stopPreviewAudio = useCallback(() => {
    if (previewTimerRef.current) {
      clearInterval(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setIsPlayingPreview(false);
    setCurrentPlaybackStep(null);
    previewStepIndexRef.current = 0;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopPreviewAudio();
    }
    return () => {
      stopPreviewAudio();
    };
  }, [isOpen, stopPreviewAudio]);

  // Handle Time Signature Change
  const handleSelectTimeSignature = (ts: SupportedTimeSignature) => {
    if (ts === matrixTimeSignature) return;
    stopPreviewAudio();
    setMatrixTimeSignature(ts);
    const newConfig = getMetricGridConfig(ts, matrixSubdivision);

    setMatrixMeasures((prev) => [
      {
        hihat: resizeArray(prev[0].hihat, newConfig.totalSteps, 'off'),
        snare: resizeArray(prev[0].snare, newConfig.totalSteps, 'off'),
        kick: resizeArray(prev[0].kick, newConfig.totalSteps, 'off'),
      },
      {
        hihat: resizeArray(prev[1].hihat, newConfig.totalSteps, 'off'),
        snare: resizeArray(prev[1].snare, newConfig.totalSteps, 'off'),
        kick: resizeArray(prev[1].kick, newConfig.totalSteps, 'off'),
      },
    ]);
  };

  // Handle Subdivision Change
  const handleSelectSubdivision = (sub: SupportedSubdivisionMode) => {
    if (sub === matrixSubdivision) return;
    stopPreviewAudio();
    setMatrixSubdivision(sub);
    const newConfig = getMetricGridConfig(matrixTimeSignature, sub);

    setMatrixMeasures((prev) => [
      {
        hihat: resizeArray(prev[0].hihat, newConfig.totalSteps, 'off'),
        snare: resizeArray(prev[0].snare, newConfig.totalSteps, 'off'),
        kick: resizeArray(prev[0].kick, newConfig.totalSteps, 'off'),
      },
      {
        hihat: resizeArray(prev[1].hihat, newConfig.totalSteps, 'off'),
        snare: resizeArray(prev[1].snare, newConfig.totalSteps, 'off'),
        kick: resizeArray(prev[1].kick, newConfig.totalSteps, 'off'),
      },
    ]);
  };

  // Presets available for currently active meter
  const currentPresets = useMemo(() => {
    return getPresetsForMeter(matrixTimeSignature, matrixSubdivision, gridConfig.totalSteps);
  }, [matrixTimeSignature, matrixSubdivision, gridConfig.totalSteps]);

  const handleApplyPreset = (presetItem: { apply: () => [MeasureMatrixState, MeasureMatrixState] }) => {
    stopPreviewAudio();
    const [m1, m2] = presetItem.apply();
    setMatrixMeasures([m1, m2]);
  };

  // Copy Measure 1 into Measure 2 helper
  const handleCopyMeasure1To2 = () => {
    setMatrixMeasures((prev) => [
      prev[0],
      {
        hihat: [...prev[0].hihat],
        snare: [...prev[0].snare],
        kick: [...prev[0].kick],
      },
    ]);
    setActiveMeasureTab(1);
  };

  // Step Toggling Logic for active measure tab
  const handleToggleHihat = (index: number) => {
    setMatrixMeasures((prev) => {
      const next: [MeasureMatrixState, MeasureMatrixState] = [
        { ...prev[0], hihat: [...prev[0].hihat] },
        { ...prev[1], hihat: [...prev[1].hihat] },
      ];
      const target = next[activeMeasureTab];
      const cur = target.hihat[index] || 'off';
      const nextVal: HiHatStepState =
        cur === 'off' ? 'closed' : cur === 'closed' ? 'open' : cur === 'open' ? 'accent' : 'off';
      target.hihat[index] = nextVal;

      if (nextVal === 'closed') onPlayHit('hihatClosed', false, false);
      else if (nextVal === 'open') onPlayHit('hihatOpen', false, false);
      else if (nextVal === 'accent') onPlayHit('hihatClosed', true, false);

      return next;
    });
  };

  const handleToggleSnare = (index: number) => {
    setMatrixMeasures((prev) => {
      const next: [MeasureMatrixState, MeasureMatrixState] = [
        { ...prev[0], snare: [...prev[0].snare] },
        { ...prev[1], snare: [...prev[1].snare] },
      ];
      const target = next[activeMeasureTab];
      const cur = target.snare[index] || 'off';
      const nextVal: SnareStepState =
        cur === 'off' ? 'normal' : cur === 'normal' ? 'ghost' : cur === 'ghost' ? 'accent' : 'off';
      target.snare[index] = nextVal;

      if (nextVal === 'normal') onPlayHit('snare', false, false);
      else if (nextVal === 'ghost') onPlayHit('snare', false, true);
      else if (nextVal === 'accent') onPlayHit('snare', true, false);

      return next;
    });
  };

  const handleToggleKick = (index: number) => {
    setMatrixMeasures((prev) => {
      const next: [MeasureMatrixState, MeasureMatrixState] = [
        { ...prev[0], kick: [...prev[0].kick] },
        { ...prev[1], kick: [...prev[1].kick] },
      ];
      const target = next[activeMeasureTab];
      const cur = target.kick[index] || 'off';
      const nextVal: KickStepState = cur === 'off' ? 'normal' : cur === 'normal' ? 'accent' : 'off';
      target.kick[index] = nextVal;

      if (nextVal === 'normal') onPlayHit('kick', false, false);
      else if (nextVal === 'accent') onPlayHit('kick', true, false);

      return next;
    });
  };

  // Capture mode: live source measure from outer sequencer
  const liveSourceMeasure: DrumMeasure | undefined =
    currentMeasures && currentMeasures[saveSourceMeasureIndex]
      ? currentMeasures[saveSourceMeasureIndex]
      : currentMeasures?.[0];

  // Build active GroovePattern object for live preview and database payload
  const activePreviewGroove: GroovePattern | null = useMemo(() => {
    if (originMode === 'matrix') {
      const measures = buildGrooveMeasuresFromMatrix(matrixMeasures, matrixMeasuresCount, gridConfig);
      return {
        id: 'save-modal-matrix-preview',
        name: saveName.trim() || 'Nuevo Groove en Matriz',
        category: saveGenre,
        subCategory: 'Diseñado en Matriz',
        difficulty: saveDifficulty as any,
        suggestedBpm: saveBpm,
        timeSignature: matrixTimeSignature,
        swingRatio: currentSwing,
        measuresCount: matrixMeasuresCount,
        subdivision: gridConfig.dbSubdivision,
        description:
          saveDescription.trim() ||
          `Groove en ${matrixTimeSignature} (${matrixMeasuresCount} compás${matrixMeasuresCount > 1 ? 'es' : ''}) diseñado en Sonora.`,
        isCustom: true,
        measures,
      };
    } else {
      if (!liveSourceMeasure) return null;
      const { measures, subdivision } = convertDrumMeasureToGrooveMeasures(liveSourceMeasure);
      return {
        id: 'save-modal-capture-preview',
        name: saveName.trim() || 'Nuevo Groove Capturado',
        category: saveGenre,
        subCategory: 'Capturado de Partitura',
        difficulty: saveDifficulty as any,
        suggestedBpm: saveBpm,
        timeSignature: `${currentTimeSignature[0]}/${currentTimeSignature[1]}` as any,
        swingRatio: currentSwing,
        measuresCount: 1,
        subdivision: subdivision as any,
        description: saveDescription.trim() || 'Groove capturado directamente desde la partitura.',
        isCustom: true,
        measures,
      };
    }
  }, [
    originMode,
    matrixMeasures,
    matrixMeasuresCount,
    gridConfig,
    matrixTimeSignature,
    liveSourceMeasure,
    saveName,
    saveGenre,
    saveDifficulty,
    saveBpm,
    currentSwing,
    currentTimeSignature,
    saveDescription,
  ]);

  // Audio Preview Loop handler supporting full 1 or 2 measures continuously
  const handleTogglePreviewAudio = () => {
    if (isPlayingPreview) {
      stopPreviewAudio();
      return;
    }

    if (!activePreviewGroove) return;

    setIsPlayingPreview(true);
    previewStepIndexRef.current = 0;
    setCurrentPlaybackStep(0);

    const totalStepsInMeasure = gridConfig.totalSteps;
    const numMeasures = originMode === 'matrix' ? matrixMeasuresCount : 1;
    const totalGlobalSteps = totalStepsInMeasure * numMeasures;

    // Step duration in ms with dynamic subdivision factor
    const stepDurationMs = Math.max(35, (60000 / (saveBpm || 120)) * gridConfig.stepDurationFactor);

    const playCurrentStep = () => {
      const globalStep = previewStepIndexRef.current;
      setCurrentPlaybackStep(globalStep);

      if (originMode === 'matrix') {
        const mIdx = Math.floor(globalStep / totalStepsInMeasure);
        const sIdx = globalStep % totalStepsInMeasure;
        const measureData = matrixMeasures[mIdx] || matrixMeasures[0];

        const h = measureData?.hihat?.[sIdx];
        const s = measureData?.snare?.[sIdx];
        const k = measureData?.kick?.[sIdx];

        if (h === 'closed') onPlayHit('hihatClosed', false, false);
        else if (h === 'open') onPlayHit('hihatOpen', false, false);
        else if (h === 'accent') onPlayHit('hihatClosed', true, false);

        if (s === 'normal') onPlayHit('snare', false, false);
        else if (s === 'ghost') onPlayHit('snare', false, true);
        else if (s === 'accent') onPlayHit('snare', true, false);

        if (k === 'normal') onPlayHit('kick', false, false);
        else if (k === 'accent') onPlayHit('kick', true, false);
      } else {
        // Capture mode playback
        const measureTemplate = activePreviewGroove.measures[0];
        if (measureTemplate) {
          const bIdx = Math.floor(globalStep / 4);
          const sIdx = globalStep % 4;
          const hits = measureTemplate.beats[bIdx]?.subdivisions?.[sIdx] || [];
          hits.forEach((hit) => {
            const pieceId = (hit.instrument === 'hihat' ? 'hihatClosed' : hit.instrument) as DrumPieceId;
            onPlayHit(pieceId, hit.accent, hit.ghost);
          });
        }
      }

      previewStepIndexRef.current = (globalStep + 1) % totalGlobalSteps;
    };

    // Play initial step immediately
    playCurrentStep();

    previewTimerRef.current = setInterval(() => {
      playCurrentStep();
    }, stepDurationMs);
  };

  // Submit and Save to Cloud / Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim() || !activePreviewGroove) return;

    setIsSaving(true);
    stopPreviewAudio();

    const timeSigStr =
      originMode === 'matrix' ? matrixTimeSignature : `${currentTimeSignature[0]}/${currentTimeSignature[1]}`;
    const measuresCountNum = originMode === 'matrix' ? matrixMeasuresCount : 1;
    const subdivisionStr =
      originMode === 'matrix' ? gridConfig.dbSubdivision : activePreviewGroove.subdivision || '1/16';

    const payload = {
      name: saveName.trim(),
      genre: saveGenre,
      subCategory: originMode === 'matrix' ? 'Diseñado en Mini Matriz' : 'Capturado de Partitura',
      difficulty: saveDifficulty,
      suggestedBpm: saveBpm,
      timeSignature: timeSigStr,
      swingRatio: currentSwing,
      measuresCount: measuresCountNum,
      subdivision: subdivisionStr,
      description:
        saveDescription.trim() ||
        (originMode === 'matrix'
          ? `Groove en ${timeSigStr} (${measuresCountNum} compás${measuresCountNum > 1 ? 'es' : ''}) diseñado con la mini matriz dinámica.`
          : 'Groove capturado en Sonora Drum Lab.'),
      measures: activePreviewGroove.measures,
    };

    const tempId = `custom-${Date.now()}`;
    let savedItem: GroovePattern = {
      id: tempId,
      ...payload,
      category: saveGenre,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/grooves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.groove) {
          savedItem = data.groove;
        }
      }
    } catch (err) {
      console.warn('Database save failed, keeping in localStorage backup.', err);
    }

    onSaveSuccess(savedItem);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentMeasureData = matrixMeasures[activeMeasureTab] || matrixMeasures[0];

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full h-[92vh] sm:h-auto sm:max-h-[92vh] sm:max-w-4xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 border-t sm:border border-slate-200 dark:border-white/10 shadow-2xl transition-colors duration-200">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto my-2 sm:hidden flex-shrink-0" />

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 p-3 sm:p-4 flex justify-between items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-100 dark:bg-gradient-to-tr dark:from-cyan-500/20 dark:to-purple-500/20 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.3)] flex-shrink-0">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                  Guardar Groove en Vault
                </h3>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 border border-cyan-300 dark:border-cyan-500/40 text-cyan-800 dark:text-cyan-300 font-semibold flex-shrink-0">
                  Personalizado
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-gray-400 font-mono truncate hidden sm:block">
                Captura de partitura o diseña en la mini matriz secuenciadora interactiva
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-transparent text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form wrapping body + sticky footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {/* 1. Selector de Modo de Entrada (Tabs) */}
            <div className="p-1 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  stopPreviewAudio();
                  setOriginMode('capture');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  originMode === 'capture'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📷 Capturar de Partitura</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopPreviewAudio();
                  setOriginMode('matrix');
                }}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  originMode === 'matrix'
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(192,132,252,0.25)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>🎛️ Diseñar en Mini Matriz</span>
              </button>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* ======================================================== */}
              {/* COLUMNA 1: Configuración & Entrada de Ritmo */}
              {/* ======================================================== */}
              <div className="space-y-3.5">
                {/* Name Input */}
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                    Nombre del Groove *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej: Funk Sincopado en C1, Ghost Pocket, 4-on-Floor..."
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>

                {/* Genre & Difficulty Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Category / Genre */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                      Género / Categoría
                    </label>
                    <select
                      value={saveGenre}
                      onChange={(e) => setSaveGenre(e.target.value as GrooveCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                    >
                      <option value="Mis Grooves">Mis Grooves (Personal)</option>
                      <option value="Rock & Metal">Rock & Metal</option>
                      <option value="Funk & Gospel">Funk & Gospel</option>
                      <option value="Hip-Hop & Electronic">Hip-Hop & Electronic</option>
                      <option value="Latin & World">Latin & World</option>
                      <option value="Jazz & Blues">Jazz & Blues</option>
                      <option value="Prog & Odd-Meter">Prog & Odd-Meter</option>
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-gray-300 mb-1.5">
                      Dificultad
                    </label>
                    <select
                      value={saveDifficulty}
                      onChange={(e) => setSaveDifficulty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
                    >
                      <option value="Principiante">Principiante</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                      <option value="Virtuoso">Virtuoso</option>
                    </select>
                  </div>
                </div>

                {/* Input Mode Dynamic Section */}
                {originMode === 'capture' ? (
                  /* Modo Captura: Selección de compás exterior */
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 space-y-2">
                    <label className="block text-xs font-mono font-bold text-gray-300">
                      Compás de Origen a Capturar:
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {Array.from({ length: totalMeasures }, (_, i) => {
                        const isSelected = saveSourceMeasureIndex === i;
                        return (
                          <button
                            key={`save-src-m-${i}`}
                            type="button"
                            onClick={() => setSaveSourceMeasureIndex(i)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            Compás C{i + 1}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] font-mono text-gray-400 pt-1">
                      Lee exactamente las notas, acentos y polifonía programados en el compás seleccionado.
                    </p>
                  </div>
                ) : (
                  /* Modo Mini Matriz Secuenciadora Interactiva Dinámica */
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-3">
                    {/* 1. Métrica & Subdivisión Selectores */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                      {/* Fila 1: Métrica & Longitud Toggle */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-gray-400">Métrica:</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {TIME_SIGNATURE_OPTIONS.map((ts) => (
                              <button
                                key={`ts-btn-${ts}`}
                                type="button"
                                onClick={() => handleSelectTimeSignature(ts)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                                  matrixTimeSignature === ts
                                    ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                                    : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                                }`}
                              >
                                {ts}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Toggle de Longitud (1 Compás / 2 Compases) */}
                        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              setMatrixMeasuresCount(1);
                              setActiveMeasureTab(0);
                            }}
                            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              matrixMeasuresCount === 1
                                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            1 Compás
                          </button>
                          <button
                            type="button"
                            onClick={() => setMatrixMeasuresCount(2)}
                            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                              matrixMeasuresCount === 2
                                ? 'bg-purple-500/25 text-purple-300 border border-purple-400/50 shadow-[0_0_8px_rgba(168,85,247,0.25)]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            2 Compases
                          </button>
                        </div>
                      </div>

                      {/* Fila 2: Subdivisión por Pulso */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-white/5">
                        <span className="text-[10px] font-mono font-bold text-gray-400">Subdivisión:</span>
                        <div className="flex items-center gap-1 flex-wrap flex-1">
                          {SUBDIVISION_MODE_OPTIONS.map((sub) => (
                            <button
                              key={`sub-btn-${sub.id}`}
                              type="button"
                              onClick={() => handleSelectSubdivision(sub.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
                                matrixSubdivision === sub.id
                                  ? 'bg-purple-500/25 text-purple-300 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                                  : 'bg-slate-900 border-white/10 text-gray-400 hover:text-white hover:bg-slate-800'
                              }`}
                              title={sub.desc}
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold ml-auto">
                          {gridConfig.totalSteps} pasos {matrixMeasuresCount === 2 ? '× 2 compases' : ''}
                        </span>
                      </div>
                    </div>

                    {/* 2. Pestañas de Navegación si 2 Compases */}
                    {matrixMeasuresCount === 2 && (
                      <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-950/80 border border-white/10 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveMeasureTab(0)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              activeMeasureTab === 0
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                            }`}
                          >
                            <span>Compás 1 (A)</span>
                            {currentPlaybackStep !== null &&
                              Math.floor(currentPlaybackStep / gridConfig.totalSteps) === 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveMeasureTab(1)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                              activeMeasureTab === 1
                                ? 'bg-purple-500/20 text-purple-300 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
                            }`}
                          >
                            <span>Compás 2 (B / Variación)</span>
                            {currentPlaybackStep !== null &&
                              Math.floor(currentPlaybackStep / gridConfig.totalSteps) === 1 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleCopyMeasure1To2}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-cyan-300 border border-white/10 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ml-auto"
                          title="Copiar todas las notas de Compás 1 a Compás 2"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar C1 a C2</span>
                        </button>
                      </div>
                    )}

                    {/* Presets Rápidos según la métrica activa */}
                    <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] font-mono">
                      <span className="text-gray-400 font-bold flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-purple-400" />
                        Presets ({matrixTimeSignature}):
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {currentPresets.map((preset) => (
                          <button
                            key={`preset-${preset.id}`}
                            type="button"
                            onClick={() => handleApplyPreset(preset)}
                            className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                              preset.id === 'clear'
                                ? 'bg-red-950/40 hover:bg-red-900/40 text-red-300 border-red-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-cyan-300 border-white/10'
                            }`}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Reagrupación Visual de Pasos (Visual Beat Clustering) con Scroll Horizontal */}
                    <div className="overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10">
                      <div className="min-w-fit space-y-1.5 pt-1">
                        {/* Cabecera de Tiempos Dinámica */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 text-[10px] font-mono text-gray-500 font-bold text-center flex-shrink-0">
                            P
                          </div>
                          <div className="flex items-center gap-2">
                            {gridConfig.beatGroups.map((group, gIdx) => (
                              <div
                                key={`header-group-${group.beatNumber}-${gIdx}`}
                                className="flex items-center gap-0.5 p-0.5 rounded bg-slate-950/40 border border-white/5"
                              >
                                {group.steps.map((step) => {
                                  const isCurrent =
                                    currentPlaybackStep !== null &&
                                    Math.floor(currentPlaybackStep / gridConfig.totalSteps) === activeMeasureTab &&
                                    currentPlaybackStep % gridConfig.totalSteps === step.stepIndex;

                                  return (
                                    <div
                                      key={`step-lbl-${step.stepIndex}`}
                                      className={`w-6 h-4.5 rounded text-[9px] font-mono flex items-center justify-center font-bold transition-all flex-shrink-0 ${
                                        isCurrent
                                          ? 'bg-amber-400 text-black shadow-[0_0_8px_#f59e0b]'
                                          : step.isDownbeat
                                          ? 'bg-white/15 text-cyan-300 border border-white/20'
                                          : 'text-gray-500'
                                      }`}
                                      title={`Tiempo ${group.beatNumber} - ${step.label}`}
                                    >
                                      {step.label}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Fila 1: Hi-Hat / Cymbals (H) */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 text-[10px] font-mono font-bold text-sky-400 text-center py-1 rounded bg-sky-950/40 border border-sky-500/30 flex-shrink-0">
                            H
                          </div>
                          <div className="flex items-center gap-2">
                            {gridConfig.beatGroups.map((group, gIdx) => (
                              <div
                                key={`hh-group-${group.beatNumber}-${gIdx}`}
                                className="flex items-center gap-0.5 p-0.5 rounded bg-slate-950/40 border border-white/5"
                              >
                                {group.steps.map((step) => {
                                  const stepNum = step.stepIndex;
                                  const state = currentMeasureData?.hihat?.[stepNum] || 'off';
                                  const isCurrent =
                                    currentPlaybackStep !== null &&
                                    Math.floor(currentPlaybackStep / gridConfig.totalSteps) === activeMeasureTab &&
                                    currentPlaybackStep % gridConfig.totalSteps === stepNum;

                                  return (
                                    <button
                                      key={`hh-${stepNum}`}
                                      type="button"
                                      onClick={() => handleToggleHihat(stepNum)}
                                      className={`w-6 h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer border flex-shrink-0 ${
                                        isCurrent ? 'ring-1 ring-amber-400 shadow-[0_0_6px_#f59e0b]' : ''
                                      } ${
                                        state === 'closed'
                                          ? 'bg-sky-500/30 border-sky-400 text-sky-200'
                                          : state === 'open'
                                          ? 'bg-sky-400 border-white text-black shadow-[0_0_8px_rgba(56,189,248,0.6)] font-black'
                                          : state === 'accent'
                                          ? 'bg-gradient-to-tr from-sky-500 to-cyan-300 border-white text-black font-black'
                                          : 'bg-slate-900 border-white/10 hover:border-white/30 text-gray-700'
                                      }`}
                                      title={`Hi-Hat Paso ${stepNum + 1}: ${state}`}
                                    >
                                      {state === 'closed'
                                        ? 'x'
                                        : state === 'open'
                                        ? 'O'
                                        : state === 'accent'
                                        ? '>x'
                                        : '·'}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Fila 2: Snare / Caja (S) */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 text-[10px] font-mono font-bold text-purple-400 text-center py-1 rounded bg-purple-950/40 border border-purple-500/30 flex-shrink-0">
                            S
                          </div>
                          <div className="flex items-center gap-2">
                            {gridConfig.beatGroups.map((group, gIdx) => (
                              <div
                                key={`snare-group-${group.beatNumber}-${gIdx}`}
                                className="flex items-center gap-0.5 p-0.5 rounded bg-slate-950/40 border border-white/5"
                              >
                                {group.steps.map((step) => {
                                  const stepNum = step.stepIndex;
                                  const state = currentMeasureData?.snare?.[stepNum] || 'off';
                                  const isCurrent =
                                    currentPlaybackStep !== null &&
                                    Math.floor(currentPlaybackStep / gridConfig.totalSteps) === activeMeasureTab &&
                                    currentPlaybackStep % gridConfig.totalSteps === stepNum;

                                  return (
                                    <button
                                      key={`snare-${stepNum}`}
                                      type="button"
                                      onClick={() => handleToggleSnare(stepNum)}
                                      className={`w-6 h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer border flex-shrink-0 ${
                                        isCurrent ? 'ring-1 ring-amber-400 shadow-[0_0_6px_#f59e0b]' : ''
                                      } ${
                                        state === 'normal'
                                          ? 'bg-purple-500/35 border-purple-400 text-purple-200'
                                          : state === 'ghost'
                                          ? 'bg-purple-950/50 border-purple-500/40 text-purple-400 text-[9px]'
                                          : state === 'accent'
                                          ? 'bg-purple-500 border-white text-white font-black shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                                          : 'bg-slate-900 border-white/10 hover:border-white/30 text-gray-700'
                                      }`}
                                      title={`Snare Paso ${stepNum + 1}: ${state}`}
                                    >
                                      {state === 'normal'
                                        ? 'S'
                                        : state === 'ghost'
                                        ? '(•)'
                                        : state === 'accent'
                                        ? '>S'
                                        : '·'}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Fila 3: Kick / Bombo (K) */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 text-[10px] font-mono font-bold text-emerald-400 text-center py-1 rounded bg-emerald-950/40 border border-emerald-500/30 flex-shrink-0">
                            K
                          </div>
                          <div className="flex items-center gap-2">
                            {gridConfig.beatGroups.map((group, gIdx) => (
                              <div
                                key={`kick-group-${group.beatNumber}-${gIdx}`}
                                className="flex items-center gap-0.5 p-0.5 rounded bg-slate-950/40 border border-white/5"
                              >
                                {group.steps.map((step) => {
                                  const stepNum = step.stepIndex;
                                  const state = currentMeasureData?.kick?.[stepNum] || 'off';
                                  const isCurrent =
                                    currentPlaybackStep !== null &&
                                    Math.floor(currentPlaybackStep / gridConfig.totalSteps) === activeMeasureTab &&
                                    currentPlaybackStep % gridConfig.totalSteps === stepNum;

                                  return (
                                    <button
                                      key={`kick-${stepNum}`}
                                      type="button"
                                      onClick={() => handleToggleKick(stepNum)}
                                      className={`w-6 h-6 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer border flex-shrink-0 ${
                                        isCurrent ? 'ring-1 ring-amber-400 shadow-[0_0_6px_#f59e0b]' : ''
                                      } ${
                                        state === 'normal'
                                          ? 'bg-emerald-500/35 border-emerald-400 text-emerald-200'
                                          : state === 'accent'
                                          ? 'bg-emerald-500 border-white text-black font-black shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                                          : 'bg-slate-900 border-white/10 hover:border-white/30 text-gray-700'
                                      }`}
                                      title={`Kick Paso ${stepNum + 1}: ${state}`}
                                    >
                                      {state === 'normal'
                                        ? 'K'
                                        : state === 'accent'
                                        ? '>K'
                                        : '·'}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guía de Clicks y Estado */}
                    <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-500 flex-wrap gap-1">
                      <span>Clic para ciclar: normal → ghost (•) → acento &gt;</span>
                      <span className="text-cyan-400 font-bold">
                        {matrixTimeSignature} | {gridConfig.totalSteps} pasos
                        {matrixMeasuresCount === 2 ? ` (Editando Compás ${activeMeasureTab + 1})` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Description Input */}
                <div>
                  <label className="block text-xs font-mono font-bold text-gray-300 mb-1">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Notas sobre el groove, instrumentación o tempo sugerido..."
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    className="w-full px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400 transition-all resize-none"
                  />
                </div>
              </div>

              {/* ======================================================== */}
              {/* COLUMNA 2: Resumen, BPM & Previsualización en Tiempo Real */}
              {/* ======================================================== */}
              <div className="space-y-3.5 flex flex-col justify-between">
                {/* Resumen Técnico & Tempo Ajustable */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono space-y-2">
                  <div className="flex items-center justify-between text-gray-300">
                    <span className="font-bold text-cyan-400">Origen de Secuencia:</span>
                    <span className="text-gray-400">
                      {originMode === 'matrix'
                        ? `Mini Matriz (${matrixTimeSignature}, ${gridConfig.totalSteps} pasos${
                            matrixMeasuresCount === 2 ? ' × 2 compases' : ''
                          })`
                        : `Compás C${saveSourceMeasureIndex + 1}`}
                    </span>
                  </div>

                  {/* BPM Adjuster for Preview and Save */}
                  <div className="space-y-1 pt-1 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tempo de Referencia:</span>
                      <span className="text-amber-300 font-bold">{saveBpm} BPM</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={50}
                        max={220}
                        value={saveBpm}
                        onChange={(e) => setSaveBpm(Number(e.target.value))}
                        className="flex-1 accent-amber-400 cursor-pointer"
                      />
                      <input
                        type="number"
                        min={50}
                        max={220}
                        value={saveBpm}
                        onChange={(e) => setSaveBpm(Number(e.target.value))}
                        className="w-14 bg-slate-900 border border-white/15 rounded-lg px-1.5 py-0.5 text-center font-mono text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5 flex-wrap">
                    <span>
                      Métrica:{' '}
                      <strong className="text-white">
                        {originMode === 'matrix' ? matrixTimeSignature : `${currentTimeSignature[0]}/${currentTimeSignature[1]}`}
                      </strong>
                    </span>
                    <span>
                      Compases:{' '}
                      <strong className="text-purple-300">
                        {originMode === 'matrix' ? matrixMeasuresCount : 1}
                      </strong>
                    </span>
                    {currentSwing > 0 && (
                      <span>
                        Swing: <strong className="text-cyan-300">{Math.round(currentSwing * 100)}%</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Previsualización en Partitura con Botón Escuchar Previa */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-gray-300">Previsualización en Partitura:</span>

                    {/* Botón Escuchar Previa */}
                    <button
                      type="button"
                      onClick={handleTogglePreviewAudio}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isPlayingPreview
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 border-white/10 text-cyan-300 hover:border-cyan-400'
                      }`}
                    >
                      {isPlayingPreview ? (
                        <>
                          <Square className="w-3 h-3 fill-current text-amber-400" />
                          <span>Detener</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-cyan-400" />
                          <span>▶ Escuchar Previa</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Lienzo Mini Score Preview */}
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center min-h-[90px] relative overflow-hidden">
                    {activePreviewGroove ? (
                      <MiniScorePreview groove={activePreviewGroove} width={360} height={70} />
                    ) : (
                      <div className="h-[70px] rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-center text-xs text-gray-500 font-mono">
                        Sin compás seleccionado
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-mono text-gray-500 text-center">
                    Renderizado reactivo con armadura de clave, métrica y agrupación de compases
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-10 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 p-3 sm:p-4 flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                stopPreviewAudio();
                onClose();
              }}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-xs font-mono text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving || !saveName.trim()}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold shadow-lg hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer text-xs font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 fill-current" />
                  <span>Confirmar y Guardar en la Nube</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
