/**
 * POST /api/auth/logout
 *
 * Clears the cosmo_uid cookie.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('cosmo_uid', '', {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   0,
  });
  return res;
}
