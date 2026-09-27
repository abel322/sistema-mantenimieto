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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#0B0F19] border-t sm:border border-white/10 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-1 sm:hidden flex-shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-gradient-electric text-white shadow-glow-violet flex-shrink-0">
              <Music className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                Guía de Notación & Atajos
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate hidden sm:block">
                Estándar internacional de clave de percusión de 5 líneas y flujo de trabajo Guitar Pro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-surface-slate border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all flex-shrink-0"
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
                Dinámicas & Figuras
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
                <span>Silencio percusivo:</span>
                <span className="text-sky-400 font-bold">Z o 0</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Redonda / Blanca:</span>
                <span className="text-synth-cyan font-bold">W (1/1) / Y (1/2)</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Subdivisión regular:</span>
                <span className="text-synth-cyan font-bold">1 (1/4), 2 (1/8), 4 (1/16), 8 (1/32)</span>
              </div>
              <div className="flex justify-between font-mono text-gray-400">
                <span>Tuplets irregulares:</span>
                <span className="text-purple-300 font-bold">3, 5, 6, 7 y 9 (Nonillo 9:8)</span>
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
