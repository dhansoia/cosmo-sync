/**
 * POST /api/onboarding
 *
 * Body (JSON):
 *   birthDate         — ISO date string "YYYY-MM-DD"
 *   birthTime         — "HH:MM" (24-hour) or "" if unknown
 *   isTimeApproximate — boolean
 *   latitude          — number
 *   longitude         — number
 *   cityLabel         — human-readable city name (for display)
 *
 * Actions:
 *   1. Derive IANA timezone from lat/lng via tz-lookup
 *   2. Combine birthDate + birthTime → UTC DateTime
 *   3. Create anonymous User row (draft_<id>@cosmo.app) if not already present
 *   4. Upsert BirthData row
 *   5. Set httpOnly `cosmo_uid` cookie
 *
 * Returns: { userId: string; timezone: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import tzlookup from 'tz-lookup';
import { db } from '@/lib/db';

const FALLBACK_TZ = 'UTC';

function buildUtcDateTime(date: string, time: string, tz: string): Date {
  if (!time) {
    // No time provided — use noon UTC of that calendar date
    return new Date(`${date}T12:00:00.000Z`);
  }

  // Convert local time → UTC using the IANA timezone.
  // Strategy: parse as naive UTC, compute offset for that tz, shift.
  const naiveUtc = new Date(`${date}T${time}:00.000Z`);

  try {
    const localStr = naiveUtc.toLocaleString('en-US', { timeZone: tz });
    const utcStr   = naiveUtc.toLocaleString('en-US', { timeZone: 'UTC' });
    const offsetMs = new Date(utcStr).getTime() - new Date(localStr).getTime();
    return new Date(naiveUtc.getTime() + offsetMs);
  } catch {
    return naiveUtc;
  }
}

export async function POST(req: NextRequest) {
  let body: {
    birthDate: string;
    birthTime: string;
    isTimeApproximate: boolean;
    latitude: number;
    longitude: number;
    cityLabel: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { birthDate, birthTime, isTimeApproximate, latitude, longitude } = body;

  if (!birthDate || typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Timezone
  let timezone: string;
  try {
    timezone = tzlookup(latitude, longitude) ?? FALLBACK_TZ;
  } catch {
    timezone = FALLBACK_TZ;
  }

  // 2. UTC DateTime
  const dateOfBirth = buildUtcDateTime(birthDate, birthTime ?? '', timezone);

  // 3. Resolve userId — reuse existing anonymous user if cookie present
  const existingUid = req.cookies.get('cosmo_uid')?.value;
  let resolvedUserId: string | null = null;

  if (existingUid) {
    const found = await db.user.findUnique({ where: { id: existingUid }, select: { id: true } });
    if (found) resolvedUserId = found.id;
  }

  // 4. Upsert User + BirthData
  let finalUserId: string;

  if (resolvedUserId) {
    // User exists — just upsert birth data
    await db.birthData.upsert({
      where:  { userId: resolvedUserId },
      create: { userId: resolvedUserId, dateOfBirth, isTimeApproximate, latitude, longitude, timezone },
      update: { dateOfBirth, isTimeApproximate, latitude, longitude, timezone },
    });
    finalUserId = resolvedUserId;
  } else {
    // New anonymous user — generate ID upfront so email can reference it
    const newId = crypto.randomUUID();
    await db.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id:           newId,
          email:        `draft_${newId}@cosmo.app`,
          passwordHash: '',
        },
      });
      await tx.birthData.create({
        data: { userId: newId, dateOfBirth, isTimeApproximate, latitude, longitude, timezone },
      });
    });
    finalUserId = newId;
  }

  const response = NextResponse.json({ userId: finalUserId, timezone });

  response.cookies.set('cosmo_uid', finalUserId, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 365, // 1 year
  });

  return response;
}
