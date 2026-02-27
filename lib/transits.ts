/**
 * lib/transits.ts — Daily Transit Computation Engine
 *
 * Given a user's natal BirthData and the current moment, computes:
 *   • The current Moon's house position in the natal chart
 *   • Aspects between the transiting Moon and all natal planets
 *   • The current lunar phase
 *
 * All output types are fully serialisable (no Date objects) — safe to
 * pass across the Next.js Server → Client boundary as JSON props.
 */

import { AstroEngine } from '@/lib/astro';
import type { PlanetId, ZodiacSign } from '@/lib/astro/types';

// ─── exported types ───────────────────────────────────────────────────────────

export interface MoonPhaseInfo {
  name:  string;
  emoji: string;
  /** Moon − Sun elongation, 0–360° */
  angle: number;
}

export type AspectType = 'Conjunction' | 'Sextile' | 'Square' | 'Trine' | 'Opposition';

export interface TransitAspect {
  transitPlanet: PlanetId;
  natalPlanet:   PlanetId;
  type:          AspectType;
  symbol:        string;
  /** Degrees from exact */
  orb:           number;
  /** Whether the orb is narrowing (transit planet moving toward exact) */
  isApplying:    boolean;
}

export interface TransitMoonInfo {
  sign:        ZodiacSign;
  longitude:   number;
  signDegree:  number;
  signMinutes: number;
  /** House number 1–12 in the natal chart */
  house:       number;
  isRetrograde: boolean;
}

export interface PlanetSnap {
  sign:        ZodiacSign;
  longitude:   number;
  isRetrograde: boolean;
}

export interface TransitReport {
  computedAt:    string;  // ISO
  moonPhase:     MoonPhaseInfo;
  transitMoon:   TransitMoonInfo;
  /** Positions of current sky planets (Moon + inner planets) */
  skyPositions:  Partial<Record<PlanetId, PlanetSnap>>;
  /** User's natal planet positions */
  natalPositions: Partial<Record<PlanetId, { sign: ZodiacSign; longitude: number }>>;
  /** Transit Moon → natal planet aspects, sorted by orb asc */
  aspects:       TransitAspect[];
  /** Which house the natal Moon is in (for context) */
  natalMoonHouse: number;
}

// ─── aspect table ─────────────────────────────────────────────────────────────

const ASPECT_TABLE: { type: AspectType; angle: number; orb: number; symbol: string }[] = [
  { type: 'Conjunction', angle:   0, orb: 8, symbol: '☌' },
  { type: 'Sextile',     angle:  60, orb: 6, symbol: '⚹' },
  { type: 'Square',      angle:  90, orb: 8, symbol: '□' },
  { type: 'Trine',       angle: 120, orb: 8, symbol: '△' },
  { type: 'Opposition',  angle: 180, orb: 8, symbol: '☍' },
];

const PLANETS_FOR_ASPECTS: PlanetId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn',
];

const SKY_PLANETS: PlanetId[] = [
  'moon', 'sun', 'mercury', 'venus', 'mars',
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function getMoonPhase(sunLon: number, moonLon: number): MoonPhaseInfo {
  const angle = norm360(moonLon - sunLon);

  let name:  string;
  let emoji: string;

  if (angle < 22.5 || angle >= 337.5)       { name = 'New Moon';           emoji = '🌑'; }
  else if (angle < 67.5)                     { name = 'Waxing Crescent';    emoji = '🌒'; }
  else if (angle < 112.5)                    { name = 'First Quarter';      emoji = '🌓'; }
  else if (angle < 157.5)                    { name = 'Waxing Gibbous';     emoji = '🌔'; }
  else if (angle < 202.5)                    { name = 'Full Moon';          emoji = '🌕'; }
  else if (angle < 247.5)                    { name = 'Waning Gibbous';     emoji = '🌖'; }
  else if (angle < 292.5)                    { name = 'Last Quarter';       emoji = '🌗'; }
  else                                        { name = 'Waning Crescent';    emoji = '🌘'; }

  return { name, emoji, angle };
}

/**
 * Returns which house (1–12) a given ecliptic longitude falls in,
 * based on the provided array of 12 house cusp longitudes.
 */
function getPlanetHouse(longitude: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end   = cusps[(i + 1) % 12];

    if (start <= end) {
      if (longitude >= start && longitude < end) return i + 1;
    } else {
      // Wraps around 0° / 360°
      if (longitude >= start || longitude < end) return i + 1;
    }
  }
  // Fallback: check which cusp range the longitude is closest to
  return 1;
}

/**
 * Find all aspects between a transiting planet longitude and natal planet longitudes.
 * `speedLong` of the transit planet is used to determine applying vs separating.
 */
function findAspects(
  transitPlanet: PlanetId,
  transitLon:    number,
  transitSpeed:  number,
  natalPositions: Partial<Record<PlanetId, { sign: ZodiacSign; longitude: number }>>,
): TransitAspect[] {
  const found: TransitAspect[] = [];

  for (const [natalId, natal] of Object.entries(natalPositions) as [PlanetId, { sign: ZodiacSign; longitude: number }][]) {
    if (!natal) continue;

    let arc = norm360(transitLon - natal.longitude);
    if (arc > 180) arc = 360 - arc; // shortest arc

    for (const aspect of ASPECT_TABLE) {
      const orb = Math.abs(arc - aspect.angle);
      if (orb <= aspect.orb) {
        // Applying = transit planet moving toward exact aspect
        // Simplification: if transit speed is positive (direct motion),
        // applying when transit longitude < natal longitude for most aspects
        const isApplying = transitSpeed > 0;

        found.push({
          transitPlanet,
          natalPlanet:  natalId,
          type:         aspect.type,
          symbol:       aspect.symbol,
          orb:          parseFloat(orb.toFixed(2)),
          isApplying,
        });
      }
    }
  }

  return found;
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Calculate today's transit report for a user.
 *
 * @param birthDate  — User's UTC birth datetime
 * @param birthLat   — Birth latitude
 * @param birthLng   — Birth longitude
 * @param now        — The moment to calculate sky positions for (default: Date.now())
 */
export function calculateTransitReport(
  birthDate: Date,
  birthLat:  number,
  birthLng:  number,
  now:       Date = new Date(),
): TransitReport {
  const engine = new AstroEngine();

  // Natal chart — uses birth time + birth location for accurate house cusps
  const natal  = engine.getWesternChart(birthDate, birthLat, birthLng);

  // Current sky — uses `now` with birth location
  // (location only affects houses, not planet longitudes, but we want the
  //  transit Moon's house in the *natal* house system anyway)
  const sky = engine.getWesternChart(now, birthLat, birthLng);

  // ── Moon phase ────────────────────────────────────────────────────────────
  const moonPhase = getMoonPhase(
    sky.planets.sun.longitude,
    sky.planets.moon.longitude,
  );

  // ── Transit Moon house (in natal chart) ───────────────────────────────────
  const transitMoonLon = sky.planets.moon.longitude;
  const transitMoonHouse = getPlanetHouse(transitMoonLon, natal.houses.cusps);

  const transitMoon: TransitMoonInfo = {
    sign:        sky.planets.moon.sign,
    longitude:   parseFloat(transitMoonLon.toFixed(4)),
    signDegree:  sky.planets.moon.signDegree,
    signMinutes: sky.planets.moon.signMinutes,
    house:       transitMoonHouse,
    isRetrograde: sky.planets.moon.isRetrograde,
  };

  // ── Natal positions (for aspects + prompt context) ────────────────────────
  const natalPositions: Partial<Record<PlanetId, { sign: ZodiacSign; longitude: number }>> = {};
  for (const id of PLANETS_FOR_ASPECTS) {
    const p = natal.planets[id];
    if (p) {
      natalPositions[id] = { sign: p.sign, longitude: parseFloat(p.longitude.toFixed(4)) };
    }
  }

  // ── Sky snapshot ──────────────────────────────────────────────────────────
  const skyPositions: Partial<Record<PlanetId, PlanetSnap>> = {};
  for (const id of SKY_PLANETS) {
    const p = sky.planets[id];
    if (p) {
      skyPositions[id] = {
        sign:        p.sign,
        longitude:   parseFloat(p.longitude.toFixed(4)),
        isRetrograde: p.isRetrograde,
      };
    }
  }

  // ── Aspects: transit Moon vs natal planets ────────────────────────────────
  const moonAspects = findAspects(
    'moon',
    transitMoonLon,
    sky.planets.moon.speedLong,
    natalPositions,
  );

  // Sort by orb (tightest first) and take top 5
  const aspects = moonAspects
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 5);

  // ── Natal Moon house ──────────────────────────────────────────────────────
  const natalMoonHouse = getPlanetHouse(natal.planets.moon.longitude, natal.houses.cusps);

  return {
    computedAt:    now.toISOString(),
    moonPhase,
    transitMoon,
    skyPositions,
    natalPositions,
    aspects,
    natalMoonHouse,
  };
}
