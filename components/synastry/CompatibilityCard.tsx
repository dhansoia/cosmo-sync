'use client';

import { motion } from 'framer-motion';
import { ScoreRing } from './ScoreRing';
import type { SynastryReport } from '@/lib/synastry/engine';

interface CompatibilityCardProps {
  report:      SynastryReport;
  partnerName: string;
}

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};

const OVERALL_LABEL = (s: number) =>
  s >= 80 ? 'Exceptional' :
  s >= 65 ? 'Strong' :
  s >= 50 ? 'Good' :
  s >= 35 ? 'Moderate' : 'Challenging';

const GUNA_LABEL = (s: number) =>
  s >= 28 ? 'Excellent' :
  s >= 18 ? 'Good' :
  s >= 12 ? 'Average' : 'Challenging';

export function CompatibilityCard({ report, partnerName }: CompatibilityCardProps) {
  const { overallScore, chemistryScore, stabilityScore, communicationScore, gunaScore, guna, aspects } = report;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-white/30 text-xs uppercase tracking-widest">Compatibility</p>
            <h2 className="text-white text-xl font-semibold">
              You &amp; {partnerName || 'Partner'}
            </h2>
            <p className="text-white/50 text-sm italic">{report.summary}</p>
          </div>

          {/* Overall score */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center
                            rounded-full border-2 border-white/20">
              <span className="text-2xl font-bold text-white">{overallScore}</span>
            </div>
            <p className="text-white/30 text-xs mt-1">{OVERALL_LABEL(overallScore)}</p>
          </div>
        </div>

        {/* Three dimension rings */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <ScoreRing score={chemistryScore}     label="Chemistry"     size={88} />
          <ScoreRing score={stabilityScore}     label="Stability"     size={88} />
          <ScoreRing score={communicationScore} label="Communication" size={88} />
        </div>
      </div>

      {/* ── Vedic Guna Milan ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/30 text-xs uppercase tracking-widest">Vedic · Guna Milan</p>
            <p className="text-white font-semibold mt-0.5">
              {gunaScore}
              <span className="text-white/30 font-normal text-sm"> / 36</span>
              <span className="ml-2 text-sm text-white/50">— {GUNA_LABEL(gunaScore)}</span>
            </p>
          </div>
          <div className="text-right text-xs text-white/35 space-y-0.5">
            <p>☽ {guna.nakshatraA}</p>
            <p>☽ {guna.nakshatraB}</p>
          </div>
        </div>

        <p className="text-white/45 text-xs italic">{guna.interpretation}</p>

        {/* Koota grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1">
          {guna.kootas.map((k) => {
            const pct = k.score / k.maxScore;
            const isDosha = k.score === 0 && k.maxScore >= 7;
            return (
              <div key={k.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${isDosha ? 'text-red-400/80' : 'text-white/60'}`}>
                    {k.name}
                  </span>
                  <span className={`tabular-nums ${isDosha ? 'text-red-400/70' : 'text-white/40'}`}>
                    {k.score}/{k.maxScore}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isDosha ? 'bg-red-400/60' :
                      pct >= 0.75 ? 'bg-emerald-400/70' :
                      pct >= 0.4  ? 'bg-amber-400/60' : 'bg-orange-400/50'
                    }`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <p className="text-white/20 text-[10px] leading-tight">{k.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Western Aspects ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
        <p className="text-white/30 text-xs uppercase tracking-widest">Western · Major Aspects</p>

        {aspects.length === 0 ? (
          <p className="text-white/30 text-sm">No major aspects found between these charts.</p>
        ) : (
          <ul className="space-y-3">
            {aspects.slice(0, 8).map((asp, i) => {
              const dim = asp.primaryDimension;
              const dimColor =
                dim === 'chemistry'     ? 'text-rose-400'    :
                dim === 'stability'     ? 'text-emerald-400' : 'text-sky-400';
              const dimLabel =
                dim === 'chemistry'     ? 'Chemistry' :
                dim === 'stability'     ? 'Stability' : 'Communication';

              return (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-base text-white/50 w-5 text-center shrink-0">
                    {asp.symbol}
                  </span>
                  <span className="text-white/75 flex-1">
                    {PLANET_NAMES[asp.planetA]} {asp.type} {PLANET_NAMES[asp.planetB]}
                  </span>
                  <span className="text-white/25 text-xs tabular-nums shrink-0">
                    {asp.orb}°
                  </span>
                  <span className={`text-xs shrink-0 ${dimColor}`}>
                    {dimLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 border-t border-white/8 text-xs text-white/25">
          <span>☌ Conjunction</span>
          <span>△ Trine</span>
          <span>⚹ Sextile</span>
          <span>□ Square</span>
          <span>☍ Opposition</span>
        </div>
      </div>

    </motion.div>
  );
}
