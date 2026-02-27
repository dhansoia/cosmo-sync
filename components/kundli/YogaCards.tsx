'use client';

import type { KundliData } from './KundliDashboard';

type Yogas = KundliData['yogas'];
type YogaEntry = { present: boolean; name: string; description: string };

export function YogaCards({ yogas }: { yogas: Yogas }) {
  const all: YogaEntry[] = [
    yogas.gajakesariYoga,
    yogas.budhadityaYoga,
    ...yogas.rajYogas,
  ];

  const present = all.filter((y) => y.present);
  const absent  = all.filter((y) => !y.present);

  return (
    <div className="space-y-3">
      {/* Active yogas */}
      {present.length > 0 && (
        <div className="space-y-2">
          {present.map((yoga) => (
            <YogaCard key={yoga.name} yoga={yoga} active />
          ))}
        </div>
      )}

      {/* Absent yogas — shown collapsed */}
      {absent.length > 0 && (
        <div className="space-y-2">
          <p className="text-white/20 text-xs uppercase tracking-widest px-1">Not present</p>
          {absent.map((yoga) => (
            <YogaCard key={yoga.name} yoga={yoga} active={false} />
          ))}
        </div>
      )}

      {all.length === 0 && (
        <p className="text-white/25 text-sm text-center py-4">No yogas detected in this chart.</p>
      )}
    </div>
  );
}

function YogaCard({ yoga, active }: { yoga: YogaEntry; active: boolean }) {
  if (active) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-xs">✦</span>
          <h3 className="text-amber-300 text-sm font-semibold">{yoga.name}</h3>
          <span className="ml-auto text-amber-400/60 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-400/20 bg-amber-400/10">
            Active
          </span>
        </div>
        <p className="text-white/50 text-xs leading-relaxed">{yoga.description}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="text-white/15 text-xs">◇</span>
        <span className="text-white/30 text-xs">{yoga.name}</span>
      </div>
      <span className="text-white/15 text-xs">Absent</span>
    </div>
  );
}
