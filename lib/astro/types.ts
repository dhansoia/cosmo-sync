// ============================================================
// CosmoSync — Astro Engine Type Definitions
// ============================================================

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type PlanetId =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

/**
 * The house system to use for chart calculation.
 *   P = Placidus  (Western standard; requires swisseph for full accuracy)
 *   W = Whole Sign (Vedic standard; implemented natively)
 *   E = Equal House (ASC-based 30° divisions)
 */
export type HouseSystem = 'P' | 'W' | 'E';

/**
 * The zodiac system.
 *   TROPICAL  = Western (Tropical)  — default
 *   SIDEREAL  = Vedic  (Sidereal, Lahiri Ayanamsa)
 */
export type ZodiacSystem = 'TROPICAL' | 'SIDEREAL';

// ────────────────────────────────────────────────────────────

export interface PlanetPosition {
  /** Ecliptic longitude, 0–360° */
  longitude: number;
  /** Ecliptic latitude, roughly −8 to +8° for most planets */
  latitude: number;
  /** Distance from Earth in Astronomical Units (AU) */
  distance: number;
  /** Longitude speed in degrees/day; negative = retrograde */
  speedLong: number;
  /** The zodiac sign this longitude falls in */
  sign: ZodiacSign;
  /** Degree within the sign, 0–30 */
  signDegree: number;
  /** Minutes of arc within the sign degree (0–59) */
  signMinutes: number;
  /** True when speedLong < 0 */
  isRetrograde: boolean;
}

export interface HouseData {
  /**
   * The 12 house cusps in ecliptic longitude (0–360°).
   * Index 0 = House 1, index 11 = House 12.
   */
  cusps: number[];
  /** Ascendant (Rising) ecliptic longitude, 0–360° */
  ascendant: number;
  /** Midheaven (MC) ecliptic longitude, 0–360° */
  midheaven: number;
  /** Right Ascension of the Midheaven (degrees) — RAMC */
  armc: number;
  /** Descendent ecliptic longitude (ASC + 180°) */
  descendant: number;
  /** Imum Coeli (IC) ecliptic longitude (MC + 180°) */
  imumCoeli: number;
}

export interface ChartData {
  /** Julian Day Number (UT) of the calculation */
  julianDay: number;
  /** Zodiac system used */
  zodiacSystem: ZodiacSystem;
  /** House system used */
  houseSystem: HouseSystem;
  /** Ayanamsa applied (degrees); 0 for tropical charts */
  ayanamsa: number;
  /** Keyed planetary positions */
  planets: Record<PlanetId, PlanetPosition>;
  /** House cusps and angles */
  houses: HouseData;
  /** When this calculation was performed */
  calculatedAt: Date;
}

/** The "Big 3" — the minimum cache unit stored in AstroProfile */
export interface BigThree {
  sun: ZodiacSign;
  moon: ZodiacSign;
  rising: ZodiacSign;
}

export interface AstroEngineOptions {
  /** Override the default house system (Placidus) */
  houseSystem?: HouseSystem;
}
