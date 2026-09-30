import { HARMONIC_VAULT, HarmonicFormula } from '@/data/harmonicVaultData';

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
export type AccompanimentTexture =
  | 'comping'
  | 'arpeggio_asc'
  | 'arpeggio_desc'
  | 'arpeggio_updown'
  | 'arpeggio_broken'
  | 'arpeggio_sweep'
  | 'lh_bass_rh_chord'
  | 'walking_bass'
  | 'alberti_bass';

export interface RunwayNoteEvent {
  id: string;
  note: string;       // Ej: 'C3', 'G3', 'C4', 'E4'
  midi: number;
  time: number;       // Tiempo en beats (0, 0.5, 1.0, 1.5...)
  step: number;       // Paso dentro del compás (0, 1, 2, 3...)
  duration: string;   // '4n', '8n', '16n', '3T', '6T'
  hand: 'left' | 'right';
  velocity?: number;
}

export type ArpeggioOctaveSpan = 1 | 2 | 3 | 4 | 'full';

export type ArpeggioMotionPattern =
  | 'up'                // Ascendente continuo (↗)
  | 'down'              // Descendente continuo (↘)
  | 'upDown'            // Ida y Vuelta / Ping-Pong (↗↘)
  | 'broken'            // Arpegio Quebrado (general)
  | 'broken_alberti'    // Patrón Alberti clásico (1 - 5 - 3 - 5)
  | 'broken_neosoul'    // Patrón Neo-Soul / Addict (1 - 3 - 5 - 7 - 9 - 7 - 5 - 3)
  | 'broken_octave'     // Salto de Octavas (Octave Displacement)
  | 'handCross';        // Manos Cruzadas / Hand-to-Hand Sweep

export type ArpeggioSubdivision = '8n' | '16n' | '3T' | '6T';
export type ArpeggioHandMode = 'left' | 'right' | 'both';

export interface BuildExtendedArpeggioNotesParams {
  rootNote: string;
  chordFormula?: string | number[] | ChordDefinition;
  chordId?: string;
  octaveSpan: ArpeggioOctaveSpan;      // 1, 2, 3, 4 o 'full'
  startOctave?: number;                // 1, 2, 3, 4...
  pattern: ArpeggioMotionPattern;      // 'up' | 'down' | 'upDown' | 'broken' | 'broken_alberti' | 'broken_neosoul' | 'broken_octave' | 'handCross'
  subdivision: ArpeggioSubdivision;    // '8n' | '16n' | '3T' | '6T'
  handMode: ArpeggioHandMode;          // 'left' | 'right' | 'both'
  keyboardRange?: KeyboardRange;       // 61 | 88
  totalBars?: number;                  // default 4 compases
}

export interface ScaleDefinition {
  id: string;
  name: string;
  category: 'major' | 'minor' | 'modes' | 'pentatonic' | 'bebop_symmetric';
  intervals: number[]; // semitones from root
  formula: string;
  description: string;
}

export type ChordFamily =
  | 'triad'
  | 'seventh'
  | 'dominant'
  | 'extended'
  | 'suspended_add'
  | 'altered_dim';

export type DominantAcousticType = 'primary' | 'suspended' | 'altered';

export interface ChordDefinition {
  id: string;
  name: string;
  symbol: string;
  category: 'triad' | 'seventh' | 'extended' | 'altered';
  family: ChordFamily;
  dominantType?: DominantAcousticType;
  formula: string;
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

// --- CHORDS & VOICINGS CATALOG (65+ ACORDES COMPLETOS) ---
export const CHORD_CATALOG: ChordDefinition[] = [
  // ==========================================
  // 1. TRÍADAS BÁSICAS & TRADICIONALES
  // ==========================================
  {
    id: 'maj',
    name: 'Tríada Mayor',
    symbol: 'Maj',
    category: 'triad',
    family: 'triad',
    formula: '1 - 3 - 5',
    intervals: [0, 4, 7],
    description: 'Tríada mayor fundamental, consonancia pura (1 - 3M - 5P).',
  },
  {
    id: 'min',
    name: 'Tríada Menor',
    symbol: 'm',
    category: 'triad',
    family: 'triad',
    formula: '1 - b3 - 5',
    intervals: [0, 3, 7],
    description: 'Tríada menor clásica, sonoridad sombría y emotiva (1 - b3 - 5P).',
  },
  {
    id: 'dim',
    name: 'Tríada Disminuida',
    symbol: 'dim',
    category: 'triad',
    family: 'triad',
    formula: '1 - b3 - b5',
    intervals: [0, 3, 6],
    description: 'Tríada disminuida con quinta bemol, inestable y tensa (1 - b3 - b5).',
  },
  {
    id: 'aug',
    name: 'Tríada Aumentada',
    symbol: 'aug',
    category: 'triad',
    family: 'triad',
    formula: '1 - 3 - #5',
    intervals: [0, 4, 8],
    description: 'Tríada aumentada simétrica con quinta sostenida (1 - 3M - #5).',
  },
  {
    id: 'power_chord',
    name: 'Quinta Vacía (Power Chord)',
    symbol: '5',
    category: 'triad',
    family: 'triad',
    formula: '1 - 5',
    intervals: [0, 7],
    description: 'Sonoridad abierta y pura sin tercera, base del Rock y Metal (1 - 5P).',
  },
  {
    id: 'flat5',
    name: 'Mayor con Quinta Disminuida',
    symbol: '(b5)',
    category: 'triad',
    family: 'triad',
    formula: '1 - 3 - b5',
    intervals: [0, 4, 6],
    description: 'Tríada inusual con tercera mayor y quinta disminuida (1 - 3M - b5).',
  },

  // ==========================================
  // 2. ACORDES SUSPENDIDOS & AGREGADOS (ADD)
  // ==========================================
  {
    id: 'sus2',
    name: 'Tríada Sus2',
    symbol: 'sus2',
    category: 'triad',
    family: 'suspended_add',
    formula: '1 - 2 - 5',
    intervals: [0, 2, 7],
    description: 'Tercera sustituida por segunda mayor, textura abierta y moderna (1 - 2M - 5P).',
  },
  {
    id: 'sus4',
    name: 'Tríada Sus4',
    symbol: 'sus4',
    category: 'triad',
    family: 'suspended_add',
    formula: '1 - 4 - 5',
    intervals: [0, 5, 7],
    description: 'Tercera sustituida por cuarta justa, tensión resolutiva a tercera (1 - 4P - 5P).',
  },
  {
    id: 'sus2sus4',
    name: 'Sus2sus4 / Cuartal',
    symbol: 'sus2sus4',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - 2 - 4 - 5',
    intervals: [0, 2, 5, 7],
    description: 'Doble suspensión contemporánea con sonoridad flotante (1 - 2M - 4P - 5P).',
  },
  {
    id: 'add9',
    name: 'Add9',
    symbol: 'add9',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - 3 - 5 - 9',
    intervals: [0, 4, 7, 14],
    description: 'Tríada mayor con color de novena añadida sin séptima (1 - 3M - 5P - 9).',
  },
  {
    id: 'madd9',
    name: 'Menor Add9',
    symbol: 'm(add9)',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - b3 - 5 - 9',
    intervals: [0, 3, 7, 14],
    description: 'Tríada menor enriquecida con la delicadeza de la novena (1 - b3 - 5P - 9).',
  },
  {
    id: 'add11',
    name: 'Add11',
    symbol: 'add11',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - 3 - 5 - 11',
    intervals: [0, 4, 7, 17],
    description: 'Tríada mayor con undécima agregada estilo Pop/Folk acústico (1 - 3M - 5P - 11).',
  },
  {
    id: 'madd11',
    name: 'Menor Add11',
    symbol: 'm(add11)',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - b3 - 5 - 11',
    intervals: [0, 3, 7, 17],
    description: 'Sonoridad menor cinematográfica con la cuarta/undécima (1 - b3 - 5P - 11).',
  },
  {
    id: 'add_sharp11',
    name: 'Add#11 (Lidio Add)',
    symbol: 'add#11',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - 3 - 5 - #11',
    intervals: [0, 4, 7, 18],
    description: 'Color lidio espacial en tríada pura sin séptima (1 - 3M - 5P - #11).',
  },
  {
    id: 'six',
    name: 'Sexta Mayor (Clásica)',
    symbol: '6',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - 3 - 5 - 6',
    intervals: [0, 4, 7, 9],
    description: 'Sexta clásica de Swing y Bossa Nova, consonancia dulce sin séptima (1 - 3M - 5P - 6M).',
  },
  {
    id: 'six_nine',
    name: 'Sexta-Novena (6/9)',
    symbol: '6/9',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - 3 - 5 - 6 - 9',
    intervals: [0, 4, 7, 9, 14],
    description: 'Acorde de reposo supremo de la Bossa Nova y Jazz Ballads (1 - 3M - 5P - 6M - 9).',
  },
  {
    id: 'six_nine_sharp11',
    name: 'Sexta-Novena (#11)',
    symbol: '6/9(#11)',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - 3 - 5 - 6 - 9 - #11',
    intervals: [0, 4, 7, 9, 14, 18],
    description: 'Extensión lidia completa sobre la base pentatónica de 6/9 (1 - 3M - 5P - 6M - 9 - #11).',
  },
  {
    id: 'm6',
    name: 'Menor Sexta Melancólica',
    symbol: 'm6',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - b3 - 5 - 6',
    intervals: [0, 3, 7, 9],
    description: 'Acorde melancólico clásico de Jazz y Tango, tónica de menor melódica (1 - b3 - 5P - 6M).',
  },
  {
    id: 'm6_9',
    name: 'Menor Sexta-Novena',
    symbol: 'm6/9',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - b3 - 5 - 6 - 9',
    intervals: [0, 3, 7, 9, 14],
    description: 'Voicing menor cinematográfico y aterciopelado (1 - b3 - 5P - 6M - 9).',
  },
  {
    id: 'm6_9_11',
    name: 'Menor 6/9 con 11',
    symbol: 'm6/9(11)',
    category: 'extended',
    family: 'suspended_add',
    formula: '1 - b3 - 5 - 6 - 9 - 11',
    intervals: [0, 3, 7, 9, 14, 17],
    description: 'Máxima riqueza modal dórica sin séptima dominante (1 - b3 - 5P - 6M - 9 - 11).',
  },

  // ==========================================
  // 3. FAMILIA MAYOR 7 (MAJ7)
  // ==========================================
  {
    id: 'maj7',
    name: 'Séptima Mayor',
    symbol: 'Maj7',
    category: 'seventh',
    family: 'seventh',
    formula: '1 - 3 - 5 - 7',
    intervals: [0, 4, 7, 11],
    description: 'Cálido, elegante y sofisticado para Jazz, Pop y R&B (1 - 3M - 5P - 7M).',
  },
  {
    id: 'maj7_sharp5',
    name: 'Séptima Mayor Aumentada',
    symbol: 'Maj7#5',
    category: 'seventh',
    family: 'seventh',
    formula: '1 - 3 - #5 - 7',
    intervals: [0, 4, 8, 11],
    description: 'Grado III de la menor armónica/melódica, tensión luminosa (1 - 3M - #5 - 7M).',
  },
  {
    id: 'maj7_flat5',
    name: 'Séptima Mayor b5',
    symbol: 'Maj7b5',
    category: 'seventh',
    family: 'seventh',
    formula: '1 - 3 - b5 - 7',
    intervals: [0, 4, 6, 11],
    description: 'Lidio condensado de 4 notas con quinta disminuida (1 - 3M - b5 - 7M).',
  },
  {
    id: 'maj9',
    name: 'Mayor 9',
    symbol: 'Maj9',
    category: 'extended',
    family: 'extended',
    formula: '1 - 3 - 5 - 7 - 9',
    intervals: [0, 4, 7, 11, 14],
    description: 'Extensión brillante y rica para baladas de Jazz y Neo-Soul (1 - 3M - 5P - 7M - 9).',
  },
  {
    id: 'maj7_sharp11',
    name: 'Mayor 7(#11) (Lidio)',
    symbol: 'Maj7#11',
    category: 'extended',
    family: 'extended',
    formula: '1 - 3 - 5 - 7 - #11',
    intervals: [0, 4, 7, 11, 18],
    description: 'Acorde representativo del modo Lidio cinematográfico (1 - 3M - 5P - 7M - #11).',
  },
  {
    id: 'maj9_sharp11',
    name: 'Mayor 9(#11)',
    symbol: 'Maj9#11',
    category: 'extended',
    family: 'extended',
    formula: '1 - 3 - 5 - 7 - 9 - #11',
    intervals: [0, 4, 7, 11, 14, 18],
    description: 'Extensión lidia completa con 9ª y #11 (1 - 3M - 5P - 7M - 9 - #11).',
  },
  {
    id: 'maj13',
    name: 'Mayor 13',
    symbol: 'Maj13',
    category: 'extended',
    family: 'extended',
    formula: '1 - 3 - 5 - 7 - 9 - 13',
    intervals: [0, 4, 7, 11, 14, 21],
    description: 'Voicing monumental de 6 voces para composiciones orquestales (1 - 3M - 5P - 7M - 9 - 13).',
  },
  {
    id: 'maj13_sharp11',
    name: 'Mayor 13(#11)',
    symbol: 'Maj13#11',
    category: 'extended',
    family: 'extended',
    formula: '1 - 3 - 5 - 7 - 9 - #11 - 13',
    intervals: [0, 4, 7, 11, 14, 18, 21],
    description: 'La máxima expresión del acorde lidio moderno (1 - 3M - 5P - 7M - 9 - #11 - 13).',
  },
  {
    id: 'maj9_sharp5',
    name: 'Mayor 9(#5)',
    symbol: 'Maj9#5',
    category: 'extended',
    family: 'extended',
    formula: '1 - 3 - #5 - 7 - 9',
    intervals: [0, 4, 8, 11, 14],
    description: 'Extensión de novena sobre acorde aumentado mayor (1 - 3M - #5 - 7M - 9).',
  },

  // ==========================================
  // 4. FAMILIA MENOR 7 (M7)
  // ==========================================
  {
    id: 'm7',
    name: 'Menor 7',
    symbol: 'm7',
    category: 'seventh',
    family: 'seventh',
    formula: '1 - b3 - 5 - b7',
    intervals: [0, 3, 7, 10],
    description: 'Tétrada menor estándar de Jazz, Funk y Neo-Soul (1 - b3 - 5P - b7).',
  },
  {
    id: 'mmaj7',
    name: 'Menor Séptima Mayor',
    symbol: 'm(Maj7)',
    category: 'seventh',
    family: 'seventh',
    formula: '1 - b3 - 5 - 7',
    intervals: [0, 3, 7, 11],
    description: 'El acorde misterioso de espías ("James Bond"), grado i de menor melódica (1 - b3 - 5P - 7M).',
  },
  {
    id: 'm7b13',
    name: 'Menor 7(b13)',
    symbol: 'm7(b13)',
    category: 'seventh',
    family: 'seventh',
    formula: '1 - b3 - 5 - b7 - b13',
    intervals: [0, 3, 7, 10, 20],
    description: 'Sonoridad eólica pura con la sexta menor/trecena bemol (1 - b3 - 5P - b7 - b13).',
  },
  {
    id: 'm9',
    name: 'Menor 9',
    symbol: 'm9',
    category: 'extended',
    family: 'extended',
    formula: '1 - b3 - 5 - b7 - 9',
    intervals: [0, 3, 7, 10, 14],
    description: 'Expresividad aterciopelada y profunda en R&B y Jazz (1 - b3 - 5P - b7 - 9).',
  },
  {
    id: 'm11',
    name: 'Menor 11',
    symbol: 'm11',
    category: 'extended',
    family: 'extended',
    formula: '1 - b3 - 5 - b7 - 9 - 11',
    intervals: [0, 3, 7, 10, 14, 17],
    description: 'Textura abierta modal sin asperezas (1 - b3 - 5P - b7 - 9 - 11).',
  },
  {
    id: 'm13',
    name: 'Menor 13',
    symbol: 'm13',
    category: 'extended',
    family: 'extended',
    formula: '1 - b3 - 5 - b7 - 9 - 11 - 13',
    intervals: [0, 3, 7, 10, 14, 17, 21],
    description: 'Acorde dórico pleno con trecena natural brillante (1 - b3 - 5P - b7 - 9 - 11 - 13).',
  },
  {
    id: 'mmaj9',
    name: 'Menor (Maj9)',
    symbol: 'm(Maj9)',
    category: 'extended',
    family: 'extended',
    formula: '1 - b3 - 5 - 7 - 9',
    intervals: [0, 3, 7, 11, 14],
    description: 'Color melódico menor enriquecido con novena (1 - b3 - 5P - 7M - 9).',
  },
  {
    id: 'mmaj11',
    name: 'Menor (Maj11)',
    symbol: 'm(Maj11)',
    category: 'extended',
    family: 'extended',
    formula: '1 - b3 - 5 - 7 - 9 - 11',
    intervals: [0, 3, 7, 11, 14, 17],
    description: 'Superposición de acordes mayores y menores en menor melódica (1 - b3 - 5P - 7M - 9 - 11).',
  },

  // ==========================================
  // 5. ACORDES DOMINANTES (CLASIFICADOS)
  // ==========================================

  // A) Dominantes Primarios & Naturales
  {
    id: 'dom7',
    name: 'Dominante 7',
    symbol: '7',
    category: 'seventh',
    family: 'dominant',
    dominantType: 'primary',
    formula: '1 - 3 - 5 - b7',
    intervals: [0, 4, 7, 10],
    description: 'Acorde dominante fundamental con tritono resolutivo (1 - 3M - 5P - b7).',
  },
  {
    id: 'dom9',
    name: 'Dominante 9',
    symbol: '9',
    category: 'extended',
    family: 'dominant',
    dominantType: 'primary',
    formula: '1 - 3 - 5 - b7 - 9',
    intervals: [0, 4, 7, 10, 14],
    description: 'Dominante extendido natural para Funk, Blues y Bossa Nova (1 - 3M - 5P - b7 - 9).',
  },
  {
    id: 'dom13',
    name: 'Dominante 13',
    symbol: '13',
    category: 'extended',
    family: 'dominant',
    dominantType: 'primary',
    formula: '1 - 3 - 5 - b7 - 9 - 13',
    intervals: [0, 4, 7, 10, 14, 21],
    description: 'Dominante completo y elegante clásico de Big Band (1 - 3M - 5P - b7 - 9 - 13).',
  },
  {
    id: 'dom11_natural',
    name: 'Dominante 11 (Gospel/Soul)',
    symbol: '11(no3)',
    category: 'extended',
    family: 'dominant',
    dominantType: 'primary',
    formula: '1 - 5 - b7 - 9 - 11',
    intervals: [0, 7, 10, 14, 17],
    description: 'Dominante sin tercera con 11ª natural, sonido Gospel y R&B (1 - 5P - b7 - 9 - 11).',
  },
  {
    id: 'dom7_add13',
    name: 'Dominante 7(add13)',
    symbol: '7(add13)',
    category: 'extended',
    family: 'dominant',
    dominantType: 'primary',
    formula: '1 - 3 - 5 - b7 - 13',
    intervals: [0, 4, 7, 10, 21],
    description: 'Dominante con trecena directa sin pasar por novena (1 - 3M - 5P - b7 - 13).',
  },

  // B) Dominantes Suspendidos / Modales
  {
    id: 'dom7sus4',
    name: 'Dominante 7sus4',
    symbol: '7sus4',
    category: 'seventh',
    family: 'dominant',
    dominantType: 'suspended',
    formula: '1 - 4 - 5 - b7',
    intervals: [0, 5, 7, 10],
    description: 'Dominante con cuarta suspendida, sonido Pop y Worship emotivo (1 - 4P - 5P - b7).',
  },
  {
    id: 'dom9sus4',
    name: 'Dominante 9sus4 (Soul Chord)',
    symbol: '9sus4',
    category: 'extended',
    family: 'dominant',
    dominantType: 'suspended',
    formula: '1 - 4 - 5 - b7 - 9',
    intervals: [0, 5, 7, 10, 14],
    description: 'El acorde por excelencia del Neo-Soul y R&B (Bb/C en Do) (1 - 4P - 5P - b7 - 9).',
  },
  {
    id: 'dom13sus4',
    name: 'Dominante 13sus4',
    symbol: '13sus4',
    category: 'extended',
    family: 'dominant',
    dominantType: 'suspended',
    formula: '1 - 4 - 5 - b7 - 9 - 13',
    intervals: [0, 5, 7, 10, 14, 21],
    description: 'Extensión suspendida majestuosa con 13ª natural (1 - 4P - 5P - b7 - 9 - 13).',
  },
  {
    id: 'dom7sus2',
    name: 'Dominante 7sus2',
    symbol: '7sus2',
    category: 'seventh',
    family: 'dominant',
    dominantType: 'suspended',
    formula: '1 - 2 - 5 - b7',
    intervals: [0, 2, 7, 10],
    description: 'Suspensión de segunda sobre séptima dominante (1 - 2M - 5P - b7).',
  },
  {
    id: 'dom7sus2sus4',
    name: 'Dominante 7sus2sus4',
    symbol: '7sus2sus4',
    category: 'extended',
    family: 'dominant',
    dominantType: 'suspended',
    formula: '1 - 2 - 4 - 5 - b7',
    intervals: [0, 2, 5, 7, 10],
    description: 'Armonía cuartal suspendida completa sobre dominante (1 - 2M - 4P - 5P - b7).',
  },

  // C) Dominantes Alterados / Jazz & Tensiones V7
  {
    id: 'dom7b9',
    name: 'Dominante 7(b9)',
    symbol: '7b9',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - b9',
    intervals: [0, 4, 7, 10, 13],
    description: 'Tensión dramática obligada para resolver al primer grado menor (1 - 3M - 5P - b7 - b9).',
  },
  {
    id: 'dom7sharp9',
    name: 'Dominante 7(#9) (Hendrix)',
    symbol: '7#9',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - #9',
    intervals: [0, 4, 7, 10, 15],
    description: 'Ambivalencia blues/rock con tercera mayor y novena aumentada (1 - 3M - 5P - b7 - #9).',
  },
  {
    id: 'dom7sharp11',
    name: 'Dominante 7(#11) (Lidio)',
    symbol: '7#11',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - #11',
    intervals: [0, 4, 7, 10, 18],
    description: 'Acorde lidio dominante para sustitutos tritonales subV7 (1 - 3M - 5P - b7 - #11).',
  },
  {
    id: 'dom7b13',
    name: 'Dominante 7(b13)',
    symbol: '7b13',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - b13',
    intervals: [0, 4, 7, 10, 20],
    description: 'Trecena bemol para resolución melancólica a acorde menor (1 - 3M - 5P - b7 - b13).',
  },
  {
    id: 'dom7sharp5',
    name: 'Dominante 7(#5)',
    symbol: '7#5',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - #5 - b7',
    intervals: [0, 4, 8, 10],
    description: 'Dominante aumentado de 4 voces con tensión pura en #5 (1 - 3M - #5 - b7).',
  },
  {
    id: 'dom7flat5',
    name: 'Dominante 7(b5)',
    symbol: '7b5',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - b5 - b7',
    intervals: [0, 4, 6, 10],
    description: 'Dominante simétrico de tonos enteros con quinta bemol (1 - 3M - b5 - b7).',
  },
  {
    id: 'dom7_b9_b13',
    name: 'Dominante 7(b9, b13)',
    symbol: '7(b9,b13)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - b7 - b9 - b13',
    intervals: [0, 4, 10, 13, 20],
    description: 'Tensión máxima para V7 hacia tónica menor en el Jazz moderno (1 - 3 - b7 - b9 - b13).',
  },
  {
    id: 'dom7_sharp9_sharp11',
    name: 'Dominante 7(#9, #11)',
    symbol: '7(#9,#11)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - b7 - #9 - #11',
    intervals: [0, 4, 10, 15, 18],
    description: 'Tensión virtuosa de Jazz Fusión y Funk moderno (1 - 3 - b7 - #9 - #11).',
  },
  {
    id: 'dom7_b9_sharp11',
    name: 'Dominante 7(b9, #11)',
    symbol: '7(b9,#11)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - b7 - b9 - #11',
    intervals: [0, 4, 10, 13, 18],
    description: 'Color simétrico disminuido con b9 y #11 simultáneas (1 - 3 - b7 - b9 - #11).',
  },
  {
    id: 'dom7_sharp9_b13',
    name: 'Dominante 7(#9, b13)',
    symbol: '7(#9,b13)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - b7 - #9 - b13',
    intervals: [0, 4, 10, 15, 20],
    description: 'Doble tensión alterada aguda con #9 y trecena bemol (1 - 3 - b7 - #9 - b13).',
  },
  {
    id: 'dom7alt',
    name: 'Dominante Alterado (7alt)',
    symbol: '7alt',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - b7 - b9 - #9 - b5 - #5',
    intervals: [0, 4, 10, 13, 15, 18, 20],
    description: 'Escala superlocria condensada: b9, #9, b5 y #5 simultáneas (1 - 3 - b7 - alt).',
  },
  {
    id: 'dom9_sharp11',
    name: 'Dominante 9(#11)',
    symbol: '9#11',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - 9 - #11',
    intervals: [0, 4, 7, 10, 14, 18],
    description: 'Dominante extendido natural con cuarta aumentada lidia (1 - 3M - 5P - b7 - 9 - #11).',
  },
  {
    id: 'dom9_b13',
    name: 'Dominante 9(b13)',
    symbol: '9(b13)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - 9 - b13',
    intervals: [0, 4, 7, 10, 14, 20],
    description: 'Novena natural combinada con trecena bemol (1 - 3M - 5P - b7 - 9 - b13).',
  },
  {
    id: 'dom13_b9',
    name: 'Dominante 13(b9)',
    symbol: '13(b9)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - b9 - 13',
    intervals: [0, 4, 7, 10, 13, 21],
    description: 'Trecena mayor brillante con novena bemol oscura (1 - 3M - 5P - b7 - b9 - 13).',
  },
  {
    id: 'dom13_sharp9',
    name: 'Dominante 13(#9)',
    symbol: '13(#9)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - #9 - 13',
    intervals: [0, 4, 7, 10, 15, 21],
    description: 'Voicing bluesero moderno con trecena y #9 (1 - 3M - 5P - b7 - #9 - 13).',
  },
  {
    id: 'dom13_sharp11',
    name: 'Dominante 13(#11)',
    symbol: '13(#11)',
    category: 'altered',
    family: 'dominant',
    dominantType: 'altered',
    formula: '1 - 3 - 5 - b7 - 9 - #11 - 13',
    intervals: [0, 4, 7, 10, 14, 18, 21],
    description: 'El acorde lidio dominante más rico y resonante (1 - 3M - 5P - b7 - 9 - #11 - 13).',
  },

  // ==========================================
  // 6. FAMILIA DISMINUIDA & SEMIDISMINUIDA
  // ==========================================
  {
    id: 'm7b5',
    name: 'Semidisminuido (m7b5)',
    symbol: 'm7b5',
    category: 'seventh',
    family: 'altered_dim',
    formula: '1 - b3 - b5 - b7',
    intervals: [0, 3, 6, 10],
    description: 'Grado ii del modo menor y locrio, medio disminuido clásico (1 - b3 - b5 - b7).',
  },
  {
    id: 'm9b5',
    name: 'Semidisminuido 9 (m9b5)',
    symbol: 'm9b5',
    category: 'extended',
    family: 'altered_dim',
    formula: '1 - b3 - b5 - b7 - 9',
    intervals: [0, 3, 6, 10, 14],
    description: 'Acorde locrio 9 natural, modo VI de la menor melódica (1 - b3 - b5 - b7 - 9).',
  },
  {
    id: 'm11b5',
    name: 'Semidisminuido 11 (m11b5)',
    symbol: 'm11b5',
    category: 'extended',
    family: 'altered_dim',
    formula: '1 - b3 - b5 - b7 - 9 - 11',
    intervals: [0, 3, 6, 10, 14, 17],
    description: 'Textura extendida de medio disminuido con undécima (1 - b3 - b5 - b7 - 9 - 11).',
  },
  {
    id: 'dim7',
    name: 'Disminuido Completo',
    symbol: 'dim7',
    category: 'seventh',
    family: 'altered_dim',
    formula: '1 - b3 - b5 - bb7',
    intervals: [0, 3, 6, 9],
    description: 'Simetría de terceras menores, 4 resoluciones dominantes posibles (1 - b3 - b5 - bb7).',
  },
  {
    id: 'dim_maj7',
    name: 'Disminuido con 7M',
    symbol: 'dim(Maj7)',
    category: 'seventh',
    family: 'altered_dim',
    formula: '1 - b3 - b5 - 7',
    intervals: [0, 3, 6, 11],
    description: 'Disminuido misterioso de séptima mayor, grado vii de menor armónica (1 - b3 - b5 - 7M).',
  },
  {
    id: 'dim7_add9',
    name: 'Disminuido 7 con 9',
    symbol: 'dim7(add9)',
    category: 'extended',
    family: 'altered_dim',
    formula: '1 - b3 - b5 - bb7 - 9',
    intervals: [0, 3, 6, 9, 14],
    description: 'Disminuido simétrico enriquecido con novena mayor (1 - b3 - b5 - bb7 - 9).',
  },
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
    const rawMatch = chord.intervals.find((st) => ((st % 12) + 12) % 12 === semitonesFromRoot);
    note.interval =
      rawMatch !== undefined && INTERVAL_LABELS[rawMatch]
        ? INTERVAL_LABELS[rawMatch]
        : INTERVAL_LABELS[semitonesFromRoot] || `${semitonesFromRoot}st`;
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
 * Transposes any HarmonicFormula from HARMONIC_VAULT to a specified root key (e.g., C, Eb, F#)
 */
export function getTransposedFormulaChords(
  formula: HarmonicFormula,
  rootNote: string,
  voicing: VoicingType = 'close'
): { roman: string; chordName: string; notes: NoteInfo[] }[] {
  const rootMidi = noteToMidi(`${rootNote}4`);

  return formula.intervalsFromRoot.map((intervals, idx) => {
    const chordRootMidi = rootMidi + (intervals[0] || 0);
    const chordRootName = CHROMATIC_NOTES[((chordRootMidi % 12) + 12) % 12];
    const typeLabel = formula.chordTypes[idx] || '';
    const chordName = `${chordRootName}${typeLabel}`;
    const roman = formula.romanNumerals[idx] || '';

    let rawMidis = intervals.map((st) => rootMidi + st);

    if (voicing === 'open' && rawMidis.length >= 3) {
      rawMidis[1] += 12;
    } else if (voicing === 'drop2' && rawMidis.length >= 4) {
      const sorted = [...rawMidis].sort((a, b) => a - b);
      sorted[sorted.length - 2] -= 12;
      rawMidis = sorted;
    } else if (voicing === 'drop3' && rawMidis.length >= 4) {
      const sorted = [...rawMidis].sort((a, b) => a - b);
      sorted[sorted.length - 3] -= 12;
      rawMidis = sorted;
    } else if (voicing === 'rootless' && rawMidis.length >= 4) {
      rawMidis = rawMidis.slice(1);
      rawMidis.push(rootMidi + (intervals[0] || 0) + 14);
    } else if (voicing === 'quartal') {
      const base = rawMidis[0] || rootMidi;
      rawMidis = [base, base + 5, base + 10, base + 15];
    }

    rawMidis.sort((a, b) => a - b);

    const notes: NoteInfo[] = rawMidis.map((midi) => {
      const note = midiToNoteInfo(midi);
      const stFromKey = (midi - rootMidi + 120) % 12;
      note.interval = INTERVAL_LABELS[stFromKey] || `${stFromKey}st`;
      return note;
    });

    assignFingering(notes, 60);

    return {
      roman,
      chordName,
      notes,
    };
  });
}

/**
 * Genera la secuencia completa de notas extendidas para el sistema de Arpegios
 * con recorrido dinámico en todo el teclado (61 y 88 teclas), soporte multi-octava,
 * subdivisiones rítmicas (8n, 16n, 3T, 6T), patrones expresivos y asignación de manos inteligente.
 */
export function buildExtendedArpeggioNotes({
  rootNote,
  chordFormula,
  chordId,
  octaveSpan,
  startOctave,
  pattern,
  subdivision,
  handMode,
  keyboardRange = 88,
  totalBars = 4,
}: BuildExtendedArpeggioNotesParams): RunwayNoteEvent[] {
  // 1. Normalizar tónica
  let cleanRoot = (rootNote || 'C').trim().toUpperCase();
  if (cleanRoot === 'DB') cleanRoot = 'C#';
  else if (cleanRoot === 'EB') cleanRoot = 'D#';
  else if (cleanRoot === 'GB') cleanRoot = 'F#';
  else if (cleanRoot === 'AB') cleanRoot = 'G#';
  else if (cleanRoot === 'BB') cleanRoot = 'A#';
  const rootIdx = CHROMATIC_NOTES.indexOf(cleanRoot);
  const validRoot = rootIdx !== -1 ? CHROMATIC_NOTES[rootIdx] : 'C';

  // 2. Extraer intervalos del acorde o fórmula
  let intervals: number[] = [0, 4, 7]; // default tríada mayor
  if (Array.isArray(chordFormula)) {
    intervals = chordFormula.map((n) => Number(n));
  } else if (chordFormula && typeof chordFormula === 'object' && 'intervals' in chordFormula) {
    intervals = [...(chordFormula as ChordDefinition).intervals];
  } else {
    const searchId = chordId || (typeof chordFormula === 'string' ? chordFormula : '');
    const foundChord = CHORD_CATALOG.find((c) => c.id === searchId || c.symbol === searchId);
    if (foundChord) {
      intervals = [...foundChord.intervals];
    } else {
      const foundScale = SCALE_CATALOG.find((s) => s.id === searchId);
      if (foundScale) {
        intervals = [...foundScale.intervals];
      } else if (typeof chordFormula === 'string' && chordFormula.includes('-')) {
        const DEGREE_MAP: { [k: string]: number } = {
          '1': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6,
          '5': 7, '#5': 8, 'b6': 8, '6': 9, 'bb7': 9, 'b7': 10, '7': 11, '8': 12,
          'b9': 13, '9': 14, '#9': 15, '11': 17, '#11': 18, 'b13': 20, '13': 21,
        };
        const tokens = chordFormula.split('-').map((t) => t.trim());
        const parsed = tokens.map((t) => DEGREE_MAP[t]).filter((n) => n !== undefined);
        if (parsed.length > 0) intervals = parsed;
      }
    }
  }

  // 3. Rango del teclado
  const is88 = keyboardRange === 88;
  const minMidi = is88 ? 21 : 36; // A0 (21) o C2 (36)
  const maxMidi = is88 ? 108 : 96; // C8 (108) o C7 (96)

  // 4. Calcular octava de inicio efectiva
  let effStartOct = startOctave !== undefined ? startOctave : 2;
  if (startOctave === undefined) {
    if (octaveSpan === 'full') {
      effStartOct = is88 ? (['A', 'A#', 'B'].includes(validRoot) ? 0 : 1) : 2;
    } else if (octaveSpan === 1) {
      effStartOct = 3;
    } else if (octaveSpan === 2) {
      effStartOct = 2;
    } else if (octaveSpan === 3) {
      effStartOct = 2;
    } else if (octaveSpan === 4) {
      effStartOct = 2;
    }
  }

  // Clampear effStartOct para que la nota inicial no sea menor que minMidi
  while (noteToMidi(`${validRoot}${effStartOct}`) < minMidi && effStartOct < 7) {
    effStartOct++;
  }

  // 5. Determinar número de octavas del recorrido
  let numOctaves = 1;
  const startMidi = noteToMidi(`${validRoot}${effStartOct}`);
  if (octaveSpan === 'full') {
    numOctaves = Math.max(1, Math.floor((maxMidi - startMidi) / 12));
  } else {
    numOctaves = typeof octaveSpan === 'number' ? octaveSpan : 2;
  }

  // 6. Construir el banco de notas ascendente a lo largo de las octavas (Linear Ascending Pool)
  const allMidis: number[] = [];
  for (let o = 0; o < numOctaves; o++) {
    const oct = effStartOct + o;
    intervals.forEach((semi) => {
      const midi = noteToMidi(`${validRoot}${oct}`) + semi;
      if (midi >= minMidi && midi <= maxMidi) {
        allMidis.push(midi);
      }
    });
  }

  // Añadir la tónica superior cumbre de cierre de octava
  const topMidi = noteToMidi(`${validRoot}${effStartOct + numOctaves}`);
  if (topMidi >= minMidi && topMidi <= maxMidi) {
    allMidis.push(topMidi);
  }

  // Eliminar duplicados y ordenar de grave a agudo
  const ascendingPool = Array.from(new Set(allMidis)).sort((a, b) => a - b);
  if (ascendingPool.length === 0) {
    ascendingPool.push(60); // C4 fallback
  }

  // 7. Generar secuencia de notas según patrón (Motion Pattern)
  interface RawArpNote {
    midi: number;
    handHint?: 'left' | 'right';
  }
  let rawSequence: RawArpNote[] = [];

  switch (pattern) {
    case 'up': {
      // Ascendente continuo (↗)
      rawSequence = ascendingPool.map((m) => ({ midi: m }));
      break;
    }

    case 'down': {
      // Descendente continuo (↘)
      rawSequence = [...ascendingPool].reverse().map((m) => ({ midi: m }));
      break;
    }

    case 'upDown': {
      // Ida y Vuelta / Ping-Pong (↗↘) sin repetir nota cumbre
      const upNotes = ascendingPool.map((m) => ({ midi: m }));
      const downNotes = ascendingPool.slice(0, -1).reverse().map((m) => ({ midi: m }));
      const smoothDown = downNotes.length > 1 ? downNotes.slice(0, -1) : downNotes;
      rawSequence = [...upNotes, ...smoothDown];
      break;
    }

    case 'broken_alberti':
    case 'broken': {
      // Patrón Alberti clásico (1 - 5 - 3 - 5) a lo largo de las octavas
      for (let o = 0; o < numOctaves; o++) {
        const oct = effStartOct + o;
        const rootM = noteToMidi(`${validRoot}${oct}`);
        const thirdM = intervals.length >= 2 ? rootM + intervals[1] : rootM + 4;
        const fifthM = intervals.length >= 3 ? rootM + intervals[2] : rootM + 7;

        [rootM, fifthM, thirdM, fifthM].forEach((m) => {
          if (m >= minMidi && m <= maxMidi) {
            rawSequence.push({ midi: m });
          }
        });
      }
      break;
    }

    case 'broken_neosoul': {
      // Patrón Neo-Soul / Addict (1 - 3 - 5 - 7 - 9 - 7 - 5 - 3)
      for (let o = 0; o < numOctaves; o++) {
        const oct = effStartOct + o;
        const rootM = noteToMidi(`${validRoot}${oct}`);
        const thirdM = intervals.length >= 2 ? rootM + intervals[1] : rootM + 4;
        const fifthM = intervals.length >= 3 ? rootM + intervals[2] : rootM + 7;
        const seventhM = intervals.length >= 4 ? rootM + intervals[3] : rootM + 10;
        const ninthM = intervals.length >= 5 ? rootM + intervals[4] : rootM + 14;

        [rootM, thirdM, fifthM, seventhM, ninthM, seventhM, fifthM, thirdM].forEach((m) => {
          if (m >= minMidi && m <= maxMidi) {
            rawSequence.push({ midi: m });
          }
        });
      }
      break;
    }

    case 'broken_octave': {
      // Salto de Octavas (Octave Displacement): Salta entre octava grave y media/aguda alternadamente
      ascendingPool.forEach((m) => {
        rawSequence.push({ midi: m });
        const jumped = m + 12 <= maxMidi ? m + 12 : m - 12 >= minMidi ? m - 12 : m;
        if (jumped !== m) {
          rawSequence.push({ midi: jumped });
        }
      });
      break;
    }

    case 'handCross': {
      // Manos Cruzadas / Hand-to-Hand Sweep:
      // Distribución automática: Mano izquierda ejecuta el bajo y fundamental,
      // mano derecha toma tercera y quinta, y se van turnando en cascada ascendente.
      for (let o = 0; o < numOctaves; o++) {
        const oct = effStartOct + o;
        const rootM = noteToMidi(`${validRoot}${oct}`);
        const thirdM = intervals.length >= 2 ? rootM + intervals[1] : rootM + 4;
        const fifthM = intervals.length >= 3 ? rootM + intervals[2] : rootM + 7;
        const upperRootM = rootM + 12;

        // LH: Bajo y fundamental
        if (rootM >= minMidi && rootM <= maxMidi) {
          rawSequence.push({ midi: rootM, handHint: 'left' });
        }
        // RH: Tercera y quinta
        if (thirdM >= minMidi && thirdM <= maxMidi) {
          rawSequence.push({ midi: thirdM, handHint: 'right' });
        }
        if (fifthM >= minMidi && fifthM <= maxMidi) {
          rawSequence.push({ midi: fifthM, handHint: 'right' });
        }
        // LH: Cruza por encima de RH tomando la fundamental superior
        if (upperRootM >= minMidi && upperRootM <= maxMidi) {
          rawSequence.push({ midi: upperRootM, handHint: 'left' });
        }
      }
      break;
    }

    default: {
      rawSequence = ascendingPool.map((m) => ({ midi: m }));
    }
  }

  if (rawSequence.length === 0) {
    rawSequence = [{ midi: 60 }];
  }

  // 8. Subdivisión rítmica y espaciado temporal en beats
  let stepBeats = 0.5; // '8n'
  if (subdivision === '16n') stepBeats = 0.25;
  else if (subdivision === '3T') stepBeats = 1 / 3;
  else if (subdivision === '6T') stepBeats = 1 / 6;

  // 9. Completar el tiempo deseado en compases (totalBars)
  const targetTotalBeats = Math.max(8, (totalBars || 4) * 4);
  const beatsPerLoop = rawSequence.length * stepBeats;
  const numLoops = Math.max(1, Math.ceil(targetTotalBeats / beatsPerLoop));

  const events: RunwayNoteEvent[] = [];
  let noteCounter = 0;

  for (let l = 0; l < numLoops; l++) {
    for (let i = 0; i < rawSequence.length; i++) {
      const item = rawSequence[i];
      const time = noteCounter * stepBeats;
      if (time >= targetTotalBeats) break;

      // Asignación pedagógica de mano:
      let assignedHand: 'left' | 'right' = 'right';
      if (handMode === 'left') {
        assignedHand = 'left';
      } else if (handMode === 'right') {
        assignedHand = 'right';
      } else {
        // handMode === 'both': notas < C4 (MIDI 60) a LH (violeta/índigo), >= C4 a RH (cyan)
        if (item.handHint) {
          assignedHand = item.handHint;
        } else {
          assignedHand = item.midi < 60 ? 'left' : 'right';
        }
      }

      const info = midiToNoteInfo(item.midi);
      events.push({
        id: `arp_${pattern}_${l}_${i}_${item.midi}_${time.toFixed(4)}`,
        note: info.fullNote,
        midi: item.midi,
        time: Number(time.toFixed(4)),
        step: Math.floor((time % 4) / stepBeats),
        duration: subdivision,
        hand: assignedHand,
        velocity: 0.85,
      });

      noteCounter++;
    }
  }

  return events;
}

export interface UnifiedExecutionConfig {
  mode: 'block' | 'arpeggio';
  voicingType?: VoicingType;
  octaveSpan?: ArpeggioOctaveSpan;
  pattern?: ArpeggioMotionPattern;
  subdivision?: ArpeggioSubdivision;
  handMode?: ArpeggioHandMode;
  startOctave?: number;
  keyboardRange?: KeyboardRange;
  totalBars?: number;
}

export function buildUnifiedExecutionEvents({
  rootNote,
  category,
  targetItemId,
  config,
}: {
  rootNote: string;
  category: 'scale' | 'chord' | 'progression' | 'cadencia' | 'progresion';
  targetItemId: string;
  config: UnifiedExecutionConfig;
}): RunwayNoteEvent[] {
  const isArpeggio = config.mode === 'arpeggio';
  const octaveSpan = config.octaveSpan || 2;
  const pattern = config.pattern || 'up';
  const subdivision = config.subdivision || '16n';
  const handMode = config.handMode || 'both';
  const keyboardRange = config.keyboardRange || 88;
  const totalBars = config.totalBars || 4;
  const voicingType = config.voicingType || 'close';

  // 1. CHORD
  if (category === 'chord') {
    if (isArpeggio) {
      return buildExtendedArpeggioNotes({
        rootNote,
        chordId: targetItemId,
        octaveSpan,
        startOctave: config.startOctave,
        pattern,
        subdivision,
        handMode,
        keyboardRange,
        totalBars,
      });
    }

    // Block comping
    const chordNotes = getChordNotes(rootNote, targetItemId, voicingType, 4);
    const events: RunwayNoteEvent[] = [];
    const totalBeats = totalBars * 4;
    for (let beat = 0; beat < totalBeats; beat += 4) {
      [0, 2].forEach((offset) => {
        chordNotes.forEach((n) => {
          let assignedHand: 'left' | 'right' = 'right';
          if (handMode === 'left') assignedHand = 'left';
          else if (handMode === 'right') assignedHand = 'right';
          else assignedHand = n.midi < 60 ? 'left' : 'right';

          events.push({
            id: `blk_c_${beat}_${offset}_${n.midi}`,
            note: n.fullNote,
            midi: n.midi,
            time: beat + offset,
            step: Math.floor(((beat + offset) % 4) / 0.5),
            duration: '2n',
            hand: assignedHand,
            velocity: 0.85,
          });
        });
      });
    }
    return events;
  }

  // 2. SCALE
  if (category === 'scale') {
    const scale = SCALE_CATALOG.find((s) => s.id === targetItemId) || SCALE_CATALOG[0];
    if (isArpeggio) {
      return buildExtendedArpeggioNotes({
        rootNote,
        chordFormula: scale.intervals,
        octaveSpan,
        startOctave: config.startOctave,
        pattern,
        subdivision,
        handMode,
        keyboardRange,
        totalBars,
      });
    }

    // Block: scale chord degrees
    const scaleNotes = getScaleNotes(rootNote, targetItemId, 4);
    const events: RunwayNoteEvent[] = [];
    const totalBeats = totalBars * 4;
    for (let beat = 0; beat < totalBeats; beat += 4) {
      [0, 2].forEach((offset) => {
        scaleNotes.slice(0, 5).forEach((n) => {
          let assignedHand: 'left' | 'right' = 'right';
          if (handMode === 'left') assignedHand = 'left';
          else if (handMode === 'right') assignedHand = 'right';
          else assignedHand = n.midi < 60 ? 'left' : 'right';

          events.push({
            id: `blk_s_${beat}_${offset}_${n.midi}`,
            note: n.fullNote,
            midi: n.midi,
            time: beat + offset,
            step: Math.floor(((beat + offset) % 4) / 0.5),
            duration: '2n',
            hand: assignedHand,
            velocity: 0.85,
          });
        });
      });
    }
    return events;
  }

  // 3. PROGRESSION / CADENCIA
  const vaultFormula = HARMONIC_VAULT.find((f) => f.id === targetItemId);
  if (vaultFormula) {
    const transposedChords = getTransposedFormulaChords(vaultFormula, rootNote, voicingType);
    const events: RunwayNoteEvent[] = [];
    let currentBeat = 0;
    const durationPerChord = 4; // 1 compás por acorde

    if (isArpeggio) {
      transposedChords.forEach((chordData, chordIdx) => {
        const rootM = chordData.notes[0]?.midi || 60;
        const intervals = chordData.notes.map((n) => n.midi - rootM);
        const chordArpEvents = buildExtendedArpeggioNotes({
          rootNote: chordData.notes[0]?.name || rootNote,
          chordFormula: intervals.length > 0 ? intervals : [0, 4, 7],
          octaveSpan,
          startOctave: config.startOctave,
          pattern,
          subdivision,
          handMode,
          keyboardRange,
          totalBars: 1,
        });

        chordArpEvents.forEach((ev) => {
          if (ev.time < durationPerChord) {
            events.push({
              ...ev,
              id: `${ev.id}_c${chordIdx}`,
              time: Number((currentBeat + ev.time).toFixed(4)),
            });
          }
        });
        currentBeat += durationPerChord;
      });
      return events;
    }

    // Block comping for progression
    transposedChords.forEach((chordData, chordIdx) => {
      const cNotes = chordData.notes;
      [0, 2].forEach((offset) => {
        cNotes.forEach((n) => {
          let assignedHand: 'left' | 'right' = 'right';
          if (handMode === 'left') assignedHand = 'left';
          else if (handMode === 'right') assignedHand = 'right';
          else assignedHand = n.midi < 60 ? 'left' : 'right';

          events.push({
            id: `blk_v_${chordIdx}_${offset}_${n.midi}`,
            note: n.fullNote,
            midi: n.midi,
            time: currentBeat + offset,
            step: Math.floor(((currentBeat + offset) % 4) / 0.5),
            duration: '2n',
            hand: assignedHand,
            velocity: 0.85,
          });
        });
      });
      currentBeat += durationPerChord;
    });
    return events;
  }

  // Fallback for PROGRESSION_PRESETS
  const prog = PROGRESSION_PRESETS.find((p) => p.id === targetItemId) || PROGRESSION_PRESETS[0];
  const events: RunwayNoteEvent[] = [];
  let currentBeat = 0;

  prog.chords.forEach((c, chordIdx) => {
    const rootMidi = noteToMidi(`${rootNote}4`) + c.rootOffset;
    const cRoot = CHROMATIC_NOTES[((rootMidi % 12) + 12) % 12];
    const cNotes = getChordNotes(cRoot, c.chordId, voicingType, Math.floor(rootMidi / 12) - 1);

    if (isArpeggio) {
      const chordArpEvents = buildExtendedArpeggioNotes({
        rootNote: cRoot,
        chordId: c.chordId,
        octaveSpan,
        startOctave: config.startOctave,
        pattern,
        subdivision,
        handMode,
        keyboardRange,
        totalBars: Math.max(1, Math.round(c.durationBeats / 4)),
      });

      chordArpEvents.forEach((ev) => {
        if (ev.time < c.durationBeats) {
          events.push({
            ...ev,
            id: `${ev.id}_p${chordIdx}`,
            time: Number((currentBeat + ev.time).toFixed(4)),
          });
        }
      });
    } else {
      [0, c.durationBeats / 2].forEach((offset) => {
        cNotes.forEach((n) => {
          let assignedHand: 'left' | 'right' = 'right';
          if (handMode === 'left') assignedHand = 'left';
          else if (handMode === 'right') assignedHand = 'right';
          else assignedHand = n.midi < 60 ? 'left' : 'right';

          events.push({
            id: `blk_p_${chordIdx}_${offset}_${n.midi}`,
            note: n.fullNote,
            midi: n.midi,
            time: currentBeat + offset,
            step: Math.floor(((currentBeat + offset) % 4) / 0.5),
            duration: `${Math.round(c.durationBeats / 2)}n`,
            hand: assignedHand,
            velocity: 0.85,
          });
        });
      });
    }
    currentBeat += c.durationBeats;
  });

  return events;
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
  itemId: string, // Scale ID, Chord ID, Progression ID or HarmonicFormula ID
  itemType: 'scale' | 'chord' | 'progression' | 'cadencia' | 'progresion',
  texture: AccompanimentTexture,
  voicing: VoicingType = 'close',
  bpm = 120
): RunwayStepNote[] {
  const sequence: RunwayStepNote[] = [];

  // Check if itemId exists in HARMONIC_VAULT first
  const vaultFormula = HARMONIC_VAULT.find((f) => f.id === itemId);
  if (vaultFormula) {
    const transposedChords = getTransposedFormulaChords(vaultFormula, rootNote, voicing);
    let currentBeat = 0;
    const durationPerChord = 4;

    transposedChords.forEach((c) => {
      const cNotes = c.notes;
      if (texture === 'comping') {
        sequence.push({ timeBeats: currentBeat, durationBeats: 2, notes: cNotes });
        sequence.push({ timeBeats: currentBeat + 2, durationBeats: 2, notes: cNotes });
      } else if (texture === 'arpeggio_asc') {
        cNotes.forEach((n, idx) => {
          sequence.push({ timeBeats: currentBeat + idx * 0.5, durationBeats: 0.5, notes: [n] });
        });
      } else if (texture === 'arpeggio_desc') {
        [...cNotes].reverse().forEach((n, idx) => {
          sequence.push({ timeBeats: currentBeat + idx * 0.5, durationBeats: 0.5, notes: [n] });
        });
      } else if (texture === 'lh_bass_rh_chord') {
        const bass = cNotes[0];
        const chord = cNotes.slice(1);
        sequence.push({ timeBeats: currentBeat, durationBeats: 2, notes: [bass] });
        sequence.push({ timeBeats: currentBeat + 0.5, durationBeats: 1.5, notes: chord });
        sequence.push({ timeBeats: currentBeat + 2, durationBeats: 2, notes: [bass] });
        sequence.push({ timeBeats: currentBeat + 2.5, durationBeats: 1.5, notes: chord });
      } else if (texture === 'alberti_bass') {
        const root = cNotes[0];
        const fifth = cNotes.length >= 3 ? cNotes[2] : (cNotes.length >= 2 ? cNotes[1] : cNotes[0]);
        const third = cNotes.length >= 2 ? cNotes[1] : cNotes[0];
        [root, fifth, third, fifth, root, fifth, third, fifth].forEach((n, idx) => {
          sequence.push({ timeBeats: currentBeat + idx * 0.5, durationBeats: 0.5, notes: [n] });
        });
      } else {
        // Walking bass
        const bass = cNotes[0];
        const chord = cNotes.slice(1);
        sequence.push({ timeBeats: currentBeat, durationBeats: 1, notes: [bass] });
        sequence.push({ timeBeats: currentBeat + 1, durationBeats: 1, notes: chord });
        sequence.push({ timeBeats: currentBeat + 2, durationBeats: 1, notes: [bass] });
        sequence.push({ timeBeats: currentBeat + 3, durationBeats: 1, notes: chord });
      }

      currentBeat += durationPerChord;
    });

    return sequence;
  }

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
    } else if (texture === 'alberti_bass') {
      const root = chordNotes[0];
      const fifth = chordNotes.length >= 3 ? chordNotes[2] : (chordNotes.length >= 2 ? chordNotes[1] : chordNotes[0]);
      const third = chordNotes.length >= 2 ? chordNotes[1] : chordNotes[0];
      [root, fifth, third, fifth, root, fifth, third, fifth].forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
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
    if (texture === 'alberti_bass') {
      const root = scaleNotes[0];
      const third = scaleNotes.length >= 3 ? scaleNotes[2] : scaleNotes[0];
      const fifth = scaleNotes.length >= 5 ? scaleNotes[4] : (scaleNotes.length >= 3 ? scaleNotes[2] : scaleNotes[0]);
      [root, fifth, third, fifth, root, fifth, third, fifth].forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
    } else if (texture === 'arpeggio_desc') {
      [...scaleNotes].reverse().forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
    } else {
      scaleNotes.forEach((n, i) => {
        sequence.push({ timeBeats: i * 0.5, durationBeats: 0.5, notes: [n] });
      });
    }
  } else if (itemType === 'progression' || itemType === 'progresion') {
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
      } else if (texture === 'alberti_bass') {
        const root = cNotes[0];
        const fifth = cNotes.length >= 3 ? cNotes[2] : (cNotes.length >= 2 ? cNotes[1] : cNotes[0]);
        const third = cNotes.length >= 2 ? cNotes[1] : cNotes[0];
        const count = Math.max(1, Math.floor(c.durationBeats / 2));
        for (let rep = 0; rep < count; rep++) {
          [root, fifth, third, fifth].forEach((n, idx) => {
            sequence.push({ timeBeats: currentBeat + rep * 2 + idx * 0.5, durationBeats: 0.5, notes: [n] });
          });
        }
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
