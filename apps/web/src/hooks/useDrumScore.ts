'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  DrumMeasure,
  DrumBeat,
  DrumStep,
  DrumPieceId,
  DrumPreset,
  SUBDIVISION_OPTIONS,
} from '@/types/drum';
import { DRUM_PRESETS } from '@/lib/drumPresets';

function createEmptyBeat(measureId: string, beatIndex: number, subdivision: number = 4): DrumBeat {
  const isTuplet = [3, 5, 6, 7].includes(subdivision);
  const ratioMap: Record<number, [number, number]> = {
    3: [3, 2],
    5: [5, 4],
    6: [6, 4],
    7: [7, 4],
  };

  const steps: DrumStep[] = [];
  for (let s = 0; s < subdivision; s++) {
    steps.push({
      id: `${measureId}-b${beatIndex}-s${s}`,
      hits: [],
    });
  }

  return {
    id: `${measureId}-b${beatIndex}`,
    beatIndex,
    subdivision,
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

  // Change subdivision of a beat (supports regular & tuplets 3:2, 5:4, 6:4, 7:4)
  const changeBeatSubdivision = useCallback(
    (newSubdivision: number, mIdx: number = selectedMeasureIndex, bIdx: number = selectedBeatIndex) => {
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetMeasure = next[mIdx];
        if (!targetMeasure) return prev;
        const targetBeat = targetMeasure.beats[bIdx];
        if (!targetBeat) return prev;

        const isTuplet = [3, 5, 6, 7].includes(newSubdivision);
        const ratioMap: Record<number, [number, number]> = {
          3: [3, 2],
          5: [5, 4],
          6: [6, 4],
          7: [7, 4],
        };

        const oldSteps = targetBeat.steps;
        const newSteps: DrumStep[] = [];

        for (let s = 0; s < newSubdivision; s++) {
          // Preserve previous hits if existing at same index
          const prevHits = oldSteps[s]?.hits ? [...oldSteps[s].hits] : [];
          newSteps.push({
            id: `${targetMeasure.id}-b${bIdx}-s${s}`,
            hits: prevHits,
          });
        }

        targetBeat.subdivision = newSubdivision;
        targetBeat.isTuplet = isTuplet;
        targetBeat.tupletRatio = isTuplet ? ratioMap[newSubdivision] : undefined;
        targetBeat.steps = newSteps;

        return next;
      });

      // Clamp step cursor if previous step was out of bounds
      setSelectedStepIndex((prev) => Math.min(prev, newSubdivision - 1));
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

        const existingIdx = targetStep.hits.findIndex((h) => h.pieceId === pieceId);

        // Hi-Hat special cycling: closed -> open -> none
        if (pieceId === 'hihatClosed') {
          const openIdx = targetStep.hits.findIndex((h) => h.pieceId === 'hihatOpen');
          if (existingIdx >= 0) {
            // Switch closed to open
            targetStep.hits.splice(existingIdx, 1);
            targetStep.hits.push({ pieceId: 'hihatOpen' });
          } else if (openIdx >= 0) {
            // Remove hihat completely
            targetStep.hits.splice(openIdx, 1);
          } else {
            // Add closed hihat
            targetStep.hits.push({ pieceId: 'hihatClosed' });
          }
        } else if (pieceId === 'hihatOpen') {
          const closedIdx = targetStep.hits.findIndex((h) => h.pieceId === 'hihatClosed');
          if (closedIdx >= 0) {
            targetStep.hits.splice(closedIdx, 1);
          }
          if (existingIdx >= 0) {
            targetStep.hits.splice(existingIdx, 1);
          } else {
            targetStep.hits.push({ pieceId: 'hihatOpen' });
          }
        } else {
          // Standard toggle
          if (existingIdx >= 0) {
            targetStep.hits.splice(existingIdx, 1);
          } else {
            targetStep.hits.push({ pieceId });
          }
        }

        return next;
      });
      setActivePresetId(null);
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]
  );

  // Toggle accent on selected step hits
  const toggleAccent = useCallback(
    (
      mIdx: number = selectedMeasureIndex,
      bIdx: number = selectedBeatIndex,
      sIdx: number = selectedStepIndex
    ) => {
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetStep = next[mIdx]?.beats[bIdx]?.steps[sIdx];
        if (!targetStep || targetStep.hits.length === 0) return prev;

        const currentlyAccented = targetStep.hits.some((h) => h.accent);
        targetStep.hits.forEach((h) => {
          h.accent = !currentlyAccented;
          if (h.accent) h.ghost = false; // mutually exclusive
        });

        return next;
      });
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]
  );

  // Toggle ghost note on selected step hits
  const toggleGhost = useCallback(
    (
      mIdx: number = selectedMeasureIndex,
      bIdx: number = selectedBeatIndex,
      sIdx: number = selectedStepIndex
    ) => {
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetStep = next[mIdx]?.beats[bIdx]?.steps[sIdx];
        if (!targetStep || targetStep.hits.length === 0) return prev;

        const currentlyGhost = targetStep.hits.some((h) => h.ghost);
        targetStep.hits.forEach((h) => {
          h.ghost = !currentlyGhost;
          if (h.ghost) h.accent = false; // mutually exclusive
        });

        return next;
      });
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]
  );

  // Clear a specific step
  const clearStep = useCallback(
    (
      mIdx: number = selectedMeasureIndex,
      bIdx: number = selectedBeatIndex,
      sIdx: number = selectedStepIndex
    ) => {
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetStep = next[mIdx]?.beats[bIdx]?.steps[sIdx];
        if (!targetStep) return prev;
        targetStep.hits = [];
        return next;
      });
      setActivePresetId(null);
    },
    [selectedMeasureIndex, selectedBeatIndex, selectedStepIndex]
  );

  // Clear entire measure
  const clearMeasure = useCallback(
    (mIdx: number = selectedMeasureIndex) => {
      setMeasures((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as DrumMeasure[];
        const targetMeasure = next[mIdx];
        if (!targetMeasure) return prev;

        targetMeasure.beats.forEach((b) => {
          b.steps.forEach((s) => {
            s.hits = [];
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

  // Remove measure
  const removeMeasure = useCallback((mIdx: number) => {
    setMeasures((prev) => {
      if (prev.length <= 1) return prev; // keep at least 1 measure
      const next = prev.filter((_, idx) => idx !== mIdx);
      return next;
    });
    setSelectedMeasureIndex((prev) => Math.max(0, prev - 1));
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
    selectStep,
    navigateStep,
    changeBeatSubdivision,
    toggleDrumPiece,
    toggleAccent,
    toggleGhost,
    clearStep,
    clearMeasure,
    addMeasure,
    removeMeasure,
    setTimeSignature,
    loadPreset,
  };
}
