import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import type { Specialty } from '@prisma/client';

interface ApplyBody {
  displayName: string;
  bio: string;
  specialties: Specialty[];
  ratePerMinute: number;
  avatarUrl?: string;
  yearsExperience?: number;
}

export async function POST(req: NextRequest) {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  let body: ApplyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { displayName, bio, specialties, ratePerMinute, avatarUrl, yearsExperience } = body;

  if (!displayName?.trim() || !bio?.trim()) {
    return NextResponse.json({ error: 'displayName and bio are required' }, { status: 400 });
  }
  if (!Array.isArray(specialties) || specialties.length < 1) {
    return NextResponse.json({ error: 'At least one specialty required' }, { status: 400 });
  }
  if (!ratePerMinute || ratePerMinute <= 0) {
    return NextResponse.json({ error: 'ratePerMinute must be > 0' }, { status: 400 });
  }

  // Check for existing application
  const existing = await db.expertProfile.findUnique({ where: { userId: uid } });
  if (existing && (existing.status === 'PENDING' || existing.status === 'APPROVED')) {
    return NextResponse.json({ error: 'Application already exists', status: existing.status }, { status: 409 });
  }

  const profile = await db.expertProfile.create({
    data: {
      userId: uid,
      displayName: displayName.trim(),
      bio: bio.trim(),
      specialties,
      ratePerMinute,
      avatarUrl: avatarUrl ?? null,
      yearsExperience: yearsExperience ?? null,
    },
  });

  return NextResponse.json({ expertProfileId: profile.id });
}
