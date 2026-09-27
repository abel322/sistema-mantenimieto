'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BookOpen,
  Compass,
  Headphones,
  Sparkles,
  Disc,
  Menu,
  X,
  ChevronRight,
  Radio,
} from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    {
      label: 'Drum Lab',
      href: '/studio/drums',
      icon: Disc,
      badge: 'NEW / LIVE',
      description: 'Partituras interactivas y secuenciador',
    },
    {
      label: 'Sound Studio',
      href: '/studio',
      icon: Headphones,
      badge: null,
      description: 'Sintetizador polifónico y mastering A/B',
    },
    {
      label: 'Explore Tracks',
      href: '/#tracks',
      icon: Compass,
      badge: null,
      description: 'Curriculum y pistas de aprendizaje',
    },
    {
      label: 'My Dashboard',
      href: '/dashboard',
      icon: BookOpen,
      badge: null,
      description: 'Progreso de cursos y recursos',
    },
  ];

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md text-slate-900 dark:text-white transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
            <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-electric p-[1px] shadow-glow-violet transition-transform duration-300 group-hover:scale-105">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] sm:rounded-[11px] bg-slate-50 dark:bg-obsidian transition-colors">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-synth-cyan animate-pulse-subtle" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-synth-cyan transition-colors">
                  SONORA
                </span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-synth-violet/15 dark:bg-synth-violet/20 border border-synth-violet/30 dark:border-synth-violet/40 text-synth-violet dark:text-synth-cyan font-semibold uppercase tracking-wider">
                  Academy
                </span>
              </div>
              <p className="hidden xs:block text-[9px] sm:text-[10px] text-slate-500 dark:text-gray-400 font-mono tracking-wider">
                LMS & SOUND LAB
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-surface-slate/70 p-1.5 rounded-full border border-slate-200/80 dark:border-white/5 transition-colors">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 lg:gap-2 px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-synth-violet to-synth-indigo text-white shadow-md'
                      : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-synth-cyan/20 text-synth-cyan font-bold border border-synth-cyan/30">
                      LIVE
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Status, Theme Toggle & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Day / Night Theme Toggle */}
            <ThemeToggle />

            {/* Launch Studio CTA (Visible on tablet & desktop) */}
            <Link
              href="/studio"
              className="relative hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider text-white overflow-hidden group border border-synth-cyan/30"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-synth-violet/40 via-synth-indigo/40 to-synth-cyan/40 group-hover:opacity-100 opacity-70 transition-opacity" />
              <Sparkles className="h-3.5 w-3.5 text-synth-cyan relative z-10 animate-spin-slow" />
              <span className="relative z-10">Launch Studio</span>
            </Link>

            {/* User Profile Capsule */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 pl-2 sm:pl-3 pr-2.5 sm:pr-4 py-1.5 rounded-xl bg-white dark:bg-surface-card border border-slate-200/80 dark:border-white/10 hover:border-synth-violet/40 shadow-sm dark:shadow-none transition-all"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-analog flex items-center justify-center text-white font-bold text-xs shadow-glow-amber">
                AR
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-gray-200 leading-none">
                  Alex Rivera
                </div>
                <div className="text-[10px] text-synth-violet dark:text-synth-cyan font-mono mt-0.5">
                  STUDENT PRO
                </div>
              </div>
            </Link>

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100/90 dark:bg-surface-card border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-200 hover:text-synth-cyan hover:border-synth-cyan/40 active:scale-95 transition-all focus:outline-none"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú de navegación'}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-synth-cyan transition-transform duration-200" />
              ) : (
                <Menu className="h-5 w-5 transition-transform duration-200" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden animate-fade-in transition-opacity"
        />
      )}

      {/* Mobile Slide-Over Drawer Sheet */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm bg-[#0B0F19]/95 dark:bg-[#08090D]/95 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-electric p-[1px] shadow-glow-violet">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-obsidian">
                  <Activity className="h-4 w-4 text-synth-cyan" />
                </div>
              </div>
              <div>
                <span className="font-bold text-white text-base tracking-tight">SONORA</span>
                <span className="text-[10px] ml-1.5 px-1.5 py-0.2 rounded-full bg-synth-violet/20 border border-synth-violet/30 text-synth-cyan font-mono font-semibold">
                  ACADEMY
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links List */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-gray-500 uppercase tracking-wider px-2 font-semibold">
              Módulos y Laboratorios
            </div>

            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-synth-violet/25 to-synth-indigo/25 border-synth-violet/50 text-white shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                      : 'bg-surface-slate/70 border-white/5 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl border transition-colors ${
                        isActive
                          ? 'bg-gradient-electric text-white border-transparent shadow-glow-violet'
                          : 'bg-surface-card border-white/10 text-gray-400 group-hover:text-synth-cyan group-hover:border-synth-cyan/40'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{link.label}</span>
                        {link.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-synth-cyan/20 text-synth-cyan font-bold border border-synth-cyan/30 animate-pulse">
                            {link.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {link.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-synth-cyan group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>

          {/* Quick Action Featured CTA */}
          <div className="pt-2">
            <Link
              href="/studio"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-electric text-white font-bold text-xs uppercase tracking-wider shadow-glow-violet hover:opacity-95 transition-all"
            >
              <Sparkles className="h-4 w-4 text-synth-cyan" />
              <span>LAUNCH SOUND STUDIO</span>
            </Link>
          </div>
        </div>

        {/* Drawer Footer with User Info and Engine Status */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-slate/80 border border-white/10 hover:border-synth-violet/40 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-analog flex items-center justify-center text-white font-bold text-xs shadow-glow-amber">
              AR
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-gray-200">Alex Rivera</div>
              <div className="text-[10px] text-synth-cyan font-mono">STUDENT PRO • NIVEL 4</div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </Link>

          <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tone.js 48kHz Engine
            </span>
            <span>v2.4.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
