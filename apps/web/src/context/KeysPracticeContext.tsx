'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HandFocus, PracticeRoutine, WORKOUT_LEVELS } from '@/data/practiceWorkoutsData';
import { RunwayNoteEvent, generateWorkoutRunwayNotes } from '@/services/theory/workoutEngine';
import { VoicingType, AccompanimentTexture } from '@/services/theory/keysTheoryEngine';
import { TimbreType, keysAudioEngine } from '@/services/audio/keysAudioEngine';

export interface WorkoutSessionData {
  title: string;
  bpm: number;
  timeSignature: string;
  handFocus: HandFocus;
  tonic: string;
  objective?: string;
  category?: 'scale' | 'chord' | 'progression' | 'cadencia' | 'progresion';
  targetItemId?: string;
  voicingType?: VoicingType;
  texture?: AccompanimentTexture;
  subdivision?: string;
  leftHandInstruction?: string;
  rightHandInstruction?: string;
  pedagogicalTip?: string;
}

export interface KeysPracticeContextType {
  currentWorkout: WorkoutSessionData;
  runwayNotes: RunwayNoteEvent[];
  sourceTheory: string;
  timbre: TimbreType;
  volumeDb: number;
  sustainActive: boolean;
  setPracticeSession: (data: {
    currentWorkout?: Partial<WorkoutSessionData>;
    runwayNotes?: RunwayNoteEvent[];
    sourceTheory?: string;
    timbre?: TimbreType;
  }) => void;
  updateBpm: (bpm: number) => void;
  updateHandFocus: (hand: HandFocus) => void;
  updateTimbre: (timbre: TimbreType) => void;
  updateVolume: (db: number) => void;
  toggleSustain: () => void;
  resetToDefault: () => void;
}

const STORAGE_KEY = 'sonora_keys_practice_session_v1';

// Default initial workout
const defaultRoutine = WORKOUT_LEVELS[0].routines[0];
const defaultInitialWorkout: WorkoutSessionData = {
  title: defaultRoutine.title,
  bpm: defaultRoutine.bpm || 80,
  timeSignature: '4/4',
  handFocus: defaultRoutine.handFocus || 'left',
  tonic: defaultRoutine.rootNote || 'C',
  objective: defaultRoutine.objective,
  category: defaultRoutine.category,
  targetItemId: defaultRoutine.targetItemId,
  voicingType: defaultRoutine.voicingType,
  texture: defaultRoutine.texture,
  subdivision: '1/8',
  leftHandInstruction: defaultRoutine.leftHandInstruction,
  rightHandInstruction: defaultRoutine.rightHandInstruction,
  pedagogicalTip: defaultRoutine.pedagogicalTip,
};

const defaultInitialNotes = generateWorkoutRunwayNotes(defaultRoutine, 'C');

const KeysPracticeContext = createContext<KeysPracticeContextType | undefined>(undefined);

export function KeysPracticeProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSessionData>(defaultInitialWorkout);
  const [runwayNotes, setRunwayNotes] = useState<RunwayNoteEvent[]>(defaultInitialNotes);
  const [sourceTheory, setSourceTheory] = useState<string>(
    `${defaultRoutine.title} - Tónica C`
  );
  const [timbre, setTimbre] = useState<TimbreType>('grand');
  const [volumeDb, setVolumeDb] = useState<number>(0);
  const [sustainActive, setSustainActive] = useState<boolean>(false);

  // Restore saved session from sessionStorage on client mount
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.currentWorkout) setCurrentWorkout(parsed.currentWorkout);
          if (parsed.runwayNotes && parsed.runwayNotes.length > 0) {
            setRunwayNotes(parsed.runwayNotes);
          }
          if (parsed.sourceTheory) setSourceTheory(parsed.sourceTheory);
          if (parsed.timbre) {
            setTimbre(parsed.timbre);
            keysAudioEngine.setTimbre(parsed.timbre);
          }
        }
      }
    } catch (e) {
      console.warn('Error recovering KeysPracticeSession from storage:', e);
    }
  }, []);

  // Update session and persist
  const setPracticeSession = useCallback(
    (data: {
      currentWorkout?: Partial<WorkoutSessionData>;
      runwayNotes?: RunwayNoteEvent[];
      sourceTheory?: string;
      timbre?: TimbreType;
    }) => {
      let updatedWorkout = currentWorkout;
      if (data.currentWorkout) {
        updatedWorkout = { ...currentWorkout, ...data.currentWorkout };
        setCurrentWorkout(updatedWorkout);
      }

      let updatedNotes = runwayNotes;
      if (data.runwayNotes) {
        updatedNotes = data.runwayNotes;
        setRunwayNotes(updatedNotes);
      }

      let updatedTheory = sourceTheory;
      if (data.sourceTheory !== undefined) {
        updatedTheory = data.sourceTheory;
        setSourceTheory(updatedTheory);
      }

      let updatedTimbre = timbre;
      if (data.timbre) {
        updatedTimbre = data.timbre;
        setTimbre(updatedTimbre);
        keysAudioEngine.setTimbre(updatedTimbre);
      }

      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              currentWorkout: updatedWorkout,
              runwayNotes: updatedNotes,
              sourceTheory: updatedTheory,
              timbre: updatedTimbre,
            })
          );
        }
      } catch (e) {
        console.warn('Error saving KeysPracticeSession to storage:', e);
      }
    },
    [currentWorkout, runwayNotes, sourceTheory, timbre]
  );

  const updateBpm = useCallback(
    (bpm: number) => {
      setCurrentWorkout((prev) => {
        const next = { ...prev, bpm };
        try {
          if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : {};
            sessionStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ ...parsed, currentWorkout: next })
            );
          }
        } catch (e) {}
        return next;
      });
    },
    []
  );

  const updateHandFocus = useCallback(
    (handFocus: HandFocus) => {
      setCurrentWorkout((prev) => {
        const next = { ...prev, handFocus };
        try {
          if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : {};
            sessionStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ ...parsed, currentWorkout: next })
            );
          }
        } catch (e) {}
        return next;
      });
    },
    []
  );

  const updateTimbre = useCallback((newTimbre: TimbreType) => {
    setTimbre(newTimbre);
    keysAudioEngine.setTimbre(newTimbre);
  }, []);

  const updateVolume = useCallback((db: number) => {
    setVolumeDb(db);
    keysAudioEngine.setVolume(db);
  }, []);

  const toggleSustain = useCallback(() => {
    setSustainActive((prev) => {
      const next = !prev;
      keysAudioEngine.setSustainPedal(next);
      return next;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    setCurrentWorkout(defaultInitialWorkout);
    setRunwayNotes(defaultInitialNotes);
    setSourceTheory(`${defaultRoutine.title} - Tónica C`);
    setTimbre('grand');
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }, []);

  return (
    <KeysPracticeContext.Provider
      value={{
        currentWorkout,
        runwayNotes,
        sourceTheory,
        timbre,
        volumeDb,
        sustainActive,
        setPracticeSession,
        updateBpm,
        updateHandFocus,
        updateTimbre,
        updateVolume,
        toggleSustain,
        resetToDefault,
      }}
    >
      {children}
    </KeysPracticeContext.Provider>
  );
}

export function useKeysPractice() {
  const context = useContext(KeysPracticeContext);
  if (!context) {
    throw new Error('useKeysPractice must be used within a KeysPracticeProvider');
  }
  return context;
}
