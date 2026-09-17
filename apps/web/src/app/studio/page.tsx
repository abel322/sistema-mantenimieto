'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Headphones,
  Music,
  Sliders,
  Sparkles,
  Volume2,
  Radio,
  Share2,
  Download,
  Info,
} from 'lucide-react';
import VirtualKeyboard from '@/components/theory/VirtualKeyboard';
import ABPlayer from '@/components/audio/ABPlayer';

export default function StudioPage() {
  const [activeWorkspace, setActiveWorkspace] = useState<'both' | 'keyboard' | 'ab'>('both');

  return (
    <div className="min-h-screen py-8 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-gradient-electric text-white">
              <Headphones className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-synth-cyan font-bold">
              CREATIVE AUDIO WORKBENCH
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
              Web Audio 2.0
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sonora Interactive Sound Studio
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Experiment with polyphonic synthesis, chord voicings, and multi-track A/B mastering inspection in one environment.
          </p>
        </div>

        {/* Studio View Selector */}
        <div className="flex items-center gap-2 bg-surface-card p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveWorkspace('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeWorkspace === 'both'
                ? 'bg-gradient-electric text-white shadow-glow-violet'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Combined Studio
          </button>
          <button
            onClick={() => setActiveWorkspace('keyboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeWorkspace === 'keyboard'
                ? 'bg-gradient-electric text-white shadow-glow-violet'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Virtual Keyboard
          </button>
          <button
            onClick={() => setActiveWorkspace('ab')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeWorkspace === 'ab'
                ? 'bg-gradient-electric text-white shadow-glow-violet'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            A/B Waveform Lab
          </button>
        </div>
      </div>

      {/* Main Studio Workspaces */}
      <div className="space-y-8">
        {/* Virtual Keyboard Section */}
        {(activeWorkspace === 'both' || activeWorkspace === 'keyboard') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 px-2 font-mono">
              <span className="flex items-center gap-1.5 text-synth-cyan">
                <Music className="w-4 h-4" />
                MODULE 1: HARMONIC SYNTHESIZER & INTERVAL ENGINE
              </span>
              <span>25 Keys • C3 to C5 • PolySynth</span>
            </div>
            <VirtualKeyboard />
          </section>
        )}

        {/* A/B Waveform Inspector Section */}
        {(activeWorkspace === 'both' || activeWorkspace === 'ab') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-400 px-2 font-mono">
              <span className="flex items-center gap-1.5 text-rose-400">
                <Activity className="w-4 h-4" />
                MODULE 2: DUAL SYNCHRONIZED WAVEFORM INSPECTOR
              </span>
              <span>Wavesurfer.js • Integrated LUFS Meter</span>
            </div>
            <ABPlayer />
          </section>
        )}
      </div>

      {/* Hardware & Web Audio Specs Footer Banner */}
      <div className="p-4 rounded-xl bg-surface-card/60 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-synth-cyan flex-shrink-0" />
          <span>
            Sonora Web Audio engine operates at 48kHz, 24-bit floating point internal resolution.
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span className="text-emerald-400">STATUS: LOW-LATENCY RUNNING</span>
          <span>BUFFER: 512 SAMPLES</span>
        </div>
      </div>
    </div>
  );
}
