export interface NoteInfo {
  name: string;
  octave: number;
  midi: number;
  fullNote: string;
  isBlack: boolean;
  interval?: string;
  finger?: number;
  hand?: 'LH' | 'RH';
}

export type VoicingType = 'close' | 'open' | 'drop2' | 'drop3' | 'rootless' | 'quartal';
export type LabelType = 'notes' | 'intervals' | 'fingers' | 'none';
export type KeyboardRange = 61 | 88;
export type AccompanimentTexture = 'comping' | 'arpeggio_asc' | 'arpeggio_desc' | 'lh_bass_rh_chord' | 'walking_bass';

export interface ScaleDefinition {
  id: string;
  name: string;
  category: 'major' | 'minor' | 'modes' | 'pentatonic' | 'bebop_symmetric';
  intervals: number[]; // semitones from root
  formula: string;
  description: string;
}

export interface ChordDefinition {
  id: string;
  name: string;
  symbol: string;
  category: 'triad' | 'seventh' | 'extended' | 'altered';
  intervals: number[]; // semitones from root
  description: string;
}

export interface ProgressionPreset {
  id: string;
  name: string;
  genre: 'Jazz Swing' | 'Neo-Soul / R&B' | 'Funk Groove' | 'Gospel Chops' | 'Bossa Nova' | 'Pop Balada' | 'Lofi Hip Hop';
  chords: { rootOffset: number; chordId: string; durationBeats: number; roman: string }[];
  description: string;
}

export interface CircleKeyInfo {
  key: string;
  alterations: number; // positive = sharps, negative = flats
  accidentalsText: string;
  relativeMinor: string;
  diatonicChords: { degree: string; chordName: string; quality: string }[];
  neighbors: string[];
}

export const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const INTERVAL_LABELS: { [semitones: number]: string } = {
  0: 'R',
  1: 'b2',
  2: '2M',
  3: 'b3',
  4: '3M',
  5: '4P',
  6: '#4/b5',
  7: '5P',
  8: 'b6',
  9: '6M',
  10: 'b7',
  11: '7M',
  12: '8P',
  13: 'b9',
  14: '9',
  15: '#9',
  17: '11',
  18: '#11',
  20: 'b13',
  21: '13',
};

// --- SCALES & MODES CATALOG ---
export const SCALE_CATALOG: ScaleDefinition[] = [
  // Major & Modes
  { id: 'ionian', name: 'Mayor (Jónico)', category: 'major', intervals: [0, 2, 4, 5, 7, 9, 11], formula: '1 2 3 4 5 6 7', description: 'Escala brillante y fundamental para la armonía tonal.' },
  { id: 'dorian', name: 'Dórico', category: 'modes', intervals: [0, 2, 3, 5, 7, 9, 10], formula: '1 2 b3 4 5 6 b7', description: 'Modo menor característico del Jazz, Funk y Soul (6ª mayor).' },
  { id: 'phrygian', name: 'Frigio', category: 'modes', intervals: [0, 1, 3, 5, 7, 8, 10], formula: '1 b2 b3 4 5 b6 b7', description: 'Sonoridad española/flamenca con 2ª menor.' },
  { id: 'lydian', name: 'Lidio', category: 'modes', intervals: [0, 2, 4, 6, 7, 9, 11], formula: '1 2 3 #4 5 6 7', description: 'Escala etérea y cinematográfica con 4ª aumentada.' },
  { id: 'mixolydian', name: 'Mixolidio', category: 'modes', intervals: [0, 2, 4, 5, 7, 9, 10], formula: '1 2 3 4 5 6 b7', description: 'Base del Blues, Rock y acordes de Dominante 7.' },
  { id: 'aeolian', name: 'Menor Natural (Eólico)', category: 'minor', intervals: [0, 2, 3, 5, 7, 8, 10], formula: '1 2 b3 4 5 b6 b7', description: 'Modo menor melancólico estándar.' },
  { id: 'locrian', name: 'Locrio', category: 'modes', intervals: [0, 1, 3, 5, 6, 8, 10], formula: '1 b2 b3 4 b5 b6 b7', description: 'Escala oscura y tensa usada sobre acordes m7b5.' },

  // Pentatonics & Blues
  { id: 'penta_major', name: 'Pentatónica Mayor', category: 'pentatonic', intervals: [0, 2, 4, 7, 9], formula: '1 2 3 5 6', description: 'Versátil y consonante para Pop, Country y Solos melódicos.' },
  { id: 'penta_minor', name: 'Pentatónica Menor', category: 'pentatonic', intervals: [0, 3, 5, 7, 10], formula: '1 b3 4 5 b7', description: 'La columna vertebral de la improvisación Rock y Blues.' },
  { id: 'blues', name: 'Escala de Blues (con Blue Note)', category: 'pentatonic', intervals: [0, 3, 5, 6, 7, 10], formula: '1 b3 4 b5 5 b7', description: 'Pentatónica menor enriquecida con la 5ª disminuida (blue note).' },

  // Advanced & Jazz Minor
  { id: 'harmonic_minor', name: 'Menor Armónica', category: 'minor', intervals: [0, 2, 3, 5, 7, 8, 11], formula: '1 2 b3 4 5 b6 7', description: 'Séptima mayor sobre menor, sonido neoclásico y tango.' },
  { id: 'melodic_minor', name: 'Menor Melódica (Jazz Minor)', category: 'minor', intervals: [0, 2, 3, 5, 7, 9, 11], formula: '1 2 b3 4 5 6 7', description: 'Escala reina del Jazz moderno, sin distancia de 2ª aug.' },
  { id: 'lydian_dominant', name: 'Lidio Dominante (Modo IV Menor Melódica)', category: 'bebop_symmetric', intervals: [0, 2, 4, 6, 7, 9, 10], formula: '1 2 3 #4 5 6 b7', description: 'Ideal para acordes 7#11 y dominantes sustitutos.' },
  { id: 'altered', name: 'Escala Alterada / Superlocrio (Modo VII)', category: 'bebop_symmetric', intervals: [0, 1, 3, 4, 6, 8, 10], formula: '1 b2 #2 3 b5 #5 b7', description: 'Tensión máxima sobre dominantes resolviendo a tónica (7alt).' },
  { id: 'bebop_dominant', name: 'Bebop Dominante', category: 'bebop_symmetric', intervals: [0, 2, 4, 5, 7, 9, 10, 11], formula: '1 2 3 4 5 6 b7 7', description: 'Escala de 8 notas para líneas fluidas en tiempos pares.' },
  { id: 'whole_tone', name: 'Tonos Enteros (Whole Tone)', category: 'bebop_symmetric', intervals: [0, 2, 4, 6, 8, 10], formula: '1 2 3 #4 #5 b7', description: 'Simetría perfecta de 6 notas con textura flotante.' },
  { id: 'diminished_hw', name: 'Disminuida (Semitono - Tono)', category: 'bebop_symmetric', intervals: [0, 1, 3, 4, 6, 7, 9, 10], formula: '1 b2 b3 3 b5 5 6 b7', description: 'Simétrica de 8 notas para dominantes alterados 7b9.' },
];

// --- CHORDS & VOICINGS CATALOG ---
export const CHORD_CATALOG: ChordDefinition[] = [
  // Triads
  { id: 'maj', name: 'Tríada Mayor', symbol: 'Maj', category: 'triad', intervals: [0, 4, 7], description: 'Consonancia plena (1 - 3M - 5P).' },
  { id: 'min', name: 'Tríada Menor', symbol: 'm', category: 'triad', intervals: [0, 3, 7], description: 'Tono sombrío y emotivo (1 - b3 - 5P).' },
  { id: 'aug', name: 'Tríada Aumentada', symbol: 'aug', category: 'triad', intervals: [0, 4, 8], description: 'Tensión simétrica expansiva (1 - 3M - #5).' },
  { id: 'dim', name: 'Tríada Disminuida', symbol: 'dim', category: 'triad', intervals: [0, 3, 6], description: 'Tensión inestable (1 - b3 - b5).' },
  { id: 'sus2', name: 'Tríada Sus2', symbol: 'sus2', category: 'triad', intervals: [0, 2, 7], description: 'Textura abierta y moderna (1 - 2M - 5P).' },
  { id: 'sus4', name: 'Tríada Sus4', symbol: 'sus4', category: 'triad', intervals: [0, 5, 7], description: 'Suspenso armónico resolutivo a 3ª (1 - 4P - 5P).' },

  // Sevenths
  { id: 'maj7', name: 'Séptima Mayor', symbol: 'Maj7', category: 'seventh', intervals: [0, 4, 7, 11], description: 'Cálido y sofisticado en Jazz y Pop (1 - 3M - 5P - 7M).' },
  { id: 'm7', name: 'Menor 7', symbol: 'm7', category: 'seventh', intervals: [0, 3, 7, 10], description: 'Suave y suavemente melancólico (1 - b3 - 5P - b7).' },
  { id: 'dom7', name: 'Dominante 7', symbol: '7', category: 'seventh', intervals: [0, 4, 7, 10], description: 'Acorde de tensión resolutiva primaria (1 - 3M - 5P - b7).' },
  { id: 'm7b5', name: 'Semidisminuido (m7b5)', symbol: 'm7b5', category: 'seventh', intervals: [0, 3, 6, 10], description: 'Grado ii del modo menor y locrio (1 - b3 - b5 - b7).' },
  { id: 'dim7', name: 'Disminuido Completo', symbol: 'dim7', category: 'seventh', intervals: [0, 3, 6, 9], description: 'Simetría simétrica de terceras menores (1 - b3 - b5 - bb7).' },
  { id: 'mMaj7', name: 'Menor Séptima Mayor', symbol: 'm(Maj7)', category: 'seventh', intervals: [0, 3, 7, 11], description: 'Tensión misteriosa o de película de espías (1 - b3 - 5P - 7M).' },

  // Extensions & Alterations
  { id: 'add9', name: 'Add9', symbol: 'add9', category: 'extended', intervals: [0, 4, 7, 14], description: 'Tríada mayor con color de 9ª añadida.' },
  { id: 'maj9', name: 'Mayor 9', symbol: 'Maj9', category: 'extended', intervals: [0, 4, 7, 11, 14], description: 'Rica extensión brillante para Neo-Soul y Jazz.' },
  { id: 'm9', name: 'Menor 9', symbol: 'm9', category: 'extended', intervals: [0, 3, 7, 10, 14], description: 'Expresividad aterciopelada y profunda.' },
  { id: 'dom9', name: 'Dominante 9', symbol: '9', category: 'extended', intervals: [0, 4, 7, 10, 14], description: 'Dominante extendido clásico para Funk y Bossa.' },
  { id: 'dom7b9', name: 'Dominante 7(b9)', symbol: '7b9', category: 'altered', intervals: [0, 4, 7, 10, 13], description: 'Tensión menor dramática resolviendo a tónica menor.' },
  { id: 'hendrix', name: 'Acorde Hendrix 7(#9)', symbol: '7#9', category: 'altered', intervals: [0, 4, 7, 10, 15], description: 'Ambivalencia blues/rock con 3M y #9.' },
  { id: 'dom7sharp11', name: 'Dominante 7(#11)', symbol: '7#11', category: 'altered', intervals: [0, 4, 7, 10, 18], description: 'Acorde lidio dominante de resolución moderna.' },
  { id: 'dom13', name: 'Dominante 13', symbol: '13', category: 'extended', intervals: [0, 4, 7, 10, 14, 21], description: 'Voicing completo y elegante para Big Band y Jazz.' },
];

// --- PRESETS BY GENRE & PROGRESSIONS ---
export const PROGRESSION_PRESETS: ProgressionPreset[] = [
  {
    id: 'ii_v_i_major',
    name: 'Cadencia II - V - I Mayor',
    genre: 'Jazz Swing',
    chords: [
      { rootOffset: 2, chordId: 'm7', durationBeats: 4, roman: 'ii7' },
      { rootOffset: 7, chordId: 'dom7', durationBeats: 4, roman: 'V7' },
      { rootOffset: 0, chordId: 'maj7', durationBeats: 8, roman: 'IMaj7' },
    ],
    description: 'La piedra angular de la armonía de Jazz estándar.',
  },
  {
    id: 'ii_v_i_minor',
    name: 'Cadencia II - V - I Menor',
    genre: 'Jazz Swing',
    chords: [
      { rootOffset: 2, chordId: 'm7b5', durationBeats: 4, roman: 'ii°7' },
      { rootOffset: 7, chordId: 'dom7b9', durationBeats: 4, roman: 'V7(b9)' },
      { rootOffset: 0, chordId: 'min', durationBeats: 8, roman: 'i min' },
    ],
    description: 'Resolución sombría y tensa en tonalidad menor.',
  },
  {
    id: 'neo_soul_groove',
    name: 'Secuencia Neo-Soul Smooth (IV - V - iii - vi)',
    genre: 'Neo-Soul / R&B',
    chords: [
      { rootOffset: 5, chordId: 'maj9', durationBeats: 4, roman: 'IVMaj9' },
      { rootOffset: 7, chordId: 'dom9', durationBeats: 4, roman: 'V9' },
      { rootOffset: 4, chordId: 'm9', durationBeats: 4, roman: 'iii7' },
      { rootOffset: 9, chordId: 'm9', durationBeats: 4, roman: 'vi9' },
    ],
    description: 'Progresión suntuosa con voicings extendidos y groove sincopado.',
  },
  {
    id: 'pop_universal',
    name: 'Progresión Pop Universal (I - V - vi - IV)',
    genre: 'Pop Balada',
    chords: [
      { rootOffset: 0, chordId: 'maj', durationBeats: 4, roman: 'I' },
      { rootOffset: 7, chordId: 'maj', durationBeats: 4, roman: 'V' },
      { rootOffset: 9, chordId: 'min', durationBeats: 4, roman: 'vi' },
      { rootOffset: 5, chordId: 'maj', durationBeats: 4, roman: 'IV' },
    ],
    description: 'La fórmula armónica más exitosa de la música popular.',
  },
  {
    id: 'andalusian_cadence',
    name: 'Cadencia Andaluza (i - bVII - bVI - V)',
    genre: 'Gospel Chops',
    chords: [
      { rootOffset: 0, chordId: 'min', durationBeats: 4, roman: 'i' },
      { rootOffset: 10, chordId: 'maj', durationBeats: 4, roman: 'bVII' },
      { rootOffset: 8, chordId: 'maj', durationBeats: 4, roman: 'bVI' },
      { rootOffset: 7, chordId: 'dom7', durationBeats: 4, roman: 'V7' },
    ],
    description: 'Descenso armónico tradicional flamenco y de intensa emotividad.',
  },
  {
    id: 'bossa_nova_standard',
    name: 'Bossa Nova Sunset (IMaj7 - II7 - ii7 - V7)',
    genre: 'Bossa Nova',
    chords: [
      { rootOffset: 0, chordId: 'maj7', durationBeats: 4, roman: 'IMaj7' },
      { rootOffset: 2, chordId: 'dom7', durationBeats: 4, roman: 'II7 (Sec)' },
      { rootOffset: 2, chordId: 'm7', durationBeats: 4, roman: 'ii7' },
      { rootOffset: 7, chordId: 'dom9', durationBeats: 4, roman: 'V9' },
    ],
    description: 'Estilo Tom Jobim con dominantes secundarios suaves y ritmo sincopado.',
  },
  {
    id: 'lofi_hiphop_chill',
    name: 'Lofi Chillout (IMaj9 - bVIIMaj7 - IVMaj7)',
    genre: 'Lofi Hip Hop',
    chords: [
      { rootOffset: 0, chordId: 'maj9', durationBeats: 4, roman: 'IMaj9' },
      { rootOffset: 10, chordId: 'maj7', durationBeats: 4, roman: 'bVIIMaj7 (Modal)' },
      { rootOffset: 5, chordId: 'maj7', durationBeats: 4, roman: 'IVMaj7' },
      { rootOffset: 7, chordId: 'dom7b9', durationBeats: 4, roman: 'V7b9' },
    ],
    description: 'Atmósfera relajante con préstamo modal e inflexión lo-fi.',
  },
];

// --- HELPER CALCULATIONS ---

/**
 * Converts MIDI note number (e.g. 60) to NoteInfo object
 */
export function midiToNoteInfo(midi: number): NoteInfo {
  const noteName = CHROMATIC_NOTES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const isBlack = noteName.includes('#');
  return {
    name: noteName,
    octave,
    midi,
    fullNote: `${noteName}${octave}`,
    isBlack,
  };
}

/**
 * Converts Note Name + Octave (e.g. "C4") to MIDI number
 */
export function noteToMidi(fullNote: string): number {
  const match = fullNote.match(/^([A-G][#b]?)(-?\d+)$/i);
  if (!match) return 60;
  let [, name, octStr] = match;
  name = name.toUpperCase();
  // Normalize flats
  if (name === 'DB') name = 'C#';
  else if (name === 'EB') name = 'D#';
  else if (name === 'GB') name = 'F#';
  else if (name === 'AB') name = 'G#';
  else if (name === 'BB') name = 'A#';

  const idx = CHROMATIC_NOTES.indexOf(name);
  const oct = parseInt(octStr, 10);
  return (oct + 1) * 12 + (idx !== -1 ? idx : 0);
}

/**
 * Calculates MIDI pitch sequence for a scale in a given root note
 */
export function getScaleNotes(rootNote: string, scaleId: string, baseOctave = 4): NoteInfo[] {
  const rootMidi = noteToMidi(`${rootNote}${baseOctave}`);
  const scale = SCALE_CATALOG.find((s) => s.id === scaleId) || SCALE_CATALOG[0];

  const notes: NoteInfo[] = scale.intervals.map((semitones) => {
    const midi = rootMidi + semitones;
    const note = midiToNoteInfo(midi);
    note.interval = INTERVAL_LABELS[semitones] || `${semitones}st`;
    return note;
  });

  // Add octave root for complete scale feeling
  const topMidi = rootMidi + 12;
  const topNote = midiToNoteInfo(topMidi);
  topNote.interval = '8P';
  notes.push(topNote);

  assignFingering(notes, rootMidi);
  return notes;
}

/**
 * Calculates Chord Notes according to Voicing Type
 */
export function getChordNotes(
  rootNote: string,
  chordId: string,
  voicing: VoicingType = 'close',
  baseOctave = 4
): NoteInfo[] {
  const rootMidi = noteToMidi(`${rootNote}${baseOctave}`);
  const chord = CHORD_CATALOG.find((c) => c.id === chordId) || CHORD_CATALOG[0];

  let rawMidis = chord.intervals.map((semitones) => rootMidi + semitones);

  // Apply Voicing Transformations
  if (voicing === 'open') {
    // Open position: spread out 2nd and 4th notes by an octave if present
    if (rawMidis.length >= 3) {
      rawMidis[1] += 12; // Move third/second up
    }
  } else if (voicing === 'drop2' && rawMidis.length >= 4) {
    // Drop 2: Drop second highest note down 1 octave
    const sorted = [...rawMidis].sort((a, b) => a - b);
    const dropIndex = sorted.length - 2;
    sorted[dropIndex] -= 12;
    rawMidis = sorted;
  } else if (voicing === 'drop3' && rawMidis.length >= 4) {
    // Drop 3: Drop third highest note down 1 octave
    const sorted = [...rawMidis].sort((a, b) => a - b);
    const dropIndex = sorted.length - 3;
    sorted[dropIndex] -= 12;
    rawMidis = sorted;
  } else if (voicing === 'rootless' && rawMidis.length >= 4) {
    // Rootless Bill Evans style (omit root, start on 3rd or 7th)
    rawMidis = rawMidis.slice(1);
    rawMidis.push(rootMidi + 14); // Add 9th
  } else if (voicing === 'quartal') {
    // Quartal voicing: built in 4ths starting from root
    rawMidis = [rootMidi, rootMidi + 5, rootMidi + 10, rootMidi + 15, rootMidi + 20];
  }

  // Sort midis ascending for clear visual rendering
  rawMidis.sort((a, b) => a - b);

  const notes: NoteInfo[] = rawMidis.map((midi) => {
    const note = midiToNoteInfo(midi);
    const semitonesFromRoot = (midi - rootMidi + 120) % 12;
    note.interval = INTERVAL_LABELS[semitonesFromRoot] || `${semitonesFromRoot}st`;
    return note;
  });

  assignFingering(notes, 60);
  return notes;
}

/**
 * Assigns fingering numbers (1=Thumb, 2=Index, 3=Middle, 4=Ring, 5=Pinky) and hand split
 */
export function assignFingering(notes: NoteInfo[], splitPointMidi = 60) {
  notes.forEach((note, idx) => {
    if (note.midi < splitPointMidi) {
      note.hand = 'LH';
      // Left hand fingers: lowest note = 5 (pinky), highest = 1 (thumb)
      note.finger = Math.min(5, Math.max(1, 5 - idx));
    } else {
      note.hand = 'RH';
      // Right hand fingers: lowest note = 1 (thumb), highest = 5 (pinky)
      note.finger = Math.min(5, Math.max(1, idx + 1));
    }
  });
}

/**
 * Generates Runway timeline sequence from active selection and texture
 */
export interface RunwayStepNote {
  timeBeats: number;
  durationBeats: number;
  notes: NoteInfo[];
}

export function generateRunwaySequence(
  rootNote: string,
  itemId: string, // Scale ID or Chord ID or Progression ID
  itemType: 'scale' | 'chord' | 'progression',
  texture: AccompanimentTexture,
  voicing: VoicingType = 'close',
  bpm = 120
): RunwayStepNote[] {
  const sequence: RunwayStepNote[] = [];

  if (itemType === 'chord') {
    const chordNotes = getChordNotes(rootNote, itemId, voicing, 4);
    if (texture === 'comping') {
      sequence.push({ timeBeats: 0, durationBeats: 2, notes: chordNotes });
      sequence.push({ timeBeats: 2, durationBeats: 2, notes: chordNotes });
      sequence.push({ timeBeats: 4, durationBeats: 4, notes: chordNotes });
    } else if (texture === 'arpeggio_asc') {
      chordNotes.forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
    } else if (texture === 'arpeggio_desc') {
      [...chordNotes].reverse().forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
    } else if (texture === 'lh_bass_rh_chord') {
      const bassNote = chordNotes[0];
      const rhNotes = chordNotes.slice(1);
      sequence.push({ timeBeats: 0, durationBeats: 2, notes: [bassNote] });
      sequence.push({ timeBeats: 0.5, durationBeats: 1.5, notes: rhNotes });
      sequence.push({ timeBeats: 2, durationBeats: 2, notes: [bassNote] });
      sequence.push({ timeBeats: 2.5, durationBeats: 1.5, notes: rhNotes });
    } else {
      // Walking bass + extensions
      const bassMidi = noteToMidi(`${rootNote}3`);
      const bass1 = midiToNoteInfo(bassMidi);
      const bass2 = midiToNoteInfo(bassMidi + 4);
      const bass3 = midiToNoteInfo(bassMidi + 7);
      sequence.push({ timeBeats: 0, durationBeats: 1, notes: [bass1] });
      sequence.push({ timeBeats: 1, durationBeats: 1, notes: chordNotes });
      sequence.push({ timeBeats: 2, durationBeats: 1, notes: [bass2] });
      sequence.push({ timeBeats: 3, durationBeats: 1, notes: [bass3] });
    }
  } else if (itemType === 'scale') {
    const scaleNotes = getScaleNotes(rootNote, itemId, 4);
    if (texture === 'arpeggio_desc') {
      [...scaleNotes].reverse().forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
    } else {
      scaleNotes.forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
    }
  } else if (itemType === 'progression') {
    const prog = PROGRESSION_PRESETS.find((p) => p.id === itemId) || PROGRESSION_PRESETS[0];
    let currentBeat = 0;

    prog.chords.forEach((c) => {
      const rootMidi = noteToMidi(`${rootNote}4`) + c.rootOffset;
      const cRoot = CHROMATIC_NOTES[((rootMidi % 12) + 12) % 12];
      const cNotes = getChordNotes(cRoot, c.chordId, voicing, Math.floor(rootMidi / 12) - 1);

      if (texture === 'comping') {
        sequence.push({ timeBeats: currentBeat, durationBeats: c.durationBeats / 2, notes: cNotes });
        sequence.push({
          timeBeats: currentBeat + c.durationBeats / 2,
          durationBeats: c.durationBeats / 2,
          notes: cNotes,
        });
      } else if (texture === 'arpeggio_asc') {
        cNotes.forEach((n, idx) => {
          sequence.push({ timeBeats: currentBeat + idx * 0.5, durationBeats: 0.5, notes: [n] });
        });
      } else {
        const bass = cNotes[0];
        const chord = cNotes.slice(1);
        sequence.push({ timeBeats: currentBeat, durationBeats: c.durationBeats, notes: [bass] });
        sequence.push({ timeBeats: currentBeat + 0.5, durationBeats: c.durationBeats - 0.5, notes: chord });
      }

      currentBeat += c.durationBeats;
    });
  }

  return sequence;
}

// --- CIRCLE OF FIFTHS DATA ---
export const CIRCLE_OF_FIFTHS: CircleKeyInfo[] = [
  {
    key: 'C',
    alterations: 0,
    accidentalsText: 'Sin alteraciones',
    relativeMinor: 'Am',
    diatonicChords: [
      { degree: 'I', chordName: 'C Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Dm7', quality: 'Minor' },
      { degree: 'iii', chordName: 'Em7', quality: 'Minor' },
      { degree: 'IV', chordName: 'F Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'G7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Am7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'B m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['G', 'F', 'Am'],
  },
  {
    key: 'G',
    alterations: 1,
    accidentalsText: '1 sostenido (F#)',
    relativeMinor: 'Em',
    diatonicChords: [
      { degree: 'I', chordName: 'G Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Am7', quality: 'Minor' },
      { degree: 'iii', chordName: 'Bm7', quality: 'Minor' },
      { degree: 'IV', chordName: 'C Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'D7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Em7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'F# m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['D', 'C', 'Em'],
  },
  {
    key: 'D',
    alterations: 2,
    accidentalsText: '2 sostenidos (F#, C#)',
    relativeMinor: 'Bm',
    diatonicChords: [
      { degree: 'I', chordName: 'D Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Em7', quality: 'Minor' },
      { degree: 'iii', chordName: 'F#m7', quality: 'Minor' },
      { degree: 'IV', chordName: 'G Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'A7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Bm7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'C# m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['A', 'G', 'Bm'],
  },
  {
    key: 'A',
    alterations: 3,
    accidentalsText: '3 sostenidos (F#, C#, G#)',
    relativeMinor: 'F#m',
    diatonicChords: [
      { degree: 'I', chordName: 'A Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Bm7', quality: 'Minor' },
      { degree: 'iii', chordName: 'C#m7', quality: 'Minor' },
      { degree: 'IV', chordName: 'D Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'E7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'F#m7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'G# m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['E', 'D', 'F#m'],
  },
  {
    key: 'E',
    alterations: 4,
    accidentalsText: '4 sostenidos (F#, C#, G#, D#)',
    relativeMinor: 'C#m',
    diatonicChords: [
      { degree: 'I', chordName: 'E Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'F#m7', quality: 'Minor' },
      { degree: 'iii', chordName: 'G#m7', quality: 'Minor' },
      { degree: 'IV', chordName: 'A Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'B7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'C#m7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'D# m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['B', 'A', 'C#m'],
  },
  {
    key: 'B',
    alterations: 5,
    accidentalsText: '5 sostenidos (F#, C#, G#, D#, A#)',
    relativeMinor: 'G#m',
    diatonicChords: [
      { degree: 'I', chordName: 'B Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'C#m7', quality: 'Minor' },
      { degree: 'iii', chordName: 'D#m7', quality: 'Minor' },
      { degree: 'IV', chordName: 'E Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'F#7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'G#m7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'A# m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['F#', 'E', 'G#m'],
  },
  {
    key: 'F#',
    alterations: 6,
    accidentalsText: '6 sostenidos / 6 bemoles (Gb)',
    relativeMinor: 'D#m',
    diatonicChords: [
      { degree: 'I', chordName: 'F# Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'G#m7', quality: 'Minor' },
      { degree: 'iii', chordName: 'A#m7', quality: 'Minor' },
      { degree: 'IV', chordName: 'B Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'C#7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'D#m7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'E# m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['Db', 'B', 'D#m'],
  },
  {
    key: 'Db',
    alterations: -5,
    accidentalsText: '5 bemoles (Bb, Eb, Ab, Db, Gb)',
    relativeMinor: 'Bbm',
    diatonicChords: [
      { degree: 'I', chordName: 'Db Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Ebm7', quality: 'Minor' },
      { degree: 'iii', chordName: 'Fm7', quality: 'Minor' },
      { degree: 'IV', chordName: 'Gb Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'Ab7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Bbm7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'C m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['Ab', 'Gb', 'Bbm'],
  },
  {
    key: 'Ab',
    alterations: -4,
    accidentalsText: '4 bemoles (Bb, Eb, Ab, Db)',
    relativeMinor: 'Fm',
    diatonicChords: [
      { degree: 'I', chordName: 'Ab Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Bbm7', quality: 'Minor' },
      { degree: 'iii', chordName: 'Cm7', quality: 'Minor' },
      { degree: 'IV', chordName: 'Db Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'Eb7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Fm7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'G m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['Eb', 'Db', 'Fm'],
  },
  {
    key: 'Eb',
    alterations: -3,
    accidentalsText: '3 bemoles (Bb, Eb, Ab)',
    relativeMinor: 'Cm',
    diatonicChords: [
      { degree: 'I', chordName: 'Eb Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Fm7', quality: 'Minor' },
      { degree: 'iii', chordName: 'Gm7', quality: 'Minor' },
      { degree: 'IV', chordName: 'Ab Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'Bb7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Cm7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'D m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['Bb', 'Ab', 'Cm'],
  },
  {
    key: 'Bb',
    alterations: -2,
    accidentalsText: '2 bemoles (Bb, Eb)',
    relativeMinor: 'Gm',
    diatonicChords: [
      { degree: 'I', chordName: 'Bb Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Cm7', quality: 'Minor' },
      { degree: 'iii', chordName: 'Dm7', quality: 'Minor' },
      { degree: 'IV', chordName: 'Eb Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'F7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Gm7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'A m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['F', 'Eb', 'Gm'],
  },
  {
    key: 'F',
    alterations: -1,
    accidentalsText: '1 bemol (Bb)',
    relativeMinor: 'Dm',
    diatonicChords: [
      { degree: 'I', chordName: 'F Maj7', quality: 'Major' },
      { degree: 'ii', chordName: 'Gm7', quality: 'Minor' },
      { degree: 'iii', chordName: 'Am7', quality: 'Minor' },
      { degree: 'IV', chordName: 'Bb Maj7', quality: 'Major' },
      { degree: 'V', chordName: 'C7', quality: 'Dominant' },
      { degree: 'vi', chordName: 'Dm7', quality: 'Minor' },
      { degree: 'vii°', chordName: 'E m7b5', quality: 'Half-Diminished' },
    ],
    neighbors: ['C', 'Bb', 'Dm'],
  },
];
