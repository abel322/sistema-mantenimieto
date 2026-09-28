'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  InstrumentType,
  TuningId,
  FretboardOverlayMode,
  TheoryMode,
  MusicalKey,
  ScaleType,
  ChordType,
  StringTrack,
  SequencerStepCell,
} from '@/types/strings';
import {
  getInstrumentStrings,
  ActiveFretHit,
} from './InteractiveFretboard';
import InteractiveFretboard from './InteractiveFretboard';
import StringsSequencerGrid from './StringsSequencerGrid';
import StringsTransportBar from './StringsTransportBar';
import {
  stringsAudioEngine,
  calculateFretNote,
} from '@/services/audio/stringsAudioEngine';
import { Guitar, Sparkles, Music, Layers, Sliders, Volume2, Info } from 'lucide-react';

// Chromatic Root Notes
const CHROMATIC_KEYS: MusicalKey[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

// Scale Catalogue
interface ScaleDef {
  id: ScaleType;
  name: string;
  formula: string;
  recommendedFor: string;
}

const SCALE_CATALOGUE: ScaleDef[] = [
  {
    id: 'minor_pentatonic',
    name: 'Pentatónica Menor',
    formula: '1 - b3 - 4 - 5 - b7',
    recommendedFor: 'Rock, Blues, Funk & Solos',
  },
  {
    id: 'major_pentatonic',
    name: 'Pentatónica Mayor',
    formula: '1 - 2 - 3 - 5 - 6',
    recommendedFor: 'Soul, Country, R&B, Pop',
  },
  {
    id: 'blues',
    name: 'Blues (con Blue Note)',
    formula: '1 - b3 - 4 - b5 - 5 - b7',
    recommendedFor: 'Blues clásico, Chicago & Shuffle',
  },
  {
    id: 'major',
    name: 'Escala Mayor (Jónica)',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
    recommendedFor: 'Baladas, Armonía tonal clásica',
  },
  {
    id: 'minor',
    name: 'Menor Natural (Eólica)',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
    recommendedFor: 'Rock melódico, Metal, Pop',
  },
  {
    id: 'dorian',
    name: 'Dórica (Funk Groove)',
    formula: '1 - 2 - b3 - 4 - 5 - 6 - b7',
    recommendedFor: 'Líneas de Bajo Funk, Jazz Fusion',
  },
  {
    id: 'mixolydian',
    name: 'Mixolidia (Rock / Blues)',
    formula: '1 - 2 - 3 - 4 - 5 - 6 - b7',
    recommendedFor: 'Riffs con acorde dominante 7',
  },
  {
    id: 'harmonic_minor',
    name: 'Menor Armónica',
    formula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
    recommendedFor: 'Neoclásico, Flamenco & Tensión V7',
  },
];

// Chord / Arpeggio Catalogue
interface ChordDef {
  id: ChordType;
  name: string;
  formula: string;
  symbol: string;
}

const CHORD_CATALOGUE: ChordDef[] = [
  { id: 'major', name: 'Mayor Tríada', formula: '1 - 3 - 5', symbol: 'Maj' },
  { id: 'minor', name: 'Menor Tríada', formula: '1 - b3 - 5', symbol: 'm' },
  { id: 'dom7', name: 'Dominante 7', formula: '1 - 3 - 5 - b7', symbol: '7' },
  { id: 'maj7', name: 'Mayor 7 / Maj7', formula: '1 - 3 - 5 - 7', symbol: 'Δ7' },
  { id: 'm7', name: 'Menor 7', formula: '1 - b3 - 5 - b7', symbol: 'm7' },
  { id: 'm7b5', name: 'm7b5 / Semidisminuido', formula: '1 - b3 - b5 - b7', symbol: 'ø' },
  { id: 'sus4', name: 'Suspendido 4 (Sus4)', formula: '1 - 4 - 5', symbol: 'sus4' },
  { id: 'sus2', name: 'Suspendido 2 (Sus2)', formula: '1 - 2 - 5', symbol: 'sus2' },
];

// Generates blank tracks for an instrument setup
function generateInitialTracks(
  instrument: InstrumentType,
  tuning: TuningId,
  measuresCount: number
): StringTrack[] {
  const strings = getInstrumentStrings(instrument, tuning);
  const totalSteps = measuresCount * 16;

  return strings.map((str, sIdx) => ({
    stringIndex: sIdx,
    stringName: str.name,
    basePitch: str.basePitch,
    gauge: str.gauge,
    steps: Array.from({ length: totalSteps }, () => ({
      fret: null,
      articulation: 'normal',
    })),
  }));
}

export default function FretboardSequencerStudio() {
  // Instrument and Tuning
  const [instrument, setInstrument] = useState<InstrumentType>('bass_4');
  const [tuning, setTuning] = useState<TuningId>('standard');

  // Theory Toolbar State
  const [theoryMode, setTheoryMode] = useState<TheoryMode>('scale');
  const [musicalKey, setMusicalKey] = useState<MusicalKey>('E');
  const [scaleType, setScaleType] = useState<ScaleType>('minor_pentatonic');
  const [chordType, setChordType] = useState<ChordType>('major');

  // Fretboard Overlays
  const [overlayMode, setOverlayMode] = useState<FretboardOverlayMode>('notes');

  // Sequencer Settings
  const [measuresCount, setMeasuresCount] = useState<number>(2);
  const [tracks, setTracks] = useState<StringTrack[]>(() =>
    generateInitialTracks('bass_4', 'standard', 2)
  );

  // Transport State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(104);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);

  // Active glowing fret notes currently sounding
  const [activeHits, setActiveHits] = useState<ActiveFretHit[]>([]);

  // Timer Ref for playback clock
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStepRef = useRef<number>(0);
  currentStepRef.current = currentStep;

  const tracksRef = useRef<StringTrack[]>(tracks);
  tracksRef.current = tracks;

  const instrumentRef = useRef<InstrumentType>(instrument);
  instrumentRef.current = instrument;

  // Stop playback cleanly
  const stopPlayback = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
    setActiveHits([]);
    stringsAudioEngine.stopAll();
  }, []);

  // Update tracks when measures count changes
  const handleMeasuresCountChange = useCallback((newCount: number) => {
    setMeasuresCount(newCount);
    const newTotalSteps = newCount * 16;

    setTracks((prev) =>
      prev.map((track) => {
        const nextSteps: SequencerStepCell[] = [];
        for (let i = 0; i < newTotalSteps; i++) {
          nextSteps.push(
            track.steps[i] || {
              fret: null,
              articulation: 'normal',
            }
          );
        }
        return {
          ...track,
          steps: nextSteps,
        };
      })
    );
  }, []);

  // Update tracks when instrument or tuning changes
  const handleInstrumentChange = useCallback((newInst: InstrumentType) => {
    setInstrument(newInst);
    setTracks(generateInitialTracks(newInst, tuning, measuresCount));
    stopPlayback();
  }, [tuning, measuresCount, stopPlayback]);

  const handleTuningChange = useCallback((newTuning: TuningId) => {
    setTuning(newTuning);
    setTracks(generateInitialTracks(instrument, newTuning, measuresCount));
    stopPlayback();
  }, [instrument, measuresCount, stopPlayback]);

  // Update a single step cell
  const handleUpdateStep = useCallback((stringIdx: number, stepIdx: number, stepData: SequencerStepCell) => {
    setTracks((prev) =>
      prev.map((track, idx) => {
        if (idx !== stringIdx) return track;
        const updatedSteps = [...track.steps];
        updatedSteps[stepIdx] = stepData;
        return {
          ...track,
          steps: updatedSteps,
        };
      })
    );

    // If fret was set, audition note immediately
    if (stepData.fret !== null) {
      const track = tracksRef.current[stringIdx];
      if (track) {
        const note = calculateFretNote(track.basePitch, stepData.fret);
        stringsAudioEngine.playNote(instrumentRef.current, note.fullNote, stepData.articulation || 'normal');
      }
    }
  }, []);

  // Clear all grid notes
  const handleClearGrid = useCallback(() => {
    setTracks((prev) =>
      prev.map((track) => ({
        ...track,
        steps: track.steps.map(() => ({ fret: null, articulation: 'normal' })),
      }))
    );
    setActiveHits([]);
  }, []);

  // Playhead Clock Trigger
  const triggerStep = useCallback((stepIdx: number) => {
    const currentTracks = tracksRef.current;
    const currentInst = instrumentRef.current;
    const hitsThisStep: ActiveFretHit[] = [];

    currentTracks.forEach((track, sIdx) => {
      const cell = track.steps[stepIdx];
      if (cell && cell.fret !== null) {
        const noteInfo = calculateFretNote(track.basePitch, cell.fret);
        stringsAudioEngine.playNote(
          currentInst,
          noteInfo.fullNote,
          cell.articulation || 'normal',
          '16n'
        );

        hitsThisStep.push({
          stringIndex: sIdx,
          fret: cell.fret,
          articulation: cell.articulation,
        });
      }
    });

    setActiveHits(hitsThisStep);
  }, []);

  // Playback Loop Runner
  const togglePlay = useCallback(async () => {
    await stringsAudioEngine.ensureStarted();

    if (isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsPlaying(false);
      setActiveHits([]);
      stringsAudioEngine.stopAll();
      return;
    }

    setIsPlaying(true);
    const totalSteps = measuresCount * 16;
    const stepDurationMs = (60000 / bpm) / 4;

    triggerStep(currentStepRef.current);

    timerRef.current = setInterval(() => {
      let nextStep = currentStepRef.current + 1;
      if (nextStep >= totalSteps) {
        if (!isLoop) {
          stopPlayback();
          return;
        }
        nextStep = 0;
      }

      currentStepRef.current = nextStep;
      setCurrentStep(nextStep);
      triggerStep(nextStep);
    }, stepDurationMs);
  }, [isPlaying, measuresCount, bpm, isLoop, triggerStep, stopPlayback]);

  // Handle BPM live changes during playback
  useEffect(() => {
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      const totalSteps = measuresCount * 16;
      const stepDurationMs = (60000 / bpm) / 4;

      timerRef.current = setInterval(() => {
        let nextStep = currentStepRef.current + 1;
        if (nextStep >= totalSteps) {
          if (!isLoop) {
            stopPlayback();
            return;
          }
          nextStep = 0;
        }

        currentStepRef.current = nextStep;
        setCurrentStep(nextStep);
        triggerStep(nextStep);
      }, stepDurationMs);
    }
  }, [bpm, isPlaying, measuresCount, isLoop, triggerStep, stopPlayback]);

  // Volume slider update
  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    stringsAudioEngine.setVolume(vol);
  };

  // Load Presets
  const handleLoadPreset = (presetId: string) => {
    stopPlayback();

    if (presetId === 'bass_slap_funk') {
      setInstrument('bass_4');
      setBpm(108);
      setMeasuresCount(1);
      setMusicalKey('E');
      setTheoryMode('scale');
      setScaleType('dorian');
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      newTracks[3].steps[0] = { fret: 0, articulation: 'slap' }; // E0 slap
      newTracks[1].steps[2] = { fret: 2, articulation: 'ghost' }; // Ghost
      newTracks[0].steps[3] = { fret: 0, articulation: 'pop' }; // G pop
      newTracks[3].steps[6] = { fret: 3, articulation: 'slap' }; // G slap
      newTracks[0].steps[7] = { fret: 5, articulation: 'pop' }; // C pop
      newTracks[3].steps[8] = { fret: 0, articulation: 'slap' }; // E slap
      newTracks[2].steps[10] = { fret: 5, articulation: 'slap' }; // D slap
      newTracks[0].steps[11] = { fret: 7, articulation: 'pop' }; // D pop
      newTracks[3].steps[14] = { fret: 5, articulation: 'slap' }; // A slap
      setTracks(newTracks);
    } else if (presetId === 'bass_walking_jazz') {
      setInstrument('bass_4');
      setBpm(120);
      setMeasuresCount(1);
      setMusicalKey('E');
      setTheoryMode('chord');
      setChordType('dom7');
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      newTracks[3].steps[0] = { fret: 0, articulation: 'normal' }; // E
      newTracks[3].steps[4] = { fret: 4, articulation: 'normal' }; // G#
      newTracks[2].steps[8] = { fret: 2, articulation: 'normal' }; // B
      newTracks[1].steps[12] = { fret: 0, articulation: 'normal' }; // D
      setTracks(newTracks);
    } else if (presetId === 'bass_rock_pump') {
      setInstrument('bass_4');
      setBpm(130);
      setMeasuresCount(1);
      setMusicalKey('A');
      setTheoryMode('scale');
      setScaleType('minor_pentatonic');
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      for (let i = 0; i < 16; i += 2) {
        newTracks[2].steps[i] = { fret: 0, articulation: 'normal' }; // A 8th notes
      }
      newTracks[2].steps[14] = { fret: 3, articulation: 'normal' }; // C
      setTracks(newTracks);
    } else if (presetId === 'bass_disco_octaves') {
      setInstrument('bass_4');
      setBpm(118);
      setMeasuresCount(1);
      setMusicalKey('A');
      setTheoryMode('scale');
      setScaleType('dorian');
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      for (let i = 0; i < 16; i += 4) {
        newTracks[3].steps[i] = { fret: 5, articulation: 'normal' }; // A1
        newTracks[1].steps[i + 2] = { fret: 7, articulation: 'normal' }; // A2
      }
      setTracks(newTracks);
    } else if (presetId === 'guitar_neo_soul') {
      setInstrument('guitar_6');
      setBpm(84);
      setMeasuresCount(1);
      setMusicalKey('E');
      setTheoryMode('chord');
      setChordType('maj7');
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      newTracks[5].steps[0] = { fret: 0, articulation: 'downstroke' }; // E2
      newTracks[3].steps[2] = { fret: 4, articulation: 'downstroke' }; // F#3
      newTracks[2].steps[4] = { fret: 4, articulation: 'downstroke' }; // B3
      newTracks[1].steps[6] = { fret: 4, articulation: 'downstroke' }; // D#4
      newTracks[0].steps[8] = { fret: 2, articulation: 'upstroke' }; // F#4
      newTracks[1].steps[10] = { fret: 4, articulation: 'downstroke' };
      newTracks[2].steps[12] = { fret: 4, articulation: 'downstroke' };
      newTracks[3].steps[14] = { fret: 4, articulation: 'downstroke' };
      setTracks(newTracks);
    } else if (presetId === 'guitar_metal_chug') {
      setInstrument('guitar_6');
      setBpm(140);
      setMeasuresCount(1);
      setMusicalKey('E');
      setTheoryMode('scale');
      setScaleType('minor_pentatonic');
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      for (let i = 0; i < 16; i++) {
        if (i === 6 || i === 14) {
          newTracks[5].steps[i] = { fret: 3, articulation: 'downstroke' };
          newTracks[4].steps[i] = { fret: 5, articulation: 'downstroke' };
        } else {
          newTracks[5].steps[i] = { fret: 0, articulation: 'palmmute' };
        }
      }
      setTracks(newTracks);
    } else if (presetId === 'guitar_funk_chops') {
      setInstrument('guitar_6');
      setBpm(105);
      setMeasuresCount(1);
      setMusicalKey('D');
      setTheoryMode('chord');
      setChordType('dom7');
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      [0, 3, 6, 8, 11, 14].forEach((s) => {
        newTracks[0].steps[s] = { fret: 7, articulation: s % 2 === 0 ? 'downstroke' : 'upstroke' };
        newTracks[1].steps[s] = { fret: 8, articulation: s % 2 === 0 ? 'downstroke' : 'upstroke' };
        newTracks[2].steps[s] = { fret: 7, articulation: s % 2 === 0 ? 'downstroke' : 'upstroke' };
      });
      setTracks(newTracks);
    } else if (presetId === 'guitar_indie_riff') {
      setInstrument('guitar_6');
      setBpm(116);
      setMeasuresCount(1);
      setMusicalKey('A');
      setTheoryMode('scale');
      setScaleType('major');
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      newTracks[0].steps[0] = { fret: 7, articulation: 'downstroke' };
      newTracks[1].steps[2] = { fret: 8, articulation: 'downstroke' };
      newTracks[0].steps[4] = { fret: 5, articulation: 'upstroke' };
      newTracks[1].steps[6] = { fret: 8, articulation: 'downstroke' };
      newTracks[2].steps[8] = { fret: 7, articulation: 'downstroke' };
      newTracks[1].steps[10] = { fret: 8, articulation: 'downstroke' };
      newTracks[0].steps[12] = { fret: 7, articulation: 'downstroke' };
      newTracks[0].steps[14] = { fret: 10, articulation: 'downstroke' };
      setTracks(newTracks);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stringsAudioEngine.stopAll();
    };
  }, []);

  // Summary label for current active theory selection
  const currentTheorySummary = React.useMemo(() => {
    if (theoryMode === 'free') {
      return 'Modo Libre • Visualizando todas las posiciones del mástil';
    }
    if (theoryMode === 'scale') {
      const sc = SCALE_CATALOGUE.find((s) => s.id === scaleType);
      return `Tónica ${musicalKey} • ${sc?.name || 'Escala'} (${sc?.formula || ''}) • ${sc?.recommendedFor || ''}`;
    }
    const ch = CHORD_CATALOGUE.find((c) => c.id === chordType);
    return `Tónica ${musicalKey} • Arpegio ${ch?.name || 'Acorde'} [${musicalKey}${ch?.symbol || ''}] (${ch?.formula || ''})`;
  }, [theoryMode, musicalKey, scaleType, chordType]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Studio Header Card */}
      <div className="w-full bg-[#0E1526]/80 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0">
            <Guitar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                SONORA STRINGS LAB
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                Bajo & Guitarra 2.0
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Diapasón de Palisandro & Secuenciador Armónico
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Madera cálida realista con iluminación reactiva de Tónica (Oro), Escalas y Arpegios (Cyan Neón)
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isPlaying ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
            }`}
          />
          <span className="text-slate-300 font-bold">
            {isPlaying ? `Tocando Paso ${currentStep + 1}/${measuresCount * 16}` : 'Estudio Listo'}
          </span>
        </div>
      </div>

      {/* 1. Barra de Transporte */}
      <StringsTransportBar
        isPlaying={isPlaying}
        bpm={bpm}
        isLoop={isLoop}
        measuresCount={measuresCount}
        instrument={instrument}
        tuning={tuning}
        overlayMode={overlayMode}
        volume={volume}
        onTogglePlay={togglePlay}
        onStop={stopPlayback}
        onBpmChange={setBpm}
        onToggleLoop={() => setIsLoop((prev) => !prev)}
        onMeasuresCountChange={handleMeasuresCountChange}
        onInstrumentChange={handleInstrumentChange}
        onTuningChange={handleTuningChange}
        onOverlayModeChange={setOverlayMode}
        onVolumeChange={handleVolumeChange}
      />

      {/* 2. Barra de Teoría & Armonía (Root, Modos, Escalas y Arpegios) */}
      <div className="w-full bg-[#0E1526]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl">
        {/* Header & Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Teoría & Armonía Aplicada al Mástil
              </h3>
              <p className="text-xs text-slate-400">
                Filtra notas al instante: resalta tónica dorada y grados de la escala o arpegio
              </p>
            </div>
          </div>

          {/* Mode Toggle Buttons: [Modo Libre] | [Escalas] | [Acordes & Arpegios] */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setTheoryMode('free')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                theoryMode === 'free'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Modo Libre
            </button>
            <button
              type="button"
              onClick={() => setTheoryMode('scale')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                theoryMode === 'scale'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Escalas ({SCALE_CATALOGUE.length})
            </button>
            <button
              type="button"
              onClick={() => setTheoryMode('chord')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                theoryMode === 'chord'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acordes & Arpegios ({CHORD_CATALOGUE.length})
            </button>
          </div>
        </div>

        {/* 1. Selector de Tónica (12 chips cromáticos) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Tónica (Root Note):
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {CHROMATIC_KEYS.map((k) => (
              <button
                key={`key-chip-${k}`}
                type="button"
                onClick={() => setMusicalKey(k)}
                className={`w-8 h-8 rounded-lg font-mono font-black text-xs transition-all cursor-pointer ${
                  musicalKey === k
                    ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105'
                    : 'bg-black/50 border border-white/10 text-slate-300 hover:border-amber-400/40 hover:text-white'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Catálogo de Escalas (si está en Escalas) */}
        {theoryMode === 'scale' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Catálogo de Escalas:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SCALE_CATALOGUE.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setScaleType(sc.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                    scaleType === sc.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="font-bold text-xs text-white">{sc.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400/80">{sc.formula}</span>
                  <span className="text-[9px] text-slate-400 line-clamp-1">{sc.recommendedFor}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Catálogo de Acordes & Arpegios (si está en Acordes) */}
        {theoryMode === 'chord' && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              Catálogo de Acordes & Arpegios:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHORD_CATALOGUE.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChordType(ch.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-0.5 ${
                    chordType === ch.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                      : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{ch.name}</span>
                    <span className="text-[10px] font-mono font-bold text-amber-400">{musicalKey}{ch.symbol}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{ch.formula}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Diapasón Interactivo de Palisandro */}
      <div className="w-full bg-[#0E1526]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Diapasón de Palisandro Calibrado (Trastes 0 al 24)
            </h3>
            <span className="text-xs text-slate-400 hidden sm:inline">
              • Haz clic en cualquier traste para audicionar
            </span>
          </div>

          {/* Theory Legend & Indicators */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-black font-extrabold flex items-center justify-center text-[9px]">
                R
              </span>
              <span>Tónica (Oro)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 text-white font-bold flex items-center justify-center text-[9px]">
                •
              </span>
              <span>Escala / Acorde</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-sky-400 animate-ping inline-block" />
              <span>Secuenciador</span>
            </span>
          </div>
        </div>

        {/* Current Active Selection Summary Banner */}
        <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-semibold text-cyan-300">{currentTheorySummary}</span>
        </div>

        <InteractiveFretboard
          instrument={instrument}
          tuning={tuning}
          overlayMode={overlayMode}
          theoryMode={theoryMode}
          musicalKey={musicalKey}
          scaleType={scaleType}
          chordType={chordType}
          activeHits={activeHits}
          onFretClick={(sIdx, fret) => {
            // Audition handled internally by InteractiveFretboard
          }}
        />
      </div>

      {/* 4. Secuenciador por Pasos & Tablatura */}
      <StringsSequencerGrid
        instrument={instrument}
        tracks={tracks}
        measuresCount={measuresCount}
        currentStep={currentStep}
        isPlaying={isPlaying}
        onUpdateStep={handleUpdateStep}
        onClearGrid={handleClearGrid}
        onLoadPreset={handleLoadPreset}
      />
    </div>
  );
}
