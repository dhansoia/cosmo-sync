import * as Astronomy from 'astronomy-engine';
import type { PlanetId, ZodiacSign } from './types';

// ────────────────────────────────────────────────────────────
// Zodiac
// ────────────────────────────────────────────────────────────

export const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** Symbols for display convenience */
export const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

// ────────────────────────────────────────────────────────────
// astronomy-engine Body mappings
// ────────────────────────────────────────────────────────────

/**
 * Maps our PlanetId to the astronomy-engine Body enum value.
 * The Sun is handled separately via SunPosition() which
 * gives corrected ecliptic coordinates directly.
 */
export const PLANET_BODIES: Partial<Record<PlanetId, Astronomy.Body>> = {
  moon:    Astronomy.Body.Moon,
  mercury: Astronomy.Body.Mercury,
  venus:   Astronomy.Body.Venus,
  mars:    Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn:  Astronomy.Body.Saturn,
  uranus:  Astronomy.Body.Uranus,
  neptune: Astronomy.Body.Neptune,
  pluto:   Astronomy.Body.Pluto,
};

/** Ordered list of all planet IDs we calculate */
export const PLANET_IDS: PlanetId[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

// ────────────────────────────────────────────────────────────
// Vedic — Lahiri Ayanamsa
// ────────────────────────────────────────────────────────────

/**
 * Lahiri (IAC) Ayanamsa at J2000.0 epoch (JD 2451545.0).
 * Value derived from the official IAC tables.
 */
export const LAHIRI_AT_J2000 = 23.853; // degrees

/**
 * Annual precession rate used for Lahiri Ayanamsa.
 * 50.2782 arcseconds per year = 0.013966 degrees per year.
 */
export const LAHIRI_RATE_DEG_PER_YEAR = 50.2782 / 3600;

/** J2000.0 Julian Day */
export const J2000 = 2451545.0;

// ────────────────────────────────────────────────────────────
// Obliquity of the Ecliptic (mean)
// ────────────────────────────────────────────────────────────

/**
 * Mean obliquity of the ecliptic at J2000.0 in degrees.
 * From IAU 1976/Lieske et al.
 */
export const OBLIQUITY_AT_J2000 = 23.439291;

/**
 * Rate of change of mean obliquity in degrees per Julian century.
 * (Approximate linear term; sufficient for dates within ±100 years of J2000)
 */
export const OBLIQUITY_RATE_DEG_PER_CENTURY = -0.013004;
