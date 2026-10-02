'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Tone from 'tone';
import { useDrumPractice } from '@/context/DrumPracticeContext';
import { useDrumAudio } from '@/hooks/useDrumAudio';
import DrumScoreRenderer from './DrumScoreRenderer';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Repeat,
  ArrowLeft,
  Bell,
  Activity,
  Sliders,
  Music,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function SynthesiaDrumStage() {
  const router = useRouter();
  const {
    title,
    bpm: contextBpm,
    timeSignature,
    measures,
    updateBpm,
  } = useDrumPractice();

  const audio = useDrumAudio();

  // Estados locales de la vista de partitura
  const [mounted, setMounted] = useState(false);
  const [scoreLayoutMode, setScoreLayoutMode] = useState<'runway' | 'paginated'>('runway');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [selectedMeasureIndex, setSelectedMeasureIndex] = useState(0);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);

  // Inicialización y sincronización en montaje
  useEffect(() => {
    setMounted(true);
    if (contextBpm) {
      audio.setBpm(contextBpm);
    }
    if (measures && measures.length > 0) {
      audio.scheduleScore(measures);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar BPM cuando cambia en el contexto
  useEffect(() => {
    if (!mounted) return;
    if (contextBpm && contextBpm !== audio.bpm) {
      audio.setBpm(contextBpm);
    }
  }, [contextBpm, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-programar audio si cambian los compases durante la sesión
  useEffect(() => {
    if (!mounted || !measures || measures.length === 0) return;
    audio.scheduleScore(measures);
  }, [measures, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler Play / Pausa
  const handleTogglePlay = useCallback(async () => {
    try {
      await Tone.start();
    } catch (_) {}
    audio.initAudio();
    audio.togglePlay(measures);
  }, [audio, measures]);

  // Handler Stop y Rebobinar a C1.1
  const handleStopReset = useCallback(() => {
    audio.stop();
    audio.seekToStep(0, 0, 0);
    setSelectedMeasureIndex(0);
    setSelectedBeatIndex(0);
    setSelectedStepIndex(0);
  }, [audio]);

  // Handler Tap Tempo
  const handleTapTempo = useCallback(() => {
    const now = performance.now();
    const newTaps = [...tapTimestamps.filter((t) => now - t < 3000), now];
    setTapTimestamps(newTaps);

    if (newTaps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      if (calculatedBpm >= 40 && calculatedBpm <= 260) {
        audio.setBpm(calculatedBpm);
        updateBpm(calculatedBpm);
      }
    }
  }, [tapTimestamps, audio, updateBpm]);

  // Handler cambio de BPM
  const handleSetBpm = useCallback(
    (newBpm: number) => {
      const clamped = Math.max(40, Math.min(260, newBpm));
      audio.setBpm(clamped);
      updateBpm(clamped);
    },
    [audio, updateBpm]
  );

  // Selección manual de paso en la partitura
  const handleSelectStep = useCallback(
    (mIdx: number, bIdx: number = 0, sIdx: number = 0) => {
      setSelectedMeasureIndex(mIdx);
      setSelectedBeatIndex(bIdx);
      setSelectedStepIndex(sIdx);
      audio.seekToStep(mIdx, bIdx, sIdx);
    },
    [audio]
  );

  // Atajos de teclado para transporte
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleStopReset();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        audio.toggleMetronome();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        audio.toggleLoop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleStopReset, audio]);

  // Métricas y totales
  const totalMeasures = measures.length || 1;
  const beatsPerMeasure = timeSignature[0] || 4;
  const activeMeasureNumber = (audio.playhead?.measureIndex ?? 0) + 1;
  const activeBeatNumber = (audio.playhead?.beatIndex ?? 0) + 1;

  // ─── SAFE CONDITIONAL RENDER — colocado después de TODOS los hooks ────────
  if (!mounted) {
    return (
      <div className="w-full min-h-[60vh] bg-[#0d131f] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-400">
            Cargando Partitura de Percusión...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[#0d131f] text-slate-100 flex flex-col justify-start py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full space-y-5">
        {/* ================================================================= */}
        {/* BARRA DE TRANSPORTE Y CABECERA DEL REPRODUCTOR                    */}
        {/* ================================================================= */}
        <header className="w-full p-4 sm:p-5 rounded-3xl bg-[#131b2e]/95 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col gap-4">
          {/* Top Line: Botón Volver + Metadatos de Partitura */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/studio/drums"
                className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-2 text-xs font-bold font-mono shadow-sm group"
                title="Volver al Taller DAW para modificar ritmos y celdas"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
                <span>Volver a Editar DAW / Matriz</span>
              </Link>

              <div className="h-5 w-px bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
                  {title || 'Partitura de Batería'}
                </h1>
              </div>
            </div>

            {/* Badges de Estado: Métrica & Compás Activo */}
            <div className="flex items-center gap-2 font-mono text-xs flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-bold">
                Métrica: {timeSignature[0]}/{timeSignature[1]}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-700/60 font-bold">
                Compás: C{activeMeasureNumber} / C{totalMeasures}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                Pulso: T{activeBeatNumber}
              </span>
            </div>
          </div>

          {/* Bottom Line: Controles de Transporte, Metrónomo, Tempo y Visualización */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* 1. Botones Principales de Play / Stop / Loop */}
            <div className="flex items-center gap-2">
              {/* Play / Pausa */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`px-5 py-2.5 rounded-xl font-mono font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                  audio.isPlaying
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/30 scale-105'
                    : 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-cyan-500/25 hover:scale-105 active:scale-95'
                }`}
                title="Reproducir / Pausar (Barra Espaciadora)"
              >
                {audio.isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-slate-950" />
                    <span>PAUSAR</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                    <span>REPRODUCIR</span>
                  </>
                )}
              </button>

              {/* Stop / Reiniciar al inicio C1.1 */}
              <button
                type="button"
                onClick={handleStopReset}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-mono font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Detener y volver al inicio (Tecla R)"
              >
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span className="hidden sm:inline">STOP (C1.1)</span>
              </button>

              {/* Bucle Continuo (Loop) */}
              <button
                type="button"
                onClick={audio.toggleLoop}
                className={`px-3 py-2.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-1.5 border cursor-pointer ${
                  audio.isLooping
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
                title="Repetición Continua en Bucle (Tecla L)"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>LOOP</span>
              </button>
            </div>

            {/* 2. Metrónomo con Indicador Visual de Pulsos (T1, T2, T3, T4) */}
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={audio.toggleMetronome}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  audio.isMetronomeActive
                    ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
                title="Activar / Desactivar Metrónomo (Tecla M)"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>CLICK</span>
              </button>

              {/* Lámparas de pulso (T1..TN) */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: beatsPerMeasure }).map((_, bIdx) => {
                  const isCurrentBeat = audio.playhead?.beatIndex === bIdx;
                  const isFlash =
                    audio.isPlaying &&
                    audio.currentBeatFlash?.beatIndex === bIdx &&
                    Date.now() - (audio.currentBeatFlash?.timestamp || 0) < 180;
                  const isDownbeat = bIdx === 0;

                  return (
                    <div
                      key={`stage-pulse-${bIdx}`}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black transition-all ${
                        isFlash
                          ? isDownbeat
                            ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-110'
                            : 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.9)] scale-105'
                          : isCurrentBeat && audio.isPlaying
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-slate-800/80 text-slate-500'
                      }`}
                      title={`Pulso ${bIdx + 1}`}
                    >
                      T{bIdx + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Tempo BPM & Tap Tempo */}
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-2xl border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <button
                type="button"
                onClick={() => handleSetBpm(audio.bpm - 5)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Bajar 5 BPM"
              >
                -
              </button>
              <div className="text-center font-mono">
                <span className="text-sm font-black text-cyan-300 px-1">{audio.bpm}</span>
                <span className="text-[10px] text-slate-400">BPM</span>
              </div>
              <button
                type="button"
                onClick={() => handleSetBpm(audio.bpm + 5)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Subir 5 BPM"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleTapTempo}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 text-[10px] font-mono font-bold border border-slate-700 transition-colors cursor-pointer"
                title="Haz clic a tempo para calcular BPM"
              >
                TAP
              </button>
            </div>

            {/* 4. Selector de Modo de Partitura & Zoom */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setScoreLayoutMode('runway')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    scoreLayoutMode === 'runway'
                      ? 'bg-synth-cyan text-black shadow-glow-cyan font-black'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Modo Runway: Pentagrama continuo con autoscroll sincronizado"
                >
                  <span>⇄</span>
                  <span>Runway</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScoreLayoutMode('paginated')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    scoreLayoutMode === 'paginated'
                      ? 'bg-gradient-electric text-white shadow-glow-violet'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Modo Paginado: Multilínea clásico para lectura fija"
                >
                  <span>⊞</span>
                  <span>Paginado</span>
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[10px] font-mono">
                {[0.8, 1.0, 1.2].map((z) => (
                  <button
                    key={`score-zoom-${z}`}
                    type="button"
                    onClick={() => setZoomLevel(z)}
                    className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                      zoomLevel === z
                        ? 'bg-cyan-400 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {Math.round(z * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* ESCENARIO PRINCIPAL: PENTAGRAMA DE PERCUSIÓN ESTÁNDAR (5 LÍNEAS)  */}
        {/* ================================================================= */}
        <main className="w-full rounded-3xl bg-[#131b2e]/90 border border-slate-800 shadow-2xl p-4 sm:p-6 backdrop-blur-xl relative overflow-hidden flex flex-col gap-4">
          {/* Header del Escenario de Partitura */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 font-mono text-xs">
            <span className="flex items-center gap-2 text-cyan-400 font-bold">
              <Music className="w-4 h-4 text-cyan-400" />
              <span>PENTAGRAMA ESTÁNDAR DE BATERÍA • CLAVE DE PERCUSIÓN (5 LÍNEAS)</span>
            </span>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>CURSOR ACTIVO A 60 FPS</span>
              </span>
              <span>•</span>
              <span className="text-slate-300">AUDIO WEB VÍA TONE.JS</span>
            </div>
          </div>

          {/* Renderizado de Partitura con VexFlow & Cursor Láser Seguidor */}
          <div className="w-full bg-[#0a0f1d] rounded-2xl border border-slate-800/90 shadow-inner overflow-hidden p-2 sm:p-4">
            <DrumScoreRenderer
              measures={measures}
              selectedMeasureIndex={selectedMeasureIndex}
              selectedBeatIndex={selectedBeatIndex}
              selectedStepIndex={selectedStepIndex}
              playhead={audio.playhead}
              isPlaying={audio.isPlaying}
              layoutMode={scoreLayoutMode}
              onToggleLayoutMode={setScoreLayoutMode}
              zoomLevel={zoomLevel}
              onChangeZoomLevel={setZoomLevel}
              bpm={audio.bpm}
              onSetBpm={handleSetBpm}
              onTogglePlay={handleTogglePlay}
              onStop={handleStopReset}
              isMetronomeActive={audio.isMetronomeActive}
              onToggleMetronome={audio.toggleMetronome}
              isLooping={audio.isLooping}
              onToggleLoop={audio.toggleLoop}
              getTransportSeconds={audio.getTransportSeconds}
              seekToSeconds={audio.seekToSeconds}
              seekToStep={audio.seekToStep}
              onSelectStep={handleSelectStep}
              highlightSyncopations={true}
              currentBeatFlash={audio.currentBeatFlash}
            />
          </div>

          {/* ================================================================= */}
          {/* LEYENDA PEDAGÓGICA Y GUÍA DE STICKING ANALÍTICO                   */}
          {/* ================================================================= */}
          <footer className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono">
            {/* Stickings */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Sticking:</span>
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                R = Mano Derecha
              </span>
              <span className="flex items-center gap-1 text-purple-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                L = Mano Izquierda
              </span>
              <span className="flex items-center gap-1 text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                K = Bombo
              </span>
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                F = Hi-Hat Pedal
              </span>
            </div>

            {/* Convenciones de Notas */}
            <div className="flex items-center gap-3 text-slate-400 text-[11px] flex-wrap">
              <span>✕ = Platillos / Hi-Hat</span>
              <span>•</span>
              <span>● = Caja / Toms / Bombo</span>
              <span>•</span>
              <span>( ) = Ghost Note</span>
              <span>•</span>
              <span>&gt; = Acento</span>
            </div>

            {/* Atajos Rápidos */}
            <div className="text-[10px] text-slate-500 font-mono hidden lg:block">
              [Espacio] Play/Pausa • [R] Reiniciar • [M] Metrónomo • [L] Loop
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
