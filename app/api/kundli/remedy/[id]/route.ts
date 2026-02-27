/**
 * PATCH /api/kundli/remedy/[id]
 *
 * Toggles the `isCompleted` flag on a single Remedy row.
 * The route flips whatever the current value is, so the client
 * can use the same endpoint for both "mark done" and "mark undone".
 *
 * Returns the updated remedy record.
 *
 * Requires: `cosmo_uid` httpOnly cookie.
 * Returns 401 if unauthenticated, 404 if the remedy doesn't exist
 * or belongs to a different user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db }                        from '@/lib/db';

export async function PATCH(
  req:     NextRequest,
  { params }: { params: { id: string } },
) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = params;

  // ── Fetch & ownership check ──────────────────────────────────────────────────
  const remedy = await db.remedy.findUnique({
    where:  { id },
    select: { id: true, userId: true, isCompleted: true },
  });

  if (!remedy || remedy.userId !== uid) {
    return NextResponse.json({ error: 'Remedy not found' }, { status: 404 });
  }

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const updated = await db.remedy.update({
    where: { id },
    data:  { isCompleted: !remedy.isCompleted },
    select: {
      id:          true,
      planet:      true,
      type:        true,
      description: true,
      isCompleted: true,
      createdAt:   true,
    },
  });

  return NextResponse.json(updated);
}
