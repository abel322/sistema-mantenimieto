import { PrismaClient, Role, CourseLevel, TrackCategory, LessonType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Sonora Academy Database Seed...');

  // 1. Clean existing records
  await prisma.audioStem.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Instructors and Student
  const instructorHannes = await prisma.user.create({
    data: {
      email: 'hannes.bieger@sonora.academy',
      passwordHash: '$2a$12$e6O.eXkXm2N8R6uR9FmJieK/0ZlQ59xOa79YvP7g2Uo3s0n123456', // Demo hash
      name: 'Hannes Bieger',
      role: Role.INSTRUCTOR,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Renowned mixing engineer and analog gear specialist. Credits with Bedrock, Poker Flat, and Watergate.',
    },
  });

  const instructorElena = await prisma.user.create({
    data: {
      email: 'elena.rostova@sonora.academy',
      passwordHash: '$2a$12$e6O.eXkXm2N8R6uR9FmJieK/0ZlQ59xOa79YvP7g2Uo3s0n123456',
      name: 'Dr. Elena Rostova',
      role: Role.INSTRUCTOR,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      bio: 'Concert pianist & Berklee Harmony faculty. Pioneer of modern modal jazz and neo-soul harmonic reharmonization.',
    },
  });

  const demoStudent = await prisma.user.create({
    data: {
      email: 'student@sonora.academy',
      passwordHash: '$2a$12$e6O.eXkXm2N8R6uR9FmJieK/0ZlQ59xOa79YvP7g2Uo3s0n123456',
      name: 'Alex Rivera',
      role: Role.STUDENT,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
      bio: 'Music Producer & Electronic Composer. Focused on mastering modular synthesis and analog mixing techniques.',
    },
  });

  // 3. Create Courses across 5 Tracks

  // Track 1: Theory & Harmony
  const theoryCourse = await prisma.course.create({
    data: {
      title: 'Modal Mastery & Neo-Soul Harmonic Architecture',
      slug: 'modal-mastery-neo-soul-harmony',
      description: 'Master advanced modal interchange, quartal voicings, secondary dominants, and contemporary neo-soul chord progressions.',
      coverImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
      category: TrackCategory.THEORY_HARMONY,
      level: CourseLevel.INTERMEDIATE,
      published: true,
      price: 189.0,
      instructorId: instructorElena.id,
      modules: {
        create: [
          {
            title: 'Module 1: Upper Structures & Extended Voicings',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Maj9, Min11, and Quartal Voicings on the Piano',
                  slug: 'maj9-min11-quartal-voicings',
                  orderIndex: 1,
                  type: LessonType.INTERACTIVE_PRACTICE,
                  contentMarkdown: `### The Essence of Modern Neo-Soul Voicings\n\nIn this lesson, we explore how removing the root note from the right hand frees up harmonic space for 9ths, 11ths, and 13ths. Practice playing the Dmin11 voicing using the interactive keyboard below.`,
                  interactiveData: {
                    type: 'KEYBOARD_PRACTICE',
                    targetChord: 'Dmin11',
                    rootNote: 'D3',
                    notes: ['D3', 'F3', 'A3', 'C4', 'E4', 'G4'],
                    intervals: {
                      'D3': 'Root',
                      'F3': 'b3',
                      'A3': '5th',
                      'C4': 'b7',
                      'E4': '9th',
                      'G4': '11th',
                    },
                    explanation: 'A lush modern voicing where the 11th (G) resolves smoothly across soulful progressions.',
                  },
                },
                {
                  title: 'The 2-5-1 Progression with Tritone Substitution',
                  slug: '2-5-1-tritone-substitution',
                  orderIndex: 2,
                  type: LessonType.INTERACTIVE_PRACTICE,
                  contentMarkdown: `### Tritone Substitution in Action\n\nInstead of G7 resolving to Cmaj7, substitute Db7alt. Notice how the shared guide tones (3rd and 7th) retain the tension while offering chromatic bass movement.`,
                  interactiveData: {
                    type: 'KEYBOARD_PRACTICE',
                    targetChord: 'Db7#9#5',
                    rootNote: 'C#3',
                    notes: ['C#3', 'F3', 'B3', 'E4', 'A4'],
                    intervals: {
                      'C#3': 'Root',
                      'F3': '3rd',
                      'B3': 'b7',
                      'E4': '#9',
                      'A4': '#5',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Track 2: Mixing & Audio Engineering (with A/B Stems)
  const mixingCourse = await prisma.course.create({
    data: {
      title: 'Analog Warmth & Precision Mixing in the Modern DAW',
      slug: 'analog-warmth-precision-mixing',
      description: 'Transform muddy, flat mixes into dimensional, punchy records. Gain staging, surgical EQ vs character EQ, glue compression, and dynamic stereo imaging.',
      coverImageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
      category: TrackCategory.MIXING_MASTERING,
      level: CourseLevel.ADVANCED,
      published: true,
      price: 249.0,
      instructorId: instructorHannes.id,
      modules: {
        create: [
          {
            title: 'Module 1: Low-End Cohesion & Drum Bus Compression',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'A/B Studio Inspection: Kick & Sub Bass Glue',
                  slug: 'kick-sub-bass-glue-ab',
                  orderIndex: 1,
                  type: LessonType.AUDIO_COMPARISON_AB,
                  contentMarkdown: `### Critical A/B Listening Exercise\n\nListen carefully to the relationship between the 808 sub and the transient of the kick. Toggle seamlessly between Track A (Pre-Mix, Uncompressed & Masked) and Track B (Post-Processed with Sidechain Dynamic EQ & VCA Glue).`,
                  interactiveData: {
                    type: 'AB_COMPARISON',
                    trackAName: 'Track A: Raw Unmixed Stems',
                    trackBName: 'Track B: Analog Processed & Glued',
                    highlightRange: [8.5, 24.0],
                    lufsTarget: -14.0,
                    lufsPre: -18.2,
                    lufsPost: -14.1,
                  },
                  audioStems: {
                    create: [
                      {
                        label: 'Track A: Raw Mixdown',
                        fileUrl: 'https://actions.google.com/sounds/v1/ambiences/deep_space_synth.ogg',
                      },
                      {
                        label: 'Track B: Mastered Bus',
                        fileUrl: 'https://actions.google.com/sounds/v1/ambiences/warm_synth_pad.ogg',
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Track 3: Sound Design & Modular Synthesis
  const soundDesignCourse = await prisma.course.create({
    data: {
      title: 'Wavetable & FM Synthesis: Sculpting Organic Textures',
      slug: 'wavetable-fm-synthesis-sculpting',
      description: 'Deconstruct complex timbres, modulation matrices, custom wavetable creation, and psychoacoustic spatial design.',
      coverImageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      category: TrackCategory.SOUND_DESIGN,
      level: CourseLevel.ADVANCED,
      published: true,
      price: 199.0,
      instructorId: instructorHannes.id,
      modules: {
        create: [
          {
            title: 'Module 1: Subtractive & FM Hybridization',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Sculpting the Cyberpunk Bass Lead',
                  slug: 'sculpting-cyberpunk-bass-lead',
                  orderIndex: 1,
                  type: LessonType.INTERACTIVE_PRACTICE,
                  contentMarkdown: 'Interactive wave oscillator and envelope shaping exercise.',
                  interactiveData: {
                    synthPreset: 'CYBER_BASS_808',
                    oscillator: 'sawtooth',
                    filterCutoff: 850,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Track 4: Instrument Performance
  const instrumentsCourse = await prisma.course.create({
    data: {
      title: 'Advanced Keyboard Technique: Touch, Dynamics & Repertoire',
      slug: 'advanced-keyboard-technique-touch-dynamics',
      description: 'Develop finger independence, polyrhythmic hand coordination, dynamic expression, and expressive pedal mastery.',
      coverImageUrl: 'https://images.unsplash.com/photo-1520523839898-50712705497c?auto=format&fit=crop&w=1200&q=80',
      category: TrackCategory.INSTRUMENTS,
      level: CourseLevel.BEGINNER,
      published: true,
      price: 149.0,
      instructorId: instructorElena.id,
      modules: {
        create: [
          {
            title: 'Module 1: Biomechanical Foundations',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'Weight Distribution and Relaxation at the Keybed',
                  slug: 'weight-distribution-relaxation',
                  orderIndex: 1,
                  type: LessonType.VIDEO,
                  contentMarkdown: 'Foundational ergonomic principles for playing without strain.',
                  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Track 5: Music Production
  const productionCourse = await prisma.course.create({
    data: {
      title: 'Electronic Music Architecture & Arrangement',
      slug: 'electronic-music-architecture-arrangement',
      description: 'From 8-bar loop to full cinematic release. Energy management, automation curves, micro-sampling, and ear candy.',
      coverImageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
      category: TrackCategory.PRODUCTION,
      level: CourseLevel.INTERMEDIATE,
      published: true,
      price: 179.0,
      instructorId: instructorHannes.id,
      modules: {
        create: [
          {
            title: 'Module 1: Arrangement Blueprint & Tension Curves',
            orderIndex: 1,
            lessons: {
              create: [
                {
                  title: 'The Tension-Release Matrix in Dance Music',
                  slug: 'tension-release-matrix',
                  orderIndex: 1,
                  type: LessonType.VIDEO,
                  contentMarkdown: 'Analyzing how risers, sweeps, and spectral subtraction build irresistible drops.',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 4. Enroll Student in Theory and Mixing courses
  const enrollTheory = await prisma.enrollment.create({
    data: {
      userId: demoStudent.id,
      courseId: theoryCourse.id,
      progressPercent: 50.0,
      completed: false,
    },
  });

  const enrollMixing = await prisma.enrollment.create({
    data: {
      userId: demoStudent.id,
      courseId: mixingCourse.id,
      progressPercent: 100.0,
      completed: true,
    },
  });

  console.log('✅ Seed completed successfully:');
  console.log(`- 2 Instructors, 1 Student`);
  console.log(`- 5 Courses spanning all musical verticals`);
  console.log(`- Interactive Chord Practice & A/B Audio Comparison stems attached.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
