'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Search,
  FolderOpen,
  Play,
  Trash2,
  Download,
  Upload,
  Sparkles,
  Calendar,
  Layers,
  Activity,
  Check,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { SavedDrumExercise } from '@/types/drum';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: SavedDrumExercise[];
  onLoadExercise: (exercise: SavedDrumExercise) => void;
  onDeleteExercise: (id: string) => void;
  onExportExercise: (exercise: SavedDrumExercise) => void;
  onExportAll: () => void;
  onImportJson: (jsonString: string) => { success: boolean; count: number; error?: string };
  onOpenSaveCurrent: () => void;
}

export default function ExerciseLibraryModal({
  isOpen,
  onClose,
  exercises,
  onLoadExercise,
  onDeleteExercise,
  onExportExercise,
  onExportAll,
  onImportJson,
  onOpenSaveCurrent,
}: ExerciseLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Collect all unique tags from exercises
  const allTags = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((e) => {
      e.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [exercises]);

  // Filter exercises by search and tag
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesTag = selectedTag === 'all' || ex.tags?.includes(selectedTag);
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        ex.title.toLowerCase().includes(query) ||
        ex.tags?.some((t) => t.toLowerCase().includes(query)) ||
        ex.bpm.toString().includes(query);

      return matchesTag && matchesQuery;
    });
  }, [exercises, selectedTag, searchQuery]);

  if (!isOpen) return null;

  const showNotice = (text: string, isError: boolean = false) => {
    setNotification({ text, isError });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = onImportJson(content);
        if (result.success) {
          showNotice(`¡Se importaron ${result.count} rutina(s) con éxito!`);
        } else {
          showNotice(result.error || 'Error al importar archivo.', true);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoad = (exercise: SavedDrumExercise) => {
    onLoadExercise(exercise);
    showNotice(`¡"${exercise.title}" cargado en el estudio!`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-deep/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-surface-card border border-white/10 shadow-2xl overflow-hidden">
        {/* Hidden File Input for JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-slate/40">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-glow-violet">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Mis Rutinas de Práctica
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30">
                  {exercises.length} Guardadas
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Carga tus composiciones, ejercicios de independencia y rudimentos guardados en el estudio
              </p>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-surface-slate hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="Importar rutinas desde archivo JSON"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Importar JSON</span>
            </button>

            {exercises.length > 0 && (
              <button
                type="button"
                onClick={onExportAll}
                className="px-3 py-1.5 rounded-xl bg-surface-slate hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Descargar copia de seguridad de todas las rutinas"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Exportar Todo</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/5 space-y-3 bg-surface-slate/20">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, BPM o etiqueta..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-dark border border-white/10 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-synth-cyan transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSaveCurrent();
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-electric text-white text-xs font-mono font-bold transition-all shadow-glow-violet flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Actual</span>
            </button>
          </div>

          {/* Tags Filter Chips */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap ${
                  selectedTag === 'all'
                    ? 'bg-synth-violet text-white shadow-glow-violet'
                    : 'bg-surface-slate border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                Todas ({exercises.length})
              </button>
              {allTags.map((t) => {
                const isSelected = selectedTag === t;
                const count = exercises.filter((e) => e.tags?.includes(t)).length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(t)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all whitespace-nowrap border ${
                      isSelected
                        ? 'bg-purple-500/25 border-purple-400 text-purple-300 font-bold'
                        : 'bg-surface-slate border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>{t}</span>
                    <span className="text-[10px] opacity-75 ml-1">({count})</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Feedback Alert Toast */}
        {notification && (
          <div
            className={`mx-5 mt-3 p-2.5 rounded-xl border text-xs font-mono flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
              notification.isError
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
          >
            {notification.isError ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
        )}

        {/* Exercises Grid List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-surface-slate/60 border border-white/10 flex items-center justify-center text-3xl">
                🥁
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">
                  {exercises.length === 0
                    ? 'Aún no tienes rutinas guardadas'
                    : 'No se encontraron rutinas con esa búsqueda'}
                </h3>
                <p className="text-xs text-gray-400">
                  {exercises.length === 0
                    ? 'Crea un patrón en la partitura, personaliza rudimentos o compases y guárdalo como ejercicio para tus sesiones de estudio diario.'
                    : 'Prueba cambiando el término de búsqueda o seleccionando otra etiqueta.'}
                </p>
              </div>

              {exercises.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSaveCurrent();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-electric text-white text-xs font-mono font-bold transition-all shadow-glow-violet"
                >
                  <Plus className="w-4 h-4" />
                  <span>Guardar la Partitura Actual Ahora</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExercises.map((exercise) => {
                const dateFormatted = new Date(exercise.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                const isConfirmingDelete = confirmDeleteId === exercise.id;

                return (
                  <div
                    key={exercise.id}
                    className="rounded-2xl p-4 bg-surface-slate/40 border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                            {exercise.bpm} BPM
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                            {exercise.timeSignature[0]}/{exercise.timeSignature[1]}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 text-gray-400">
                            {exercise.totalMeasures} {exercise.totalMeasures === 1 ? 'Compás' : 'Compases'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{dateFormatted}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-bold text-white group-hover:text-synth-cyan transition-colors">
                        {exercise.title}
                      </h4>

                      {/* Tags */}
                      {exercise.tags && exercise.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          {exercise.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <span className="text-[10px] font-mono text-rose-300 flex-1">¿Eliminar rutina?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteExercise(exercise.id);
                              setConfirmDeleteId(null);
                              showNotice('Rutina eliminada.');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-mono font-bold"
                          >
                            Sí, borrar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-white/10 text-gray-300 text-[10px] font-mono"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleLoad(exercise)}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            title="Cargar esta rutina en el editor"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Cargar en Estudio</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onExportExercise(exercise)}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                              title="Exportar archivo JSON"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(exercise.id)}
                              className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 transition-all cursor-pointer"
                              title="Eliminar rutina"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 px-6 border-t border-white/10 bg-surface-slate/40 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 font-mono gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-synth-cyan" />
            <span>Las rutinas cargadas restauran todos sus compases, notas, acentos y tempo al instante.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
