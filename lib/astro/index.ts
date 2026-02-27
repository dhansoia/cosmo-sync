/**
 * CosmoSync Astro Engine — public surface
 *
 * Primary entry point for all astrological calculations.
 *
 * Usage (Server Component / API Route / Server Action only):
 *
 *   import { AstroEngine } from '@/lib/astro';
 *
 *   const engine = new AstroEngine();
 *
 *   // Western Big 3
 *   const big3 = engine.getBigThree('1990-03-15T14:30:00Z', 40.71, -74.01);
 *   // => { sun: 'Pisces', moon: 'Sagittarius', rising: 'Cancer' }
 *
 *   // Full chart object
 *   const chart = engine.getWesternChart('1990-03-15T14:30:00Z', 40.71, -74.01);
 *
 *   // Vedic (sidereal) chart
 *   const vedicChart = engine.getVedicChart('1990-03-15T14:30:00Z', 40.71, -74.01);
 */

export { AstroEngine } from './AstroEngine';

export type {
  AstroEngineOptions,
  BigThree,
  ChartData,
  HouseData,
  HouseSystem,
  PlanetId,
  PlanetPosition,
  ZodiacSign,
  ZodiacSystem,
} from './types';

export {
  ZODIAC_SIGNS,
  ZODIAC_SYMBOLS,
  PLANET_IDS,
} from './constants';

export {
  dateToJulianDay,
  julianDayToDate,
  julianCenturies,
} from './utils/jd';
