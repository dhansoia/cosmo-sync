/**
 * POST /api/auth/register
 *
 * Body: { email, password }
 *
 * Creates a new User with a bcrypt-hashed password.
 * Sets the cosmo_uid httpOnly cookie on success.
 * If the request already has a valid cosmo_uid (anonymous draft user),
 * that user is upgraded in-place (email + password attached).
 *
 * Returns: { userId }
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email    = (body.email    ?? '').trim().toLowerCase();
  const password = (body.password ?? '').trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Check if email already taken
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // If an anonymous draft user exists from a prior onboarding session, upgrade it
  const existingUid = req.cookies.get('cosmo_uid')?.value;
  let userId: string;

  if (existingUid) {
    const draft = await db.user.findUnique({
      where:  { id: existingUid },
      select: { id: true, email: true },
    });
    if (draft && draft.email.startsWith('draft_')) {
      // Upgrade the draft user in-place
      await db.user.update({
        where: { id: existingUid },
        data:  { email, passwordHash },
      });
      userId = existingUid;
    } else {
      userId = await createUser(email, passwordHash);
    }
  } else {
    userId = await createUser(email, passwordHash);
  }

  const res = NextResponse.json({ userId });
  res.cookies.set('cosmo_uid', userId, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 365,
  });
  return res;
}

async function createUser(email: string, passwordHash: string): Promise<string> {
  const user = await db.user.create({
    data: { email, passwordHash },
    select: { id: true },
  });
  return user.id;
}
