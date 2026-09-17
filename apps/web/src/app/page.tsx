'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Play,
  Sparkles,
  ArrowRight,
  Headphones,
  Sliders,
  Music,
  Disc,
  Award,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import VirtualKeyboard from '@/components/theory/VirtualKeyboard';
import ABPlayer from '@/components/audio/ABPlayer';

const TRACKS = [
  {
    id: 'theory',
    title: 'Music Theory & Harmony',
    description: 'Upper structures, quartal harmony, modal interchange, and neo-soul reharmonization.',
    icon: Music,
    gradient: 'from-violet-600 to-indigo-500',
    count: '14 Modules • 48 Interactive Labs',
    slug: 'modal-mastery-neo-soul-harmony',
  },
  {
    id: 'mixing',
    title: 'Audio Engineering & Mixing',
    description: 'Gain staging, surgical dynamic EQ, VCA bus glue, analog saturation, and stem balance.',
    icon: Headphones,
    gradient: 'from-cyan-500 to-blue-600',
    count: '18 Modules • 36 A/B Stems',
    slug: 'analog-warmth-precision-mixing',
  },
  {
    id: 'production',
    title: 'Music Production & Arrangement',
    description: 'Electronic music architecture, tension curves, automation, and hybrid synthesis.',
    icon: Sliders,
    gradient: 'from-amber-500 to-rose-500',
    count: '12 Modules • 40 DAW Projects',
    slug: 'electronic-music-architecture-arrangement',
  },
  {
    id: 'instruments',
    title: 'Instrument Performance',
    description: 'Keyboard biomechanics, polyrhythmic coordination, fretboard visualization, and touch dynamics.',
    icon: Sparkles,
    gradient: 'from-emerald-400 to-teal-600',
    count: '10 Modules • 32 Practice Etudes',
    slug: 'advanced-keyboard-technique-touch-dynamics',
  },
  {
    id: 'mastering',
    title: 'Mastering & Psychoacoustics',
    description: 'LUFS loudness optimization, multiband stereo widening, true peak limiting, and reference monitoring.',
    icon: Award,
    gradient: 'from-purple-600 to-pink-500',
    count: '8 Modules • 24 Master Audits',
    slug: 'mastering-precision-lufs',
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'synth' | 'mixing'>('synth');

  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-surface-card border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-glass mb-8 animate-pulse-subtle transition-colors">
          <span className="flex h-2 w-2 rounded-full bg-synth-cyan animate-ping" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-700 dark:text-gray-300">
            Next-Gen Audio LMS & Interactive Studio
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-synth-violet/15 dark:bg-synth-violet/30 text-synth-violet dark:text-synth-cyan font-bold">
            v2.4 Live
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl leading-[1.1] mb-6">
          Hear the Nuance.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-synth-violet via-synth-cyan to-analog-amber">
            Master the Frequency.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-gray-400 max-w-3xl mb-10 leading-relaxed font-light">
          Sonora Academy bridges the gap between musical intuition and audio engineering. Explore
          real-time Web Audio synths, analyze synchronized multi-track stems, and elevate your sound
          into high-fidelity reality.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/studio"
            className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-electric text-white font-bold text-sm uppercase tracking-wider shadow-glow-violet hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-synth-cyan" />
            <span>Open Interactive Sound Studio</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white dark:bg-surface-card border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-gray-200 font-bold text-sm uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-surface-slate hover:border-synth-cyan/40 shadow-sm dark:shadow-none transition-all"
          >
            <span>Student LMS Dashboard</span>
            <ChevronRight className="w-4 h-4 text-slate-400 dark:text-gray-400" />
          </Link>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl p-6 rounded-2xl glass-card">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-mono">5 Tracks</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">Theory to Mastering</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-synth-cyan font-mono">12ms</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">Tone.js WebAudio Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-analog-amber font-mono">24-Bit</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">Lossless A/B Stems</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-500 dark:text-emerald-400 font-mono">98.4%</div>
            <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">Graduation Rate</div>
          </div>
        </div>
      </section>

      {/* Interactive Sound Studio Live Preview on Landing Page */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-synth-violet/15 dark:bg-synth-violet/20 border border-synth-violet/30 dark:border-synth-violet/40 text-synth-violet dark:text-synth-cyan text-xs font-mono mb-3">
            <Activity className="w-3.5 h-3.5" />
            BROWSER-BASED AUDIO LABS
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Experience Sonora In Real Time</h2>
          <p className="text-sm text-slate-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
            Interact with our Web Audio synthesizer or test our synchronized dual-waveform mastering player right here.
          </p>

          {/* Tab Switcher */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100/90 dark:bg-surface-card border border-slate-200/80 dark:border-white/10 mt-6 gap-2 transition-colors">
            <button
              onClick={() => setActiveTab('synth')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'synth'
                  ? 'bg-gradient-electric text-white shadow-glow-violet'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Music className="w-4 h-4" />
              Tone.js Polyphonic Synth
            </button>
            <button
              onClick={() => setActiveTab('mixing')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'mixing'
                  ? 'bg-gradient-electric text-white shadow-glow-violet'
                  : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Headphones className="w-4 h-4" />
              Wavesurfer A/B Inspector
            </button>
          </div>
        </div>

        {/* Active Interactive Widget */}
        <div className="relative">
          {activeTab === 'synth' ? (
            <VirtualKeyboard />
          ) : (
            <ABPlayer />
          )}
        </div>
      </section>

      {/* 5 Musical Vertical Tracks Catalog */}
      <section id="tracks" className="px-6 lg:px-8 max-w-7xl mx-auto mb-28">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-synth-violet dark:text-synth-cyan font-bold">
              CURRICULUM ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-1">
              5 Disciplines of the Modern Sonic Artist
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 max-w-md">
            From harmonic structure to stereo field dynamics, every track includes step-by-step
            interactive assignments evaluated by world-class producers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TRACKS.map((track) => {
            const Icon = track.icon;
            return (
              <Link
                key={track.id}
                href={`/courses/${track.slug}`}
                className="group relative rounded-2xl p-6 glass-card glass-card-hover border border-slate-200/80 dark:border-white/10 flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${track.gradient} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-synth-violet dark:group-hover:text-synth-cyan transition-colors mb-2">
                    {track.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400 leading-relaxed mb-6">
                    {track.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-gray-400">
                  <span>{track.count}</span>
                  <ArrowRight className="w-4 h-4 text-synth-violet dark:text-synth-cyan opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="px-6 lg:px-8 max-w-7xl mx-auto mb-20">
        <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden bg-gradient-to-r from-synth-violet/15 dark:from-synth-violet/20 via-white/80 dark:via-surface-card to-synth-cyan/15 dark:to-synth-cyan/10 border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl flex flex-col items-center text-center">
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Begin Your Sonic Odyssey Today
            </h3>
            <p className="text-sm text-slate-600 dark:text-gray-300 mb-8 leading-relaxed">
              Join thousands of musicians, composers, and mixing engineers using Sonora’s Web Audio
              ecosystem to elevate their craft.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-electric text-white font-bold text-xs uppercase tracking-widest shadow-glow-violet hover:scale-105 transition-transform"
            >
              <span>Access Student Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
