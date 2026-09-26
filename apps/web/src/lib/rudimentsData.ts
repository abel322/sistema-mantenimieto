import { RudimentItem, RudimentCategory } from '@/types/drum';

export const RUDIMENT_CATEGORIES: {
  id: RudimentCategory;
  name: string;
  label: string;
  color: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'rolls',
    name: 'Redobles (Rolls)',
    label: 'Rolls',
    color: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'Golpes alternados simples, dobles y rulos de rebote múltiple.',
  },
  {
    id: 'diddles',
    name: 'Diddles & Paradiddles',
    label: 'Diddles',
    color: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Combinaciones sincopadas de golpes simples y dobles para fluidez y velocidad.',
  },
  {
    id: 'flams',
    name: 'Flams & Drags',
    label: 'Flams & Drags',
    color: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Apoyaturas, mordentes y acentos dinámicos fundamentales del vocabulario percusivo.',
  },
  {
    id: 'linear-chops',
    name: 'Modern Fills & Linear Chops',
    label: 'Chops & Fills',
    color: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Patrones lineales avanzados, combinaciones manos-bombo estilo Gospel y Bonham.',
  },
];

export const RUDIMENTS_DATA: RudimentItem[] = [
  // ==========================================
  // 1. ROLLS
  // ==========================================
  {
    id: 'single-stroke-roll',
    name: 'Single Stroke Roll',
    category: 'rolls',
    difficulty: 'Principiante',
    description: 'Alternancia pura derecha-izquierda (R-L-R-L). La base de la técnica de baquetas.',
    subdivision: 4, // 16th notes
    defaultBpm: 120,
    tags: ['PAS 40', 'Básico', 'Velocidad', '16ths'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'R', kitPiece: 'tom1' },
      { sticking: 'L', kitPiece: 'tom1' },
    ],
  },
  {
    id: 'double-stroke-roll',
    name: 'Double Stroke Roll (Open Roll)',
    category: 'rolls',
    difficulty: 'Intermedio',
    description: 'Dos golpes por mano controlando el rebote pasivo y activo (R-R-L-L).',
    subdivision: 4, // 16th notes
    defaultBpm: 110,
    tags: ['PAS 40', 'Rebote', 'Doble Golpe', '16ths'],
    steps: [
      { sticking: 'R', kitPiece: 'snare' },
      { sticking: 'R', kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'snare' },
    ],
  },
  {
    id: 'five-stroke-roll',
    name: 'Five Stroke Roll (5-Stroke)',
    category: 'rolls',
    difficulty: 'Intermedio',
    description: 'Dos dobles y una resolución acentuada (R-R-L-L >R). Esencial para remates rápidos.',
    subdivision: 5, // Quintuplet 5:4
    defaultBpm: 105,
    tags: ['PAS 40', 'Quintillo', 'Remate', 'Dinámica'],
    steps: [
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', accent: true, kitPiece: 'crash' },
    ],
  },
  {
    id: 'six-stroke-roll',
    name: 'Six Stroke Roll (6-Stroke)',
    category: 'rolls',
    difficulty: 'Avanzado',
    description: 'Figura de seisillo (>R l l r r >L) con acento inicial y final. Utilizado en solos y gospel.',
    subdivision: 6, // Sextuplet 6:4
    defaultBpm: 100,
    tags: ['PAS 40', 'Seisillo', 'Acentos', 'Solo'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', accent: true, kitPiece: 'floorTom' },
    ],
  },
  {
    id: 'seven-stroke-roll',
    name: 'Seven Stroke Roll (7-Stroke)',
    category: 'rolls',
    difficulty: 'Avanzado',
    description: 'Tres dobles y resolución acentuada (R-R-L-L-R-R >L) en subdivisión de septillo.',
    subdivision: 7, // Septuplet 7:4
    defaultBpm: 90,
    tags: ['PAS 40', 'Septillo', 'Redoble'],
    steps: [
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', accent: true, kitPiece: 'crash' },
    ],
  },
  {
    id: 'buzz-roll',
    name: 'Multiple Bounce Roll (Buzz / Press Roll)',
    category: 'rolls',
    difficulty: 'Intermedio',
    description: 'Redoble orquestal cerrado presionando las baquetas para producir un zumbido continuo.',
    subdivision: 4,
    defaultBpm: 95,
    tags: ['Orquestal', 'Zumbido', 'Presión', 'Textura'],
    steps: [
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
    ],
  },

  // ==========================================
  // 2. DIDDLES & PARADIDDLES
  // ==========================================
  {
    id: 'single-paradiddle',
    name: 'Single Paradiddle',
    category: 'diddles',
    difficulty: 'Principiante',
    description: 'El rudimento insignia del baterista: acento en el 1, seguido de simples y un doble (>R L R R).',
    subdivision: 4,
    defaultBpm: 110,
    tags: ['PAS 40', 'Insignia', '16ths', 'Groove'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'tom1' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
    ],
  },
  {
    id: 'double-paradiddle',
    name: 'Double Paradiddle',
    category: 'diddles',
    difficulty: 'Intermedio',
    description: 'Dos golpes simples adicionales antes del diddle (>R L >R L R R), perfecto en compases de 6/8 o seisillos.',
    subdivision: 6,
    defaultBpm: 95,
    tags: ['PAS 40', '6/8', 'Seisillo', 'Polirritmia'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'hihatClosed' },
      { sticking: 'R', accent: true, kitPiece: 'tom1' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
    ],
  },
  {
    id: 'paradiddle-diddle',
    name: 'Paradiddle-Diddle',
    category: 'diddles',
    difficulty: 'Intermedio',
    description: 'Un simple y dos dobles consecutivos (>R L R R L L). Flujo continuo de semicorcheas o seisillos.',
    subdivision: 6,
    defaultBpm: 105,
    tags: ['PAS 40', 'Funk', 'Ghost Notes', 'Seisillo'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'hihatClosed' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
    ],
  },
  {
    id: 'triple-paradiddle',
    name: 'Triple Paradiddle',
    category: 'diddles',
    difficulty: 'Avanzado',
    description: 'Tres pares de golpes simples antes del doble (>R L >R L >R L R R) para frases amplias.',
    subdivision: 8, // 32nd notes
    defaultBpm: 80,
    tags: ['PAS 40', 'Fraseo', 'Acentos'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'crash' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'R', accent: true, kitPiece: 'tom1' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'R', accent: true, kitPiece: 'floorTom' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
    ],
  },

  // ==========================================
  // 3. FLAMS & DRAGS
  // ==========================================
  {
    id: 'flam',
    name: 'Flam (Mordente simple)',
    category: 'flams',
    difficulty: 'Principiante',
    description: 'Apoyatura suave con una mano ligeramente antes del golpe principal acentuado (lR / rL).',
    subdivision: 2, // 8th notes
    defaultBpm: 100,
    tags: ['PAS 40', 'Apoyatura', 'Mordente', 'Grosor'],
    steps: [
      { sticking: 'R', flam: true, accent: true, kitPiece: 'snare' },
      { sticking: 'L', flam: true, accent: true, kitPiece: 'snare' },
    ],
  },
  {
    id: 'flam-accent',
    name: 'Flam Accent (Tresillo con Flam)',
    category: 'flams',
    difficulty: 'Intermedio',
    description: 'Tresillo con flam en el golpe 1 y dos golpes suaves en tiempos 2 y 3 (lR L R rL R L).',
    subdivision: 3, // Triplet 3:2
    defaultBpm: 110,
    tags: ['PAS 40', 'Tresillo', 'Acento', 'Swing'],
    steps: [
      { sticking: 'R', flam: true, accent: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'tom1' },
      { sticking: 'R', ghost: true, kitPiece: 'floorTom' },
    ],
  },
  {
    id: 'flam-tap',
    name: 'Flam Tap',
    category: 'flams',
    difficulty: 'Intermedio',
    description: 'Flam seguido inmediatamente por un tap suave de la misma mano (lR R rL L).',
    subdivision: 4,
    defaultBpm: 100,
    tags: ['PAS 40', 'Tap', 'Sincronía'],
    steps: [
      { sticking: 'R', flam: true, accent: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', flam: true, accent: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
    ],
  },
  {
    id: 'flamacue',
    name: 'Flamacue',
    category: 'flams',
    difficulty: 'Avanzado',
    description: 'Síncopa clásica donde el acento cae en la segunda semicorchea: flam en 1, >acento en la e (lR >L R L lR).',
    subdivision: 4,
    defaultBpm: 95,
    tags: ['PAS 40', 'Síncopa', 'Dinámica Fuerte'],
    steps: [
      { sticking: 'R', flam: true, kitPiece: 'snare' },
      { sticking: 'L', accent: true, kitPiece: 'snare' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', ghost: true, kitPiece: 'snare' },
    ],
  },
  {
    id: 'swiss-army-triplet',
    name: 'Swiss Army Triplet',
    category: 'flams',
    difficulty: 'Intermedio',
    description: 'Tresillo con mano derecha fija y flam inicial (lR R L lR R L), utilizado en marchas y solos de rock.',
    subdivision: 3,
    defaultBpm: 115,
    tags: ['PAS 40', 'Suizo', 'Tresillo', 'Lead Right'],
    steps: [
      { sticking: 'R', flam: true, accent: true, kitPiece: 'crash' },
      { sticking: 'R', ghost: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'floorTom' },
    ],
  },
  {
    id: 'drag-ruff',
    name: 'Drag / Ruff (Doble Apoyatura)',
    category: 'flams',
    difficulty: 'Intermedio',
    description: 'Doble golpe suave antes del golpe principal (llR / rrL), aporta textura y peso rítmico.',
    subdivision: 3,
    defaultBpm: 90,
    tags: ['PAS 40', 'Drag', 'Ruff', 'Apoyatura'],
    steps: [
      { sticking: 'R', flam: true, accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'R', kitPiece: 'snare' },
    ],
  },

  // ==========================================
  // 4. MODERN FILLS & LINEAR CHOPS
  // ==========================================
  {
    id: 'gospel-chop-seisillo',
    name: 'Gospel Chops (R-L-K-K-R-L)',
    category: 'linear-chops',
    difficulty: 'Avanzado',
    description: 'Seisillo lineal clásico de Gospel: dos manos, dos bombos y dos toms sin superposición de golpes.',
    subdivision: 6, // Sextuplet 6:4
    defaultBpm: 95,
    tags: ['Gospel', 'Lineal', 'Bombo Doble', 'Chops'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'tom1' },
      { sticking: 'K', accent: true, kitPiece: 'kick' },
      { sticking: 'K', kitPiece: 'kick' },
      { sticking: 'R', accent: true, kitPiece: 'tom2' },
      { sticking: 'L', accent: true, kitPiece: 'floorTom' },
    ],
  },
  {
    id: 'herta-fill',
    name: 'The Herta Fill (R-L-R-L Híbrido)',
    category: 'linear-chops',
    difficulty: 'Avanzado',
    description: 'Patrón híbrido de alta energía: dos golpes ultrarrápidos seguidos de dos golpes espaciados.',
    subdivision: 4,
    defaultBpm: 105,
    tags: ['Herta', 'Chop', 'Velocidad', 'Metal/Gospel'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'snare' },
      { sticking: 'R', accent: true, kitPiece: 'tom1' },
      { sticking: 'L', accent: true, kitPiece: 'floorTom' },
    ],
  },
  {
    id: 'bonham-triplets',
    name: 'Bonham Triplets (R-L-K)',
    category: 'linear-chops',
    difficulty: 'Intermedio',
    description: 'El legendario tresillo de John Bonham: mano derecha (Tom), mano izquierda (Floor Tom) y Bombo.',
    subdivision: 3, // Triplet 3:2
    defaultBpm: 120,
    tags: ['Bonham', 'Led Zeppelin', 'Rock Clásico', 'Tresillo'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'tom1' },
      { sticking: 'L', accent: true, kitPiece: 'floorTom' },
      { sticking: 'K', accent: true, kitPiece: 'kick' },
    ],
  },
  {
    id: 'linear-quad-fill',
    name: 'Linear 16th Quad (R-L-K-K)',
    category: 'linear-chops',
    difficulty: 'Intermedio',
    description: 'Cuarteto lineal en semicorcheas: Mano derecha, Mano izquierda y dos golpes rápidos de bombo.',
    subdivision: 4,
    defaultBpm: 110,
    tags: ['Quad', 'Lineal', 'Fill Rápido', '16ths'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'tom1' },
      { sticking: 'K', accent: true, kitPiece: 'kick' },
      { sticking: 'K', kitPiece: 'kick' },
    ],
  },
  {
    id: 'five-stroke-linear-chop',
    name: '5-Stroke Linear Chops (R-L-K-K-R)',
    category: 'linear-chops',
    difficulty: 'Avanzado',
    description: 'Frase lineal en quintillo o semicorcheas con resolución contundente en plato crash.',
    subdivision: 5, // Quintuplet 5:4
    defaultBpm: 100,
    tags: ['Quintillo', 'Crash', 'Linear', 'Modern'],
    steps: [
      { sticking: 'R', accent: true, kitPiece: 'snare' },
      { sticking: 'L', kitPiece: 'tom1' },
      { sticking: 'K', accent: true, kitPiece: 'kick' },
      { sticking: 'K', kitPiece: 'kick' },
      { sticking: 'R', accent: true, kitPiece: 'crash' },
    ],
  },
];
