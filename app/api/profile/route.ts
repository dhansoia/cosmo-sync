/**
 * GET /api/profile  — fetch current user's profile
 * PATCH /api/profile — update displayName / bio
 *
 * Requires: cosmo_uid cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db }          from '@/lib/db';
import { AstroEngine } from '@/lib/astro';

const astro = new AstroEngine();

export async function GET(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: uid },
    select: {
      id:          true,
      email:       true,
      displayName: true,
      bio:         true,
      role:        true,
      createdAt:   true,
      birthData:   true,
      astroProfile: {
        select: {
          westernSun: true, westernMoon: true, westernRising: true,
          vedicSun:   true, vedicMoon:   true, vedicRising:   true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // If astroProfile missing but birth data exists, compute Big 3 on-the-fly
  let bigThree = user.astroProfile ?? null;

  if (!bigThree && user.birthData) {
    const bd  = user.birthData;
    const w   = astro.getBigThree(bd.dateOfBirth.toISOString(), bd.latitude, bd.longitude);
    const vc  = astro.getVedicChart(bd.dateOfBirth.toISOString(), bd.latitude, bd.longitude);
    const va  = vc.houses.ascendant;
    const vSignIdx = Math.floor(((va % 360) + 360) % 360 / 30);
    const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

    bigThree = {
      westernSun:    w.sun,
      westernMoon:   w.moon,
      westernRising: w.rising,
      vedicSun:      vc.planets.sun.sign,
      vedicMoon:     vc.planets.moon.sign,
      vedicRising:   SIGNS[vSignIdx],
    };
  }

  return NextResponse.json({
    id:          user.id,
    email:       user.email,
    displayName: user.displayName,
    bio:         user.bio,
    role:        user.role,
    joinedAt:    user.createdAt,
    birthData:   user.birthData
      ? {
          dateOfBirth:       user.birthData.dateOfBirth,
          timezone:          user.birthData.timezone,
          isTimeApproximate: user.birthData.isTimeApproximate,
          latitude:          user.birthData.latitude,
          longitude:         user.birthData.longitude,
        }
      : null,
    bigThree,
  });
}

export async function PATCH(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: { displayName?: string; bio?: string };
  try {
    body = await req.json() as { displayName?: string; bio?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: { displayName?: string; bio?: string } = {};

  if (typeof body.displayName === 'string') {
    const name = body.displayName.trim().slice(0, 60);
    data.displayName = name || null as unknown as string;
  }
  if (typeof body.bio === 'string') {
    const bio = body.bio.trim().slice(0, 500);
    data.bio = bio || null as unknown as string;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: uid },
    data,
    select: { displayName: true, bio: true },
  });

  return NextResponse.json(updated);
}
