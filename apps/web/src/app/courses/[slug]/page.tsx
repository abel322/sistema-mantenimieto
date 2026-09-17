'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Headphones,
  Lock,
  Music,
  Play,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import VirtualKeyboard from '@/components/theory/VirtualKeyboard';
import ABPlayer from '@/components/audio/ABPlayer';

// Mock Course Catalog with rich lesson metadata matching our database seeds
const COURSES_DATA: Record<string, any> = {
  'modal-mastery-neo-soul-harmony': {
    title: 'Modal Mastery & Neo-Soul Harmonic Architecture',
    category: 'THEORY & HARMONY',
    level: 'INTERMEDIATE',
    instructor: {
      name: 'Dr. Elena Rostova',
      role: 'Berklee Faculty & Concert Pianist',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    },
    description:
      'Master advanced modal interchange, quartal voicings, secondary dominants, and contemporary neo-soul chord progressions on the piano and DAW.',
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Upper Structures & Extended Voicings',
        lessons: [
          {
            id: 'les-1',
            title: 'Maj9, Min11, and Quartal Voicings on the Piano',
            type: 'KEYBOARD',
            duration: '18 min',
            completed: true,
            notes:
              'Focus on removing the root note from the right hand to create space for 9ths, 11ths, and 13ths. Practice playing the Dmin11 voicing using the Tone.js interactive keybed.',
            targetChord: 'Dmin11',
            notesList: ['D3', 'F3', 'A3', 'C4', 'E4', 'G4'],
            intervals: { D3: 'Root', F3: 'm3', A3: '5th', C4: 'm7', E4: '9th', G4: '11th' },
          },
          {
            id: 'les-2',
            title: 'The 2-5-1 Progression with Tritone Substitution',
            type: 'KEYBOARD',
            duration: '22 min',
            completed: false,
            notes:
              'Substitute Db7#9#5 for G7 when resolving to Cmaj7. Notice how the shared guide tones retain harmonic tension.',
            targetChord: 'Db7#9#5',
            notesList: ['C#3', 'F3', 'B3', 'E4', 'A4'],
            intervals: { 'C#3': 'Root', F3: 'M3', B3: 'm7', E4: '#9', A4: '#5' },
          },
        ],
      },
    ],
  },
  'analog-warmth-precision-mixing': {
    title: 'Analog Warmth & Precision Mixing in the Modern DAW',
    category: 'MIXING & MASTERING',
    level: 'ADVANCED',
    instructor: {
      name: 'Hannes Bieger',
      role: 'Analog Mixing Engineer & Producer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    description:
      'Transform muddy, flat mixes into dimensional, punchy records. Gain staging, surgical EQ, glue compression, and dynamic stereo imaging.',
    modules: [
      {
        id: 'mod-1',
        title: 'Module 1: Low-End Cohesion & Drum Bus Compression',
        lessons: [
          {
            id: 'les-mixing-1',
            title: 'A/B Studio Inspection: Kick & Sub Bass Glue',
            type: 'AB_PLAYER',
            duration: '25 min',
            completed: true,
            notes:
              'Audition Track A (Pre-mix, uncompressed) vs Track B (Post-processed with Dynamic EQ & VCA Glue). Listen for transient clarity.',
          },
        ],
      },
    ],
  },
};

export default function CourseDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'modal-mastery-neo-soul-harmony';
  const course = COURSES_DATA[slug] || COURSES_DATA['modal-mastery-neo-soul-harmony'];

  const [activeLesson, setActiveLesson] = useState(course.modules[0].lessons[0]);
  const [lessonCompleted, setLessonCompleted] = useState(activeLesson.completed);

  const toggleLessonComplete = () => {
    setLessonCompleted(!lessonCompleted);
  };

  return (
    <div className="min-h-screen py-8 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Back to Catalog Breadcrumb */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-gray-400 hover:text-synth-violet dark:hover:text-synth-cyan transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Course Hero Banner */}
      <div className="relative rounded-3xl p-8 bg-white/85 dark:bg-surface-slate/90 border border-slate-200/80 dark:border-white/10 glass-panel shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-synth-violet/15 dark:bg-synth-violet/20 border border-synth-violet/30 dark:border-synth-violet/40 text-synth-violet dark:text-synth-cyan font-mono font-bold">
                {course.category}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400 font-mono">
                {course.level}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {course.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-gray-300 mt-2 max-w-3xl leading-relaxed font-light">
              {course.description}
            </p>

            {/* Instructor Strip */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-200/80 dark:border-white/5">
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{course.instructor.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-gray-400">{course.instructor.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classroom Viewport: Sidebar Curriculum + Interactive Exercise */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Top: Module Syllabus Accordion */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-surface-card border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Curriculum Syllabus</span>
              <span className="text-xs font-mono text-synth-violet dark:text-synth-cyan">1 / 2 Completed</span>
            </h3>

            {course.modules.map((mod: any) => (
              <div key={mod.id} className="space-y-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider py-1 font-mono">
                  {mod.title}
                </div>

                <div className="space-y-2">
                  {mod.lessons.map((les: any) => {
                    const isSelected = activeLesson.id === les.id;
                    return (
                      <button
                        key={les.id}
                        onClick={() => {
                          setActiveLesson(les);
                          setLessonCompleted(les.completed);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-slate-100 dark:bg-surface-slate border-synth-violet dark:border-synth-cyan shadow-sm dark:shadow-glow-cyan/20'
                            : 'bg-slate-50 dark:bg-obsidian/40 border-slate-200/80 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-surface-slate'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {les.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Play className="w-4 h-4 text-synth-violet dark:text-synth-cyan flex-shrink-0" />
                          )}
                          <div>
                            <div className="text-xs font-semibold text-slate-900 dark:text-white leading-snug line-clamp-1">
                              {les.title}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-gray-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <span>{les.duration}</span>
                              <span>•</span>
                              <span className="text-synth-violet dark:text-synth-cyan uppercase">
                                {les.type === 'KEYBOARD' ? 'Piano Lab' : 'A/B Waveform Lab'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Interactive Lesson Classroom */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-surface-card border border-slate-200/80 dark:border-white/10 glass-panel shadow-sm dark:shadow-none transition-colors">
            {/* Lesson Title & Completion Action */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-synth-cyan/15 dark:bg-synth-cyan/20 text-synth-cyan font-mono font-bold uppercase">
                  ACTIVE LESSON
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{activeLesson.title}</h2>
              </div>

              <button
                onClick={toggleLessonComplete}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  lessonCompleted
                    ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-500 dark:text-emerald-400 shadow-glow-cyan'
                    : 'bg-gradient-electric text-white shadow-glow-violet hover:scale-105'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lessonCompleted ? 'Completed ✓' : 'Mark as Complete'}</span>
              </button>
            </div>

            {/* Lesson Context Notes */}
            <div className="py-4 text-sm text-slate-700 dark:text-gray-300 leading-relaxed font-light">
              <p>{activeLesson.notes}</p>
            </div>

            {/* Interactive Component Embedded according to Lesson Type */}
            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10">
              {activeLesson.type === 'KEYBOARD' ? (
                <VirtualKeyboard
                  highlightedNotes={activeLesson.notesList}
                  noteIntervals={activeLesson.intervals}
                />
              ) : (
                <ABPlayer title={activeLesson.title} lessonNotes={activeLesson.notes} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
