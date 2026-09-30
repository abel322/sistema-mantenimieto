'use client';

import React, { useState, useEffect } from 'react';
import {
  JamStyle,
  JAM_STYLES,
  keysJamEngine,
} from '@/services/audio/keysJamEngine';
import {
  CHROMATIC_NOTES,
  SCALE_CATALOG,
  ScaleDefinition,
} from '@/services/theory/keysTheoryEngine';
import {
  Zap,
  Play,
  Pause,
  Disc,
  Volume2,
  Shield,
  Keyboard,
  Music,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface JamStationProps {
  rootNote: string;
  onRootNoteChange: (root: string) => void;
  selectedScaleId: string;
  onSelectScaleId: (scaleId: string) => void;
  smartGuardActive: boolean;
  onSmartGuardToggle: (active: boolean) => void;
  blockWrongKeys: boolean;
  onBlockWrongKeysToggle: (blocked: boolean) => void;
  onPlayNoteTrigger?: (noteName: string) => void;
  className?: string;
}

export default function JamStation({
  rootNote,
  onRootNoteChange,
  selectedScaleId,
  onSelectScaleId,
  smartGuardActive,
  onSmartGuardToggle,
  blockWrongKeys,
  onBlockWrongKeysToggle,
  onPlayNoteTrigger,
  className = '',
}: JamStationProps) {
  const [selectedStyle, setSelectedStyle] = useState<JamStyle>('lofi');
  const [isJamming, setIsJamming] = useState(false);
  const [currentChordRoman, setCurrentChordRoman] = useState('iim9');

  // Handle style switch
  const handleStyleSelect = (style: JamStyle) => {
    setSelectedStyle(style);
    const cfg = JAM_STYLES.find((s) => s.id === style);
    if (cfg && cfg.recommendedScale) {
      if (SCALE_CATALOG.some((s) => s.id === cfg.recommendedScale)) {
        onSelectScaleId(cfg.recommendedScale);
      }
    }
    if (isJamming) {
      keysJamEngine.startJam(style, rootNote, cfg?.defaultBpm || 75, (beat, chord) => {
        setCurrentChordRoman(chord);
      });
    }
  };

  // Toggle Jam Playback
  const handleToggleJam = async () => {
    if (isJamming) {
      keysJamEngine.stopJam();
      setIsJamming(false);
    } else {
      const cfg = JAM_STYLES.find((s) => s.id === selectedStyle);
      await keysJamEngine.startJam(
        selectedStyle,
        rootNote,
        cfg?.defaultBpm || 75,
        (beat, chord) => {
          setCurrentChordRoman(chord);
        }
      );
      setIsJamming(true);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      keysJamEngine.stopJam();
    };
  }, []);

  const activeStyleConfig = JAM_STYLES.find((s) => s.id === selectedStyle) || JAM_STYLES[0];
  const activeScale = SCALE_CATALOG.find((s) => s.id === selectedScaleId) || SCALE_CATALOG[0];

  return (
    <div className={`w-full flex flex-col gap-5 p-5 rounded-2xl bg-gradient-to-b from-[#0a1224] to-[#060b18] border border-cyan-500/30 shadow-2xl backdrop-blur-md ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              MODO JAM &amp; SALA DE IMPROVISACIÓN • SONORA
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Smart Scale Guard
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Improvisación Libre Sin Notas Erróneas</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            La pista de acompañamiento reproduce un groove continuo mientras el teclado interactivo ilumina en dorado tus puntos de reposo (Tónica y 5ª) y bloquea notas fuera de escala.
          </p>
        </div>

        {/* Master Jam Play/Pause Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleJam}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2.5 shadow-xl ${
              isJamming
                ? 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-400 animate-pulse'
                : 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 hover:brightness-110 shadow-cyan-500/30'
            }`}
          >
            {isJamming ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>DETENER JAM</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>INICIAR BASE JAM</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Style Selector Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {JAM_STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              className={`p-3 rounded-xl border text-left font-mono transition-all flex flex-col gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-amber-400 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-300 uppercase">
                  {style.tag}
                </span>
                <span className="text-[10px] text-slate-400">
                  {style.defaultBpm} BPM
                </span>
              </div>
              <div className="text-sm font-black text-white">
                {style.name}
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tonalidad, Escala y Asistente Smart Guard */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
        {/* Key Root Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Tónica:</span>
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
            {CHROMATIC_NOTES.map((note) => (
              <button
                key={note}
                onClick={() => onRootNoteChange(note)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  rootNote === note
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        {/* Scale Picker for Jam */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Escala de Jam:</span>
          <select
            value={selectedScaleId}
            onChange={(e) => onSelectScaleId(e.target.value)}
            className="bg-slate-900 text-cyan-300 font-extrabold px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {SCALE_CATALOG.map((scale) => (
              <option key={scale.id} value={scale.id} className="bg-slate-900 text-slate-100">
                {scale.name}
              </option>
            ))}
          </select>
        </div>

        {/* Smart Guard Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSmartGuardToggle(!smartGuardActive)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
              smartGuardActive
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Smart Key Guard {smartGuardActive ? '[ACTIVO]' : '[OFF]'}</span>
          </button>

          <button
            onClick={() => onBlockWrongKeysToggle(!blockWrongKeys)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 border ${
              blockWrongKeys
                ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Bloquea físicamente las notas que desafinan en la tonalidad"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Bloquear Teclas Erróneas {blockWrongKeys ? '[ON]' : '[OFF]'}</span>
          </button>
        </div>
      </div>

      {/* Guide: Color Legend & Computer Keyboard Jamming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-slate-400 font-bold">Código de Color en Teclado:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
            <span className="text-amber-300 font-bold">Dorado: Tónica &amp; 5ª (Target / Reposo)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
            <span className="text-cyan-300 font-bold">Cyan: Notas Seguras (Escala)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></span>
            <span className="text-slate-500">Oscuro: Fuera de Escala</span>
          </div>
        </div>

        {/* Computer Keyboard Jamming Guide */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-900/40 text-purple-200">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-purple-400" />
            <span className="font-bold">Mapeo Laptop (A, S, D, F, G, H, J, K, L...):</span>
          </div>
          <span className="text-[11px] text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/60 font-bold">
            Mapeado a {rootNote} {activeScale.name}
          </span>
        </div>
      </div>
    </div>
  );
}
