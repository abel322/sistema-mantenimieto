'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  InstrumentType,
  TuningId,
  StringTrack,
  TheoryMode,
  MusicalKey,
  ScaleType,
  ArpeggioType,
  ChordVoicingType,
  VoicingShapeId,
  StringArticulation,
} from '@/types/strings';
import { calculateFretNote } from '@/services/audio/stringsAudioEngine';

export interface StringNoteEvent {
  id: string;
  stringIndex: number; // 0 to N-1 (0 is highest string, N-1 lowest)
  fret: number; // 0 (open string) to 24
  step: number; // 0 to totalSteps - 1
  timeBeats: number; // in beats (step * stepDurationInBeats)
  duration: string; // '16n', '8n', '4n', etc.
  durationBeats: number;
  articulation?: StringArticulation;
  midi: number;
  noteName: string;
  octave: number;
  fullNote: string;
  isRoot?: boolean;
  interval?: string;
}

export interface ActiveTheoryState {
  mode: TheoryMode;
  key: MusicalKey;
  scaleType?: ScaleType;
  arpeggioType?: ArpeggioType;
  chordVoicingType?: ChordVoicingType;
  voicingShapeId?: VoicingShapeId;
  range?: 'all' | 'box_root' | 'box_octave';
  title: string;
  description?: string;
}

export type StringsDisplayMode = 'runway' | 'tab';

export interface StringsSessionData {
  title: string;
  instrument: InstrumentType;
  tuning: TuningId;
  bpm: number;
  timeSignature: [number, number];
  measuresCount: number;
  tracks: StringTrack[];
  tabEvents: StringNoteEvent[];
  activeTheory: ActiveTheoryState;
  displayMode: StringsDisplayMode;
  isMetronomeActive: boolean;
}

export interface StringsPracticeContextType {
  title: string;
  instrument: InstrumentType;
  tuning: TuningId;
  bpm: number;
  timeSignature: [number, number];
  measuresCount: number;
  tracks: StringTrack[];
  tabEvents: StringNoteEvent[];
  activeTheory: ActiveTheoryState;
  displayMode: StringsDisplayMode;
  isMetronomeActive: boolean;
  setSession: (data: Partial<StringsSessionData>) => void;
  updateBpm: (bpm: number) => void;
  updateInstrument: (instrument: InstrumentType) => void;
  updateTuning: (tuning: TuningId) => void;
  updateTracks: (tracks: StringTrack[]) => void;
  updateTheory: (theory: Partial<ActiveTheoryState>) => void;
  setDisplayMode: (mode: StringsDisplayMode) => void;
  toggleMetronome: () => void;
}

const STORAGE_KEY = 'sonora_strings_practice_session_v1';

/**
 * Compila las pistas matriciales de cuerdas (StringTrack[]) a una secuencia
 * lineal continua de eventos de notas (StringNoteEvent[]) para el runway de práctica a 60 FPS.
 */
export function compileTracksToStringNoteEvents(
  tracks: StringTrack[],
  activeTheory?: ActiveTheoryState
): StringNoteEvent[] {
  if (!Array.isArray(tracks) || tracks.length === 0) return [];

  const events: StringNoteEvent[] = [];
  const rootKey = activeTheory?.key?.toUpperCase() || 'E';

  tracks.forEach((track) => {
    track.steps.forEach((cell, stepIdx) => {
      if (cell.fret !== null && cell.fret !== undefined) {
        const fretInfo = calculateFretNote(track.basePitch, cell.fret);
        const isRoot = fretInfo.noteName.toUpperCase() === rootKey;

        // Step duration in beats (16th note = 0.25 beats)
        const stepTimeBeats = stepIdx * 0.25;

        events.push({
          id: `str-${track.stringIndex}-fret-${cell.fret}-step-${stepIdx}`,
          stringIndex: track.stringIndex,
          fret: cell.fret,
          step: stepIdx,
          timeBeats: stepTimeBeats,
          duration: cell.duration || '16n',
          durationBeats: 0.25,
          articulation: cell.articulation || 'normal',
          midi: fretInfo.midi,
          noteName: fretInfo.noteName,
          octave: fretInfo.octave,
          fullNote: fretInfo.fullNote,
          isRoot,
        });
      }
    });
  });

  // Ordenar cronológicamente por step / tiempo
  events.sort((a, b) => a.step - b.step || a.stringIndex - b.stringIndex);
  return events;
}

const defaultInitialTheory: ActiveTheoryState = {
  mode: 'arpeggio',
  key: 'E',
  arpeggioType: 'minor_triad',
  range: 'all',
  title: 'Tríada Menor de Mi (E Minor Arpeggio)',
  description: 'Arpegio menor en corcheas para bajo y guitarra',
};

const defaultInitialSession: StringsSessionData = {
  title: 'Práctica de Cuerdas Sonora',
  instrument: 'guitar_6',
  tuning: 'standard',
  bpm: 100,
  timeSignature: [4, 4],
  measuresCount: 2,
  tracks: [],
  tabEvents: [],
  activeTheory: defaultInitialTheory,
  displayMode: 'runway',
  isMetronomeActive: false,
};

const StringsPracticeContext = createContext<StringsPracticeContextType | null>(null);

export function StringsPracticeProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<StringsSessionData>(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            ...defaultInitialSession,
            ...parsed,
            activeTheory: { ...defaultInitialTheory, ...(parsed.activeTheory || {}) },
          };
        }
      } catch (e) {
        console.warn('[StringsPracticeContext] Error loading session from storage:', e);
      }
    }
    return defaultInitialSession;
  });

  // Persistir en sessionStorage cuando cambie la sesión
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('[StringsPracticeContext] Error persisting session:', e);
      }
    }
  }, [session]);

  const setSession = useCallback((data: Partial<StringsSessionData>) => {
    setSessionState((prev) => {
      const merged = { ...prev, ...data };
      if (data.tracks && (!data.tabEvents || data.tabEvents.length === 0)) {
        merged.tabEvents = compileTracksToStringNoteEvents(data.tracks, merged.activeTheory);
      }
      return merged;
    });
  }, []);

  const updateBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(40, Math.min(260, Math.round(newBpm)));
    setSessionState((prev) => ({ ...prev, bpm: clamped }));
  }, []);

  const updateInstrument = useCallback((instrument: InstrumentType) => {
    setSessionState((prev) => ({ ...prev, instrument }));
  }, []);

  const updateTuning = useCallback((tuning: TuningId) => {
    setSessionState((prev) => ({ ...prev, tuning }));
  }, []);

  const updateTracks = useCallback((tracks: StringTrack[]) => {
    setSessionState((prev) => ({
      ...prev,
      tracks,
      tabEvents: compileTracksToStringNoteEvents(tracks, prev.activeTheory),
    }));
  }, []);

  const updateTheory = useCallback((theoryUpdate: Partial<ActiveTheoryState>) => {
    setSessionState((prev) => {
      const updatedTheory = { ...prev.activeTheory, ...theoryUpdate };
      return {
        ...prev,
        activeTheory: updatedTheory,
        tabEvents: compileTracksToStringNoteEvents(prev.tracks, updatedTheory),
      };
    });
  }, []);

  const setDisplayMode = useCallback((displayMode: StringsDisplayMode) => {
    setSessionState((prev) => ({ ...prev, displayMode }));
  }, []);

  const toggleMetronome = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      isMetronomeActive: !prev.isMetronomeActive,
    }));
  }, []);

  const contextValue = useMemo<StringsPracticeContextType>(
    () => ({
      title: session.title,
      instrument: session.instrument,
      tuning: session.tuning,
      bpm: session.bpm,
      timeSignature: session.timeSignature,
      measuresCount: session.measuresCount,
      tracks: session.tracks,
      tabEvents: session.tabEvents,
      activeTheory: session.activeTheory,
      displayMode: session.displayMode,
      isMetronomeActive: session.isMetronomeActive,
      setSession,
      updateBpm,
      updateInstrument,
      updateTuning,
      updateTracks,
      updateTheory,
      setDisplayMode,
      toggleMetronome,
    }),
    [
      session,
      setSession,
      updateBpm,
      updateInstrument,
      updateTuning,
      updateTracks,
      updateTheory,
      setDisplayMode,
      toggleMetronome,
    ]
  );

  return (
    <StringsPracticeContext.Provider value={contextValue}>
      {children}
    </StringsPracticeContext.Provider>
  );
}

/**
 * Hook seguro useStringsPractice:
 * Nunca lanza excepción fuera del provider (devuelve un stub seguro para evitar React Error #300).
 */
export function useStringsPractice(): StringsPracticeContextType {
  const ctx = useContext(StringsPracticeContext);
  if (!ctx) {
    return {
      ...defaultInitialSession,
      setSession: () => console.warn('[useStringsPractice] Called outside StringsPracticeProvider'),
      updateBpm: () => {},
      updateInstrument: () => {},
      updateTuning: () => {},
      updateTracks: () => {},
      updateTheory: () => {},
      setDisplayMode: () => {},
      toggleMetronome: () => {},
    };
  }
  return ctx;
}
