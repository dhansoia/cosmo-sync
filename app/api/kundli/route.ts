/**
 * GET /api/kundli
 *
 * Returns a full Vedic Kundli analysis for the authenticated user:
 *   • Dosha report  — Mangal Dosha, Kaal Sarp Dosha, Sade Sati
 *   • Yoga report   — Gajakesari, Budhaditya, Raj Yogas
 *   • Rahu / Ketu   — computed mean-node longitudes
 *   • Summary       — Claude-generated third-person narrative
 *   • Remedies      — DB-tracked remedy records (with isCompleted state)
 *
 * On first call the applicable remedies are seeded into the `Remedy` table so
 * the user can track completion over time. Subsequent calls preserve any
 * `isCompleted` flags already set.
 *
 * Requires: `cosmo_uid` httpOnly cookie (set during onboarding).
 * Returns 401 if unauthenticated, 404 if no BirthData on file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db }                        from '@/lib/db';
import { AstroEngine }               from '@/lib/astro';
import { KundliAnalysisEngine }      from '@/lib/kundli';

const astro  = new AstroEngine();
const kundli = new KundliAnalysisEngine();

export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ── Birth data ───────────────────────────────────────────────────────────────
  const birthData = await db.birthData.findUnique({ where: { userId: uid } });
  if (!birthData) {
    return NextResponse.json(
      { error: 'No birth data on file. Complete onboarding first.' },
      { status: 404 },
    );
  }

  // ── Compute Vedic chart + Kundli analysis ────────────────────────────────────
  const chart    = astro.getVedicChart(birthData.dateOfBirth, birthData.latitude, birthData.longitude);
  const analysis = await kundli.analyse(chart);

  // ── Seed remedy tracker (first call only) ───────────────────────────────────
  // Check whether any remedies have already been persisted for this user.
  // If not, flatten the applicable remedies from the analysis and create them.
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

  // ── Fetch DB remedy records (with live isCompleted state) ────────────────────
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

  // ── Response ─────────────────────────────────────────────────────────────────
  return NextResponse.json({
    doshas:         analysis.doshas,
    yogas:          analysis.yogas,
    rahuLongitude:  analysis.rahuLongitude,
    ketuLongitude:  analysis.ketuLongitude,
    summary:        analysis.summary,
    remedies:       trackedRemedies,
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
