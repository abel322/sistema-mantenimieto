'use client';

import React, { useState } from 'react';
import {
  InstrumentType,
  StringTrack,
  StringArticulation,
  SequencerStepCell,
  BassArticulation,
  GuitarArticulation,
} from '@/types/strings';
import {
  Sparkles,
  RotateCcw,
  Sliders,
  ChevronDown,
  Volume2,
  Trash2,
} from 'lucide-react';
import { calculateFretNote } from '@/services/audio/stringsAudioEngine';

interface StringsSequencerGridProps {
  instrument: InstrumentType;
  tracks: StringTrack[];
  measuresCount: number;
  currentStep: number;
  isPlaying: boolean;
  onUpdateStep: (stringIndex: number, stepIndex: number, stepData: SequencerStepCell) => void;
  onClearGrid: () => void;
  onLoadPreset: (presetId: string) => void;
}

const BASS_ARTICULATIONS: { id: BassArticulation; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'normal', label: 'Norm', icon: '•', desc: 'Dedo / Púa normal', color: 'text-slate-300' },
  { id: 'slap', label: 'Slap (S)', icon: 'S', desc: 'Pulgar percutido', color: 'text-amber-400 font-bold' },
  { id: 'pop', label: 'Pop (P)', icon: 'P', desc: 'Jalón índice/medio', color: 'text-cyan-400 font-bold' },
  { id: 'ghost', label: 'Ghost (x)', icon: 'x', desc: 'Nota muerta percusiva', color: 'text-slate-500 font-mono' },
];

const GUITAR_ARTICULATIONS: { id: GuitarArticulation; label: string; icon: string; desc: string; color: string }[] = [
  { id: 'normal', label: 'Norm', icon: '•', desc: 'Pulsación libre', color: 'text-slate-300' },
  { id: 'downstroke', label: 'Down (⊓)', icon: '⊓', desc: 'Púa hacia abajo', color: 'text-emerald-400 font-bold' },
  { id: 'upstroke', label: 'Up (∨)', icon: '∨', desc: 'Púa hacia arriba', color: 'text-sky-400 font-bold' },
  { id: 'palmmute', label: 'P.M.', icon: 'P.M.', desc: 'Palm Mute apagado', color: 'text-purple-400 font-bold' },
];

export default function StringsSequencerGrid({
  instrument,
  tracks,
  measuresCount,
  currentStep,
  isPlaying,
  onUpdateStep,
  onClearGrid,
  onLoadPreset,
}: StringsSequencerGridProps) {
  const isBass = instrument.startsWith('bass');
  const totalSteps = measuresCount * 16;
  const [selectedCell, setSelectedCell] = useState<{ stringIndex: number; stepIndex: number } | null>(null);
  const [fretPickerValue, setFretPickerValue] = useState<number>(0);

  // Quick preset options
  const presets = isBass
    ? [
        { id: 'bass_slap_funk', name: '⚡ Funk Slap & Pop' },
        { id: 'bass_walking_jazz', name: '🎷 Walking Jazz Line' },
        { id: 'bass_rock_pump', name: '🎸 Rock 8th Note Pump' },
        { id: 'bass_disco_octaves', name: '✨ Disco Octaves' },
      ]
    : [
        { id: 'guitar_neo_soul', name: '☕ Neo-Soul Clean Arp' },
        { id: 'guitar_metal_chug', name: '🔥 Metal Palm Mute Chug' },
        { id: 'guitar_funk_chops', name: '🕺 Funk 16th Stabs' },
        { id: 'guitar_indie_riff', name: '🌊 Indie Pop Melodic Riff' },
      ];

  const handleCellClick = (sIdx: number, stepIdx: number) => {
    const track = tracks[sIdx];
    const currentCell = track?.steps[stepIdx];

    if (!currentCell || currentCell.fret === null) {
      // Toggle ON with root or default fret (e.g. 0 or 5 or open string)
      onUpdateStep(sIdx, stepIdx, {
        fret: 0,
        articulation: 'normal',
      });
      setSelectedCell({ stringIndex: sIdx, stepIndex: stepIdx });
      setFretPickerValue(0);
    } else {
      // If already active, select to edit or open quick modal
      setSelectedCell({ stringIndex: sIdx, stepIndex: stepIdx });
      setFretPickerValue(currentCell.fret);
    }
  };

  const handleApplyFret = (fret: number | null) => {
    if (!selectedCell) return;
    const { stringIndex, stepIndex } = selectedCell;
    const current = tracks[stringIndex]?.steps[stepIndex];
    onUpdateStep(stringIndex, stepIndex, {
      fret,
      articulation: current?.articulation || 'normal',
    });
  };

  const handleApplyArticulation = (art: StringArticulation) => {
    if (!selectedCell) return;
    const { stringIndex, stepIndex } = selectedCell;
    const current = tracks[stringIndex]?.steps[stepIndex];
    if (current && current.fret !== null) {
      onUpdateStep(stringIndex, stepIndex, {
        ...current,
        articulation: art,
      });
    }
  };

  return (
    <div className="w-full bg-[#0E1526]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl">
      {/* Top Bar: Presets & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sliders className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Secuenciador por Pasos & Tablatura ({measuresCount} {measuresCount === 1 ? 'Compás' : 'Compases'} • {totalSteps} Pasos)
          </h3>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Riffs / Presets:</span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onLoadPreset(p.id)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-all cursor-pointer"
            >
              {p.name}
            </button>
          ))}

          <button
            type="button"
            onClick={onClearGrid}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs transition-all cursor-pointer ml-1"
            title="Limpiar todas las notas del secuenciador"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sequencer Grid Scroll Container */}
      <div className="relative w-full overflow-x-auto custom-scrollbar pb-2">
        <div style={{ minWidth: `${totalSteps * 44 + 90}px` }} className="flex flex-col gap-1.5">
          {/* Step Numbers & Measure Markers Header */}
          <div className="flex items-center">
            {/* Left Header Gap */}
            <div className="w-20 shrink-0 text-[10px] font-mono font-bold text-slate-500 uppercase px-2">
              Cuerda
            </div>

            {/* Steps Numbers (1 e & a, 2 e & a...) */}
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(40px, 1fr))` }}>
              {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                const beatNum = Math.floor((stepIdx % 16) / 4) + 1;
                const subIdx = stepIdx % 4;
                const measureNum = Math.floor(stepIdx / 16) + 1;
                const isDownbeat = subIdx === 0;
                const isMeasureStart = stepIdx % 16 === 0;
                const isPlayhead = isPlaying && currentStep === stepIdx;

                let subLabel = '';
                if (subIdx === 0) subLabel = `${beatNum}`;
                else if (subIdx === 1) subLabel = 'e';
                else if (subIdx === 2) subLabel = '&';
                else if (subIdx === 3) subLabel = 'a';

                return (
                  <div
                    key={`step-head-${stepIdx}`}
                    className={`flex flex-col items-center justify-center text-[10px] font-mono py-1 rounded-t transition-colors ${
                      isPlayhead
                        ? 'bg-amber-500/30 text-amber-300 font-black'
                        : isMeasureStart
                        ? 'bg-cyan-950/40 text-cyan-300 font-bold border-l-2 border-cyan-500/40'
                        : isDownbeat
                        ? 'text-slate-300 font-bold'
                        : 'text-slate-600'
                    }`}
                  >
                    {isMeasureStart && (
                      <span className="text-[8px] text-cyan-400 font-mono tracking-tighter">
                        C{measureNum}
                      </span>
                    )}
                    <span>{subLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* String Rows */}
          {tracks.map((track, sIdx) => {
            return (
              <div key={`track-row-${sIdx}`} className="flex items-center group/row">
                {/* String Label Box */}
                <div className="w-20 shrink-0 flex items-center justify-between pr-3 pl-1 py-1 text-xs font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-md bg-slate-900 border border-white/10 flex items-center justify-center text-cyan-400 font-bold">
                      {track.stringName}
                    </span>
                    <span className="text-[10px] text-slate-500">{track.basePitch}</span>
                  </span>
                </div>

                {/* 16-Step Row Grid */}
                <div
                  className="flex-1 grid gap-1 relative"
                  style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(40px, 1fr))` }}
                >
                  {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                    const stepData = track.steps[stepIdx];
                    const hasNote = stepData && stepData.fret !== null;
                    const isPlayhead = isPlaying && currentStep === stepIdx;
                    const isDownbeat = stepIdx % 4 === 0;
                    const isMeasureStart = stepIdx % 16 === 0;
                    const isSelected = selectedCell?.stringIndex === sIdx && selectedCell?.stepIndex === stepIdx;

                    const noteInfo = hasNote ? calculateFretNote(track.basePitch, stepData.fret!) : null;

                    // Badge color styling
                    let cellBg = isDownbeat ? 'bg-slate-950/70' : 'bg-slate-950/40';
                    let cellBorder = 'border-white/5';
                    let textColor = 'text-slate-400';

                    if (hasNote) {
                      cellBg = 'bg-cyan-500/20';
                      cellBorder = 'border-cyan-500/50';
                      textColor = 'text-cyan-300 font-bold';
                    }

                    if (isPlayhead) {
                      cellBg = hasNote ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'bg-amber-500/20';
                      cellBorder = 'border-amber-400';
                      textColor = hasNote ? 'text-black font-extrabold' : 'text-amber-200';
                    }

                    if (isSelected) {
                      cellBorder = 'border-cyan-400 ring-2 ring-cyan-400/50';
                    }

                    return (
                      <button
                        key={`cell-${sIdx}-${stepIdx}`}
                        type="button"
                        onClick={() => handleCellClick(sIdx, stepIdx)}
                        className={`h-11 rounded-lg border flex flex-col items-center justify-center p-0.5 transition-all cursor-pointer relative ${cellBg} ${cellBorder} ${textColor} hover:border-cyan-400/60`}
                      >
                        {isMeasureStart && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cyan-500/30" />
                        )}

                        {hasNote ? (
                          <>
                            <span className="text-xs font-mono font-black tracking-tight">
                              {stepData.fret === 0 ? '0' : stepData.fret}
                            </span>
                            <div className="flex items-center gap-0.5 text-[8px] font-mono leading-none opacity-85">
                              <span>{noteInfo?.noteName}</span>
                              {stepData.articulation && stepData.articulation !== 'normal' && (
                                <span className="font-bold text-amber-400 uppercase">
                                  {stepData.articulation === 'slap'
                                    ? 'S'
                                    : stepData.articulation === 'pop'
                                    ? 'P'
                                    : stepData.articulation === 'ghost'
                                    ? 'x'
                                    : stepData.articulation === 'palmmute'
                                    ? 'PM'
                                    : stepData.articulation === 'downstroke'
                                    ? '⊓'
                                    : '∨'}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-800 opacity-60" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Editor Bar: Quick Fret & Articulation Picker for Selected Cell */}
      {selectedCell && (
        <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <span className="text-cyan-400 font-bold">Editando Paso:</span>
              <span>Cuerda {tracks[selectedCell.stringIndex]?.stringName}</span>
              <span>• Paso {selectedCell.stepIndex + 1}</span>
            </div>

            {/* Quick Fret Stepper / Input */}
            <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-lg p-1">
              <span className="text-[10px] font-mono text-slate-400 px-1">Traste:</span>
              {[0, 1, 2, 3, 5, 7, 9, 12].map((fretNum) => (
                <button
                  key={`quick-fret-${fretNum}`}
                  type="button"
                  onClick={() => {
                    setFretPickerValue(fretNum);
                    handleApplyFret(fretNum);
                  }}
                  className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    tracks[selectedCell.stringIndex]?.steps[selectedCell.stepIndex]?.fret === fretNum
                      ? 'bg-cyan-500 text-black'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {fretNum}
                </button>
              ))}

              <input
                type="number"
                min="0"
                max="24"
                value={fretPickerValue}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFretPickerValue(isNaN(val) ? 0 : val);
                  handleApplyFret(isNaN(val) ? 0 : Math.min(24, Math.max(0, val)));
                }}
                className="w-12 px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-xs font-mono text-white text-center"
              />
            </div>
          </div>

          {/* Articulations Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Articulación:</span>
            {(isBass ? BASS_ARTICULATIONS : GUITAR_ARTICULATIONS).map((art) => {
              const currentArt =
                tracks[selectedCell.stringIndex]?.steps[selectedCell.stepIndex]?.articulation || 'normal';
              const isSelected = currentArt === art.id;

              return (
                <button
                  key={art.id}
                  type="button"
                  onClick={() => handleApplyArticulation(art.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 font-bold ring-1 ring-cyan-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={art.desc}
                >
                  <span>{art.icon}</span> {art.label}
                </button>
              );
            })}

            {/* Rest / Mute Button */}
            <button
              type="button"
              onClick={() => handleApplyFret(null)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono transition-all cursor-pointer ml-2"
              title="Convertir este paso en silencio"
            >
              Silencio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
