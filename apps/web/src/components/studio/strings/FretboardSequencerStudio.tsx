'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  InstrumentType,
  TuningId,
  FretboardOverlayMode,
  TheoryMode,
  MusicalKey,
  ScaleType,
  ArpeggioType,
  ChordVoicingType,
  VoicingShapeId,
  StringTrack,
  SequencerStepCell,
  PracticePattern,
  PracticeSubdivision,
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
import {
  CHROMATIC_KEYS,
  CHROMATIC_INDEX,
  SCALE_CATALOGUE,
  ARPEGGIO_CATALOGUE,
  CHORD_TYPE_OPTIONS,
  VOICING_SHAPE_OPTIONS,
  getChordVoicing,
} from '@/services/audio/stringsTheoryEngine';
import { Guitar, Sparkles, Music, Layers, Volume2, Info, Play, Radio, Rocket } from 'lucide-react';

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

// Generates intelligent default musical tracks (Tríada Menor de Mi / E Minor Arpeggio en corcheas)
function generateDefaultMusicalTracks(
  instrument: InstrumentType,
  tuning: TuningId,
  measuresCount: number
): StringTrack[] {
  const baseTracks = generateInitialTracks(instrument, tuning, measuresCount);

  if (instrument === 'guitar_6' && tuning === 'standard') {
    // Tríada Menor de Mi (E Minor Arpeggio) en corcheas a lo largo de 2 compases
    const notes = [
      // Compás 1: Ascendente (E2, G2, B2, E3, G3, B3, E4, G4)
      { s: 5, f: 0, step: 0 },
      { s: 5, f: 3, step: 2 },
      { s: 4, f: 2, step: 4 },
      { s: 3, f: 2, step: 6 },
      { s: 2, f: 0, step: 8 },
      { s: 1, f: 0, step: 10 },
      { s: 0, f: 0, step: 12 },
      { s: 0, f: 3, step: 14 },
      // Compás 2: Descendente y resolución en tónica
      { s: 0, f: 0, step: 16 },
      { s: 1, f: 0, step: 18 },
      { s: 2, f: 0, step: 20 },
      { s: 3, f: 2, step: 22 },
      { s: 4, f: 2, step: 24 },
      { s: 5, f: 3, step: 26 },
      { s: 5, f: 0, step: 28 },
      { s: 5, f: 0, step: 30 },
    ];
    notes.forEach(({ s, f, step }) => {
      if (baseTracks[s]?.steps[step]) {
        baseTracks[s].steps[step] = { fret: f, articulation: 'normal' };
      }
    });
  } else if (instrument.startsWith('bass')) {
    // Bajo Eléctrico: Tríada Menor de Mi (E1, G1, B1, E2, G2, B2...)
    const notes = [
      { s: 3, f: 0, step: 0 },
      { s: 3, f: 3, step: 2 },
      { s: 2, f: 2, step: 4 },
      { s: 1, f: 2, step: 6 },
      { s: 0, f: 0, step: 8 },
      { s: 0, f: 4, step: 10 },
      { s: 1, f: 2, step: 12 },
      { s: 2, f: 2, step: 14 },
      { s: 3, f: 3, step: 16 },
      { s: 3, f: 0, step: 18 },
      { s: 3, f: 0, step: 20 },
      { s: 2, f: 2, step: 22 },
      { s: 3, f: 3, step: 24 },
      { s: 3, f: 0, step: 26 },
      { s: 3, f: 0, step: 28 },
      { s: 3, f: 0, step: 30 },
    ];
    notes.forEach(({ s, f, step }) => {
      if (baseTracks[s]?.steps[step]) {
        baseTracks[s].steps[step] = { fret: f, articulation: 'normal' };
      }
    });
  }

  return baseTracks;
}

// Extrae las notas activas en el mástil respetando tónica, escala/arpegio y caja (rango)
function extractActiveFretboardNotes(
  instrument: InstrumentType,
  tuning: TuningId,
  theoryMode: TheoryMode,
  musicalKey: MusicalKey,
  scaleType: ScaleType,
  arpeggioType: ArpeggioType,
  arpeggioRange: 'all' | 'box_root' | 'box_octave',
  chordVoicingType: ChordVoicingType,
  voicingShapeId: VoicingShapeId
): { stringIndex: number; fret: number; midi: number; fullNote: string; noteName: string }[] {
  const strings = getInstrumentStrings(instrument, tuning);
  const rootIdx = CHROMATIC_INDEX[musicalKey] ?? 0;

  if (theoryMode === 'chord_voicing') {
    const voicing = getChordVoicing(instrument, musicalKey, chordVoicingType, voicingShapeId);
    const notes: { stringIndex: number; fret: number; midi: number; fullNote: string; noteName: string }[] = [];
    voicing.notes.forEach((vn) => {
      if (vn.fret !== null && strings[vn.stringIndex]) {
        const noteInfo = calculateFretNote(strings[vn.stringIndex].basePitch, vn.fret);
        notes.push({
          stringIndex: vn.stringIndex,
          fret: vn.fret,
          midi: noteInfo.midi,
          fullNote: noteInfo.fullNote,
          noteName: noteInfo.noteName,
        });
      }
    });
    return notes.sort((a, b) => a.midi - b.midi);
  }

  let semitones: number[] = [0, 4, 7];
  if (theoryMode === 'arpeggio') {
    const arpDef = ARPEGGIO_CATALOGUE.find((a) => a.id === arpeggioType) || ARPEGGIO_CATALOGUE[0];
    semitones = arpDef.semitones;
  } else if (theoryMode === 'scale') {
    const scDef =
      SCALE_CATALOGUE.find((s) => s.id === scaleType) ||
      (scaleType === 'major' ? SCALE_CATALOGUE.find((s) => s.id === 'ionian') : null) ||
      SCALE_CATALOGUE[0];
    semitones = scDef.semitones;
  }

  // Traste de tónica en la cuerda más grave
  const lowestStr = strings[strings.length - 1];
  const m = lowestStr.basePitch.match(/^([A-Ga-g][#b]?)/);
  const lowBaseIdx = CHROMATIC_INDEX[m ? m[1].toUpperCase() : 'E'] ?? 4;
  const rootFretLow = (rootIdx - lowBaseIdx + 12) % 12;

  const foundNotes: { stringIndex: number; fret: number; midi: number; fullNote: string; noteName: string }[] = [];

  // Recorrer cuerdas desde la más grave (índice N-1) hacia la más aguda (índice 0)
  for (let sIdx = strings.length - 1; sIdx >= 0; sIdx--) {
    const str = strings[sIdx];
    for (let f = 0; f <= 24; f++) {
      const noteInfo = calculateFretNote(str.basePitch, f);
      const noteDistance = (CHROMATIC_INDEX[noteInfo.noteName] - rootIdx + 12) % 12;

      if (semitones.includes(noteDistance)) {
        let inRange = true;
        if (arpeggioRange !== 'all') {
          if (arpeggioRange === 'box_root') {
            inRange = f >= Math.max(0, rootFretLow - 1) && f <= rootFretLow + 4;
          } else if (arpeggioRange === 'box_octave') {
            inRange = f >= Math.max(0, rootFretLow + 11) && f <= rootFretLow + 16;
          }
        }

        if (inRange) {
          foundNotes.push({
            stringIndex: sIdx,
            fret: f,
            midi: noteInfo.midi,
            fullNote: noteInfo.fullNote,
            noteName: noteInfo.noteName,
          });
        }
      }
    }
  }

  // Ordenar por altura tonal (pitch / MIDI) de más grave a más agudo
  foundNotes.sort((a, b) => a.midi - b.midi);

  // Filtrar notas unísonas para que la línea melódica progrese limpiamente
  const uniqueAscending: typeof foundNotes = [];
  const seenMidi = new Set<number>();
  for (const n of foundNotes) {
    if (!seenMidi.has(n.midi)) {
      seenMidi.add(n.midi);
      uniqueAscending.push(n);
    }
  }

  return uniqueAscending;
}

// Aplica el patrón melódico de práctica
function generatePatternNotes(
  sourceNotes: { stringIndex: number; fret: number; midi: number; fullNote: string; noteName: string }[],
  pattern: PracticePattern
): { stringIndex: number; fret: number; midi: number; fullNote: string; noteName: string }[] {
  if (sourceNotes.length === 0) return [];

  if (pattern === 'ascending') {
    return [...sourceNotes];
  }

  if (pattern === 'descending') {
    return [...sourceNotes].reverse();
  }

  if (pattern === 'up_down') {
    if (sourceNotes.length <= 1) return [...sourceNotes];
    return [...sourceNotes, ...sourceNotes.slice(0, -1).reverse()];
  }

  if (pattern === 'broken') {
    // Arpegio Quebrado (1-5-3-5 / Grados saltados característicos)
    if (sourceNotes.length < 3) {
      return [...sourceNotes, ...sourceNotes.slice().reverse()];
    }

    const broken: typeof sourceNotes = [];
    for (let i = 0; i < sourceNotes.length; i += 3) {
      const n1 = sourceNotes[i];
      const n3 = sourceNotes[i + 1] || sourceNotes[i];
      const n5 = sourceNotes[i + 2] || sourceNotes[i + 1] || sourceNotes[i];
      // Secuencia: Tónica (1) -> 5ta -> 3ra -> 5ta
      broken.push(n1, n5, n3, n5);
    }
    return broken;
  }

  return [...sourceNotes];
}

export default function FretboardSequencerStudio() {
  // Instrument and Tuning
  const [instrument, setInstrument] = useState<InstrumentType>('guitar_6');
  const [tuning, setTuning] = useState<TuningId>('standard');

  // Theory Toolbar: 4 Distinct Modes (Inicia en Arpegio Tríada Menor en Caja 1)
  const [theoryMode, setTheoryMode] = useState<TheoryMode>('arpeggio');
  const [musicalKey, setMusicalKey] = useState<MusicalKey>('E');

  // Mode 2: Scales State (12 scales)
  const [scaleType, setScaleType] = useState<ScaleType>('ionian');

  // Mode 3: Arpeggios State (12 arpeggios)
  const [arpeggioType, setArpeggioType] = useState<ArpeggioType>('minor_triad');
  const [arpeggioRange, setArpeggioRange] = useState<'all' | 'box_root' | 'box_octave'>('box_root');

  // Mode 4: Chord Voicings State (12 chords & 5 shapes)
  const [chordVoicingType, setChordVoicingType] = useState<ChordVoicingType>('major');
  const [voicingShapeId, setVoicingShapeId] = useState<VoicingShapeId>('open');

  // Practice Pattern & Subdivision Selector State
  const [practicePattern, setPracticePattern] = useState<PracticePattern>('up_down');
  const [subdivision, setSubdivision] = useState<PracticeSubdivision>('8n');

  // Fretboard Overlays (Etiquetas: Notas / Intervalos / Digitación)
  const [overlayMode, setOverlayMode] = useState<FretboardOverlayMode>('notes');

  // Sequencer Settings: Preset Inicial Inteligente (Tríada Menor en corcheas)
  const [measuresCount, setMeasuresCount] = useState<number>(2);
  const [tracks, setTracks] = useState<StringTrack[]>(() =>
    generateDefaultMusicalTracks('guitar_6', 'standard', 2)
  );

  // Transport State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bpm, setBpm] = useState<number>(104);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0);

  // Active glowing fret notes currently sounding
  const [activeHits, setActiveHits] = useState<ActiveFretHit[]>([]);
  // Shared active live notes state (id for auto-off timer)
  const [activeHitNotes, setActiveHitNotes] = useState<{ stringIndex: number; fret: number; id: string }[]>([]);

  // Selected cell shared between Tablatura/Runway and Fretboard (Inicia en Compás 1, Paso 0)
  const [selectedCell, setSelectedCell] = useState<{ stringIndex: number; stepIndex: number } | null>({
    stringIndex: 5,
    stepIndex: 0,
  });

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
    try {
      if (Tone.getTransport().state === 'started') {
        Tone.getTransport().stop();
        Tone.getTransport().position = 0;
      }
    } catch {}
    setIsPlaying(false);
    setCurrentStep(0);
    setActiveHits([]);
    setActiveHitNotes([]);
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
    const newHitNotes: { stringIndex: number; fret: number; id: string }[] = [];

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

        newHitNotes.push({
          stringIndex: sIdx,
          fret: cell.fret,
          id: `${sIdx}-${cell.fret}-${stepIdx}-${Date.now()}`,
        });
      }
    });

    setActiveHits(hitsThisStep);
    if (newHitNotes.length > 0) {
      setActiveHitNotes(newHitNotes);
      setTimeout(() => {
        setActiveHitNotes((prev) =>
          prev.filter((n) => !newHitNotes.some((nh) => nh.id === n.id))
        );
      }, 160);
    }
  }, []);

  // Real-time note trigger from Runway or external events
  const handleNoteTrigger = useCallback(
    ({
      stringIndex,
      fret,
      duration = '16n',
    }: {
      stringIndex: number;
      fret: number;
      duration?: string;
    }) => {
      const track = tracksRef.current[stringIndex];
      if (track) {
        const noteInfo = calculateFretNote(track.basePitch, fret);
        stringsAudioEngine.playNote(instrumentRef.current, noteInfo.fullNote, 'normal', duration);
      }

      const id = `${stringIndex}-${fret}-${Date.now()}`;
      setActiveHitNotes((prev) => [...prev, { stringIndex, fret, id }]);
      setTimeout(() => {
        setActiveHitNotes((prev) => prev.filter((n) => n.id !== id));
      }, 160);
    },
    []
  );

  // Click on wooden fretboard (Grabación Directa por Pasos: Diapasón ➔ Escribe en TAB & Auto-Advance)
  const handleFretboardClick = useCallback(
    (stringIndex: number, fret: number) => {
      // 1. Audition sound immediately with Tone.js
      const track = tracksRef.current[stringIndex];
      if (track) {
        const noteInfo = calculateFretNote(track.basePitch, fret);
        stringsAudioEngine.playNote(instrumentRef.current, noteInfo.fullNote, 'normal', '8n');
      }

      // 2. Flash neon glow on fretboard
      const triggerId = `${stringIndex}-${fret}-${Date.now()}`;
      setActiveHitNotes((prev) => [...prev, { stringIndex, fret, id: triggerId }]);
      setTimeout(() => {
        setActiveHitNotes((prev) => prev.filter((n) => n.id !== triggerId));
      }, 200);

      // 3. Registrar inmediatamente esa cuerda y ese traste en el paso actual de la tablatura
      const totalSteps = measuresCount * 16;
      const targetStep = selectedCell ? selectedCell.stepIndex : 0;

      // Update tracks: register this fret at targetStep on stringIndex and keep monophonic melodic clarity
      setTracks((prev) =>
        prev.map((t, sIdx) => {
          const nextSteps = [...t.steps];
          if (sIdx === stringIndex) {
            nextSteps[targetStep] = { fret, articulation: 'normal' };
          } else if (nextSteps[targetStep]?.fret !== null) {
            nextSteps[targetStep] = { fret: null, articulation: 'normal' };
          }
          return { ...t, steps: nextSteps };
        })
      );

      // 4. Auto-advance: El cursor de la tablatura avanza automáticamente al paso siguiente
      const nextStep = (targetStep + 1) % totalSteps;
      setSelectedCell({ stringIndex, stepIndex: nextStep });
    },
    [selectedCell, measuresCount]
  );

  // Playback Loop Runner
  const togglePlay = useCallback(async () => {
    await stringsAudioEngine.ensureStarted();

    if (isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        if (Tone.getTransport().state === 'started') {
          Tone.getTransport().stop();
          Tone.getTransport().position = 0;
        }
      } catch {}
      setIsPlaying(false);
      setActiveHits([]);
      stringsAudioEngine.stopAll();
      return;
    }

    try {
      Tone.getTransport().bpm.value = bpm;
      Tone.getTransport().position = 0;
      Tone.getTransport().start();
    } catch {}

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
    try {
      Tone.getTransport().bpm.value = bpm;
    } catch {}

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

  // -------------------------------------------------------------
  // GENERADOR AUTOMÁTICO DE EJERCICIOS (Fretboard ➔ Tab/Runway)
  // -------------------------------------------------------------
  const handleLoadExerciseToTab = useCallback(
    (opts?: {
      overrideArpeggio?: ArpeggioType;
      overrideScale?: ScaleType;
      overridePattern?: PracticePattern;
      overrideSubdivision?: PracticeSubdivision;
    }) => {
      const effArp = opts?.overrideArpeggio ?? arpeggioType;
      const effScale = opts?.overrideScale ?? scaleType;
      const effPattern = opts?.overridePattern ?? practicePattern;
      const effSub = opts?.overrideSubdivision ?? subdivision;

      const activeNotes = extractActiveFretboardNotes(
        instrument,
        tuning,
        theoryMode,
        musicalKey,
        effScale,
        effArp,
        arpeggioRange,
        chordVoicingType,
        voicingShapeId
      );

      if (activeNotes.length === 0) return;

      const patternNotes = generatePatternNotes(activeNotes, effPattern);
      if (patternNotes.length === 0) return;

      const totalSteps = measuresCount * 16;
      const stepDelta = effSub === '8n' ? 2 : 1;

      // Matriz limpia con la configuración instrumental actual
      const newTracks = generateInitialTracks(instrument, tuning, measuresCount);

      let patternIdx = 0;
      for (let step = 0; step < totalSteps; step += stepDelta) {
        const note = patternNotes[patternIdx % patternNotes.length];
        if (newTracks[note.stringIndex]) {
          newTracks[note.stringIndex].steps[step] = {
            fret: note.fret,
            articulation: 'normal',
          };
        }
        patternIdx++;
      }

      setTracks(newTracks);
      setCurrentStep(0);
      const firstNote = patternNotes[0];
      setSelectedCell({
        stringIndex: firstNote.stringIndex,
        stepIndex: 0,
      });

      // Audicionar nota inicial y feedback visual en mástil
      stringsAudioEngine.playNote(instrument, firstNote.fullNote, 'normal', '8n');
      const triggerId = `${firstNote.stringIndex}-${firstNote.fret}-${Date.now()}`;
      setActiveHitNotes([{ stringIndex: firstNote.stringIndex, fret: firstNote.fret, id: triggerId }]);
      setTimeout(() => {
        setActiveHitNotes((prev) => prev.filter((n) => n.id !== triggerId));
      }, 250);
    },
    [
      arpeggioType,
      scaleType,
      practicePattern,
      subdivision,
      instrument,
      tuning,
      theoryMode,
      musicalKey,
      arpeggioRange,
      chordVoicingType,
      voicingShapeId,
      measuresCount,
    ]
  );

  // -------------------------------------------------------------
  // ARPEGGIO AUDITION: Plays notes sequentially ascending/descending
  // -------------------------------------------------------------
  const handleAuditionArpeggio = async () => {
    await stringsAudioEngine.ensureStarted();
    const strings = getInstrumentStrings(instrument, tuning);
    const rootIdx = CHROMATIC_INDEX[musicalKey] ?? 0;
    const arpDef =
      ARPEGGIO_CATALOGUE.find((a) => a.id === arpeggioType) || ARPEGGIO_CATALOGUE[0];

    const foundNotes: {
      noteName: string;
      fullNote: string;
      midi: number;
      stringIdx: number;
      fret: number;
    }[] = [];

    strings.forEach((str, sIdx) => {
      for (let f = 0; f <= 24; f++) {
        const noteInfo = calculateFretNote(str.basePitch, f);
        const noteDistance = (CHROMATIC_INDEX[noteInfo.noteName] - rootIdx + 12) % 12;

        if (arpDef.semitones.includes(noteDistance)) {
          let inRange = true;
          if (arpeggioRange !== 'all') {
            const lowestStr = strings[strings.length - 1];
            const m = lowestStr.basePitch.match(/^([A-Ga-g][#b]?)/);
            const lowBaseIdx = CHROMATIC_INDEX[m ? m[1].toUpperCase() : 'E'] ?? 4;
            const rootFretLow = (rootIdx - lowBaseIdx + 12) % 12;

            if (arpeggioRange === 'box_root') {
              inRange = f >= Math.max(0, rootFretLow - 1) && f <= rootFretLow + 4;
            } else if (arpeggioRange === 'box_octave') {
              inRange = f >= Math.max(0, rootFretLow + 11) && f <= rootFretLow + 16;
            }
          }

          if (inRange) {
            foundNotes.push({
              noteName: noteInfo.noteName,
              fullNote: noteInfo.fullNote,
              midi: noteInfo.midi,
              stringIdx: sIdx,
              fret: f,
            });
          }
        }
      }
    });

    foundNotes.sort((a, b) => a.midi - b.midi);

    // Pick unique pitches
    const uniquePitches: typeof foundNotes = [];
    const seenMidi = new Set<number>();
    for (const n of foundNotes) {
      if (!seenMidi.has(n.midi)) {
        seenMidi.add(n.midi);
        uniquePitches.push(n);
      }
      if (uniquePitches.length >= 8) break;
    }

    if (uniquePitches.length === 0) return;

    // Ascending + descending arpeggio sequence
    const pattern = [...uniquePitches, ...uniquePitches.slice(0, -1).reverse()];
    const noteStrings = pattern.map((p) => p.fullNote);

    stringsAudioEngine.playArpeggio(instrument, noteStrings, 0.16);

    // Animate glow across the fretboard
    pattern.forEach((p, idx) => {
      setTimeout(() => {
        setActiveHits([{ stringIndex: p.stringIdx, fret: p.fret }]);
      }, idx * 160);
    });

    setTimeout(() => {
      setActiveHits([]);
    }, pattern.length * 160 + 200);
  };

  // -------------------------------------------------------------
  // STRUM CHORD: Plays voicing with 25ms humanized dispersion
  // -------------------------------------------------------------
  const handleStrumChord = async () => {
    await stringsAudioEngine.ensureStarted();
    const voicing = getChordVoicing(instrument, musicalKey, chordVoicingType, voicingShapeId);
    const strings = getInstrumentStrings(instrument, tuning);

    const strumHits: ActiveFretHit[] = [];
    const strumNotes: string[] = [];

    // Order from lowest sounding string (string index N-1) to highest (string 0)
    const activeNotes = voicing.notes
      .filter((n) => n.fret !== null)
      .sort((a, b) => b.stringIndex - a.stringIndex);

    activeNotes.forEach((n) => {
      const str = strings[n.stringIndex];
      if (str && n.fret !== null) {
        const noteInfo = calculateFretNote(str.basePitch, n.fret);
        strumNotes.push(noteInfo.fullNote);
        strumHits.push({ stringIndex: n.stringIndex, fret: n.fret });
      }
    });

    if (strumNotes.length === 0) return;

    stringsAudioEngine.playStrum(instrument, strumNotes, 25);

    setActiveHits(strumHits);
    setTimeout(() => {
      setActiveHits([]);
    }, 900);
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
      newTracks[3].steps[0] = { fret: 0, articulation: 'slap' };
      newTracks[1].steps[2] = { fret: 2, articulation: 'ghost' };
      newTracks[0].steps[3] = { fret: 0, articulation: 'pop' };
      newTracks[3].steps[6] = { fret: 3, articulation: 'slap' };
      newTracks[0].steps[7] = { fret: 5, articulation: 'pop' };
      newTracks[3].steps[8] = { fret: 0, articulation: 'slap' };
      newTracks[2].steps[10] = { fret: 5, articulation: 'slap' };
      newTracks[0].steps[11] = { fret: 7, articulation: 'pop' };
      newTracks[3].steps[14] = { fret: 5, articulation: 'slap' };
      setTracks(newTracks);
    } else if (presetId === 'bass_walking_jazz') {
      setInstrument('bass_4');
      setBpm(120);
      setMeasuresCount(1);
      setMusicalKey('E');
      setTheoryMode('arpeggio');
      setArpeggioType('dom7');
      const newTracks = generateInitialTracks('bass_4', 'standard', 1);
      newTracks[3].steps[0] = { fret: 0, articulation: 'normal' };
      newTracks[3].steps[4] = { fret: 4, articulation: 'normal' };
      newTracks[2].steps[8] = { fret: 2, articulation: 'normal' };
      newTracks[1].steps[12] = { fret: 0, articulation: 'normal' };
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
        newTracks[2].steps[i] = { fret: 0, articulation: 'normal' };
      }
      newTracks[2].steps[14] = { fret: 3, articulation: 'normal' };
      setTracks(newTracks);
    } else if (presetId === 'guitar_neo_soul') {
      setInstrument('guitar_6');
      setBpm(84);
      setMeasuresCount(1);
      setMusicalKey('E');
      setTheoryMode('chord_voicing');
      setChordVoicingType('maj7');
      setVoicingShapeId('root5_barre');
      const newTracks = generateInitialTracks('guitar_6', 'standard', 1);
      newTracks[5].steps[0] = { fret: 0, articulation: 'downstroke' };
      newTracks[3].steps[2] = { fret: 4, articulation: 'downstroke' };
      newTracks[2].steps[4] = { fret: 4, articulation: 'downstroke' };
      newTracks[1].steps[6] = { fret: 4, articulation: 'downstroke' };
      newTracks[0].steps[8] = { fret: 2, articulation: 'upstroke' };
      newTracks[1].steps[10] = { fret: 4, articulation: 'downstroke' };
      newTracks[2].steps[12] = { fret: 4, articulation: 'downstroke' };
      newTracks[3].steps[14] = { fret: 4, articulation: 'downstroke' };
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

  // Summary banner for active selection
  const currentTheorySummary = React.useMemo(() => {
    if (theoryMode === 'free') {
      return 'Modo Libre • Visualizando todas las posiciones cromáticas del mástil sin filtro';
    }
    if (theoryMode === 'scale') {
      const sc =
        SCALE_CATALOGUE.find((s) => s.id === scaleType) ||
        (scaleType === 'major' ? SCALE_CATALOGUE.find((s) => s.id === 'ionian') : null) ||
        SCALE_CATALOGUE[0];
      return `Tónica ${musicalKey} • ${sc?.name || ''} (${sc?.formula || ''}) • ${sc?.recommendedFor || ''}`;
    }
    if (theoryMode === 'arpeggio') {
      const arp =
        ARPEGGIO_CATALOGUE.find((a) => a.id === arpeggioType) || ARPEGGIO_CATALOGUE[0];
      return `Tónica ${musicalKey} • Arpegio ${arp?.name || ''} (${arp?.formula || ''}) • ${arp?.context || ''} [${
        arpeggioRange === 'all'
          ? 'Todo el mástil'
          : arpeggioRange === 'box_root'
          ? 'Caja 1 (Tónica)'
          : 'Caja 2 (Octava)'
      }]`;
    }
    const ch = CHORD_TYPE_OPTIONS.find((c) => c.id === chordVoicingType) || CHORD_TYPE_OPTIONS[0];
    const sh = VOICING_SHAPE_OPTIONS.find((s) => s.id === voicingShapeId) || VOICING_SHAPE_OPTIONS[0];
    return `Tónica ${musicalKey} • Acorde ${ch?.name || ''} (${musicalKey}${ch?.symbol || ''}) • Postura: ${sh?.name || ''} (${ch?.context || ''})`;
  }, [theoryMode, musicalKey, scaleType, arpeggioType, arpeggioRange, chordVoicingType, voicingShapeId]);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-3 px-4 select-none pb-8">
      {/* Studio Header Card */}
      <div className="w-full bg-[#0E1526]/80 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
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
              Estudio Armónico & Diapasón de Palisandro
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Modos Griegos, Menor Melódica, Arpegios Extendidos y Voicings de mano reales
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

      {/* 1. Barra de Teoría: 4 Modos Independientes */}
      <div className="w-full bg-[#0E1526]/90 border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl">
        {/* Header & 4 Mode Switcher with Exact Counters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Teoría & Pedagogía de Cuerdas
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona la tónica y explora modos griegos, arpegios extendidos o posturas de mano
              </p>
            </div>
          </div>

          {/* 4 Mode Toggle Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-black/60 border border-white/10 rounded-xl flex-wrap">
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
              onClick={() => setTheoryMode('arpeggio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                theoryMode === 'arpeggio'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Arpegios ({ARPEGGIO_CATALOGUE.length})
            </button>
            <button
              type="button"
              onClick={() => setTheoryMode('chord_voicing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                theoryMode === 'chord_voicing'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Acordes / Voicings ({CHORD_TYPE_OPTIONS.length})
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

        {/* ------------------------------------------------------------- */}
        {/* SECCIÓN 2: ESCALAS (12 - 7 Griegos + Menor & Blues)           */}
        {/* ------------------------------------------------------------- */}
        {theoryMode === 'scale' && (
          <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-cyan-400 font-bold uppercase tracking-wider text-[11px] font-mono">
                Catálogo de Escalas (12): Modos Griegos & Familia Menor/Blues
              </span>

              {/* Botón Principal Cargar en Tablatura para Escala */}
              <button
                type="button"
                onClick={() => handleLoadExerciseToTab()}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-900/40 flex items-center gap-2 cursor-pointer active:scale-95 transition-all text-xs"
              >
                <Rocket className="w-4 h-4 text-cyan-200" />
                <span>🚀 Cargar en Tablatura / Runway</span>
              </button>
            </div>

            {/* Barra de Patrón de Práctica y Subdivisión para Escalas */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Patrón:
                </span>
                <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => setPracticePattern('ascending')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'ascending'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Ascendente ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticePattern('descending')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'descending'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Descendente ↘
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticePattern('up_down')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'up_down'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Ida y Vuelta ↗↘
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticePattern('broken')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'broken'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Arpegio Quebrado (1-5-3-5)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Subdivisión:
                </span>
                <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => setSubdivision('8n')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      subdivision === '8n'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Corcheas 1/8
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubdivision('16n')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      subdivision === '16n'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Semicorcheas 1/16
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive scrollable card grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[310px] overflow-y-auto pr-1.5 custom-scrollbar">
              {SCALE_CATALOGUE.map((sc) => {
                const isSelected =
                  scaleType === sc.id ||
                  (scaleType === 'major' && sc.id === 'ionian') ||
                  (scaleType === 'minor' && sc.id === 'aeolian');

                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setScaleType(sc.id);
                      const isTabEmpty = tracks.every((t) => t.steps.every((s) => s.fret === null));
                      if (isTabEmpty) {
                        handleLoadExerciseToTab({ overrideScale: sc.id });
                      }
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-white leading-tight">{sc.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                        {sc.category === 'Griegos' ? 'Griego' : 'Blues'}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-300 w-fit">
                      {sc.formula}
                    </span>

                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {sc.recommendedFor}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECCIÓN 3: ARPEGIOS (12 Melódicos / Nota a Nota)              */}
        {/* ------------------------------------------------------------- */}
        {theoryMode === 'arpeggio' && (
          <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                Catálogo de Arpegios Melódicos ({ARPEGGIO_CATALOGUE.length}):
              </span>

              {/* Range Filter, Audition Button & Main Injector Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-lg p-1 text-[11px] font-mono">
                  <span className="text-slate-400 px-1">Rango:</span>
                  <button
                    type="button"
                    onClick={() => setArpeggioRange('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      arpeggioRange === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todo el Mástil
                  </button>
                  <button
                    type="button"
                    onClick={() => setArpeggioRange('box_root')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      arpeggioRange === 'box_root'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Caja 1 (Tónica)
                  </button>
                  <button
                    type="button"
                    onClick={() => setArpeggioRange('box_octave')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      arpeggioRange === 'box_octave'
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Caja 2 (Octava)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAuditionArpeggio}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Audicionar Arpegio</span>
                </button>

                {/* BOTÓN PRINCIPAL DESTACADO: CARGAR EN TABLATURA / RUNWAY */}
                <button
                  type="button"
                  onClick={() => handleLoadExerciseToTab()}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-cyan-900/40 flex items-center gap-2 cursor-pointer active:scale-95 transition-all text-xs"
                >
                  <Rocket className="w-4 h-4 text-cyan-200" />
                  <span>🚀 Cargar en Tablatura / Runway</span>
                </button>
              </div>
            </div>

            {/* BARRA DE PATRÓN DE PRÁCTICA Y FIGURA RÍTMICA */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono">
              {/* Selector de Patrón de Práctica */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  Patrón:
                </span>
                <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => setPracticePattern('ascending')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'ascending'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Ascendente ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticePattern('descending')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'descending'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Descendente ↘
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticePattern('up_down')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'up_down'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Ida y Vuelta ↗↘
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticePattern('broken')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      practicePattern === 'broken'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Arpegio Quebrado (1-5-3-5)
                  </button>
                </div>
              </div>

              {/* Selector de Figura Rítmica */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Subdivisión:
                </span>
                <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => setSubdivision('8n')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      subdivision === '8n'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Corcheas 1/8
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubdivision('16n')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                      subdivision === '16n'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Semicorcheas 1/16
                  </button>
                </div>
              </div>
            </div>

            {/* Responsive scrollable card grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[310px] overflow-y-auto pr-1.5 custom-scrollbar">
              {ARPEGGIO_CATALOGUE.map((arp) => {
                const isSelected = arpeggioType === arp.id;

                return (
                  <button
                    key={arp.id}
                    type="button"
                    onClick={() => {
                      setArpeggioType(arp.id);
                      const isTabEmpty = tracks.every((t) => t.steps.every((s) => s.fret === null));
                      if (isTabEmpty) {
                        handleLoadExerciseToTab({ overrideArpeggio: arp.id });
                      }
                    }}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span className="font-bold text-xs text-white leading-tight">{arp.name}</span>

                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-mono text-purple-300 w-fit">
                      {arp.formula}
                    </span>

                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {arp.context}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* SECCIÓN 4: ACORDES / VOICINGS (12 Posturas de Mano Reales)    */}
        {/* ------------------------------------------------------------- */}
        {theoryMode === 'chord_voicing' && (
          <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                Catálogo de Acordes & Posturas Físicas (12):
              </span>

              {/* Botón Rasguear Acorde (Strum) */}
              <button
                type="button"
                onClick={handleStrumChord}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>RASGUEAR ACORDE (STRUM)</span>
              </button>
            </div>

            {/* Selector de Postura / Voicing Shape */}
            <div className="flex items-center gap-1.5 flex-wrap bg-black/40 p-2 rounded-xl border border-white/10">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase mr-1">Forma / Postura:</span>
              {VOICING_SHAPE_OPTIONS.map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => setVoicingShapeId(sh.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    voicingShapeId === sh.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{sh.name}</span>
                </button>
              ))}
            </div>

            {/* Responsive scrollable card grid of 12 Chord Types */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[310px] overflow-y-auto pr-1.5 custom-scrollbar">
              {CHORD_TYPE_OPTIONS.map((ct) => {
                const isSelected = chordVoicingType === ct.id;

                return (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => setChordVoicingType(ct.id)}
                    className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-white leading-tight">{ct.name}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                        {musicalKey}{ct.symbol}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                      {ct.context}
                    </span>
                  </button>
                );
              })}
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
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 flex-wrap">
            {theoryMode === 'chord_voicing' ? (
              <>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-rose-950 border border-rose-500 text-rose-400 font-bold flex items-center justify-center text-[10px]">
                    ✕
                  </span>
                  <span>Silenciada</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                    ○
                  </span>
                  <span>Al Aire</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-sky-500 text-white font-bold flex items-center justify-center text-[10px]">
                    1..4
                  </span>
                  <span>Dedos 1 a 4</span>
                </span>
              </>
            ) : (
              <>
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
                  <span>Notas Activas</span>
                </span>
              </>
            )}
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
          arpeggioType={arpeggioType}
          arpeggioRange={arpeggioRange}
          chordVoicingType={chordVoicingType}
          voicingShapeId={voicingShapeId}
          activeHits={activeHits}
          activeHitNotes={activeHitNotes}
          onFretClick={handleFretboardClick}
        />
      </div>

      {/* 3. Barra de Transporte Unificada y Métricas (Docked entre Mástil y Tablatura) */}
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

      {/* 4. Tablatura de Estudio / Modo Runway */}
      <StringsSequencerGrid
        instrument={instrument}
        tracks={tracks}
        measuresCount={measuresCount}
        currentStep={currentStep}
        isPlaying={isPlaying}
        bpm={bpm}
        activeHits={activeHits}
        activeHitNotes={activeHitNotes}
        selectedCell={selectedCell}
        onSelectCell={setSelectedCell}
        onUpdateStep={handleUpdateStep}
        onClearGrid={handleClearGrid}
        onLoadPreset={handleLoadPreset}
        onNoteTrigger={handleNoteTrigger}
      />
    </div>
  );
}
