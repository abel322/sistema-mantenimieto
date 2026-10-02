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
  const [highlightSyncopations, setHighlightSyncopations] = useState(true);

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
    <div className="w-full h-[calc(100vh-5rem)] bg-[#0d131f] text-slate-100 flex flex-col justify-between p-2.5 sm:p-3 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col justify-between gap-2.5 min-h-0">
        {/* ================================================================= */}
        {/* BARRA DE TRANSPORTE ÚNICA, ULTRA-COMPACTA Y ELEGANTE             */}
        {/* ================================================================= */}
        <header className="w-full px-3 py-2 rounded-2xl bg-[#131b2e]/95 border border-slate-800 shadow-xl backdrop-blur-xl flex items-center justify-between gap-2.5 flex-wrap shrink-0">
          {/* Bloque Izquierdo: Volver DAW + Título + Pill Síncopas */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/studio/drums"
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-bold font-mono shadow-sm group shrink-0"
              title="Volver al Taller DAW para modificar ritmos y celdas"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden md:inline">Volver a Editar DAW</span>
              <span className="md:hidden">DAW</span>
            </Link>

            <div className="h-4 w-px bg-slate-800 hidden sm:block shrink-0" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <h1 className="text-xs sm:text-sm font-black text-slate-100 tracking-tight truncate max-w-[140px] sm:max-w-[200px] lg:max-w-[280px]">
                {title || 'Partitura de Batería'}
              </h1>
            </div>

            {/* Pill sutil Pedagógico: Síncopas activas con tooltip */}
            <button
              type="button"
              onClick={() => setHighlightSyncopations((prev) => !prev)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none shrink-0 ${
                highlightSyncopations
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Modo Pedagógico: Resalta en ámbar neón (#F59E0B) las figuras y ligaduras sincopadas a contratiempo"
            >
              <span>💡</span>
              <span className="hidden xl:inline">Síncopas activas</span>
              <span className={`w-1.5 h-1.5 rounded-full ${highlightSyncopations ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
            </button>
          </div>

          {/* Bloque Central: Transporte [PLAY / STOP / LOOP] + BPM (- / + / TAP) + CLICK */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Play / Pausa */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-3.5 py-1.5 rounded-xl font-mono font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                audio.isPlaying
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/30'
                  : 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-cyan-500/25 active:scale-95'
              }`}
              title="Reproducir / Pausar (Barra Espaciadora)"
            >
              {audio.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-slate-950" />
                  <span>PAUSAR</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />
                  <span>REPRODUCIR</span>
                </>
              )}
            </button>

            {/* Stop / Reiniciar C1.1 */}
            <button
              type="button"
              onClick={handleStopReset}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 font-mono font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
              title="Detener y volver al inicio (Tecla R)"
            >
              <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              <span className="hidden sm:inline">STOP</span>
            </button>

            {/* Loop */}
            <button
              type="button"
              onClick={audio.toggleLoop}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-1 border cursor-pointer ${
                audio.isLooping
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title="Repetición Continua en Bucle (Tecla L)"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOOP</span>
            </button>

            {/* BPM Controls */}
            <div className="flex items-center gap-1 bg-slate-900/90 px-2 py-1 rounded-xl border border-slate-800">
              <Clock className="w-3 h-3 text-cyan-400 hidden sm:block" />
              <button
                type="button"
                onClick={() => handleSetBpm(audio.bpm - 5)}
                className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Bajar 5 BPM"
              >
                -
              </button>
              <span className="text-xs font-black text-cyan-300 font-mono px-1 min-w-[50px] text-center">
                {audio.bpm} <span className="text-[9px] text-slate-400 font-normal">BPM</span>
              </span>
              <button
                type="button"
                onClick={() => handleSetBpm(audio.bpm + 5)}
                className="w-5 h-5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Subir 5 BPM"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleTapTempo}
                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-cyan-400 hover:text-cyan-300 text-[9px] font-mono font-bold border border-slate-700 transition-colors cursor-pointer hidden sm:block"
                title="Haz clic a tempo para calcular BPM"
              >
                TAP
              </button>
            </div>

            {/* Metrónomo CLICK con Lámparas de Pulso */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={audio.toggleMetronome}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  audio.isMetronomeActive
                    ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
                title="Activar / Desactivar Metrónomo (Tecla M)"
              >
                <Bell className="w-3 h-3" />
                <span className="hidden sm:inline">CLICK</span>
              </button>

              {/* Lámparas de pulso T1..TN */}
              <div className="flex items-center gap-0.5 px-0.5">
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
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black transition-all ${
                        isFlash
                          ? isDownbeat
                            ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.9)] scale-110'
                            : 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.9)] scale-105'
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
          </div>

          {/* Bloque Derecho: Métrica 4/4 & Compás C1/CN + Runway/Páginas */}
          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
            {/* Badges de Métrica & Compás */}
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-bold text-[11px]">
                {timeSignature[0]}/{timeSignature[1]}
              </span>
              <span className="px-2 py-1 rounded-lg bg-purple-950/80 text-purple-300 border border-purple-700/60 font-bold text-[11px]">
                C{activeMeasureNumber}/{totalMeasures}
              </span>
            </div>

            {/* Selector Runway / Paginado */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setScoreLayoutMode('runway')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  scoreLayoutMode === 'runway'
                    ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Runway: Pentagrama continuo con autoscroll sincronizado"
              >
                <span>⇄</span>
                <span className="hidden sm:inline">Runway</span>
              </button>
              <button
                type="button"
                onClick={() => setScoreLayoutMode('paginated')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  scoreLayoutMode === 'paginated'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Paginado: Multilínea para lectura fija"
              >
                <span>⊞</span>
                <span className="hidden sm:inline">Páginas</span>
              </button>
            </div>
          </div>
        </header>

        {/* ================================================================= */}
        {/* ESCENARIO PRINCIPAL: PENTAGRAMA DE BATERÍA ESTÁNDAR (FLEX-1)     */}
        {/* ================================================================= */}
        <main className="w-full flex-1 min-h-0 bg-[#131b2e]/90 border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between gap-1.5">
          {/* Header del Escenario de Partitura */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5 font-mono text-xs shrink-0">
            <span className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <Music className="w-4 h-4 text-cyan-400" />
              <span>PENTAGRAMA ESTÁNDAR DE BATERÍA • CLAVE DE PERCUSIÓN (5 LÍNEAS)</span>
            </span>

            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>CURSOR LÁSER 60 FPS</span>
              </span>
              <span>•</span>
              <span className="text-slate-300">TONE.JS AUDIO</span>
            </div>
          </div>

          {/* Renderizado de Partitura con VexFlow & Cyber-Glass Grid */}
          <div className="w-full flex-1 min-h-[300px] bg-gradient-to-b from-slate-900/90 via-[#090e1a] to-[#060a12] border border-cyan-500/20 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col justify-center relative p-0">
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
              highlightSyncopations={highlightSyncopations}
              currentBeatFlash={audio.currentBeatFlash}
            />
          </div>

          {/* ================================================================= */}
          {/* PIE DE PÁGINA COMPACTO: LEYENDA MÍNIMA DE REFERENCIA RÁPIDA      */}
          {/* ================================================================= */}
          <footer className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3 text-[11px] font-mono shrink-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Sticking:</span>
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                R (Derecha)
              </span>
              <span className="flex items-center gap-1 text-fuchsia-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)]" />
                L (Izquierda)
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-bold">× Platillos</span>
              <span className="text-white font-bold">○ Caja</span>
              <span className="text-emerald-400 font-bold">● Bombo</span>
              <span className="text-amber-400 font-bold">&gt; Acento</span>
            </div>

            <div className="text-[10px] text-slate-400 font-mono hidden md:flex items-center gap-2">
              <span>[Espacio] Play/Pausa</span>
              <span>•</span>
              <span>[R] STOP</span>
              <span>•</span>
              <span>[M] Click</span>
              <span>•</span>
              <span>[L] Loop</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
