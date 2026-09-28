'use client';

import React from 'react';
import {
  Play,
  Square,
  Repeat,
  Volume2,
  Sliders,
  Music,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  InstrumentType,
  TuningId,
  FretboardOverlayMode,
  MusicalKey,
  ScaleType,
} from '@/types/strings';

interface StringsTransportBarProps {
  isPlaying: boolean;
  bpm: number;
  isLoop: boolean;
  measuresCount: number;
  instrument: InstrumentType;
  tuning: TuningId;
  overlayMode: FretboardOverlayMode;
  musicalKey: MusicalKey;
  scaleType: ScaleType;
  volume: number; // in dB -30 to 6
  onTogglePlay: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onToggleLoop: () => void;
  onMeasuresCountChange: (count: number) => void;
  onInstrumentChange: (inst: InstrumentType) => void;
  onTuningChange: (tuning: TuningId) => void;
  onOverlayModeChange: (mode: FretboardOverlayMode) => void;
  onKeyChange: (key: MusicalKey) => void;
  onScaleChange: (scale: ScaleType) => void;
  onVolumeChange: (vol: number) => void;
}

const MUSICAL_KEYS: MusicalKey[] = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

const SCALE_OPTIONS: { id: ScaleType; label: string }[] = [
  { id: 'minor_pentatonic', label: 'Pentatónica Menor' },
  { id: 'major_pentatonic', label: 'Pentatónica Mayor' },
  { id: 'minor', label: 'Menor Natural' },
  { id: 'major', label: 'Mayor Natural' },
  { id: 'dorian', label: 'Dórico' },
  { id: 'mixolydian', label: 'Mixolidio' },
  { id: 'blues', label: 'Escala Blues' },
];

export default function StringsTransportBar({
  isPlaying,
  bpm,
  isLoop,
  measuresCount,
  instrument,
  tuning,
  overlayMode,
  musicalKey,
  scaleType,
  volume,
  onTogglePlay,
  onStop,
  onBpmChange,
  onToggleLoop,
  onMeasuresCountChange,
  onInstrumentChange,
  onTuningChange,
  onOverlayModeChange,
  onKeyChange,
  onScaleChange,
  onVolumeChange,
}: StringsTransportBarProps) {
  return (
    <div className="w-full bg-[#0E1526]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl">
      {/* Top Row: Main Transport & Tempo */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Play / Stop / Loop Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`px-5 py-2.5 rounded-xl font-mono font-black text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-900/40'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>PAUSAR</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>REPRODUCIR</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStop}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Detener y volver al inicio"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleLoop}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isLoop
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Activar o desactivar Loop continuo"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Center: BPM & Measures */}
        <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-1.5 px-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">TEMPO:</span>
            <input
              type="number"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onBpmChange(Math.max(40, Math.min(240, val)));
              }}
              className="w-14 px-2 py-1 rounded bg-black/60 border border-white/15 text-cyan-400 font-mono font-black text-sm text-center focus:outline-none focus:border-cyan-500"
            />
            <span className="text-xs font-mono text-slate-400">BPM</span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Measures selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Compases:</span>
            {[1, 2, 3, 4].map((count) => (
              <button
                key={`bars-${count}`}
                type="button"
                onClick={() => onMeasuresCountChange(count)}
                className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  measuresCount === count
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Master Volume */}
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5 px-3">
          <Volume2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            type="range"
            min="-30"
            max="6"
            step="1"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
            title="Volumen general del sintetizador"
          />
        </div>
      </div>

      {/* Bottom Row: Instrument, Tuning, Overlay & Scale Configuration */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Instrument Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Instrumento:</span>
          <button
            type="button"
            onClick={() => onInstrumentChange('bass_4')}
            className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
              instrument === 'bass_4'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            🎸 Bajo 4 Cuerdas
          </button>
          <button
            type="button"
            onClick={() => onInstrumentChange('bass_5')}
            className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
              instrument === 'bass_5'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Bajo 5 Cuerdas
          </button>
          <button
            type="button"
            onClick={() => onInstrumentChange('guitar_6')}
            className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
              instrument === 'guitar_6'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            🎼 Guitarra 6 Cuerdas
          </button>
        </div>

        {/* Tuning Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Afinación:</span>
          <select
            value={tuning}
            onChange={(e) => onTuningChange(e.target.value as TuningId)}
            className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="standard">Standard (Mi La Re Sol)</option>
            <option value="drop_d">Drop D (Re La Re Sol)</option>
            <option value="half_step_down">Eb Standard (1/2 tono abajo)</option>
          </select>
        </div>

        {/* Overlays Mode (Notas / Intervalos / Digitación) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Mástil:</span>
          <button
            type="button"
            onClick={() => onOverlayModeChange('notes')}
            className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              overlayMode === 'notes'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Notas
          </button>
          <button
            type="button"
            onClick={() => onOverlayModeChange('intervals')}
            className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              overlayMode === 'intervals'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Intervalos / Grados
          </button>
          <button
            type="button"
            onClick={() => onOverlayModeChange('fingering')}
            className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              overlayMode === 'fingering'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            Digitación (1-4)
          </button>
        </div>

        {/* Tonalidad y Escala */}
        {overlayMode === 'intervals' && (
          <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/30 rounded-xl p-1.5 px-3">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Tonalidad:</span>
            <select
              value={musicalKey}
              onChange={(e) => onKeyChange(e.target.value as MusicalKey)}
              className="px-2 py-1 rounded bg-black/60 border border-white/10 text-white font-mono font-bold cursor-pointer"
            >
              {MUSICAL_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <select
              value={scaleType}
              onChange={(e) => onScaleChange(e.target.value as ScaleType)}
              className="px-2 py-1 rounded bg-black/60 border border-white/10 text-white font-mono cursor-pointer"
            >
              {SCALE_OPTIONS.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
