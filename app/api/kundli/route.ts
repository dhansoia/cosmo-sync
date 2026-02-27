/**
 * GET /api/kundli
 *
 * Returns a full Vedic Kundli analysis for the authenticated user.
 *
 * Cache behaviour:
 *   If the user has previously saved their Kundli (via POST /api/kundli/save),
 *   the stored profile is returned immediately — no LLM call is made.
 *   Otherwise a fresh analysis is computed on-the-fly (includes LLM summary).
 *
 * On first call the applicable remedies are seeded into the `Remedy` table so
 * the user can track completion over time. Subsequent calls preserve any
 * `isCompleted` flags already set.
 *
 * Response includes a `cached` boolean so the UI can offer a "Refresh" option.
 *
 * Requires: `cosmo_uid` httpOnly cookie (set during onboarding).
 * Returns 401 if unauthenticated, 404 if no BirthData on file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db }                        from '@/lib/db';
import { AstroEngine }               from '@/lib/astro';
import { KundliAnalysisEngine }      from '@/lib/kundli';
import type { DoshaReport, YogaReport } from '@/lib/kundli';

const astro  = new AstroEngine();
const kundli = new KundliAnalysisEngine();

export async function GET(req: NextRequest) {
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

  // ── Try cache first ───────────────────────────────────────────────────────────
  const cached = await db.kundliProfile.findUnique({ where: { userId: uid } });

  let doshas:        DoshaReport;
  let yogas:         YogaReport;
  let rahuLongitude: number;
  let ketuLongitude: number;
  let summary:       string;
  let isCached:      boolean;

  if (cached) {
    doshas        = cached.doshaData as unknown as DoshaReport;
    yogas         = cached.yogaData  as unknown as YogaReport;
    rahuLongitude = cached.rahuLongitude;
    ketuLongitude = cached.ketuLongitude;
    summary       = cached.summary;
    isCached      = true;
  } else {
    // ── Fresh computation ────────────────────────────────────────────────────────
    const chart    = astro.getVedicChart(birthData.dateOfBirth, birthData.latitude, birthData.longitude);
    const analysis = await kundli.analyse(chart);

    doshas        = analysis.doshas;
    yogas         = analysis.yogas;
    rahuLongitude = analysis.rahuLongitude;
    ketuLongitude = analysis.ketuLongitude;
    summary       = analysis.summary;
    isCached      = false;

    // ── Seed remedy tracker on first call ────────────────────────────────────────
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
  }

  // ── Fetch DB remedy records (with live isCompleted state) ─────────────────────
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
    doshas,
    yogas,
    rahuLongitude,
    ketuLongitude,
    summary,
    remedies:    trackedRemedies,
    cached:      isCached,
    savedAt:     cached?.calculatedAt ?? null,
  });
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function capitalise(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
