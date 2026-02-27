'use client';

import type { Remedy } from './KundliDashboard';

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  Mantra: { bg: 'bg-indigo-400/10 border-indigo-400/20', text: 'text-indigo-300',  label: 'Mantra' },
  Ratna:  { bg: 'bg-amber-400/10  border-amber-400/20',  text: 'text-amber-300',   label: 'Ratna'  },
  Daan:   { bg: 'bg-emerald-400/10 border-emerald-400/20', text: 'text-emerald-300', label: 'Daan' },
  Vrata:  { bg: 'bg-rose-400/10   border-rose-400/20',   text: 'text-rose-300',    label: 'Vrata'  },
};

const PLANET_ICONS: Record<string, string> = {
  Sun:     '☀',
  Moon:    '☽',
  Mars:    '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus:   '♀',
  Saturn:  '♄',
  Rahu:    '☊',
  Ketu:    '☋',
};

type Props = {
  remedies: Remedy[];
  onToggle: (id: string) => void;
};

export function RemedyTracker({ remedies, onToggle }: Props) {
  if (remedies.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/3 p-8 text-center">
        <p className="text-white/25 text-sm">No remedies prescribed for this chart.</p>
      </div>
    );
  }

  // Group by planet, preserving order of first appearance
  const groups = new Map<string, Remedy[]>();
  for (const r of remedies) {
    if (!groups.has(r.planet)) groups.set(r.planet, []);
    groups.get(r.planet)!.push(r);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([planet, items]) => {
        const done  = items.filter((r) => r.isCompleted).length;
        const total = items.length;
        const pct   = Math.round((done / total) * 100);
        const icon  = PLANET_ICONS[planet] ?? '◎';

        return (
          <div
            key={planet}
            className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden"
          >
            {/* Planet header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-base" aria-hidden>{icon}</span>
                <span className="text-white/70 text-sm font-medium">{planet}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Progress bar */}
                <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400/60 transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-white/25 text-xs tabular-nums">{done}/{total}</span>
              </div>
            </div>

            {/* Remedy rows */}
            <div className="divide-y divide-white/5">
              {items.map((remedy) => (
                <RemedyRow key={remedy.id} remedy={remedy} onToggle={onToggle} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RemedyRow({ remedy, onToggle }: { remedy: Remedy; onToggle: (id: string) => void }) {
  const style = CATEGORY_STYLES[remedy.type] ?? CATEGORY_STYLES['Mantra'];

  // Split "Item — Detail" format written by the API route
  const sepIdx = remedy.description.indexOf(' — ');
  const item   = sepIdx > -1 ? remedy.description.slice(0, sepIdx) : remedy.description;
  const detail = sepIdx > -1 ? remedy.description.slice(sepIdx + 3) : '';

  return (
    <button
      onClick={() => onToggle(remedy.id)}
      className={`
        w-full flex items-start gap-3 px-4 py-3 text-left
        hover:bg-white/3 active:bg-white/5 transition-colors
        ${remedy.isCompleted ? 'opacity-50' : ''}
      `}
    >
      {/* Checkbox */}
      <div
        className={`
          mt-0.5 flex-shrink-0 w-4 h-4 rounded border transition-colors
          ${remedy.isCompleted
            ? 'bg-emerald-500/80 border-emerald-500'
            : 'border-white/20 bg-transparent'
          }
        `}
        aria-hidden
      >
        {remedy.isCompleted && (
          <svg viewBox="0 0 12 12" fill="none" className="w-full h-full p-0.5">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category badge */}
          <span className={`inline-flex px-1.5 py-0.5 rounded border text-xs ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          {/* Item name */}
          <span className={`text-xs font-medium ${remedy.isCompleted ? 'line-through text-white/30' : 'text-white/75'}`}>
            {item}
          </span>
        </div>
        {detail && (
          <p className="text-white/30 text-xs leading-relaxed line-clamp-2">{detail}</p>
        )}
      </div>
    </button>
  );
}
