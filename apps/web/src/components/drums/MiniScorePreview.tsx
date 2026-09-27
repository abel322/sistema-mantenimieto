'use client';

import React from 'react';
import { RudimentItem, RudimentStep, GroovePattern, GrooveHit, VoicingMode, DrumPieceId } from '@/types/drum';

export interface MiniScorePreviewProps {
  rudiment?: RudimentItem;
  groove?: GroovePattern;
  steps?: RudimentStep[];
  subdivision?: number | string;
  timeSignature?: string | [number, number];
  voicing?: VoicingMode;
  className?: string;
  width?: number;
  height?: number;
}

// Map drum piece to stave Y coordinate (5 staff lines at y = 16, 22, 28, 34, 40)
function getPieceY(piece: DrumPieceId | undefined, defaultY: number = 28): { y: number; isX: boolean; isOpenX: boolean } {
  switch (piece) {
    case 'crash':
    case 'china':
      return { y: 10, isX: true, isOpenX: true };
    case 'ride':
      return { y: 12, isX: true, isOpenX: false };
    case 'hihat':
    case 'hihatClosed':
      return { y: 14, isX: true, isOpenX: false };
    case 'hihatOpen':
      return { y: 14, isX: true, isOpenX: true };
    case 'tom1':
      return { y: 22, isX: false, isOpenX: false };
    case 'tom2':
      return { y: 25, isX: false, isOpenX: false };
    case 'cowbell':
      return { y: 18, isX: false, isOpenX: false };
    case 'snare':
      return { y: 28, isX: false, isOpenX: false };
    case 'floorTom':
      return { y: 34, isX: false, isOpenX: false };
    case 'kick':
      return { y: 40, isX: false, isOpenX: false };
    case 'hihatFoot':
      return { y: 44, isX: true, isOpenX: false };
    default:
      return { y: defaultY, isX: false, isOpenX: false };
  }
}

function MiniScorePreviewComponent({
  rudiment,
  groove,
  steps,
  subdivision,
  voicing = 'kit',
  className = '',
  width = 270,
  height = 70,
}: MiniScorePreviewProps) {
  // --- Case 1: Rudiment Rendering ---
  if (rudiment || (steps && steps.length > 0)) {
    const rawSteps: RudimentStep[] = rudiment ? rudiment.steps : steps || [];
    const sub = typeof subdivision === 'number' ? subdivision : rudiment?.subdivision || 4;
    const numNotes = Math.max(1, rawSteps.length);

    // Coordinate boundaries
    const staffStartX = 10;
    const staffEndX = width - 10;
    const notesStartX = 34;
    const notesEndX = width - 18;
    const availableWidth = notesEndX - notesStartX;
    const stepWidth = availableWidth / numNotes;

    // Calculate grouping for beams based on subdivision
    const groupSize = sub === 3 || sub === 6 ? 3 : sub === 5 ? 5 : sub === 2 ? 2 : 4;
    const beamY = 8;
    const numBeamBars = sub === 8 ? 3 : sub === 4 || sub === 5 || sub === 6 ? 2 : 1;

    // Prepare note layout
    const noteLayout = rawSteps.map((st, i) => {
      const x = notesStartX + (i + 0.5) * stepWidth;
      const isKick = st.sticking === 'K';
      const kitPiece = voicing === 'kit'
        ? st.kitPiece || (isKick ? 'kick' : 'snare')
        : isKick ? 'kick' : 'snare';
      const { y, isX, isOpenX } = getPieceY(kitPiece, 28);

      return {
        step: st,
        index: i,
        x,
        y,
        isX,
        isOpenX,
        isKick,
        groupIndex: Math.floor(i / groupSize),
      };
    });

    // Group notes for beams
    const groups: (typeof noteLayout)[] = [];
    noteLayout.forEach((nl) => {
      if (!groups[nl.groupIndex]) groups[nl.groupIndex] = [];
      groups[nl.groupIndex].push(nl);
    });

    return (
      <div
        className={`bg-slate-900/60 dark:bg-black/40 rounded-lg border border-white/5 py-1 px-2 flex justify-center items-center overflow-hidden select-none ${className}`}
        style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 5-Line Percussion Staff */}
          {[16, 22, 28, 34, 40].map((lineY) => (
            <line
              key={`staff-${lineY}`}
              x1={staffStartX}
              y1={lineY}
              x2={staffEndX}
              y2={lineY}
              stroke="#334155"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          ))}

          {/* Left Barline and Percussion Clef */}
          <line x1={staffStartX} y1="16" x2={staffStartX} y2="40" stroke="#475569" strokeWidth="1.5" />
          <rect x="14" y="20" width="2.5" height="16" rx="0.5" fill="#64748B" />
          <rect x="18" y="20" width="2.5" height="16" rx="0.5" fill="#64748B" />

          {/* Right End Barline */}
          <line x1={staffEndX - 3} y1="16" x2={staffEndX - 3} y2="40" stroke="#475569" strokeWidth="1" />
          <line x1={staffEndX} y1="16" x2={staffEndX} y2="40" stroke="#475569" strokeWidth="2" />

          {/* Beams and Tuplet Indicators for each group */}
          {groups.map((group, gIdx) => {
            if (group.length < 2) return null;
            const firstX = group[0].x + 3.2;
            const lastX = group[group.length - 1].x + 3.2;
            const midX = (firstX + lastX) / 2;

            return (
              <g key={`beam-group-${gIdx}`}>
                {/* Primary Beam Bar */}
                <line
                  x1={firstX}
                  y1={beamY}
                  x2={lastX}
                  y2={beamY}
                  stroke="#38BDF8"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />

                {/* Secondary Beam Bar (for 16ths, sextuplets, etc.) */}
                {numBeamBars >= 2 && (
                  <line
                    x1={firstX}
                    y1={beamY + 3.5}
                    x2={lastX}
                    y2={beamY + 3.5}
                    stroke="#38BDF8"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                )}

                {/* Tertiary Beam Bar (for 32nds) */}
                {numBeamBars >= 3 && (
                  <line
                    x1={firstX}
                    y1={beamY + 6.8}
                    x2={lastX}
                    y2={beamY + 6.8}
                    stroke="#38BDF8"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}

                {/* Tuplet Number Indicator (3, 5, 6) */}
                {(sub === 3 || sub === 5 || sub === 6) && (
                  <g>
                    <rect
                      x={midX - 5.5}
                      y={beamY - 7.5}
                      width="11"
                      height="7"
                      rx="1.5"
                      fill="#0F172A"
                      stroke="#0284C7"
                      strokeWidth="0.8"
                    />
                    <text
                      x={midX}
                      y={beamY - 2.2}
                      fill="#38BDF8"
                      fontSize="7.5"
                      fontWeight="bold"
                      fontFamily="ui-monospace, monospace"
                      textAnchor="middle"
                    >
                      {sub === 6 ? '6' : sub === 5 ? '5' : '3'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Notes, Stems, Accents, Grace Notes & Sticking */}
          {noteLayout.map(({ step, x, y, isX, isOpenX, isKick }) => {
            const isAccent = !!step.accent;
            const isGhost = !!step.ghost;
            const isFlam = !!step.flam;
            const isDrag = !!step.drag;

            // Sticking letter colors
            const stickingUpper = (step.sticking || '').toUpperCase();
            let stickingColor = '#94A3B8';
            if (stickingUpper.startsWith('R')) stickingColor = '#38BDF8';
            else if (stickingUpper.startsWith('L')) stickingColor = '#C084FC';
            else if (stickingUpper.startsWith('K')) stickingColor = '#34D399';
            else if (stickingUpper.startsWith('B')) stickingColor = '#F59E0B';

            return (
              <g key={`note-${x}`}>
                {/* Flam Grace Note */}
                {isFlam && (
                  <g className="opacity-90">
                    <ellipse cx={x - 7.5} cy={y + 1} rx="2.2" ry="1.6" transform={`rotate(-20 ${x - 7.5} ${y + 1})`} fill="#38BDF8" />
                    <line x1={x - 5.5} y1={y + 1} x2={x - 5.5} y2={y - 8} stroke="#38BDF8" strokeWidth="1" />
                    <line x1={x - 7} y1={y - 5.5} x2={x - 3.5} y2={y - 3.5} stroke="#38BDF8" strokeWidth="1" />
                    {/* Small grace slur curve */}
                    <path
                      d={`M ${x - 7.5} ${y + 3.5} Q ${x - 3.5} ${y + 6.5} ${x - 0.5} ${y + 3.5}`}
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="0.8"
                    />
                  </g>
                )}

                {/* Drag Double Grace Notes */}
                {isDrag && (
                  <g className="opacity-90">
                    <ellipse cx={x - 11} cy={y + 1} rx="2" ry="1.5" transform={`rotate(-20 ${x - 11} ${y + 1})`} fill="#38BDF8" />
                    <line x1={x - 9.2} y1={y + 1} x2={x - 9.2} y2={y - 7.5} stroke="#38BDF8" strokeWidth="0.9" />
                    <ellipse cx={x - 6.5} cy={y + 1} rx="2" ry="1.5" transform={`rotate(-20 ${x - 6.5} ${y + 1})`} fill="#38BDF8" />
                    <line x1={x - 4.8} y1={y + 1} x2={x - 4.8} y2={y - 7.5} stroke="#38BDF8" strokeWidth="0.9" />
                    <line x1={x - 11} y1={y - 5} x2={x - 4} y2={y - 3.2} stroke="#38BDF8" strokeWidth="1" />
                  </g>
                )}

                {/* Upward Stem to Beam Line */}
                <line
                  x1={x + 3.2}
                  y1={y}
                  x2={x + 3.2}
                  y2={beamY}
                  stroke="#38BDF8"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />

                {/* Notehead */}
                {isX ? (
                  <g>
                    {isOpenX && <circle cx={x} cy={y} r="4.2" fill="none" stroke="#38BDF8" strokeWidth="1.1" />}
                    <line x1={x - 3} y1={y - 3} x2={x + 3} y2={y + 3} stroke="#38BDF8" strokeWidth="1.6" />
                    <line x1={x - 3} y1={y + 3} x2={x + 3} y2={y - 3} stroke="#38BDF8" strokeWidth="1.6" />
                  </g>
                ) : (
                  <g opacity={isGhost ? 0.6 : 1}>
                    <ellipse
                      cx={x}
                      cy={y}
                      rx={isGhost ? 3.3 : 3.8}
                      ry={isGhost ? 2.3 : 2.7}
                      transform={`rotate(-20 ${x} ${y})`}
                      fill={isAccent ? '#38BDF8' : '#38BDF8'}
                    />
                    {/* Ghost Note Parentheses */}
                    {isGhost && (
                      <>
                        <text x={x - 5.5} y={y + 3.2} fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">
                          (
                        </text>
                        <text x={x + 5.5} y={y + 3.2} fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">
                          )
                        </text>
                      </>
                    )}
                  </g>
                )}

                {/* Accent Sign '>' above */}
                {isAccent && (
                  <path
                    d={`M ${x - 3.5} ${beamY - 4.5} L ${x + 3} ${beamY - 2.8} L ${x - 3.5} ${beamY - 1}`}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Sticking Letter Underneath */}
                <text
                  x={x}
                  y="57"
                  fill={stickingColor}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                >
                  {isGhost ? `(${step.sticking})` : step.sticking}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // --- Case 2: Groove Pattern Rendering (Polyphonic Multi-Voice) ---
  if (groove) {
    const firstMeasure = groove.measures?.[0];
    const beats = firstMeasure?.beats || [];
    const timeSig = groove.timeSignature || '4/4';

    // Flatten time slices into sequential steps
    const stepSlices: {
      timeIndex: number;
      hits: GrooveHit[];
    }[] = [];

    beats.forEach((b) => {
      (b.subdivisions || []).forEach((hits) => {
        stepSlices.push({
          timeIndex: stepSlices.length,
          hits: hits || [],
        });
      });
    });

    const totalSteps = Math.max(1, stepSlices.length);
    const staffStartX = 10;
    const staffEndX = width - 10;
    const notesStartX = 42; // Leave room for Clef & Time Signature
    const notesEndX = width - 16;
    const availableWidth = notesEndX - notesStartX;
    const stepWidth = availableWidth / totalSteps;

    const topBeamY = 6;
    const bottomBeamY = 48;

    return (
      <div
        className={`bg-slate-900/60 dark:bg-black/40 rounded-lg border border-white/5 py-1 px-2 flex justify-center items-center overflow-hidden select-none ${className}`}
        style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 5-Line Percussion Staff */}
          {[16, 22, 28, 34, 40].map((lineY) => (
            <line
              key={`staff-${lineY}`}
              x1={staffStartX}
              y1={lineY}
              x2={staffEndX}
              y2={lineY}
              stroke="#334155"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          ))}

          {/* Left Barline and Percussion Clef */}
          <line x1={staffStartX} y1="16" x2={staffStartX} y2="40" stroke="#475569" strokeWidth="1.5" />
          <rect x="13" y="20" width="2.5" height="16" rx="0.5" fill="#64748B" />
          <rect x="17" y="20" width="2.5" height="16" rx="0.5" fill="#64748B" />

          {/* Time Signature Fraction */}
          {timeSig && (
            <g transform="translate(26, 0)">
              <text
                x="0"
                y="26"
                fill="#94A3B8"
                fontSize="11"
                fontWeight="bold"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                {timeSig.split('/')[0] || '4'}
              </text>
              <text
                x="0"
                y="38"
                fill="#94A3B8"
                fontSize="11"
                fontWeight="bold"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
              >
                {timeSig.split('/')[1] || '4'}
              </text>
            </g>
          )}

          {/* Right End Barline */}
          <line x1={staffEndX - 3} y1="16" x2={staffEndX - 3} y2="40" stroke="#475569" strokeWidth="1" />
          <line x1={staffEndX} y1="16" x2={staffEndX} y2="40" stroke="#475569" strokeWidth="2" />

          {/* Continuous Top Horizontal Beam for Cymbal / Hi-Hat voice */}
          <line
            x1={notesStartX + 0.5 * stepWidth}
            y1={topBeamY}
            x2={notesStartX + (totalSteps - 0.5) * stepWidth}
            y2={topBeamY}
            stroke="#38BDF8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Render Each Step Slice with Polyphonic Voices */}
          {stepSlices.map(({ timeIndex, hits }) => {
            const x = notesStartX + (timeIndex + 0.5) * stepWidth;

            const cymbalsHit = hits.find((h) =>
              ['hihat', 'hihatClosed', 'hihatOpen', 'ride', 'crash', 'china', 'cowbell'].includes(h.instrument)
            );
            const snareHit = hits.find((h) => ['snare', 'tom1', 'tom2', 'floorTom'].includes(h.instrument));
            const kickHit = hits.find((h) => ['kick', 'hihatFoot'].includes(h.instrument));

            // Downbeat pulse marker on first step of each beat
            const stepsPerBeat = Math.max(1, Math.round(totalSteps / (parseInt(timeSig.split('/')[0], 10) || 4)));
            const isDownbeat = timeIndex % stepsPerBeat === 0;
            const beatNumber = Math.floor(timeIndex / stepsPerBeat) + 1;

            return (
              <g key={`groove-step-${timeIndex}`}>
                {/* 1. Cymbal / Hi-Hat Voice (Top, Line 0/G5, y = 14) */}
                {cymbalsHit && (
                  <g>
                    {/* Stem up to top beam */}
                    <line x1={x + 3.2} y1="14" x2={x + 3.2} y2={topBeamY} stroke="#38BDF8" strokeWidth="1.2" />
                    {cymbalsHit.instrument === 'hihatOpen' || cymbalsHit.instrument === 'crash' ? (
                      <>
                        <circle cx={x} cy="14" r="4.2" fill="none" stroke="#38BDF8" strokeWidth="1" />
                        <line x1={x - 3} y1="11" x2={x + 3} y2="17" stroke="#38BDF8" strokeWidth="1.5" />
                        <line x1={x - 3} y1="17" x2={x + 3} y2="11" stroke="#38BDF8" strokeWidth="1.5" />
                      </>
                    ) : (
                      <>
                        <line x1={x - 3} y1="11" x2={x + 3} y2="17" stroke="#38BDF8" strokeWidth="1.5" />
                        <line x1={x - 3} y1="17" x2={x + 3} y2="11" stroke="#38BDF8" strokeWidth="1.5" />
                      </>
                    )}
                    {cymbalsHit.accent && (
                      <path
                        d={`M ${x - 3} 1 L ${x + 3} 2.5 L ${x - 3} 4`}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="1.4"
                      />
                    )}
                  </g>
                )}

                {/* 2. Snare / Mid Voice (Line 3/C5, y = 28) */}
                {snareHit && (
                  <g opacity={snareHit.ghost ? 0.6 : 1}>
                    {/* Stem pointing up */}
                    <line x1={x + 3.2} y1="28" x2={x + 3.2} y2={topBeamY + 3} stroke="#38BDF8" strokeWidth="1.2" />
                    <ellipse
                      cx={x}
                      cy="28"
                      rx={snareHit.ghost ? 3.2 : 3.8}
                      ry={snareHit.ghost ? 2.2 : 2.7}
                      transform={`rotate(-20 ${x} 28)`}
                      fill={snareHit.accent ? '#F59E0B' : '#38BDF8'}
                    />
                    {snareHit.ghost && (
                      <>
                        <text x={x - 5.5} y="31" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">(</text>
                        <text x={x + 5.5} y="31" fill="#94A3B8" fontSize="9" fontWeight="bold" textAnchor="middle">)</text>
                      </>
                    )}
                    {snareHit.accent && (
                      <path
                        d={`M ${x - 3} 21 L ${x + 3} 22.5 L ${x - 3} 24`}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                )}

                {/* 3. Kick / Bass Drum Voice (Line 1/F4, y = 40, Stem DOWN) */}
                {kickHit && (
                  <g>
                    <ellipse
                      cx={x}
                      cy="40"
                      rx="3.8"
                      ry="2.7"
                      transform={`rotate(-20 ${x} 40)`}
                      fill="#38BDF8"
                    />
                    {/* Stem down */}
                    <line x1={x - 3.2} y1="40" x2={x - 3.2} y2={bottomBeamY} stroke="#38BDF8" strokeWidth="1.2" />
                    {kickHit.accent && (
                      <path
                        d={`M ${x - 3} 44 L ${x + 3} 45.5 L ${x - 3} 47`}
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>
                )}

                {/* Downbeat Metric Reference Indicator (1, 2, 3, 4...) */}
                <text
                  x={x}
                  y="59"
                  fill={isDownbeat ? '#38BDF8' : '#475569'}
                  fontSize={isDownbeat ? '9.5' : '7.5'}
                  fontWeight={isDownbeat ? 'bold' : 'normal'}
                  fontFamily="ui-monospace, monospace"
                  textAnchor="middle"
                >
                  {isDownbeat ? `${beatNumber}` : '·'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // --- Fallback: Empty Clean Percussion Staff ---
  return (
    <div
      className={`bg-slate-900/60 dark:bg-black/40 rounded-lg border border-white/5 py-1 px-2 flex justify-center items-center overflow-hidden select-none ${className}`}
      style={{ width: '100%', maxWidth: `${width}px`, height: `${height}px` }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {[16, 22, 28, 34, 40].map((lineY) => (
          <line key={`staff-${lineY}`} x1="10" y1={lineY} x2={width - 10} y2={lineY} stroke="#334155" strokeWidth="1.1" />
        ))}
        <rect x="14" y="20" width="2.5" height="16" rx="0.5" fill="#64748B" />
        <rect x="18" y="20" width="2.5" height="16" rx="0.5" fill="#64748B" />
      </svg>
    </div>
  );
}

// React.memo optimization to avoid re-renders across 40+ cards during filtering or searching
export const MiniScorePreview = React.memo(MiniScorePreviewComponent);
export default MiniScorePreview;
