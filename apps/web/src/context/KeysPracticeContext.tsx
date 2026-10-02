'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HandFocus, WORKOUT_LEVELS } from '@/data/practiceWorkoutsData';
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

// ─── Safe module-level defaults ────────────────────────────────────────────────
// These are computed once at module load. generateWorkoutRunwayNotes is wrapped
// in a try/catch so that if it throws server-side or in a bad state, we degrade
// gracefully to an empty array instead of crashing the entire module.
const defaultRoutine = WORKOUT_LEVELS[0]?.routines[0];

const defaultInitialWorkout: WorkoutSessionData = defaultRoutine
  ? {
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
    }
  : {
      title: 'Escala de Do Mayor',
      bpm: 80,
      timeSignature: '4/4',
      handFocus: 'left',
      tonic: 'C',
      subdivision: '1/8',
    };

// Safe generator — never throws, always returns an array (possibly empty)
function safeGenerateDefaultNotes(): RunwayNoteEvent[] {
  try {
    if (!defaultRoutine) return [];
    const notes = generateWorkoutRunwayNotes(defaultRoutine, 'C');
    return Array.isArray(notes) ? notes : [];
  } catch (e) {
    console.warn('[KeysPracticeContext] Could not generate default runway notes:', e);
    return [];
  }
}

const defaultInitialNotes = safeGenerateDefaultNotes();

// ─── Context creation ──────────────────────────────────────────────────────────
const KeysPracticeContext = createContext<KeysPracticeContextType | undefined>(undefined);

export function KeysPracticeProvider({ children }: { children: React.ReactNode }) {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutSessionData>(defaultInitialWorkout);
  const [runwayNotes, setRunwayNotes] = useState<RunwayNoteEvent[]>(defaultInitialNotes);
  const [sourceTheory, setSourceTheory] = useState<string>(
    defaultRoutine ? `${defaultRoutine.title} - Tónica C` : 'Sesión de Práctica'
  );
  const [timbre, setTimbre] = useState<TimbreType>('grand');
  const [volumeDb, setVolumeDb] = useState<number>(0);
  const [sustainActive, setSustainActive] = useState<boolean>(false);

  // Restore saved session from sessionStorage on client mount
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (parsed.currentWorkout && typeof parsed.currentWorkout === 'object') {
        setCurrentWorkout((prev) => ({ ...prev, ...parsed.currentWorkout }));
      }

      if (Array.isArray(parsed.runwayNotes) && parsed.runwayNotes.length > 0) {
        setRunwayNotes(parsed.runwayNotes);
      }

      if (typeof parsed.sourceTheory === 'string' && parsed.sourceTheory) {
        setSourceTheory(parsed.sourceTheory);
      }

      if (parsed.timbre === 'grand' || parsed.timbre === 'rhodes') {
        setTimbre(parsed.timbre);
        keysAudioEngine.setTimbre(parsed.timbre);
      }
    } catch (e) {
      console.warn('[KeysPracticeContext] Could not restore session from sessionStorage:', e);
    }
  }, []);

  // Persist session helper (extracted to avoid repetition)
  const persistSession = useCallback(
    (
      workout: WorkoutSessionData,
      notes: RunwayNoteEvent[],
      theory: string,
      currentTimbre: TimbreType
    ) => {
      try {
        if (typeof window === 'undefined') return;
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ currentWorkout: workout, runwayNotes: notes, sourceTheory: theory, timbre: currentTimbre })
        );
      } catch (e) {
        console.warn('[KeysPracticeContext] Could not persist session to sessionStorage:', e);
      }
    },
    []
  );

  // Update session and persist
  const setPracticeSession = useCallback(
    (data: {
      currentWorkout?: Partial<WorkoutSessionData>;
      runwayNotes?: RunwayNoteEvent[];
      sourceTheory?: string;
      timbre?: TimbreType;
    }) => {
      let updatedWorkout = currentWorkout;
      if (data.currentWorkout && typeof data.currentWorkout === 'object') {
        updatedWorkout = { ...currentWorkout, ...data.currentWorkout };
        setCurrentWorkout(updatedWorkout);
      }

      // Guard: always store a valid array, even if caller passes null/undefined
      let updatedNotes = runwayNotes;
      if (data.runwayNotes !== undefined) {
        updatedNotes = Array.isArray(data.runwayNotes) ? data.runwayNotes : [];
        setRunwayNotes(updatedNotes);
      }

      let updatedTheory = sourceTheory;
      if (typeof data.sourceTheory === 'string') {
        updatedTheory = data.sourceTheory;
        setSourceTheory(updatedTheory);
      }

      let updatedTimbre = timbre;
      if (data.timbre === 'grand' || data.timbre === 'rhodes') {
        updatedTimbre = data.timbre;
        setTimbre(updatedTimbre);
        keysAudioEngine.setTimbre(updatedTimbre);
      }

      persistSession(updatedWorkout, updatedNotes, updatedTheory, updatedTimbre);
    },
    [currentWorkout, runwayNotes, sourceTheory, timbre, persistSession]
  );

  const updateBpm = useCallback(
    (bpm: number) => {
      setCurrentWorkout((prev) => {
        const next = { ...prev, bpm };
        persistSession(next, runwayNotes, sourceTheory, timbre);
        return next;
      });
    },
    [runwayNotes, sourceTheory, timbre, persistSession]
  );

  const updateHandFocus = useCallback(
    (handFocus: HandFocus) => {
      setCurrentWorkout((prev) => {
        const next = { ...prev, handFocus };
        persistSession(next, runwayNotes, sourceTheory, timbre);
        return next;
      });
    },
    [runwayNotes, sourceTheory, timbre, persistSession]
  );

  const updateTimbre = useCallback(
    (newTimbre: TimbreType) => {
      setTimbre(newTimbre);
      keysAudioEngine.setTimbre(newTimbre);
    },
    []
  );

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
    setSourceTheory(defaultRoutine ? `${defaultRoutine.title} - Tónica C` : 'Sesión de Práctica');
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

/**
 * useKeysPractice — hook seguro que NUNCA lanza excepción.
 *
 * En lugar de hacer throw cuando el context es undefined (lo cual
 * interrumpe el render antes de que todos los hooks del componente
 * consumidor completen → React error #300), retorna el contexto
 * o `null`. Los componentes consumidores deben comprobar si el valor
 * es null y renderizar un fallback en su lugar.
 *
 * IMPORTANTE: el throw previo era el origen del React error #300.
 */
export function useKeysPractice(): KeysPracticeContextType {
  const context = useContext(KeysPracticeContext);

  // ⚠️  NEVER throw here — a throw inside a hook call propagates before React
  // can finish counting hooks, leaving the internal hooks-count mismatched
  // between renders and triggering the minified error #300.
  //
  // Instead, return a safe "stub" context when the provider is missing.
  // This can only happen in tests or accidental usage outside the provider.
  if (!context) {
    // Return a no-op stub so the consuming component can still render
    // and show its own error UI without crashing the hook chain.
    const stub: KeysPracticeContextType = {
      currentWorkout: defaultInitialWorkout,
      runwayNotes: defaultInitialNotes,
      sourceTheory: 'Sin sesión activa',
      timbre: 'grand',
      volumeDb: 0,
      sustainActive: false,
      setPracticeSession: () => {
        console.warn('[useKeysPractice] Called outside KeysPracticeProvider');
      },
      updateBpm: () => {},
      updateHandFocus: () => {},
      updateTimbre: () => {},
      updateVolume: () => {},
      toggleSustain: () => {},
      resetToDefault: () => {},
    };
    return stub;
  }

  return context;
}
