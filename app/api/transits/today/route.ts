/**
 * GET /api/transits/today
 *
 * Returns the current transit report for the authenticated user:
 *   • Transit Moon sign, house (in natal chart), phase
 *   • Aspects: transit Moon vs natal planets (sorted by orb)
 *   • Natal positions snapshot for Claude context
 *
 * Requires `cosmo_uid` httpOnly cookie (set during onboarding).
 * Returns 401 if no cookie, 404 if no BirthData found.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateTransitReport } from '@/lib/transits';

export async function GET(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const birthData = await db.birthData.findUnique({ where: { userId: uid } });
  if (!birthData) {
    return NextResponse.json({ error: 'No birth data on file' }, { status: 404 });
  }

  const report = calculateTransitReport(
    birthData.dateOfBirth,
    birthData.latitude,
    birthData.longitude,
  );

  // Cache for 10 minutes — Moon moves ~0.5° in that time, negligible for journalling
  return NextResponse.json(report, {
    headers: { 'Cache-Control': 'private, max-age=600' },
  });
}
