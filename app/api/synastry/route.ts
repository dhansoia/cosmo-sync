/**
 * POST /api/synastry
 *
 * Computes a full synastry report between the authenticated user and a
 * partner whose birth data is supplied in the request body.
 *
 * Body:
 *   partnerDate  — "YYYY-MM-DD"
 *   partnerTime  — "HH:MM" or "" (unknown)
 *   partnerLat   — number
 *   partnerLng   — number
 *   partnerName  — string (display only)
 *
 * Returns: SynastryReport (serialised JSON, no DB write in this phase —
 * Match persistence is added in Phase 4.1 when user profiles are available).
 */

import { NextRequest, NextResponse } from 'next/server';
import tzlookup from 'tz-lookup';
import { db } from '@/lib/db';
import { calculateSynastry } from '@/lib/synastry/engine';

const FALLBACK_TZ = 'UTC';

function toUtc(date: string, time: string, tz: string): Date {
  if (!time) return new Date(`${date}T12:00:00.000Z`);
  const naive = new Date(`${date}T${time}:00.000Z`);
  try {
    const localMs = new Date(naive.toLocaleString('en-US', { timeZone: tz })).getTime();
    const utcMs   = new Date(naive.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
    return new Date(naive.getTime() + (utcMs - localMs));
  } catch {
    return naive;
  }
}

export async function POST(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: {
    partnerDate: string;
    partnerTime: string;
    partnerLat:  number;
    partnerLng:  number;
    partnerName: string;
  };

  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { partnerDate, partnerTime, partnerLat, partnerLng } = body;
  if (!partnerDate || typeof partnerLat !== 'number' || typeof partnerLng !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // ── Fetch user's birth data ───────────────────────────────────────────────
  const birthData = await db.birthData.findUnique({ where: { userId: uid } });
  if (!birthData) {
    return NextResponse.json({ error: 'No birth data on file. Complete onboarding first.' }, { status: 404 });
  }

  // ── Resolve partner UTC datetime ──────────────────────────────────────────
  let partnerTz = FALLBACK_TZ;
  try { partnerTz = tzlookup(partnerLat, partnerLng) ?? FALLBACK_TZ; } catch { /* keep fallback */ }

  const partnerDob = toUtc(partnerDate, partnerTime ?? '', partnerTz);

  // ── Compute synastry ──────────────────────────────────────────────────────
  const report = calculateSynastry(
    { dateOfBirth: birthData.dateOfBirth, latitude: birthData.latitude, longitude: birthData.longitude },
    { dateOfBirth: partnerDob,            latitude: partnerLat,          longitude: partnerLng },
  );

  return NextResponse.json(report);
}
