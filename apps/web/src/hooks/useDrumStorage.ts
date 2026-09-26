'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DrumMeasure, SavedDrumExercise, DrumDraftSession } from '@/types/drum';

export const STORAGE_KEY_CURRENT_SESSION = 'sonora_drum_lab_current_session';
export const STORAGE_KEY_USER_EXERCISES = 'sonora_drum_lab_user_exercises';

export function useDrumStorage() {
  const [exercises, setExercises] = useState<SavedDrumExercise[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved exercises from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER_EXERCISES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setExercises(parsed);
        }
      }
    } catch (e) {
      console.warn('Error loading Sonora Drum Lab exercises from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save current studio draft session (with debounce)
  const saveDraftSession = useCallback((session: Omit<DrumDraftSession, 'savedAt'>) => {
    if (typeof window === 'undefined') return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const payload: DrumDraftSession = {
          ...session,
          savedAt: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(payload));
      } catch (err) {
        console.warn('Error auto-saving Drum Lab session:', err);
      }
    }, 600);
  }, []);

  // Synchronously load draft session (for component initialization)
  const loadDraftSession = useCallback((): DrumDraftSession | null => {
    if (typeof window === 'undefined') return null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as DrumDraftSession;
      if (parsed && Array.isArray(parsed.measures) && parsed.measures.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn('Error reading Drum Lab draft session:', err);
    }
    return null;
  }, []);

  // Clear current draft session
  const clearDraftSession = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
    } catch (e) {
      console.warn('Error clearing draft session:', e);
    }
  }, []);

  // Save a new exercise routine
  const saveExercise = useCallback(
    (params: {
      title: string;
      tags?: string[];
      bpm: number;
      timeSignature: [number, number];
      measures: DrumMeasure[];
      notes?: string;
    }): SavedDrumExercise => {
      const cleanMeasures = JSON.parse(JSON.stringify(params.measures)) as DrumMeasure[];

      const newExercise: SavedDrumExercise = {
        id: `exercise-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: params.title.trim() || `Rutina ${params.bpm} BPM`,
        tags: params.tags && params.tags.length > 0 ? params.tags : ['Groove'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bpm: params.bpm,
        timeSignature: params.timeSignature,
        totalMeasures: cleanMeasures.length,
        measures: cleanMeasures,
        notes: params.notes,
      };

      setExercises((prev) => {
        const next = [newExercise, ...prev];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY_USER_EXERCISES, JSON.stringify(next));
          } catch (e) {
            console.error('Error saving exercise to localStorage:', e);
          }
        }
        return next;
      });

      return newExercise;
    },
    []
  );

  // Delete an existing exercise
  const deleteExercise = useCallback((id: string) => {
    setExercises((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_USER_EXERCISES, JSON.stringify(next));
        } catch (e) {
          console.error('Error updating localStorage after deleting exercise:', e);
        }
      }
      return next;
    });
  }, []);

  // Export single exercise as JSON file
  const exportExerciseToJson = useCallback((exercise: SavedDrumExercise) => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(exercise, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = exercise.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.href = url;
    link.download = `sonora-exercise-${safeName || 'routine'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Export all exercises as a JSON backup bundle
  const exportAllExercisesToJson = useCallback(() => {
    if (typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(exercises, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sonora-drum-lab-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [exercises]);

  // Import exercises from JSON string
  const importExercisesFromJson = useCallback(
    (jsonString: string): { success: boolean; count: number; error?: string } => {
      try {
        const parsed = JSON.parse(jsonString);
        let itemsToImport: SavedDrumExercise[] = [];

        if (Array.isArray(parsed)) {
          itemsToImport = parsed.filter(
            (item) => item && item.title && Array.isArray(item.measures)
          );
        } else if (parsed && parsed.title && Array.isArray(parsed.measures)) {
          itemsToImport = [parsed as SavedDrumExercise];
        } else {
          return { success: false, count: 0, error: 'Formato de archivo inválido.' };
        }

        if (itemsToImport.length === 0) {
          return { success: false, count: 0, error: 'No se encontraron rutinas válidas en el archivo.' };
        }

        setExercises((prev) => {
          // Merge avoiding ID collisions by re-keying duplicates if necessary
          const existingIds = new Set(prev.map((e) => e.id));
          const prepared = itemsToImport.map((item) => {
            if (existingIds.has(item.id)) {
              return {
                ...item,
                id: `exercise-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              };
            }
            return item;
          });

          const merged = [...prepared, ...prev];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_USER_EXERCISES, JSON.stringify(merged));
            } catch (err) {
              console.error('Error saving imported exercises to localStorage:', err);
            }
          }
          return merged;
        });

        return { success: true, count: itemsToImport.length };
      } catch (err: any) {
        return { success: false, count: 0, error: err?.message || 'Error al procesar el archivo JSON.' };
      }
    },
    []
  );

  return {
    exercises,
    isLoaded,
    saveDraftSession,
    loadDraftSession,
    clearDraftSession,
    saveExercise,
    deleteExercise,
    exportExerciseToJson,
    exportAllExercisesToJson,
    importExercisesFromJson,
  };
}
