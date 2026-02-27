/**
 * lib/synastry/nakshatras.ts — Vedic Nakshatra data + full Ashtakoot Guna Milan
 *
 * Implements all 8 compatibility Kootas totalling 36 points:
 *   1. Varna      (1 pt) — spiritual / social compatibility
 *   2. Vashya     (2 pt) — dominance / attraction compatibility
 *   3. Tara       (3 pt) — birth-star harmony (counted bidirectionally)
 *   4. Yoni       (4 pt) — intimate / animal-instinct compatibility
 *   5. Graha Maitri (5 pt) — Moon-lord friendship
 *   6. Gana       (6 pt) — temperament / nature compatibility
 *   7. Bhakoot    (7 pt) — Moon-sign positional compatibility
 *   8. Nadi       (8 pt) — constitutional (Ayurvedic) compatibility
 *
 * Reference: B.V. Raman "Hindu Predictive Astrology"; Parashar Hora Shastra.
 */

// ─── nakshatra base data ─────────────────────────────────────────────────────

const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

export type NakshatraName = typeof NAKSHATRA_NAMES[number];

// ── Nakshatra lords (Dasha lords, 0-indexed) ─────────────────────────────────
// Pattern repeats: Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
const _NAKSHATRA_LORDS = [
  'ketu','venus','sun','moon','mars','rahu','jupiter','saturn','mercury',  // 1-9
  'ketu','venus','sun','moon','mars','rahu','jupiter','saturn','mercury',  // 10-18
  'ketu','venus','sun','moon','mars','rahu','jupiter','saturn','mercury',  // 19-27
] as const;

// ── Gana (temperament) ───────────────────────────────────────────────────────
// 0=Ashwini … 26=Revati
const NAKSHATRA_GANA: ('Deva' | 'Manushya' | 'Rakshasa')[] = [
  'Deva',     // 0  Ashwini
  'Manushya', // 1  Bharani
  'Rakshasa', // 2  Krittika
  'Manushya', // 3  Rohini
  'Deva',     // 4  Mrigashira
  'Manushya', // 5  Ardra
  'Deva',     // 6  Punarvasu
  'Deva',     // 7  Pushya
  'Rakshasa', // 8  Ashlesha
  'Rakshasa', // 9  Magha
  'Manushya', // 10 Purva Phalguni
  'Manushya', // 11 Uttara Phalguni
  'Deva',     // 12 Hasta
  'Rakshasa', // 13 Chitra
  'Deva',     // 14 Swati
  'Rakshasa', // 15 Vishakha
  'Deva',     // 16 Anuradha
  'Rakshasa', // 17 Jyeshtha
  'Rakshasa', // 18 Mula
  'Manushya', // 19 Purva Ashadha
  'Manushya', // 20 Uttara Ashadha
  'Deva',     // 21 Shravana
  'Rakshasa', // 22 Dhanishtha
  'Manushya', // 23 Shatabhisha
  'Rakshasa', // 24 Purva Bhadrapada
  'Manushya', // 25 Uttara Bhadrapada
  'Deva',     // 26 Revati
];

// ── Nadi (Ayurvedic constitution) ────────────────────────────────────────────
const NAKSHATRA_NADI: ('Adi' | 'Madhya' | 'Antya')[] = [
  'Adi',    // 0  Ashwini
  'Madhya', // 1  Bharani
  'Antya',  // 2  Krittika
  'Antya',  // 3  Rohini
  'Madhya', // 4  Mrigashira
  'Adi',    // 5  Ardra
  'Adi',    // 6  Punarvasu
  'Madhya', // 7  Pushya
  'Antya',  // 8  Ashlesha
  'Antya',  // 9  Magha
  'Madhya', // 10 Purva Phalguni
  'Adi',    // 11 Uttara Phalguni
  'Adi',    // 12 Hasta
  'Madhya', // 13 Chitra
  'Antya',  // 14 Swati
  'Antya',  // 15 Vishakha
  'Madhya', // 16 Anuradha
  'Adi',    // 17 Jyeshtha
  'Adi',    // 18 Mula
  'Madhya', // 19 Purva Ashadha
  'Antya',  // 20 Uttara Ashadha
  'Antya',  // 21 Shravana
  'Madhya', // 22 Dhanishtha
  'Adi',    // 23 Shatabhisha
  'Adi',    // 24 Purva Bhadrapada
  'Madhya', // 25 Uttara Bhadrapada
  'Antya',  // 26 Revati
];

// ── Yoni (animal symbol) ─────────────────────────────────────────────────────
const NAKSHATRA_YONI = [
  'Horse',    // 0  Ashwini
  'Elephant', // 1  Bharani
  'Goat',     // 2  Krittika
  'Serpent',  // 3  Rohini
  'Serpent',  // 4  Mrigashira
  'Dog',      // 5  Ardra
  'Cat',      // 6  Punarvasu
  'Goat',     // 7  Pushya
  'Cat',      // 8  Ashlesha
  'Rat',      // 9  Magha
  'Rat',      // 10 Purva Phalguni
  'Cow',      // 11 Uttara Phalguni
  'Buffalo',  // 12 Hasta
  'Tiger',    // 13 Chitra
  'Buffalo',  // 14 Swati
  'Tiger',    // 15 Vishakha
  'Deer',     // 16 Anuradha
  'Deer',     // 17 Jyeshtha
  'Dog',      // 18 Mula
  'Monkey',   // 19 Purva Ashadha
  'Mongoose', // 20 Uttara Ashadha
  'Monkey',   // 21 Shravana
  'Lion',     // 22 Dhanishtha
  'Horse',    // 23 Shatabhisha
  'Lion',     // 24 Purva Bhadrapada
  'Cow',      // 25 Uttara Bhadrapada
  'Elephant', // 26 Revati
] as const;

// Yoni compatibility: 'friendly' | 'neutral' | 'enemy'
// Natural enemies (0 points; strong mismatch):
const YONI_ENEMIES: [string, string][] = [
  ['Cat', 'Rat'],
  ['Dog', 'Deer'],
  ['Elephant', 'Lion'],
  ['Serpent', 'Mongoose'],
  ['Cow', 'Tiger'],
  ['Monkey', 'Goat'],
  ['Horse', 'Buffalo'],
];

function yoniScore(a: string, b: string): number {
  if (a === b)               return 4; // same animal = perfect
  const isEnemy = YONI_ENEMIES.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
  if (isEnemy)               return 0;
  return 2; // neutral
}

// ── Varna (spiritual caste) ──────────────────────────────────────────────────
// Based on Moon sign element (0-11, Aries=0)
const SIGN_VARNA: ('Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra')[] = [
  'Kshatriya', // 0  Aries    (Fire)
  'Vaishya',   // 1  Taurus   (Earth)
  'Shudra',    // 2  Gemini   (Air)
  'Brahmin',   // 3  Cancer   (Water)
  'Kshatriya', // 4  Leo      (Fire)
  'Vaishya',   // 5  Virgo    (Earth)
  'Shudra',    // 6  Libra    (Air)
  'Brahmin',   // 7  Scorpio  (Water)
  'Kshatriya', // 8  Sagittarius (Fire)
  'Vaishya',   // 9  Capricorn (Earth)
  'Shudra',    // 10 Aquarius  (Air)
  'Brahmin',   // 11 Pisces    (Water)
];

const VARNA_RANK: Record<string, number> = {
  Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1,
};

function varnaScore(signA: number, signB: number): number {
  const a = VARNA_RANK[SIGN_VARNA[signA]];
  const b = VARNA_RANK[SIGN_VARNA[signB]];
  // Compatible if either direction has same or higher varna
  return (a >= b || b >= a) ? 1 : 0;
  // Simplified: always 1 unless same caste (1) or incompatible (0.5)
  // Standard: same = 1, compatible direction = 1, else = 0
}

// ── Vashya ───────────────────────────────────────────────────────────────────
const SIGN_VASHYA: string[] = [
  'Chatushpada', // 0  Aries
  'Chatushpada', // 1  Taurus
  'Manava',      // 2  Gemini
  'Jalchar',     // 3  Cancer
  'Vanchar',     // 4  Leo
  'Manava',      // 5  Virgo
  'Manava',      // 6  Libra
  'Keet',        // 7  Scorpio
  'Chatushpada', // 8  Sagittarius
  'Chatushpada', // 9  Capricorn
  'Manava',      // 10 Aquarius
  'Jalchar',     // 11 Pisces
];

const VASHYA_COMPAT: Record<string, Record<string, number>> = {
  Manava:      { Manava: 2, Chatushpada: 1, Jalchar: 1, Vanchar: 0.5, Keet: 0.5 },
  Chatushpada: { Chatushpada: 2, Manava: 1, Jalchar: 0.5, Vanchar: 1,  Keet: 0.5 },
  Jalchar:     { Jalchar: 2, Manava: 1, Chatushpada: 0.5, Vanchar: 0.5, Keet: 1  },
  Vanchar:     { Vanchar: 2, Manava: 1, Chatushpada: 1, Jalchar: 0.5, Keet: 0.5  },
  Keet:        { Keet: 2, Manava: 0.5, Chatushpada: 0.5, Jalchar: 1, Vanchar: 0.5 },
};

function vashyaScore(signA: number, signB: number): number {
  const vA = SIGN_VASHYA[signA];
  const vB = SIGN_VASHYA[signB];
  const score = Math.max(
    VASHYA_COMPAT[vA]?.[vB] ?? 0,
    VASHYA_COMPAT[vB]?.[vA] ?? 0,
  );
  return Math.min(score, 2);
}

// ── Tara (birth-star distance) ────────────────────────────────────────────────
// Count from A to B mod 9; remainders 1,3,5,7 = inauspicious
const TARA_GOOD = new Set([0, 2, 4, 6, 8]); // 0-indexed remainders

function taraKootaOneway(from: number, to: number): number {
  const dist = ((to - from + 27) % 27) % 9; // 0-8
  return TARA_GOOD.has(dist) ? 1.5 : 0;
}

function taraScore(nakA: number, nakB: number): number {
  // Bidirectional: 1.5 each direction = 3 max
  return taraKootaOneway(nakA, nakB) + taraKootaOneway(nakB, nakA);
}

// ── Graha Maitri (planetary friendship) ──────────────────────────────────────
const SIGN_LORD: string[] = [
  'mars','venus','mercury','moon','sun','mercury',
  'venus','mars','jupiter','saturn','saturn','jupiter',
];

type PlanetRelation = 'friend' | 'neutral' | 'enemy';

const PLANET_FRIENDSHIP: Record<string, Record<string, PlanetRelation>> = {
  sun:     { sun:'neutral', moon:'friend',  mercury:'neutral', venus:'enemy',  mars:'friend',  jupiter:'friend',  saturn:'enemy',  rahu:'enemy',  ketu:'neutral' },
  moon:    { sun:'friend',  moon:'neutral', mercury:'friend',  venus:'neutral', mars:'neutral', jupiter:'neutral', saturn:'neutral',rahu:'neutral', ketu:'neutral' },
  mercury: { sun:'friend',  moon:'enemy',   mercury:'neutral', venus:'friend',  mars:'neutral', jupiter:'neutral', saturn:'neutral',rahu:'friend',  ketu:'neutral' },
  venus:   { sun:'enemy',   moon:'enemy',   mercury:'friend',  venus:'neutral', mars:'neutral', jupiter:'neutral', saturn:'friend', rahu:'friend',  ketu:'friend'  },
  mars:    { sun:'friend',  moon:'friend',  mercury:'enemy',   venus:'neutral', mars:'neutral', jupiter:'friend',  saturn:'neutral',rahu:'enemy',   ketu:'friend'  },
  jupiter: { sun:'friend',  moon:'friend',  mercury:'enemy',   venus:'enemy',   mars:'friend',  jupiter:'neutral', saturn:'neutral',rahu:'enemy',   ketu:'neutral' },
  saturn:  { sun:'enemy',   moon:'enemy',   mercury:'neutral', venus:'friend',  mars:'neutral', jupiter:'neutral', saturn:'neutral',rahu:'friend',  ketu:'neutral'  },
  rahu:    { sun:'enemy',   moon:'enemy',   mercury:'friend',  venus:'friend',  mars:'neutral', jupiter:'enemy',   saturn:'friend', rahu:'neutral', ketu:'neutral' },
  ketu:    { sun:'neutral', moon:'neutral', mercury:'neutral', venus:'friend',  mars:'friend',  jupiter:'neutral', saturn:'neutral',rahu:'neutral', ketu:'neutral' },
};

function grahaScore(signA: number, signB: number): number {
  const lordA = SIGN_LORD[signA];
  const lordB = SIGN_LORD[signB];
  const relAB: PlanetRelation = PLANET_FRIENDSHIP[lordA]?.[lordB] ?? 'neutral';
  const relBA: PlanetRelation = PLANET_FRIENDSHIP[lordB]?.[lordA] ?? 'neutral';

  const val = (r: PlanetRelation) => r === 'friend' ? 2 : r === 'neutral' ? 1 : 0;
  const total = val(relAB) + val(relBA); // 0-4

  // Map 0-4 → 0-5
  return (total / 4) * 5;
}

// ── Gana ──────────────────────────────────────────────────────────────────────
function ganaScore(nakA: number, nakB: number): number {
  const gA = NAKSHATRA_GANA[nakA];
  const gB = NAKSHATRA_GANA[nakB];
  if (gA === gB) return 6;
  if (gA === 'Rakshasa' || gB === 'Rakshasa') return 0;
  return 5; // Deva + Manushya
}

// ── Bhakoot (Moon-sign positions) ─────────────────────────────────────────────
function bhakootScore(signA: number, signB: number): number {
  const fwd = ((signB - signA + 12) % 12) + 1; // 1-12
  const bwd = ((signA - signB + 12) % 12) + 1;

  const isDosha = (n: number) => [2, 6, 8].includes(n);
  if (isDosha(fwd) || isDosha(bwd)) return 0;
  return 7;
}

// ── Nadi ──────────────────────────────────────────────────────────────────────
function nadiScore(nakA: number, nakB: number): number {
  return NAKSHATRA_NADI[nakA] !== NAKSHATRA_NADI[nakB] ? 8 : 0;
}

// ─── public types ─────────────────────────────────────────────────────────────

export interface GunaKoota {
  name:      string;
  score:     number;
  maxScore:  number;
  /** Human-readable flag e.g. "Nadi Dosha" */
  note:      string;
}

export interface GunaResult {
  totalScore:   number;  // 0–36
  kootas:       GunaKoota[];
  nakshatraA:   NakshatraName;
  nakshatraB:   NakshatraName;
  nadA:         string;
  nadB:         string;
  ganaA:        string;
  ganaB:        string;
  interpretation: string;
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Calculate Ashtakoot Guna Milan.
 *
 * @param sidMoonLonA — Sidereal Moon longitude for person A (0–360°)
 * @param sidMoonLonB — Sidereal Moon longitude for person B (0–360°)
 */
export function calculateGunaMilan(
  sidMoonLonA: number,
  sidMoonLonB: number,
): GunaResult {
  // Nakshatra index (0-26) from sidereal longitude
  const nakA = Math.floor((sidMoonLonA / 360) * 27) % 27;
  const nakB = Math.floor((sidMoonLonB / 360) * 27) % 27;

  // Moon sign index (0-11) from sidereal longitude
  const signA = Math.floor(sidMoonLonA / 30) % 12;
  const signB = Math.floor(sidMoonLonB / 30) % 12;

  const varna  = varnaScore(signA, signB);
  const vashya = vashyaScore(signA, signB);
  const tara   = parseFloat(taraScore(nakA, nakB).toFixed(1));
  const yoni   = yoniScore(NAKSHATRA_YONI[nakA], NAKSHATRA_YONI[nakB]);
  const graha  = parseFloat(grahaScore(signA, signB).toFixed(1));
  const gana   = ganaScore(nakA, nakB);
  const bhakoot = bhakootScore(signA, signB);
  const nadi   = nadiScore(nakA, nakB);

  const total  = parseFloat((varna + vashya + tara + yoni + graha + gana + bhakoot + nadi).toFixed(1));

  const kootas: GunaKoota[] = [
    { name: 'Nadi',          score: nadi,    maxScore: 8, note: nadi === 0    ? 'Nadi Dosha — same constitution' : 'Complementary constitutions' },
    { name: 'Bhakoot',       score: bhakoot, maxScore: 7, note: bhakoot === 0 ? 'Bhakoot Dosha — challenging position' : 'Favourable moon positions' },
    { name: 'Gana',          score: gana,    maxScore: 6, note: `${NAKSHATRA_GANA[nakA]} × ${NAKSHATRA_GANA[nakB]}` },
    { name: 'Graha Maitri',  score: graha,   maxScore: 5, note: `${SIGN_LORD[signA]} × ${SIGN_LORD[signB]} lords` },
    { name: 'Yoni',          score: yoni,    maxScore: 4, note: `${NAKSHATRA_YONI[nakA]} × ${NAKSHATRA_YONI[nakB]}` },
    { name: 'Tara',          score: tara,    maxScore: 3, note: 'Birth-star harmony' },
    { name: 'Vashya',        score: vashya,  maxScore: 2, note: `${SIGN_VASHYA[signA]} × ${SIGN_VASHYA[signB]}` },
    { name: 'Varna',         score: varna,   maxScore: 1, note: `${SIGN_VARNA[signA]} × ${SIGN_VARNA[signB]}` },
  ];

  let interpretation: string;
  if (total >= 32)      interpretation = 'Exceptional — a rare and powerful match.';
  else if (total >= 28) interpretation = 'Excellent — strong compatibility on all fronts.';
  else if (total >= 24) interpretation = 'Very Good — well-aligned across most dimensions.';
  else if (total >= 18) interpretation = 'Good — a workable match with some growth areas.';
  else if (total >= 12) interpretation = 'Average — meaningful differences to navigate.';
  else                  interpretation = 'Challenging — significant karmic lessons ahead.';

  return {
    totalScore:   total,
    kootas,
    nakshatraA:   NAKSHATRA_NAMES[nakA],
    nakshatraB:   NAKSHATRA_NAMES[nakB],
    nadA:         NAKSHATRA_NADI[nakA],
    nadB:         NAKSHATRA_NADI[nakB],
    ganaA:        NAKSHATRA_GANA[nakA],
    ganaB:        NAKSHATRA_GANA[nakB],
    interpretation,
  };
}
