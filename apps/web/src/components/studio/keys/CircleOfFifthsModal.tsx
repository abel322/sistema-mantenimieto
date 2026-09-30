'use client';

import React, { useState } from 'react';
import { CIRCLE_OF_FIFTHS, CircleKeyInfo } from '@/services/theory/keysTheoryEngine';
import { X, Globe, Music, ArrowRight, Sparkles } from 'lucide-react';

interface CircleOfFifthsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKey: (key: string) => void;
  activeKey: string;
}

export default function CircleOfFifthsModal({
  isOpen,
  onClose,
  onSelectKey,
  activeKey,
}: CircleOfFifthsModalProps) {
  const [selectedKeyInfo, setSelectedKeyInfo] = useState<CircleKeyInfo>(
    CIRCLE_OF_FIFTHS.find((k) => k.key === activeKey) || CIRCLE_OF_FIFTHS[0]
  );

  if (!isOpen) return null;

  const handleKeyClick = (info: CircleKeyInfo) => {
    setSelectedKeyInfo(info);
    onSelectKey(info.key);
  };

  // Dimensions for SVG wheel
  const size = 340;
  const center = size / 2;
  const outerRadius = 150;
  const innerRadius = 100;
  const coreRadius = 55;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#080d1a] border border-slate-800 shadow-2xl p-6 text-slate-100 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Interactive SVG Circle */}
        <div className="flex flex-col items-center gap-4 flex-1">
          <div className="flex items-center gap-2 text-cyan-400 font-extrabold uppercase text-xs tracking-wider">
            <Globe className="w-4 h-4" />
            <span>Círculo de Quintas Interactivo</span>
          </div>

          <div className="relative w-[340px] h-[340px]">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Outer Ring: 12 Major Keys */}
              {CIRCLE_OF_FIFTHS.map((info, idx) => {
                const angle = (idx * 30 - 90) * (Math.PI / 180);
                const nextAngle = ((idx + 1) * 30 - 90) * (Math.PI / 180);

                // Arc math
                const x1Outer = center + outerRadius * Math.cos(angle);
                const y1Outer = center + outerRadius * Math.sin(angle);
                const x2Outer = center + outerRadius * Math.cos(nextAngle);
                const y2Outer = center + outerRadius * Math.sin(nextAngle);

                const x1Inner = center + innerRadius * Math.cos(angle);
                const y1Inner = center + innerRadius * Math.sin(angle);
                const x2Inner = center + innerRadius * Math.cos(nextAngle);
                const y2Inner = center + innerRadius * Math.sin(nextAngle);

                const isSelected = selectedKeyInfo.key === info.key;
                const isNeighbor = selectedKeyInfo.neighbors.includes(info.key);

                // Path for Outer Wedge
                const outerPath = `M ${x1Inner} ${y1Inner} L ${x1Outer} ${y1Outer} A ${outerRadius} ${outerRadius} 0 0 1 ${x2Outer} ${y2Outer} L ${x2Inner} ${y2Inner} A ${innerRadius} ${innerRadius} 0 0 0 ${x1Inner} ${y1Inner} Z`;

                // Label center position
                const midAngle = (angle + nextAngle) / 2;
                const labelRadius = (outerRadius + innerRadius) / 2;
                const labelX = center + labelRadius * Math.cos(midAngle);
                const labelY = center + labelRadius * Math.sin(midAngle);

                return (
                  <g key={`outer-${info.key}`} onClick={() => handleKeyClick(info)} className="cursor-pointer group">
                    <path
                      d={outerPath}
                      className={`transition-all duration-200 stroke-slate-900 stroke-2 ${
                        isSelected
                          ? 'fill-cyan-500 shadow-glow'
                          : isNeighbor
                          ? 'fill-slate-800 hover:fill-slate-700'
                          : 'fill-slate-900/90 hover:fill-slate-800'
                      }`}
                    />
                    <text
                      x={labelX}
                      y={labelY + 4}
                      textAnchor="middle"
                      className={`text-xs font-mono font-extrabold select-none ${
                        isSelected ? 'fill-slate-950 font-black' : isNeighbor ? 'fill-cyan-300' : 'fill-slate-200'
                      }`}
                    >
                      {info.key}
                    </text>
                  </g>
                );
              })}

              {/* Inner Ring: Relative Minor Keys */}
              {CIRCLE_OF_FIFTHS.map((info, idx) => {
                const angle = (idx * 30 - 90) * (Math.PI / 180);
                const nextAngle = ((idx + 1) * 30 - 90) * (Math.PI / 180);

                const x1Inner = center + innerRadius * Math.cos(angle);
                const y1Inner = center + innerRadius * Math.sin(angle);
                const x2Inner = center + innerRadius * Math.cos(nextAngle);
                const y2Inner = center + innerRadius * Math.sin(nextAngle);

                const x1Core = center + coreRadius * Math.cos(angle);
                const y1Core = center + coreRadius * Math.sin(angle);
                const x2Core = center + coreRadius * Math.cos(nextAngle);
                const y2Core = center + coreRadius * Math.sin(nextAngle);

                const isSelected = selectedKeyInfo.key === info.key;

                const innerPath = `M ${x1Core} ${y1Core} L ${x1Inner} ${y1Inner} A ${innerRadius} ${innerRadius} 0 0 1 ${x2Inner} ${y2Inner} L ${x2Core} ${y2Core} A ${coreRadius} ${coreRadius} 0 0 0 ${x1Core} ${y1Core} Z`;

                const midAngle = (angle + nextAngle) / 2;
                const labelRadius = (innerRadius + coreRadius) / 2;
                const labelX = center + labelRadius * Math.cos(midAngle);
                const labelY = center + labelRadius * Math.sin(midAngle);

                return (
                  <g key={`inner-${info.key}`} onClick={() => handleKeyClick(info)} className="cursor-pointer">
                    <path
                      d={innerPath}
                      className={`transition-all duration-200 stroke-slate-900 stroke-1 ${
                        isSelected ? 'fill-purple-500' : 'fill-[#0f172a] hover:fill-purple-950'
                      }`}
                    />
                    <text
                      x={labelX}
                      y={labelY + 3}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-bold fill-slate-300 select-none"
                    >
                      {info.relativeMinor}
                    </text>
                  </g>
                );
              })}

              {/* Core Center Emblem */}
              <circle cx={center} cy={center} r={coreRadius - 2} className="fill-[#040711] stroke-slate-800 stroke-2" />
              <text x={center} y={center - 4} textAnchor="middle" className="text-[10px] font-bold fill-slate-400 font-mono">
                CLAVE
              </text>
              <text x={center} y={center + 14} textAnchor="middle" className="text-sm font-black fill-cyan-400 font-mono">
                {selectedKeyInfo.key}
              </text>
            </svg>
          </div>
        </div>

        {/* Right Column: Key Signature & Diatonic Harmony Details */}
        <div className="flex flex-col gap-4 flex-1 bg-slate-900/60 p-5 rounded-xl border border-slate-800">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-cyan-400 font-mono">
                Tonalidad: {selectedKeyInfo.key} Mayor / {selectedKeyInfo.relativeMinor}
              </h3>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                {selectedKeyInfo.accidentalsText}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Armadura de clave y constelación de acordes diatónicos para modulación armónica fluida.
            </p>
          </div>

          {/* Diatonic Chords Grid */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Familia de Acordes Diatónicos
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedKeyInfo.diatonicChords.map((chord, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between"
                >
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{chord.degree}</span>
                  <span className="text-xs font-extrabold text-slate-100 font-mono">{chord.chordName}</span>
                  <span className="text-[9px] text-slate-400">{chord.quality}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Neighboring Keys / Modulation */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Tonalidades Vecinas Directas (Modulación)
            </span>
            <div className="flex flex-wrap gap-2">
              {selectedKeyInfo.neighbors.map((nb, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-md bg-purple-950/80 text-purple-200 border border-purple-800/60 text-xs font-mono font-bold"
                >
                  {nb}
                </span>
              ))}
            </div>
          </div>

          {/* Select Key Action */}
          <button
            onClick={() => {
              onSelectKey(selectedKeyInfo.key);
              onClose();
            }}
            className="w-full mt-auto py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/20 hover:brightness-110 flex items-center justify-center gap-2"
          >
            <span>Fijar {selectedKeyInfo.key} como Tónica en Estudio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
