'use client';

import React from 'react';
import { X, Keyboard, Music, Info, Sparkles } from 'lucide-react';
import { DRUM_ORDER, DRUM_PIECES, SUBDIVISION_OPTIONS } from '@/types/drum';

interface DrumLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DrumLegendModal({ isOpen, onClose }: DrumLegendModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-deep/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-surface-card border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-electric text-white shadow-glow-violet">
              <Music className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">
                Guía de Notación de Batería & Atajos Ágiles
              </h2>
              <p className="text-xs text-gray-400">
                Estándar internacional de clave de percusión de 5 líneas y flujo de trabajo Guitar Pro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Percussion Staff Standard Positions Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-synth-cyan font-bold uppercase tracking-wider">
            <Info className="w-4 h-4" />
            <span>Mapeo en Pentagrama Estándar (Clave de Percusión)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DRUM_ORDER.map((pieceId) => {
              const piece = DRUM_PIECES[pieceId];
              return (
                <div
                  key={pieceId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-slate border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: piece.color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-200">{piece.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {piece.staffPositionDesc}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-synth-cyan font-mono text-xs font-bold">
                      [{piece.shortcut}]
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard Shortcuts Matrix */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
            <Keyboard className="w-4 h-4" />
            <span>Atajos de Teclado de Edición Ágil</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-surface-slate border border-white/5 space-y-2">
              <div className="font-semibold text-gray-300 pb-1 border-b border-white/5">
                Navegación & Transporte
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Reproducir / Pausar:</span>
                <span className="text-synth-cyan font-bold">Espacio (Space)</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Paso anterior / siguiente:</span>
                <span className="text-synth-cyan font-bold">&larr; / &rarr;</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Tiempo anterior / siguiente:</span>
                <span className="text-synth-cyan font-bold">&uarr; / &darr;</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Borrar nota del paso:</span>
                <span className="text-rose-400 font-bold">Del / Backspace</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-slate border border-white/5 space-y-2">
              <div className="font-semibold text-gray-300 pb-1 border-b border-white/5">
                Dinámicas & Subdivisiones
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Acento (&gt;):</span>
                <span className="text-amber-400 font-bold">A o &gt;</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Ghost Note ((•)):</span>
                <span className="text-purple-400 font-bold">G o (</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Subdivisión binaria:</span>
                <span className="text-synth-cyan font-bold">1 (1/4), 2 (1/8), 4 (1/16)</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Tuplets irregulares:</span>
                <span className="text-purple-300 font-bold">3 (3:2), 5 (5:4), 6 (6:4), 7 (7:4)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-electric text-white text-xs font-bold hover:opacity-90 transition-all shadow-glow-violet"
          >
            Entendido, ¡a programar ritmos!
          </button>
        </div>
      </div>
    </div>
  );
}
