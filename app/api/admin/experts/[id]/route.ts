import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

interface PatchBody {
  action: 'approve' | 'reject';
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: uid } });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { action } = body;
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const profileId = params.id;

  const existingProfile = await db.expertProfile.findUnique({ where: { id: profileId } });
  if (!existingProfile) {
    return NextResponse.json({ error: 'Expert profile not found' }, { status: 404 });
  }

  if (action === 'approve') {
    const profile = await db.$transaction(async (tx) => {
      const updated = await tx.expertProfile.update({
        where: { id: profileId },
        data: { status: 'APPROVED', payoutsEnabled: true },
      });
      await tx.user.update({
        where: { id: existingProfile.userId },
        data: { role: 'EXPERT' },
      });
      return updated;
    });
    return NextResponse.json(profile);
  } else {
    const profile = await db.expertProfile.update({
      where: { id: profileId },
      data: { status: 'REJECTED' },
    });
    return NextResponse.json(profile);
  }
}
