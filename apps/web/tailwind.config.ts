import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: 'var(--canvas-bg, #08090D)',
          canvas: 'var(--canvas-bg, #08090D)',
          deep: 'var(--obsidian-deep, #050608)',
        },
        surface: {
          slate: 'var(--surface-slate, #0F111A)',
          card: 'var(--surface-card, #161926)',
          muted: 'var(--surface-muted, #1E2235)',
          border: 'var(--surface-border, rgba(255, 255, 255, 0.08))',
          hover: 'var(--surface-hover, rgba(255, 255, 255, 0.12))',
        },
        synth: {
          violet: '#7C3AED',
          indigo: '#6366F1',
          cyan: '#22D3EE',
        },
        analog: {
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#9333EA',
        },
        meter: {
          emerald: '#10B981',
          cyan: '#06B6D4',
          yellow: '#EAB308',
          red: '#EF4444',
        },
      },
      backgroundImage: {
        'gradient-electric': 'linear-gradient(135deg, #7C3AED 0%, #6366F1 50%, #22D3EE 100%)',
        'gradient-analog': 'linear-gradient(135deg, #F59E0B 0%, #F43F5E 50%, #9333EA 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
        'radial-synth': 'radial-gradient(circle at center, rgba(124, 58, 237, 0.18) 0%, transparent 70%)',
        'radial-analog': 'radial-gradient(circle at center, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        'glass-panel': 'linear-gradient(180deg, rgba(22, 25, 38, 0.75) 0%, rgba(15, 17, 26, 0.85) 100%)',
      },
      boxShadow: {
        'glow-violet': '0 0 35px -5px rgba(124, 58, 237, 0.35)',
        'glow-cyan': '0 0 35px -5px rgba(34, 211, 238, 0.35)',
        'glow-amber': '0 0 35px -5px rgba(245, 158, 11, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.4', filter: 'brightness(1)' },
          '100%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
