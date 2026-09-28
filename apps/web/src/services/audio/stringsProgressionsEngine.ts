import {
  InstrumentType,
  TuningId,
  MusicalKey,
  ChordVoicingType,
  PracticeSubdivision,
  ProgressionAccompanimentStyle,
  ProgressionChordStep,
  HarmonicProgressionDef,
  StringTrack,
  SequencerStepCell,
} from '@/types/strings';
import {
  CHROMATIC_INDEX,
  CHROMATIC_KEYS,
  getChordVoicing,
} from './stringsTheoryEngine';
import {
  getInstrumentStrings,
} from '@/components/studio/strings/InteractiveFretboard';
import { calculateFretNote } from './stringsAudioEngine';

// Mapeo a nombres de notas en español
export const SPANISH_NOTE_NAMES: Record<string, string> = {
  C: 'Do',
  'C#': 'Do#',
  DB: 'Reb',
  D: 'Re',
  'D#': 'Re#',
  EB: 'Mib',
  E: 'Mi',
  F: 'Fa',
  'F#': 'Fa#',
  GB: 'Solb',
  G: 'Sol',
  'G#': 'Sol#',
  AB: 'Lab',
  A: 'La',
  'A#': 'La#',
  BB: 'Sib',
  B: 'Si',
};

// Generador de offsets matemáticos para subdivisiones regulares e irregulares (tuplets)
export function getSubdivisionStepOffsets(
  subdivision: PracticeSubdivision,
  measureIndex: number
): { stepIndex: number; timeOffsetRatio: number; duration: string; tupletBadge?: string }[] {
  const baseStep = measureIndex * 16;
  const offsets: { stepIndex: number; timeOffsetRatio: number; duration: string; tupletBadge?: string }[] = [];

  switch (subdivision) {
    case '4n': // 1/4 Negras (4 notas/compás)
      for (let b = 0; b < 4; b++) {
        offsets.push({
          stepIndex: baseStep + b * 4,
          timeOffsetRatio: 0,
          duration: '4n',
        });
      }
      break;

    case '8n': // 1/8 Corcheas (8 notas/compás)
      for (let s = 0; s < 8; s++) {
        offsets.push({
          stepIndex: baseStep + s * 2,
          timeOffsetRatio: 0,
          duration: '8n',
        });
      }
      break;

    case '16n': // 1/16 Semicorcheas (16 notas/compás)
      for (let s = 0; s < 16; s++) {
        offsets.push({
          stepIndex: baseStep + s,
          timeOffsetRatio: 0,
          duration: '16n',
        });
      }
      break;

    case '32n': // 1/32 Fusas (32 notas/compás)
      for (let s = 0; s < 16; s++) {
        offsets.push({
          stepIndex: baseStep + s,
          timeOffsetRatio: 0,
          duration: '32n',
        });
        offsets.push({
          stepIndex: baseStep + s,
          timeOffsetRatio: 0.5,
          duration: '32n',
        });
      }
      break;

    case 'quarter_triplet': // 3:2 Tresillo de Negras (6 notas por compás 4/4)
      // 3 notas en los primeros 2 tiempos (8 pasos) + 3 notas en los últimos 2 tiempos
      for (let half = 0; half < 2; half++) {
        const halfBase = baseStep + half * 8;
        // Intervalo exacto = 8 / 3 ≈ 2.667 pasos
        // Nota 0: paso 0 (offset 0)
        // Nota 1: paso 3 (offset -0.333 -> tiempo 2.667)
        // Nota 2: paso 5 (offset +0.333 -> tiempo 5.333)
        offsets.push({
          stepIndex: halfBase + 0,
          timeOffsetRatio: 0,
          duration: '4t',
          tupletBadge: '3:2',
        });
        offsets.push({
          stepIndex: halfBase + 3,
          timeOffsetRatio: -0.333,
          duration: '4t',
          tupletBadge: '3:2',
        });
        offsets.push({
          stepIndex: halfBase + 5,
          timeOffsetRatio: 0.333,
          duration: '4t',
          tupletBadge: '3:2',
        });
      }
      break;

    case 'eighth_triplet': // 3:2 Tresillo de Corcheas (12 notas por compás 4/4 - Blues/Swing/Shuffle)
      // 3 notas por cada pulso de negra (4 pasos)
      for (let b = 0; b < 4; b++) {
        const beatBase = baseStep + b * 4;
        // Intervalo exacto = 4 / 3 ≈ 1.333 pasos
        // Nota 0: paso 0 (offset 0)
        // Nota 1: paso 1 (offset +0.333 -> tiempo 1.333)
        // Nota 2: paso 3 (offset -0.333 -> tiempo 2.667)
        offsets.push({
          stepIndex: beatBase + 0,
          timeOffsetRatio: 0,
          duration: '8t',
          tupletBadge: '3',
        });
        offsets.push({
          stepIndex: beatBase + 1,
          timeOffsetRatio: 0.333,
          duration: '8t',
          tupletBadge: '3',
        });
        offsets.push({
          stepIndex: beatBase + 3,
          timeOffsetRatio: -0.333,
          duration: '8t',
          tupletBadge: '3',
        });
      }
      break;

    case 'sextuplet': // 6:4 Seiscillos (24 notas por compás 4/4)
      for (let b = 0; b < 4; b++) {
        const beatBase = baseStep + b * 4;
        // 6 notas por pulso de negra: 0, 0.67, 1.33, 2.0, 2.67, 3.33
        offsets.push({ stepIndex: beatBase + 0, timeOffsetRatio: 0, duration: '16t', tupletBadge: '6' });
        offsets.push({ stepIndex: beatBase + 1, timeOffsetRatio: -0.333, duration: '16t', tupletBadge: '6' });
        offsets.push({ stepIndex: beatBase + 1, timeOffsetRatio: 0.333, duration: '16t', tupletBadge: '6' });
        offsets.push({ stepIndex: beatBase + 2, timeOffsetRatio: 0, duration: '16t', tupletBadge: '6' });
        offsets.push({ stepIndex: beatBase + 3, timeOffsetRatio: -0.333, duration: '16t', tupletBadge: '6' });
        offsets.push({ stepIndex: beatBase + 3, timeOffsetRatio: 0.333, duration: '16t', tupletBadge: '6' });
      }
      break;

    case 'quintuplet': // 5:4 Quintillos (20 notas por compás 4/4 - Neo-Soul & Prog)
      for (let b = 0; b < 4; b++) {
        const beatBase = baseStep + b * 4;
        // 5 notas por pulso: 0.0, 0.8, 1.6, 2.4, 3.2
        offsets.push({ stepIndex: beatBase + 0, timeOffsetRatio: 0, duration: '16n', tupletBadge: '5' });
        offsets.push({ stepIndex: beatBase + 1, timeOffsetRatio: -0.2, duration: '16n', tupletBadge: '5' });
        offsets.push({ stepIndex: beatBase + 2, timeOffsetRatio: -0.4, duration: '16n', tupletBadge: '5' });
        offsets.push({ stepIndex: beatBase + 2, timeOffsetRatio: 0.4, duration: '16n', tupletBadge: '5' });
        offsets.push({ stepIndex: beatBase + 3, timeOffsetRatio: 0.2, duration: '16n', tupletBadge: '5' });
      }
      break;

    default:
      for (let s = 0; s < 8; s++) {
        offsets.push({ stepIndex: baseStep + s * 2, timeOffsetRatio: 0, duration: '8n' });
      }
      break;
  }

  return offsets;
}

// Función helper para calcular notas y notas guía de un acorde en una tonalidad
function buildChordStep(
  measureIndex: number,
  rootKey: MusicalKey,
  chordType: ChordVoicingType,
  degreeRoman: string,
  symbolSuffix: string
): ProgressionChordStep {
  const rootIdx = CHROMATIC_INDEX[rootKey] ?? 0;
  let thirdInterval = 4; // Major 3rd
  let fifthInterval = 7; // Perfect 5th
  let seventhInterval: number | undefined = 11; // Major 7th

  if (chordType === 'minor' || chordType === 'm7') {
    thirdInterval = 3;
    seventhInterval = 10;
  } else if (chordType === 'dom7') {
    thirdInterval = 4;
    seventhInterval = 10;
  } else if (chordType === 'maj7') {
    thirdInterval = 4;
    seventhInterval = 11;
  } else if (chordType === 'm7b5') {
    thirdInterval = 3;
    fifthInterval = 6;
    seventhInterval = 10;
  } else if (chordType === 'dim7') {
    thirdInterval = 3;
    fifthInterval = 6;
    seventhInterval = 9;
  } else if (chordType === 'major') {
    thirdInterval = 4;
    seventhInterval = undefined;
  }

  const rootNoteC = rootIdx;
  const thirdNoteC = (rootIdx + thirdInterval) % 12;
  const fifthNoteC = (rootIdx + fifthInterval) % 12;
  const seventhNoteC = seventhInterval !== undefined ? (rootIdx + seventhInterval) % 12 : undefined;

  const rootNameEs = SPANISH_NOTE_NAMES[rootKey] || rootKey;
  const thirdNameEs = SPANISH_NOTE_NAMES[CHROMATIC_KEYS[thirdNoteC]] || '';
  const fifthNameEs = SPANISH_NOTE_NAMES[CHROMATIC_KEYS[fifthNoteC]] || '';
  const seventhNameEs = seventhNoteC !== undefined ? SPANISH_NOTE_NAMES[CHROMATIC_KEYS[seventhNoteC]] || '' : '';

  const notesEs = [rootNameEs, thirdNameEs, fifthNameEs, seventhNameEs].filter(Boolean).join(' - ');

  return {
    measureIndex,
    chordSymbol: `${rootKey}${symbolSuffix}`,
    rootNote: rootKey,
    chordType,
    degreeRoman,
    guideTones: {
      root: rootNoteC,
      third: thirdNoteC,
      fifth: fifthNoteC,
      seventh: seventhNoteC,
    },
    notesEs,
  };
}

// =======================================================
// CATÁLOGO COMPLETO DE 10 PROGRESIONES & CADENCIAS
// =======================================================
export const PROGRESSION_CATALOGUE: HarmonicProgressionDef[] = [
  // A) CADENCIAS TRADICIONALES & RESOLUCIONES
  {
    id: 'cadence_authentic',
    name: '1. Cadencia Auténtica / Perfecta',
    category: 'Cadencias',
    degreesText: '[ V7 ➔ I ]',
    defaultKey: 'C',
    measuresCount: 2,
    description: 'Máxima tensión dominante con tritono que resuelve con reposo total en la tónica.',
    context: 'Pilar tonal de la música clásica, himnos, pop y resoluciones de frase.',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const dominantKey = CHROMATIC_KEYS[(r + 7) % 12];
      return [
        buildChordStep(0, dominantKey, 'dom7', 'V7', '7'),
        buildChordStep(1, key, 'major', 'I', ''),
      ];
    },
  },
  {
    id: 'cadence_plagal',
    name: '2. Cadencia Plagal ("Amén")',
    category: 'Cadencias',
    degreesText: '[ IV ➔ I ]',
    defaultKey: 'C',
    measuresCount: 2,
    description: 'Movimiento del 4º grado mayor a la tónica con sonoridad serena sin tensión dominante.',
    context: 'Música eclesiástica, góspel, rock clásico (The Beatles) y finales majestuosos.',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const subdominantKey = CHROMATIC_KEYS[(r + 5) % 12];
      return [
        buildChordStep(0, subdominantKey, 'major', 'IV', ''),
        buildChordStep(1, key, 'major', 'I', ''),
      ];
    },
  },
  {
    id: 'cadence_deceptive',
    name: '3. Cadencia Rota o Engañosa',
    category: 'Cadencias',
    degreesText: '[ V7 ➔ vi ]',
    defaultKey: 'C',
    measuresCount: 2,
    description: 'La dominante crea expectativa de resolución en I, pero sorprende cayendo en el 6º grado menor.',
    context: 'Baladas, bandas sonoras y canciones pop para prolongar la emoción antes del clímax.',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const dominantKey = CHROMATIC_KEYS[(r + 7) % 12];
      const viKey = CHROMATIC_KEYS[(r + 9) % 12];
      return [
        buildChordStep(0, dominantKey, 'dom7', 'V7', '7'),
        buildChordStep(1, viKey, 'minor', 'vi', 'm'),
      ];
    },
  },
  {
    id: 'cadence_andalusian',
    name: '4. Cadencia Andaluza',
    category: 'Cadencias',
    degreesText: '[ i ➔ bVII ➔ bVI ➔ V ]',
    defaultKey: 'A',
    measuresCount: 4,
    description: 'Tetracordio descendente menor con dominante mayor española (ej. Am - G - F - E).',
    context: 'Flamenco, rock latino, metal sinfónico y música mediterránea.',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const bVIIKey = CHROMATIC_KEYS[(r + 10) % 12];
      const bVIKey = CHROMATIC_KEYS[(r + 8) % 12];
      const vKey = CHROMATIC_KEYS[(r + 7) % 12];
      return [
        buildChordStep(0, key, 'minor', 'i', 'm'),
        buildChordStep(1, bVIIKey, 'major', 'bVII', ''),
        buildChordStep(2, bVIKey, 'major', 'bVI', ''),
        buildChordStep(3, vKey, 'dom7', 'V', '7'),
      ];
    },
  },

  // B) PROGRESIONES DE LA MÚSICA POPULAR Y MODERNA
  {
    id: 'pop_four_chords',
    name: '5. Progresión Pop Universal (4 Acordes)',
    category: 'Música Popular & Moderna',
    degreesText: '[ I ➔ V ➔ vi ➔ IV ]',
    defaultKey: 'C',
    measuresCount: 4,
    description: 'El eje armónico más exitoso de la historia moderna, base de cientos de éxitos mundiales.',
    context: 'Pop moderno, rock de estadios, baladas (U2, Elton John, Journey, Beatles).',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const vKey = CHROMATIC_KEYS[(r + 7) % 12];
      const viKey = CHROMATIC_KEYS[(r + 9) % 12];
      const ivKey = CHROMATIC_KEYS[(r + 5) % 12];
      return [
        buildChordStep(0, key, 'major', 'I', ''),
        buildChordStep(1, vKey, 'major', 'V', ''),
        buildChordStep(2, viKey, 'minor', 'vi', 'm'),
        buildChordStep(3, ivKey, 'major', 'IV', ''),
      ];
    },
  },
  {
    id: 'neo_soul_rb',
    name: '6. Progresión Neo-Soul / R&B Emocional',
    category: 'Música Popular & Moderna',
    degreesText: '[ IVmaj7 ➔ V7 ➔ iiim7 ➔ vim7 ]',
    defaultKey: 'E',
    measuresCount: 4,
    description: 'Cadencia suspendida de gran riqueza armónica sin reposo en la tónica, con voicings sedosos.',
    context: 'Neo-Soul, R&B moderno, Lo-Fi Hip Hop (D’Angelo, Erykah Badu, H.E.R.).',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const ivKey = CHROMATIC_KEYS[(r + 5) % 12];
      const vKey = CHROMATIC_KEYS[(r + 7) % 12];
      const iiiKey = CHROMATIC_KEYS[(r + 4) % 12];
      const viKey = CHROMATIC_KEYS[(r + 9) % 12];
      return [
        buildChordStep(0, ivKey, 'maj7', 'IVmaj7', 'maj7'),
        buildChordStep(1, vKey, 'dom7', 'V7', '7'),
        buildChordStep(2, iiiKey, 'm7', 'iiim7', 'm7'),
        buildChordStep(3, viKey, 'm7', 'vim7', 'm7'),
      ];
    },
  },
  {
    id: 'jazz_ii_v_i',
    name: '7. Jazz Standard II - V - I Mayor',
    category: 'Música Popular & Moderna',
    degreesText: '[ ii7 ➔ V7 ➔ Imaj7 ]',
    defaultKey: 'C',
    measuresCount: 4,
    description: 'El pilar fundamental de la improvisación en jazz, swing y bossa nova.',
    context: 'Miles Davis, John Coltrane, Bill Evans y repertorio estándar de Real Book.',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const iiKey = CHROMATIC_KEYS[(r + 2) % 12];
      const vKey = CHROMATIC_KEYS[(r + 7) % 12];
      return [
        buildChordStep(0, iiKey, 'm7', 'ii7', 'm7'),
        buildChordStep(1, vKey, 'dom7', 'V7', '7'),
        buildChordStep(2, key, 'maj7', 'Imaj7', 'maj7'),
        buildChordStep(3, key, 'maj7', 'Imaj7', 'maj7'),
      ];
    },
  },
  {
    id: 'jazz_minor_cadence',
    name: '8. Jazz Menor (iiø7 ➔ V7alt ➔ im7)',
    category: 'Música Popular & Moderna',
    degreesText: '[ iiø7 ➔ V7 ➔ im7 ]',
    defaultKey: 'A',
    measuresCount: 4,
    description: 'Cadencia menor con semidisminuido y dominante alterada de intensa oscuridad sonora.',
    context: 'Autumn Leaves, Blue Bossa, film noir y baladas de jazz oscuro.',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const iiKey = CHROMATIC_KEYS[(r + 2) % 12];
      const vKey = CHROMATIC_KEYS[(r + 7) % 12];
      return [
        buildChordStep(0, iiKey, 'm7b5', 'iiø7', 'm7b5'),
        buildChordStep(1, vKey, 'dom7', 'V7alt', '7alt'),
        buildChordStep(2, key, 'm7', 'im7', 'm7'),
        buildChordStep(3, key, 'm7', 'im7', 'm7'),
      ];
    },
  },
  {
    id: 'blues_12_bar',
    name: '9. Blues de 12 Compases (12-Bar Blues)',
    category: 'Música Popular & Moderna',
    degreesText: '[ I7 - IV7 - I7 - V7 - IV7 - I7 ]',
    defaultKey: 'E',
    measuresCount: 12,
    description: 'La estructura de 12 compases con acordes dominantes que dio origen al rock and roll.',
    context: 'B.B. King, Muddy Waters, Jimi Hendrix, Stevie Ray Vaughan.',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const ivKey = CHROMATIC_KEYS[(r + 5) % 12];
      const vKey = CHROMATIC_KEYS[(r + 7) % 12];
      return [
        buildChordStep(0, key, 'dom7', 'I7', '7'),
        buildChordStep(1, ivKey, 'dom7', 'IV7', '7'),
        buildChordStep(2, key, 'dom7', 'I7', '7'),
        buildChordStep(3, key, 'dom7', 'I7', '7'),
        buildChordStep(4, ivKey, 'dom7', 'IV7', '7'),
        buildChordStep(5, ivKey, 'dom7', 'IV7', '7'),
        buildChordStep(6, key, 'dom7', 'I7', '7'),
        buildChordStep(7, key, 'dom7', 'I7', '7'),
        buildChordStep(8, vKey, 'dom7', 'V7', '7'),
        buildChordStep(9, ivKey, 'dom7', 'IV7', '7'),
        buildChordStep(10, key, 'dom7', 'I7', '7'),
        buildChordStep(11, vKey, 'dom7', 'V7', '7'),
      ];
    },
  },
  {
    id: 'vamp_dorian_funk',
    name: '10. Vamp Modal Dórico (Funk / Groove)',
    category: 'Música Popular & Moderna',
    degreesText: '[ i7 ➔ IV7 ]',
    defaultKey: 'D',
    measuresCount: 4,
    description: 'Vamp de dos acordes característico con 6ª mayor para solos interminables de bajo y guitarra.',
    context: 'James Brown, Miles Davis (So What), Pink Floyd (Breathe), Carlos Santana (Oye Cómo Va).',
    chords: (key: MusicalKey) => {
      const r = CHROMATIC_INDEX[key] ?? 0;
      const ivKey = CHROMATIC_KEYS[(r + 5) % 12];
      return [
        buildChordStep(0, key, 'm7', 'i7', 'm7'),
        buildChordStep(1, ivKey, 'dom7', 'IV7', '7'),
        buildChordStep(2, key, 'm7', 'i7', 'm7'),
        buildChordStep(3, ivKey, 'dom7', 'IV7', '7'),
      ];
    },
  },
];

// Encuentra el traste óptimo para una nota en una cuerda determinada
function findFretOnString(basePitch: string, targetSemitoneC: number, minFret = 0, maxFret = 12): number {
  for (let f = minFret; f <= maxFret; f++) {
    const noteInfo = calculateFretNote(basePitch, f);
    const semitone = CHROMATIC_INDEX[noteInfo.noteName];
    if (semitone === targetSemitoneC) {
      return f;
    }
  }
  return 0;
}

// =======================================================
// GENERADOR DE TABLATURA SEGÚN ESTILO DE ACOMPAÑAMIENTO
// =======================================================
export function generateProgressionExerciseTracks(
  instrument: InstrumentType,
  tuning: TuningId,
  progressionDef: HarmonicProgressionDef,
  key: MusicalKey,
  style: ProgressionAccompanimentStyle,
  subdivision: PracticeSubdivision
): { tracks: StringTrack[]; measuresCount: number } {
  const chords = progressionDef.chords(key);
  const measuresCount = chords.length;
  const totalSteps = measuresCount * 16;
  const strings = getInstrumentStrings(instrument, tuning);

  // Inicializar tracks en blanco
  const tracks: StringTrack[] = strings.map((str, sIdx) => ({
    stringIndex: sIdx,
    stringName: str.name,
    basePitch: str.basePitch,
    gauge: str.gauge,
    steps: Array.from({ length: totalSteps }, () => ({
      fret: null,
      articulation: 'normal',
    })),
  }));

  const isBass = instrument.startsWith('bass');
  const bassStringIdx = strings.length - 1; // Cuerda más grave (E o B)
  const aStringIdx = Math.max(0, strings.length - 2);

  chords.forEach((chord, mIdx) => {
    const offsets = getSubdivisionStepOffsets(subdivision, mIdx);
    const rootC = chord.guideTones.root;
    const thirdC = chord.guideTones.third;
    const fifthC = chord.guideTones.fifth ?? (rootC + 7) % 12;
    const seventhC = chord.guideTones.seventh ?? (rootC + 10) % 12;

    const nextChord = chords[(mIdx + 1) % chords.length];
    const nextRootC = nextChord.guideTones.root;

    // Trastes en la cuerda grave para la tónica y quinta
    const rootFretLow = findFretOnString(strings[bassStringIdx].basePitch, rootC, 0, 12);
    const fifthFretLow = findFretOnString(strings[aStringIdx].basePitch, fifthC, 0, 12);
    const thirdFret = findFretOnString(strings[aStringIdx].basePitch, thirdC, 0, 12);
    const seventhFret = findFretOnString(strings[Math.max(0, strings.length - 3)].basePitch, seventhC, 0, 12);

    // ESTILO 1: [ Tónicas y Quintas en Fundamental (Bajo Sólido) ]
    if (style === 'roots_fifths') {
      offsets.forEach((off, idx) => {
        // En los tiempos impares (1 y 3) toca la tónica, en los pares (2 y 4) alterna con la 5ª o la tónica
        const isFifthBeat = idx % 4 === 2;
        const targetStr = isFifthBeat ? aStringIdx : bassStringIdx;
        const targetFret = isFifthBeat ? fifthFretLow : rootFretLow;

        tracks[targetStr].steps[off.stepIndex] = {
          fret: targetFret,
          articulation: 'normal',
          duration: off.duration,
          timeOffsetRatio: off.timeOffsetRatio,
          tupletBadge: off.tupletBadge,
          chordName: chord.chordSymbol,
        };
      });
    }

    // ESTILO 2: [ Walking Bass / Conducción Cromática ]
    else if (style === 'walking_bass') {
      // 4 notas por compás (o múltiplos): Tónica ➔ 3ª ➔ 5ª ➔ Conducción cromática a la siguiente tónica
      const chromaticApproachC = (nextRootC - 1 + 12) % 12;
      const chromFret = findFretOnString(strings[bassStringIdx].basePitch, chromaticApproachC, 0, 12);

      const walkingNotes = [
        { str: bassStringIdx, fret: rootFretLow },
        { str: aStringIdx, fret: thirdFret },
        { str: aStringIdx, fret: fifthFretLow },
        { str: bassStringIdx, fret: chromFret },
      ];

      offsets.forEach((off, idx) => {
        const note = walkingNotes[idx % walkingNotes.length];
        tracks[note.str].steps[off.stepIndex] = {
          fret: note.fret,
          articulation: 'normal',
          duration: off.duration,
          timeOffsetRatio: off.timeOffsetRatio,
          tupletBadge: off.tupletBadge,
          chordName: chord.chordSymbol,
        };
      });
    }

    // ESTILO 3: [ Arpegio Rítmico de la Progresión ]
    else if (style === 'rhythmic_arpeggio') {
      const arpeggioNotes = [
        { str: bassStringIdx, fret: rootFretLow },
        { str: aStringIdx, fret: thirdFret },
        { str: aStringIdx, fret: fifthFretLow },
        { str: Math.max(0, strings.length - 3), fret: seventhFret },
      ];

      offsets.forEach((off, idx) => {
        const note = arpeggioNotes[idx % arpeggioNotes.length];
        tracks[note.str].steps[off.stepIndex] = {
          fret: note.fret,
          articulation: 'normal',
          duration: off.duration,
          timeOffsetRatio: off.timeOffsetRatio,
          tupletBadge: off.tupletBadge,
          chordName: chord.chordSymbol,
        };
      });
    }

    // ESTILO 4: [ Rasgueo de Acordes (Guitar Comping) ]
    else if (style === 'guitar_comping') {
      // Obtener voicing para guitarra o bajo
      const voicing = getChordVoicing(instrument, chord.rootNote, chord.chordType, 'open');
      const activeVoicingNotes = voicing.notes.filter((n) => n.fret !== null);

      // Ritmo de comping (downbeat y síncopa en contratiempo)
      offsets.forEach((off, idx) => {
        // En comping, rasguear en pulsos 1 y 3 (o en ritmo charleston idx 0 y 3)
        const shouldHit = idx === 0 || idx === 3 || idx === 6 || idx === 10;
        if (shouldHit) {
          activeVoicingNotes.forEach((vn) => {
            if (tracks[vn.stringIndex]) {
              tracks[vn.stringIndex].steps[off.stepIndex] = {
                fret: vn.fret,
                articulation: idx === 0 ? 'downstroke' : 'upstroke',
                duration: off.duration,
                timeOffsetRatio: off.timeOffsetRatio,
                tupletBadge: off.tupletBadge,
                chordName: chord.chordSymbol,
              };
            }
          });
        }
      });
    }
  });

  return { tracks, measuresCount };
}
