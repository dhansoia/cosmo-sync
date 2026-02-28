/**
 * GET /api/kundli/chart
 *
 * Returns full Vedic chart data for all Kundli chart tabs:
 *   - Birth details (date, timezone, coordinates, ayanamsa)
 *   - Lagna (ascendant)
 *   - All planets + Rahu/Ketu with nakshatra, navamsha, bhava, KP sub-lords
 *   - Panchang (Tithi, Vara, Nakshatra, Yoga, Karana)
 *   - Bhava (Chalit) cusps
 *
 * Requires: cosmo_uid cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db }          from '@/lib/db';
import { AstroEngine } from '@/lib/astro';
import {
  norm360, signIdx, navamshaSignIdx,
  computeNakshatra, computePanchang,
  computeBhavaCusps, bhavaHouse, computeKPSub,
  SIGN_NAMES, PLANET_META,
} from '@/lib/kundli/VedicCalc';

const J2000  = 2451545.0;
const astro  = new AstroEngine();

// Classical Vedic planets to include (excludes outer planets for traditional view)
const VEDIC_PLANETS = ['sun','moon','mars','mercury','jupiter','venus','saturn'] as const;

export async function GET(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const birthData = await db.birthData.findUnique({ where: { userId: uid } });
  if (!birthData) {
    return NextResponse.json({ error: 'No birth data on file' }, { status: 404 });
  }

  const chart = astro.getVedicChart(birthData.dateOfBirth, birthData.latitude, birthData.longitude);

  const jd  = chart.julianDay;
  const asc = chart.houses.ascendant;

  // ── Rahu / Ketu ────────────────────────────────────────────────────────────
  const rahuLon = norm360(125.0445 - 0.0529539 * (jd - J2000));
  const ketuLon = norm360(rahuLon + 180);

  // ── Bhava cusps (equal houses from ASC) ────────────────────────────────────
  const bhavaCusps = computeBhavaCusps(asc);

  // ── Lagna info ─────────────────────────────────────────────────────────────
  const ascNorm   = norm360(asc);
  const lagnaSign = signIdx(ascNorm);
  const lagnaRaw  = chart.planets.sun; // just for degree arithmetic
  void lagnaRaw;
  const lagnaInSign = ascNorm - lagnaSign * 30;

  const lagna = {
    longitude: ascNorm,
    sign:      SIGN_NAMES[lagnaSign],
    signIndex: lagnaSign,
    degree:    Math.floor(lagnaInSign),
    minutes:   Math.floor((lagnaInSign % 1) * 60),
  };

  // ── Moon position (for Moon chart house numbers) ───────────────────────────
  const moonLon   = norm360(chart.planets.moon.longitude);
  const moonSign  = signIdx(moonLon);

  // ── Build planet list ──────────────────────────────────────────────────────
  type PlanetRow = {
    id: string; name: string; symbol: string; abbr: string;
    longitude: number; sign: string; signIndex: number;
    degree: number; minutes: number; seconds: number;
    isRetrograde: boolean;
    nakshatra: string; nakshatraIndex: number; nakshatraLord: string; pada: number;
    lagnaHouse: number; moonHouse: number; bhavaHouse: number;
    navamshaSign: string; navamshaSignIndex: number;
    subLord: string; subSubLord: string;
  };

  const planets: PlanetRow[] = [];

  for (const pid of VEDIC_PLANETS) {
    const p   = chart.planets[pid];
    const lon = norm360(p.longitude);
    const si  = signIdx(lon);
    const deg = lon - si * 30;
    const nak = computeNakshatra(lon);
    const kp  = computeKPSub(lon);
    const navSi = navamshaSignIdx(lon);

    const lh = ((si - lagnaSign + 12) % 12) + 1;
    const mh = ((si - moonSign  + 12) % 12) + 1;
    const bh = bhavaHouse(lon, bhavaCusps);

    const meta = PLANET_META[pid];

    planets.push({
      id:              pid,
      name:            meta.name,
      symbol:          meta.symbol,
      abbr:            meta.abbr,
      longitude:       lon,
      sign:            SIGN_NAMES[si],
      signIndex:       si,
      degree:          Math.floor(deg),
      minutes:         Math.floor((deg % 1) * 60),
      seconds:         Math.floor(((deg % 1) * 60 % 1) * 60),
      isRetrograde:    p.isRetrograde,
      nakshatra:       nak.name,
      nakshatraIndex:  nak.index,
      nakshatraLord:   nak.lord,
      pada:            nak.pada,
      lagnaHouse:      lh,
      moonHouse:       mh,
      bhavaHouse:      bh,
      navamshaSign:    SIGN_NAMES[navSi],
      navamshaSignIndex: navSi,
      subLord:         kp.subLord,
      subSubLord:      kp.subSubLord,
    });
  }

  // Add Rahu
  for (const [id, lon, retro] of [['rahu', rahuLon, true], ['ketu', ketuLon, true]] as const) {
    const si    = signIdx(lon);
    const deg   = lon - si * 30;
    const nak   = computeNakshatra(lon);
    const kp    = computeKPSub(lon);
    const navSi = navamshaSignIdx(lon);
    const meta  = PLANET_META[id];
    const lh    = ((si - lagnaSign + 12) % 12) + 1;
    const mh    = ((si - moonSign  + 12) % 12) + 1;
    const bh    = bhavaHouse(lon, bhavaCusps);

    planets.push({
      id, name: meta.name, symbol: meta.symbol, abbr: meta.abbr,
      longitude: lon, sign: SIGN_NAMES[si], signIndex: si,
      degree: Math.floor(deg), minutes: Math.floor((deg % 1) * 60),
      seconds: Math.floor(((deg % 1) * 60 % 1) * 60),
      isRetrograde: retro,
      nakshatra: nak.name, nakshatraIndex: nak.index, nakshatraLord: nak.lord, pada: nak.pada,
      lagnaHouse: lh, moonHouse: mh, bhavaHouse: bh,
      navamshaSign: SIGN_NAMES[navSi], navamshaSignIndex: navSi,
      subLord: kp.subLord, subSubLord: kp.subSubLord,
    });
  }

  // ── Panchang ───────────────────────────────────────────────────────────────
  const panchang = computePanchang(
    norm360(chart.planets.sun.longitude),
    moonLon,
    jd,
  );

  // ── Birth details ──────────────────────────────────────────────────────────
  const bd = birthData.dateOfBirth;
  const birthDetails = {
    dateOfBirth:       bd.toISOString(),
    timezone:          birthData.timezone,
    latitude:          birthData.latitude,
    longitude:         birthData.longitude,
    isTimeApproximate: birthData.isTimeApproximate,
    ayanamsa:          chart.ayanamsa,
    julianDay:         jd,
  };

  return NextResponse.json({
    birthDetails,
    lagna,
    planets,
    panchang,
    bhavaCusps,
  });
}
