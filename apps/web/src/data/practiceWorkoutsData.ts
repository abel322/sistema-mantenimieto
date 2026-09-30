import { AccompanimentTexture, VoicingType } from '@/services/theory/keysTheoryEngine';

export type HandFocus = 'left' | 'right' | 'both';

export interface RunwayNoteEvent {
  id: string;
  note: string;       // Ej: 'C3', 'G3', 'C4', 'E4'
  midi: number;
  time: number;       // Tiempo en segundos o compases (0, 0.5, 1.0, 1.5...)
  step: number;       // Paso dentro del compás
  duration: string;   // '4n', '8n', '16n'
  hand: 'left' | 'right';
  velocity?: number;
}

export interface PracticeRoutine {
  id: string;
  title: string;
  objective: string;
  bpm: number;
  bpmRange: string;
  rootNote: string;
  texture: AccompanimentTexture;
  voicingType: VoicingType;
  category: 'scale' | 'cadencia' | 'chord' | 'progression' | 'progresion';
  targetItemId: string;
  targetItemName: string;
  leftHandInstruction: string;
  rightHandInstruction: string;
  pedagogicalTip: string;
  handFocus: HandFocus;
  subdivision?: string;
  notes?: RunwayNoteEvent[];
  executionMode?: 'block' | 'arpeggio';
  arpeggioOctaveSpan?: number | 'full';
  arpeggioPattern?: string;
}

export type PracticeWorkout = PracticeRoutine;
export type CustomWorkout = PracticeRoutine;

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
      // Dedicated Left Hand (LH) Isolation
      {
        id: 'routine_l1_lh_bass_quarters',
        title: 'Independencia LH: Bajos en Negras (Fundamental y 5ª)',
        objective: 'Desarrollar estabilidad métrica e independencia en la mano izquierda alternando fundamental y quinta en registro grave.',
        bpm: 75,
        bpmRange: '70 - 80 BPM',
        rootNote: 'C',
        texture: 'walking_bass',
        voicingType: 'close',
        category: 'cadencia',
        targetItemId: 'cad_pac',
        targetItemName: 'Cadencia Perfecta con Bajos 1-5 (Do - Sol)',
        leftHandInstruction: 'Dedo 5 en C2 (fundamental) y dedo 1 en G2 (quinta). Pulso firme y uniforme en negras.',
        rightHandInstruction: 'Mano derecha en reposo o marcando suavemente el pulso.',
        pedagogicalTip: 'Mantén la mano en posición arqueada natural sin colapsar los nudillos al pulsar con el meñique.',
        handFocus: 'left',
      },
      // Dedicated Right Hand (RH) Isolation
      {
        id: 'routine_l1_rh_major_thumb_under',
        title: 'Digitación RH: Escala Mayor con Paso de Pulgar (1-2-3-1-2-3-4-5)',
        objective: 'Mecanizar el paso suave del pulgar por debajo de los dedos 3 y 4 sin golpes de muñeca ni interrupción del legato.',
        bpm: 80,
        bpmRange: '70 - 85 BPM',
        rootNote: 'C',
        texture: 'arpeggio_asc',
        voicingType: 'close',
        category: 'scale',
        targetItemId: 'ionian',
        targetItemName: 'Escala de Do Mayor (Digitación Hanon Clásica)',
        leftHandInstruction: 'Mano izquierda en reposo descansando sobre el regazo.',
        rightHandInstruction: 'Digitación 1-2-3-1-2-3-4-5. El pulgar se prepara metiéndose bajo la palma justo cuando suena el dedo 3.',
        pedagogicalTip: 'El codo debe permanecer estable; no saques el codo hacia afuera al pasar el pulgar.',
        handFocus: 'right',
      },
      // Both Hands
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
        handFocus: 'both',
      },
      {
        id: 'routine_l1_major_scale',
        title: '2. Escala Mayor en Ambas Manos (Paso de Pulgar Simétrico)',
        objective: 'Aprender la técnica fundamental del paso del pulgar por debajo de la palma en movimiento coordinado.',
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
        handFocus: 'both',
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
        handFocus: 'both',
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
      // Dedicated Left Hand (LH) Isolation
      {
        id: 'routine_l2_lh_arpeggios_15810',
        title: 'LH Arpegios Fluidos 1-5-8-10 (Balada Pop)',
        objective: 'Dominar el movimiento elástico y la rotación del antebrazo en arpegios de décima típicos de piano acompañante pop.',
        bpm: 88,
        bpmRange: '80 - 95 BPM',
        rootNote: 'C',
        texture: 'arpeggio_asc',
        voicingType: 'open',
        category: 'progression',
        targetItemId: 'prog_pop_4chords',
        targetItemName: 'Eje Armónico Pop con Arpegio 1-5-8-10',
        leftHandInstruction: 'Digitación 5 - 2 - 1 - 2 cruzando el pulgar o pivotando suavemente sobre el dedo 2.',
        rightHandInstruction: 'Mano derecha liberada para enfocarse en la escucha del balance armónico.',
        pedagogicalTip: 'Utiliza la rotación suave del antebrazo (pronación/supinación) en vez de estirar los dedos rígidamente.',
        handFocus: 'left',
      },
      // Dedicated Right Hand (RH) Isolation
      {
        id: 'routine_l2_rh_blues_phrasing',
        title: 'RH Pentatónica Blues & Fraseo Melódico con Síncopas',
        objective: 'Articulación de blues moderno utilizando grace notes (mordentes) desde la blue note y síncopas rítmicas.',
        bpm: 95,
        bpmRange: '85 - 105 BPM',
        rootNote: 'A',
        texture: 'arpeggio_asc',
        voicingType: 'close',
        category: 'scale',
        targetItemId: 'blues',
        targetItemName: 'Escala de Blues de La en Semicorcheas & Síncopas',
        leftHandInstruction: 'Mano izquierda en reposo para aislar la agilidad articular de la mano derecha.',
        rightHandInstruction: 'Fraseo ágil con dedos 1-2-3-4 deslizándose con mordente desde Eb hacia E natural.',
        pedagogicalTip: 'Articula con la yema de los dedos cerca de las teclas negras para facilitar los mordentes.',
        handFocus: 'right',
      },
      // Both Hands
      {
        id: 'routine_l2_pop_axis',
        title: '1. El Eje Pop Emocional (I - V - vi - IV) con arpegios fluidos',
        objective: 'Ejecutar la progresión universal de 4 acordes con movimiento de arpegio continuo.',
        bpm: 92,
        bpmRange: '85 - 95 BPM',
        rootNote: 'C',
        texture: 'arpeggio_asc',
        voicingType: 'close',
        category: 'progression',
        targetItemId: 'prog_pop_4chords',
        targetItemName: 'Eje Universal Pop (I - V - vi - IV)',
        leftHandInstruction: 'Mano Izquierda: Bajo en octavas quebradas (1 - 5).',
        rightHandInstruction: 'Mano Derecha: Arpegio continuo ascendente en corcheas.',
        pedagogicalTip: 'Sincroniza el pedal sustain para limpiar exactamente en el tiempo 1 de cada acorde.',
        handFocus: 'both',
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
        handFocus: 'both',
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
        targetItemId: 'penta_minor',
        targetItemName: 'Pentatónica Menor de La (Blues/Rock)',
        leftHandInstruction: 'Mano Izquierda: Vamp rítmico en corcheas sobre el acorde Am7.',
        rightHandInstruction: 'Mano Derecha: Fraseo ágil sobre notas de blues (1, b3, 4, #4, 5, b7).',
        pedagogicalTip: 'Apoya los acentos en el segundo y cuarto pulso para darle swing natural.',
        handFocus: 'both',
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
      // Dedicated Left Hand (LH) Isolation
      {
        id: 'routine_l3_lh_jazz_walking_bass',
        title: 'LH Walking Bass de Jazz sobre II - V - I (Línea continua en negras)',
        objective: 'Construir líneas de bajo caminante fluidas con notas de paso cromáticas y aproximaciones diatónicas.',
        bpm: 110,
        bpmRange: '100 - 120 BPM',
        rootNote: 'C',
        texture: 'walking_bass',
        voicingType: 'drop2',
        category: 'cadencia',
        targetItemId: 'cad_ii_v_i_maj',
        targetItemName: 'Walking Bass II - V - I (Dm7 - G7 - Cmaj7)',
        leftHandInstruction: 'Tiempo 1 fundamental, tiempo 2 arpegio/3ª, tiempo 3 aproximación cromática, tiempo 4 resolución.',
        rightHandInstruction: 'Mano derecha relajada o marcando ocasionalmente shell voicings ligeros.',
        pedagogicalTip: 'Piensa como un contrabajista acústico: sonido ligado (legato firme) con peso de brazo controlado.',
        handFocus: 'left',
      },
      // Dedicated Right Hand (RH) Isolation
      {
        id: 'routine_l3_rh_drop2_voice_leading',
        title: 'RH Voicings Drop 2 y Conducción de Voces Cerradas',
        objective: 'Conducción de voces melódica suave conectando acordes de séptima con el mínimo desplazamiento interválico posible.',
        bpm: 110,
        bpmRange: '100 - 120 BPM',
        rootNote: 'C',
        texture: 'comping',
        voicingType: 'drop2',
        category: 'cadencia',
        targetItemId: 'cad_ii_v_i_drop2',
        targetItemName: 'Conducción de Voces Drop 2 en Mano Derecha',
        leftHandInstruction: 'Mano izquierda en reposo o tocando solo el bajo fundamental como referencia tónica.',
        rightHandInstruction: 'Ejecuta el bloque Drop 2 conectando 3as y 7as con movimiento por semitonos sin saltar.',
        pedagogicalTip: 'Observa cómo las voces internas se mueven solo un semitono o se mantienen quietas.',
        handFocus: 'right',
      },
      // Both Hands
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
        handFocus: 'both',
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
        handFocus: 'both',
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
        handFocus: 'both',
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
      // Dedicated Left Hand (LH) Isolation
      {
        id: 'routine_l4_lh_stride_shell',
        title: 'LH Stride Piano & Saltos de Bajo + Shell Voicing (Ragtime/Swing)',
        objective: 'Coordinación espacial de saltos rápidos entre el bajo en el registro grave (tiempo 1 y 3) y el acorde shell voicing en registro medio (tiempo 2 y 4).',
        bpm: 90,
        bpmRange: '80 - 105 BPM',
        rootNote: 'F',
        texture: 'lh_bass_rh_chord',
        voicingType: 'rootless',
        category: 'cadencia',
        targetItemId: 'cad_subv7_b9',
        targetItemName: 'Stride Swing Turnaround (Fmaj7 - D7b9 - Gm7 - C7)',
        leftHandInstruction: 'Tiempo 1/3: Bajo profundo en F1/D1 con dedo 5. Tiempo 2/4: Salto ágil hacia shell voicing (3ª y 7ª) alrededor de C3.',
        rightHandInstruction: 'Mano derecha libre o respondiendo con riffs sincopados de Swing.',
        pedagogicalTip: 'No mires el teclado durante el salto: entrena la memoria propioceptiva y la distancia espacial de tu brazo.',
        handFocus: 'left',
      },
      // Dedicated Right Hand (RH) Isolation
      {
        id: 'routine_l4_rh_bebop_licks_altered',
        title: 'RH Licks Bebop con Notas de Paso Cromáticas y Arpegios Alterados',
        objective: 'Velocidad y precisión en líneas de Bebop incorporando notas de paso cromáticas y resolución sobre tensiones 9ª y 13ª.',
        bpm: 125,
        bpmRange: '115 - 140 BPM',
        rootNote: 'C',
        texture: 'arpeggio_desc',
        voicingType: 'quartal',
        category: 'scale',
        targetItemId: 'altered',
        targetItemName: 'Fraseo Bebop Alterado sobre G7alt ➔ Cmaj7',
        leftHandInstruction: 'Mano izquierda en reposo para focalizar la velocidad lineal y relajación de la mano derecha.',
        rightHandInstruction: 'Líneas fluidas en corcheas bebop con paso de pulgar veloz y acentos sincopados en contratiempo.',
        pedagogicalTip: 'Acentúa ligeramente las notas a contratiempo (upbeats) para imprimir el swing auténtico del Bebop.',
        handFocus: 'right',
      },
      // Both Hands
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
        handFocus: 'both',
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
        handFocus: 'both',
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
        handFocus: 'both',
      },
    ],
  },
];
