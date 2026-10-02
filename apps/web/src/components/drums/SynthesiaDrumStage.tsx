'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Tone from 'tone';
import { useDrumPractice, DrumNoteEvent } from '@/context/DrumPracticeContext';
import { useDrumAudio } from '@/hooks/useDrumAudio';
import { DrumPieceId, DRUM_PIECES, DRUM_ORDER } from '@/types/drum';
import MiniScorePreview from './MiniScorePreview';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Zap,
  Music,
  Activity,
  Radio,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface DrumLaneConfig {
  id: string;
  name: string;
  pieces: DrumPieceId[];
  color: string;
}

const DRUM_LANES: DrumLaneConfig[] = [
  {
    id: 'cymbals',
    name: 'Platillos (Crash / Ride / China)',
    pieces: ['crash', 'china', 'ride', 'cowbell'],
    color: '#38bdf8', // Sky 400
  },
  {
    id: 'hihat',
    name: 'Hi-Hat (Open / Closed / Foot)',
    pieces: ['hihatOpen', 'hihatClosed', 'hihat', 'hihatFoot'],
    color: '#818cf8', // Indigo 400
  },
  {
    id: 'toms',
    name: 'Toms (Hi / Mid / Floor)',
    pieces: ['tom1', 'tom2', 'floorTom'],
    color: '#f472b6', // Pink 400
  },
  {
    id: 'snare',
    name: 'Caja / Snare Drum',
    pieces: ['snare'],
    color: '#fbbf24', // Amber 400
  },
  {
    id: 'kick',
    name: 'Bombo / Bass Drum',
    pieces: ['kick'],
    color: '#34d399', // Emerald 400
  },
];

export default function SynthesiaDrumStage() {
  const router = useRouter();
  const {
    title,
    bpm,
    timeSignature,
    measures,
    drumEvents,
    displayMode,
    isMetronomeActive,
    metronomeVolume,
    updateBpm,
    setDisplayMode,
    toggleMetronome,
    setMetronomeVolume,
  } = useDrumPractice();

  const audio = useDrumAudio();

  // 1. Hooks de estado montado & pantalla completa
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [currentBeat, setCurrentBeat] = useState(0);

  // Tap tempo state
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);

  // Feedback visual de golpe manual en vivo
  const [liveHitPushed, setLiveHitPushed] = useState<Record<string, number>>({});

  // Refs de renderizado 60 FPS
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const triggeredEventIdsRef = useRef<Set<string>>(new Set());

  // Mount effect
  useEffect(() => {
    setMounted(true);
    if (bpm) {
      audio.setBpm(bpm);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar BPM con el motor de audio
  useEffect(() => {
    if (!mounted) return;
    audio.setBpm(bpm);
  }, [bpm, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fullscreen event listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  // Total de compases y tiempos
  const totalMeasures = measures.length || 1;
  const beatsPerMeasure = timeSignature[0] || 4;
  const totalBeats = useMemo(() => {
    return totalMeasures * beatsPerMeasure;
  }, [totalMeasures, beatsPerMeasure]);

  // Tap tempo handler
  const handleTapTempo = () => {
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
        updateBpm(calculatedBpm);
      }
    }
  };

  // Keyboard shortcut triggers for interactive live drumming
  useEffect(() => {
    const keyMap: Record<string, DrumPieceId> = {
      k: 'kick',
      s: 'snare',
      h: 'hihatClosed',
      o: 'hihatOpen',
      p: 'hihatFoot',
      c: 'crash',
      r: 'ride',
      t: 'tom1',
      m: 'tom2',
      f: 'floorTom',
      w: 'cowbell',
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => {
          const next = !prev;
          if (next) {
            audio.initAudio();
            if (startTimeRef.current === 0) {
              startTimeRef.current = performance.now() - currentBeat * (60 / bpm) * 1000;
            }
          }
          return next;
        });
        return;
      }

      if (e.code === 'KeyR') {
        e.preventDefault();
        setCurrentBeat(0);
        startTimeRef.current = 0;
        triggeredEventIdsRef.current.clear();
        return;
      }

      if (e.code === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        return;
      }

      const piece = keyMap[e.key.toLowerCase()];
      if (piece && !e.repeat) {
        audio.playHit(piece);
        setLiveHitPushed((prev) => ({ ...prev, [piece]: Date.now() }));
        setTimeout(() => {
          setLiveHitPushed((prev) => {
            const next = { ...prev };
            delete next[piece];
            return next;
          });
        }, 180);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audio, bpm, currentBeat]);

  // Dibujado del Runway en Canvas 2D a 60 FPS
  const drawRunway = useCallback(
    (beat: number) => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Fondo oscuro Cyber Stage
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#060a14');
        bgGrad.addColorStop(0.5, '#080e1c');
        bgGrad.addColorStop(1, '#050711');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Parámetros de la pista
        const hitLineX = w * 0.16; // Línea de impacto al 16% izquierdo
        const pixelsPerBeat = Math.max(140, w * 0.18);
        const lanesCount = DRUM_LANES.length;
        const laneHeight = h / lanesCount;

        // 1. Dibujar Carriles Horizontales
        DRUM_LANES.forEach((lane, idx) => {
          const y = idx * laneHeight;

          // Fondo alternado muy sutil
          ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent';
          ctx.fillRect(0, y, w, laneHeight);

          // Línea divisoria
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, y + laneHeight);
          ctx.lineTo(w, y + laneHeight);
          ctx.stroke();

          // Etiqueta del carril (a la izquierda de la línea de impacto)
          ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(lane.name, hitLineX - 16, y + laneHeight / 2 + 3.5);
        });

        // 2. Líneas de compás y subdivisiones métricas
        ctx.textAlign = 'left';
        for (let b = 0; b <= totalBeats; b++) {
          const x = hitLineX + (b - beat) * pixelsPerBeat;
          if (x >= 0 && x <= w) {
            const isBarLine = b % beatsPerMeasure === 0;

            ctx.strokeStyle = isBarLine ? 'rgba(34, 211, 238, 0.25)' : 'rgba(255, 255, 255, 0.04)';
            ctx.lineWidth = isBarLine ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();

            // Etiqueta de compás
            if (isBarLine) {
              const measureNum = Math.floor(b / beatsPerMeasure) + 1;
              ctx.fillStyle = '#22d3ee';
              ctx.font = 'bold 10px monospace';
              ctx.fillText(`C${measureNum}`, x + 6, 16);
            }
          }
        }

        // 3. Dibujar Notas viajando hacia la línea de impacto
        drumEvents.forEach((ev) => {
          // Encontrar índice del carril
          const laneIdx = DRUM_LANES.findIndex((l) => l.pieces.includes(ev.pieceId));
          if (laneIdx === -1) return;

          const laneY = laneIdx * laneHeight;
          const noteX = hitLineX + (ev.time - beat) * pixelsPerBeat;
          const noteWidth = Math.max(22, (ev.durationBeats || 0.25) * pixelsPerBeat - 3);
          const noteHeight = Math.max(18, laneHeight * 0.58);
          const noteY = laneY + (laneHeight - noteHeight) / 2;

          if (noteX + noteWidth < 0 || noteX > w + 50) return;

          const isHit = Math.abs(ev.time - beat) < 0.12;

          ctx.save();

          // Selección de color según Mano / Pie
          const isRight = ev.sticking === 'R';
          const isLeft = ev.sticking === 'L';
          const isKick = ev.pieceId === 'kick' || ev.sticking === 'K';
          const isFoot = ev.pieceId === 'hihatFoot' || ev.sticking === 'F';

          let fillCol = '#22d3ee'; // Cian neón (mano derecha)
          let strokeCol = '#0891b2';
          let textCol = '#020617';

          if (isKick) {
            fillCol = '#10b981'; // Esmeralda (Bombo)
            strokeCol = '#059669';
          } else if (isFoot) {
            fillCol = '#f59e0b'; // Ámbar (Hi-Hat pie)
            strokeCol = '#d97706';
          } else if (isLeft) {
            fillCol = '#c084fc'; // Violeta (Mano izquierda)
            strokeCol = '#9333ea';
            textCol = '#1e1b4b';
          }

          // Acento: tamaño aumentado y halo radiante
          if (ev.accent) {
            ctx.shadowColor = fillCol;
            ctx.shadowBlur = 18;
          }

          // Ghost note: translúcida
          if (ev.ghost) {
            ctx.globalAlpha = 0.45;
          }

          // Resaltado al momento del impacto
          if (isHit) {
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 24;
            ctx.fillStyle = '#ffffff';
          } else {
            ctx.fillStyle = fillCol;
          }

          // Rectángulo redondeado
          ctx.beginPath();
          ctx.roundRect(noteX, noteY, noteWidth, noteHeight, 5);
          ctx.fill();

          ctx.strokeStyle = strokeCol;
          ctx.lineWidth = ev.accent ? 2 : 1;
          ctx.stroke();

          // Texto de Sticking o Instrumento
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isHit ? '#000000' : textCol;

          const label = ev.ghost ? `(${ev.sticking || 'g'})` : ev.sticking || ev.pieceId.slice(0, 2);
          ctx.fillText(label, noteX + noteWidth / 2, noteY + noteHeight / 2);

          ctx.restore();
        });

        // 4. Línea de Impacto Vertical Cian Neón (16%)
        ctx.save();
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(hitLineX, 0);
        ctx.lineTo(hitLineX, h);
        ctx.stroke();

        // Marcador circular superior
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(hitLineX, 10, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } catch (drawErr) {
        console.warn('[SynthesiaDrumStage] drawRunway caught error:', drawErr);
      }
    },
    [drumEvents, totalBeats, beatsPerMeasure]
  );

  // Resize canvas handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      drawRunway(currentBeat);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawRunway, currentBeat]);

  // Bucle de audio y animación a 60 FPS
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      drawRunway(currentBeat);
      return;
    }

    const secPerBeat = 60 / bpm;
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now() - currentBeat * secPerBeat * 1000;
    }

    const loop = () => {
      const elapsedSec = (performance.now() - startTimeRef.current) / 1000;
      let beat = elapsedSec / secPerBeat;

      // Loop o finalización
      if (beat >= totalBeats) {
        if (isLooping) {
          startTimeRef.current = performance.now();
          triggeredEventIdsRef.current.clear();
          beat = 0;
        } else {
          setIsPlaying(false);
          drawRunway(0);
          return;
        }
      }

      setCurrentBeat(beat);
      drawRunway(beat);

      // Disparar audios de notas al cruzar la línea de impacto
      drumEvents.forEach((ev) => {
        if (beat >= ev.time && !triggeredEventIdsRef.current.has(ev.id)) {
          triggeredEventIdsRef.current.add(ev.id);
          try {
            audio.playHit(ev.pieceId, ev.accent, ev.ghost);
          } catch (e) {
            console.warn('[DrumStage] Audio trigger error:', e);
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, bpm, isLooping, totalBeats, drumEvents, drawRunway, currentBeat, audio]);

  const currentMeasure = Math.floor(currentBeat / beatsPerMeasure) + 1;
  const currentBeatInMeasure = (currentBeat % beatsPerMeasure) + 1;

  // ─── SAFE EARLY RETURN — colocado después de TODOS los hooks ────────────────
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <span className="text-sm font-mono font-bold tracking-wider uppercase text-cyan-400">
            Cargando Escenario de Batería...
          </span>
          <span className="text-xs text-slate-500 font-mono">{title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen overflow-hidden bg-[#080c14] text-slate-100 flex flex-col justify-between select-none">
      {/* ================================================================= */}
      {/* A) TOP HUD MINIMALISTA FLOTANTE                                   */}
      {/* ================================================================= */}
      <header className="w-full px-4 py-2.5 bg-[#070b16]/95 border-b border-slate-800/80 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 z-50">
        {/* Left: Botón Volver al Editor & Info de Ejercicio */}
        <div className="flex items-center gap-3">
          <Link
            href="/studio/drums"
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Volver al Taller DAW de Edición"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Editor DAW</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-slate-100 tracking-tight truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {title}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                {timeSignature[0]}/{timeSignature[1]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="text-cyan-300 font-bold">
                Compás {currentMeasure} / {totalMeasures}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                Tiempo {currentBeatInMeasure.toFixed(1)} / {beatsPerMeasure}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Controles de Transporte */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          {/* Play / Pausa */}
          <button
            type="button"
            onClick={() => {
              audio.initAudio();
              setIsPlaying(!isPlaying);
            }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.6)] scale-105'
                : 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(6,182,212,0.4)] hover:scale-105'
            }`}
            title="Reproducir / Pausar (Espacio)"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-slate-950" />
            ) : (
              <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
            )}
          </button>

          {/* Reset / Rewind */}
          <button
            type="button"
            onClick={() => {
              setCurrentBeat(0);
              startTimeRef.current = 0;
              triggeredEventIdsRef.current.clear();
            }}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Reiniciar Ejercicio (R)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Loop toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              isLooping
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                : 'bg-slate-900 text-slate-500 hover:text-slate-300'
            }`}
            title="Bucle Continuo"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* BPM Adjustment */}
          <div className="flex items-center gap-1.5 px-2 font-mono text-xs">
            <span className="text-slate-400 text-[10px]">BPM</span>
            <button
              type="button"
              onClick={() => updateBpm(bpm - 5)}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-cyan-300">{bpm}</span>
            <button
              type="button"
              onClick={() => updateBpm(bpm + 5)}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold flex items-center justify-center"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleTapTempo}
              className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 text-[10px] font-bold border border-slate-800"
              title="Haz clic a tempo para calcular BPM"
            >
              TAP
            </button>
          </div>

          {/* Metronome Toggle */}
          <button
            type="button"
            onClick={toggleMetronome}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 border ${
              isMetronomeActive
                ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.5)] font-black'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Activar / Desactivar Clic de Metrónomo"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Click {isMetronomeActive ? '[ON]' : '[OFF]'}</span>
          </button>
        </div>

        {/* Right: Modo Visual & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Selector de Modo Visual: Runway vs Partitura */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setDisplayMode('runway')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                displayMode === 'runway'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ Runway Synthesia</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('sheet')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                displayMode === 'sheet'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>🎼 Partitura Continua</span>
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* B) ESCENARIO PRINCIPAL DE PRÁCTICA                                */}
      {/* ================================================================= */}
      <main className="flex-1 min-h-0 w-full flex flex-col justify-between relative overflow-hidden bg-[#080c14]">
        {/* Leyenda flotante de Stickings y Atajos */}
        <div className="absolute top-3 right-4 z-20 pointer-events-none hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/90 text-[10px] font-mono backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-slate-300 font-bold">Mano Derecha (R)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
            <span className="text-slate-300 font-bold">Mano Izquierda (L)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-slate-300 font-bold">Pies (Bombo/HH)</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-bold">Atajos Laptop: K, S, H, C, R, T, M, F</span>
        </div>

        {/* 1. MODO RUNWAY SYNTHESIA (60 FPS Canvas) */}
        {displayMode === 'runway' && (
          <div className="w-full flex-1 min-h-0 relative overflow-hidden flex items-stretch">
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              style={{ touchAction: 'none' }}
            />
          </div>
        )}

        {/* 2. MODO PARTITURA CONTINUA */}
        {displayMode === 'sheet' && (
          <div className="w-full flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-5xl rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-6">
              <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                    Lectura de Partitura de Percusión (5 Líneas Estándar)
                  </span>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  Compás activo: {currentMeasure} / {totalMeasures}
                </span>
              </div>

              {/* Render de Partitura */}
              <div className="w-full bg-[#0a1020] rounded-2xl p-6 border border-slate-800/80 shadow-inner flex justify-center">
                <MiniScorePreview
                  measures={measures}
                  timeSignature={timeSignature}
                  width={850}
                  height={180}
                  className="w-full"
                />
              </div>

              <p className="text-xs text-slate-400 font-mono text-center">
                Pentagrama adaptado a distancia para bateristas reales. Pulsa [Espacio] para reproducir con Tone.js.
              </p>
            </div>
          </div>
        )}

        {/* Barra inferior reactiva con botones de instrumentos interactivos */}
        <footer className="w-full py-2.5 px-4 bg-[#070b16]/95 border-t border-slate-800/80 backdrop-blur-xl flex items-center justify-between gap-2 overflow-x-auto z-40">
          <span className="text-[11px] font-mono text-slate-500 font-bold uppercase hidden md:inline">
            Pad Táctil / Teclas:
          </span>
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {[
              { id: 'kick' as DrumPieceId, key: 'K', label: 'BOMBO', col: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' },
              { id: 'snare' as DrumPieceId, key: 'S', label: 'CAJA', col: 'border-amber-500/50 bg-amber-500/10 text-amber-300' },
              { id: 'hihatClosed' as DrumPieceId, key: 'H', label: 'H.H.', col: 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300' },
              { id: 'hihatOpen' as DrumPieceId, key: 'O', label: 'H.H. OPEN', col: 'border-violet-500/50 bg-violet-500/10 text-violet-300' },
              { id: 'tom1' as DrumPieceId, key: 'T', label: 'TOM 1', col: 'border-pink-500/50 bg-pink-500/10 text-pink-300' },
              { id: 'tom2' as DrumPieceId, key: 'M', label: 'TOM 2', col: 'border-rose-500/50 bg-rose-500/10 text-rose-300' },
              { id: 'floorTom' as DrumPieceId, key: 'F', label: 'FLOOR TOM', col: 'border-purple-500/50 bg-purple-500/10 text-purple-300' },
              { id: 'crash' as DrumPieceId, key: 'C', label: 'CRASH', col: 'border-sky-500/50 bg-sky-500/10 text-sky-300' },
              { id: 'ride' as DrumPieceId, key: 'R', label: 'RIDE', col: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' },
            ].map((item) => {
              const isPushed = !!liveHitPushed[item.id];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    audio.playHit(item.id);
                    setLiveHitPushed((prev) => ({ ...prev, [item.id]: Date.now() }));
                    setTimeout(() => {
                      setLiveHitPushed((prev) => {
                        const next = { ...prev };
                        delete next[item.id];
                        return next;
                      });
                    }, 180);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-mono font-black transition-all duration-75 flex items-center gap-1.5 cursor-pointer select-none ${item.col} ${
                    isPushed
                      ? 'scale-110 shadow-[0_0_20px_rgba(34,211,238,0.9)] bg-white text-slate-950 ring-2 ring-cyan-400'
                      : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  <span className="opacity-70 text-[9px]">[{item.key}]</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </footer>
      </main>
    </div>
  );
}
