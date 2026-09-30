'use client';

import React, { useState, useEffect } from 'react';
import {
  WORKOUT_LEVELS,
  WorkoutLevel,
  PracticeRoutine,
  HandFocus,
} from '@/data/practiceWorkoutsData';
import CustomWorkoutModal from './CustomWorkoutModal';
import {
  Target,
  Sparkles,
  Hand,
  Info,
  Play,
  Settings,
  Plus,
  Trash2,
  Clock,
  Layers,
  CheckCircle2,
  Flame,
  Pencil,
} from 'lucide-react';

interface WorkoutsDashboardProps {
  activeRoutineId?: string;
  onSelectRoutine: (routine: PracticeRoutine) => void;
  handFocus?: HandFocus;
  onHandFocusChange?: (focus: HandFocus) => void;
  className?: string;
}

export default function WorkoutsDashboard({
  activeRoutineId,
  onSelectRoutine,
  handFocus = 'both',
  onHandFocusChange,
  className = '',
}: WorkoutsDashboardProps) {
  const [internalHandFocus, setInternalHandFocus] = useState<HandFocus>(handFocus);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [customRoutines, setCustomRoutines] = useState<PracticeRoutine[]>([]);
  const [routineToEdit, setRoutineToEdit] = useState<PracticeRoutine | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync internal with prop if controlled
  useEffect(() => {
    setInternalHandFocus(handFocus);
  }, [handFocus]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 3500);
  };

  const handleOpenNewBuilder = () => {
    setRoutineToEdit(null);
    setIsBuilderOpen(true);
  };

  const handleEditWorkout = (routine: PracticeRoutine) => {
    setRoutineToEdit(routine);
    setIsBuilderOpen(true);
  };

  const handleHandFocusSelect = (focus: HandFocus) => {
    setInternalHandFocus(focus);
    onHandFocusChange?.(focus);
  };

  // Load custom workouts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sonora_keys_custom_workouts');
      if (stored) {
        setCustomRoutines(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading custom routines from localStorage', e);
    }
  }, []);

  // Delete custom routine
  const handleDeleteCustomRoutine = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = customRoutines.filter((r) => r.id !== id);
      setCustomRoutines(updated);
      localStorage.setItem('sonora_keys_custom_workouts', JSON.stringify(updated));
      showToast('🗑️ Rutina eliminada.');
    } catch (err) {
      console.error('Error deleting custom routine', err);
    }
  };

  // When custom routine is saved or updated from modal
  const handleSaveAndLoadRoutine = (savedRoutine: PracticeRoutine) => {
    const isEdit = customRoutines.some((r) => r.id === savedRoutine.id);
    const wasActive = activeRoutineId === savedRoutine.id;

    setCustomRoutines((prev) => {
      const idx = prev.findIndex((r) => r.id === savedRoutine.id);
      let updated: PracticeRoutine[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = savedRoutine;
      } else {
        updated = [savedRoutine, ...prev];
      }
      try {
        localStorage.setItem('sonora_keys_custom_workouts', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving custom routines to localStorage', e);
      }
      return updated;
    });

    if (savedRoutine.handFocus) {
      handleHandFocusSelect(savedRoutine.handFocus);
    }

    // Si la rutina editada está actualmente activa en el Runway (o es nueva creación):
    // regenera inmediatamente sus notas y recarga el secuenciador con los nuevos parámetros
    if (!isEdit || wasActive) {
      onSelectRoutine(savedRoutine);
    }

    // Feedback visual / Toast de confirmación
    showToast(
      isEdit
        ? `✏️ Rutina "${savedRoutine.title}" actualizada exitosamente${wasActive ? ' y recargada en Runway' : ''}`
        : `🚀 Rutina "${savedRoutine.title}" creada y cargada en Runway`
    );

    setIsBuilderOpen(false);
    setRoutineToEdit(null);
  };

  // Filter custom routines by active hand focus
  const filteredCustomRoutines = customRoutines.filter((r) => {
    if (internalHandFocus === 'both') return true;
    return r.handFocus === internalHandFocus;
  });

  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0b1426] via-[#101b38] to-[#0b1426] border border-cyan-500/20 shadow-2xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Target className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              Rutas de Entrenamiento Guiado • Sonora Academy
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Gimnasio de Teclado &amp; Rutinas Pedagógicas
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Aísla tu mano izquierda para bajos y arpegios, perfecciona la digitación de tu mano derecha, o sincroniza ambas manos en el Runway interactivo.
          </p>
        </div>

        {/* Action Button: Crear Entrenamiento Personalizado */}
        <div className="flex flex-wrap items-center gap-3 z-10 w-full sm:w-auto">
          <button
            onClick={handleOpenNewBuilder}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 hover:brightness-110 flex items-center justify-center gap-2 group"
          >
            <Settings className="w-4 h-4 transition-transform group-hover:rotate-45" />
            <span>⚙️ + Crear Entrenamiento Personalizado</span>
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* 1. SELECTOR Y FILTRO DE MANO (Hand Focus Segmented)     */}
      {/* ======================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-2xl bg-[#090f21] border border-slate-800 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Hand className="w-4 h-4 text-cyan-400" />
            <span>Enfoque de Mano:</span>
          </span>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => handleHandFocusSelect('both')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                internalHandFocus === 'both'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>👐 Ambas Manos</span>
            </button>

            <button
              onClick={() => handleHandFocusSelect('left')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                internalHandFocus === 'left'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🤚 Mano Izquierda</span>
            </button>

            <button
              onClick={() => handleHandFocusSelect('right')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                internalHandFocus === 'right'
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>✋ Mano Derecha</span>
            </button>
          </div>
        </div>

        {/* Indicator Description */}
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
          {internalHandFocus === 'left' && (
            <span className="text-purple-300 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-800/80 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              Filtro Activo: Solo rutinas de Mano Izquierda (&lt; C4)
            </span>
          )}
          {internalHandFocus === 'right' && (
            <span className="text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800/80 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Filtro Activo: Solo rutinas de Mano Derecha (&ge; C4)
            </span>
          )}
          {internalHandFocus === 'both' && (
            <span className="text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/80 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Mostrando Catálogo Completo (Ambas Manos &amp; Aislamiento)
            </span>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* 2. MIS RUTINAS PERSONALIZADAS (Si existen en Storage)   */}
      {/* ======================================================= */}
      {filteredCustomRoutines.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#111c38]/90 via-[#0a1226]/90 to-[#111c38]/90 border border-amber-500/30 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
                Mis Rutinas Personalizadas ({filteredCustomRoutines.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Guardadas en tu perfil local
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCustomRoutines.map((routine) => {
              const isCurrent = activeRoutineId === routine.id;
              const isLH = routine.handFocus === 'left';
              const isRH = routine.handFocus === 'right';

              return (
                <div
                  key={routine.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                          isLH
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : isRH
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {isLH ? '🤚 Mano Izquierda' : isRH ? '✋ Mano Derecha' : '👐 Ambas Manos'}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                        {routine.bpm} BPM
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100">{routine.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{routine.objective}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDeleteCustomRoutine(routine.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Eliminar rutina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleEditWorkout(routine)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-white/10 transition-all"
                        title="Editar Rutina"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onSelectRoutine(routine)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black'
                          : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black hover:brightness-110'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isCurrent ? 'Activa en Runway' : 'Cargar en Runway'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 3. CATÁLOGO DE RUTINAS POR NIVEL (4 NIVELES)           */}
      {/* ======================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {WORKOUT_LEVELS.map((level: WorkoutLevel) => {
          // Filter routines of this level based on handFocus
          const routinesToShow = level.routines.filter((routine) => {
            if (internalHandFocus === 'both') return true;
            return routine.handFocus === internalHandFocus;
          });

          return (
            <div
              key={level.levelNumber}
              className={`flex flex-col justify-between p-5 rounded-2xl bg-[#080e1e]/90 border ${level.colorTheme.border} shadow-xl backdrop-blur-md transition-all hover:shadow-2xl`}
            >
              {/* Level Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${level.colorTheme.bgBadge}`}
                    >
                      {level.title}
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {level.suggestedBpm}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    {level.subtitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{level.objective}</p>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-slate-950 text-slate-400 border border-slate-800 whitespace-nowrap">
                  {routinesToShow.length} {routinesToShow.length === 1 ? 'rutina' : 'rutinas'}
                </span>
              </div>

              {/* Routines inside Level */}
              <div className="flex flex-col gap-3 my-4">
                {routinesToShow.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 font-mono text-xs">
                    No hay rutinas con el filtro de mano seleccionado en este nivel.
                  </div>
                ) : (
                  routinesToShow.map((routine: PracticeRoutine) => {
                    const isCurrent = activeRoutineId === routine.id;
                    const isLH = routine.handFocus === 'left';
                    const isRH = routine.handFocus === 'right';

                    return (
                      <div
                        key={routine.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                          isCurrent
                            ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                            : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Routine Title, Hand Focus Badge & BPM */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                                  isLH
                                    ? 'bg-purple-950/90 text-purple-300 border-purple-700/80'
                                    : isRH
                                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700/80'
                                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80'
                                }`}
                              >
                                {isLH ? '🤚 Mano Izquierda' : isRH ? '✋ Mano Derecha' : '👐 Ambas Manos'}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300">
                              {routine.title}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              {routine.objective}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700 whitespace-nowrap">
                            {routine.bpm} BPM
                          </span>
                        </div>

                        {/* Hands Instructions Pill */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div
                            className={`p-2 rounded-lg border flex items-start gap-1.5 ${
                              isLH
                                ? 'bg-purple-900/40 border-purple-600/80 text-purple-200 ring-1 ring-purple-500/30'
                                : 'bg-purple-950/30 border-purple-900/40 text-purple-300/80'
                            }`}
                          >
                            <Hand className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <span>{routine.leftHandInstruction}</span>
                          </div>
                          <div
                            className={`p-2 rounded-lg border flex items-start gap-1.5 ${
                              isRH
                                ? 'bg-cyan-900/40 border-cyan-600/80 text-cyan-200 ring-1 ring-cyan-500/30'
                                : 'bg-cyan-950/30 border-cyan-900/40 text-cyan-300/80'
                            }`}
                          >
                            <Hand className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span>{routine.rightHandInstruction}</span>
                          </div>
                        </div>

                        {/* Tip & 1-Click Launch Button */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                          <div className="text-[10px] text-slate-400 italic flex items-center gap-1">
                            <Info className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span className="truncate max-w-xs">{routine.pedagogicalTip}</span>
                          </div>

                          <button
                            onClick={() => onSelectRoutine(routine)}
                            className={`w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ${
                              isCurrent
                                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black'
                                : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black hover:brightness-110 shadow-amber-500/20'
                            }`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{isCurrent ? 'Activo en Runway' : 'Cargar y Practicar'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Custom Workout Builder / Editor */}
      <CustomWorkoutModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setRoutineToEdit(null);
        }}
        onSaveAndLoad={handleSaveAndLoadRoutine}
        workoutToEdit={routineToEdit}
      />

      {/* Floating Confirmation Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#091124]/95 border border-cyan-500/50 text-cyan-200 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-sans font-semibold text-slate-100 leading-snug">
            {toastMessage}
          </span>
        </div>
      )}
    </div>
  );
}
