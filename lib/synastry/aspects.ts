/**
 * lib/synastry/aspects.ts — Western Synastry Aspect Engine
 *
 * Compares all 10 planets of Person A against all 10 planets of Person B,
 * finds major aspect hits (Conjunction, Sextile, Square, Trine, Opposition),
 * and scores each hit across three emotional dimensions:
 *
 *   Chemistry     — Venus/Mars/Moon cross-planet passion indicators
 *   Stability     — Moon/Saturn/Jupiter long-term foundation indicators
 *   Communication — Mercury/Sun intellectual and expressive indicators
 *
 * Scoring model:
 *   Each planet-pair has a base weight (0–10) per dimension.
 *   Harmonious aspects (Trine, Sextile) multiply by their harmony factor.
 *   Challenging aspects (Square, Opposition) flip stability negative but
 *   preserve chemistry (tension ≠ absence of attraction).
 *   Conjunction is treated as either — depends on planets.
 */

import type { PlanetId } from '@/lib/astro/types';

// ─── types ───────────────────────────────────────────────────────────────────

export type AspectType = 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition';

export interface SynastryAspect {
  planetA:      PlanetId;
  planetB:      PlanetId;
  type:         AspectType;
  symbol:       string;
  orb:          number;
  isHarmonious: boolean;
  /** The dimension this aspect contributes to most strongly */
  primaryDimension: 'chemistry' | 'stability' | 'communication';
  /** Contribution to each dimension (-10 to +10 raw) */
  contribution: { chemistry: number; stability: number; communication: number };
}

interface RawScores {
  chemistry:     number;
  stability:     number;
  communication: number;
}

// ─── aspect table ─────────────────────────────────────────────────────────────

const ASPECTS: { type: AspectType; angle: number; orb: number; symbol: string; harmonious: boolean }[] = [
  { type: 'Conjunction', angle:   0, orb: 8, symbol: '☌', harmonious: true  },
  { type: 'Sextile',     angle:  60, orb: 6, symbol: '⚹', harmonious: true  },
  { type: 'Square',      angle:  90, orb: 8, symbol: '□', harmonious: false },
  { type: 'Trine',       angle: 120, orb: 8, symbol: '△', harmonious: true  },
  { type: 'Opposition',  angle: 180, orb: 8, symbol: '☍', harmonious: false },
];

// ─── planet-pair base weights ──────────────────────────────────────────────────
// Key: smaller planet id + '-' + larger planet id (sorted alphabetically)
// Each number is 0–10: how much this pair contributes to each dimension

interface PairWeight { chemistry: number; stability: number; communication: number }

function makePairKey(a: PlanetId, b: PlanetId): string {
  return [a, b].sort().join('-');
}

const PAIR_WEIGHTS: Record<string, PairWeight> = {
  'mars-venus':     { chemistry: 10, stability: 1,  communication: 0  },
  'moon-venus':     { chemistry: 7,  stability: 4,  communication: 2  },
  'moon-sun':       { chemistry: 6,  stability: 5,  communication: 4  },
  'mars-sun':       { chemistry: 5,  stability: 2,  communication: 2  },
  'mars-moon':      { chemistry: 6,  stability: 2,  communication: 1  },
  'sun-venus':      { chemistry: 6,  stability: 3,  communication: 3  },
  'venus-venus':    { chemistry: 7,  stability: 5,  communication: 3  },
  'moon-moon':      { chemistry: 4,  stability: 9,  communication: 5  },
  'jupiter-moon':   { chemistry: 3,  stability: 8,  communication: 3  },
  'moon-saturn':    { chemistry: 1,  stability: 8,  communication: 1  },
  'saturn-sun':     { chemistry: 0,  stability: 7,  communication: 2  },
  'jupiter-venus':  { chemistry: 5,  stability: 6,  communication: 3  },
  'jupiter-sun':    { chemistry: 3,  stability: 6,  communication: 4  },
  'moon-mercury':   { chemistry: 1,  stability: 4,  communication: 8  },
  'mercury-sun':    { chemistry: 2,  stability: 3,  communication: 9  },
  'mercury-mercury':{ chemistry: 0,  stability: 2,  communication: 10 },
  'mercury-venus':  { chemistry: 3,  stability: 2,  communication: 6  },
  'jupiter-mercury':{ chemistry: 1,  stability: 3,  communication: 7  },
  'mercury-saturn': { chemistry: 0,  stability: 4,  communication: 5  },
  'sun-sun':        { chemistry: 3,  stability: 5,  communication: 6  },
  'mars-mercury':   { chemistry: 2,  stability: 1,  communication: 5  },
  'mars-mars':      { chemistry: 4,  stability: 1,  communication: 1  },
  'saturn-venus':   { chemistry: 2,  stability: 7,  communication: 1  },
};

const DEFAULT_PAIR_WEIGHT: PairWeight = { chemistry: 1, stability: 1, communication: 1 };

// Dimension-specific aspect harmony multipliers
const HARMONY_FACTOR: Record<AspectType, PairWeight> = {
  Trine:       { chemistry: 1.0,   stability: 1.0,  communication: 1.0 },
  Sextile:     { chemistry: 0.7,   stability: 0.75, communication: 0.8 },
  Conjunction: { chemistry: 0.85,  stability: 0.65, communication: 0.75 },
  Square:      { chemistry: 0.55,  stability: -0.4, communication: 0.35 },
  Opposition:  { chemistry: 0.65,  stability: -0.3, communication: 0.4  },
};

// Orb weight: tighter aspect = stronger (linear 0.5→1.0)
function orbWeight(orb: number, maxOrb: number): number {
  return 0.5 + 0.5 * (1 - orb / maxOrb);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shortestArc(a: number, b: number): number {
  let arc = Math.abs(norm360(a) - norm360(b));
  if (arc > 180) arc = 360 - arc;
  return arc;
}

function findAspect(lonA: number, lonB: number): { type: AspectType; symbol: string; orb: number; harmonious: boolean } | null {
  const arc = shortestArc(lonA, lonB);
  for (const asp of ASPECTS) {
    const orb = Math.abs(arc - asp.angle);
    if (orb <= asp.orb) {
      return { type: asp.type, symbol: asp.symbol, orb: parseFloat(orb.toFixed(2)), harmonious: asp.harmonious };
    }
  }
  return null;
}

// ─── main export ─────────────────────────────────────────────────────────────

const PLANETS_SYNASTRY: PlanetId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn',
];

/**
 * Calculate all synastry aspects between two sets of planetary positions.
 * Returns the aspect list and raw dimension scores (un-normalised).
 */
export function calculateWesternSynastry(
  positionsA: Partial<Record<PlanetId, number>>, // longitude 0-360°
  positionsB: Partial<Record<PlanetId, number>>,
): { aspects: SynastryAspect[]; rawScores: RawScores } {
  const aspects: SynastryAspect[] = [];
  let chem = 0, stab = 0, comm = 0;

  for (const pA of PLANETS_SYNASTRY) {
    const lonA = positionsA[pA];
    if (lonA === undefined) continue;

    for (const pB of PLANETS_SYNASTRY) {
      const lonB = positionsB[pB];
      if (lonB === undefined) continue;

      const hit = findAspect(lonA, lonB);
      if (!hit) continue;

      const pairKey = makePairKey(pA, pB);
      const weight  = PAIR_WEIGHTS[pairKey] ?? DEFAULT_PAIR_WEIGHT;
      const factors = HARMONY_FACTOR[hit.type];
      const orbW    = orbWeight(hit.orb, ASPECTS.find(a => a.type === hit.type)!.orb);

      const contrib = {
        chemistry:     weight.chemistry     * factors.chemistry     * orbW,
        stability:     weight.stability     * factors.stability     * orbW,
        communication: weight.communication * factors.communication * orbW,
      };

      chem += contrib.chemistry;
      stab += contrib.stability;
      comm += contrib.communication;

      // Determine primary dimension
      const maxDim = (Math.max(Math.abs(contrib.chemistry), Math.abs(contrib.stability), Math.abs(contrib.communication)));
      const primaryDimension: 'chemistry' | 'stability' | 'communication' =
        Math.abs(contrib.chemistry) === maxDim ? 'chemistry' :
        Math.abs(contrib.stability) === maxDim ? 'stability' : 'communication';

      aspects.push({
        planetA: pA,
        planetB: pB,
        type:    hit.type,
        symbol:  hit.symbol,
        orb:     hit.orb,
        isHarmonious: hit.harmonious,
        primaryDimension,
        contribution: {
          chemistry:     parseFloat(contrib.chemistry.toFixed(2)),
          stability:     parseFloat(contrib.stability.toFixed(2)),
          communication: parseFloat(contrib.communication.toFixed(2)),
        },
      });
    }
  }

  // Sort: strongest chemistry/stability/communication first
  aspects.sort((a, b) => {
    const magA = Math.abs(a.contribution.chemistry) + Math.abs(a.contribution.stability) + Math.abs(a.contribution.communication);
    const magB = Math.abs(b.contribution.chemistry) + Math.abs(b.contribution.stability) + Math.abs(b.contribution.communication);
    return magB - magA;
  });

  return {
    aspects: aspects.slice(0, 15), // cap at 15 most significant
    rawScores: { chemistry: chem, stability: stab, communication: comm },
  };
}

/**
 * Normalise raw western dimension scores to 0-100.
 * The theoretical maximum is approximately 50 for each dimension
 * (assumes ~5 significant aspects at max weight).
 */
export function normaliseWesternScores(raw: RawScores): RawScores {
  const MAX = 55; // empirical ceiling
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round((v / MAX) * 100)));
  return {
    chemistry:     clamp(raw.chemistry),
    stability:     clamp(Math.max(0, raw.stability)), // stability can go negative; floor at 0
    communication: clamp(raw.communication),
  };
}
