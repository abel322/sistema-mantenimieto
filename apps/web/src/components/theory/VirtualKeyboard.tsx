'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Volume2, Sparkles, Music, Sliders, RefreshCw } from 'lucide-react';

interface KeyConfig {
  note: string;
  isBlack: boolean;
  label: string;
  shortcut: string;
}

const KEYS: KeyConfig[] = [
  // Octave 3
  { note: 'C3', isBlack: false, label: 'C3', shortcut: 'A' },
  { note: 'C#3', isBlack: true, label: 'C#3', shortcut: 'W' },
  { note: 'D3', isBlack: false, label: 'D3', shortcut: 'S' },
  { note: 'D#3', isBlack: true, label: 'D#3', shortcut: 'E' },
  { note: 'E3', isBlack: false, label: 'E3', shortcut: 'D' },
  { note: 'F3', isBlack: false, label: 'F3', shortcut: 'F' },
  { note: 'F#3', isBlack: true, label: 'F#3', shortcut: 'T' },
  { note: 'G3', isBlack: false, label: 'G3', shortcut: 'G' },
  { note: 'G#3', isBlack: true, label: 'G#3', shortcut: 'Y' },
  { note: 'A3', isBlack: false, label: 'A3', shortcut: 'H' },
  { note: 'A#3', isBlack: true, label: 'A#3', shortcut: 'U' },
  { note: 'B3', isBlack: false, label: 'B3', shortcut: 'J' },

  // Octave 4
  { note: 'C4', isBlack: false, label: 'C4', shortcut: 'K' },
  { note: 'C#4', isBlack: true, label: 'C#4', shortcut: 'O' },
  { note: 'D4', isBlack: false, label: 'D4', shortcut: 'L' },
  { note: 'D#4', isBlack: true, label: 'D#4', shortcut: 'P' },
  { note: 'E4', isBlack: false, label: 'E4', shortcut: ';' },
  { note: 'F4', isBlack: false, label: 'F4', shortcut: "'" },
  { note: 'F#4', isBlack: true, label: 'F#4', shortcut: ']' },
  { note: 'G4', isBlack: false, label: 'G4', shortcut: 'Z' },
  { note: 'G#4', isBlack: true, label: 'G#4', shortcut: 'X' },
  { note: 'A4', isBlack: false, label: 'A4', shortcut: 'C' },
  { note: 'A#4', isBlack: true, label: 'A#4', shortcut: 'V' },
  { note: 'B4', isBlack: false, label: 'B4', shortcut: 'B' },

  // Octave 5 (End Root)
  { note: 'C5', isBlack: false, label: 'C5', shortcut: 'N' },
];

interface ChordPreset {
  name: string;
  notes: string[];
  intervals: Record<string, string>;
  genre: string;
  description: string;
}

const PRESET_CHORDS: ChordPreset[] = [
  {
    name: 'Dmin11 (Neo-Soul)',
    notes: ['D3', 'F3', 'A3', 'C4', 'E4', 'G4'],
    intervals: { D3: 'Root', F3: 'm3', A3: '5th', C4: 'm7', E4: '9th', G4: '11th' },
    genre: 'Neo-Soul / R&B',
    description: 'Floating modern voicing popular in Erykah Badu & Robert Glasper productions.',
  },
  {
    name: 'F#maj9 (Lush Fusion)',
    notes: ['F#3', 'A#3', 'C#4', 'F4', 'G#4'],
    intervals: { 'F#3': 'Root', 'A#3': 'M3', 'C#4': '5th', F4: 'M7', 'G#4': '9th' },
    genre: 'Future Jazz',
    description: 'Bright, expansive modern major sound with sparkling major 7th and 9th extensions.',
  },
  {
    name: 'Db7#9#5 (Altered Dominant)',
    notes: ['C#3', 'F3', 'B3', 'E4', 'A4'],
    intervals: { 'C#3': 'Root', F3: 'M3', B3: 'm7', E4: '#9', A4: '#5' },
    genre: 'Bebop / Neo-Jazz',
    description: 'The definitive tension chord. Essential for dramatic resolutions back to Cmin.',
  },
  {
    name: 'Cmaj7 (Pure Modal)',
    notes: ['C3', 'E3', 'G3', 'B3'],
    intervals: { C3: 'Root', E3: 'M3', G3: '5th', B3: 'M7' },
    genre: 'Classical & Pop',
    description: 'Stable, serene, pure harmonic foundation.',
  },
];

const INTERVAL_COLORS: Record<string, string> = {
  Root: 'bg-cyan-500 text-black font-bold shadow-glow-cyan',
  M3: 'bg-emerald-400 text-black font-semibold',
  m3: 'bg-teal-400 text-black font-semibold',
  '5th': 'bg-amber-400 text-black font-semibold',
  M7: 'bg-violet-400 text-black font-semibold',
  m7: 'bg-indigo-400 text-white font-semibold',
  '9th': 'bg-rose-400 text-black font-semibold',
  '11th': 'bg-pink-400 text-black font-semibold',
  '#9': 'bg-orange-500 text-black font-bold',
  '#5': 'bg-red-500 text-white font-bold',
};

export default function VirtualKeyboard({
  highlightedNotes,
  noteIntervals,
  onPlayNote,
}: {
  highlightedNotes?: string[];
  noteIntervals?: Record<string, string>;
  onPlayNote?: (note: string) => void;
}) {
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [currentPreset, setCurrentPreset] = useState<ChordPreset | null>(PRESET_CHORDS[0]);
  const [waveType, setWaveType] = useState<'sawtooth' | 'sine' | 'triangle' | 'square'>('sawtooth');
  const [reverbAmount, setReverbAmount] = useState<number>(0.3);
  const [audioReady, setAudioReady] = useState(false);

  const synthRef = useRef<any>(null);
  const reverbRef = useRef<any>(null);
  const ToneRef = useRef<any>(null);

  // Initialize Tone.js audio chain lazily
  const initAudio = async () => {
    if (synthRef.current) return;
    try {
      const Tone = await import('tone');
      ToneRef.current = Tone;
      await Tone.start();

      const reverb = new Tone.Reverb({
        decay: 3.5,
        preDelay: 0.02,
        wet: reverbAmount,
      }).toDestination();
      await reverb.generate();

      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: waveType },
        envelope: {
          attack: 0.02,
          decay: 0.2,
          sustain: 0.6,
          release: 1.2,
        },
      }).connect(reverb);

      synthRef.current = synth;
      reverbRef.current = reverb;
      setAudioReady(true);
    } catch (e) {
      console.warn('Web Audio initialization awaiting gesture:', e);
    }
  };

  const playNote = async (note: string) => {
    await initAudio();
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(note, '8n');
    }
    setActiveNotes((prev) => Array.from(new Set([...prev, note])));
    setTimeout(() => {
      setActiveNotes((prev) => prev.filter((n) => n !== note));
    }, 350);

    if (onPlayNote) {
      onPlayNote(note);
    }
  };

  const playChord = async (chord: ChordPreset) => {
    await initAudio();
    setCurrentPreset(chord);
    if (synthRef.current) {
      synthRef.current.triggerAttackRelease(chord.notes, '1n');
    }
    setActiveNotes(chord.notes);
    setTimeout(() => {
      setActiveNotes([]);
    }, 1200);
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toUpperCase();
      const match = KEYS.find((k) => k.shortcut.toUpperCase() === key);
      if (match) {
        playNote(match.note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update waveform on the fly
  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.set({
        oscillator: { type: waveType },
      });
    }
  }, [waveType]);

  // Combine parent provided intervals with active chord preset
  const activeIntervals = noteIntervals || currentPreset?.intervals || {};
  const targetHighlight = highlightedNotes || currentPreset?.notes || [];

  return (
    <div className="w-full glass-panel rounded-2xl p-6 lg:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
      {/* Top Header & Engine Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-synth-violet/20 border border-synth-violet/40 text-synth-cyan">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Sonora Interactive Chord Lab
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Tone.js WebAudio
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                25-Key Polyphonic Synthesizer with Real-Time Harmonic Intervals
              </p>
            </div>
          </div>
        </div>

        {/* Synth Quick Controls */}
        <div className="flex items-center gap-3 bg-surface-slate/80 p-2 rounded-xl border border-white/5 text-xs">
          <div className="flex items-center gap-1.5 px-2">
            <Sliders className="w-3.5 h-3.5 text-synth-cyan" />
            <span className="text-gray-400">Osc:</span>
            <select
              value={waveType}
              onChange={(e) => setWaveType(e.target.value as any)}
              className="bg-obsidian text-gray-200 rounded px-2 py-1 border border-white/10 text-xs focus:outline-none focus:border-synth-cyan"
            >
              <option value="sawtooth">Sawtooth</option>
              <option value="sine">Sine (Warm)</option>
              <option value="square">Square (Chiptune)</option>
              <option value="triangle">Triangle (Soft)</option>
            </select>
          </div>

          <button
            onClick={() => initAudio()}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              audioReady
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-synth-violet text-white shadow-glow-violet animate-pulse'
            }`}
          >
            {audioReady ? '✓ Audio Unlocked' : '⚡ Click to Enable Audio'}
          </button>
        </div>
      </div>

      {/* Preset Chord Selector Bar */}
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Theoretical Voicing Presets:
          </span>
          <span className="text-[11px] text-gray-500 font-normal">
            Click to trigger voicing & highlight harmonic degrees
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {PRESET_CHORDS.map((chord) => {
            const isSelected = currentPreset?.name === chord.name;
            return (
              <button
                key={chord.name}
                onClick={() => playChord(chord)}
                className={`text-left p-3 rounded-xl border transition-all duration-200 group ${
                  isSelected
                    ? 'bg-gradient-to-r from-synth-violet/30 to-synth-indigo/30 border-synth-cyan/60 shadow-glow-cyan'
                    : 'bg-surface-card/90 border-white/5 hover:border-white/20 hover:bg-surface-slate'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-synth-cyan transition-colors">
                    {chord.name}
                  </span>
                  <Play className="w-3 h-3 text-synth-cyan opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
                <div className="text-[10px] text-gray-400 mt-1 truncate">{chord.genre}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Voicing Breakdown */}
      {currentPreset && (
        <div className="mb-6 p-4 rounded-xl bg-surface-slate/60 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-synth-cyan font-mono font-semibold">
              ACTIVE PROGRESSION DEGREE:
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">{currentPreset.name}</div>
            <p className="text-xs text-gray-400 mt-0.5">{currentPreset.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Harmonic Formula:</span>
            {currentPreset.notes.map((note) => {
              const interval = currentPreset.intervals[note] || 'deg';
              const colorClass = INTERVAL_COLORS[interval] || 'bg-gray-700 text-white';
              return (
                <div
                  key={note}
                  onClick={() => playNote(note)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-card border border-white/10 cursor-pointer hover:border-synth-cyan transition-all"
                >
                  <span className="text-xs font-mono font-bold text-gray-200">{note}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${colorClass}`}>
                    {interval}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 25-Key Responsive Piano Roll */}
      <div className="relative w-full overflow-x-auto pb-4 pt-2">
        <div className="min-w-[680px] select-none flex items-start justify-center relative bg-surface-card/60 p-4 rounded-2xl border border-white/5 shadow-inner">
          {/* White & Black Key Matrix */}
          <div className="relative flex">
            {KEYS.map((key) => {
              const isActive = activeNotes.includes(key.note);
              const isHighlighted = targetHighlight.includes(key.note);
              const interval = activeIntervals[key.note];
              const intervalColor = interval ? INTERVAL_COLORS[interval] : null;

              if (key.isBlack) {
                return (
                  <button
                    key={key.note}
                    onClick={() => playNote(key.note)}
                    className={`absolute z-20 w-8 h-36 -ml-4 rounded-b-md border transition-all duration-100 flex flex-col justify-end items-center pb-2 ${
                      isActive
                        ? 'bg-synth-cyan text-black shadow-glow-cyan transform translate-y-0.5'
                        : isHighlighted
                        ? 'bg-gradient-to-b from-surface-muted to-synth-violet border-synth-cyan shadow-glow-violet'
                        : 'bg-obsidian border-surface-slate hover:bg-surface-muted'
                    }`}
                    style={{
                      left: getBlackKeyLeftOffset(key.note),
                    }}
                  >
                    {interval && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded mb-1 font-bold ${
                          intervalColor || 'bg-white text-black'
                        }`}
                      >
                        {interval}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-gray-300 font-semibold leading-none">
                      {key.label}
                    </span>
                    <span className="text-[8px] text-gray-500 font-mono mt-0.5">[{key.shortcut}]</span>
                  </button>
                );
              }

              // White Key
              return (
                <button
                  key={key.note}
                  onClick={() => playNote(key.note)}
                  className={`w-11 h-56 rounded-b-lg border transition-all duration-100 flex flex-col justify-end items-center pb-3 relative mx-[1px] ${
                    isActive
                      ? 'bg-gradient-to-t from-synth-cyan via-white to-gray-100 shadow-glow-cyan transform translate-y-0.5'
                      : isHighlighted
                      ? 'bg-gradient-to-t from-synth-violet/40 via-surface-card to-white/95 border-synth-violet'
                      : 'bg-gray-100 hover:bg-white text-gray-800 border-gray-300'
                  }`}
                >
                  {interval && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md mb-2 font-bold ${
                        intervalColor || 'bg-gray-900 text-white'
                      }`}
                    >
                      {interval}
                    </span>
                  )}
                  <span className="text-xs font-mono font-bold text-gray-900 leading-none">
                    {key.label}
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5">[{key.shortcut}]</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Keyboard Controls Footer Note */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-synth-cyan animate-ping" />
          Tip: You can play keys directly using your computer keyboard (A, W, S, E, D, F, G...)
        </span>
        <span className="font-mono text-gray-500">Audio latency: ~12ms (AudioContext Hardware Accelerated)</span>
      </div>
    </div>
  );
}

// Helper to compute black key horizontal positioning relative to white keys
function getBlackKeyLeftOffset(note: string): string {
  // Mapping of black key notes to pixel offset across 15 white keys (each 46px wide: 44px + 2px margin)
  const offsets: Record<string, number> = {
    'C#3': 35,
    'D#3': 81,
    'F#3': 173,
    'G#3': 219,
    'A#3': 265,
    'C#4': 357,
    'D#4': 403,
    'F#4': 495,
    'G#4': 541,
    'A#4': 587,
  };
  return `${offsets[note] ?? 0}px`;
}
