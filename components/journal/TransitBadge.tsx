'use client';

import type { TransitReport } from '@/lib/transits';

interface TransitBadgeProps {
  report: TransitReport;
}

const ORDINAL = [
  '', '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

const PLANET_NAMES: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus',
  mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};

export function TransitBadge({ report }: TransitBadgeProps) {
  const { transitMoon, moonPhase, aspects } = report;
  const houseLabel = ORDINAL[transitMoon.house] ?? `${transitMoon.house}th`;
  const topAspect  = aspects[0];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">

      {/* Moon phase + sign */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-white/40 text-xs uppercase tracking-widest">Today&apos;s Moon</p>
          <p className="text-white text-lg font-semibold">
            {moonPhase.emoji} {transitMoon.sign}
          </p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-white/40 text-xs uppercase tracking-widest">House</p>
          <p className="text-white text-lg font-semibold">{houseLabel}</p>
        </div>
      </div>

      {/* Phase pill */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-white/60 text-xs">
          {moonPhase.name}
        </span>
        {transitMoon.isRetrograde && (
          <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs">
            ℞ Retrograde
          </span>
        )}
        <span className="px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-white/60 text-xs">
          {transitMoon.signDegree}°{transitMoon.signMinutes}&apos;
        </span>
      </div>

      {/* Active aspects */}
      {aspects.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-white/8">
          <p className="text-white/30 text-xs uppercase tracking-widest">Active Aspects</p>
          <ul className="space-y-1.5">
            {aspects.slice(0, 3).map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-white/50 font-mono w-4 text-center">{a.symbol}</span>
                <span className="text-white/70">
                  Moon {a.type} natal {PLANET_NAMES[a.natalPlanet] ?? a.natalPlanet}
                </span>
                <span className="ml-auto text-white/30 text-xs">{a.orb}°</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No aspects message */}
      {aspects.length === 0 && (
        <p className="text-white/25 text-sm pt-1 border-t border-white/8">
          No major exact aspects today — a calm, flowing day.
        </p>
      )}

      {/* Highlight for closest aspect */}
      {topAspect && (
        <p className="text-white/40 text-xs italic leading-relaxed">
          {topAspect.type === 'Conjunction' && `The Moon merges with your natal ${PLANET_NAMES[topAspect.natalPlanet]} energy today.`}
          {topAspect.type === 'Opposition' && `The Moon opposes your natal ${PLANET_NAMES[topAspect.natalPlanet]} — a moment for balance.`}
          {topAspect.type === 'Square' && `The Moon squares your natal ${PLANET_NAMES[topAspect.natalPlanet]} — some tension to work with.`}
          {topAspect.type === 'Trine' && `The Moon trines your natal ${PLANET_NAMES[topAspect.natalPlanet]} — harmonious flow available.`}
          {topAspect.type === 'Sextile' && `The Moon sextiles your natal ${PLANET_NAMES[topAspect.natalPlanet]} — opportunity and ease.`}
        </p>
      )}
    </div>
  );
}
