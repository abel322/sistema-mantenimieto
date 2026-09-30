import { PracticeRoutine, HandFocus } from '@/data/practiceWorkoutsData';
import {
  CHROMATIC_NOTES,
  CHORD_CATALOG,
  SCALE_CATALOG,
  PROGRESSION_PRESETS,
  AccompanimentTexture,
  RunwayStepNote,
} from './keysTheoryEngine';
import { HARMONIC_VAULT } from '@/data/harmonicVaultData';

export interface RunwayNoteEvent {
  id: string;
  note: string;       // Ej: 'C3', 'G3', 'C4', 'E4'
  midi: number;
  time: number;       // Tiempo en segundos o compases (0, 0.5, 1.0, 1.5...)
  step: number;       // Paso dentro del compás (0, 1, 2, 3...)
  duration: string;   // '4n', '8n', '16n'
  hand: 'left' | 'right';
  velocity?: number;
}

export function stepNotesToRunwayNoteEvents(stepNotes: RunwayStepNote[]): RunwayNoteEvent[] {
  const events: RunwayNoteEvent[] = [];
  let counter = 0;
  stepNotes.forEach((step) => {
    const durStr =
      step.durationBeats >= 4
        ? '1n'
        : step.durationBeats >= 2
        ? '2n'
        : step.durationBeats >= 1
        ? '4n'
        : step.durationBeats >= 0.5
        ? '8n'
        : '16n';
    const durBeats = durationToBeats(durStr);
    const stepInBar = Math.floor((step.timeBeats % 4) / durBeats);
    step.notes.forEach((n) => {
      counter++;
      events.push({
        id: `ev_step_${counter}_${n.midi}_${step.timeBeats}`,
        note: n.fullNote,
        midi: n.midi,
        time: step.timeBeats,
        step: stepInBar,
        duration: durStr,
        hand: n.midi < 60 ? 'left' : 'right',
        velocity: 0.85,
      });
    });
  });
  return events;
}

export function durationToBeats(duration: string | number): number {
  if (typeof duration === 'number') return duration;
  switch (duration) {
    case '1n':
      return 4;
    case '2n':
      return 2;
    case '4n':
      return 1;
    case '8n':
      return 0.5;
    case '16n':
      return 0.25;
    case '32n':
      return 0.125;
    case '3:2_quarter':
      return 2 / 3;
    case '3:2_eighth':
    case '8t':
    case '3T':
      return 1 / 3;
    case '6T':
    case '16t':
    case '6:4':
      return 1 / 6;
    default:
      const parsed = parseFloat(duration);
      return !isNaN(parsed) ? parsed : 1;
  }
}

export function parseNoteToMidi(noteStr: string): number {
  const match = noteStr.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return 60; // C4 default

  const noteName = match[1];
  const octave = parseInt(match[2], 10);

  const noteToSemitone: { [k: string]: number } = {
    C: 0,
    'C#': 1,
    Db: 1,
    D: 2,
    'D#': 3,
    Eb: 3,
    E: 4,
    F: 5,
    'F#': 6,
    Gb: 6,
    G: 7,
    'G#': 8,
    Ab: 8,
    A: 9,
    'A#': 10,
    Bb: 10,
    B: 11,
  };

  const st = noteToSemitone[noteName] ?? 0;
  return 12 * (octave + 1) + st;
}

export function midiToNoteName(midi: number): string {
  const noteIndex = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const name = CHROMATIC_NOTES[noteIndex];
  return `${name}${octave}`;
}

let eventCounter = 0;
export function createNote(
  note: string,
  time: number,
  duration = '4n',
  hand: 'left' | 'right' = 'left',
  velocity = 0.85,
  step?: number
): RunwayNoteEvent {
  eventCounter++;
  const durBeats = durationToBeats(duration);
  const calculatedStep = step !== undefined ? step : Math.floor((time % 4) / Math.max(0.125, durBeats));
  return {
    id: `ev_${eventCounter}_${note}_${time}`,
    note,
    midi: parseNoteToMidi(note),
    time,
    step: calculatedStep,
    duration,
    hand,
    velocity,
  };
}

/**
 * Builds concrete, musically authentic Runway note events for all dedicated routines
 */
export function generateWorkoutRunwayNotes(
  workout: PracticeRoutine,
  rootNote?: string
): RunwayNoteEvent[] {
  // If workout already carries custom concrete notes, return them
  if (workout.notes && workout.notes.length > 0) {
    return workout.notes;
  }

  const id = workout.id;
  const root = rootNote || workout.rootNote || 'C';

  // =========================================================================
  // NIVEL 1: PRINCIPIANTE
  // =========================================================================

  // 1. LH: Bajos en Negras (Fundamental y 5ª)
  if (id === 'routine_l1_lh_bass_quarters') {
    const events: RunwayNoteEvent[] = [];
    // Bar 1 (C): C2, G1, C2, G2
    events.push(createNote('C2', 0, '4n', 'left'));
    events.push(createNote('G1', 1, '4n', 'left'));
    events.push(createNote('C2', 2, '4n', 'left'));
    events.push(createNote('G2', 3, '4n', 'left'));
    // Bar 2 (F): F1, C2, F1, C2
    events.push(createNote('F1', 4, '4n', 'left'));
    events.push(createNote('C2', 5, '4n', 'left'));
    events.push(createNote('F1', 6, '4n', 'left'));
    events.push(createNote('C2', 7, '4n', 'left'));
    // Bar 3 (G): G1, D2, G1, D2
    events.push(createNote('G1', 8, '4n', 'left'));
    events.push(createNote('D2', 9, '4n', 'left'));
    events.push(createNote('G1', 10, '4n', 'left'));
    events.push(createNote('D2', 11, '4n', 'left'));
    // Bar 4 (C): C2, G2, C2, C2 (Resolución)
    events.push(createNote('C2', 12, '4n', 'left'));
    events.push(createNote('G2', 13, '4n', 'left'));
    events.push(createNote('C2', 14, '2n', 'left'));
    return events;
  }

  // 2. RH: Escala Mayor con Paso de Pulgar (1-2-3-1-2-3-4-5)
  if (id === 'routine_l1_rh_major_thumb_under') {
    const events: RunwayNoteEvent[] = [];
    // Ascendente en negras: C4, D4, E4, F4, G4, A4, B4, C5
    const asc = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    asc.forEach((n, idx) => {
      events.push(createNote(n, idx, '4n', 'right'));
    });
    // Descendente: B4, A4, G4, F4, E4, D4, C4, C4
    const desc = ['B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4'];
    desc.forEach((n, idx) => {
      events.push(createNote(n, 8 + idx, idx === 7 ? '2n' : '4n', 'right'));
    });
    return events;
  }

  // 3. Both: Coordinación Manos (Bajo Izq + Tríadas en Negras Der)
  if (id === 'routine_l1_hands_coord') {
    const events: RunwayNoteEvent[] = [];
    // 4 compases
    for (let bar = 0; bar < 4; bar++) {
      const bOffset = bar * 4;
      const bassNote = bar === 1 ? 'F1' : bar === 2 ? 'G1' : 'C2';
      const chordNotes =
        bar === 1 ? ['F4', 'A4', 'C5'] : bar === 2 ? ['G4', 'B4', 'D5'] : ['C4', 'E4', 'G4'];

      // LH: Redonda o blancas en el bajo
      events.push(createNote(bassNote, bOffset, '2n', 'left'));
      events.push(createNote(bassNote, bOffset + 2, '2n', 'left'));

      // RH: Tríada en cada negra
      for (let beat = 0; beat < 4; beat++) {
        chordNotes.forEach((cn) => {
          events.push(createNote(cn, bOffset + beat, '4n', 'right'));
        });
      }
    }
    return events;
  }

  // 4. Both: Escala Mayor en Ambas Manos
  if (id === 'routine_l1_major_scale') {
    const events: RunwayNoteEvent[] = [];
    const notesLH = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3', 'C3'];
    const notesRH = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4'];

    notesLH.forEach((n, idx) => {
      events.push(createNote(n, idx, '4n', 'left'));
      events.push(createNote(notesRH[idx], idx, '4n', 'right'));
    });
    return events;
  }

  // 5. Both: Progresión Pop 3 Acordes (I - IV - V)
  if (id === 'routine_l1_pop_3chords') {
    const events: RunwayNoteEvent[] = [];
    const progression = [
      { bass: 'C2', chord: ['C4', 'E4', 'G4'] },
      { bass: 'F1', chord: ['C4', 'F4', 'A4'] },
      { bass: 'G1', chord: ['B3', 'D4', 'G4'] },
      { bass: 'C2', chord: ['C4', 'E4', 'G4'] },
    ];
    progression.forEach((prog, barIdx) => {
      const b = barIdx * 4;
      events.push(createNote(prog.bass, b, '1n', 'left'));
      events.push(createNote(prog.bass, b + 2, '2n', 'left'));
      [b, b + 1, b + 2, b + 3].forEach((t) => {
        prog.chord.forEach((cn) => events.push(createNote(cn, t, '4n', 'right')));
      });
    });
    return events;
  }

  // =========================================================================
  // NIVEL 2: INTERMEDIO
  // =========================================================================

  // 6. LH: Arpegios Fluidos 1-5-8-10 (Balada Pop)
  if (id === 'routine_l2_lh_arpeggios_15810') {
    const events: RunwayNoteEvent[] = [];
    const bars = [
      { base: 0, notes: ['C3', 'G3', 'C4', 'E4', 'G3', 'C4', 'E4', 'G3'] },
      { base: 4, notes: ['G2', 'D3', 'G3', 'B3', 'D3', 'G3', 'B3', 'D3'] },
      { base: 8, notes: ['A2', 'E3', 'A3', 'C4', 'E3', 'A3', 'C4', 'E3'] },
      { base: 12, notes: ['F2', 'C3', 'F3', 'A3', 'C3', 'F3', 'A3', 'C3'] },
    ];

    bars.forEach((bar) => {
      bar.notes.forEach((note, step) => {
        events.push(createNote(note, bar.base + step * 0.5, '8n', 'left', 0.85, step));
      });
    });
    return events;
  }

  // 7. RH: Pentatónica Blues & Fraseo Melódico con Síncopas
  if (id === 'routine_l2_rh_blues_phrasing') {
    const events: RunwayNoteEvent[] = [];
    // Fraseo melódico de blues en La (A4, C5, D5, Eb5, E5, G5, A5)
    const phrase = [
      { n: 'A4', t: 0, d: '8n' },
      { n: 'C5', t: 0.5, d: '8n' },
      { n: 'D5', t: 1.0, d: '8n' },
      { n: 'Eb5', t: 1.5, d: '16n' },
      { n: 'E5', t: 1.75, d: '8n' },
      { n: 'G5', t: 2.5, d: '8n' },
      { n: 'A5', t: 3.0, d: '4n' },

      { n: 'G5', t: 4.0, d: '8n' },
      { n: 'E5', t: 4.5, d: '8n' },
      { n: 'D5', t: 5.0, d: '8n' },
      { n: 'C5', t: 5.5, d: '8n' },
      { n: 'A4', t: 6.0, d: '2n' },

      { n: 'C5', t: 8.0, d: '8n' },
      { n: 'D5', t: 8.5, d: '8n' },
      { n: 'Eb5', t: 9.0, d: '16n' },
      { n: 'E5', t: 9.25, d: '8n' },
      { n: 'C5', t: 10.0, d: '8n' },
      { n: 'A4', t: 10.5, d: '4n' },

      { n: 'E5', t: 12.0, d: '8n' },
      { n: 'D5', t: 12.5, d: '8n' },
      { n: 'C5', t: 13.0, d: '8n' },
      { n: 'A4', t: 13.5, d: '2n' },
    ];

    phrase.forEach((p) => {
      events.push(createNote(p.n, p.t, p.d, 'right'));
    });
    return events;
  }

  // 8. Both: Eje Pop Emocional
  if (id === 'routine_l2_pop_axis') {
    const events: RunwayNoteEvent[] = [];
    const chords = [
      { bass: 'C2', notes: ['C4', 'E4', 'G4', 'C5'] },
      { bass: 'G1', notes: ['B3', 'D4', 'G4', 'B4'] },
      { bass: 'A1', notes: ['C4', 'E4', 'A4', 'C5'] },
      { bass: 'F1', notes: ['C4', 'F4', 'A4', 'C5'] },
    ];
    chords.forEach((c, i) => {
      const b = i * 4;
      events.push(createNote(c.bass, b, '2n', 'left'));
      events.push(createNote(c.bass, b + 2, '2n', 'left'));
      // Arpegio ascendente en semicorcheas/corcheas
      for (let rep = 0; rep < 2; rep++) {
        c.notes.forEach((n, nIdx) => {
          events.push(createNote(n, b + rep * 2 + nIdx * 0.5, '8n', 'right'));
        });
      }
    });
    return events;
  }

  // 9. Both: Tétradas Maj7 y m7 con voicings abiertos (Spread)
  if (id === 'routine_l2_open_sevenths') {
    const events: RunwayNoteEvent[] = [];
    const chords = [
      { bass: ['G1', 'D2'], rh: ['F4', 'B4', 'E5'] },
      { bass: ['C2', 'G2'], rh: ['E4', 'B4', 'D5'] },
      { bass: ['F1', 'C2'], rh: ['A3', 'E4', 'G4'] },
      { bass: ['Bb1', 'F2'], rh: ['D4', 'A4', 'C5'] },
    ];
    chords.forEach((c, i) => {
      const b = i * 4;
      c.bass.forEach((bn) => events.push(createNote(bn, b, '1n', 'left')));
      [b, b + 2].forEach((t) => {
        c.rh.forEach((rn) => events.push(createNote(rn, t, '2n', 'right')));
      });
    });
    return events;
  }

  // 10. Both: Pentatónica Menor & Blues
  if (id === 'routine_l2_pentatonic_blues') {
    const events: RunwayNoteEvent[] = [];
    // LH vamp en Am7
    for (let bar = 0; bar < 4; bar++) {
      const b = bar * 4;
      events.push(createNote('A1', b, '4n', 'left'));
      events.push(createNote('E2', b + 1, '4n', 'left'));
      events.push(createNote('G2', b + 2, '4n', 'left'));
      events.push(createNote('A2', b + 3, '4n', 'left'));
    }
    // RH riffs
    const rhRiff = [
      'A4', 'C5', 'D5', 'Eb5', 'E5', 'G5', 'A5', 'G5',
      'E5', 'D5', 'C5', 'A4', 'C5', 'A4', 'G4', 'A4',
      'C5', 'D5', 'Eb5', 'E5', 'G5', 'A5', 'C6', 'A5',
      'G5', 'E5', 'D5', 'C5', 'A4', 'A4', 'A4', 'A4',
    ];
    rhRiff.forEach((n, idx) => {
      events.push(createNote(n, idx * 0.5, '8n', 'right'));
    });
    return events;
  }

  // =========================================================================
  // NIVEL 3: AVANZADO
  // =========================================================================

  // 11. LH: Jazz Walking Bass sobre II - V - I
  if (id === 'routine_l3_lh_jazz_walking_bass') {
    const events: RunwayNoteEvent[] = [];
    // Bar 1 (Dm7): D2, F2, A2, Ab2
    events.push(createNote('D2', 0, '4n', 'left'));
    events.push(createNote('F2', 1, '4n', 'left'));
    events.push(createNote('A2', 2, '4n', 'left'));
    events.push(createNote('Ab2', 3, '4n', 'left'));
    // Bar 2 (G7): G2, B2, D2, Db2
    events.push(createNote('G2', 4, '4n', 'left'));
    events.push(createNote('B2', 5, '4n', 'left'));
    events.push(createNote('D2', 6, '4n', 'left'));
    events.push(createNote('Db2', 7, '4n', 'left'));
    // Bar 3 (Cmaj7): C2, E2, G2, Bb1
    events.push(createNote('C2', 8, '4n', 'left'));
    events.push(createNote('E2', 9, '4n', 'left'));
    events.push(createNote('G2', 10, '4n', 'left'));
    events.push(createNote('Bb1', 11, '4n', 'left'));
    // Bar 4 (A7 / Turnaround): A1, C#2, E2, Eb2
    events.push(createNote('A1', 12, '4n', 'left'));
    events.push(createNote('C#2', 13, '4n', 'left'));
    events.push(createNote('E2', 14, '4n', 'left'));
    events.push(createNote('Eb2', 15, '4n', 'left'));
    return events;
  }

  // 12. RH: Voicings Drop 2 y Conducción de Voces Cerradas
  if (id === 'routine_l3_rh_drop2_voice_leading') {
    const events: RunwayNoteEvent[] = [];
    const chords = [
      { t: 0, notes: ['C4', 'F4', 'A4', 'D5'] }, // Dm7 Drop 2
      { t: 2, notes: ['C4', 'F4', 'A4', 'D5'] },
      { t: 4, notes: ['B3', 'F4', 'G4', 'D5'] }, // G7 Drop 2
      { t: 6, notes: ['B3', 'F4', 'G4', 'D5'] },
      { t: 8, notes: ['B3', 'E4', 'G4', 'C5'] }, // Cmaj7 Drop 2
      { t: 10, notes: ['B3', 'E4', 'G4', 'C5'] },
      { t: 12, notes: ['B3', 'E4', 'G4', 'C5'] },
      { t: 14, notes: ['B3', 'E4', 'G4', 'C5'] },
    ];
    chords.forEach((c) => {
      c.notes.forEach((n) => events.push(createNote(n, c.t, '2n', 'right')));
    });
    return events;
  }

  // 13. Both: II - V - I Mayor con Voicings Drop 2
  if (id === 'routine_l3_drop2_ii_v_i') {
    const events: RunwayNoteEvent[] = [];
    // LH bajos
    events.push(createNote('D2', 0, '1n', 'left'));
    events.push(createNote('G1', 4, '1n', 'left'));
    events.push(createNote('C2', 8, '1n', 'left'));
    events.push(createNote('C2', 12, '1n', 'left'));
    // RH drop 2 voicings
    const drop2s = [
      { t: 0, n: ['C4', 'F4', 'A4', 'D5'] },
      { t: 2, n: ['C4', 'F4', 'A4', 'D5'] },
      { t: 4, n: ['B3', 'F4', 'G4', 'D5'] },
      { t: 6, n: ['B3', 'F4', 'G4', 'D5'] },
      { t: 8, n: ['B3', 'E4', 'G4', 'C5'] },
      { t: 10, n: ['B3', 'E4', 'G4', 'C5'] },
      { t: 12, n: ['B3', 'E4', 'G4', 'C5'] },
      { t: 14, n: ['B3', 'E4', 'G4', 'C5'] },
    ];
    drop2s.forEach((d) => {
      d.n.forEach((note) => events.push(createNote(note, d.t, '2n', 'right')));
    });
    return events;
  }

  // 14. Both: Bossa Nova Comping
  if (id === 'routine_l3_bossa_comping') {
    const events: RunwayNoteEvent[] = [];
    const chords = [
      { bass: 'F1', rh: ['A3', 'C4', 'E4', 'G4'] },
      { bass: 'G1', rh: ['B3', 'D4', 'F4', 'A4'] },
      { bass: 'G1', rh: ['Bb3', 'D4', 'F4', 'Bb4'] },
      { bass: 'C2', rh: ['Bb3', 'E4', 'G4', 'C5'] },
    ];
    chords.forEach((c, i) => {
      const b = i * 4;
      // LH Sincopado Bossa: 0, 1.5, 2.5
      events.push(createNote(c.bass, b, '4n', 'left'));
      events.push(createNote(c.bass, b + 1.5, '4n', 'left'));
      events.push(createNote(c.bass, b + 2.5, '4n', 'left'));
      // RH Bossa Clave (contratiempo sincopado)
      [b, b + 1.5, b + 2.0, b + 3.5].forEach((t) => {
        c.rh.forEach((n) => events.push(createNote(n, t, '8n', 'right')));
      });
    });
    return events;
  }

  // 15. Both: Escala Menor Melódica & Acordes mMaj7
  if (id === 'routine_l3_melodic_minor_mmaj7') {
    const events: RunwayNoteEvent[] = [];
    events.push(createNote('C2', 0, '1n', 'left'));
    events.push(createNote('G2', 0, '1n', 'left'));
    events.push(createNote('Eb3', 0, '1n', 'left'));
    events.push(createNote('B2', 0, '1n', 'left'));

    events.push(createNote('C2', 8, '1n', 'left'));
    events.push(createNote('G2', 8, '1n', 'left'));
    events.push(createNote('Eb3', 8, '1n', 'left'));
    events.push(createNote('B2', 8, '1n', 'left'));

    const melDesc = [
      'C6', 'B5', 'A5', 'G5', 'F5', 'Eb5', 'D5', 'C5',
      'B4', 'A4', 'G4', 'F4', 'Eb4', 'D4', 'C4', 'B3',
      'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'B4', 'C5',
      'D5', 'Eb5', 'F5', 'G5', 'A5', 'B5', 'C6', 'C6',
    ];
    melDesc.forEach((n, idx) => {
      events.push(createNote(n, idx * 0.5, '8n', 'right'));
    });
    return events;
  }

  // =========================================================================
  // NIVEL 4: VIRTUOSO / NEO-SOUL
  // =========================================================================

  // 16. LH: Stride Piano & Saltos de Bajo + Shell Voicing (Ragtime/Swing)
  // THE CRITICAL ONE REPORTED BY USER!
  if (id === 'routine_l4_lh_stride_shell') {
    const events: RunwayNoteEvent[] = [];
    // Bar 1 (Fmaj7):
    // Tiempo 1: Bajo F1 (29)
    events.push(createNote('F1', 0, '4n', 'left'));
    // Tiempo 2: Shell voicing medio A2 + E3 (45, 52)
    events.push(createNote('A2', 1, '4n', 'left'));
    events.push(createNote('E3', 1, '4n', 'left'));
    // Tiempo 3: Quinta en el bajo C2 (36)
    events.push(createNote('C2', 2, '4n', 'left'));
    // Tiempo 4: Shell voicing A2 + E3 (45, 52)
    events.push(createNote('A2', 3, '4n', 'left'));
    events.push(createNote('E3', 3, '4n', 'left'));

    // Bar 2 (D7b9 / D7):
    // Tiempo 1: Bajo D2 (38)
    events.push(createNote('D2', 4, '4n', 'left'));
    // Tiempo 2: Shell F#2 + C3 (42, 48)
    events.push(createNote('F#2', 5, '4n', 'left'));
    events.push(createNote('C3', 5, '4n', 'left'));
    // Tiempo 3: Bajo A1 (33)
    events.push(createNote('A1', 6, '4n', 'left'));
    // Tiempo 4: Shell F#2 + C3 (42, 48)
    events.push(createNote('F#2', 7, '4n', 'left'));
    events.push(createNote('C3', 7, '4n', 'left'));

    // Bar 3 (Gm7):
    // Tiempo 1: Bajo G1 (31)
    events.push(createNote('G1', 8, '4n', 'left'));
    // Tiempo 2: Shell Bb2 + F3 (46, 53)
    events.push(createNote('Bb2', 9, '4n', 'left'));
    events.push(createNote('F3', 9, '4n', 'left'));
    // Tiempo 3: Bajo D2 (38)
    events.push(createNote('D2', 10, '4n', 'left'));
    // Tiempo 4: Shell Bb2 + F3 (46, 53)
    events.push(createNote('Bb2', 11, '4n', 'left'));
    events.push(createNote('F3', 11, '4n', 'left'));

    // Bar 4 (C7):
    // Tiempo 1: Bajo C2 (36)
    events.push(createNote('C2', 12, '4n', 'left'));
    // Tiempo 2: Shell E2 + Bb2 (40, 46)
    events.push(createNote('E2', 13, '4n', 'left'));
    events.push(createNote('Bb2', 13, '4n', 'left'));
    // Tiempo 3: Quinta en el bajo G1 (31)
    events.push(createNote('G1', 14, '4n', 'left'));
    // Tiempo 4: Shell E2 + Bb2 (40, 46)
    events.push(createNote('E2', 15, '4n', 'left'));
    events.push(createNote('Bb2', 15, '4n', 'left'));

    return events;
  }

  // 17. RH: Licks Bebop con Notas de Paso Cromáticas y Arpegios Alterados
  if (id === 'routine_l4_rh_bebop_licks_altered') {
    const events: RunwayNoteEvent[] = [];
    const bebopNotes = [
      { n: 'G4', t: 0, d: '8n' },
      { n: 'B4', t: 0.5, d: '8n' },
      { n: 'D5', t: 1.0, d: '8n' },
      { n: 'F5', t: 1.5, d: '8n' },
      { n: 'Ab5', t: 2.0, d: '8n' },
      { n: 'Bb5', t: 2.5, d: '8n' },
      { n: 'Db6', t: 3.0, d: '8n' },
      { n: 'B5', t: 3.5, d: '8n' },

      { n: 'Ab5', t: 4.0, d: '8n' },
      { n: 'F5', t: 4.5, d: '8n' },
      { n: 'Eb5', t: 5.0, d: '8n' },
      { n: 'D5', t: 5.5, d: '8n' },
      { n: 'Db5', t: 6.0, d: '8n' },
      { n: 'C5', t: 6.5, d: '8n' },
      { n: 'B4', t: 7.0, d: '8n' },
      { n: 'C5', t: 7.5, d: '8n' },

      { n: 'E5', t: 8.0, d: '8n' },
      { n: 'G5', t: 8.5, d: '8n' },
      { n: 'B5', t: 9.0, d: '8n' },
      { n: 'D6', t: 9.5, d: '8n' },
      { n: 'C6', t: 10.0, d: '8n' },
      { n: 'B5', t: 10.5, d: '8n' },
      { n: 'A5', t: 11.0, d: '8n' },
      { n: 'G5', t: 11.5, d: '8n' },

      { n: 'F#5', t: 12.0, d: '8n' },
      { n: 'F5', t: 12.5, d: '8n' },
      { n: 'E5', t: 13.0, d: '4n' },
      { n: 'C5', t: 14.0, d: '2n' },
    ];
    bebopNotes.forEach((b) => {
      events.push(createNote(b.n, b.t, b.d, 'right'));
    });
    return events;
  }

  // 18. Both: Vamp Neo-Soul D'Angelo
  if (id === 'routine_l4_neo_soul_vamp') {
    const events: RunwayNoteEvent[] = [];
    // Bar 1 & 2: Ebmaj9 (laid back)
    events.push(createNote('Eb1', 0, '2n', 'left'));
    events.push(createNote('Bb1', 2, '4n', 'left'));
    events.push(createNote('Db2', 3, '4n', 'left'));
    // RH Rootless A: G3, Bb3, D4, F4
    [0.5, 2.0, 3.5].forEach((t) => {
      ['G3', 'Bb3', 'D4', 'F4'].forEach((n) => events.push(createNote(n, t, '8n', 'right')));
    });

    // Bar 3 & 4: Ab13
    events.push(createNote('Ab1', 4, '2n', 'left'));
    events.push(createNote('Eb2', 6, '4n', 'left'));
    events.push(createNote('Gb2', 7, '4n', 'left'));
    // RH Rootless B: Gb3, C4, F4, Bb4
    [4.5, 6.0, 7.5].forEach((t) => {
      ['Gb3', 'C4', 'F4', 'Bb4'].forEach((n) => events.push(createNote(n, t, '8n', 'right')));
    });

    // Repeat for bars 3-4 (beats 8-16)
    events.push(createNote('Eb1', 8, '2n', 'left'));
    events.push(createNote('Bb1', 10, '4n', 'left'));
    events.push(createNote('Db2', 11, '4n', 'left'));
    [8.5, 10.0, 11.5].forEach((t) => {
      ['G3', 'Bb3', 'D4', 'F4'].forEach((n) => events.push(createNote(n, t, '8n', 'right')));
    });

    events.push(createNote('Ab1', 12, '2n', 'left'));
    events.push(createNote('Eb2', 14, '4n', 'left'));
    events.push(createNote('Gb2', 15, '4n', 'left'));
    [12.5, 14.0, 15.5].forEach((t) => {
      ['Gb3', 'C4', 'F4', 'Bb4'].forEach((n) => events.push(createNote(n, t, '8n', 'right')));
    });

    return events;
  }

  // 19. Both: Quartal Dorian
  if (id === 'routine_l4_quartal_dorian') {
    const events: RunwayNoteEvent[] = [];
    for (let bar = 0; bar < 4; bar++) {
      const b = bar * 4;
      events.push(createNote('D2', b, '1n', 'left'));
      events.push(createNote('A2', b, '1n', 'left'));
    }
    const quartals = [
      { t: 0, n: ['E4', 'A4', 'D5'] },
      { t: 1.5, n: ['F#4', 'B4', 'E5'] },
      { t: 2.5, n: ['G4', 'C5', 'F5'] },
      { t: 4, n: ['A4', 'D5', 'G5'] },
      { t: 5.5, n: ['G4', 'C5', 'F5'] },
      { t: 6.5, n: ['F#4', 'B4', 'E5'] },
      { t: 8, n: ['E4', 'A4', 'D5'] },
      { t: 10, n: ['D4', 'G4', 'C5'] },
      { t: 12, n: ['E4', 'A4', 'D5'] },
      { t: 14, n: ['E4', 'A4', 'D5'] },
    ];
    quartals.forEach((q) => {
      q.n.forEach((note) => events.push(createNote(note, q.t, '4n', 'right')));
    });
    return events;
  }

  // 20. Both: II - V - I Menor con Dominante Alterada
  if (id === 'routine_l4_minor_ii_v_alt') {
    const events: RunwayNoteEvent[] = [];
    // Bar 1: Dm7b5
    events.push(createNote('D2', 0, '1n', 'left'));
    events.push(createNote('Ab2', 0, '1n', 'left'));
    ['C4', 'F4', 'Ab4', 'C5'].forEach((n) => events.push(createNote(n, 0, '2n', 'right')));
    ['C4', 'F4', 'Ab4', 'C5'].forEach((n) => events.push(createNote(n, 2, '2n', 'right')));

    // Bar 2: G7alt (Tritono en LH: B2 + F2; tensiones #9 y b13 en RH: Bb4 + Eb5)
    events.push(createNote('G1', 4, '1n', 'left'));
    events.push(createNote('F2', 4, '1n', 'left'));
    events.push(createNote('B2', 4, '1n', 'left'));
    ['Bb4', 'Eb5', 'Ab5'].forEach((n) => events.push(createNote(n, 4, '2n', 'right')));
    ['Bb4', 'Eb5', 'Ab5'].forEach((n) => events.push(createNote(n, 6, '2n', 'right')));

    // Bar 3 & 4: Cm9 resolución
    events.push(createNote('C2', 8, '1n', 'left'));
    events.push(createNote('G2', 8, '1n', 'left'));
    events.push(createNote('C2', 12, '1n', 'left'));
    events.push(createNote('G2', 12, '1n', 'left'));
    ['Eb4', 'Bb4', 'D5'].forEach((n) => events.push(createNote(n, 8, '2n', 'right')));
    ['Eb4', 'Bb4', 'D5'].forEach((n) => events.push(createNote(n, 10, '2n', 'right')));
    ['Eb4', 'Bb4', 'D5'].forEach((n) => events.push(createNote(n, 12, '1n', 'right')));

    return events;
  }

  // =========================================================================
  // FALLBACK / GENERIC ENGINE FOR CUSTOM WORKOUTS
  // =========================================================================
  return generateGenericWorkoutNotes(workout);
}

/**
 * Generic generator for custom workouts based on theory items and textures
 */
export function generateGenericWorkoutNotes(workout: PracticeRoutine): RunwayNoteEvent[] {
  const events: RunwayNoteEvent[] = [];
  const root = workout.rootNote || 'C';
  const handFocus = workout.handFocus || 'both';
  const texture = workout.texture || 'arpeggio_asc';

  // 1. Determine base scale or chord notes
  let pitchMidis: number[] = [];

  if (workout.category === 'chord') {
    const chord = CHORD_CATALOG.find((c) => c.id === workout.targetItemId) || CHORD_CATALOG[0];
    const rootMidi = parseNoteToMidi(`${root}4`);
    pitchMidis = chord.intervals.map((st) => rootMidi + st);
  } else if (workout.category === 'scale') {
    const scale = SCALE_CATALOG.find((s) => s.id === workout.targetItemId) || SCALE_CATALOG[0];
    const rootMidi = parseNoteToMidi(`${root}4`);
    pitchMidis = scale.intervals.map((st) => rootMidi + st);
  } else {
    // default triad
    const rootMidi = parseNoteToMidi(`${root}4`);
    pitchMidis = [rootMidi, rootMidi + 4, rootMidi + 7];
  }

  // Shift octaves according to hand focus
  if (handFocus === 'left') {
    // Transpose down by 2 octaves so all notes fall in octaves 1, 2, 3 (< 60)
    pitchMidis = pitchMidis.map((m) => Math.min(55, Math.max(24, m - 24)));
  } else if (handFocus === 'right') {
    // Keep in octaves 4, 5 (>= 60)
    pitchMidis = pitchMidis.map((m) => Math.max(60, m));
  }

  const durationBeats = 16; // 4 bars

  if (handFocus === 'left') {
    if (texture === 'alberti_bass') {
      const r = pitchMidis[0];
      const fifth = pitchMidis.length >= 3 ? pitchMidis[2] : pitchMidis[0] + 7;
      const third = pitchMidis.length >= 2 ? pitchMidis[1] : pitchMidis[0] + 4;
      const alb = [r, fifth, third, fifth];
      for (let step = 0; step < 32; step++) {
        const midi = alb[step % 4];
        events.push(createNote(midiToNoteName(midi), step * 0.5, '8n', 'left'));
      }
    } else if (texture === 'walking_bass') {
      const rootMidi = pitchMidis[0];
      for (let beat = 0; beat < 16; beat++) {
        const stepOffset = [0, 4, 7, 6, 7, 4, 2, 1][beat % 8];
        const m = rootMidi + stepOffset;
        events.push(createNote(midiToNoteName(m), beat, '4n', 'left'));
      }
    } else {
      // Stride / bass comping pattern
      const rootMidi = pitchMidis[0];
      const shellMidis = pitchMidis.slice(1);
      for (let bar = 0; bar < 4; bar++) {
        const b = bar * 4;
        events.push(createNote(midiToNoteName(rootMidi), b, '4n', 'left'));
        shellMidis.forEach((sm) => events.push(createNote(midiToNoteName(sm), b + 1, '4n', 'left')));
        events.push(createNote(midiToNoteName(rootMidi + 7), b + 2, '4n', 'left'));
        shellMidis.forEach((sm) => events.push(createNote(midiToNoteName(sm), b + 3, '4n', 'left')));
      }
    }
  } else if (handFocus === 'right') {
    if (texture === 'arpeggio_desc') {
      const reversed = [...pitchMidis].reverse();
      for (let step = 0; step < 32; step++) {
        const midi = reversed[step % reversed.length];
        events.push(createNote(midiToNoteName(midi), step * 0.5, '8n', 'right'));
      }
    } else if (texture === 'comping') {
      for (let b = 0; b < 16; b += 2) {
        pitchMidis.forEach((m) => {
          events.push(createNote(midiToNoteName(m), b, '2n', 'right'));
        });
      }
    } else {
      // arpeggio_asc default
      for (let step = 0; step < 32; step++) {
        const midi = pitchMidis[step % pitchMidis.length];
        events.push(createNote(midiToNoteName(midi), step * 0.5, '8n', 'right'));
      }
    }
  } else {
    // Both hands
    const bassMidi = Math.max(24, Math.min(52, pitchMidis[0] - 24));
    for (let bar = 0; bar < 4; bar++) {
      const b = bar * 4;
      events.push(createNote(midiToNoteName(bassMidi), b, '2n', 'left'));
      events.push(createNote(midiToNoteName(bassMidi + 7), b + 2, '2n', 'left'));
    }
    // RH notes
    for (let step = 0; step < 32; step++) {
      const midi = pitchMidis[step % pitchMidis.length];
      events.push(createNote(midiToNoteName(midi), step * 0.5, '8n', 'right'));
    }
  }

  return events;
}
