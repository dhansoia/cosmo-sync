import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Specialty } from '@prisma/client';
import type { ExpertPublicProfile } from '@/lib/marketplace/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const specialty = searchParams.get('specialty') as Specialty | null;

  const where = {
    status: 'APPROVED' as const,
    payoutsEnabled: true,
    ...(specialty ? { specialties: { has: specialty } } : {}),
  };

  const profiles = await db.expertProfile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      displayName: true,
      bio: true,
      specialties: true,
      ratePerMinute: true,
      avatarUrl: true,
      yearsExperience: true,
    },
  });

  return NextResponse.json(profiles as ExpertPublicProfile[]);
}
