/**
 * VedicCalc — Pure Vedic astrology calculation helpers.
 *
 * All inputs expect sidereal (Lahiri) longitudes in degrees [0, 360).
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const SIGN_NAMES = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
] as const;

export const SIGN_ABBR = [
  'Ari','Tau','Gem','Cnc','Leo','Vir',
  'Lib','Sco','Sag','Cap','Aqu','Pis',
] as const;

export const SIGN_SYMBOLS = [
  '♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓',
] as const;

export const NAKSHATRA_NAMES = [
  'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
  'Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni',
  'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
  'Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha',
  'Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati',
] as const;

/** Vimshottari dasha cycle — order and duration in years (total = 120). */
export const VIMSHOTTARI_LORDS  = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'] as const;
export const VIMSHOTTARI_YEARS  = [7, 20, 6, 10, 7, 18, 16, 19, 17] as const;

/** Nakshatra lord = repeating Vimshottari cycle: Ketu, Venus, Sun … */
export const NAKSHATRA_LORDS = NAKSHATRA_NAMES.map((_, i) => VIMSHOTTARI_LORDS[i % 9]);

export const NAK_SPAN = 360 / 27;   // ≈ 13.333°
export const NAK_PADA = NAK_SPAN / 4;

const TITHI_NAMES = [
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima',
  'Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami',
  'Shashthi','Saptami','Ashtami','Navami','Dashami',
  'Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Amavasya',
];

const YOGA_NAMES = [
  'Vishkambha','Priti','Ayushman','Saubhagya','Shobhana',
  'Atiganda','Sukarma','Dhriti','Shula','Ganda',
  'Vriddhi','Dhruva','Vyaghata','Harshana','Vajra',
  'Siddhi','Vyatipata','Variyan','Parigha','Shiva',
  'Siddha','Sadhya','Shubha','Shukla','Brahma','Mahendra','Vaidhriti',
] as const;

const KARANA_MOVEABLE = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti'];
const VARA_NAMES      = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Navamsha starting sign for each rashi element
// Fire(Aries,Leo,Sag)→Aries(0), Earth(Tau,Vir,Cap)→Cap(9), Air(Gem,Lib,Aqu)→Lib(6), Water(Cnc,Sco,Pis)→Cnc(3)
const NAV_START = [0,9,6,3,0,9,6,3,0,9,6,3];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function signIdx(lon: number): number {
  return Math.floor(norm360(lon) / 30);
}

// ─── Nakshatra ────────────────────────────────────────────────────────────────

export interface NakshatraInfo {
  name:    string;
  index:   number;
  lord:    string;
  pada:    number;          // 1–4
  degInNak: number;        // degrees into the nakshatra
}

export function computeNakshatra(lon: number): NakshatraInfo {
  const n   = norm360(lon);
  const idx = Math.floor(n / NAK_SPAN);
  const deg = n - idx * NAK_SPAN;
  return {
    name:    NAKSHATRA_NAMES[idx],
    index:   idx,
    lord:    NAKSHATRA_LORDS[idx],
    pada:    Math.floor(deg / NAK_PADA) + 1,
    degInNak: deg,
  };
}

// ─── Navamsha (D9) ────────────────────────────────────────────────────────────

export function navamshaSignIdx(lon: number): number {
  const n      = norm360(lon);
  const si     = Math.floor(n / 30);
  const degIn  = n - si * 30;
  const navIdx = Math.floor(degIn / (30 / 9));   // 0–8
  return (NAV_START[si] + navIdx) % 12;
}

// ─── Panchang ─────────────────────────────────────────────────────────────────

export interface PanchangData {
  tithi:    { number: number; name: string; paksha: 'Shukla' | 'Krishna' };
  vara:     { number: number; name: string };
  nakshatra:{ name: string; lord: string; pada: number };
  yoga:     { number: number; name: string };
  karana:   { name: string };
}

export function computePanchang(sunLon: number, moonLon: number, julianDay: number): PanchangData {
  const sn = norm360(sunLon);
  const mn = norm360(moonLon);

  // Tithi: each 12° Moon–Sun separation
  const diff     = norm360(mn - sn);
  const tithiRaw = Math.floor(diff / 12);                // 0–29
  const paksha   = tithiRaw < 15 ? 'Shukla' : 'Krishna';

  // Yoga: (Sun + Moon) / (360/27)
  const yogaIdx  = Math.floor(norm360(sn + mn) / NAK_SPAN) % 27;

  // Karana: half-tithi (0–59)
  const karanaRaw = Math.floor(diff / 6);
  let karanaName: string;
  if (karanaRaw === 0)        karanaName = 'Kimstughna';
  else if (karanaRaw >= 57)   karanaName = ['Shakuni','Chatushpada','Naga'][karanaRaw - 57] ?? 'Naga';
  else                        karanaName = KARANA_MOVEABLE[(karanaRaw - 1) % 7];

  // Vara
  const vara = ((Math.floor(julianDay + 1.5) % 7) + 7) % 7;

  const moonNak = computeNakshatra(mn);

  return {
    tithi:     { number: tithiRaw + 1, name: TITHI_NAMES[tithiRaw], paksha },
    vara:      { number: vara, name: VARA_NAMES[vara] },
    nakshatra: { name: moonNak.name, lord: moonNak.lord, pada: moonNak.pada },
    yoga:      { number: yogaIdx + 1, name: YOGA_NAMES[yogaIdx] },
    karana:    { name: karanaName },
  };
}

// ─── Bhava (Chalit / Equal House) ─────────────────────────────────────────────

/** Returns 12 equal-house cusp longitudes starting from the ASC. */
export function computeBhavaCusps(ascLon: number): number[] {
  const asc = norm360(ascLon);
  return Array.from({ length: 12 }, (_, i) => norm360(asc + i * 30));
}

/** Returns 1–12 bhava house number for a planet longitude given equal-house cusps. */
export function bhavaHouse(planetLon: number, cusps: number[]): number {
  const lon = norm360(planetLon);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end   = cusps[(i + 1) % 12];
    if (start < end) {
      if (lon >= start && lon < end) return i + 1;
    } else {
      if (lon >= start || lon < end) return i + 1;
    }
  }
  return 1;
}

// ─── KP Sub-lord ──────────────────────────────────────────────────────────────

export interface KPSubInfo {
  subLord:    string;
  subSubLord: string;
}

export function computeKPSub(lon: number): KPSubInfo {
  const n      = norm360(lon);
  const nakIdx = Math.floor(n / NAK_SPAN);
  const posIn  = n - nakIdx * NAK_SPAN;

  const startLordIdx = nakIdx % 9;  // index in VIMSHOTTARI_LORDS

  let acc = 0;
  for (let i = 0; i < 9; i++) {
    const li   = (startLordIdx + i) % 9;
    const span = (VIMSHOTTARI_YEARS[li] / 120) * NAK_SPAN;
    if (posIn < acc + span) {
      // Found sub-lord. Now compute sub-sub-lord.
      const posInSub = posIn - acc;
      let acc2 = 0;
      let ssl  = VIMSHOTTARI_LORDS[li];
      for (let j = 0; j < 9; j++) {
        const li2   = (li + j) % 9;
        const span2 = (VIMSHOTTARI_YEARS[li2] / 120) * span;
        if (posInSub < acc2 + span2) { ssl = VIMSHOTTARI_LORDS[li2]; break; }
        acc2 += span2;
      }
      return { subLord: VIMSHOTTARI_LORDS[li], subSubLord: ssl };
    }
    acc += span;
  }
  return { subLord: VIMSHOTTARI_LORDS[startLordIdx], subSubLord: VIMSHOTTARI_LORDS[startLordIdx] };
}

// ─── Planet metadata ──────────────────────────────────────────────────────────

export const PLANET_META: Record<string, { name: string; symbol: string; abbr: string }> = {
  sun:     { name: 'Sun',     symbol: '☉', abbr: 'Su' },
  moon:    { name: 'Moon',    symbol: '☽', abbr: 'Mo' },
  mars:    { name: 'Mars',    symbol: '♂', abbr: 'Ma' },
  mercury: { name: 'Mercury', symbol: '☿', abbr: 'Me' },
  jupiter: { name: 'Jupiter', symbol: '♃', abbr: 'Ju' },
  venus:   { name: 'Venus',   symbol: '♀', abbr: 'Ve' },
  saturn:  { name: 'Saturn',  symbol: '♄', abbr: 'Sa' },
  rahu:    { name: 'Rahu',    symbol: '☊', abbr: 'Ra' },
  ketu:    { name: 'Ketu',    symbol: '☋', abbr: 'Ke' },
  uranus:  { name: 'Uranus',  symbol: '♅', abbr: 'Ur' },
  neptune: { name: 'Neptune', symbol: '♆', abbr: 'Ne' },
  pluto:   { name: 'Pluto',   symbol: '♇', abbr: 'Pl' },
};

// ─── South Indian chart grid ──────────────────────────────────────────────────

/**
 * South Indian 4×4 grid positions for each sign index (0=Aries…11=Pisces).
 * Returns [row, col].  Centre cells (r1-2, c1-2) are not used for signs.
 */
export const SIGN_GRID_POS: [number, number][] = [
  [0,1],[0,2],[0,3],[1,3],[2,3],[3,3],[3,2],[3,1],[3,0],[2,0],[1,0],[0,0],
];
// Inverse map: grid[r][c] → signIndex (or -1 for centre)
export const GRID_SIGN: number[][] = [
  [11, 0,  1,  2],
  [10, -1, -1, 3],
  [ 9, -1, -1, 4],
  [ 8,  7,  6, 5],
];
