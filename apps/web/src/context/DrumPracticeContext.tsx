'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { DrumMeasure, DrumPieceId, DRUM_PIECES } from '@/types/drum';
import { DRUM_PRESETS } from '@/lib/drumPresets';

export interface DrumNoteEvent {
  id: string;
  time: number; // in beats from start of session (0, 0.25, 0.5, 1.0...)
  durationBeats: number;
  measureIndex: number;
  beatIndex: number;
  stepIndex: number;
  pieceId: DrumPieceId;
  velocity: number; // 0 to 1
  sticking?: 'R' | 'L' | 'K' | 'B' | string;
  accent?: boolean;
  ghost?: boolean;
  flam?: boolean;
  drag?: boolean;
  subdivision?: number;
  isSyncopated?: boolean;
}

export type DrumDisplayMode = 'runway' | 'sheet';

export interface DrumSessionData {
  title: string;
  bpm: number;
  timeSignature: [number, number];
  measures: DrumMeasure[];
  drumEvents: DrumNoteEvent[];
  displayMode: DrumDisplayMode;
  isMetronomeActive: boolean;
  metronomeVolume: number;
}

export interface DrumPracticeContextType {
  title: string;
  bpm: number;
  timeSignature: [number, number];
  measures: DrumMeasure[];
  drumEvents: DrumNoteEvent[];
  displayMode: DrumDisplayMode;
  isMetronomeActive: boolean;
  metronomeVolume: number;
  setSession: (data: Partial<DrumSessionData>) => void;
  updateBpm: (bpm: number) => void;
  updateTimeSignature: (ts: [number, number]) => void;
  updateMeasures: (measures: DrumMeasure[], newTitle?: string) => void;
  setDisplayMode: (mode: DrumDisplayMode) => void;
  toggleMetronome: () => void;
  setMetronomeVolume: (db: number) => void;
}

const STORAGE_KEY = 'sonora_drum_practice_session_v1';

/**
 * Compila la estructura jerárquica de compases (DrumMeasure[]) a una secuencia
 * lineal continua de eventos de notas (DrumNoteEvent[]) para el runway y el reproductor a 60 FPS.
 */
export function compileMeasuresToDrumEvents(measures: DrumMeasure[]): DrumNoteEvent[] {
  if (!Array.isArray(measures) || measures.length === 0) return [];

  const events: DrumNoteEvent[] = [];
  let currentTotalBeats = 0;

  measures.forEach((measure, mIdx) => {
    const [beatsCount] = measure.timeSignature || [4, 4];
    const measureStartBeat = currentTotalBeats;

    measure.beats.forEach((beat, bIdx) => {
      const beatStartBeat = measureStartBeat + bIdx;
      const sub = beat.subdivision || 4;
      const stepDurationBeats = sub === 0.25 ? 4 : sub === 0.5 ? 2 : 1 / sub;

      beat.steps.forEach((step, sIdx) => {
        const stepTime = beatStartBeat + sIdx * stepDurationBeats;

        if (step.hits && step.hits.length > 0) {
          step.hits.forEach((hit, hIdx) => {
            // Deducir sticking si no está especificado
            let sticking = hit.sticking || step.sticking;
            if (!sticking) {
              if (hit.pieceId === 'kick') {
                sticking = 'K';
              } else if (hit.pieceId === 'hihatFoot') {
                sticking = 'F';
              } else {
                // Alternar por defecto R/L en golpes de manos
                sticking = (bIdx * sub + sIdx + hIdx) % 2 === 0 ? 'R' : 'L';
              }
            }

            const velocity = hit.accent ? 1.0 : hit.ghost ? 0.28 : 0.72;

            events.push({
              id: `${measure.id || mIdx}-b${bIdx}-s${sIdx}-${hit.pieceId}-${hIdx}`,
              time: stepTime,
              durationBeats: stepDurationBeats,
              measureIndex: mIdx,
              beatIndex: bIdx,
              stepIndex: sIdx,
              pieceId: hit.pieceId,
              velocity,
              sticking,
              accent: hit.accent,
              ghost: hit.ghost,
              flam: hit.flam || step.flam,
              drag: hit.drag || step.drag,
              subdivision: sub,
              isSyncopated: hit.isSyncopated || step.isSyncopated,
            });
          });
        }
      });
    });

    currentTotalBeats += beatsCount;
  });

  return events.sort((a, b) => a.time - b.time);
}

const defaultPreset = DRUM_PRESETS[0];
const defaultInitialMeasures = JSON.parse(JSON.stringify(defaultPreset.measures));
const defaultInitialEvents = compileMeasuresToDrumEvents(defaultInitialMeasures);

const defaultInitialSession: DrumSessionData = {
  title: defaultPreset.name || 'Classic Rock Groove',
  bpm: defaultPreset.bpm || 95,
  timeSignature: defaultPreset.timeSignature || [4, 4],
  measures: defaultInitialMeasures,
  drumEvents: defaultInitialEvents,
  displayMode: 'runway',
  isMetronomeActive: false,
  metronomeVolume: 0,
};

const DrumPracticeContext = createContext<DrumPracticeContextType | undefined>(undefined);

export function DrumPracticeProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<DrumSessionData>(defaultInitialSession);

  // Restaurar desde sessionStorage al montar
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const compiled =
          Array.isArray(parsed.measures) && parsed.measures.length > 0
            ? compileMeasuresToDrumEvents(parsed.measures)
            : defaultInitialEvents;

        setSessionState((prev) => ({
          ...prev,
          title: parsed.title || prev.title,
          bpm: parsed.bpm || prev.bpm,
          timeSignature: parsed.timeSignature || prev.timeSignature,
          measures: parsed.measures || prev.measures,
          drumEvents: compiled,
          displayMode: parsed.displayMode || prev.displayMode,
          isMetronomeActive: !!parsed.isMetronomeActive,
          metronomeVolume: parsed.metronomeVolume ?? prev.metronomeVolume,
        }));
      }
    } catch (e) {
      console.warn('[DrumPracticeContext] Could not restore session from storage:', e);
    }
  }, []);

  // Persistir en sessionStorage
  const persistSession = useCallback((updated: DrumSessionData) => {
    try {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[DrumPracticeContext] Could not persist session to storage:', e);
    }
  }, []);

  const setSession = useCallback(
    (data: Partial<DrumSessionData>) => {
      setSessionState((prev) => {
        let updatedMeasures = data.measures !== undefined ? data.measures : prev.measures;
        let updatedEvents =
          data.drumEvents !== undefined
            ? data.drumEvents
            : data.measures !== undefined
            ? compileMeasuresToDrumEvents(data.measures)
            : prev.drumEvents;

        const next: DrumSessionData = {
          ...prev,
          ...data,
          measures: updatedMeasures,
          drumEvents: updatedEvents,
        };
        persistSession(next);
        return next;
      });
    },
    [persistSession]
  );

  const updateBpm = useCallback(
    (bpm: number) => {
      const clamped = Math.max(30, Math.min(260, bpm));
      setSession({ bpm: clamped });
    },
    [setSession]
  );

  const updateTimeSignature = useCallback(
    (timeSignature: [number, number]) => {
      setSession({ timeSignature });
    },
    [setSession]
  );

  const updateMeasures = useCallback(
    (measures: DrumMeasure[], newTitle?: string) => {
      const compiled = compileMeasuresToDrumEvents(measures);
      setSession({
        measures,
        drumEvents: compiled,
        ...(newTitle ? { title: newTitle } : {}),
      });
    },
    [setSession]
  );

  const setDisplayMode = useCallback(
    (displayMode: DrumDisplayMode) => {
      setSession({ displayMode });
    },
    [setSession]
  );

  const toggleMetronome = useCallback(() => {
    setSessionState((prev) => {
      const next = { ...prev, isMetronomeActive: !prev.isMetronomeActive };
      persistSession(next);
      return next;
    });
  }, [persistSession]);

  const setMetronomeVolume = useCallback(
    (metronomeVolume: number) => {
      setSession({ metronomeVolume });
    },
    [setSession]
  );

  const contextValue = useMemo<DrumPracticeContextType>(
    () => ({
      title: session.title,
      bpm: session.bpm,
      timeSignature: session.timeSignature,
      measures: session.measures,
      drumEvents: session.drumEvents,
      displayMode: session.displayMode,
      isMetronomeActive: session.isMetronomeActive,
      metronomeVolume: session.metronomeVolume,
      setSession,
      updateBpm,
      updateTimeSignature,
      updateMeasures,
      setDisplayMode,
      toggleMetronome,
      setMetronomeVolume,
    }),
    [
      session,
      setSession,
      updateBpm,
      updateTimeSignature,
      updateMeasures,
      setDisplayMode,
      toggleMetronome,
      setMetronomeVolume,
    ]
  );

  return (
    <DrumPracticeContext.Provider value={contextValue}>
      {children}
    </DrumPracticeContext.Provider>
  );
}

/**
 * Hook seguro useDrumPractice:
 * Nunca lanza excepción fuera del provider (devuelve un stub seguro para evitar React Error #300).
 */
export function useDrumPractice(): DrumPracticeContextType {
  const ctx = useContext(DrumPracticeContext);
  if (!ctx) {
    return {
      ...defaultInitialSession,
      setSession: () => console.warn('[useDrumPractice] Called outside DrumPracticeProvider'),
      updateBpm: () => {},
      updateTimeSignature: () => {},
      updateMeasures: () => {},
      setDisplayMode: () => {},
      toggleMetronome: () => {},
      setMetronomeVolume: () => {},
    };
  }
  return ctx;
}
