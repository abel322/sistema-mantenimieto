'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DrumMeasure,
  DrumBeat,
  DrumStep,
  DrumPieceId,
  DrumHit,
  DrumPreset,
  SUBDIVISION_OPTIONS,
  RudimentItem,
  RudimentStep,
  VoicingMode,
} from '@/types/drum';
import { DRUM_PRESETS } from '@/lib/drumPresets';

function createEmptyBeat(
  measureId: string,
  beatIndex: number,
  subdivision: number = 4
): DrumBeat {
  const isTuplet = [3, 5, 6, 7, 9].includes(subdivision);
  const ratioMap: Record<number, [number, number]> = {
    3: [3, 2],
    5: [5, 4],
    6: [6, 4],
    7: [7, 4],
    9: [9, 8],
  };

  const stepsCount = subdivision < 1 ? 1 : subdivision;
  const noteDurationType =
    subdivision === 0.25
      ? 'w'
      : subdivision === 0.5
      ? 'h'
      : subdivision === 1
      ? 'q'
      : undefined;

  const steps: DrumStep[] = [];
  for (let s = 0; s < stepsCount; s++) {
    steps.push({
      id: `${measureId}-b${beatIndex}-s${s}`,
      hits: [],
      isRest: false,
    });
  }

  return {
    id: `${measureId}-b${beatIndex}`,
    beatIndex,
    subdivision,
    noteDurationType,
    isTuplet,
    tupletRatio: isTuplet ? ratioMap[subdivision] : undefined,
    steps,
  };
}

function createDefaultMeasure(id: string, timeSignature: [number, number] = [4, 4]): DrumMeasure {
  const [beatsCount] = timeSignature;
  const beats: DrumBeat[] = [];
  for (let b = 0; b < beatsCount; b++) {
    beats.push(createEmptyBeat(id, b, 4));
  }
  return { id, timeSignature, beats };
}

export function useDrumScore(initialPresetId: string = 'classic-rock') {
  const defaultPreset = DRUM_PRESETS.find((p) => p.id === initialPresetId) || DRUM_PRESETS[0];

  const [measures, setMeasures] = useState<DrumMeasure[]>(() =>
    JSON.parse(JSON.stringify(defaultPreset.measures))
  );
  const [timeSignature, setTimeSignatureState] = useState<[number, number]>(defaultPreset.timeSignature);
  const [activePresetId, setActivePresetId] = useState<string | null>(defaultPreset.id);

  // Active insertion modes (for clicking Acento [A] or Ghost [G] on empty or future notes)
  const [isAccentMode, setIsAccentMode] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);

  // Selection cursor
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState(0);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  // Helpers for current selection
  const selectedMeasure = useMemo(
    () => measures[selectedMeasureIndex] || measures[0],
    [measures, selectedMeasureIndex]
  );

  const selectedBeat = useMemo(
    () => selectedMeasure?.beats[selectedBeatIndex] || selectedMeasure?.beats[0],
    [selectedMeasure, selectedBeatIndex]
  );

  const selectedStep = useMemo(
    () => selectedBeat?.steps[selectedStepIndex] || selectedBeat?.steps[0],
    [selectedBeat, selectedStepIndex]
  );

  // Set selection safely
  const selectStep = useCallback(
    (mIdx: number, bIdx: number, sIdx: number) => {
      const clampedM = Math.max(0, Math.min(measures.length - 1, mIdx));
      const targetM = measures[clampedM];
      if (!targetM) return;

      const clampedB = Math.max(0, Math.min(targetM.beats.length - 1, bIdx));
      const targetB = targetM.beats[clampedB];
      if (!targetB) return;

      const clampedS = Math.max(0, Math.min(targetB.steps.length - 1, sIdx));

      setSelectedMeasureIndex(clampedM);
      setSelectedBeatIndex(clampedB);
      setSelectedStepIndex(clampedS);
    },
    [measures]
  );

  // Navigate selection with arrow keys
  const navigateStep = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (!selectedMeasure || !selectedBeat) return;

      if (direction === 'left') {
        if (selectedStepIndex > 0) {
          setSelectedStepIndex((prev) => prev - 1);
        } else if (selectedBeatIndex > 0) {
          const prevBeat = selectedMeasure.beats[selectedBeatIndex - 1];
          setSelectedBeatIndex((prev) => prev - 1);
          setSelectedStepIndex(prevBeat.steps.length - 1);
        } else if (selectedMeasureIndex > 0) {
          const prevMeasure = measures[selectedMeasureIndex - 1];
          const lastBeat = prevMeasure.beats[prevMeasure.beats.length - 1];
          setSelectedMeasureIndex((prev) => prev - 1);
          setSelectedBeatIndex(prevMeasure.beats.length - 1);
          setSelectedStepIndex(lastBeat.steps.length - 1);
        }
      } else if (direction === 'right') {
        if (selectedStepIndex < selectedBeat.steps.length - 1) {
          setSelectedStepIndex((prev) => prev + 1);
        } else if (selectedBeatIndex < selectedMeasure.beats.length - 1) {
          setSelectedBeatIndex((prev) => prev + 1);
          setSelectedStepIndex(0);
        } else if (selectedMeasureIndex < measures.length - 1) {
          setSelectedMeasureIndex((prev) => prev + 1);
          setSelectedBeatIndex(0);
          setSelectedStepIndex(0);
        }
      } else if (direction === 'up') {
        if (selectedBeatIndex > 0) {
          const targetBeat = selectedMeasure.beats[selectedBeatIndex - 1];
          setSelectedBeatIndex((prev) => prev - 1);
          setSelectedStepIndex(Math.min(selectedStepIndex, targetBeat.steps.length - 1));
        }
      } else if (direction === 'down') {
        if (selectedBeatIndex < selectedMeasure.beats.length - 1) {
          const targetBeat = selectedMeasure.beats[selectedBeatIndex + 1];
          setSelectedBeatIndex((prev) => prev + 1);
          setSelectedStepIndex(Math.min(selectedStepIndex, targetBeat.steps.length - 1));
        }
      }
    },
    [measures, selectedMeasure, selectedBeat, selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]
  );

  // Change subdivision of a beat (supports Redonda 0.25, Blanca 0.5, regular & tuplets 3:2, 5:4, 6:4, 7:4, 9:8)
  const changeBeatSubdivision = useCallback(
    (newSubdivision: number, mIdx: number = selectedMeasureIndex, bIdx: number = selectedBeatIndex) => {
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetMeasure = next[mIdx];
        if (!targetMeasure) return prev;
        const targetBeat = targetMeasure.beats[bIdx];
        if (!targetBeat) return prev;

        const isTuplet = [3, 5, 6, 7, 9].includes(newSubdivision);
        const ratioMap: Record<number, [number, number]> = {
          3: [3, 2],
          5: [5, 4],
          6: [6, 4],
          7: [7, 4],
          9: [9, 8],
        };

        const noteDurationType =
          newSubdivision === 0.25
            ? 'w'
            : newSubdivision === 0.5
            ? 'h'
            : newSubdivision === 1
            ? 'q'
            : undefined;

        const stepsCount = newSubdivision < 1 ? 1 : newSubdivision;
        const oldSteps = targetBeat.steps;
        const newSteps: DrumStep[] = [];

        for (let s = 0; s < stepsCount; s++) {
          const prevHits = oldSteps[s]?.hits ? [...oldSteps[s].hits] : [];
          newSteps.push({
            id: `${targetMeasure.id}-b${bIdx}-s${s}`,
            hits: prevHits,
            isRest: prevHits.length === 0,
          });
        }

        targetBeat.subdivision = newSubdivision;
        targetBeat.noteDurationType = noteDurationType;
        targetBeat.isTuplet = isTuplet;
        targetBeat.tupletRatio = isTuplet ? ratioMap[newSubdivision] : undefined;
        targetBeat.steps = newSteps;

        return next;
      });

      setSelectedStepIndex((prev) => Math.min(prev, (newSubdivision < 1 ? 1 : newSubdivision) - 1));
      setActivePresetId(null);
    },
    [selectedMeasureIndex, selectedBeatIndex]
  );

  // Toggle or add drum piece on a step
  const toggleDrumPiece = useCallback(
    (
      pieceId: DrumPieceId,
      mIdx: number = selectedMeasureIndex,
      bIdx: number = selectedBeatIndex,
      sIdx: number = selectedStepIndex
    ) => {
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetMeasure = next[mIdx];
        if (!targetMeasure) return prev;
        const targetBeat = targetMeasure.beats[bIdx];
        if (!targetBeat) return prev;
        const targetStep = targetBeat.steps[sIdx];
        if (!targetStep) return prev;

        // Reset rest flag when adding a note
        targetStep.isRest = false;

        const existingIdx = targetStep.hits.findIndex((h) => h.pieceId === pieceId);

        // Hi-Hat special cycling: closed -> open -> none
        if (pieceId === 'hihatClosed') {
          const openIdx = targetStep.hits.findIndex((h) => h.pieceId === 'hihatOpen');
          if (existingIdx >= 0) {
            targetStep.hits.splice(existingIdx, 1);
            targetStep.hits.push({
              pieceId: 'hihatOpen',
              accent: isAccentMode,
              ghost: isGhostMode,
            });
          } else if (openIdx >= 0) {
            targetStep.hits.splice(openIdx, 1);
          } else {
            targetStep.hits.push({
              pieceId: 'hihatClosed',
              accent: isAccentMode,
              ghost: isGhostMode,
            });
          }
        } else if (pieceId === 'hihatOpen') {
          const closedIdx = targetStep.hits.findIndex((h) => h.pieceId === 'hihatClosed');
          if (closedIdx >= 0) {
            targetStep.hits.splice(closedIdx, 1);
          }
          if (existingIdx >= 0) {
            targetStep.hits.splice(existingIdx, 1);
          } else {
            targetStep.hits.push({
              pieceId: 'hihatOpen',
              accent: isAccentMode,
              ghost: isGhostMode,
            });
          }
        } else {
          // Standard toggle
          if (existingIdx >= 0) {
            targetStep.hits.splice(existingIdx, 1);
          } else {
            targetStep.hits.push({
              pieceId,
              accent: isAccentMode,
              ghost: isGhostMode,
            });
          }
        }

        return next;
      });
      setActivePresetId(null);
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex, isAccentMode, isGhostMode]
  );

  // Toggle accent: works on both existing hits AND insertion mode
  const toggleAccent = useCallback(
    (
      mIdx?: number,
      bIdx?: number,
      sIdx?: number
    ) => {
      const measureIndex = typeof mIdx === 'number' ? mIdx : selectedMeasureIndex;
      const beatIndex = typeof bIdx === 'number' ? bIdx : selectedBeatIndex;
      const stepIndex = typeof sIdx === 'number' ? sIdx : selectedStepIndex;

      let nextAccentState = !isAccentMode;

      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetStep = next[measureIndex]?.beats[beatIndex]?.steps[stepIndex];
        if (!targetStep) return prev;

        if (targetStep.hits.length > 0) {
          const currentlyAccented = targetStep.hits.some((h) => h.accent);
          nextAccentState = !currentlyAccented;
          targetStep.hits.forEach((h) => {
            h.accent = nextAccentState;
            if (nextAccentState) h.ghost = false;
          });
        }

        return next;
      });

      setIsAccentMode(nextAccentState);
      if (nextAccentState) setIsGhostMode(false);
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex, isAccentMode]
  );

  // Toggle ghost note: works on both existing hits AND insertion mode
  const toggleGhost = useCallback(
    (
      mIdx?: number,
      bIdx?: number,
      sIdx?: number
    ) => {
      const measureIndex = typeof mIdx === 'number' ? mIdx : selectedMeasureIndex;
      const beatIndex = typeof bIdx === 'number' ? bIdx : selectedBeatIndex;
      const stepIndex = typeof sIdx === 'number' ? sIdx : selectedStepIndex;

      let nextGhostState = !isGhostMode;

      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetStep = next[measureIndex]?.beats[beatIndex]?.steps[stepIndex];
        if (!targetStep) return prev;

        if (targetStep.hits.length > 0) {
          const currentlyGhost = targetStep.hits.some((h) => h.ghost);
          nextGhostState = !currentlyGhost;
          targetStep.hits.forEach((h) => {
            h.ghost = nextGhostState;
            if (nextGhostState) h.accent = false;
          });
        }

        return next;
      });

      setIsGhostMode(nextGhostState);
      if (nextGhostState) setIsAccentMode(false);
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex, isGhostMode]
  );

  // Toggle Rest (Silencio): converts active step into a percussion rest or restores notes
  const toggleRest = useCallback(
    (
      mIdx?: number,
      bIdx?: number,
      sIdx?: number
    ) => {
      const measureIndex = typeof mIdx === 'number' ? mIdx : selectedMeasureIndex;
      const beatIndex = typeof bIdx === 'number' ? bIdx : selectedBeatIndex;
      const stepIndex = typeof sIdx === 'number' ? sIdx : selectedStepIndex;

      if (measureIndex < 0 || beatIndex < 0 || stepIndex < 0) return;

      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetStep = next[measureIndex]?.beats[beatIndex]?.steps[stepIndex];
        if (!targetStep) return prev;

        const isCurrentlyRest = !!targetStep.isRest || targetStep.hits.length === 0;

        if (!isCurrentlyRest) {
          // If it has active notes -> turn into silence/rest
          targetStep.hits = [];
          targetStep.isRest = true;
        } else {
          // If it was already a rest -> toggle off rest and add a standard note (e.g. snare or closed hi-hat)
          targetStep.isRest = false;
          targetStep.hits = [
            {
              pieceId: beatIndex % 2 === 1 ? 'snare' : 'kick',
              accent: isAccentMode,
              ghost: isGhostMode,
            },
          ];
        }

        return next;
      });
      setActivePresetId(null);
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex, isAccentMode, isGhostMode]
  );

  // Clear a specific step
  const clearStep = useCallback(
    (
      mIdx?: number,
      bIdx?: number,
      sIdx?: number
    ) => {
      const measureIndex = typeof mIdx === 'number' ? mIdx : selectedMeasureIndex;
      const beatIndex = typeof bIdx === 'number' ? bIdx : selectedBeatIndex;
      const stepIndex = typeof sIdx === 'number' ? sIdx : selectedStepIndex;

      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetStep = next[measureIndex]?.beats[beatIndex]?.steps[stepIndex];
        if (!targetStep) return prev;
        targetStep.hits = [];
        targetStep.isRest = true;
        return next;
      });
      setActivePresetId(null);
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]
  );

  // Clear entire measure
  const clearMeasure = useCallback(
    (mIdx?: number) => {
      const measureIndex = typeof mIdx === 'number' ? mIdx : selectedMeasureIndex;
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetMeasure = next[measureIndex];
        if (!targetMeasure) return prev;

        targetMeasure.beats.forEach((b) => {
          b.steps.forEach((s) => {
            s.hits = [];
            s.isRest = true;
          });
        });

        return next;
      });
      setActivePresetId(null);
    },
    [selectedMeasureIndex]
  );

  // Add new measure
  const addMeasure = useCallback(() => {
    setMeasures((prev) => {
      const newId = `m${prev.length + 1}`;
      const newMeasure = createDefaultMeasure(newId, timeSignature);
      return [...prev, newMeasure];
    });
    setActivePresetId(null);
  }, [timeSignature]);

  // Remove measure (by index or last measure if not specified)
  const removeMeasure = useCallback((mIdx?: number) => {
    setMeasures((prev) => {
      if (prev.length <= 1) return prev;
      const targetIdx =
        typeof mIdx === 'number' && mIdx >= 0 && mIdx < prev.length
          ? mIdx
          : prev.length - 1;

      const filtered = prev.filter((_, idx) => idx !== targetIdx);
      return filtered.map((measure, idx) => ({
        ...measure,
        id: `m${idx + 1}`,
      }));
    });

    setSelectedMeasureIndex((prevIdx) => {
      if (prevIdx <= 0) return 0;
      const targetIdx = typeof mIdx === 'number' ? mIdx : -1;
      if (targetIdx >= 0 && targetIdx < prevIdx) {
        return prevIdx - 1;
      }
      if (targetIdx === prevIdx) {
        return Math.max(0, prevIdx - 1);
      }
      return prevIdx;
    });
    setSelectedBeatIndex(0);
    setSelectedStepIndex(0);
    setActivePresetId(null);
  }, []);

  // Set time signature
  const setTimeSignature = useCallback((ts: [number, number]) => {
    setTimeSignatureState(ts);
    setMeasures((prev) => {
      return prev.map((m, idx) => createDefaultMeasure(m.id || `m${idx + 1}`, ts));
    });
    setSelectedMeasureIndex(0);
    setSelectedBeatIndex(0);
    setSelectedStepIndex(0);
    setActivePresetId(null);
  }, []);

  // Load a preset
  const loadPreset = useCallback((preset: DrumPreset) => {
    setMeasures(JSON.parse(JSON.stringify(preset.measures)));
    setTimeSignatureState(preset.timeSignature);
    setActivePresetId(preset.id);
    setSelectedMeasureIndex(0);
    setSelectedBeatIndex(0);
    setSelectedStepIndex(0);
  }, []);

  // Restore / Load full score session or exercise
  const loadScoreData = useCallback(
    (
      newMeasures: DrumMeasure[],
      newTimeSignature?: [number, number],
      presetId: string | null = null,
      mIdx: number = 0,
      bIdx: number = 0,
      sIdx: number = 0
    ) => {
      if (!Array.isArray(newMeasures) || newMeasures.length === 0) return;
      const cleanMeasures = JSON.parse(JSON.stringify(newMeasures)) as DrumMeasure[];
      setMeasures(cleanMeasures);
      if (newTimeSignature) {
        setTimeSignatureState(newTimeSignature);
      } else if (cleanMeasures[0]?.timeSignature) {
        setTimeSignatureState(cleanMeasures[0].timeSignature);
      }
      setActivePresetId(presetId);
      setSelectedMeasureIndex(Math.max(0, Math.min(cleanMeasures.length - 1, mIdx)));
      setSelectedBeatIndex(Math.max(0, Math.min((cleanMeasures[mIdx]?.beats.length || 1) - 1, bIdx)));
      setSelectedStepIndex(Math.max(0, sIdx));
    },
    []
  );

  // Helper to construct a step from a RudimentStep
  const createStepFromRudiment = (
    rudStep: RudimentStep,
    stepId: string,
    voicing: VoicingMode,
    beatOffset: number = 0
  ): DrumStep => {
    let pieceId: DrumPieceId = 'snare';

    if (voicing === 'snare') {
      pieceId = rudStep.sticking === 'K' ? 'kick' : 'snare';
    } else {
      // Kit orchestration: use kitPiece or intelligent tom/kick mapping
      if (rudStep.kitPiece) {
        pieceId = rudStep.kitPiece;
      } else if (rudStep.sticking === 'K') {
        pieceId = 'kick';
      } else if (rudStep.accent) {
        const tomRotation: DrumPieceId[] = ['snare', 'tom1', 'tom2', 'floorTom', 'crash'];
        pieceId = tomRotation[beatOffset % tomRotation.length];
      } else {
        pieceId = 'snare';
      }
    }

    const hit: DrumHit = {
      pieceId,
      accent: rudStep.accent,
      ghost: rudStep.ghost,
      sticking: rudStep.sticking,
      flam: rudStep.flam,
      drag: rudStep.drag,
    };

    return {
      id: stepId,
      hits: [hit],
      isRest: false,
      sticking: rudStep.sticking,
      flam: rudStep.flam,
      drag: rudStep.drag,
    };
  };

  // Batch insert rudiment into multiple measures and multiple beats
  const batchInsertRudiment = useCallback(
    (
      rudiment: RudimentItem,
      voicing: VoicingMode = 'snare',
      measureIndices: number[] = [selectedMeasureIndex],
      beatIndices: number[] = [selectedBeatIndex]
    ) => {
      const validMeasures = measureIndices.length > 0 ? measureIndices : [selectedMeasureIndex];
      const validBeats = beatIndices.length > 0 ? beatIndices : [selectedBeatIndex];

      const sub = rudiment.subdivision;
      const isTuplet = [3, 5, 6, 7, 9].includes(sub);
      const ratioMap: Record<number, [number, number]> = {
        3: [3, 2],
        5: [5, 4],
        6: [6, 4],
        7: [7, 4],
        9: [9, 8],
      };

      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];

        validMeasures.forEach((mIdx) => {
          const targetMeasure = next[mIdx];
          if (!targetMeasure) return;

          validBeats.forEach((bIdx) => {
            const targetBeat = targetMeasure.beats[bIdx];
            if (!targetBeat) return;

            targetBeat.subdivision = sub;
            targetBeat.isTuplet = isTuplet;
            targetBeat.tupletRatio = isTuplet ? ratioMap[sub] : undefined;
            targetBeat.steps = rudiment.steps.map((rudStep, sIdx) =>
              createStepFromRudiment(
                rudStep,
                `${targetMeasure.id}-b${bIdx}-s${sIdx}`,
                voicing,
                bIdx
              )
            );
          });
        });

        return next;
      });

      setActivePresetId(null);
    },
    [selectedMeasureIndex, selectedBeatIndex]
  );

  // Fill entire measures with rudiment pattern across multiple measures
  const fillMeasuresWithRudiment = useCallback(
    (
      rudiment: RudimentItem,
      voicing: VoicingMode = 'snare',
      measureIndices: number[] = [selectedMeasureIndex]
    ) => {
      const validMeasures = measureIndices.length > 0 ? measureIndices : [selectedMeasureIndex];

      const sub = rudiment.subdivision;
      const isTuplet = [3, 5, 6, 7, 9].includes(sub);
      const ratioMap: Record<number, [number, number]> = {
        3: [3, 2],
        5: [5, 4],
        6: [6, 4],
        7: [7, 4],
        9: [9, 8],
      };

      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];

        validMeasures.forEach((mIdx) => {
          const targetMeasure = next[mIdx];
          if (!targetMeasure) return;

          targetMeasure.beats.forEach((beat, bIdx) => {
            beat.subdivision = sub;
            beat.isTuplet = isTuplet;
            beat.tupletRatio = isTuplet ? ratioMap[sub] : undefined;
            beat.steps = rudiment.steps.map((rudStep, sIdx) =>
              createStepFromRudiment(
                rudStep,
                `${targetMeasure.id}-b${bIdx}-s${sIdx}`,
                voicing,
                bIdx
              )
            );
          });
        });

        return next;
      });

      setActivePresetId(null);
    },
    [selectedMeasureIndex]
  );

  // Convenience aliases for single-target insertion
  const insertRudimentAtBeat = useCallback(
    (
      rudiment: RudimentItem,
      voicing: VoicingMode = 'snare',
      mIdx?: number,
      bIdx?: number
    ) => {
      const measureIndex = typeof mIdx === 'number' ? mIdx : selectedMeasureIndex;
      const beatIndex = typeof bIdx === 'number' ? bIdx : selectedBeatIndex;
      batchInsertRudiment(rudiment, voicing, [measureIndex], [beatIndex]);
    },
    [batchInsertRudiment, selectedMeasureIndex, selectedBeatIndex]
  );

  const fillMeasureWithRudiment = useCallback(
    (
      rudiment: RudimentItem,
      voicing: VoicingMode = 'snare',
      mIdx?: number
    ) => {
      const measureIndex = typeof mIdx === 'number' ? mIdx : selectedMeasureIndex;
      fillMeasuresWithRudiment(rudiment, voicing, [measureIndex]);
    },
    [fillMeasuresWithRudiment, selectedMeasureIndex]
  );

  return {
    measures,
    timeSignature,
    activePresetId,
    selectedMeasureIndex,
    selectedBeatIndex,
    selectedStepIndex,
    selectedMeasure,
    selectedBeat,
    selectedStep,
    isAccentMode,
    isGhostMode,
    selectStep,
    navigateStep,
    changeBeatSubdivision,
    toggleDrumPiece,
    toggleAccent,
    toggleGhost,
    toggleRest,
    clearStep,
    clearMeasure,
    addMeasure,
    removeMeasure,
    setTimeSignature,
    loadPreset,
    loadScoreData,
    batchInsertRudiment,
    fillMeasuresWithRudiment,
    insertRudimentAtBeat,
    fillMeasureWithRudiment,
  };
}
