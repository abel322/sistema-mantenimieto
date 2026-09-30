'use client';

import React from 'react';
import {
  WORKOUT_LEVELS,
  WorkoutLevel,
  PracticeRoutine,
} from '@/data/practiceWorkoutsData';
import {
  Target,
  Rocket,
  CheckCircle2,
  Clock,
  Sparkles,
  Hand,
  Info,
  Play,
  Zap,
} from 'lucide-react';

interface WorkoutsDashboardProps {
  activeRoutineId?: string;
  onSelectRoutine: (routine: PracticeRoutine) => void;
  className?: string;
}

export default function WorkoutsDashboard({
  activeRoutineId,
  onSelectRoutine,
  className = '',
}: WorkoutsDashboardProps) {
  return (
    <div className={`w-full flex flex-col gap-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0b1426] via-[#101b38] to-[#0b1426] border border-cyan-500/20 shadow-xl">
        <div className="space-y-1">
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
            Selecciona una rutina diseñada para tu nivel técnico. Con un solo clic se configuran automáticamente la tónica, tempo y textura en el Runway para comenzar a entrenar de inmediato.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>4 Niveles • 12 Rutinas Maestras</span>
        </div>
      </div>

      {/* 4 Levels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {WORKOUT_LEVELS.map((level: WorkoutLevel) => {
          return (
            <div
              key={level.levelNumber}
              className={`flex flex-col justify-between p-5 rounded-2xl bg-[#080e1e]/90 border ${level.colorTheme.border} shadow-xl backdrop-blur-md transition-all hover:shadow-2xl`}
            >
              {/* Level Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${level.colorTheme.bgBadge}`}>
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
                  <p className="text-xs text-slate-400 mt-0.5">
                    {level.objective}
                  </p>
                </div>
              </div>

              {/* 3 Routines inside the Level */}
              <div className="flex flex-col gap-3 my-4">
                {level.routines.map((routine: PracticeRoutine) => {
                  const isCurrent = activeRoutineId === routine.id;

                  return (
                    <div
                      key={routine.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                        isCurrent
                          ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500'
                          : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      {/* Routine Title & BPM Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
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
                        <div className="bg-purple-950/40 p-2 rounded-lg border border-purple-900/50 text-purple-200 flex items-start gap-1.5">
                          <Hand className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <span>{routine.leftHandInstruction}</span>
                        </div>
                        <div className="bg-cyan-950/40 p-2 rounded-lg border border-cyan-900/50 text-cyan-200 flex items-start gap-1.5">
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
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
