/**
 * GET /api/academy/lessons
 *
 * Returns all lessons enriched with the authenticated user's progress.
 * Seeds lesson records into the DB on first call (idempotent upsert).
 *
 * Response shape:
 * {
 *   lessons: LessonWithProgress[];
 *   totalStardust: number;
 *   completedCount: number;
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LESSONS } from '@/lib/academy/content';
import type { LessonTopic } from '@prisma/client';

export interface LessonProgress {
  isCompleted:    boolean;
  bestScore:      number;
  totalQuestions: number;
  stardustEarned: number;
  attempts:       number;
}

export interface LessonWithProgress {
  id:             string;
  slug:           string;
  title:          string;
  description:    string;
  topic:          LessonTopic;
  level:          number;
  emoji:          string;
  stardustReward: number;
  isUnlocked:     boolean;
  progress:       LessonProgress | null;
}

export async function GET(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ── 1. Seed lesson records if DB is missing any ──────────────────────────
  const existingCount = await db.lesson.count();
  if (existingCount < LESSONS.length) {
    await Promise.all(
      LESSONS.map((l) =>
        db.lesson.upsert({
          where:  { slug: l.slug },
          create: {
            slug:           l.slug,
            title:          l.title,
            description:    l.description,
            level:          l.level,
            topic:          l.topic,
            emoji:          l.emoji,
            stardustReward: l.stardustReward,
          },
          update: {}, // content is source-of-truth in code, not DB
        }),
      ),
    );
  }

  // ── 2. Fetch all lessons + user progress in two queries ──────────────────
  const [dbLessons, progresses] = await Promise.all([
    db.lesson.findMany({ orderBy: [{ level: 'asc' }, { topic: 'asc' }] }),
    db.lessonProgress.findMany({ where: { userId: uid } }),
  ]);

  const progressByLesson = new Map(progresses.map((p) => [p.lessonId, p]));

  // ── 3. Determine which levels are completed (for unlock logic) ───────────
  const completedLevels = new Set<number>();
  for (const p of progresses) {
    if (p.completedAt !== null) {
      const lesson = dbLessons.find((l) => l.id === p.lessonId);
      if (lesson) completedLevels.add(lesson.level);
    }
  }

  // ── 4. Build response ────────────────────────────────────────────────────
  const lessons: LessonWithProgress[] = dbLessons.map((lesson) => {
    const isUnlocked = lesson.level === 1 || completedLevels.has(lesson.level - 1);
    const p          = progressByLesson.get(lesson.id) ?? null;

    return {
      id:             lesson.id,
      slug:           lesson.slug,
      title:          lesson.title,
      description:    lesson.description,
      topic:          lesson.topic,
      level:          lesson.level,
      emoji:          lesson.emoji,
      stardustReward: lesson.stardustReward,
      isUnlocked,
      progress: p
        ? {
            isCompleted:    p.completedAt !== null,
            bestScore:      p.bestScore,
            totalQuestions: 5,
            stardustEarned: p.stardustEarned,
            attempts:       p.attempts,
          }
        : null,
    };
  });

  const totalStardust = progresses.reduce((sum, p) => sum + p.stardustEarned, 0);
  const completedCount = progresses.filter((p) => p.completedAt !== null).length;

  return NextResponse.json({ lessons, totalStardust, completedCount });
}
