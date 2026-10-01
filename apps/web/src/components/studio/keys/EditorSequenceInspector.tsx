'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useKeysPractice } from '@/context/KeysPracticeContext';
import { RunwayNoteEvent, durationToBeats } from '@/services/theory/workoutEngine';
import { HandFocus } from '@/data/practiceWorkoutsData';
import {
  Rocket,
  Play,
  Clock,
  Music,
  Hand,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  Maximize2,
  Activity,
  Sliders,
} from 'lucide-react';

interface EditorSequenceInspectorProps {
  title: string;
  sourceTheory: string;
  rootNote: string;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  handFocus: HandFocus;
  onHandFocusChange: (hand: HandFocus) => void;
  sequenceNotes: RunwayNoteEvent[];
  objective?: string;
  leftHandInstruction?: string;
  rightHandInstruction?: string;
  pedagogicalTip?: string;
  className?: string;
}

export default function EditorSequenceInspector({
  title,
  sourceTheory,
  rootNote,
  bpm,
  onBpmChange,
  handFocus,
  onHandFocusChange,
  sequenceNotes,
  objective,
  leftHandInstruction,
  rightHandInstruction,
  pedagogicalTip,
  className = '',
}: EditorSequenceInspectorProps) {
  const router = useRouter();
  const { setPracticeSession } = useKeysPractice();

  // Compute measures breakdown
  const totalBeats = Math.max(
    16,
    sequenceNotes.reduce((max, s) => {
      const d = durationToBeats(s.duration);
      return Math.max(max, s.time + d);
    }, 16)
  );
  const totalBars = Math.ceil(totalBeats / 4);

  // Group notes by bar (4 beats per bar)
  const bars = Array.from({ length: totalBars }, (_, barIdx) => {
    const barStart = barIdx * 4;
    const barEnd = barStart + 4;
    const notesInBar = sequenceNotes.filter(
      (n) => n.time >= barStart && n.time < barEnd
    );
    return {
      barNumber: barIdx + 1,
      notes: notesInBar,
    };
  });

  // Extract unique MIDI pitches in sequence
  const uniqueMidis = Array.from(new Set(sequenceNotes.map((n) => n.midi))).sort(
    (a, b) => a - b
  );

  // Master Action: Compile, save to shared context & storage, and navigate to /studio/keys/practice
  const handleLaunchPracticeMode = async () => {
    // 1. Save state in shared context
    setPracticeSession({
      currentWorkout: {
        title,
        bpm,
        timeSignature: '4/4',
        handFocus,
        tonic: rootNote,
        objective,
        leftHandInstruction,
        rightHandInstruction,
        pedagogicalTip,
      },
      runwayNotes: sequenceNotes,
      sourceTheory,
    });

    // 2. Propose real fullscreen if supported
    try {
      if (typeof document !== 'undefined' && !document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          // Request fullscreen can fail without direct synchronous click in some browsers,
          // so catch gracefully
          await document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Fullscreen request deferred:', e);
    }

    // 3. Redirect to dedicated Synthesia practice page
    router.push('/studio/keys/practice');
  };

  return (
    <div
      className={`w-full flex flex-col gap-5 p-6 rounded-3xl bg-gradient-to-b from-[#0a1226]/95 via-[#070d1e]/98 to-[#040813] border-2 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl relative overflow-hidden ${className}`}
    >
      {/* Decorative ambient lights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

      {/* Top Header & Metadata */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/80 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono font-extrabold uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              INSPECTOR DE SECUENCIA &amp; PRÁCTICA
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-mono text-[11px] border border-slate-700">
              Tónica: <span className="font-bold text-amber-300">{rootNote}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-mono text-[11px] border border-slate-700">
              Compás: <span className="font-bold text-slate-100">4/4</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-mono text-[11px] border border-slate-700">
              {totalBars} Compases • {sequenceNotes.length} Notas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>{title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{sourceTheory || 'Secuencia armada lista para ejecución continua en Runway'}</span>
          </p>
        </div>

        {/* Quick Parameters (BPM & Hand Focus) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* BPM selector */}
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-slate-300">Tempo:</span>
            <button
              type="button"
              onClick={() => onBpmChange(Math.max(40, bpm - 5))}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="text-sm font-black font-mono text-cyan-300 px-1">{bpm}</span>
            <span className="text-[10px] text-slate-400 font-mono">BPM</span>
            <button
              type="button"
              onClick={() => onBpmChange(Math.min(220, bpm + 5))}
              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>

          {/* Hand Focus Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onHandFocusChange('left')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                handFocus === 'left'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hand className="w-3 h-3 text-purple-300" />
              <span>LH</span>
            </button>
            <button
              type="button"
              onClick={() => onHandFocusChange('right')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                handFocus === 'right'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hand className="w-3 h-3 text-cyan-300" />
              <span>RH</span>
            </button>
            <button
              type="button"
              onClick={() => onHandFocusChange('both')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                handFocus === 'both'
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>👐 Ambas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Objective & Pedagogical Tips (if available) */}
      {(objective || leftHandInstruction || rightHandInstruction || pedagogicalTip) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
          {objective && (
            <div className="md:col-span-2 text-slate-300 flex items-start gap-2">
              <span className="font-bold text-cyan-400 uppercase tracking-wider font-mono text-[10px]">
                🎯 Objetivo:
              </span>
              <span>{objective}</span>
            </div>
          )}
          {leftHandInstruction && (
            <div className="flex items-start gap-2 text-slate-300">
              <span className="font-bold text-purple-400 uppercase tracking-wider font-mono text-[10px]">
                🤚 Mano Izquierda:
              </span>
              <span>{leftHandInstruction}</span>
            </div>
          )}
          {rightHandInstruction && (
            <div className="flex items-start gap-2 text-slate-300">
              <span className="font-bold text-cyan-400 uppercase tracking-wider font-mono text-[10px]">
                ✋ Mano Derecha:
              </span>
              <span>{rightHandInstruction}</span>
            </div>
          )}
        </div>
      )}

      {/* Visual Sequence Breakdown (Bars & Notes Strip) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Desglose Armónico por Compás:</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Colores: <span className="text-purple-400 font-bold">LH (Violeta)</span> •{' '}
            <span className="text-cyan-400 font-bold">RH (Cyan)</span>
          </span>
        </div>

        {/* Measure Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {bars.map((bar) => (
            <div
              key={`bar-${bar.barNumber}`}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex flex-col gap-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800/80 pb-1.5">
                <span className="font-bold text-slate-300">Compás {bar.barNumber}</span>
                <span className="text-[10px] text-slate-500">
                  {bar.notes.length} {bar.notes.length === 1 ? 'nota' : 'notas'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[48px] items-center content-start">
                {bar.notes.length > 0 ? (
                  bar.notes.map((n, idx) => {
                    const isLH = n.hand === 'left';
                    return (
                      <span
                        key={`bar-${bar.barNumber}-n-${idx}`}
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                          isLH
                            ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                            : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLH ? 'bg-purple-400' : 'bg-cyan-400'
                          }`}
                        />
                        <span>{n.note}</span>
                        <span className="text-[8px] opacity-70">({n.duration})</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-600 italic">Silencio</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Compact Runway Preview Strip (Mini-tira de notas horizontal) */}
        <div className="w-full bg-[#050a16] p-3 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Mini-Tira Continua de Notas (Vista Previa Pre-Práctica)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Escala de tiempo proporcional
            </span>
          </div>

          <div className="relative w-full h-12 bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center">
            {/* Grid markers */}
            {Array.from({ length: totalBars }).map((_, i) => (
              <div
                key={`grid-line-${i}`}
                style={{ left: `${(i / totalBars) * 100}%` }}
                className="absolute top-0 bottom-0 border-l border-slate-800/60 z-0"
              >
                <span className="text-[8px] font-mono text-slate-600 pl-1">
                  C{i + 1}
                </span>
              </div>
            ))}

            {/* Note blocks */}
            {sequenceNotes.map((note, idx) => {
              const leftPercent = (note.time / totalBeats) * 100;
              const durBeats = durationToBeats(note.duration);
              const widthPercent = Math.max(1.8, (durBeats / totalBeats) * 100);
              const isLH = note.hand === 'left';

              // Vertical placement based on midi
              const minM = 36;
              const maxM = 96;
              const clampedM = Math.max(minM, Math.min(maxM, note.midi));
              const topPercent = 10 + (1 - (clampedM - minM) / (maxM - minM)) * 60;

              return (
                <div
                  key={`mini-note-${note.id || idx}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    top: `${topPercent}%`,
                  }}
                  title={`${note.note} (${note.hand === 'left' ? 'LH' : 'RH'})`}
                  className={`absolute h-4 rounded-sm border shadow-sm flex items-center justify-center transition-all ${
                    isLH
                      ? 'bg-purple-500/80 border-purple-400 text-white'
                      : 'bg-cyan-400/90 border-cyan-300 text-slate-950'
                  }`}
                >
                  <span className="text-[7px] font-mono font-black truncate px-0.5">
                    {note.note}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* BOTÓN MAESTRO DE ACCIÓN: INICIAR PRÁCTICA EN VIVO (Synthesia Runway) */}
      {/* ================================================================= */}
      <div className="pt-2 relative z-10">
        <button
          type="button"
          onClick={handleLaunchPracticeMode}
          className="group relative w-full py-4 sm:py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:via-teal-300 hover:to-cyan-300 text-slate-950 font-black shadow-[0_0_35px_rgba(20,184,166,0.5)] hover:shadow-[0_0_55px_rgba(6,182,212,0.7)] transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden"
        >
          {/* Shimmer animation bar */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

          {/* Left: Icon & Master Title */}
          <div className="flex items-center gap-3.5 z-10">
            <span className="w-12 h-12 rounded-xl bg-slate-950/90 text-cyan-300 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Rocket className="w-6 h-6 animate-bounce" />
            </span>
            <div className="text-left">
              <div className="text-base sm:text-lg lg:text-xl font-black tracking-tight uppercase flex items-center gap-2">
                <span>🚀 INICIAR PRÁCTICA EN VIVO</span>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-950 text-cyan-300 font-mono">
                  Synthesia Runway
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-900/80">
                Pasa al escenario inmersivo a pantalla completa (100vh) • Pista continua a 60 FPS • Detección MIDI
              </p>
            </div>
          </div>

          {/* Right: Enter Stage Indicator */}
          <div className="flex items-center gap-2 z-10 bg-slate-950/90 text-white px-4 py-2 rounded-xl border border-cyan-400/40 text-xs font-mono font-bold shadow-md group-hover:border-cyan-300">
            <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
            <span>ABRIR REPRODUCTOR</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
