/**
 * KundliAnalysisEngine — CosmoSync Vedic chart interpretation layer.
 *
 * Consumes a ChartData object produced by AstroEngine.getVedicChart() and
 * returns a structured KundliAnalysis containing:
 *
 *   • Dosha checks  — Mangal Dosha, Kaal Sarp Dosha, Sade Sati
 *   • Yoga detection — Gajakesari, Budhaditya, Raj Yogas
 *   • Remedies      — Filtered entries from the JSON remedy database
 *   • Summary       — LLM-generated third-person narrative (Claude)
 *
 * Designed for Whole-Sign Vedic charts (zodiacSystem: 'SIDEREAL', houseSystem: 'W').
 * Results are meaningful for other house systems but house numbers will differ.
 */

import Anthropic from '@anthropic-ai/sdk';

import type { ChartData, PlanetId, ZodiacSign } from '@/lib/astro/types';
import type {
  DoshaReport,
  KaalSarpDoshaResult,
  KundliAnalysis,
  MangalDoshaResult,
  PlanetRemedies,
  Remedy,
  SadeSatiResult,
  VedicPlanetId,
  YogaReport,
  YogaResult,
} from './types';

import RAW_REMEDIES from './remedies.json';

// ─────────────────────────────────────────────────────────────────────────────
// Internal constants & helpers
// ─────────────────────────────────────────────────────────────────────────────

const J2000 = 2451545.0;

/** Normalise any angle to [0, 360). */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Return the sign index (0–11) for an ecliptic longitude. */
function signIndex(longitude: number): number {
  return Math.floor(norm360(longitude) / 30);
}

/**
 * Compute the mean Rahu (North Lunar Node) longitude from a Julian Day.
 * Meeus, "Astronomical Algorithms" §47 (mean node, linear term).
 * Accurate to ~0.5° for dates within ±50 years of J2000.
 */
function meanRahuLongitude(jd: number): number {
  return norm360(125.0445 - 0.0529539 * (jd - J2000));
}

/**
 * Determine a planet's Whole-Sign house number (1–12) given
 * the sign index of the Lagna (Ascendant).
 *
 * In Whole-Sign astrology every degree of a sign belongs to the same house;
 * the Lagna sign = House 1, next sign = House 2, and so on.
 */
function wholeSignHouse(planetLongitude: number, ascendantLongitude: number): number {
  const lagnaSign  = signIndex(ascendantLongitude);
  const planetSign = signIndex(planetLongitude);
  return ((planetSign - lagnaSign + 12) % 12) + 1;
}

/**
 * Mapped zodiac sign index (0-11) for a given sign name.
 * Used for Sade Sati and Yoga calculations that work on sign indices.
 */
const SIGN_INDEX: Record<ZodiacSign, number> = {
  Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3,
  Leo: 4, Virgo: 5, Libra: 6, Scorpio: 7,
  Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
};

/**
 * House lord for each sign index (0=Aries…11=Pisces).
 * Uses traditional Vedic rulership (no outer planets).
 */
const SIGN_LORD: PlanetId[] = [
  'mars',    // Aries   (0)
  'venus',   // Taurus  (1)
  'mercury', // Gemini  (2)
  'moon',    // Cancer  (3)
  'sun',     // Leo     (4)
  'mercury', // Virgo   (5)
  'venus',   // Libra   (6)
  'mars',    // Scorpio (7)
  'jupiter', // Sagittarius (8)
  'saturn',  // Capricorn   (9)
  'saturn',  // Aquarius    (10)
  'jupiter', // Pisces      (11)
];

/** Return the traditional Vedic lord of the house at offset `houseNum` from the Lagna. */
function houseLord(lagnaSignIdx: number, houseNum: number): PlanetId {
  return SIGN_LORD[(lagnaSignIdx + houseNum - 1) % 12];
}

/** Display name for each planet. */
const PLANET_NAME: Record<PlanetId, string> = {
  sun:     'Sun',
  moon:    'Moon',
  mercury: 'Mercury',
  venus:   'Venus',
  mars:    'Mars',
  jupiter: 'Jupiter',
  saturn:  'Saturn',
  uranus:  'Uranus',
  neptune: 'Neptune',
  pluto:   'Pluto',
};

// Classical Vedic planets (Saptanga Graha) — only these are used in traditional Dosha/Yoga checks
const CLASSICAL_PLANETS: PlanetId[] = [
  'sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn',
];

// ─────────────────────────────────────────────────────────────────────────────
// Remedy helpers
// ─────────────────────────────────────────────────────────────────────────────

type RemedyDbEntry = {
  planet:   string;
  planetId: string;
  remedies: Remedy[];
};

const REMEDY_DB = RAW_REMEDIES as Record<string, RemedyDbEntry>;

function getRemediesFor(planetId: VedicPlanetId): PlanetRemedies {
  const entry = REMEDY_DB[planetId];
  return {
    planet:   entry.planet,
    planetId: entry.planetId as VedicPlanetId,
    remedies: entry.remedies,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// KundliAnalysisEngine
// ─────────────────────────────────────────────────────────────────────────────

export class KundliAnalysisEngine {
  private readonly anthropicKey: string | undefined;

  constructor() {
    this.anthropicKey = process.env.ANTHROPIC_API_KEY;
  }

  // ── Main public entry point ───────────────────────────────────────────────

  /**
   * Perform a full Kundli analysis on a Vedic (sidereal) ChartData.
   *
   * @example
   * ```ts
   * const engine     = new AstroEngine();
   * const chart      = engine.getVedicChart('1990-03-15T14:30:00Z', 28.63, 77.21);
   * const kundli     = new KundliAnalysisEngine();
   * const analysis   = await kundli.analyse(chart);
   * ```
   */
  async analyse(chart: ChartData): Promise<KundliAnalysis> {
    // Compute Rahu / Ketu from the Julian Day embedded in the chart
    const rahu = meanRahuLongitude(chart.julianDay);
    const ketu = norm360(rahu + 180);

    const doshas = this.checkDoshas(chart, rahu, ketu);
    const yogas  = this.detectYogas(chart);

    const applicableRemedies = this.selectRemedies(doshas, yogas);
    const summary            = await this.generateSummary(chart, doshas, yogas, rahu);

    return {
      doshas,
      yogas,
      applicableRemedies,
      summary,
      rahuLongitude: rahu,
      ketuLongitude: ketu,
    };
  }

  // ── Dosha checks ──────────────────────────────────────────────────────────

  private checkDoshas(chart: ChartData, rahu: number, ketu: number): DoshaReport {
    return {
      mangalDosha:   this.checkMangalDosha(chart),
      kaalSarpDosha: this.checkKaalSarpDosha(chart, rahu, ketu),
      sadeSati:      this.checkSadeSati(chart),
    };
  }

  /**
   * Mangal (Mars) Dosha
   *
   * Present when Mars occupies houses 1, 4, 7, 8, or 12 in the Whole-Sign chart.
   * These placements can intensify conflict and delay marriage if unmitigated.
   */
  private checkMangalDosha(chart: ChartData): MangalDoshaResult {
    const DOSHA_HOUSES = new Set([1, 4, 7, 8, 12]);
    const marsLon  = chart.planets.mars.longitude;
    const ascLon   = chart.houses.ascendant;
    const marsHouse = wholeSignHouse(marsLon, ascLon);
    const present   = DOSHA_HOUSES.has(marsHouse);

    const description = present
      ? `Mars occupies the ${marsHouse}${ordinal(marsHouse)} house in this chart. ` +
        `Traditional texts identify this as Mangal Dosha, which can bring intensity into partnerships and require conscious cultivation of patience.`
      : `Mars is placed in the ${marsHouse}${ordinal(marsHouse)} house, outside the classic Mangal Dosha positions. ` +
        `Mars energy is expressed constructively without the typical relationship tension.`;

    return { present, marsHouse, description };
  }

  /**
   * Kaal Sarp Dosha
   *
   * All seven classical planets must lie on the Rahu-to-Ketu arc (i.e., within 180°
   * clockwise from Rahu). Any planet on the Ketu-to-Rahu arc breaks the Dosha.
   */
  private checkKaalSarpDosha(
    chart: ChartData,
    rahu: number,
    ketu: number,
  ): KaalSarpDoshaResult {
    const trappedPlanets: VedicPlanetId[] = [];
    let allTrapped = true;

    for (const id of CLASSICAL_PLANETS) {
      const lon = chart.planets[id].longitude;
      // Arc from Rahu going forward (clockwise in the zodiac)
      const arc = norm360(lon - rahu);
      if (arc < 180) {
        trappedPlanets.push(id);
      } else {
        allTrapped = false;
      }
    }

    // Also count Rahu and Ketu themselves for display but don't use them for the dosha condition
    const present = allTrapped && CLASSICAL_PLANETS.length > 0;

    const description = present
      ? `All seven classical planets fall between Rahu (${rahu.toFixed(1)}°) and Ketu (${ketu.toFixed(1)}°). ` +
        `Kaal Sarp Dosha is present. This configuration can create periods of intense struggle ` +
        `before breakthrough, and invites the native to transform rather than resist their karma.`
      : trappedPlanets.length > 0
        ? `${trappedPlanets.length} of 7 classical planets fall between Rahu and Ketu — ` +
          `Kaal Sarp Dosha is not fully formed. The chart carries some Rahu-Ketu karmic tension ` +
          `but not the complete serpentine enclosure.`
        : `No classical planets are enclosed between Rahu and Ketu. Kaal Sarp Dosha is absent.`;

    return { present, rahuLongitude: rahu, ketuLongitude: ketu, trappedPlanets, description };
  }

  /**
   * Sade Sati (Saturn's 7½-year transit cycle)
   *
   * At birth, checks whether natal Saturn occupies the 12th, 1st (same sign),
   * or 2nd sign from the natal Moon — indicating the native was born during Sade Sati.
   */
  private checkSadeSati(chart: ChartData): SadeSatiResult {
    const moonSignIdx   = signIndex(chart.planets.moon.longitude);
    const saturnSignIdx = signIndex(chart.planets.saturn.longitude);
    const diff          = (saturnSignIdx - moonSignIdx + 12) % 12;

    let phase: SadeSatiResult['phase'] = null;

    if (diff === 11) phase = '12th'; // Saturn one sign behind Moon
    if (diff === 0)  phase = '1st';  // Saturn in the same sign as Moon
    if (diff === 1)  phase = '2nd';  // Saturn one sign ahead of Moon

    const present = phase !== null;

    const phaseLabel: Record<NonNullable<SadeSatiResult['phase']>, string> = {
      '12th': 'rising (12th-house) phase — a time of internal preparation and subtle pressure',
      '1st':  'peak (1st-house) phase — the most intense and transformative period',
      '2nd':  'setting (2nd-house) phase — challenges related to resources and self-worth',
    };

    const description = present && phase
      ? `Saturn was in the ${phaseLabel[phase]} of Sade Sati at birth. ` +
        `The native may carry themes of endurance, delayed rewards, and deep karmic lessons through life.`
      : `Saturn was not transiting the Sade Sati zone at birth. ` +
        `The native begins life outside this cycle of Saturnine pressure.`;

    return { present, phase, description };
  }

  // ── Yoga detection ────────────────────────────────────────────────────────

  private detectYogas(chart: ChartData): YogaReport {
    const rajYogas = this.detectRajYogas(chart);
    return {
      gajakesariYoga: this.detectGajakesariYoga(chart),
      budhadityaYoga: this.detectBudhadityaYoga(chart),
      rajYogas,
    };
  }

  /**
   * Gajakesari Yoga
   *
   * Jupiter in a Kendra (1, 4, 7, or 10) from the Moon.
   * One of the most celebrated benefic yogas — brings wisdom, renown, and good fortune.
   */
  private detectGajakesariYoga(chart: ChartData): YogaResult {
    const moonSignIdx    = signIndex(chart.planets.moon.longitude);
    const jupiterSignIdx = signIndex(chart.planets.jupiter.longitude);
    const jupiterFromMoon = ((jupiterSignIdx - moonSignIdx + 12) % 12) + 1;

    const KENDRAS = new Set([1, 4, 7, 10]);
    const present = KENDRAS.has(jupiterFromMoon);

    const moonSign    = chart.planets.moon.sign;
    const jupiterSign = chart.planets.jupiter.sign;

    const description = present
      ? `Jupiter in ${jupiterSign} occupies the ${jupiterFromMoon}${ordinal(jupiterFromMoon)} house from the Moon in ${moonSign}, forming Gajakesari Yoga. ` +
        `This powerful combination bestows intelligence, a benevolent nature, and lasting recognition.`
      : `Jupiter in ${jupiterSign} is in the ${jupiterFromMoon}${ordinal(jupiterFromMoon)} from the Moon in ${moonSign} — outside the Kendra positions. Gajakesari Yoga is not present.`;

    return { present, name: 'Gajakesari Yoga', description };
  }

  /**
   * Budhaditya Yoga
   *
   * Sun and Mercury in the same zodiac sign.
   * Confers sharp intellect, analytical brilliance, and eloquence.
   * Very common but gains strength when Mercury is not combust and the sign is favourable.
   */
  private detectBudhadityaYoga(chart: ChartData): YogaResult {
    const sunSign     = chart.planets.sun.sign;
    const mercurySign = chart.planets.mercury.sign;
    const present     = sunSign === mercurySign;

    const description = present
      ? `Sun and Mercury are both in ${sunSign}, forming Budhaditya Yoga. ` +
        `The native possesses sharp intellect, strong powers of expression, and a capacity for learned, analytical thought.`
      : `Sun (${sunSign}) and Mercury (${mercurySign}) are in different signs. Budhaditya Yoga is not active.`;

    return { present, name: 'Budhaditya Yoga', description };
  }

  /**
   * Raj Yoga detection
   *
   * Checks three classic configurations:
   *  1. Dharma-Karma Adhipati — lords of 9th and 10th in the same sign
   *  2. 5th-9th Lord Yoga     — lords of 5th and 9th in the same sign
   *  3. Kendra-Trikona Raj Yoga — lord of any Trikona (5, 9) placed in any Kendra (1, 4, 7, 10)
   */
  private detectRajYogas(chart: ChartData): YogaResult[] {
    const ascLon        = chart.houses.ascendant;
    const lagnaSignIdx  = signIndex(ascLon);
    const yogas: YogaResult[] = [];

    // Helper: sign index occupied by a given planet
    const planetSignIdx = (id: PlanetId) => signIndex(chart.planets[id].longitude);

    // ── 1. Dharma-Karma Adhipati Yoga (9th & 10th lords conjunct) ──────────
    {
      const lord9  = houseLord(lagnaSignIdx, 9);
      const lord10 = houseLord(lagnaSignIdx, 10);
      const present = lord9 !== lord10 && planetSignIdx(lord9) === planetSignIdx(lord10);

      if (present) {
        const sign = chart.planets[lord9].sign;
        yogas.push({
          present,
          name: 'Dharma-Karma Adhipati Yoga',
          description:
            `The lords of the 9th (${PLANET_NAME[lord9]}) and 10th (${PLANET_NAME[lord10]}) houses ` +
            `are conjunct in ${sign}. This is a potent Raj Yoga indicating a life where ` +
            `purpose and career align — bringing authority, public esteem, and righteous success.`,
        });
      }
    }

    // ── 2. 5th-9th Lord Yoga ──────────────────────────────────────────────
    {
      const lord5  = houseLord(lagnaSignIdx, 5);
      const lord9  = houseLord(lagnaSignIdx, 9);
      const present = lord5 !== lord9 && planetSignIdx(lord5) === planetSignIdx(lord9);

      if (present) {
        const sign = chart.planets[lord5].sign;
        yogas.push({
          present,
          name: '5th–9th Lord Raj Yoga',
          description:
            `The lords of the 5th (${PLANET_NAME[lord5]}) and 9th (${PLANET_NAME[lord9]}) ` +
            `Trikona houses are conjunct in ${sign}. This auspicious combination supports ` +
            `higher learning, fortunate children, spiritual wisdom, and accumulated merit.`,
        });
      }
    }

    // ── 3. Kendra-Trikona Raj Yoga ────────────────────────────────────────
    // Trikona lords (5, 9) — excluding lagna (1) which is always both kendra and trikona
    const trikonaHouses = [5, 9] as const;
    // Kendra sign indices relative to lagna
    const kendraOffsets  = [0, 3, 6, 9]; // houses 1, 4, 7, 10

    for (const tHouse of trikonaHouses) {
      const tLord     = houseLord(lagnaSignIdx, tHouse);
      const tLordSign = planetSignIdx(tLord);
      // Is the Trikona lord placed in a Kendra sign?
      const inKendra  = kendraOffsets.some(
        (offset) => (lagnaSignIdx + offset) % 12 === tLordSign,
      );

      if (inKendra) {
        const sign = chart.planets[tLord].sign;
        const kHouseNum = ((tLordSign - lagnaSignIdx + 12) % 12) + 1;
        // Avoid duplicating with the first two yoga checks
        const alreadyFound = yogas.some((y) =>
          y.description.includes(PLANET_NAME[tLord])
        );
        if (!alreadyFound) {
          yogas.push({
            present: true,
            name: 'Kendra-Trikona Raj Yoga',
            description:
              `The ${tHouse}${ordinal(tHouse)}-house lord (${PLANET_NAME[tLord]}) is placed ` +
              `in the ${kHouseNum}${ordinal(kHouseNum)} Kendra house in ${sign}. ` +
              `This Kendra-Trikona connection is a hallmark of rise in status, ` +
              `leadership ability, and material as well as spiritual achievement.`,
          });
        }
      }
    }

    return yogas;
  }

  // ── Remedy selection ──────────────────────────────────────────────────────

  /**
   * Assemble a relevant, non-redundant remedy list based on the chart's doshas
   * and yogas. Planets are included when:
   *   • Their dosha is present (Mars, Saturn/Rahu/Ketu)
   *   • They form a key yoga (Jupiter, Mercury+Sun)
   *   • Sun and Moon are always included as foundational luminaries
   */
  private selectRemedies(doshas: DoshaReport, yogas: YogaReport): PlanetRemedies[] {
    const selected = new Set<VedicPlanetId>(['sun', 'moon']);

    if (doshas.mangalDosha.present) {
      selected.add('mars');
    }

    if (doshas.kaalSarpDosha.present) {
      selected.add('rahu');
      selected.add('ketu');
    }

    if (doshas.sadeSati.present) {
      selected.add('saturn');
    }

    if (yogas.gajakesariYoga.present) {
      selected.add('jupiter');
    }

    if (yogas.budhadityaYoga.present) {
      // Mercury and Sun already included or Sun already added
      selected.add('mercury');
    }

    // Always add Jupiter if a Raj Yoga is present (Jupiter governs grace & dharma)
    if (yogas.rajYogas.length > 0) {
      selected.add('jupiter');
    }

    return Array.from(selected).map(getRemediesFor);
  }

  // ── LLM summary ───────────────────────────────────────────────────────────

  /**
   * Call Claude to produce a warm, third-person narrative summary of the Kundli.
   * Falls back to a structured template if ANTHROPIC_API_KEY is absent or the
   * API call fails, ensuring the feature always returns useful output.
   */
  private async generateSummary(
    chart:  ChartData,
    doshas: DoshaReport,
    yogas:  YogaReport,
    rahu:   number,
  ): Promise<string> {
    const prompt = this.buildSummaryPrompt(chart, doshas, yogas, rahu);

    if (!this.anthropicKey) {
      console.warn('[KundliAnalysisEngine] ANTHROPIC_API_KEY not set — using fallback summary.');
      return this.fallbackSummary(chart, doshas, yogas);
    }

    try {
      const client  = new Anthropic({ apiKey: this.anthropicKey });
      const message = await client.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 500,
        system: [
          'You are Jyotish Saathi, CosmoSync\'s Vedic astrology guide.',
          'Write a clear, warm, third-person astrological summary for a native whose Kundli has just been analysed.',
          'Use "the native" or their Lagna sign (e.g. "this Scorpio Rising native") as the subject.',
          'Weave together the dosha findings, yoga blessings, and planetary positions into one cohesive 3–4 sentence narrative.',
          'Be specific with sign and house placements. Be encouraging and grounded — never alarmist.',
          'Do not use bullet points. Write in flowing prose only.',
        ].join(' '),
        messages: [{ role: 'user', content: prompt }],
      });

      const block = message.content[0];
      if (block.type === 'text') return block.text.trim();
    } catch (err) {
      console.error('[KundliAnalysisEngine] Claude API error:', err);
    }

    return this.fallbackSummary(chart, doshas, yogas);
  }

  private buildSummaryPrompt(
    chart:  ChartData,
    doshas: DoshaReport,
    yogas:  YogaReport,
    rahu:   number,
  ): string {
    const asc          = chart.houses.ascendant;
    const lagnaSignIdx = signIndex(asc);
    const lagnaSign    = chart.planets.sun.sign; // fallback — actual lagna sign:
    const actualLagna  = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                          'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'][lagnaSignIdx];

    const planetLines = CLASSICAL_PLANETS.map((id) => {
      const p    = chart.planets[id];
      const hNum = wholeSignHouse(p.longitude, asc);
      return `  ${PLANET_NAME[id]}: ${p.sign} — House ${hNum}${p.isRetrograde ? ' (Rx)' : ''}`;
    }).join('\n');

    const doshaLines = [
      `  Mangal Dosha:    ${doshas.mangalDosha.present ? 'PRESENT (Mars in H' + doshas.mangalDosha.marsHouse + ')' : 'absent'}`,
      `  Kaal Sarp Dosha: ${doshas.kaalSarpDosha.present ? 'PRESENT' : 'absent'}`,
      `  Sade Sati:       ${doshas.sadeSati.present ? `PRESENT (${doshas.sadeSati.phase} phase)` : 'absent'}`,
    ].join('\n');

    const yogaLines = [
      `  Gajakesari Yoga: ${yogas.gajakesariYoga.present ? 'YES' : 'no'}`,
      `  Budhaditya Yoga: ${yogas.budhadityaYoga.present ? 'YES' : 'no'}`,
      yogas.rajYogas.length
        ? `  Raj Yogas: ${yogas.rajYogas.map((y) => y.name).join(', ')}`
        : '  Raj Yogas: none detected',
    ].join('\n');

    return [
      `Lagna (Ascendant): ${actualLagna}`,
      ``,
      `Planetary positions (Vedic / Whole-Sign):`,
      planetLines,
      `Rahu: ${norm360(rahu).toFixed(1)}°`,
      `Ketu: ${norm360(rahu + 180).toFixed(1)}°`,
      ``,
      `Dosha findings:`,
      doshaLines,
      ``,
      `Yoga findings:`,
      yogaLines,
      ``,
      `Please write the third-person Kundli summary now.`,
    ].join('\n');
  }

  private fallbackSummary(
    chart:  ChartData,
    doshas: DoshaReport,
    yogas:  YogaReport,
  ): string {
    const asc       = chart.houses.ascendant;
    const lagnaIdx  = signIndex(asc);
    const SIGNS     = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                       'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
    const lagna     = SIGNS[lagnaIdx];
    const sun       = chart.planets.sun.sign;
    const moon      = chart.planets.moon.sign;

    const doshaNote = [
      doshas.mangalDosha.present   ? 'Mangal Dosha'   : '',
      doshas.kaalSarpDosha.present ? 'Kaal Sarp Dosha' : '',
      doshas.sadeSati.present      ? 'Sade Sati'       : '',
    ].filter(Boolean).join(', ');

    const yogaNote = [
      yogas.gajakesariYoga.present ? 'Gajakesari Yoga' : '',
      yogas.budhadityaYoga.present ? 'Budhaditya Yoga' : '',
      ...yogas.rajYogas.map((y) => y.name),
    ].filter(Boolean).join(', ');

    let summary =
      `This ${lagna} Rising native carries a Sun in ${sun} and a Moon in ${moon}, ` +
      `shaping the core of their identity and emotional world.`;

    if (doshaNote) {
      summary += ` The chart reveals ${doshaNote} — karmic patterns that invite conscious navigation rather than avoidance, and which respond well to the prescribed remedies.`;
    } else {
      summary += ` The chart is free from the major Doshas, indicating a relatively smoother karmic path.`;
    }

    if (yogaNote) {
      summary += ` The presence of ${yogaNote} brings significant blessings of wisdom, recognition, and purposeful achievement that the native can draw upon throughout life.`;
    }

    return summary;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0];
}
