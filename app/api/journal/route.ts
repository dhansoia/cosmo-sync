/**
 * Journal API Routes
 *
 * POST /api/journal
 *   Body: { rating: number (1-5); note?: string }
 *   - Computes today's transit report
 *   - Generates Claude insight
 *   - Saves MoodLog to database
 *   - Returns { entry, insight }
 *
 * GET /api/journal?limit=<n>
 *   - Returns the user's recent MoodLog entries (default: last 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateTransitReport } from '@/lib/transits';
import { generateInsight } from '@/lib/insight';

// ─── POST — save mood + generate insight ─────────────────────────────────────

export async function POST(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { rating: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { rating, note } = body;
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be 1–5' }, { status: 400 });
  }

  const birthData = await db.birthData.findUnique({ where: { userId: uid } });
  if (!birthData) {
    return NextResponse.json({ error: 'No birth data on file' }, { status: 404 });
  }

  // 1. Compute transits
  const report = calculateTransitReport(
    birthData.dateOfBirth,
    birthData.latitude,
    birthData.longitude,
  );

  // 2. Generate Claude insight
  const insight = await generateInsight(report, rating, note ?? null);

  // 3. Persist to database
  const entry = await db.moodLog.create({
    data: {
      userId:          uid,
      rating,
      note:            note ?? null,
      moonPhaseAtTime: report.moonPhase.name,
      aiInsight:       insight,
      transitSummary:  JSON.stringify({
        moonSign:  report.transitMoon.sign,
        moonHouse: report.transitMoon.house,
        moonPhase: report.moonPhase.name,
        aspects:   report.aspects.slice(0, 3),
      }),
    },
  });

  return NextResponse.json({ entry, insight });
}

// ─── GET — fetch recent entries ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit      = Math.min(parseInt(limitParam ?? '10', 10), 50);

  const entries = await db.moodLog.findMany({
    where:   { userId: uid },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  });

  return NextResponse.json({ entries });
}
