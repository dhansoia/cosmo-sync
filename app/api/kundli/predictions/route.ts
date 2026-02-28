/**
 * GET /api/kundli/predictions?type=life|yearly|monthly|daily
 *
 * Returns Claude-generated Vedic predictions personalised to the user's
 * birth chart.  Results are cached in KundliPrediction rows and served
 * from DB until the TTL expires (life=30d, yearly=14d, monthly=3d, daily=8h).
 *
 * Requires: cosmo_uid cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic                      from '@anthropic-ai/sdk';
import { db }                         from '@/lib/db';
import { AstroEngine }                from '@/lib/astro';
import {
  norm360, signIdx, computeNakshatra, SIGN_NAMES,
} from '@/lib/kundli/VedicCalc';

// ── Constants ──────────────────────────────────────────────────────────────────

type PredType = 'life' | 'yearly' | 'monthly' | 'daily';
type DbType   = 'LIFE' | 'YEARLY' | 'MONTHLY' | 'DAILY';

const J2000 = 2451545.0;

const DB_TYPE: Record<PredType, DbType> = {
  life: 'LIFE', yearly: 'YEARLY', monthly: 'MONTHLY', daily: 'DAILY',
};

/** Cache TTL in milliseconds. */
const TTL_MS: Record<PredType, number> = {
  life:    30 * 86_400_000,
  yearly:  14 * 86_400_000,
  monthly:  3 * 86_400_000,
  daily:    8 * 3_600_000,
};

const VEDIC_PLANETS = ['sun','moon','mars','mercury','jupiter','venus','saturn'] as const;

const astro = new AstroEngine();

// ── Helpers ────────────────────────────────────────────────────────────────────

function periodKey(type: PredType): string {
  const now = new Date();
  if (type === 'life')    return '';
  if (type === 'yearly')  return String(now.getUTCFullYear());
  if (type === 'monthly') return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2,'0')}`;
  return now.toISOString().slice(0, 10);
}

function planetLine(
  name: string, lon: number, lagnaSign: number, retro: boolean,
): string {
  const si = signIdx(lon);
  const h  = ((si - lagnaSign + 12) % 12) + 1;
  return `${name}: ${SIGN_NAMES[si]}, House ${h}${retro ? ' (R)' : ''}`;
}

function buildNatalBlock(
  natal: ReturnType<AstroEngine['getVedicChart']>,
  lagnaSign: number,
): string {
  return VEDIC_PLANETS.map((pid) => {
    const p = natal.planets[pid];
    return planetLine(
      pid.charAt(0).toUpperCase() + pid.slice(1),
      norm360(p.longitude), lagnaSign, p.isRetrograde,
    );
  }).join('\n');
}

function buildTransitBlock(
  transit: ReturnType<AstroEngine['getVedicChart']>,
  lagnaSign: number,
): string {
  return VEDIC_PLANETS.map((pid) => {
    const p  = transit.planets[pid];
    const si = signIdx(norm360(p.longitude));
    const h  = ((si - lagnaSign + 12) % 12) + 1;
    return `${pid.charAt(0).toUpperCase() + pid.slice(1)}: transiting ${SIGN_NAMES[si]} (House ${h})`;
  }).join('\n');
}

// ── Prompt builders ────────────────────────────────────────────────────────────

function buildPrompt(
  type: PredType,
  lagnaSign: number,
  moonSign: number,
  moonNak: { name: string; lord: string; pada: number },
  lagnaSignStr: string,
  moonSignStr: string,
  sunSignStr: string,
  natalBlock: string,
  transitBlock: string,
): string {
  const ctx = `Vedic Birth Chart (Sidereal/Lahiri Ayanamsa):
• Lagna (Ascendant): ${lagnaSignStr}
• Moon: ${moonSignStr} — Nakshatra: ${moonNak.name} Pada ${moonNak.pada} (lord: ${moonNak.lord})
• Sun: ${sunSignStr}
• Planetary positions (sign, natal house):
${natalBlock}`;

  const json = (sections: string) =>
    `Return ONLY valid JSON in this exact shape, no markdown fences:\n{"sections":[${sections}]}`;

  const sec = (title: string, hint: string) =>
    `{"title":"${title}","body":"[${hint} — 3-4 specific sentences based on the chart above]"}`;

  if (type === 'life') return `You are a master Vedic astrologer. Give deep, personalised life predictions.

${ctx}

${json([
  sec('Soul Purpose & Life Path',    'Lagna + Moon nakshatra insight'),
  sec('Career & Dharma',             '10th lord, planets in 10th/6th/2nd'),
  sec('Love & Relationships',        '7th lord, Venus placement'),
  sec('Health & Vitality',           '1st/6th lords, Mars'),
  sec('Spiritual Journey',           '9th/12th lords, Jupiter, Moon nakshatra'),
  sec('Strengths & Challenges',      'Strongest and most challenged planets'),
].join(','))}

Write in warm, compassionate, specific language — no generic horoscope clichés.`;

  const now     = new Date();
  const yearStr = String(now.getUTCFullYear());
  const monStr  = now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const dayStr  = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

  const transitCtx = `Current transits:
${transitBlock}`;

  if (type === 'yearly') return `You are a master Vedic astrologer. Give personalised predictions for ${yearStr}.

${ctx}

${transitCtx}

${json([
  sec(`${yearStr} Overview`,          'Jupiter + Saturn transits relative to natal chart'),
  sec('Career & Finances',           'Transiting planets in 10th/2nd/11th natal houses'),
  sec('Love & Relationships',        'Transiting Venus/7th house influences'),
  sec('Health & Wellbeing',          'Transiting Mars/Saturn and 6th house'),
  sec('Key Planetary Themes',        'The most impactful 2 transits this year'),
  sec('Months to Watch',             'Specific months with notable energies'),
].join(','))}

Be specific to the transit influences on this natal chart. Write warmly and constructively.`;

  if (type === 'monthly') return `You are a master Vedic astrologer. Give personalised predictions for ${monStr}.

${ctx}

${transitCtx}

${json([
  sec(`${monStr} Overview`,    'Moon and Mercury transits this month'),
  sec('Work & Ambitions',     'Sun + Mars transit through natal houses'),
  sec('Love & Connections',   'Venus transit and 7th house influences'),
  sec('Health & Energy',      'Mars and 6th house transits'),
  sec('Inner Life',           'Jupiter + spiritual houses this month'),
].join(','))}

Keep advice practical and grounded to this month's transits.`;

  // daily
  return `You are a master Vedic astrologer. Give personalised predictions for ${dayStr}.

${ctx}

${transitCtx}

${json([
  sec("Today's Energy",       "Moon sign today and its relation to natal Moon"),
  sec('Favorable Actions',   'Planets supporting activity today'),
  sec('Areas of Caution',    'Challenging transits to watch'),
  sec('Evening Reflection',  'A short mindful closing for the day'),
].join(','))}

Be specific, actionable, and grounded. Avoid generic statements.`;
}

// ── Fallback sections when Claude is unavailable ───────────────────────────────

function fallback(type: PredType): { title: string; body: string }[] {
  if (type === 'daily') return [
    { title: "Today's Energy",    body: "Your chart's subtle energies are active today. Stay grounded and trust your intuition as you navigate the day's events." },
    { title: 'Favorable Actions', body: "Engage in careful planning and meaningful conversations. Creative work and learning are well-supported right now." },
    { title: 'Areas of Caution', body: "Avoid hasty decisions and reactive responses. Take a breath before committing to anything significant today." },
    { title: 'Evening Reflection', body: "Spend a few quiet minutes reviewing what you accomplished. Journaling or meditation will help integrate today's experiences." },
  ];
  if (type === 'monthly') return [
    { title: 'Month Overview',   body: "This month carries important planetary energies that will shape your personal and professional landscape. Stay attentive to patterns that emerge in the first week." },
    { title: 'Work & Ambitions', body: "Focus on consolidating ongoing projects rather than launching new ones. Collaboration is more fruitful than solo effort this month." },
    { title: 'Love & Connections', body: "Authentic communication deepens relationships now. Old connections may resurface — greet them with openness." },
    { title: 'Inner Life',       body: "Your intuition is heightened. Devote time to reflection, meditation, or journaling to receive the guidance available to you." },
  ];
  return [
    { title: 'Overview',    body: "Your birth chart reflects a unique combination of planetary energies that shape your life's journey and soul purpose. Each placement carries both gifts and lessons designed for your growth." },
    { title: 'Guidance',    body: "Work consciously with your chart's strengths while approaching challenge areas with patience and self-compassion. Remember: planets indicate tendencies, not fixed destinies." },
  ];
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const raw = req.nextUrl.searchParams.get('type') ?? 'life';
  if (!['life','yearly','monthly','daily'].includes(raw)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  const type = raw as PredType;
  const key  = periodKey(type);

  // ── Try cache ────────────────────────────────────────────────────────────────
  const cached = await db.kundliPrediction.findUnique({
    where: { userId_type_periodKey: { userId: uid, type: DB_TYPE[type], periodKey: key } },
  });
  if (cached) {
    const age = Date.now() - cached.updatedAt.getTime();
    if (age < TTL_MS[type]) {
      return NextResponse.json({ sections: cached.sections, cached: true });
    }
  }

  // ── Birth data ───────────────────────────────────────────────────────────────
  const birthData = await db.birthData.findUnique({ where: { userId: uid } });
  if (!birthData) return NextResponse.json({ error: 'No birth data' }, { status: 404 });

  // ── Compute charts ───────────────────────────────────────────────────────────
  const natal    = astro.getVedicChart(birthData.dateOfBirth, birthData.latitude, birthData.longitude);
  const jd       = natal.julianDay;
  const ascLon   = natal.houses.ascendant;
  const lagnaSign = signIdx(norm360(ascLon));

  const moonLon  = norm360(natal.planets.moon.longitude);
  const sunLon   = norm360(natal.planets.sun.longitude);
  const moonNak  = computeNakshatra(moonLon);
  const _rahuLon = norm360(125.0445 - 0.0529539 * (jd - J2000)); void _rahuLon;

  const natalBlock = buildNatalBlock(natal, lagnaSign);

  let transitBlock = '';
  if (type !== 'life') {
    const transit = astro.getVedicChart(new Date(), birthData.latitude, birthData.longitude);
    transitBlock  = buildTransitBlock(transit, lagnaSign);
  }

  // ── Build prompt ─────────────────────────────────────────────────────────────
  const prompt = buildPrompt(
    type,
    lagnaSign,
    signIdx(moonLon),
    moonNak,
    SIGN_NAMES[lagnaSign],
    SIGN_NAMES[signIdx(moonLon)],
    SIGN_NAMES[signIdx(sunLon)],
    natalBlock,
    transitBlock,
  );

  // ── Call Claude ──────────────────────────────────────────────────────────────
  let sections: { title: string; body: string }[] = [];

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg    = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1800,
      messages:   [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const m    = text.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]) as { sections?: { title: string; body: string }[] };
      sections = parsed.sections ?? [];
    }
  } catch {
    sections = [];
  }

  if (!sections.length) sections = fallback(type);

  // ── Upsert cache ─────────────────────────────────────────────────────────────
  await db.kundliPrediction.upsert({
    where:  { userId_type_periodKey: { userId: uid, type: DB_TYPE[type], periodKey: key } },
    create: { userId: uid, type: DB_TYPE[type], periodKey: key, sections },
    update: { sections, updatedAt: new Date() },
  });

  return NextResponse.json({ sections, cached: false });
}
