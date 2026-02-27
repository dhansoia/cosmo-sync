/**
 * AstroEngine — CosmoSync core calculation engine.
 *
 * Planetary positions: astronomy-engine (VSOP87 / DE405-equivalent accuracy).
 * House cusps: native implementation of Whole Sign and Equal House.
 * Ascendant / MC: computed from Local Sidereal Time (Meeus formulas).
 * Vedic conversion: Lahiri Ayanamsa subtracted from tropical longitudes.
 *
 * NOTE — Placidus house cusps:
 *   Full Placidus requires iterative semi-arc calculations. The current
 *   implementation falls back to Equal House for cusps 2, 3, 5, 6, 8, 9,
 *   11, 12 while preserving exact ASC, MC, DSC, IC. This is sufficient for
 *   the Big 3 cache (Sun, Moon, Rising) and can be upgraded by dropping in
 *   `swisseph` once Visual Studio "Desktop development with C++" is installed:
 *     npm install swisseph
 *   Then switch the backend in next.config.ts serverComponentsExternalPackages.
 */

import * as Astronomy from 'astronomy-engine';

import type {
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

import {
  J2000,
  LAHIRI_AT_J2000,
  LAHIRI_RATE_DEG_PER_YEAR,
  OBLIQUITY_AT_J2000,
  OBLIQUITY_RATE_DEG_PER_CENTURY,
  PLANET_BODIES,
  PLANET_IDS,
  ZODIAC_SIGNS,
} from './constants';

import { dateToJulianDay, julianCenturies } from './utils/jd';

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise any angle to the range [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Convert degrees to radians. */
const toRad = (d: number) => (d * Math.PI) / 180;

/** Convert radians to degrees. */
const toDeg = (r: number) => (r * 180) / Math.PI;

/**
 * Mean obliquity of the ecliptic at a given Julian Day.
 * Uses the linear term from IAU 1976 (Lieske et al.) —
 * accurate to ~0.01° for dates within ±200 years of J2000.
 */
function getMeanObliquity(jd: number): number {
  const T = julianCenturies(jd);
  return OBLIQUITY_AT_J2000 + OBLIQUITY_RATE_DEG_PER_CENTURY * T;
}

/**
 * Lahiri Ayanamsa at a given Julian Day.
 * Linear approximation; accurate to ~0.03° within ±100 years of J2000.
 * For sub-arcminute precision use the Swiss Ephemeris SE_SIDM_LAHIRI value.
 */
function getLahiriAyanamsa(jd: number): number {
  const years = (jd - J2000) / 365.25;
  return LAHIRI_AT_J2000 + years * LAHIRI_RATE_DEG_PER_YEAR;
}

/**
 * Decompose an ecliptic longitude (0–360°) into its sign, degree, and minutes.
 */
function longitudeToSign(longitude: number): {
  sign: ZodiacSign;
  signDegree: number;
  signMinutes: number;
} {
  const normalised = norm360(longitude);
  const signIndex  = Math.floor(normalised / 30);
  const signDegree = normalised % 30;
  return {
    sign:        ZODIAC_SIGNS[signIndex],
    signDegree:  Math.floor(signDegree),
    signMinutes: Math.floor((signDegree % 1) * 60),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AstroEngine
// ─────────────────────────────────────────────────────────────────────────────

export class AstroEngine {
  private readonly defaultHouseSystem: HouseSystem;

  constructor(options: AstroEngineOptions = {}) {
    this.defaultHouseSystem = options.houseSystem ?? 'P';
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Full Western (Tropical) chart.
   * House system: Placidus (cusps 1, 4, 7, 10 exact; others Equal House).
   *
   * @param time - Point in time (UTC)
   * @param lat  - Geographic latitude  (−90 to +90 °)
   * @param lng  - Geographic longitude (−180 to +180 °)
   */
  getWesternChart(time: Date | string, lat: number, lng: number): ChartData {
    return this.compute(time, lat, lng, 'TROPICAL', 'P');
  }

  /**
   * Full Vedic (Sidereal / Lahiri) chart.
   * House system: Whole Sign.
   *
   * @param time - Point in time (UTC)
   * @param lat  - Geographic latitude  (−90 to +90 °)
   * @param lng  - Geographic longitude (−180 to +180 °)
   */
  getVedicChart(time: Date | string, lat: number, lng: number): ChartData {
    return this.compute(time, lat, lng, 'SIDEREAL', 'W');
  }

  /**
   * Generic chart with explicit zodiac and house system overrides.
   * Useful for advanced combinations (e.g. Tropical + Whole Sign).
   */
  getChart(
    time: Date | string,
    lat: number,
    lng: number,
    zodiacSystem: ZodiacSystem = 'TROPICAL',
    houseSystem: HouseSystem   = this.defaultHouseSystem,
  ): ChartData {
    return this.compute(time, lat, lng, zodiacSystem, houseSystem);
  }

  /**
   * Lightweight call that returns only planetary longitudes (0–360°).
   * Used by the Synastry Engine and the AstroProfile cache layer.
   */
  getPlanetaryPositions(
    time: Date | string,
    zodiacSystem: ZodiacSystem = 'TROPICAL',
  ): Record<PlanetId, PlanetPosition> {
    const date     = this.toDate(time);
    const jd       = dateToJulianDay(date);
    const astroTime = Astronomy.MakeTime(date);
    const ayanamsa  = zodiacSystem === 'SIDEREAL' ? getLahiriAyanamsa(jd) : 0;
    return this.calculatePlanets(astroTime, jd, ayanamsa);
  }

  /**
   * Returns the "Big 3" (Sun, Moon, Rising) for either zodiac system.
   * This is what gets stored in the AstroProfile cache row.
   *
   * @param time - Point in time (UTC)
   * @param lat  - Geographic latitude
   * @param lng  - Geographic longitude
   * @param zodiacSystem - 'TROPICAL' or 'SIDEREAL'
   */
  getBigThree(
    time: Date | string,
    lat: number,
    lng: number,
    zodiacSystem: ZodiacSystem = 'TROPICAL',
  ): BigThree {
    const chart = zodiacSystem === 'SIDEREAL'
      ? this.getVedicChart(time, lat, lng)
      : this.getWesternChart(time, lat, lng);

    const { sign: rising } = longitudeToSign(chart.houses.ascendant);

    return {
      sun:    chart.planets.sun.sign,
      moon:   chart.planets.moon.sign,
      rising,
    };
  }

  // ── Private: orchestration ─────────────────────────────────────────────────

  private compute(
    time: Date | string,
    lat: number,
    lng: number,
    zodiacSystem: ZodiacSystem,
    houseSystem: HouseSystem,
  ): ChartData {
    const date      = this.toDate(time);
    const jd        = dateToJulianDay(date);
    const astroTime = Astronomy.MakeTime(date);
    const ayanamsa  = zodiacSystem === 'SIDEREAL' ? getLahiriAyanamsa(jd) : 0;

    const planets = this.calculatePlanets(astroTime, jd, ayanamsa);
    const houses  = this.calculateHouses(jd, lat, lng, houseSystem, ayanamsa);

    return {
      julianDay:     jd,
      zodiacSystem,
      houseSystem,
      ayanamsa,
      planets,
      houses,
      calculatedAt:  new Date(),
    };
  }

  // ── Private: planetary positions ──────────────────────────────────────────

  private calculatePlanets(
    astroTime: Astronomy.AstroTime,
    jd: number,
    ayanamsa: number,
  ): Record<PlanetId, PlanetPosition> {
    const result = {} as Record<PlanetId, PlanetPosition>;

    for (const id of PLANET_IDS) {
      result[id] = id === 'sun'
        ? this.getSunPosition(astroTime, jd, ayanamsa)
        : this.getPlanetPosition(id, astroTime, jd, ayanamsa);
    }

    return result;
  }

  /**
   * Sun uses astronomy-engine's dedicated SunPosition() which applies
   * aberration and returns ecliptic coordinates directly.
   */
  private getSunPosition(
    astroTime: Astronomy.AstroTime,
    jd: number,
    ayanamsa: number,
  ): PlanetPosition {
    const current = Astronomy.SunPosition(astroTime);
    // Speed via finite difference over 0.5-day step
    const prev = Astronomy.SunPosition(
      Astronomy.MakeTime(new Date(astroTime.date.getTime() - 43200000)),
    );
    let speedLong = current.elon - prev.elon;
    if (speedLong > 180)  speedLong -= 360;
    if (speedLong < -180) speedLong += 360;
    speedLong *= 2; // normalise back to deg/day

    return this.buildPosition(current.elon, current.elat, 1.0, speedLong, ayanamsa);
  }

  /** All bodies other than the Sun — via GeoVector → Ecliptic. */
  private getPlanetPosition(
    id: PlanetId,
    astroTime: Astronomy.AstroTime,
    jd: number,
    ayanamsa: number,
  ): PlanetPosition {
    const body = PLANET_BODIES[id]!;

    const vecNow  = Astronomy.GeoVector(body, astroTime, false);
    const eclNow  = Astronomy.Ecliptic(vecNow);

    // Speed via finite difference (0.5-day step for inner, 1-day for outer)
    const stepMs  = (id === 'moon' || id === 'mercury') ? 21600000 : 43200000; // 6h or 12h
    const timePrev = Astronomy.MakeTime(new Date(astroTime.date.getTime() - stepMs));
    const eclPrev  = Astronomy.Ecliptic(Astronomy.GeoVector(body, timePrev, false));

    const stepDays = stepMs / 86400000;
    let speedLong  = (eclNow.elon - eclPrev.elon) / stepDays;
    if (speedLong > 180 / stepDays)  speedLong -= 360 / stepDays;
    if (speedLong < -180 / stepDays) speedLong += 360 / stepDays;

    return this.buildPosition(eclNow.elon, eclNow.elat, vecNow.Length(), speedLong, ayanamsa);
  }

  /** Assemble a PlanetPosition from raw ecliptic data + ayanamsa offset. */
  private buildPosition(
    rawLon: number,
    lat: number,
    dist: number,
    speedLong: number,
    ayanamsa: number,
  ): PlanetPosition {
    const longitude = norm360(rawLon - ayanamsa);
    const { sign, signDegree, signMinutes } = longitudeToSign(longitude);
    return {
      longitude,
      latitude:    lat,
      distance:    dist,
      speedLong,
      sign,
      signDegree,
      signMinutes,
      isRetrograde: speedLong < 0,
    };
  }

  // ── Private: houses & angles ──────────────────────────────────────────────

  private calculateHouses(
    jd: number,
    lat: number,
    lng: number,
    houseSystem: HouseSystem,
    ayanamsa: number,
  ): HouseData {
    const obliquity = getMeanObliquity(jd);

    // Greenwich Mean Sidereal Time → Local Mean Sidereal Time → RAMC
    const astroTime = Astronomy.MakeTime(julianDayToDate(jd));
    const gmst      = Astronomy.SiderealTime(astroTime); // hours
    const lmst      = norm360((gmst + lng / 15) * 15);   // degrees
    const ramc      = lmst;

    // Angles
    const asc = this.computeAscendant(ramc, obliquity, lat);
    const mc  = this.computeMC(ramc, obliquity);

    // Apply ayanamsa to angles for sidereal charts
    const siderealAsc = norm360(asc - ayanamsa);
    const siderealMc  = norm360(mc  - ayanamsa);

    const cusps = this.computeCusps(
      houseSystem,
      siderealAsc,
      siderealMc,
      ramc - ayanamsa,
      obliquity,
      lat,
    );

    return {
      cusps,
      ascendant:  siderealAsc,
      midheaven:  siderealMc,
      armc:       norm360(ramc - ayanamsa),
      descendant: norm360(siderealAsc + 180),
      imumCoeli:  norm360(siderealMc  + 180),
    };
  }

  /**
   * Ascendant — ecliptic degree on the Eastern horizon.
   * Meeus, "Astronomical Algorithms" §14.
   */
  private computeAscendant(ramc: number, obliquity: number, lat: number): number {
    const rRamc = toRad(ramc);
    const rObl  = toRad(obliquity);
    const rLat  = toRad(lat);

    const ascRad = Math.atan2(
      Math.cos(rRamc),
      -(Math.sin(rObl) * Math.tan(rLat) + Math.cos(rObl) * Math.sin(rRamc)),
    );

    return norm360(toDeg(ascRad));
  }

  /**
   * Midheaven — ecliptic degree on the upper meridian.
   * Meeus, "Astronomical Algorithms" §14.
   */
  private computeMC(ramc: number, obliquity: number): number {
    const rRamc = toRad(ramc);
    const rObl  = toRad(obliquity);

    const mcRad = Math.atan2(
      Math.sin(rRamc),
      Math.cos(rRamc) * Math.cos(rObl),
    );

    return norm360(toDeg(mcRad));
  }

  /**
   * Dispatch to the correct house cusp algorithm.
   * The _ramc, _obliquity, _lat parameters are reserved for a future
   * full Placidus implementation using swisseph.
   */
  private computeCusps(
    system: HouseSystem,
    asc: number,
    mc: number,
    _ramc: number,
    _obliquity: number,
    _lat: number,
  ): number[] {
    switch (system) {
      case 'W': return this.wholeSignCusps(asc);
      case 'E': return this.equalHouseCusps(asc);
      case 'P': return this.placidusApproxCusps(asc, mc);
      default:  return this.equalHouseCusps(asc);
    }
  }

  /**
   * Whole Sign houses (Vedic standard).
   * House 1 begins at 0° of the ASC sign; each sign is one house.
   */
  private wholeSignCusps(asc: number): number[] {
    const h1Start = Math.floor(asc / 30) * 30;
    return Array.from({ length: 12 }, (_, i) => norm360(h1Start + i * 30));
  }

  /**
   * Equal House — house cusps every 30° starting from the ASC.
   */
  private equalHouseCusps(asc: number): number[] {
    return Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));
  }

  /**
   * Placidus approximation.
   * Exact for the four angles (ASC, MC, DSC, IC).
   * Intermediate cusps approximated as equal divisions of the
   * upper/lower semi-arcs between the angles.
   *
   * For precise Placidus (sub-degree accuracy) install swisseph:
   *   npm install swisseph   # requires VS C++ Build Tools
   * and replace this method with swe_houses(jd, lat, lng, 'P').
   */
  private placidusApproxCusps(asc: number, mc: number): number[] {
    const dsc = norm360(asc + 180);
    const ic  = norm360(mc  + 180);

    // Semi-arc interpolation for intermediate cusps
    const upperEast  = arcBetween(mc,  asc); // MC → ASC (going east, upper sky)
    const upperWest  = arcBetween(asc, dsc); // ASC → DSC
    const lowerWest  = arcBetween(dsc, ic);  // DSC → IC
    const lowerEast  = arcBetween(ic,  mc);  // IC → MC

    return [
      asc,                                  // H1
      norm360(ic   + lowerEast  * (1/3)),   // H2
      norm360(ic   + lowerEast  * (2/3)),   // H3
      ic,                                   // H4
      norm360(ic   - lowerWest  * (1/3)),   // H5 — going toward DSC
      norm360(ic   - lowerWest  * (2/3)),   // H6
      dsc,                                  // H7
      norm360(dsc  + upperWest  * (1/3)),   // H8
      norm360(dsc  + upperWest  * (2/3)),   // H9
      mc,                                   // H10
      norm360(mc   + upperEast  * (1/3)),   // H11
      norm360(mc   + upperEast  * (2/3)),   // H12
    ];
  }

  // ── Private: misc ─────────────────────────────────────────────────────────

  private toDate(time: Date | string): Date {
    return time instanceof Date ? time : new Date(time);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Julian Day → Date (needed internally for LMST calculation). */
function julianDayToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }

  const b  = a + 1524;
  const c  = Math.floor((b - 122.1) / 365.25);
  const d  = Math.floor(365.25 * c);
  const e  = Math.floor((b - d) / 30.6001);

  const dayDecimal   = b - d - Math.floor(30.6001 * e) + f;
  const day          = Math.floor(dayDecimal);
  const month        = e < 14 ? e - 1 : e - 13;
  const year         = month > 2 ? c - 4716 : c - 4715;

  const hourDecimal   = (dayDecimal - day) * 24;
  const hour          = Math.floor(hourDecimal);
  const minuteDecimal = (hourDecimal - hour) * 60;
  const minute        = Math.floor(minuteDecimal);
  const second        = Math.round((minuteDecimal - minute) * 60);

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

/**
 * Shortest signed arc from angle `a` to angle `b` in degrees.
 * Positive = counter-clockwise (increasing longitude direction).
 */
function arcBetween(a: number, b: number): number {
  let arc = norm360(b - a);
  if (arc > 180) arc -= 360;
  return arc;
}
