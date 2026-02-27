'use client';

import type { Specialty } from '@prisma/client';

const ALL_SPECIALTIES: Specialty[] = [
  'CAREER', 'RELATIONSHIP', 'VEDIC', 'WESTERN',
  'NATAL_CHART', 'SYNASTRY', 'FORECASTING', 'SPIRITUAL',
];

const SPECIALTY_LABELS: Record<Specialty, string> = {
  CAREER: 'Career',
  RELATIONSHIP: 'Relationship',
  VEDIC: 'Vedic',
  WESTERN: 'Western',
  NATAL_CHART: 'Natal Chart',
  SYNASTRY: 'Synastry',
  FORECASTING: 'Forecasting',
  SPIRITUAL: 'Spiritual',
};

interface Props {
  selected: Specialty | null;
  onChange: (specialty: Specialty | null) => void;
}

export function SpecialtyFilter({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onChange(null)}
        className={`
          flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
          ${selected === null
            ? 'bg-white/15 border-white/30 text-white'
            : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}
        `}
      >
        All
      </button>
      {ALL_SPECIALTIES.map((s) => (
        <button
          key={s}
          onClick={() => onChange(selected === s ? null : s)}
          className={`
            flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors
            ${selected === s
              ? 'bg-white/15 border-white/30 text-white'
              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}
          `}
        >
          {SPECIALTY_LABELS[s]}
        </button>
      ))}
    </div>
  );
}
