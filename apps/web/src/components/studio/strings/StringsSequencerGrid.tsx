'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  InstrumentType,
  StringTrack,
  StringArticulation,
  SequencerStepCell,
  BassArticulation,
  GuitarArticulation,
} from '@/types/strings';
import {
  Sliders,
  Trash2,
  Music2,
  ChevronRight,
  Sparkles,
  FileText,
  Rocket,
} from 'lucide-react';
import { calculateFretNote } from '@/services/audio/stringsAudioEngine';
import StringsRunwayView from './StringsRunwayView';
import { ActiveFretHit } from './InteractiveFretboard';

interface StringsSequencerGridProps {
  instrument: InstrumentType;
  tracks: StringTrack[];
  measuresCount: number;
  currentStep: number;
  isPlaying: boolean;
  bpm?: number;
  activeHits?: ActiveFretHit[];
  onUpdateStep: (stringIndex: number, stepIndex: number, stepData: SequencerStepCell) => void;
  onClearGrid: () => void;
  onLoadPreset: (presetId: string) => void;
}

const BASS_ARTICULATIONS: { id: BassArticulation; label: string; icon: string; desc: string }[] = [
  { id: 'normal', label: 'Normal', icon: '•', desc: 'Dedo / Púa normal' },
  { id: 'slap', label: 'Slap', icon: 'S', desc: 'Pulgar percutido (Thumb Slap)' },
  { id: 'pop', label: 'Pop', icon: 'P', desc: 'Jalón índice/medio (Popping)' },
  { id: 'ghost', label: 'Ghost', icon: 'x', desc: 'Nota muerta percusiva' },
];

const GUITAR_ARTICULATIONS: { id: GuitarArticulation; label: string; icon: string; desc: string }[] = [
  { id: 'normal', label: 'Normal', icon: '•', desc: 'Pulsación libre' },
  { id: 'downstroke', label: 'Down', icon: '⊓', desc: 'Púa hacia abajo (Downstroke)' },
  { id: 'upstroke', label: 'Up', icon: '∨', desc: 'Púa hacia arriba (Upstroke)' },
  { id: 'palmmute', label: 'P.M.', icon: 'P.M.', desc: 'Palm Mute amortiguado' },
];

export default function StringsSequencerGrid({
  instrument,
  tracks,
  measuresCount,
  currentStep,
  isPlaying,
  bpm = 104,
  activeHits = [],
  onUpdateStep,
  onClearGrid,
  onLoadPreset,
}: StringsSequencerGridProps) {
  const isBass = instrument.startsWith('bass');
  const totalSteps = measuresCount * 16;
  const numStrings = tracks.length;

  // View Mode: Classic TAB Stave vs Dynamic Runway Mode
  const [viewMode, setViewMode] = useState<'classic' | 'runway'>('classic');
  const [runwayZoom, setRunwayZoom] = useState<1 | 2 | 4>(2);

  const [selectedCell, setSelectedCell] = useState<{ stringIndex: number; stepIndex: number } | null>(null);
  const [fretPickerValue, setFretPickerValue] = useState<number>(0);

  // Step width in pixels
  const stepWidth = 42;
  const clefWidth = 76;
  const gridTotalWidth = clefWidth + totalSteps * stepWidth + 24;

  // Presets
  const presets = isBass
    ? [
        { id: 'bass_slap_funk', name: 'Funk Slap & Pop' },
        { id: 'bass_walking_jazz', name: 'Walking Jazz Line' },
        { id: 'bass_rock_pump', name: 'Rock 8th Note Pump' },
        { id: 'bass_disco_octaves', name: 'Disco Octaves' },
      ]
    : [
        { id: 'guitar_neo_soul', name: 'Neo-Soul Clean Arp' },
        { id: 'guitar_metal_chug', name: 'Metal Palm Mute Chug' },
        { id: 'guitar_funk_chops', name: 'Funk 16th Stabs' },
        { id: 'guitar_indie_riff', name: 'Indie Pop Melodic Riff' },
      ];

  // Handle cell click (toggle on if empty, or select to edit)
  const handleCellClick = (sIdx: number, stepIdx: number) => {
    const track = tracks[sIdx];
    const currentCell = track?.steps[stepIdx];

    if (!currentCell || currentCell.fret === null) {
      // Toggle ON with fret 0 (open string) or current picker value
      onUpdateStep(sIdx, stepIdx, {
        fret: 0,
        articulation: 'normal',
      });
      setSelectedCell({ stringIndex: sIdx, stepIndex: stepIdx });
      setFretPickerValue(0);
    } else {
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

  // Keyboard navigation & direct fret typing support (0-24, Delete, Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const { stringIndex, stepIndex } = selectedCell;

      // Ignore if user is typing in an input element
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        const num = parseInt(e.key, 10);
        handleApplyFret(num);
        setFretPickerValue(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key.toLowerCase() === 'x') {
        handleApplyFret(null);
      } else if (e.key === 'ArrowRight') {
        const nextStep = (stepIndex + 1) % totalSteps;
        setSelectedCell({ stringIndex, stepIndex: nextStep });
      } else if (e.key === 'ArrowLeft') {
        const prevStep = (stepIndex - 1 + totalSteps) % totalSteps;
        setSelectedCell({ stringIndex, stepIndex: prevStep });
      } else if (e.key === 'ArrowUp') {
        const prevStr = Math.max(0, stringIndex - 1);
        setSelectedCell({ stringIndex: prevStr, stepIndex });
      } else if (e.key === 'ArrowDown') {
        const nextStr = Math.min(numStrings - 1, stringIndex + 1);
        setSelectedCell({ stringIndex: nextStr, stepIndex });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, totalSteps, numStrings]);

  return (
    <div className="w-full bg-[#0A0E17] border border-white/10 rounded-2xl p-5 shadow-2xl overflow-x-auto flex flex-col gap-4">
      {/* 1. Header Bar: View Mode Toggle, Zoom, Riff Presets & Clean Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Music2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Tablatura de Estudio (Guitar & Bass TAB)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {measuresCount} {measuresCount === 1 ? 'Compás' : 'Compases'} • 16th Notes
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {viewMode === 'classic'
                  ? 'Notación profesional con números de traste posados en cuerda, divisiones de compás y métrica'
                  : 'Pista continua de desplazamiento en tiempo real con línea de impacto al 18%'}
              </p>
            </div>
          </div>

          {/* TOGGLE DE VISTA: [ 📄 Tablatura Clásica ] | [ 🚀 Modo Runway ] */}
          <div className="flex items-center bg-black/60 border border-white/10 p-0.5 rounded-xl ml-0 sm:ml-2">
            <button
              type="button"
              onClick={() => setViewMode('classic')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'classic'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tablatura Clásica</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('runway')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'runway'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>Modo Runway</span>
            </button>
          </div>

          {/* SELECTOR DE ZOOM DE PISTA (Visible en Modo Runway) */}
          {viewMode === 'runway' && (
            <div className="flex items-center gap-1 bg-black/60 border border-white/10 p-0.5 rounded-xl text-xs font-mono animate-in fade-in">
              <span className="text-[10px] text-slate-400 px-2 uppercase font-bold">Zoom:</span>
              <button
                type="button"
                onClick={() => setRunwayZoom(1)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  runwayZoom === 1
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1 Compás
              </button>
              <button
                type="button"
                onClick={() => setRunwayZoom(2)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  runwayZoom === 2
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2 Compases
              </button>
              <button
                type="button"
                onClick={() => setRunwayZoom(4)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  runwayZoom === 4
                    ? 'bg-cyan-500/25 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                4 Compases
              </button>
            </div>
          )}
        </div>

        {/* Preset Selector Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Riffs / Presets:</span>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onLoadPreset(p.id)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-xs font-mono transition-all cursor-pointer"
            >
              {p.name}
            </button>
          ))}

          <button
            type="button"
            onClick={onClearGrid}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs transition-all cursor-pointer ml-1"
            title="Limpiar todas las notas de la tablatura"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. VISTA CONDICIONAL: TABLATURA CLÁSICA O MODO RUNWAY */}
      {viewMode === 'classic' ? (
        <div className="w-full overflow-x-auto custom-scrollbar pb-3 select-none">
          <div style={{ minWidth: `${gridTotalWidth}px` }} className="flex flex-col relative py-2">
          {/* Fila superior de compás y subdivisiones (Regla de tiempos horizontal) */}
          <div className="flex flex-row items-center w-full mb-2 select-none border-b border-white/5 pb-1">
            {/* Espaciador de Clave TAB para alineación exacta con las cuerdas */}
            <div
              style={{ width: `${clefWidth}px` }}
              className="shrink-0 flex items-center justify-center pr-2 font-mono text-[10px] font-bold text-slate-500 tracking-wider uppercase"
            >
              TIEMPO
            </div>

            {/* Repite por cada compás (16 pasos en horizontal) */}
            <div className="flex-1 flex flex-row">
              {Array.from({ length: measuresCount }).map((_, mIdx) => (
                <div
                  key={`measure-head-${mIdx}`}
                  style={{ width: `${16 * stepWidth}px` }}
                  className="shrink-0 flex flex-row items-center border-r-2 border-slate-400/90 relative pt-1"
                >
                  {/* Etiqueta discreta de compás */}
                  <span className="absolute -top-3 left-1 text-[9px] font-mono font-bold text-amber-400/80 select-none">
                    COMPÁS {mIdx + 1}
                  </span>

                  {/* 16 subdivisiones horizontales: | 1 e & a | 2 e & a | 3 e & a | 4 e & a | */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(16, ${stepWidth}px)`,
                    }}
                    className="grid grid-cols-16 flex-1 text-center font-mono text-[11px]"
                  >
                    {Array.from({ length: 16 }).map((_, stepInMeasure) => {
                      const globalStep = mIdx * 16 + stepInMeasure;
                      const beatNum = Math.floor(stepInMeasure / 4) + 1;
                      const subIdx = stepInMeasure % 4;
                      const isDownbeat = subIdx === 0;
                      const isPlayhead = isPlaying && currentStep === globalStep;

                      let subLabel = 'a';
                      let colorClass = 'text-slate-500';

                      if (isDownbeat) {
                        subLabel = `${beatNum}`;
                        colorClass = beatNum === 1 ? 'text-amber-400 font-bold' : 'text-slate-200 font-bold';
                      } else if (subIdx === 1) {
                        subLabel = 'e';
                      } else if (subIdx === 2) {
                        subLabel = '&';
                      }

                      return (
                        <span
                          key={`beat-col-${globalStep}`}
                          style={{ width: `${stepWidth}px` }}
                          className={`inline-flex items-center justify-center h-6 select-none transition-colors ${
                            isPlayhead
                              ? 'text-amber-300 font-extrabold bg-amber-500/25 rounded'
                              : colorClass
                          }`}
                        >
                          {subLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TAB Stave Body: TAB Clef on Left + Horizontal String Lines */}
          <div className="flex relative bg-slate-950/40 rounded-xl border border-white/5 py-1">
            {/* Clave TAB Clásica Vertical a la Izquierda */}
            <div
              style={{ width: `${clefWidth}px` }}
              className="shrink-0 flex items-stretch border-r-2 border-slate-600 bg-slate-950/80 rounded-l-xl pr-2.5 pl-3 py-2"
            >
              {/* Giant Stacked T A B letters */}
              <div className="w-7 flex flex-col justify-around items-center font-extrabold text-slate-400 text-lg tracking-widest font-serif border-r border-slate-700/60 pr-1.5 select-none">
                <span>T</span>
                <span>A</span>
                <span>B</span>
              </div>

              {/* String Pitch Tuning Names */}
              <div className="flex-1 flex flex-col justify-around items-center pl-2 font-mono font-bold text-xs">
                {tracks.map((track, sIdx) => (
                  <span
                    key={`string-head-label-${sIdx}`}
                    className="text-slate-300 hover:text-cyan-300 transition-colors"
                    title={`Cuerda ${track.stringName} (${track.basePitch})`}
                  >
                    {track.stringName}
                  </span>
                ))}
              </div>
            </div>

            {/* TAB Staff Grid */}
            <div className="flex-1 flex flex-col justify-around relative">
              {/* Playhead Vertical Line */}
              {isPlaying && (
                <div
                  style={{
                    left: `${currentStep * stepWidth + stepWidth / 2}px`,
                  }}
                  className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-500 shadow-[0_0_14px_rgba(251,191,36,1)] z-30 pointer-events-none transition-all duration-75"
                >
                  <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -ml-1 -mt-1 shadow" />
                </div>
              )}

              {/* String Rows */}
              {tracks.map((track, sIdx) => {
                return (
                  <div
                    key={`tab-string-row-${sIdx}`}
                    className="h-10 sm:h-11 flex items-center relative group/row"
                  >
                    {/* Continuous Metallic String Horizontal Line that runs across entire staff */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-slate-700/80 pointer-events-none group-hover/row:bg-slate-600 transition-colors" />

                    {/* Step Slots across all measures */}
                    <div className="flex-1 flex h-full">
                      {Array.from({ length: measuresCount }).map((_, mIdx) => {
                        return (
                          <div
                            key={`measure-body-${sIdx}-${mIdx}`}
                            style={{ width: `${16 * stepWidth}px` }}
                            className="flex h-full relative border-r-2 border-slate-400/90"
                          >
                            {Array.from({ length: 16 }).map((_, stepInMeasure) => {
                              const stepIdx = mIdx * 16 + stepInMeasure;
                              const stepData = track.steps[stepIdx];
                              const hasNote = stepData && stepData.fret !== null;
                              const isPlayhead = isPlaying && currentStep === stepIdx;
                              const isSelected =
                                selectedCell?.stringIndex === sIdx &&
                                selectedCell?.stepIndex === stepIdx;
                              const noteInfo = hasNote
                                ? calculateFretNote(track.basePitch, stepData.fret!)
                                : null;

                              return (
                                <div
                                  key={`tab-cell-${sIdx}-${stepIdx}`}
                                  style={{ width: `${stepWidth}px` }}
                                  className="h-full flex items-center justify-center relative cursor-pointer group/step"
                                  onClick={() => handleCellClick(sIdx, stepIdx)}
                                >
                                  {/* Empty Step Hover Placeholder */}
                                  {!hasNote && (
                                    <div className="w-5 h-5 rounded-full border border-dashed border-slate-600/60 opacity-0 group-hover/step:opacity-100 bg-[#0A0E17] flex items-center justify-center text-[10px] text-slate-400 transition-all z-10 shadow-sm">
                                      +
                                    </div>
                                  )}

                                  {/* Active Fret Number directly seated on the string */}
                                  {hasNote && (
                                    <div
                                      className={`relative z-10 flex flex-col items-center justify-center transition-all ${
                                        isPlayhead
                                          ? 'scale-125'
                                          : 'group-hover/step:scale-110'
                                      }`}
                                    >
                                      {/* Dark circular pill that cleanly cuts the string line behind the number */}
                                      <div
                                        className={`px-1.5 min-w-[24px] h-6 rounded-full flex items-center justify-center font-mono font-bold text-sm sm:text-base bg-[#0A0E17] border transition-all ${
                                          isPlayhead
                                            ? 'border-amber-300 text-amber-200 ring-2 ring-amber-400/80 shadow-[0_0_16px_rgba(251,191,36,0.9)] scale-110'
                                            : isSelected
                                            ? 'border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                                            : 'border-amber-500/40 text-amber-300 hover:border-amber-400 shadow-sm'
                                        }`}
                                      >
                                        {stepData.fret}
                                      </div>

                                      {/* Articulation Badge underneath note if present */}
                                      {stepData.articulation && stepData.articulation !== 'normal' && (
                                        <span className="text-[9px] font-mono font-bold text-amber-400/90 leading-none mt-0.5 uppercase tracking-tighter">
                                          {stepData.articulation === 'slap'
                                            ? 'S'
                                            : stepData.articulation === 'pop'
                                            ? 'P'
                                            : stepData.articulation === 'ghost'
                                            ? 'x'
                                            : stepData.articulation === 'palmmute'
                                            ? 'P.M.'
                                            : stepData.articulation === 'downstroke'
                                            ? '⊓'
                                            : '∨'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <StringsRunwayView
        instrument={instrument}
        tracks={tracks}
        measuresCount={measuresCount}
        currentStep={currentStep}
        isPlaying={isPlaying}
        bpm={bpm}
        zoom={runwayZoom}
        activeHits={activeHits}
        selectedCell={selectedCell}
        onSelectCell={setSelectedCell}
        onUpdateStep={onUpdateStep}
      />
    )}

      {/* 3. Barra de Edición Rápida de Traste & Articulación para el Paso Seleccionado */}
      {selectedCell && (
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <span className="text-amber-400 font-bold">Editando Nota:</span>
              <span>Cuerda {tracks[selectedCell.stringIndex]?.stringName}</span>
              <span>• Paso {selectedCell.stepIndex + 1}</span>
            </div>

            {/* Quick Fret Picker Stepper */}
            <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-lg p-1">
              <span className="text-[10px] font-mono text-slate-400 px-1">Traste:</span>
              {[0, 1, 2, 3, 4, 5, 7, 9, 12, 14, 17].map((fretNum) => (
                <button
                  key={`quick-fret-${fretNum}`}
                  type="button"
                  onClick={() => {
                    setFretPickerValue(fretNum);
                    handleApplyFret(fretNum);
                  }}
                  className={`w-6 h-6 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    tracks[selectedCell.stringIndex]?.steps[selectedCell.stepIndex]?.fret === fretNum
                      ? 'bg-amber-400 text-black shadow-sm font-black'
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
                className="w-12 px-1.5 py-0.5 rounded bg-black/80 border border-white/20 text-xs font-mono text-amber-300 font-bold text-center focus:outline-none focus:border-amber-400"
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
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                  title={art.desc}
                >
                  <span>{art.icon}</span> {art.label}
                </button>
              );
            })}

            {/* Mute / Silencio Button */}
            <button
              type="button"
              onClick={() => handleApplyFret(null)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono transition-all cursor-pointer ml-2"
              title="Borrar nota (convertir en silencio)"
            >
              Silencio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
