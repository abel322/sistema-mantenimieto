import { GrooveCategory, GroovePattern, GrooveHit, DrumMeasure, DrumBeat, DrumStep, DrumPieceId, DrumHit } from '@/types/drum';

// --- Concise Hit Builder Helpers for Musical Cleanliness ---
const k = (accent = false): GrooveHit => ({ instrument: 'kick', accent });
const s = (accent = false, ghost = false, flam = false): GrooveHit => ({ instrument: 'snare', accent, ghost, flam });
const sg = (): GrooveHit => ({ instrument: 'snare', ghost: true });
const sa = (): GrooveHit => ({ instrument: 'snare', accent: true });
const h = (accent = false): GrooveHit => ({ instrument: 'hihat', accent });
const ha = (): GrooveHit => ({ instrument: 'hihat', accent: true });
const ho = (): GrooveHit => ({ instrument: 'hihatOpen' });
const hf = (): GrooveHit => ({ instrument: 'hihatFoot' });
const r = (accent = false): GrooveHit => ({ instrument: 'ride', accent });
const ra = (): GrooveHit => ({ instrument: 'ride', accent: true });
const cr = (accent = false): GrooveHit => ({ instrument: 'crash', accent });
const t1 = (accent = false): GrooveHit => ({ instrument: 'tom1', accent });
const t2 = (accent = false): GrooveHit => ({ instrument: 'tom2', accent });
const ft = (accent = false): GrooveHit => ({ instrument: 'floorTom', accent });
const cb = (accent = false): GrooveHit => ({ instrument: 'cowbell', accent });
const ch = (accent = false): GrooveHit => ({ instrument: 'china', accent });

// Helper to construct a measure from beats
function m(beats: GrooveHit[][][]) {
  return {
    beats: beats.map((b) => ({ subdivisions: b })),
  };
}

export const GROOVE_CATEGORIES: Array<{
  id: GrooveCategory;
  label: string;
  description: string;
  color: string;
  badge: string;
}> = [
  {
    id: 'Rock & Metal',
    label: 'Rock & Metal',
    description: 'Bases contundentes, dobles bombos, blast beats y compases de rock puro',
    color: '#EF4444',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  {
    id: 'Funk & Gospel',
    label: 'Funk & Gospel',
    description: 'Ghost notes, grooves lineales, síncopas de bolsillo y gospel chops',
    color: '#F59E0B',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'Hip-Hop & Electronic',
    label: 'Hip-Hop & Electronic',
    description: 'Boom-bap, swing Dilla, trap rolls, drill, phonk y beats electrónicos',
    color: '#8B5CF6',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'Latin & World',
    label: 'Latin & World',
    description: 'Bossa, samba, baiao, mambo, songo, bembe afrocubano y reggae one-drop',
    color: '#10B981',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'Jazz & Blues',
    label: 'Jazz & Blues',
    description: 'Ride swing estándar, bebop, half-time shuffles, Chicago blues y New Orleans',
    color: '#06B6D4',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'Prog & Odd-Meter',
    label: 'Prog & Odd-Meter',
    description: 'Amalgamas en 5/4, 7/4, 7/8, 9/8, 11/8, polirritmias y modulaciones',
    color: '#EC4899',
    badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  },
];

export const GROOVES_DATA: GroovePattern[] = [
  // ==========================================
  // 1. ROCK & METAL (16 Patrones)
  // ==========================================
  {
    id: 'rock-straight-8th',
    name: 'Straight 8th Rock',
    category: 'Rock & Metal',
    subCategory: 'Classic Rock',
    difficulty: 'Principiante',
    suggestedBpm: 110,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'El pilar fundamental de la batería moderna: charles en corcheas con bombo en 1 y 3, caja en 2 y 4.',
    measures: [
      m([
        [[k(true), h()], [h()]],
        [[sa(), h()], [h()]],
        [[k(true), h()], [h()]],
        [[sa(), h()], [h()]],
      ]),
    ],
  },
  {
    id: 'rock-straight-16th',
    name: 'Straight 16th Rock',
    category: 'Rock & Metal',
    subCategory: 'Classic Rock',
    difficulty: 'Intermedio',
    suggestedBpm: 95,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Charles en semicorcheas a dos manos (R-L-R-L) con bombo sincopado en tiempo 1 y contratiempo de 3.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [h()]],
        [[sa(), h()], [h()], [h()], [h()]],
        [[k(), h()], [h()], [k(), h()], [h()]],
        [[sa(), h()], [h()], [h()], [h()]],
      ]),
    ],
  },
  {
    id: 'rock-four-on-floor',
    name: 'Four-on-the-Floor',
    category: 'Rock & Metal',
    subCategory: 'Dance Rock',
    difficulty: 'Principiante',
    suggestedBpm: 120,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Bombo en las 4 negras, caja en 2 y 4 con charles abriendo en los contratiempos "&" (upbeat open hats).',
    measures: [
      m([
        [[k(true), h()], [h()], [k(), ho()], [h()]],
        [[k(true), sa(), h()], [h()], [k(), ho()], [h()]],
        [[k(true), h()], [h()], [k(), ho()], [h()]],
        [[k(true), sa(), h()], [h()], [k(), ho()], [h()]],
      ]),
    ],
  },
  {
    id: 'rock-half-time',
    name: 'Half-Time Rock',
    category: 'Rock & Metal',
    subCategory: 'Heavy Rock',
    difficulty: 'Intermedio',
    suggestedBpm: 130,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Sensación de medio tiempo pesada: la caja aterriza únicamente en el tiempo 3 con bombos acentuados en 1 y 2&.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [k()]],
        [[h()], [h()], [k(true), h()], [h()]],
        [[sa(), h()], [h()], [h()], [h()]],
        [[h()], [k()], [h()], [h()]],
      ]),
    ],
  },
  {
    id: 'rock-punk-fast-8th',
    name: 'Punk Fast 8th',
    category: 'Rock & Metal',
    subCategory: 'Punk',
    difficulty: 'Intermedio',
    suggestedBpm: 185,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Tempo punk trepidante: bombo en 1 y 2&, caja precisa en 2 y 4 con charles entreabierto contundente.',
    measures: [
      m([
        [[k(true), ho()], [ho()]],
        [[sa(), ho()], [k(), ho()]],
        [[k(true), ho()], [ho()]],
        [[sa(), ho()], [k(), ho()]],
      ]),
    ],
  },
  {
    id: 'rock-grunge-offbeat',
    name: 'Grunge Offbeat',
    category: 'Rock & Metal',
    subCategory: 'Grunge',
    difficulty: 'Intermedio',
    suggestedBpm: 116,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Estilo Seattle 90s (Nirvana/Soundgarden): bombos arrastrados a contratiempo y crash acentuando el ataque.',
    measures: [
      m([
        [[cr(true), k(true)], [h()], [h()], [k()]],
        [[sa(), h()], [h()], [k(), h()], [h()]],
        [[h()], [k()], [k(), h()], [h()]],
        [[sa(), h()], [h()], [k(), ho()], [h()]],
      ]),
    ],
  },
  {
    id: 'rock-bonham-stomp',
    name: 'Bonham Stomp',
    category: 'Rock & Metal',
    subCategory: 'Classic Rock',
    difficulty: 'Avanzado',
    suggestedBpm: 72,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Homenaje a John Bonham (When the Levee Breaks): bombo arrastrado en 1 y 1e con caja retrasada y splash de pie.',
    measures: [
      m([
        [[k(true), h()], [k()], [h()], [h()]],
        [[sa(), h()], [h()], [hf()], [k()]],
        [[k(true), h()], [h()], [k(), h()], [h()]],
        [[sa(), h()], [h()], [hf()], [h()]],
      ]),
    ],
  },
  {
    id: 'rock-tribal-toms',
    name: 'Tribal Toms Groove',
    category: 'Rock & Metal',
    subCategory: 'Alternative',
    difficulty: 'Intermedio',
    suggestedBpm: 104,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Groove hipnótico en toms sin platillos: floor tom y rack toms dialogan sobre bombo continuo en negras.',
    measures: [
      m([
        [[k(true), ft(true)], [ft()], [t1()], [ft()]],
        [[k(true), t2(true)], [ft()], [t1()], [t2()]],
        [[k(true), ft(true)], [ft()], [t1()], [ft()]],
        [[k(true), t2(true)], [ft()], [t1(true)], [ft()]],
      ]),
    ],
  },
  {
    id: 'metal-double-bass-stream',
    name: 'Double-Bass Stream',
    category: 'Rock & Metal',
    subCategory: 'Metal/Double-Bass',
    difficulty: 'Avanzado',
    suggestedBpm: 140,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Torrente continuo de semicorcheas en doble pedal con ride marcando corcheas y caja en 2 y 4.',
    measures: [
      m([
        [[k(true), r()], [k()], [k(), r()], [k()]],
        [[k(true), sa(), r()], [k()], [k(), r()], [k()]],
        [[k(true), r()], [k()], [k(), r()], [k()]],
        [[k(true), sa(), r()], [k()], [k(), r()], [k()]],
      ]),
    ],
  },
  {
    id: 'metal-gallop',
    name: 'Gallop Metal',
    category: 'Rock & Metal',
    subCategory: 'Heavy Metal',
    difficulty: 'Intermedio',
    suggestedBpm: 132,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Patrón de galope clásico (Iron Maiden): bombo en corchea + 2 semicorcheas (1 . & a) con caja cortante.',
    measures: [
      m([
        [[k(true), h()], [], [k(), h()], [k()]],
        [[sa(), h()], [], [k(), h()], [k()]],
        [[k(true), h()], [], [k(), h()], [k()]],
        [[sa(), h()], [], [k(), h()], [k()]],
      ]),
    ],
  },
  {
    id: 'metal-meshuggah-polyrhythm',
    name: 'Polyrhythmic Meshuggah',
    category: 'Rock & Metal',
    subCategory: 'Djent/Math-Metal',
    difficulty: 'Virtuoso',
    suggestedBpm: 115,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Polirritmia djent sobre 4/4: bombo en agrupaciones sincopadas 3-3-3-3-2-2 con china en corcheas constantes.',
    measures: [
      m([
        [[ch(true), k(true)], [], [], [ch(), k()]],
        [[], [], [ch(true), sa(), k()], []],
        [[], [ch(), k()], [], []],
        [[ch(true), k()], [], [ch(), sa(), k()], []],
      ]),
    ],
  },
  {
    id: 'metal-blast-beat-trad',
    name: 'Blast Beat Tradicional',
    category: 'Rock & Metal',
    subCategory: 'Death/Grind',
    difficulty: 'Avanzado',
    suggestedBpm: 190,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Blast beat alternado hiperveloz: bombo y ride en tiempos fuertes, caja en contratiempos continuos.',
    measures: [
      m([
        [[k(true), r(true)], [sa()], [k(), r()], [sa()]],
        [[k(true), r(true)], [sa()], [k(), r()], [sa()]],
        [[k(true), r(true)], [sa()], [k(), r()], [sa()]],
        [[k(true), r(true)], [sa()], [k(), r()], [sa()]],
      ]),
    ],
  },
  {
    id: 'metal-gravity-blast',
    name: 'Gravity Blast',
    category: 'Rock & Metal',
    subCategory: 'Extreme Metal',
    difficulty: 'Virtuoso',
    suggestedBpm: 210,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Ataque percusivo implacable: bombo, caja y platillo impactando en sincronía en cada semicorchea.',
    measures: [
      m([
        [[k(true), sa(), ch(true)], [k(), sa()], [k(), sa(), ch()], [k(), sa()]],
        [[k(true), sa(), ch(true)], [k(), sa()], [k(), sa(), ch()], [k(), sa()]],
        [[k(true), sa(), ch(true)], [k(), sa()], [k(), sa(), ch()], [k(), sa()]],
        [[k(true), sa(), ch(true)], [k(), sa()], [k(), sa(), ch()], [k(), sa()]],
      ]),
    ],
  },
  {
    id: 'metal-metalcore-breakdown',
    name: 'Metalcore Breakdown',
    category: 'Rock & Metal',
    subCategory: 'Metalcore',
    difficulty: 'Intermedio',
    suggestedBpm: 135,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Breakdown staccato demoledor: china en negras, caja pesada en tiempo 3 y bombo polirrítmico con silencios.',
    measures: [
      m([
        [[ch(true), k(true)], [k()], [], [k()]],
        [[ch(true), k()], [], [k()], []],
        [[ch(true), sa()], [], [k()], [k()]],
        [[ch(true), k()], [], [k()], []],
      ]),
    ],
  },
  {
    id: 'metal-thrash-skank',
    name: 'Thrash Skank Beat',
    category: 'Rock & Metal',
    subCategory: 'Thrash Metal',
    difficulty: 'Avanzado',
    suggestedBpm: 195,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Skank beat agresivo estilo Slayer: kick en 1 y 2, caja en 1& y 2& a máxima propulsión.',
    measures: [
      m([
        [[k(true), h()], [], [sa(), h()], []],
        [[k(true), h()], [], [sa(), h()], []],
        [[k(true), h()], [], [sa(), h()], []],
        [[k(true), h()], [], [sa(), h()], []],
      ]),
    ],
  },
  {
    id: 'metal-doom-6-8',
    name: 'Doom Metal 6/8',
    category: 'Rock & Metal',
    subCategory: 'Doom/Stoner',
    difficulty: 'Intermedio',
    suggestedBpm: 60,
    timeSignature: '6/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Métrica en 6/8 de tempo ultra lento, bombo oscuro en 1 y 5 con caja aplastante en el pulso 4.',
    measures: [
      m([
        [[cr(true), k(true)]],
        [[r()]],
        [[r()]],
        [[sa(), r(true)]],
        [[k(), r()]],
        [[r()]],
      ]),
    ],
  },

  // ==========================================
  // 2. FUNK & GOSPEL (14 Patrones)
  // ==========================================
  {
    id: 'funk-funky-drummer',
    name: 'Funky Drummer',
    category: 'Funk & Gospel',
    subCategory: 'Classic Funk',
    difficulty: 'Avanzado',
    suggestedBpm: 98,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Clyde Stubblefield (James Brown): el beat más sampleado de la historia con ghost notes dinámicas y hi-hat abierto.',
    measures: [
      m([
        [[k(true), h()], [h()], [sg(), h()], [h()]],
        [[sa(), h()], [h()], [sg(), h()], [ho()]],
        [[k(true), h()], [h()], [sg(), h()], [sg(), h()]],
        [[sa(), h()], [sg(), h()], [sg(), h()], [sg(), ho()]],
      ]),
    ],
  },
  {
    id: 'funk-cold-sweat',
    name: 'Cold Sweat',
    category: 'Funk & Gospel',
    subCategory: 'Funk Origin',
    difficulty: 'Intermedio',
    suggestedBpm: 110,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'La cuna del funk: síncopa de bombo anticipada y caja respondiendo con precisión milimétrica.',
    measures: [
      m([
        [[k(true), h()], [h()], [k(), h()], [h()]],
        [[sa(), h()], [h()], [h()], [k()]],
        [[h()], [k(), h()], [h()], [h()]],
        [[sa(), h()], [h()], [k(), ho()], [h()]],
      ]),
    ],
  },
  {
    id: 'funk-tower-of-power',
    name: 'Tower of Power Linear',
    category: 'Funk & Gospel',
    subCategory: 'Linear Funk',
    difficulty: 'Virtuoso',
    suggestedBpm: 102,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'David Garibaldi: fraseo lineal donde nunca suenan dos instrumentos a la vez en la misma semicorchea.',
    measures: [
      m([
        [[k(true)], [h()], [sg()], [h()]],
        [[sa()], [h()], [sg()], [k()]],
        [[h()], [sg()], [k()], [h()]],
        [[sa()], [h()], [sg()], [k()]],
      ]),
    ],
  },
  {
    id: 'funk-cissy-strut',
    name: 'Cissy Strut 2nd-Line',
    category: 'Funk & Gospel',
    subCategory: 'New Orleans Funk',
    difficulty: 'Avanzado',
    suggestedBpm: 88,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Zigaboo Modeliste (The Meters): síncopa de New Orleans con caja sincopada y charles arrastrado con swing.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [sa(), h()]],
        [[h()], [h()], [k(), h()], [h()]],
        [[h()], [sa(), h()], [h()], [h()]],
        [[k(true), h()], [h()], [sa(), h()], [h()]],
      ]),
    ],
  },
  {
    id: 'funk-displaced-snare',
    name: 'Displaced Snare Funk',
    category: 'Funk & Gospel',
    subCategory: 'Modern Funk',
    difficulty: 'Avanzado',
    suggestedBpm: 104,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Desplazamiento rítmico: la caja se adelanta una semicorchea (al "e" o "&") rompiendo la expectativa.',
    measures: [
      m([
        [[k(true), h()], [sa()], [h()], [sg()]],
        [[h()], [k(), h()], [h()], [sg()]],
        [[k(true), h()], [h()], [sa(), h()], [sg()]],
        [[h()], [k()], [sg(), h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'funk-linear-pocket',
    name: 'Linear 16th Pocket',
    category: 'Funk & Gospel',
    subCategory: 'Linear Funk',
    difficulty: 'Intermedio',
    suggestedBpm: 94,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Groove de bolsillo lineal K-H-S-H fluido y bailable con acentos selectivos en charles y caja.',
    measures: [
      m([
        [[k(true)], [ha()], [sg()], [h()]],
        [[sa()], [h()], [k()], [h()]],
        [[k()], [ha()], [sg()], [h()]],
        [[sa()], [h()], [k()], [ho()]],
      ]),
    ],
  },
  {
    id: 'funk-ghost-matrix',
    name: 'Ghost-Note Matrix',
    category: 'Funk & Gospel',
    subCategory: 'Pocket Funk',
    difficulty: 'Avanzado',
    suggestedBpm: 96,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Tapiz continuo de notas fantasma en caja que rellenan todas las semicorcheas entre bombo y charles.',
    measures: [
      m([
        [[k(true), h()], [sg()], [k(), h()], [sg()]],
        [[sa(), h()], [sg()], [sg(), h()], [sg()]],
        [[k(true), h()], [sg()], [k(), h()], [sg()]],
        [[sa(), h()], [sg()], [sg(), h()], [sg()]],
      ]),
    ],
  },
  {
    id: 'funk-16th-hihat-accent',
    name: '16th Hi-Hat Accent Funk',
    category: 'Funk & Gospel',
    subCategory: 'Classic Funk',
    difficulty: 'Intermedio',
    suggestedBpm: 100,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Acentos dinámicos en la primera semicorchea de cada negra en el charles (> . . . > . . .).',
    measures: [
      m([
        [[k(true), ha()], [h()], [k(), h()], [h()]],
        [[sa(), ha()], [h()], [h()], [h()]],
        [[k(), ha()], [h()], [k(), h()], [h()]],
        [[sa(), ha()], [h()], [k(), h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'funk-motown-4-on-snare',
    name: 'Motown 4-on-the-Snare',
    category: 'Funk & Gospel',
    subCategory: 'Motown / Soul',
    difficulty: 'Principiante',
    suggestedBpm: 124,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'El sello de Detroit (Benny Benjamin): caja marcando los 4 tiempos principales con bombo síncopa.',
    measures: [
      m([
        [[k(true), sa(), h()], [h()]],
        [[sa(), h()], [k(), h()]],
        [[k(), sa(), h()], [h()]],
        [[sa(), h()], [k(), h()]],
      ]),
    ],
  },
  {
    id: 'funk-stax-soul',
    name: 'Stax Soul Pocket',
    category: 'Funk & Gospel',
    subCategory: 'Stax Soul',
    difficulty: 'Principiante',
    suggestedBpm: 88,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Al Jackson Jr. (Memphis Soul): el epítome de la elegancia y el espacio, caja profunda y bombo sólido.',
    measures: [
      m([
        [[k(true), h()], [h()]],
        [[sa(), h()], [h()]],
        [[k(true), h()], [k(), h()]],
        [[sa(), h()], [h()]],
      ]),
    ],
  },
  {
    id: 'gospel-shout-music',
    name: 'Gospel Shout Music',
    category: 'Funk & Gospel',
    subCategory: 'Gospel Chops',
    difficulty: 'Virtuoso',
    suggestedBpm: 142,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Energía espiritual explosiva: charles de pie en contratiempos, bombo en negras y caja con chops trepidantes.',
    measures: [
      m([
        [[k(true), r()], [sg()], [hf(), r()], [sg()]],
        [[k(true), sa(), r()], [sg()], [hf(), r()], [sg()]],
        [[k(true), r()], [sg()], [hf(), r()], [sg()]],
        [[k(true), sa(), r()], [sg()], [hf(), r()], [sg()]],
      ]),
    ],
  },
  {
    id: 'gospel-half-time-shuffle',
    name: 'Gospel Half-Time Shuffle',
    category: 'Funk & Gospel',
    subCategory: 'Gospel Chops',
    difficulty: 'Virtuoso',
    suggestedBpm: 80,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.55,
    description: 'Tresillos de medio tiempo estilo Aaron Spears con ghost notes dinámicas y caja potente en tiempo 3.',
    measures: [
      m([
        [[k(true), h()], [sg()], [h()]],
        [[sg(), h()], [sg()], [k(), h()]],
        [[sa(), h()], [sg()], [h()]],
        [[sg(), h()], [k()], [sg(), ho()]],
      ]),
    ],
  },
  {
    id: 'funk-gogo-washington',
    name: 'Go-Go Washington Beat',
    category: 'Funk & Gospel',
    subCategory: 'Go-Go',
    difficulty: 'Intermedio',
    suggestedBpm: 96,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'El sonido oficial de Washington D.C. (Chuck Brown): cencerro constante con swing sincopado en bombo y caja.',
    measures: [
      m([
        [[k(true), cb()], [h()], [cb()], [k(), h()]],
        [[sa(), cb()], [h()], [cb()], [h()]],
        [[k(), cb()], [k(), h()], [cb()], [h()]],
        [[sa(), cb()], [h()], [cb()], [ho()]],
      ]),
    ],
  },
  {
    id: 'funk-afro-funk-fela',
    name: 'Afro-Funk Fela',
    category: 'Funk & Gospel',
    subCategory: 'Afrobeat',
    difficulty: 'Avanzado',
    suggestedBpm: 108,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Tony Allen (Fela Kuti): polirritmia africana entre charles, caja flotante y síncopas de bombo tribal.',
    measures: [
      m([
        [[k(true), h()], [h()], [sa(), h()], [h()]],
        [[h()], [k(), h()], [h()], [sa(), h()]],
        [[k(), h()], [h()], [sa(), h()], [h()]],
        [[h()], [k(), h()], [sa(), h()], [ho()]],
      ]),
    ],
  },

  // ==========================================
  // 3. HIP-HOP & ELECTRONIC (14 Patrones)
  // ==========================================
  {
    id: 'hiphop-90s-boom-bap',
    name: '90s Boom-Bap',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Boom-Bap',
    difficulty: 'Principiante',
    suggestedBpm: 90,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    swingRatio: 0.15,
    description: 'Sonido dorado de Nueva York (DJ Premier): bombo síncopa en 1 y 3&, caja seca y contundente en 2 y 4.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [h()]],
        [[sa(), h()], [h()], [h()], [h()]],
        [[h()], [h()], [k(true), h()], [h()]],
        [[sa(), h()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'hiphop-dilla-loose-swing',
    name: 'Dilla Loose Swing',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Neo-Soul / Dilla',
    difficulty: 'Avanzado',
    suggestedBpm: 84,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    swingRatio: 0.62,
    description: 'J Dilla swing "ebrio" y desfasado: charles arrastrado con bombo retrasado respecto a la cuadrícula.',
    measures: [
      m([
        [[k(true), h()], [h()], [k(), h()], [h()]],
        [[sa(), h()], [sg()], [h()], [sg()]],
        [[k(), h()], [h()], [k(true), h()], [h()]],
        [[sa(), h()], [h()], [sg(), h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'hiphop-east-coast-16th',
    name: 'East Coast 16th',
    category: 'Hip-Hop & Electronic',
    subCategory: 'East Coast',
    difficulty: 'Intermedio',
    suggestedBpm: 92,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Charles en semicorcheas continuas con acentos en los pulsos fuertes y bombo con rebote dinámico.',
    measures: [
      m([
        [[k(true), ha()], [h()], [k(), h()], [h()]],
        [[sa(), ha()], [h()], [h()], [h()]],
        [[k(), ha()], [h()], [k(true), h()], [k()]],
        [[sa(), ha()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'hiphop-g-funk',
    name: 'G-Funk Laid-back',
    category: 'Hip-Hop & Electronic',
    subCategory: 'West Coast',
    difficulty: 'Principiante',
    suggestedBpm: 94,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Dr. Dre / Warren G: tempo suave y relajado, palmada/caja brillante en 2 y 4 con charles sutil.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [k(), h()]],
        [[sa(), h()], [h()], [h()], [h()]],
        [[k(true), h()], [h()], [k(), h()], [h()]],
        [[sa(), h()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'trap-rolling-hihats',
    name: 'Trap Rolling Hi-Hats',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Trap',
    difficulty: 'Avanzado',
    suggestedBpm: 140,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Estilo Atlanta / Metro Boomin: caja/snare únicamente en el tiempo 3 con charles hiperactivo en redobles.',
    measures: [
      m([
        [[k(true), ha()], [h()], [h()], [h()]],
        [[h()], [h()], [k(), h()], [h()]],
        [[sa(), ha()], [h()], [h()], [h()]],
        [[h()], [k()], [h()], [h()]],
      ]),
    ],
  },
  {
    id: 'drill-sliding',
    name: 'Drill Sliding Beat',
    category: 'Hip-Hop & Electronic',
    subCategory: 'UK/NY Drill',
    difficulty: 'Avanzado',
    suggestedBpm: 142,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'UK / NY Drill: síncopa de bombo flotante con caja en el tiempo 3 (y ghost en 3&) y charles saltarín.',
    measures: [
      m([
        [[k(true), h()], [], [h()], [k()]],
        [[], [h()], [k(), h()], []],
        [[sa(), h()], [], [sg(), h()], []],
        [[k()], [h()], [], [h()]],
      ]),
    ],
  },
  {
    id: 'phonk-808',
    name: 'Phonk 808 Drift',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Drift Phonk',
    difficulty: 'Intermedio',
    suggestedBpm: 130,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Memphis / Drift Phonk: cencerro constante marcando corcheas con bombo 808 distorsionado y caja cortante.',
    measures: [
      m([
        [[k(true), cb()], [h()], [cb()], [h()]],
        [[sa(), cb()], [h()], [cb()], [k(), h()]],
        [[k(true), cb()], [h()], [cb()], [h()]],
        [[sa(), cb()], [h()], [k(), cb()], [ho()]],
      ]),
    ],
  },
  {
    id: 'amen-break-jungle',
    name: 'Amen Break Jungle',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Jungle / DnB',
    difficulty: 'Virtuoso',
    suggestedBpm: 168,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'El sagrado "Amen Break" (The Winstons) acelerado a tempo jungle con síncopas acrobáticas en caja y bombo.',
    measures: [
      m([
        [[k(true), r()], [r()], [sa(), r()], [r()]],
        [[r()], [k(), r()], [sa(), r()], [r()]],
        [[r()], [k(), r()], [sa(), r()], [r()]],
        [[k(), r()], [sg(), r()], [sa(), r()], [sg()]],
      ]),
    ],
  },
  {
    id: 'dnb-two-step',
    name: 'DnB Two-Step',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Drum & Bass',
    difficulty: 'Intermedio',
    suggestedBpm: 174,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Drum & Bass clásico: bombo en tiempo 1, caja en 2, bombo sincopado en 3& y caja en 4 a velocidad vertiginosa.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [h()]],
        [[sa(), h()], [h()], [h()], [h()]],
        [[h()], [h()], [k(true), h()], [h()]],
        [[sa(), h()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'house-four-on-floor',
    name: 'House 4-on-the-Floor',
    category: 'Hip-Hop & Electronic',
    subCategory: 'House Music',
    difficulty: 'Principiante',
    suggestedBpm: 125,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Patrón rey de club: bombo en cada negra, charles abierto en cada contratiempo "&" y caja en 2 y 4.',
    measures: [
      m([
        [[k(true), h()], [h()], [ho()], [h()]],
        [[k(true), sa(), h()], [h()], [ho()], [h()]],
        [[k(true), h()], [h()], [ho()], [h()]],
        [[k(true), sa(), h()], [h()], [ho()], [h()]],
      ]),
    ],
  },
  {
    id: 'techno-driving-kick',
    name: 'Techno Driving Kick',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Techno',
    difficulty: 'Principiante',
    suggestedBpm: 134,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Berlín Techno hipnótico: bombo 909 implacable con charles de pie en contratiempos y ride metálico sutil.',
    measures: [
      m([
        [[k(true)], [h()], [ho(), hf()], [h()]],
        [[k(true)], [h()], [ho(), hf()], [h()]],
        [[k(true), r()], [h()], [ho(), hf()], [h()]],
        [[k(true), r()], [h()], [ho(), hf()], [h()]],
      ]),
    ],
  },
  {
    id: 'uk-garage-2step',
    name: 'UK Garage 2-Step',
    category: 'Hip-Hop & Electronic',
    subCategory: 'UK Garage',
    difficulty: 'Intermedio',
    suggestedBpm: 132,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    swingRatio: 0.42,
    description: 'Ritmo saltarín británico con swing marcado, kick sincopado que evita el tiempo 3 y caja elegante.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [h()]],
        [[sa(), h()], [h()], [k(), h()], [h()]],
        [[h()], [h()], [k(), h()], [h()]],
        [[sa(), h()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'electronic-big-beat',
    name: 'Big Beat Break',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Big Beat',
    difficulty: 'Intermedio',
    suggestedBpm: 128,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'The Prodigy / Chemical Brothers: breakbeat pesado y sucio con charles crujiente y bombo doble demoledor.',
    measures: [
      m([
        [[k(true), cr()], [h()], [h()], [k(), h()]],
        [[sa(), h()], [h()], [k(), h()], [h()]],
        [[k(true), h()], [k(), h()], [h()], [h()]],
        [[sa(), h()], [h()], [k(), ho()], [h()]],
      ]),
    ],
  },
  {
    id: 'electronic-synthwave',
    name: 'Synthwave 80s Gate',
    category: 'Hip-Hop & Electronic',
    subCategory: 'Synthwave',
    difficulty: 'Principiante',
    suggestedBpm: 108,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Nostalgia retro de los 80s: caja con gated reverb épica en 2 y 4, bombo bombeante y charles en corcheas.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [k(), h()]],
        [[sa(), h()], [h()], [h()], [h()]],
        [[k(true), h()], [k(), h()], [h()], [h()]],
        [[sa(), h()], [h()], [h()], [ho()]],
      ]),
    ],
  },

  // ==========================================
  // 4. LATIN & WORLD (16 Patrones)
  // ==========================================
  {
    id: 'latin-bossa-nova',
    name: 'Bossa Nova Clásica',
    category: 'Latin & World',
    subCategory: 'Afro-Cuban & Brazilian',
    difficulty: 'Intermedio',
    suggestedBpm: 130,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Helô Pinheiro / Jobim: clave de bossa en aro de caja, bombo en síncopa suave y charles de pie en 2 y 4.',
    measures: [
      m([
        [[k(true), r(), sa()], [r()], [r()], [k(), r()]],
        [[r(), hf()], [r(), sa()], [k(), r()], [r()]],
        [[r()], [k(), r(), sa()], [r()], [k(), r()]],
        [[r(), hf()], [r()], [k(), r(), sa()], [r()]],
      ]),
    ],
  },
  {
    id: 'latin-samba-batucada',
    name: 'Samba Batucada',
    category: 'Latin & World',
    subCategory: 'Brazilian',
    difficulty: 'Avanzado',
    suggestedBpm: 105,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Carnaval de Río: surdo en el bombo con acento en el tiempo 2 y 4, tamborim y caja dialogando a alta velocidad.',
    measures: [
      m([
        [[k(), r()], [sa(), r()], [k(), r()], [sa(), r()]],
        [[k(true), r()], [sa(), r()], [k(), r()], [sa(), r()]],
        [[k(), r()], [sa(), r()], [k(), r()], [sa(), r()]],
        [[k(true), r()], [sa(), r()], [k(), r()], [sa(), r()]],
      ]),
    ],
  },
  {
    id: 'latin-partido-alto',
    name: 'Partido Alto',
    category: 'Latin & World',
    subCategory: 'Brazilian',
    difficulty: 'Avanzado',
    suggestedBpm: 110,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Síncopa tradicional de Río: acentos cruzados en el aro de caja y cencerro con bombo sincopado.',
    measures: [
      m([
        [[r(), sa()], [r()], [k(), r()], [r(), sa()]],
        [[r()], [r(), sa()], [k(true), r()], [r()]],
        [[r(), sa()], [r()], [k(), r(), sa()], [r()]],
        [[r()], [r(), sa()], [k(true), r()], [r()]],
      ]),
    ],
  },
  {
    id: 'latin-baiao',
    name: 'Baiao Tradicional',
    category: 'Latin & World',
    subCategory: 'Brazilian',
    difficulty: 'Intermedio',
    suggestedBpm: 100,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Nordeste de Brasil (Luiz Gonzaga): bombo imitando la zabumba con acento en 1 y en el contratiempo del 2.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [h()]],
        [[h()], [h()], [k(true), h()], [h()]],
        [[k(true), h()], [h()], [h()], [h()]],
        [[h()], [sa(), h()], [k(true), ho()], [h()]],
      ]),
    ],
  },
  {
    id: 'latin-maracatu',
    name: 'Maracatu de Pernambuco',
    category: 'Latin & World',
    subCategory: 'Brazilian',
    difficulty: 'Avanzado',
    suggestedBpm: 92,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Ritmo afro-brasileño sagrado con alfaias pesadas simuladas en toms y bombo con síncopas poderosas.',
    measures: [
      m([
        [[k(true), ft(true)], [ft()], [t1()], [k()]],
        [[sa()], [ft()], [k(true), ft()], [t1()]],
        [[k(true), ft()], [ft()], [t1()], [k()]],
        [[sa()], [ft()], [k(true), ft()], [t1(true)]],
      ]),
    ],
  },
  {
    id: 'latin-frevo',
    name: 'Frevo de Recife',
    category: 'Latin & World',
    subCategory: 'Brazilian',
    difficulty: 'Virtuoso',
    suggestedBpm: 145,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Danza de calle ultra rápida de Pernambuco con redobles y acentos vertiginosos en caja y bombo.',
    measures: [
      m([
        [[k(true), sa()], [sa()], [k(), sa()], [sa()]],
        [[k(true), sa()], [sa()], [k(), sa()], [sa()]],
        [[k(true), sa()], [sa()], [k(), sa()], [sa()]],
        [[k(true), sa()], [sa()], [k(), sa()], [sa()]],
      ]),
    ],
  },
  {
    id: 'latin-mambo-cascara',
    name: 'Mambo Cáscara 3:2',
    category: 'Latin & World',
    subCategory: 'Afro-Cuban',
    difficulty: 'Avanzado',
    suggestedBpm: 105,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Patrón de cáscara cubana en campana/ride, bombo marcando tumbao en tiempo 4 y contratiempo.',
    measures: [
      m([
        [[ra(), cb()], [cb()], [ra(), cb()], [cb()]],
        [[cb()], [ra(), cb()], [cb()], [ra(), cb()]],
        [[cb()], [ra(), cb()], [cb()], [cb()]],
        [[ra(), cb()], [cb()], [k(true), ra(), cb()], [k()]],
      ]),
    ],
  },
  {
    id: 'latin-son-clave-tumbao',
    name: 'Son Clave 2:3 Tumbao',
    category: 'Latin & World',
    subCategory: 'Afro-Cuban',
    difficulty: 'Intermedio',
    suggestedBpm: 95,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Clave de son 2:3 en rimshot de caja con bombo tocando el tumbao afrocubano en el tiempo 4.',
    measures: [
      m([
        [[r()], [r()], [sa(), r()], [r()]],
        [[r()], [sa(), r()], [r()], [r()]],
        [[sa(), r()], [r()], [r()], [sa(), r()]],
        [[r()], [r()], [k(true), sa(), r()], [k()]],
      ]),
    ],
  },
  {
    id: 'latin-songo-changuito',
    name: 'Songo Changuito',
    category: 'Latin & World',
    subCategory: 'Afro-Cuban',
    difficulty: 'Virtuoso',
    suggestedBpm: 104,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'José Luis Quintana "Changuito" (Los Van Van): campana en negras, bombo en 1 y contratiempos, caja lineal virtuosa.',
    measures: [
      m([
        [[k(true), cb()], [sg()], [sa()], [sg()]],
        [[cb()], [k(), sg()], [sa()], [sg()]],
        [[k(), cb()], [sg()], [sa()], [sg()]],
        [[cb()], [k(), sg()], [sa()], [ho()]],
      ]),
    ],
  },
  {
    id: 'latin-mozambique',
    name: 'Mozambique Cubano',
    category: 'Latin & World',
    subCategory: 'Afro-Cuban',
    difficulty: 'Avanzado',
    suggestedBpm: 102,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Pedro Izquierdo "Pello el Afrokán": cencerro de mano cruzado con bombo sincopado y acentos en timbal/toms.',
    measures: [
      m([
        [[cb(true), k(true)], [cb()], [sa()], [cb()]],
        [[cb(true)], [cb()], [k(true), sa()], [cb()]],
        [[cb(true), k()], [cb()], [sa()], [cb()]],
        [[cb(true)], [cb()], [k(true), sa()], [t1()]],
      ]),
    ],
  },
  {
    id: 'latin-6-8-bembe',
    name: '6/8 Bembé Nañigo',
    category: 'Latin & World',
    subCategory: 'Afro-Cuban',
    difficulty: 'Avanzado',
    suggestedBpm: 118,
    timeSignature: '6/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Campana sagrada afrocubana de 7 golpes sobre 12 pulsos (1 . 3 . 5 6 . 8 . 10 . 12) adaptada en 6/8.',
    measures: [
      m([
        [[cb(true), k(true)]],
        [[cb()]],
        [[cb(true), ft()]],
        [[cb(), sa()]],
        [[cb(true), k()]],
        [[cb()]],
      ]),
    ],
  },
  {
    id: 'latin-cha-cha-cha',
    name: 'Cha-Cha-Chá',
    category: 'Latin & World',
    subCategory: 'Afro-Cuban',
    difficulty: 'Principiante',
    suggestedBpm: 116,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Tempo cadencioso: cencerro marcando negras estables con caja y bombo respondiendo al pasillo rítmico.',
    measures: [
      m([
        [[k(true), cb()], [h()]],
        [[cb()], [sa(), h()]],
        [[k(), cb()], [h()]],
        [[cb()], [sa(), h()]],
      ]),
    ],
  },
  {
    id: 'world-reggae-one-drop',
    name: 'Reggae One-Drop',
    category: 'Latin & World',
    subCategory: 'Reggae',
    difficulty: 'Principiante',
    suggestedBpm: 75,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Carlton Barrett (Bob Marley): silencio absoluto en el tiempo 1; bombo y rimshot de caja caen juntos en el 3.',
    measures: [
      m([
        [[h()], [h()], [h()], [h()]],
        [[h()], [h()], [h()], [ho()]],
        [[k(true), sa(), h()], [h()], [h()], [h()]],
        [[h()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'world-reggae-steppers',
    name: 'Reggae Steppers',
    category: 'Latin & World',
    subCategory: 'Reggae',
    difficulty: 'Intermedio',
    suggestedBpm: 78,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Bombo constante en los 4 tiempos principales (four-on-the-floor) con rimshot potente en el pulso 3.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [h()]],
        [[k(true), h()], [h()], [h()], [ho()]],
        [[k(true), sa(), h()], [h()], [h()], [h()]],
        [[k(true), h()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'world-reggae-rockers',
    name: 'Reggae Rockers',
    category: 'Latin & World',
    subCategory: 'Reggae',
    difficulty: 'Intermedio',
    suggestedBpm: 80,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Sly Dunbar: bombo marcando tiempos 1 y 3 con caja contundente en el 2 y 4 y semicorcheas dinámicas.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [h()]],
        [[sa(), h()], [h()], [k(), h()], [h()]],
        [[k(true), h()], [h()], [h()], [h()]],
        [[sa(), h()], [h()], [h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'world-soca-calypso',
    name: 'Soca Calypso',
    category: 'Latin & World',
    subCategory: 'Caribbean',
    difficulty: 'Avanzado',
    suggestedBpm: 130,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Carnaval de Trinidad y Tobago: bombo en 4/4 con charles abierto en contratiempos hipervivaces y toms.',
    measures: [
      m([
        [[k(true), h()], [h()], [ho()], [h()]],
        [[k(true), sa(), h()], [h()], [ho()], [h()]],
        [[k(true), h()], [h()], [ho()], [h()]],
        [[k(true), sa(), h()], [t1()], [ho()], [t2()]],
      ]),
    ],
  },

  // ==========================================
  // 5. JAZZ & BLUES (13 Patrones)
  // ==========================================
  {
    id: 'jazz-standard-ride-swing',
    name: 'Standard Ride Swing',
    category: 'Jazz & Blues',
    subCategory: 'Classic Jazz',
    difficulty: 'Intermedio',
    suggestedBpm: 120,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.58,
    description: 'El clásico spang-a-lang en el ride con charles de pie en 2 y 4, bombo con feathering sutil y caja comping.',
    measures: [
      m([
        [[r(true), k()], [], [r()]],
        [[r(true), hf()], [], [r(), sg()]],
        [[r(true), k()], [], [r()]],
        [[r(true), hf()], [], [r()]],
      ]),
    ],
  },
  {
    id: 'jazz-bebop-fast',
    name: 'Bebop Fast Swing',
    category: 'Jazz & Blues',
    subCategory: 'Bebop',
    difficulty: 'Virtuoso',
    suggestedBpm: 220,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Max Roach / Kenny Clarke: swing a tempo ultrarrápido con comping impredecible en caja y bombo.',
    measures: [
      m([
        [[r(true)], [r()]],
        [[r(true), hf()], [r(), sa()]],
        [[r(true)], [r(), k()]],
        [[r(true), hf()], [r()]],
      ]),
    ],
  },
  {
    id: 'jazz-feathered-kick-ballad',
    name: 'Feathered Kick Ballad',
    category: 'Jazz & Blues',
    subCategory: 'Ballad',
    difficulty: 'Principiante',
    suggestedBpm: 66,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.6,
    description: 'Bombo rozado casi inaudible (feathering) en las 4 negras para dar profundidad sin interferir con el contrabajo.',
    measures: [
      m([
        [[r(true), k()], [], [r()]],
        [[r(true), hf(), k()], [], [r(), sg()]],
        [[r(true), k()], [], [r()]],
        [[r(true), hf(), k()], [], [r()]],
      ]),
    ],
  },
  {
    id: 'jazz-elvin-jones-6-4',
    name: 'Elvin Jones Polyrhythm',
    category: 'Jazz & Blues',
    subCategory: 'Post-Bop',
    difficulty: 'Virtuoso',
    suggestedBpm: 135,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.65,
    description: 'Elvin Jones con John Coltrane: polirritmia modal circular y dinámica desbordante en toms y caja.',
    measures: [
      m([
        [[r(true), k(true)], [sg()], [t1()]],
        [[r(true), hf()], [sg()], [t2(), k()]],
        [[r(true), ft(true)], [sg()], [t1()]],
        [[r(true), hf()], [sa()], [k()]],
      ]),
    ],
  },
  {
    id: 'jazz-waltz-3-4',
    name: 'Jazz Waltz 3/4',
    category: 'Jazz & Blues',
    subCategory: 'Waltz',
    difficulty: 'Intermedio',
    suggestedBpm: 126,
    timeSignature: '3/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.55,
    description: 'Vals de jazz en 3/4: ride swing ternario, charles de pie en 2 y 3, bombo en 1.',
    measures: [
      m([
        [[r(true), k(true)], [], [r()]],
        [[r(true), hf()], [], [r(), sg()]],
        [[r(true), hf()], [], [r()]],
      ]),
    ],
  },
  {
    id: 'jazz-5-4-modern',
    name: '5/4 Modern Jazz',
    category: 'Jazz & Blues',
    subCategory: 'Modern Jazz',
    difficulty: 'Avanzado',
    suggestedBpm: 120,
    timeSignature: '5/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.58,
    description: 'Jazz modal contemporáneo en 5/4 con subdivisión fluida 3+2 y comping flotante en aro de caja.',
    measures: [
      m([
        [[r(true), k(true)], [], [r()]],
        [[r(true), hf()], [], [r()]],
        [[r(true)], [], [r(), sa()]],
        [[r(true), k()], [], [r()]],
        [[r(true), hf()], [], [r()]],
      ]),
    ],
  },
  {
    id: 'jazz-7-4-ecm',
    name: '7/4 ECM Contemporary',
    category: 'Jazz & Blues',
    subCategory: 'ECM Contemporary',
    difficulty: 'Virtuoso',
    suggestedBpm: 112,
    timeSignature: '7/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Jon Christensen / Paul Motian: atmósfera etérea en 7/4 sobre el ride con golpes de color en toms y platillos.',
    measures: [
      m([
        [[r(true), k()], [r()]],
        [[r(), hf()], [r(), sg()]],
        [[r(), k()], [r()]],
        [[r(), sa()], [r()]],
        [[r(), k()], [r()]],
        [[r(), hf()], [r()]],
        [[r(), sa()], [r()]],
      ]),
    ],
  },
  {
    id: 'blues-texas-shuffle',
    name: 'Texas Blues Shuffle',
    category: 'Jazz & Blues',
    subCategory: 'Blues',
    difficulty: 'Intermedio',
    suggestedBpm: 125,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.6,
    description: 'Chris Layton (Stevie Ray Vaughan): shuffle tejano pesado con caja marcando 2 y 4 con rebote constante.',
    measures: [
      m([
        [[k(true), h()], [], [h()]],
        [[sa(), h()], [], [sg(), h()]],
        [[k(true), h()], [], [h()]],
        [[sa(), h()], [], [sg(), h()]],
      ]),
    ],
  },
  {
    id: 'blues-purdie-half-time-shuffle',
    name: 'Purdie Half-Time Shuffle',
    category: 'Jazz & Blues',
    subCategory: 'Shuffle',
    difficulty: 'Virtuoso',
    suggestedBpm: 92,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.65,
    description: 'Bernard Purdie (Home At Last / Steely Dan): el shuffle más sofisticado con ghost notes en la tercera corchea de tresillo.',
    measures: [
      m([
        [[k(true), h()], [sg()], [h()]],
        [[sg(), h()], [sg()], [k(), h()]],
        [[sa(), h()], [sg()], [h()]],
        [[sg(), h()], [k()], [sg(), ho()]],
      ]),
    ],
  },
  {
    id: 'blues-babylon-sisters',
    name: 'Babylon Sisters Shuffle',
    category: 'Jazz & Blues',
    subCategory: 'Shuffle',
    difficulty: 'Avanzado',
    suggestedBpm: 84,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    swingRatio: 0.64,
    description: 'Medio tiempo arrastrado con apertura sutil de charles en tresillos y ghost notes susurradas en caja.',
    measures: [
      m([
        [[k(true), h()], [sg()], [ho()]],
        [[sg(), h()], [sg()], [k(), h()]],
        [[sa(), h()], [sg()], [ho()]],
        [[sg(), h()], [k()], [sg(), h()]],
      ]),
    ],
  },
  {
    id: 'blues-chicago-slow-12-8',
    name: 'Chicago Slow Blues 12/8',
    category: 'Jazz & Blues',
    subCategory: 'Slow Blues',
    difficulty: 'Principiante',
    suggestedBpm: 50,
    timeSignature: '12/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Muddy Waters / Buddy Guy: blues lento en 12/8 dividido en 4 pulsos de tres corcheas con caja magistral en 2 y 4.',
    measures: [
      m([
        [[k(true), r()]], [[r()]], [[r()]],
        [[sa(), r()]], [[r()]], [[r()]],
        [[k(true), r()]], [[r()]], [[k(), r()]],
        [[sa(), r()]], [[r()]], [[r()]],
      ]),
    ],
  },
  {
    id: 'blues-new-orleans-street',
    name: 'New Orleans Street Beat',
    category: 'Jazz & Blues',
    subCategory: 'Second-Line',
    difficulty: 'Avanzado',
    suggestedBpm: 90,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    swingRatio: 0.45,
    description: 'Second-line brass band tradicional: redobles de caja con acentos de marcha y bombo con síncopa callejera.',
    measures: [
      m([
        [[k(true), sa()], [sg()], [sg()], [sa()]],
        [[sg()], [sa()], [k(), sg()], [sg()]],
        [[sa()], [sg()], [k(true), sg()], [sa()]],
        [[sg()], [sa()], [k(), sg()], [sg()]],
      ]),
    ],
  },
  {
    id: 'country-train-beat',
    name: 'Country Train Beat',
    category: 'Jazz & Blues',
    subCategory: 'Country / Bluegrass',
    difficulty: 'Intermedio',
    suggestedBpm: 128,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Johnny Cash / Tennessee Two: escobillas o baquetas en aro y parche de caja imitando la locomotora a vapor.',
    measures: [
      m([
        [[k(true), sa()], [sg()], [sa()], [sg()]],
        [[sa()], [sg()], [k(), sa()], [sg()]],
        [[k(true), sa()], [sg()], [sa()], [sg()]],
        [[sa()], [sg()], [k(), sa()], [sg()]],
      ]),
    ],
  },

  // ==========================================
  // 6. PROG & ODD-METER (12 Patrones)
  // ==========================================
  {
    id: 'prog-take-five-5-4',
    name: 'Take Five 5/4 (3+2)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Odd-Meter Jazz',
    difficulty: 'Intermedio',
    suggestedBpm: 174,
    timeSignature: '5/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Joe Morello (The Dave Brubeck Quartet): el 5/4 más famoso de la historia subdividido en 3+2.',
    measures: [
      m([
        [[k(true), r(true)], [r()]],
        [[r(true), sa()], [r()]],
        [[r(true), hf()], [r()]],
        [[k(true), r(true)], [r()]],
        [[sa(), r(true), hf()], [r()]],
      ]),
    ],
  },
  {
    id: 'prog-money-7-4',
    name: 'Money 7/4 (4+3)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Classic Prog',
    difficulty: 'Intermedio',
    suggestedBpm: 120,
    timeSignature: '7/4',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Nick Mason (Pink Floyd): compás irregular de 7/4 agrupado en 4 negras estables + 3 negras de tensión.',
    measures: [
      m([
        [[k(true), h()], [h()]],
        [[sa(), h()], [h()]],
        [[k(), h()], [h()]],
        [[sa(), h()], [h()]],
        [[k(true), h()], [h()]],
        [[sa(), h()], [h()]],
        [[k(), h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'prog-rush-7-8',
    name: 'Rush 7/8 (2+2+3)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Prog Rock',
    difficulty: 'Avanzado',
    suggestedBpm: 138,
    timeSignature: '7/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Neil Peart (Rush - Tom Sawyer / Subdivisions): amalgama 7/8 agrupada en 2 + 2 + 3 corcheas.',
    measures: [
      m([
        [[k(true), r(true)]],
        [[r()]],
        [[sa(), r(true)]],
        [[r()]],
        [[k(true), r(true)]],
        [[r()]],
        [[sa(), r()]],
      ]),
    ],
  },
  {
    id: 'prog-tool-7-8',
    name: 'Tool 7/8 Tribal (3+2+2)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Prog Metal',
    difficulty: 'Virtuoso',
    suggestedBpm: 112,
    timeSignature: '7/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Danny Carey (Tool): amalgama en 7/8 agrupada en 3 + 2 + 2 con toms tribales, bombo polirrítmico y ride.',
    measures: [
      m([
        [[k(true), r(true)]],
        [[ft()]],
        [[t1()]],
        [[k(true), r(true)]],
        [[t2()]],
        [[sa(), r(true)]],
        [[k()]],
      ]),
    ],
  },
  {
    id: 'prog-9-8-compound',
    name: '9/8 Compound (3+3+3)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Compound Meter',
    difficulty: 'Intermedio',
    suggestedBpm: 110,
    timeSignature: '9/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Métrica compuesta simétrica de 9 corcheas divididas en 3 pulsos ternarios estables (3+3+3).',
    measures: [
      m([
        [[k(true), r()]],
        [[r()]],
        [[r()]],
        [[sa(), r()]],
        [[r()]],
        [[r()]],
        [[k(true), r()]],
        [[r()]],
        [[sa(), r()]],
      ]),
    ],
  },
  {
    id: 'prog-9-8-balkan',
    name: '9/8 Balkan (2+2+2+3)',
    category: 'Prog & Odd-Meter',
    subCategory: 'World / Odd-Meter',
    difficulty: 'Avanzado',
    suggestedBpm: 140,
    timeSignature: '9/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Danza balcánica asimétrica (Karsilamas): compás de 9/8 agrupado en 2 + 2 + 2 + 3 corcheas.',
    measures: [
      m([
        [[k(true), h()]],
        [[h()]],
        [[sa(), h()]],
        [[h()]],
        [[k(), h()]],
        [[h()]],
        [[sa(), h()]],
        [[h()]],
        [[k(), ho()]],
      ]),
    ],
  },
  {
    id: 'prog-11-8-fusion',
    name: '11/8 Fusion (3+3+3+2)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Fusion / Mahavishnu',
    difficulty: 'Virtuoso',
    suggestedBpm: 125,
    timeSignature: '11/8',
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Billy Cobham / Mahavishnu Orchestra: compás complejo de 11 corcheas articulado en 3 + 3 + 3 + 2.',
    measures: [
      m([
        [[k(true), r()]],
        [[r()]],
        [[r()]],
        [[sa(), r()]],
        [[r()]],
        [[r()]],
        [[k(true), r()]],
        [[r()]],
        [[r()]],
        [[sa(), r()]],
        [[k(), r()]],
      ]),
    ],
  },
  {
    id: 'prog-13-8-prog',
    name: '13/8 Dream Theater',
    category: 'Prog & Odd-Meter',
    subCategory: 'Prog Metal',
    difficulty: 'Virtuoso',
    suggestedBpm: 130,
    timeSignature: '7/8', // Rendered as compound odd
    measuresCount: 1,
    subdivision: '1/8',
    description: 'Mike Portnoy: amalgama vertiginosa de 13 corcheas (agrupada 3+3+3+4) con doble bombo y acentos en china.',
    measures: [
      m([
        [[k(true), ch(true)]],
        [[r()]],
        [[r()]],
        [[sa(), r()]],
        [[r()]],
        [[r()]],
        [[k(true), ch()]],
      ]),
    ],
  },
  {
    id: 'prog-3-4-polyrhythm',
    name: '3:4 Kick/Hat Polyrhythm',
    category: 'Prog & Odd-Meter',
    subCategory: 'Polyrhythm',
    difficulty: 'Avanzado',
    suggestedBpm: 100,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '1/16',
    description: 'Polirritmia 3 contra 4: el bombo pulsa cada 3 semicorcheas contra el charles y caja en cuadrícula 4/4.',
    measures: [
      m([
        [[k(true), h()], [h()], [h()], [k(), h()]],
        [[sa(), h()], [h()], [k(), h()], [h()]],
        [[h()], [k(), h()], [h()], [h()]],
        [[sa(), k(), h()], [h()], [h()], [k(), ho()]],
      ]),
    ],
  },
  {
    id: 'prog-4-3-metric-mod',
    name: '4:3 Metric Modulation',
    category: 'Prog & Odd-Meter',
    subCategory: 'Metric Modulation',
    difficulty: 'Virtuoso',
    suggestedBpm: 90,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '3:2',
    description: 'Acentos en tresillos agrupados de 4 en 4 que generan la ilusión de un nuevo tempo acelerado 4 contra 3.',
    measures: [
      m([
        [[k(true), r(true)], [sg()], [sg()]],
        [[r(true), sa()], [sg()], [sg()]],
        [[r(true), k()], [sg()], [sg()]],
        [[r(true), sa()], [sg()], [sg()]],
      ]),
    ],
  },
  {
    id: 'prog-quintuplet-5-4',
    name: 'Quintuplet Groove (5:4)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Tuplet Groove',
    difficulty: 'Virtuoso',
    suggestedBpm: 80,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '5:4',
    description: 'Subdivisión estricta en quintillos (5 notas por tiempo) con bombo y caja alternados en síncopa matemática.',
    measures: [
      m([
        [[k(true), h()], [h()], [k(), h()], [h()], [h()]],
        [[sa(), h()], [h()], [h()], [k(), h()], [h()]],
        [[k(true), h()], [h()], [k(), h()], [h()], [h()]],
        [[sa(), h()], [h()], [h()], [k(), h()], [ho()]],
      ]),
    ],
  },
  {
    id: 'prog-septuplet-7-4',
    name: 'Septuplet Groove (7:4)',
    category: 'Prog & Odd-Meter',
    subCategory: 'Tuplet Groove',
    difficulty: 'Virtuoso',
    suggestedBpm: 70,
    timeSignature: '4/4',
    measuresCount: 1,
    subdivision: '7:4',
    description: 'Subdivisión en septillos (7 notas por tiempo) inspirada en el fraseo moderno de Ronald Bruner Jr. y Vinnie Colaiuta.',
    measures: [
      m([
        [[k(true), h()], [h()], [k(), h()], [h()], [sg()], [h()], [h()]],
        [[sa(), h()], [h()], [sg()], [h()], [k(), h()], [h()], [h()]],
        [[k(true), h()], [h()], [k(), h()], [h()], [sg()], [h()], [h()]],
        [[sa(), h()], [h()], [sg()], [h()], [k(), h()], [h()], [ho()]],
      ]),
    ],
  },
];

// --- Converter Helper: Transform GroovePattern into Sonora DrumMeasure[] ---
export function convertGrooveToDrumMeasures(
  groove: GroovePattern,
  targetMeasureIndices: number[] = [0],
  existingMeasuresCount: number = 1
): DrumMeasure[] {
  // Parse time signature (e.g. '4/4' -> [4, 4], '7/8' -> [7, 8])
  const [numStr, denStr] = groove.timeSignature.split('/');
  const beatsCount = parseInt(numStr, 10) || 4;
  const beatValue = parseInt(denStr, 10) || 4;
  const timeSig: [number, number] = [beatsCount, beatValue];

  // Map subdivision string to numeric value
  let subValue = 4; // default 1/16
  let isTuplet = false;
  let tupletRatio: [number, number] | undefined = undefined;

  switch (groove.subdivision) {
    case '1/8':
      subValue = 2;
      break;
    case '1/16':
      subValue = 4;
      break;
    case '1/32':
      subValue = 8;
      break;
    case '3:2':
      subValue = 3;
      isTuplet = true;
      tupletRatio = [3, 2];
      break;
    case '6:4':
      subValue = 6;
      isTuplet = true;
      tupletRatio = [6, 4];
      break;
    case '5:4':
      subValue = 5;
      isTuplet = true;
      tupletRatio = [5, 4];
      break;
    case '7:4':
      subValue = 7;
      isTuplet = true;
      tupletRatio = [7, 4];
      break;
  }

  // Create a Sonora DrumMeasure from a single groove measure template
  const buildMeasureFromTemplate = (mIndex: number, templateMeasureIdx: number): DrumMeasure => {
    const measureId = `m${mIndex + 1}`;
    const template = groove.measures[templateMeasureIdx % groove.measures.length];

    const beats: DrumBeat[] = [];

    for (let bIdx = 0; bIdx < beatsCount; bIdx++) {
      const beatTemplate = template.beats[bIdx % template.beats.length];
      const steps: DrumStep[] = [];

      const rawSubdivisions = beatTemplate?.subdivisions || [];
      const stepsCount = rawSubdivisions.length > 0 ? rawSubdivisions.length : subValue;

      for (let sIdx = 0; sIdx < stepsCount; sIdx++) {
        const rawHits = rawSubdivisions[sIdx] || [];
        const isRest = rawHits.length === 0;

        const hits: DrumHit[] = rawHits.map((h) => ({
          pieceId: (h.instrument === 'hihat' ? 'hihatClosed' : h.instrument) as DrumPieceId,
          accent: h.accent,
          ghost: h.ghost,
          flam: h.flam,
        }));

        steps.push({
          id: `${measureId}-b${bIdx}-s${sIdx}`,
          hits,
          isRest,
        });
      }

      beats.push({
        id: `${measureId}-b${bIdx}`,
        beatIndex: bIdx,
        subdivision: subValue,
        isTuplet,
        tupletRatio,
        steps,
      });
    }

    return {
      id: measureId,
      timeSignature: timeSig,
      beats,
    };
  };

  // Build the array of measures for all targets or duplicate across project
  const result: DrumMeasure[] = [];
  const totalMeasures = Math.max(existingMeasuresCount, targetMeasureIndices.length);

  for (let mIdx = 0; mIdx < totalMeasures; mIdx++) {
    const isTargeted = targetMeasureIndices.includes(mIdx);
    if (isTargeted) {
      // Find how many targeted measures occurred before this one to alternate 2-measure grooves
      const targetSeq = targetMeasureIndices.indexOf(mIdx);
      result.push(buildMeasureFromTemplate(mIdx, targetSeq));
    } else {
      // If not targeted, keep as empty or replicate template
      result.push(buildMeasureFromTemplate(mIdx, 0));
    }
  }

  return result;
}
