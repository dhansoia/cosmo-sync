/**
 * BigThreeCard — Server Component
 *
 * Runs AstroEngine (Node.js only) on the server, serialises both the
 * Western and Vedic Big-3 into plain JSON props, then hands them to the
 * Client Component.  The client receives both datasets up-front so the
 * toggle is completely instant — no additional network round-trips.
 */

import { AstroEngine, ZODIAC_SYMBOLS } from '@/lib/astro';
import type { ChartData, ZodiacSign } from '@/lib/astro';
import { BigThreeDisplay } from './BigThreeDisplay';
import type {
  BigThreeSlice,
  ElementType,
  SignPositionData,
} from './types';

// ─── sign → element lookup ───────────────────────────────────────────────────

const SIGN_ELEMENTS: Record<ZodiacSign, ElementType> = {
  Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
  Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
  Gemini: 'air', Libra: 'air', Aquarius: 'air',
  Cancer: 'water', Scorpio: 'water', Pisces: 'water',
};

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

function toSignData(
  sign: ZodiacSign,
  degree: number,
  minutes: number,
  isRetrograde: boolean,
): SignPositionData {
  return {
    sign,
    symbol: ZODIAC_SYMBOLS[sign],
    degree,
    minutes,
    element: SIGN_ELEMENTS[sign],
    isRetrograde,
  };
}

function extractSlice(chart: ChartData): BigThreeSlice {
  const { planets, houses, ayanamsa } = chart;

  // Ascendant longitude → sign / degree / minutes
  const asc       = ((houses.ascendant % 360) + 360) % 360;
  const risingSign = ZODIAC_SIGNS[Math.floor(asc / 30)] as ZodiacSign;
  const inSign     = asc % 30;
  const risingDeg  = Math.floor(inSign);
  const risingMin  = Math.floor((inSign - risingDeg) * 60);

  return {
    sun:    toSignData(planets.sun.sign,  planets.sun.signDegree,  planets.sun.signMinutes,  planets.sun.isRetrograde),
    moon:   toSignData(planets.moon.sign, planets.moon.signDegree, planets.moon.signMinutes, planets.moon.isRetrograde),
    rising: toSignData(risingSign, risingDeg, risingMin, false),
    ayanamsaDegrees: ayanamsa,
  };
}

// ─── component ───────────────────────────────────────────────────────────────

interface BigThreeCardProps {
  /** UTC datetime string or Date object */
  time: string | Date;
  /** Geographic latitude  (−90 to +90) */
  lat: number;
  /** Geographic longitude (−180 to +180) */
  lng: number;
  /** Human-readable birth info shown in the card subtitle */
  birthInfoLabel?: string;
}

export function BigThreeCard({
  time,
  lat,
  lng,
  birthInfoLabel,
}: BigThreeCardProps) {
  const engine = new AstroEngine();

  // Both charts computed synchronously on the server.
  // The client receives both and toggles between them instantly.
  const westernChart = engine.getWesternChart(time, lat, lng);
  const vedicChart   = engine.getVedicChart(time, lat, lng);

  return (
    <BigThreeDisplay
      western={extractSlice(westernChart)}
      vedic={extractSlice(vedicChart)}
      birthInfo={birthInfoLabel ? { label: birthInfoLabel } : undefined}
    />
  );
}
