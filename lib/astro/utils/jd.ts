/**
 * Julian Day Number utilities.
 *
 * astronomy-engine provides its own MakeTime() for its internal
 * calculations, but we expose a standalone dateToJulianDay() because:
 *   1. The JD is stored in ChartData for reproducible re-calculation.
 *   2. It's needed to compute sidereal time and obliquity independently.
 *
 * All formulas from Jean Meeus, "Astronomical Algorithms" (2nd ed.).
 */

/** Julian Day 2451545.0 = J2000.0 = 2000 Jan 1.5 (noon TT) */
export const J2000_JD = 2451545.0;

/**
 * Convert a JavaScript Date (UTC) to a Julian Day Number (UT).
 * Accurate from 1 March 300 CE onward (Gregorian calendar reform handled).
 */
export function dateToJulianDay(date: Date): number {
  let year  = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1; // 1-indexed

  const day =
    date.getUTCDate() +
    date.getUTCHours()   / 24 +
    date.getUTCMinutes() / 1440 +
    date.getUTCSeconds() / 86400 +
    date.getUTCMilliseconds() / 86400000;

  if (month <= 2) {
    year  -= 1;
    month += 12;
  }

  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4); // Gregorian correction

  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day + B - 1524.5
  );
}

/**
 * Convert a Julian Day Number (UT) back to a JavaScript Date.
 * Inverse of dateToJulianDay().
 */
export function julianDayToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }

  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

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
 * Julian centuries from J2000.0 — used in obliquity and
 * precession polynomials throughout the engine.
 */
export function julianCenturies(jd: number): number {
  return (jd - J2000_JD) / 36524.25;
}
