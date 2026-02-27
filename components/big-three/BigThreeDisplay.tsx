'use client';

/**
 * BigThreeDisplay — Client Component
 *
 * Receives both Western and Vedic slices from the Server Component.
 * All data is already present on mount — the toggle switches between
 * the two in-memory datasets with zero latency.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type {
  AstroSystem,
  BigThreeDisplayProps,
  ElementType,
  SignPositionData,
} from './types';

// ─── constants ───────────────────────────────────────────────────────────────

/** Tailwind classes keyed by element — must use full strings so Tailwind
 *  includes them in the CSS bundle. */
const ELEMENT: Record<ElementType, { sign: string; border: string; glow: string }> = {
  fire:  { sign: 'text-orange-300',  border: 'border-orange-400/30',  glow: 'shadow-[0_0_24px_rgba(251,146,60,0.12)]'  },
  earth: { sign: 'text-emerald-300', border: 'border-emerald-400/30', glow: 'shadow-[0_0_24px_rgba(52,211,153,0.12)]'  },
  air:   { sign: 'text-sky-300',     border: 'border-sky-400/30',     glow: 'shadow-[0_0_24px_rgba(56,189,248,0.12)]'  },
  water: { sign: 'text-violet-300',  border: 'border-violet-400/30',  glow: 'shadow-[0_0_24px_rgba(167,139,250,0.12)]' },
};

const SYSTEM_META: Record<AstroSystem, {
  label: string;
  badge: string;
  zodiac: string;
  houses: string;
  accentFrom: string;
  accentTo: string;
  risingLabel: string;
}> = {
  WESTERN: {
    label:       'Western',
    badge:       '♈',
    zodiac:      'Tropical Zodiac',
    houses:      'Placidus Houses',
    accentFrom:  '#d97706', // amber-600
    accentTo:    '#b45309', // amber-700
    risingLabel: 'Rising',
  },
  VEDIC: {
    label:       'Vedic',
    badge:       'ॐ',
    zodiac:      'Sidereal Zodiac',
    houses:      'Whole Sign Houses',
    accentFrom:  '#7c3aed', // violet-700
    accentTo:    '#6d28d9', // violet-800
    risingLabel: 'Lagna',
  },
};

const PLANET_META = [
  { id: 'sun',    glyph: '☉', label: 'Sun'  },
  { id: 'moon',   glyph: '☽', label: 'Moon' },
  { id: 'rising', glyph: '↑', label: 'label' }, // label injected from SYSTEM_META
] as const;

// ─── sub-components ──────────────────────────────────────────────────────────

/** The animated pill toggle between Western and Vedic */
function SystemToggle({
  system,
  onToggle,
}: {
  system: AstroSystem;
  onToggle: (s: AstroSystem) => void;
}) {
  const systems: AstroSystem[] = ['WESTERN', 'VEDIC'];

  return (
    <div
      role="radiogroup"
      aria-label="Zodiac system"
      className="relative flex w-full max-w-xs mx-auto p-1 rounded-full bg-white/[0.05] border border-white/[0.09]"
    >
      {/* Sliding pill — animates with layout */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-full"
        style={{
          background: system === 'WESTERN'
            ? 'linear-gradient(135deg, rgba(217,119,6,0.35), rgba(180,83,9,0.25))'
            : 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(109,40,217,0.25))',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: system === 'WESTERN'
            ? 'rgba(217,119,6,0.45)'
            : 'rgba(124,58,237,0.45)',
        }}
        animate={{
          left:  system === 'WESTERN' ? '4px' : 'calc(50%)',
          width: 'calc(50% - 4px)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      />

      {systems.map((s) => {
        const meta    = SYSTEM_META[s];
        const active  = system === s;
        return (
          <button
            key={s}
            role="radio"
            aria-checked={active}
            onClick={() => onToggle(s)}
            className={[
              'relative z-10 flex-1 flex items-center justify-center gap-2',
              'py-2 px-4 rounded-full text-sm font-medium tracking-wide',
              'transition-colors duration-200 select-none',
              active ? 'text-white' : 'text-white/45 hover:text-white/70',
            ].join(' ')}
          >
            <span aria-hidden className="text-base leading-none">{meta.badge}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

/** One planet card with animated content */
function PlanetCard({
  glyph,
  label,
  data,
  animKey,
}: {
  glyph: string;
  label: string;
  data: SignPositionData;
  animKey: string;
}) {
  const el = ELEMENT[data.element];

  return (
    <div
      className={[
        'relative flex flex-col items-center gap-3 rounded-2xl p-6',
        'bg-white/[0.03] border backdrop-blur-sm',
        el.border, el.glow,
      ].join(' ')}
    >
      {/* Planet glyph */}
      <span
        aria-hidden
        className="text-3xl text-white/30 select-none leading-none"
      >
        {glyph}
      </span>

      {/* Planet label (Sun / Moon / Rising / Lagna) */}
      <span className="text-xs font-semibold tracking-[0.2em] text-white/35 uppercase">
        {label}
      </span>

      {/* Animated sign content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={animKey}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
          exit={{    opacity: 0, y: -8, filter: 'blur(4px)' }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center gap-1"
        >
          {/* Sign symbol */}
          <span
            aria-hidden
            className={`text-4xl leading-none select-none ${el.sign}`}
          >
            {data.symbol}
          </span>

          {/* Sign name */}
          <span className={`text-2xl font-bold tracking-tight ${el.sign}`}>
            {data.sign}
          </span>

          {/* Degree */}
          <span className="text-sm text-white/40 font-mono tabular-nums">
            {data.degree}°{String(data.minutes).padStart(2, '0')}′
            {data.isRetrograde && (
              <span className="ml-1 text-xs text-rose-400/80">℞</span>
            )}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Animated footnote describing the active system */
function SystemFooter({
  system,
  ayanamsa,
}: {
  system: AstroSystem;
  ayanamsa: number;
}) {
  const meta = SYSTEM_META[system];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={system}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{    opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="text-center text-xs text-white/30 tracking-wide"
      >
        {meta.zodiac}
        <span className="mx-2 opacity-50">·</span>
        {meta.houses}
        {system === 'VEDIC' && (
          <>
            <span className="mx-2 opacity-50">·</span>
            Lahiri {ayanamsa.toFixed(2)}°
          </>
        )}
      </motion.p>
    </AnimatePresence>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export function BigThreeDisplay({
  western,
  vedic,
  birthInfo,
}: BigThreeDisplayProps) {
  const [system, setSystem] = useState<AstroSystem>('WESTERN');

  const active = system === 'WESTERN' ? western : vedic;
  const meta   = SYSTEM_META[system];

  return (
    <section
      aria-label="Celestial Blueprint"
      className="w-full max-w-2xl mx-auto flex flex-col gap-8 px-4 py-10"
    >
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-white/90">
          Your Celestial Blueprint
        </h2>
        {birthInfo && (
          <p className="text-sm text-white/35">{birthInfo.label}</p>
        )}
      </div>

      {/* Toggle */}
      <SystemToggle system={system} onToggle={setSystem} />

      {/* Planet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANET_META.map(({ id, glyph, label }) => {
          const data      = active[id];
          const cardLabel = id === 'rising' ? meta.risingLabel : label;
          return (
            <PlanetCard
              key={id}
              glyph={glyph}
              label={cardLabel}
              data={data}
              animKey={`${system}-${id}`}
            />
          );
        })}
      </div>

      {/* Footer */}
      <SystemFooter system={system} ayanamsa={active.ayanamsaDegrees} />
    </section>
  );
}
