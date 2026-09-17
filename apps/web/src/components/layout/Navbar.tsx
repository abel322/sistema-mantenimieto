'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BookOpen, Compass, Headphones, Sparkles, User } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Explore Tracks', href: '/#tracks', icon: Compass },
    { label: 'Sound Studio', href: '/studio', icon: Headphones },
    { label: 'My Dashboard', href: '/dashboard', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-obsidian/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-electric p-[1px] shadow-glow-violet transition-transform duration-300 group-hover:scale-105">
            <div className="flex h-full w-full items-center justify-center rounded-[11px] bg-obsidian">
              <Activity className="h-5 w-5 text-synth-cyan animate-pulse-subtle" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-synth-cyan transition-colors">
                SONORA
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-synth-violet/20 border border-synth-violet/40 text-synth-violet font-semibold uppercase tracking-wider">
                Academy
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider">LMS & SOUND LAB</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-surface-slate/70 p-1.5 rounded-full border border-white/5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-synth-violet to-synth-indigo text-white shadow-md'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Status / Quick Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="relative hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white overflow-hidden group border border-synth-cyan/30"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-synth-violet/40 via-synth-indigo/40 to-synth-cyan/40 group-hover:opacity-100 opacity-70 transition-opacity" />
            <Sparkles className="h-3.5 w-3.5 text-synth-cyan relative z-10 animate-spin-slow" />
            <span className="relative z-10">Launch Studio</span>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-xl bg-surface-card border border-white/10 hover:border-synth-violet/40 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-analog flex items-center justify-center text-white font-bold text-xs shadow-glow-amber">
              AR
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-gray-200 leading-none">Alex Rivera</div>
              <div className="text-[10px] text-synth-cyan font-mono mt-0.5">STUDENT PRO</div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
