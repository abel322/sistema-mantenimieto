'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Music,
  Sliders,
  Headphones,
  Award,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface SkillNode {
  id: string;
  title: string;
  category: string;
  level: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED';
  progress: number;
  slug: string;
  icon: any;
  connections: string[];
  description: string;
  highlightSkill: string;
}

const SKILL_NODES: SkillNode[] = [
  {
    id: 'harmony-1',
    title: 'Modal Harmony & Voicings',
    category: 'THEORY & HARMONY',
    level: 'Intermediate',
    status: 'IN_PROGRESS',
    progress: 50,
    slug: 'modal-mastery-neo-soul-harmony',
    icon: Music,
    connections: ['instruments-1', 'production-1'],
    description: 'Master upper structure triads, quartal chords, and neo-soul modal interchange.',
    highlightSkill: 'Tone.js Chord Lab',
  },
  {
    id: 'instruments-1',
    title: 'Keyboard Touch & Independence',
    category: 'PERFORMANCE',
    level: 'Beginner',
    status: 'COMPLETED',
    progress: 100,
    slug: 'advanced-keyboard-technique-touch-dynamics',
    icon: Sparkles,
    connections: ['production-1'],
    description: 'Dynamic finger balance, polyrhythmic coordination, and keybed ergonomics.',
    highlightSkill: '25-Key Velocity Practice',
  },
  {
    id: 'production-1',
    title: 'Electronic Arrangement',
    category: 'PRODUCTION',
    level: 'Intermediate',
    status: 'IN_PROGRESS',
    progress: 35,
    slug: 'electronic-music-architecture-arrangement',
    icon: Sliders,
    connections: ['mixing-1'],
    description: 'Transform 8-bar loops into 6-minute club tracks with tension curves.',
    highlightSkill: 'Energy Management Matrix',
  },
  {
    id: 'mixing-1',
    title: 'Analog Warmth & Glue',
    category: 'MIXING & ENGINEERING',
    level: 'Advanced',
    status: 'COMPLETED',
    progress: 100,
    slug: 'analog-warmth-precision-mixing',
    icon: Headphones,
    connections: ['mastering-1'],
    description: 'Sub-bass sidechaining, surgical dynamic EQ, and dual stem A/B analysis.',
    highlightSkill: 'Wavesurfer A/B Inspection',
  },
  {
    id: 'mastering-1',
    title: 'Precision Mastering & LUFS',
    category: 'MASTERING',
    level: 'Masterclass',
    status: 'LOCKED',
    progress: 0,
    slug: 'mastering-precision-lufs',
    icon: Award,
    connections: [],
    description: 'Multiband limiting, psychoacoustic stereo enhancement, and streaming loudness.',
    highlightSkill: 'LUFS Metering Lab',
  },
];

export default function SkillTree({ onSelectNode }: { onSelectNode?: (node: SkillNode) => void }) {
  const [selectedNode, setSelectedNode] = useState<SkillNode>(SKILL_NODES[0]);

  const handleNodeClick = (node: SkillNode) => {
    setSelectedNode(node);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-6 lg:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-gradient-electric text-white">
              <Zap className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-synth-cyan font-bold">
              Dynamic Mastery Pathway
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            Academic Skill Tree & Progression Graph
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Interactive node map linking music theory through to commercial master release
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            Mastered
          </span>
          <span className="flex items-center gap-1.5 text-synth-cyan">
            <span className="w-2.5 h-2.5 rounded-full bg-synth-cyan animate-ping" />
            In Progress
          </span>
          <span className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-600" />
            Locked
          </span>
        </div>
      </div>

      {/* Interactive Pathway Graph Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative mb-8">
        {SKILL_NODES.map((node, index) => {
          const Icon = node.icon;
          const isSelected = selectedNode.id === node.id;
          const isCompleted = node.status === 'COMPLETED';
          const isInProgress = node.status === 'IN_PROGRESS';
          const isLocked = node.status === 'LOCKED';

          return (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`relative rounded-2xl p-5 border cursor-pointer transition-all duration-300 group flex flex-col justify-between ${
                isSelected
                  ? 'bg-surface-slate border-synth-cyan shadow-glow-cyan/40 scale-[1.03] z-20'
                  : isCompleted
                  ? 'bg-surface-card border-emerald-500/30 hover:border-emerald-500/60'
                  : isInProgress
                  ? 'bg-surface-card border-synth-violet/40 hover:border-synth-cyan/60'
                  : 'bg-obsidian/60 border-white/5 opacity-50 hover:opacity-75'
              }`}
            >
              {/* Active Pulse Aura */}
              {isInProgress && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-synth-cyan opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-synth-cyan" />
                </div>
              )}

              <div>
                {/* Node Status & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isInProgress
                        ? 'bg-synth-violet/20 text-synth-cyan border border-synth-violet/40'
                        : 'bg-surface-slate text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    STEP 0{index + 1}
                  </span>
                </div>

                {/* Node Title & Vertical */}
                <div className="text-[10px] font-mono font-bold text-synth-cyan tracking-wider mb-1">
                  {node.category}
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-synth-cyan transition-colors leading-snug mb-2">
                  {node.title}
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {node.description}
                </p>
              </div>

              {/* Progress Bar & Status Pill */}
              <div className="mt-5 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] mb-1.5 font-mono">
                  <span className="text-gray-400">{node.level}</span>
                  <span
                    className={`font-bold ${
                      isCompleted
                        ? 'text-emerald-400'
                        : isInProgress
                        ? 'text-synth-cyan'
                        : 'text-gray-500'
                    }`}
                  >
                    {node.progress}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-obsidian rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-emerald-400'
                        : isInProgress
                        ? 'bg-gradient-electric'
                        : 'bg-gray-700'
                    }`}
                    style={{ width: `${node.progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Node Action Deck */}
      <div className="p-6 rounded-2xl bg-surface-card border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-synth-cyan/20 text-synth-cyan font-mono font-bold uppercase">
              Selected Track Node
            </span>
            <span className="text-xs text-gray-400">• {selectedNode.category}</span>
          </div>
          <h4 className="text-xl font-bold text-white">{selectedNode.title}</h4>
          <p className="text-xs text-gray-300 max-w-2xl">{selectedNode.description}</p>
          <div className="flex items-center gap-2 pt-1 text-xs text-synth-cyan font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Lab: {selectedNode.highlightSkill}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedNode.status !== 'LOCKED' ? (
            <Link
              href={`/courses/${selectedNode.slug}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-electric text-white font-bold text-xs uppercase tracking-wider shadow-glow-violet hover:scale-105 active:scale-95 transition-all"
            >
              <span>Enter Classroom & Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-slate text-gray-500 font-bold text-xs uppercase tracking-wider cursor-not-allowed border border-white/5"
            >
              <Lock className="w-4 h-4" />
              <span>Complete Previous Modules to Unlock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
