'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Headphones,
  Music,
  Play,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import SkillTree from '@/components/dashboard/SkillTree';

interface EnrolledCourse {
  id: string;
  title: string;
  slug: string;
  category: string;
  progress: number;
  instructor: string;
  nextLessonTitle: string;
  nextLessonSlug: string;
  coverImage: string;
}

const ENROLLED_COURSES: EnrolledCourse[] = [
  {
    id: 'course-1',
    title: 'Modal Mastery & Neo-Soul Harmonic Architecture',
    slug: 'modal-mastery-neo-soul-harmony',
    category: 'THEORY & HARMONY',
    progress: 50,
    instructor: 'Dr. Elena Rostova',
    nextLessonTitle: 'Maj9, Min11, and Quartal Voicings on the Piano',
    nextLessonSlug: 'maj9-min11-quartal-voicings',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'course-2',
    title: 'Analog Warmth & Precision Mixing in the Modern DAW',
    slug: 'analog-warmth-precision-mixing',
    category: 'MIXING & MASTERING',
    progress: 100,
    instructor: 'Hannes Bieger',
    nextLessonTitle: 'A/B Studio Inspection: Kick & Sub Bass Glue',
    nextLessonSlug: 'kick-sub-bass-glue-ab',
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen py-10 px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Student Welcome & Analytics Header */}
      <div className="relative rounded-3xl p-8 bg-white/80 dark:bg-surface-slate/80 border border-slate-200/80 dark:border-white/10 glass-panel shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Avatar and Welcome */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-analog flex items-center justify-center text-white text-2xl font-bold shadow-glow-amber">
                AR
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-surface-slate flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Welcome back, Alex Rivera
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-synth-cyan/15 dark:bg-synth-cyan/20 border border-synth-cyan/30 dark:border-synth-cyan/40 text-synth-cyan font-mono font-bold">
                  LEVEL 3 PRODUCER
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">
                Focus Track: Electronic Music Architecture & Analog Mixing Techniques
              </p>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-card border border-slate-200/80 dark:border-white/5 transition-colors">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono">PRACTICE STREAK</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">14 Days</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-surface-card border border-slate-200/80 dark:border-white/5 transition-colors">
              <div className="p-2 rounded-lg bg-synth-cyan/20 text-synth-cyan">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-gray-400 font-mono">STUDIO TIME</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">42.5 Hours</div>
              </div>
            </div>

            <Link
              href="/studio"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-electric text-white font-bold text-xs uppercase tracking-wider shadow-glow-violet hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4 text-synth-cyan" />
              <span>Launch Studio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Skill Tree & Academic Pathway (Component 3) */}
      <section>
        <SkillTree />
      </section>

      {/* Enrolled Courses & Active Curriculum */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Active Curriculum</h2>
            <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
              Pick up where you left off in your enrolled courses
            </p>
          </div>
          <Link
            href="/#tracks"
            className="text-xs font-mono text-synth-violet dark:text-synth-cyan hover:underline flex items-center gap-1"
          >
            <span>Explore All Tracks</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ENROLLED_COURSES.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl bg-white dark:bg-surface-card border border-slate-200/80 dark:border-white/10 p-6 glass-card-hover shadow-sm dark:shadow-none flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] px-2.5 py-1 rounded bg-synth-violet/15 dark:bg-synth-violet/20 border border-synth-violet/30 dark:border-synth-violet/40 text-synth-violet dark:text-synth-cyan font-mono font-bold uppercase">
                    {course.category}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-gray-400 font-mono">Instructor: {course.instructor}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">{course.title}</h3>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-slate border border-slate-200/60 dark:border-white/5 mb-4 transition-colors">
                  <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono uppercase">Next Up:</div>
                  <div className="text-xs font-semibold text-synth-violet dark:text-synth-cyan mt-0.5 truncate">
                    {course.nextLessonTitle}
                  </div>
                </div>
              </div>

              <div>
                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-500 dark:text-gray-400">Course Progress</span>
                  <span className="font-bold text-slate-900 dark:text-white">{course.progress}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-obsidian rounded-full overflow-hidden mb-5">
                  <div
                    className={`h-full rounded-full ${
                      course.progress === 100 ? 'bg-emerald-400' : 'bg-gradient-electric'
                    }`}
                    style={{ width: `${course.progress}%` }}
                  />
                </div>

                {/* Continue button */}
                <Link
                  href={`/courses/${course.slug}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-surface-slate dark:hover:bg-surface-muted border border-slate-200/80 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white transition-all hover:border-synth-cyan/50"
                >
                  <Play className="w-3.5 h-3.5 text-synth-cyan" />
                  <span>Continue Lesson</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Studio Labs Drawer */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-50 dark:from-surface-slate dark:via-surface-card dark:to-obsidian border border-slate-200/80 dark:border-white/10 shadow-lg dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-synth-violet/20 border border-synth-violet/40 text-synth-violet dark:text-synth-cyan">
            <Headphones className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Need a creative sandbox break?</h3>
            <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 max-w-lg">
              Open the standalone Sonora Sound Studio to test custom synth chords, record chord
              sequences, or audition dual-stem reference masters outside of lesson mode.
            </p>
          </div>
        </div>

        <Link
          href="/studio"
          className="px-6 py-3.5 rounded-xl bg-gradient-electric text-white font-bold text-xs uppercase tracking-wider shadow-glow-violet hover:scale-105 transition-all whitespace-nowrap"
        >
          Open Standalone Studio
        </Link>
      </section>
    </div>
  );
}

