/**
 * POST /api/kundli/save
 *
 * Runs a fresh Vedic Kundli analysis for the authenticated user and persists
 * the result to the `KundliProfile` table. Subsequent calls to GET /api/kundli
 * will be served from this cache, avoiding repeat LLM calls.
 *
 * Also seeds the `Remedy` tracker on first save (same as GET /api/kundli).
 *
 * Requires: `cosmo_uid` httpOnly cookie.
 * Returns 401 if unauthenticated, 404 if no BirthData on file.
 *
 * Response: the saved KundliProfile fields + tracked remedies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db }                        from '@/lib/db';
import { AstroEngine }               from '@/lib/astro';
import { KundliAnalysisEngine }      from '@/lib/kundli';

const astro  = new AstroEngine();
const kundli = new KundliAnalysisEngine();

export async function POST(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ── Birth data ────────────────────────────────────────────────────────────────
  const birthData = await db.birthData.findUnique({ where: { userId: uid } });
  if (!birthData) {
    return NextResponse.json(
      { error: 'No birth data on file. Complete onboarding first.' },
      { status: 404 },
    );
  }

  // ── Compute fresh analysis ────────────────────────────────────────────────────
  const chart    = astro.getVedicChart(birthData.dateOfBirth, birthData.latitude, birthData.longitude);
  const analysis = await kundli.analyse(chart);

  // ── Upsert KundliProfile ──────────────────────────────────────────────────────
  const profileData = {
    rahuLongitude:    analysis.rahuLongitude,
    ketuLongitude:    analysis.ketuLongitude,
    hasMangalDosha:   analysis.doshas.mangalDosha.present,
    hasKaalSarpDosha: analysis.doshas.kaalSarpDosha.present,
    hasSadeSati:      analysis.doshas.sadeSati.present,
    doshaData:        analysis.doshas as object,
    yogaData:         analysis.yogas  as object,
    summary:          analysis.summary,
    calculatedAt:     new Date(),
  };

  const profile = await db.kundliProfile.upsert({
    where:  { userId: uid },
    create: { userId: uid, ...profileData },
    update: profileData,
  });

  // ── Seed remedy tracker (first save only) ────────────────────────────────────
  const existingCount = await db.remedy.count({ where: { userId: uid } });

  if (existingCount === 0) {
    const rows = analysis.applicableRemedies.flatMap(({ planet, remedies }) =>
      remedies.map((r) => ({
        userId:      uid,
        planet,
        type:        capitalise(r.category),
        description: `${r.item} — ${r.detail}`,
      })),
    );
    if (rows.length > 0) {
      await db.remedy.createMany({ data: rows });
    }
  }

  // ── Fetch tracked remedies ────────────────────────────────────────────────────
  const trackedRemedies = await db.remedy.findMany({
    where:   { userId: uid },
    orderBy: [{ planet: 'asc' }, { createdAt: 'asc' }],
    select: {
      id:          true,
      planet:      true,
      type:        true,
      description: true,
      isCompleted: true,
      createdAt:   true,
    },
  });

  // ── Response ──────────────────────────────────────────────────────────────────
  return NextResponse.json({
    id:               profile.id,
    doshas:           analysis.doshas,
    yogas:            analysis.yogas,
    rahuLongitude:    profile.rahuLongitude,
    ketuLongitude:    profile.ketuLongitude,
    hasMangalDosha:   profile.hasMangalDosha,
    hasKaalSarpDosha: profile.hasKaalSarpDosha,
    hasSadeSati:      profile.hasSadeSati,
    summary:          profile.summary,
    calculatedAt:     profile.calculatedAt,
    remedies:         trackedRemedies,
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
