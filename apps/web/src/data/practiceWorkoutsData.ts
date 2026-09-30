import { AccompanimentTexture, VoicingType } from '@/services/theory/keysTheoryEngine';

export interface PracticeRoutine {
  id: string;
  title: string;
  objective: string;
  bpm: number;
  bpmRange: string;
  rootNote: string;
  texture: AccompanimentTexture;
  voicingType: VoicingType;
  category: 'scale' | 'chord' | 'progression' | 'cadencia';
  targetItemId: string;
  targetItemName: string;
  leftHandInstruction: string;
  rightHandInstruction: string;
  pedagogicalTip: string;
}

export interface WorkoutLevel {
  levelNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  objective: string;
  colorTheme: {
    accent: string;
    border: string;
    bgBadge: string;
    glow: string;
  };
  suggestedBpm: string;
  routines: PracticeRoutine[];
}

export const WORKOUT_LEVELS: WorkoutLevel[] = [
  // =========================================================================
  // NIVEL 1: PRINCIPIANTE (Fundamentos & Coordinación)
  // =========================================================================
  {
    levelNumber: 1,
    title: 'Nivel 1: Principiante',
    subtitle: 'Fundamentos & Coordinación Motriz',
    objective: 'Independencia de manos, estabilidad rítmica y digitación básica (paso de pulgar).',
    suggestedBpm: '70 - 85 BPM',
    colorTheme: {
      accent: 'text-emerald-400',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      bgBadge: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
      glow: 'shadow-emerald-500/20',
    },
    routines: [
      {
        id: 'routine_l1_hands_coord',
        title: '1. Coordinación Manos: Bajo Fundamental (Izq) + Tríadas en Negras (Der)',
        objective: 'Independencia motriz tocando el bajo en tónica con la mano izquierda y la tríada en negras con la derecha.',
        bpm: 75,
        bpmRange: '70 - 80 BPM',
        rootNote: 'C',
        texture: 'lh_bass_rh_chord',
        voicingType: 'close',
        category: 'cadencia',
        targetItemId: 'cad_pac',
        targetItemName: 'Cadencia Auténtica Perfecta (V - I)',
        leftHandInstruction: 'Mano Izquierda: Toca el bajo en negras estables en C2 y G1 con dedo 5.',
        rightHandInstruction: 'Mano Derecha: Toca la tríada cerrada (1 - 3 - 5) con dedos 1-3-5 sin tensión en muñeca.',
        pedagogicalTip: 'Mantén la muñeca relajada y respira con cada cambio de compás.',
      },
      {
        id: 'routine_l1_major_scale',
        title: '2. Escala Mayor en Ambas Manos (Paso de Pulgar)',
        objective: 'Aprender la técnica fundamental del paso del pulgar por debajo de la palma (1-2-3-1-2-3-4-5).',
        bpm: 80,
        bpmRange: '75 - 85 BPM',
        rootNote: 'C',
        texture: 'arpeggio_asc',
        voicingType: 'close',
        category: 'scale',
        targetItemId: 'ionian',
        targetItemName: 'Escala Mayor de Do (Jónico)',
        leftHandInstruction: 'Mano Izquierda: Digitación 5-4-3-2-1-3-2-1 con apoyo firme.',
        rightHandInstruction: 'Mano Derecha: Digitación 1-2-3-1-2-3-4-5 pasando el pulgar con suavidad tras el dedo 3.',
        pedagogicalTip: 'Anticipa el movimiento del pulgar por debajo de la palma sin levantar el codo.',
      },
      {
        id: 'routine_l1_pop_3chords',
        title: '3. Progresión Pop 3 Acordes (I - IV - V)',
        objective: 'Dominar la transición más común de la música popular (Do - Fa - Sol).',
        bpm: 82,
        bpmRange: '75 - 85 BPM',
        rootNote: 'C',
        texture: 'comping',
        voicingType: 'close',
        category: 'cadencia',
        targetItemId: 'cad_plagal_half',
        targetItemName: 'Progresión I - IV - V (Do - Fa - Sol)',
        leftHandInstruction: 'Mano Izquierda: Marca la fundamental en redondas en el tiempo 1.',
        rightHandInstruction: 'Mano Derecha: Conduce las tríadas buscando notas comunes para mover poco la mano.',
        pedagogicalTip: 'Fíjate en las notas comunes entre acordes contiguos para evitar saltos bruscos.',
      },
    ],
  },

  // =========================================================================
  // NIVEL 2: INTERMEDIO (Fluidez & Arpegios)
  // =========================================================================
  {
    levelNumber: 2,
    title: 'Nivel 2: Intermedio',
    subtitle: 'Fluidez Rítmica & Arpegios Abiertos',
    objective: 'Progresiones estándar en corcheas, voicings abiertos y escala pentatónica de blues.',
    suggestedBpm: '85 - 105 BPM',
    colorTheme: {
      accent: 'text-cyan-400',
      border: 'border-cyan-500/40 hover:border-cyan-400',
      bgBadge: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60',
      glow: 'shadow-cyan-500/20',
    },
    routines: [
      {
        id: 'routine_l2_pop_axis',
        title: '1. El Eje Pop Emocional (I - V - vi - IV) con arpegios fluidos',
        objective: 'Ejecutar la progresión universal de 4 acordes con movimiento de arpegio continuo.',
        bpm: 92,
        bpmRange: '85 - 95 BPM',
        rootNote: 'C',
        texture: 'arpeggio_asc',
        voicingType: 'close',
        category: 'progresion',
        targetItemId: 'prog_pop_4chords',
        targetItemName: 'Eje Universal Pop (I - V - vi - IV)',
        leftHandInstruction: 'Mano Izquierda: Bajo en octavas quebradas (1 - 5).',
        rightHandInstruction: 'Mano Derecha: Arpegio continuo ascendente en corcheas.',
        pedagogicalTip: 'Sincroniza el pedal sustain para limpiar exactamente en el tiempo 1 de cada acorde.',
      },
      {
        id: 'routine_l2_open_sevenths',
        title: '2. Tétradas Maj7 y m7 con voicings abiertos (Spread)',
        objective: 'Ampliar el registro dinámico del piano espaciando tercera y séptima.',
        bpm: 95,
        bpmRange: '90 - 100 BPM',
        rootNote: 'F',
        texture: 'comping',
        voicingType: 'open',
        category: 'cadencia',
        targetItemId: 'cad_ii_v_i_maj',
        targetItemName: 'Cadencia II - V - I con Voicings Abiertos',
        leftHandInstruction: 'Mano Izquierda: Fundamental y quinta espaciadas (F1 - C2).',
        rightHandInstruction: 'Mano Derecha: 3ª y 7ª abiertas en registro medio para dejar aire armónico.',
        pedagogicalTip: 'Los voicings abiertos evitan la saturación de graves y proyectan sonoridad profesional.',
      },
      {
        id: 'routine_l2_pentatonic_blues',
        title: '3. Escala Pentatónica Menor & Blues en semicorcheas',
        objective: 'Desarrollar articulación rápida y digitación de blues sobre acordes menores.',
        bpm: 100,
        bpmRange: '95 - 105 BPM',
        rootNote: 'A',
        texture: 'arpeggio_asc',
        voicingType: 'close',
        category: 'scale',
        targetItemId: 'pentatonic_minor',
        targetItemName: 'Pentatónica Menor de La (Blues/Rock)',
        leftHandInstruction: 'Mano Izquierda: Vamp rítmico en corcheas sobre el acorde Am7.',
        rightHandInstruction: 'Mano Derecha: Fraseo ágil sobre notas de blues (1, b3, 4, #4, 5, b7).',
        pedagogicalTip: 'Apoya los acentos en el segundo y cuarto pulso para darle swing natural.',
      },
    ],
  },

  // =========================================================================
  // NIVEL 3: AVANZADO (Jazz Standards & Drop 2)
  // =========================================================================
  {
    levelNumber: 3,
    title: 'Nivel 3: Avanzado',
    subtitle: 'Conducción de Voces & Drop 2',
    objective: 'Voicings Drop 2, conducción de voces suave por semitonos y síncopa de Bossa Nova.',
    suggestedBpm: '105 - 130 BPM',
    colorTheme: {
      accent: 'text-amber-400',
      border: 'border-amber-500/40 hover:border-amber-400',
      bgBadge: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
      glow: 'shadow-amber-500/20',
    },
    routines: [
      {
        id: 'routine_l3_drop2_ii_v_i',
        title: '1. Cadencia II - V - I Mayor con Voicings Drop 2',
        objective: 'Dominar la disposición Drop 2 (bajar la segunda voz superior una octava) para piano comping de Jazz.',
        bpm: 115,
        bpmRange: '105 - 120 BPM',
        rootNote: 'C',
        texture: 'comping',
        voicingType: 'drop2',
        category: 'cadencia',
        targetItemId: 'cad_ii_v_i_drop2',
        targetItemName: 'II - V - I Mayor con Voicings Drop 2',
        leftHandInstruction: 'Mano Izquierda: Toca la segunda voz superior transportada una octava abajo.',
        rightHandInstruction: 'Mano Derecha: Guía la melodía de 3ª y 7ª con conducción por semitonos.',
        pedagogicalTip: 'La magia del Drop 2 radica en la suavidad de las voces internas que casi no saltan.',
      },
      {
        id: 'routine_l3_bossa_comping',
        title: '2. Comping de Bossa Nova (Garota de Ipanema)',
        objective: 'Aprender la clásica síncopa rítmica de Bossa Nova con bajo de pulgar y acordes mordentes.',
        bpm: 120,
        bpmRange: '110 - 125 BPM',
        rootNote: 'F',
        texture: 'walking_bass',
        voicingType: 'drop2',
        category: 'cadencia',
        targetItemId: 'cad_bossa',
        targetItemName: 'Turnaround de Bossa Nova (Fmaj7 - G7 - Gm7 - C7)',
        leftHandInstruction: 'Mano Izquierda: Bajo sincopado de surdo en tiempos 1 y 2 con anticipación.',
        rightHandInstruction: 'Mano Derecha: Mordente sutil y comping sincopado en corcheas bossa.',
        pedagogicalTip: 'Toca con toque ligero, dinámicas suaves y swing brasileño sin presionar el teclado.',
      },
      {
        id: 'routine_l3_melodic_minor_mmaj7',
        title: '3. Escala Menor Melódica & Acordes mMaj7',
        objective: 'Sonoridad misteriosa de Jazz moderno ("James Bond") y modo menor melódico.',
        bpm: 110,
        bpmRange: '100 - 115 BPM',
        rootNote: 'C',
        texture: 'arpeggio_desc',
        voicingType: 'open',
        category: 'scale',
        targetItemId: 'melodic_minor',
        targetItemName: 'Escala Menor Melódica (Jazz Minor)',
        leftHandInstruction: 'Mano Izquierda: Acorde Cm(Maj7) sostenido con pedal.',
        rightHandInstruction: 'Mano Derecha: Arpegio descendente destacando la 7ª mayor (B) y 6ª (A).',
        pedagogicalTip: 'Escucha la tensión oscura y cinematográfica de la menor melódica tradicional.',
      },
    ],
  },

  // =========================================================================
  // NIVEL 4: VIRTUOSO / NEO-SOUL (Armonía Compleja)
  // =========================================================================
  {
    levelNumber: 4,
    title: 'Nivel 4: Virtuoso / Neo-Soul',
    subtitle: 'Rootless Voicings, Cuartales & Tensiones V7',
    objective: 'Voicings sin fundamental (Bill Evans), cuartales McCoy Tyner y dominantes totalmente alterados.',
    suggestedBpm: '65 - 90 BPM (Swing/Shuffle)',
    colorTheme: {
      accent: 'text-rose-400',
      border: 'border-rose-500/40 hover:border-rose-400',
      bgBadge: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
      glow: 'shadow-rose-500/20',
    },
    routines: [
      {
        id: 'routine_l4_neo_soul_vamp',
        title: '1. Vamp Neo-Soul D\'Angelo con novenas y oncenas',
        objective: 'Voicings Rootless A & B (3-5-7-9 y 7-9-3-5) con textura laid-back y color Rhodes cálido.',
        bpm: 78,
        bpmRange: '70 - 82 BPM',
        rootNote: 'Eb',
        texture: 'lh_bass_rh_chord',
        voicingType: 'rootless',
        category: 'cadencia',
        targetItemId: 'cad_neo_soul_resolution',
        targetItemName: 'Resolución Neo-Soul (bVIImaj9 ➔ Imaj9)',
        leftHandInstruction: 'Mano Izquierda: Bajo profundo sincopado con laid-back feel.',
        rightHandInstruction: 'Mano Derecha: Voicings Rootless A & B (3-5-7-9 y 7-9-3-5) con color Rhodes.',
        pedagogicalTip: 'Toca ligeramente detrás del tiempo (laid back) para conseguir ese groove orgánico de R&B.',
      },
      {
        id: 'routine_l4_quartal_dorian',
        title: '2. Armonía Cuartal McCoy Tyner sobre Modo Dórico',
        objective: 'Acordes apilados por cuartas justas que se desplazan paralelamente sin tonalidad rígida.',
        bpm: 85,
        bpmRange: '75 - 90 BPM',
        rootNote: 'D',
        texture: 'comping',
        voicingType: 'quartal',
        category: 'scale',
        targetItemId: 'dorian',
        targetItemName: 'Modo Dórico de Re con Voicings Cuartales',
        leftHandInstruction: 'Mano Izquierda: Quinta pedal y fundamental D2.',
        rightHandInstruction: 'Mano Derecha: Acordes cuartales apilados por cuartas justas (E - A - D / F# - B - E).',
        pedagogicalTip: 'El acorde cuartal no tiene una polaridad mayor/menor fija; fluye libremente sobre el modo.',
      },
      {
        id: 'routine_l4_minor_ii_v_alt',
        title: '3. II - V - I Menor con Dominante Alterada (7#9 / 7b13)',
        objective: 'Tensión armónica máxima sobre el V7alt con sustituto tritonal resolviendo a tónica menor.',
        bpm: 75,
        bpmRange: '68 - 80 BPM',
        rootNote: 'C',
        texture: 'comping',
        voicingType: 'drop2',
        category: 'cadencia',
        targetItemId: 'cad_subv7_b9',
        targetItemName: 'II - V - I Menor Alterado con Sustituto Tritonal',
        leftHandInstruction: 'Mano Izquierda: Tritono 3ª y 7ª en el compás del V7.',
        rightHandInstruction: 'Mano Derecha: Clúster de tensiones alteradas (#9 y b13) resolviendo a im9.',
        pedagogicalTip: 'El movimiento de medio tono en las voces es lo que hace que una tensión alterada resuelva con belleza.',
      },
    ],
  },
];
