'use client';

import { useState } from 'react';
import type { KundliData } from './KundliDashboard';

type Doshas = KundliData['doshas'];

export function DoshaCards({ doshas }: { doshas: Doshas }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <DoshaCard
        symbol="♂"
        name="Mangal Dosha"
        present={doshas.mangalDosha.present}
        detail={doshas.mangalDosha.present ? `Mars — House ${doshas.mangalDosha.marsHouse}` : 'Mars clear'}
        description={doshas.mangalDosha.description}
      />
      <DoshaCard
        symbol="🐍"
        name="Kaal Sarp"
        present={doshas.kaalSarpDosha.present}
        detail={
          doshas.kaalSarpDosha.present
            ? `${doshas.kaalSarpDosha.trappedPlanets.length} planets enclosed`
            : 'Axis clear'
        }
        description={doshas.kaalSarpDosha.description}
      />
      <DoshaCard
        symbol="♄"
        name="Sade Sati"
        present={doshas.sadeSati.present}
        detail={
          doshas.sadeSati.present && doshas.sadeSati.phase
            ? `${doshas.sadeSati.phase} phase`
            : 'Saturn clear'
        }
        description={doshas.sadeSati.description}
      />
    </div>
  );
}

function DoshaCard({
  symbol, name, present, detail, description,
}: {
  symbol:      string;
  name:        string;
  present:     boolean;
  detail:      string;
  description: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const ring = present
    ? 'border-red-500/30 bg-red-500/5'
    : 'border-white/10 bg-white/3';

  const statusDot = present
    ? 'bg-red-500 shadow-red-500/50 shadow-sm'
    : 'bg-emerald-500 shadow-emerald-500/50 shadow-sm';

  const statusText = present ? 'text-red-400' : 'text-emerald-400';
  const detailText = present ? 'text-red-300/70' : 'text-white/30';

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-colors ${ring}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-white/50 text-xs">{symbol} {name}</p>
          <p className={`text-xs font-medium ${detailText}`}>{detail}</p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
          <span className={`text-xs font-semibold ${statusText}`}>
            {present ? 'Present' : 'Clear'}
          </span>
        </div>
      </div>

      {/* Description — collapsed by default */}
      <div>
        <p className={`text-white/40 text-xs leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {description}
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-white/25 text-xs hover:text-white/50 transition-colors"
        >
          {expanded ? 'Show less ↑' : 'Read more ↓'}
        </button>
      </div>
    </div>
  );
}
