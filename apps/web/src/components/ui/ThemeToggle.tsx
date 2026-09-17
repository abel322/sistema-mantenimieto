'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="w-10 h-10 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-100/50 dark:bg-white/5"
        aria-hidden="true"
      />
    );
  }

  const isDark = (resolvedTheme || theme) === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      id="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno'}
      title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-md text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-synth-violet/40 dark:hover:border-white/20 transition-all duration-200 shadow-sm dark:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-synth-violet"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon-icon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Moon className="h-4 w-4 text-synth-cyan" />
          </motion.div>
        ) : (
          <motion.div
            key="sun-icon"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Sun className="h-4 w-4 text-amber-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default ThemeToggle;
