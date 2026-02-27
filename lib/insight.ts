/**
 * lib/insight.ts — Claude-powered personalised astrological insight generator.
 *
 * Requires ANTHROPIC_API_KEY in environment. If the key is absent, returns a
 * graceful fallback so the journal UI still works without API access.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { PlanetId } from '@/lib/astro/types';
import type { TransitReport } from '@/lib/transits';

// ─── constants ────────────────────────────────────────────────────────────────

const PLANET_NAMES: Record<PlanetId, string> = {
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

const ORDINAL = [
  '', '1st', '2nd', '3rd', '4th', '5th', '6th',
  '7th', '8th', '9th', '10th', '11th', '12th',
];

const STAR_LABEL: Record<number, string> = {
  1: 'very low — struggling',
  2: 'below average — a bit off',
  3: 'neutral — okay',
  4: 'good — feeling solid',
  5: 'great — energised and well',
};

// ─── prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  report: TransitReport,
  moodRating: number,
  userNote: string | null,
): string {
  const { transitMoon, moonPhase, aspects, natalPositions } = report;

  const houseLabel = ORDINAL[transitMoon.house] ?? `${transitMoon.house}th`;

  const aspectLines = aspects.length
    ? aspects
        .slice(0, 3)
        .map((a) => {
          const t = PLANET_NAMES[a.transitPlanet];
          const n = PLANET_NAMES[a.natalPlanet];
          return `  • Transit ${t} ${a.symbol} (${a.type}) natal ${n} — orb ${a.orb}°`;
        })
        .join('\n')
    : '  • No major aspects exact today';

  const natalDesc = (['sun', 'moon', 'mars', 'venus', 'jupiter'] as PlanetId[])
    .filter((id) => natalPositions[id])
    .map((id) => `${PLANET_NAMES[id]} in ${natalPositions[id]!.sign}`)
    .join(', ');

  return [
    `Today's astro snapshot:`,
    `• The Moon is in ${transitMoon.sign} (transiting your ${houseLabel} house)`,
    `• Lunar phase: ${moonPhase.emoji} ${moonPhase.name}`,
    `• Active transit aspects:`,
    aspectLines,
    `• Natal chart highlights: ${natalDesc}`,
    ``,
    `User's mood check-in:`,
    `• Mood rating: ${moodRating}/5 — ${STAR_LABEL[moodRating] ?? 'unspecified'}`,
    `• Journal note: ${userNote ? `"${userNote}"` : '(none — no note added)'}`,
    ``,
    `Write a personalised 2–3 sentence astrological insight. Reference the specific transit (sign, house, and one key aspect if present). Connect it meaningfully to the user's reported mood. Close with one gentle, open-ended reflection question. Be warm, poetic, and grounded — never alarmist.`,
  ].join('\n');
}

// ─── fallback (no API key) ───────────────────────────────────────────────────

function getFallbackInsight(report: TransitReport, moodRating: number): string {
  const house = ORDINAL[report.transitMoon.house] ?? `${report.transitMoon.house}th`;
  const phase = report.moonPhase.name.toLowerCase();
  const sign  = report.transitMoon.sign;
  const mood  = moodRating >= 4 ? 'an uplifted' : moodRating >= 3 ? 'a steady' : 'a tender';
  const topAspect = report.aspects[0];
  const aspectNote = topAspect
    ? ` The ${topAspect.type.toLowerCase()} between the Moon and your natal ${PLANET_NAMES[topAspect.natalPlanet]} adds some extra texture to this energy.`
    : '';

  return (
    `The ${phase} Moon moves through ${sign} and your ${house} house today, lending ${mood} quality to your inner life.` +
    aspectNote +
    ` What does your body or heart most need right now?`
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

/**
 * Generate a personalised astrological insight via Claude.
 *
 * Falls back to a template-based insight if ANTHROPIC_API_KEY is not set,
 * so the journal feature is always usable.
 */
export async function generateInsight(
  report:     TransitReport,
  moodRating: number,
  userNote:   string | null,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('[insight] ANTHROPIC_API_KEY not set — using fallback insight.');
    return getFallbackInsight(report, moodRating);
  }

  try {
    const client  = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 300,
      system: [
        'You are CosmoSync\'s astrological wellness guide.',
        'Write warm, specific, poetic 2–3 sentence insights that connect planetary transits to emotional experience.',
        'Always be grounded and non-dogmatic. Never make predictions about external events.',
        'End every insight with one open, gentle reflection question.',
      ].join(' '),
      messages: [
        { role: 'user', content: buildPrompt(report, moodRating, userNote) },
      ],
    });

    const block = message.content[0];
    return block.type === 'text' ? block.text.trim() : getFallbackInsight(report, moodRating);
  } catch (err) {
    console.error('[insight] Claude API error:', err);
    return getFallbackInsight(report, moodRating);
  }
}
