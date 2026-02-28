/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 *
 * Verifies credentials and sets the cosmo_uid cookie.
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

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where:  { email },
    select: { id: true, passwordHash: true },
  });

  // Constant-time comparison even when user doesn't exist
  const hash  = user?.passwordHash ?? '$2a$12$invalidhashfortimingnnnnnnnnnnnnnnnnnnnnn';
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const res = NextResponse.json({ userId: user.id });
  res.cookies.set('cosmo_uid', user.id, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 365,
  });
  return res;
}
