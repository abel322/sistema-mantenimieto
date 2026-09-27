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
  AlertCircle,
  Plus,
  Check,
  Music,
} from 'lucide-react';
import { SavedDrumExercise } from '@/types/drum';
import MiniScorePreview from './MiniScorePreview';

export interface MyRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: SavedDrumExercise[];
  onLoadExercise: (exercise: SavedDrumExercise) => void;
  onDeleteExercise: (id: string) => void | Promise<void>;
  onExportExercise?: (exercise: SavedDrumExercise) => void;
  onExportAll?: () => void;
  onImportJson?: (jsonString: string) => { success: boolean; count: number; error?: string };
  onOpenSaveCurrent: () => void;
}

export default function MyRoutinesModal({
  isOpen,
  onClose,
  exercises,
  onLoadExercise,
  onDeleteExercise,
  onExportExercise,
  onExportAll,
  onImportJson,
  onOpenSaveCurrent,
}: MyRoutinesModalProps) {
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
    if (!file || !onImportJson) return;

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
    showNotice(`¡"${exercise.title}" cargada en el estudio!`);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleExportSingle = (exercise: SavedDrumExercise) => {
    if (onExportExercise) {
      onExportExercise(exercise);
    } else {
      const blob = new Blob([JSON.stringify(exercise, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = exercise.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      link.href = url;
      link.download = `sonora-routine-${safeName || 'routine'}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleExportAll = () => {
    if (onExportAll) {
      onExportAll();
    } else {
      const blob = new Blob([JSON.stringify(exercises, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sonora-rutinas-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden bg-[#0B0F19] text-white border border-white/10 shadow-2xl">
        {/* Hidden File Input for JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#0E1526]/80 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] flex-shrink-0">
                <FolderOpen className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-white tracking-tight truncate">
                    Mis Rutinas
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold border border-purple-500/30 flex-shrink-0">
                    {exercises.length} guardadas
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate hidden sm:block">
                  Carga tus composiciones, ejercicios de independencia y rudimentos persistidos en la nube
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                title="Importar rutinas desde archivo JSON"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Importar JSON</span>
              </button>

              {exercises.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportAll}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Descargar copia de seguridad de todas las rutinas"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Exportar Todo</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-pointer flex-shrink-0"
                title="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 space-y-3 bg-[#0E1526]/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Dark Search Input with Cyan Loupe */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, BPM o etiqueta..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSaveCurrent();
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Actual</span>
            </button>
          </div>

          {/* Tags Filter Chips */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTag('all')}
                data-selected={selectedTag === 'all'}
                className="px-3 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer border bg-slate-800/80 border-white/10 text-slate-300 hover:border-cyan-400 data-[selected=true]:bg-cyan-500/20 data-[selected=true]:border-cyan-500 data-[selected=true]:text-cyan-300 data-[selected=true]:font-bold"
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
                    data-selected={isSelected}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer border bg-slate-800/80 border-white/10 text-slate-300 hover:border-cyan-400 data-[selected=true]:bg-cyan-500/20 data-[selected=true]:border-cyan-500 data-[selected=true]:text-cyan-300 data-[selected=true]:font-bold"
                  >
                    <span>#{t}</span>
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl">
                🥁
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-white">
                  {exercises.length === 0
                    ? 'Aún no tienes rutinas guardadas'
                    : 'No se encontraron rutinas con esa búsqueda'}
                </h3>
                <p className="text-xs text-slate-400">
                  {exercises.length === 0
                    ? 'Crea un patrón en la partitura, personaliza rudimentos o compases y guárdalo en la nube para tus sesiones de estudio diario.'
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-cyan-900/30 cursor-pointer"
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
                const timeSigStr = Array.isArray(exercise.timeSignature)
                  ? `${exercise.timeSignature[0]}/${exercise.timeSignature[1]}`
                  : String(exercise.timeSignature || '4/4');
                const measuresCount = exercise.measuresCount || exercise.totalMeasures || exercise.measures?.length || 1;

                return (
                  <div
                    key={exercise.id}
                    className="bg-[#0E1526]/80 hover:bg-[#0E1526] border border-white/10 hover:border-cyan-500/30 rounded-xl p-4 transition-all duration-200 flex flex-col gap-3 group shadow-sm"
                  >
                    {/* Header Row */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                            {exercise.bpm} BPM
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                            {timeSigStr}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 font-bold">
                            {measuresCount} {measuresCount === 1 ? 'Compás' : 'Compases'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400 text-xs font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{dateFormatted}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-white text-base font-bold group-hover:text-cyan-300 transition-colors truncate">
                        {exercise.title}
                      </h4>

                      {/* Tags */}
                      {exercise.tags && exercise.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                          {exercise.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Clean Score Notation Preview */}
                    <div className="rounded-lg bg-black/50 border border-white/5 p-2 flex justify-center overflow-hidden">
                      <MiniScorePreview
                        measures={exercise.measures?.slice(0, 1) || []}
                        scoreData={exercise.scoreData}
                        timeSignature={exercise.timeSignature}
                        width={380}
                        height={64}
                        className="w-full"
                      />
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2 w-full animate-in fade-in">
                          <span className="text-xs font-mono text-rose-300 flex-1">¿Eliminar de la nube?</span>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteExercise(exercise.id);
                              setConfirmDeleteId(null);
                              showNotice('Rutina eliminada.');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold cursor-pointer transition-colors"
                          >
                            Sí, borrar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:text-white text-xs font-mono cursor-pointer transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleLoad(exercise)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 text-xs font-mono transition-all cursor-pointer flex-1 active:scale-98"
                            title="Cargar esta rutina en el estudio"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>▶ Cargar en Estudio</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleExportSingle(exercise)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="Descargar archivo JSON de esta rutina"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(exercise.id)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                              title="Eliminar rutina de la base de datos"
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
        <div className="p-3.5 px-6 border-t border-white/10 bg-[#0E1526]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Las rutinas cargadas restauran todos sus compases, notas, orquestación y tempo al instante.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
