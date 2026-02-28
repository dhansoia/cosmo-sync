/**
 * GET /api/admin/stats
 *
 * Returns platform-wide stats for the admin dashboard.
 * Requires ADMIN role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [
    totalUsers,
    usersWithBirthData,
    pendingExperts,
    approvedExperts,
    totalSessions,
    paidSessions,
    totalMoodLogs,
    kundliProfiles,
    stardustResult,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.birthData.count(),
    db.expertProfile.count({ where: { status: 'PENDING' } }),
    db.expertProfile.count({ where: { status: 'APPROVED' } }),
    db.session.count(),
    db.session.count({ where: { status: 'PAID' } }),
    db.moodLog.count(),
    db.kundliProfile.count(),
    db.lessonProgress.aggregate({ _sum: { stardustEarned: true } }),
    db.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, role: true, createdAt: true, displayName: true },
    }),
  ]);

  const totalStardust = stardustResult._sum.stardustEarned ?? 0;

  return NextResponse.json({
    users: {
      total: totalUsers,
      withBirthData: usersWithBirthData,
    },
    experts: {
      pending: pendingExperts,
      approved: approvedExperts,
    },
    sessions: {
      total: totalSessions,
      paid: paidSessions,
    },
    journal: {
      totalEntries: totalMoodLogs,
    },
    kundli: {
      savedProfiles: kundliProfiles,
    },
    academy: {
      totalStardust,
    },
    recentUsers,
  });
}
