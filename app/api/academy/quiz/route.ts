/**
 * POST /api/academy/quiz
 *
 * Grade a quiz submission, update LessonProgress, and award Stardust.
 *
 * Body: { lessonId: string; answers: number[] }
 *   lessonId — the DB lesson ID (not slug)
 *   answers  — array of selectedIndex (0-based) per question, in order
 *
 * Response:
 * {
 *   score:          number;          // correct answers count
 *   total:          number;          // always 5
 *   passed:         boolean;         // score >= 4
 *   stardustEarned: number;          // awarded this submission
 *   results: { correct: boolean; correctIndex: number; explanation: string }[];
 *   progress: { bestScore; attempts; stardustEarned; isCompleted }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getLessonContent } from '@/lib/academy/content';

const PASS_MARK = 4; // out of 5 (80%)

export async function POST(req: NextRequest) {
  const uid = req.cookies.get('cosmo_uid')?.value;
  if (!uid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { lessonId: string; answers: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { lessonId, answers } = body;
  if (!lessonId || !Array.isArray(answers)) {
    return NextResponse.json({ error: 'lessonId and answers required' }, { status: 400 });
  }

  // ── Fetch lesson from DB ────────────────────────────────────────────────
  const lesson = await db.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  // ── Get static content (questions + correct answers) ────────────────────
  const content = getLessonContent(lesson.slug);
  if (!content) {
    return NextResponse.json({ error: 'Lesson content not found' }, { status: 404 });
  }

  const { questions } = content;
  if (answers.length !== questions.length) {
    return NextResponse.json(
      { error: `Expected ${questions.length} answers, got ${answers.length}` },
      { status: 400 },
    );
  }

  // ── Grade ────────────────────────────────────────────────────────────────
  const results = questions.map((q, i) => ({
    correct:      answers[i] === q.correctIndex,
    correctIndex: q.correctIndex,
    explanation:  q.explanation,
  }));

  const score  = results.filter((r) => r.correct).length;
  const passed = score >= PASS_MARK;

  // ── Load or create existing progress row ─────────────────────────────────
  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: uid, lessonId } },
  });

  const alreadyCompleted = existing?.completedAt !== null && existing?.completedAt !== undefined;
  const newBestScore     = Math.max(existing?.bestScore ?? 0, score);
  const stardustToAward  = !alreadyCompleted && passed ? lesson.stardustReward : 0;

  // ── Upsert progress ──────────────────────────────────────────────────────
  const updatedProgress = await db.lessonProgress.upsert({
    where:  { userId_lessonId: { userId: uid, lessonId } },
    create: {
      userId:        uid,
      lessonId,
      attempts:      1,
      bestScore:     score,
      completedAt:   passed ? new Date() : null,
      stardustEarned: stardustToAward,
    },
    update: {
      attempts:      { increment: 1 },
      bestScore:     newBestScore,
      // Only set completedAt if passing for the first time
      ...(passed && !alreadyCompleted ? { completedAt: new Date() } : {}),
      stardustEarned: { increment: stardustToAward },
    },
  });

  return NextResponse.json({
    score,
    total:   questions.length,
    passed,
    stardustEarned: stardustToAward,
    results,
    progress: {
      bestScore:      updatedProgress.bestScore,
      attempts:       updatedProgress.attempts,
      stardustEarned: updatedProgress.stardustEarned,
      isCompleted:    updatedProgress.completedAt !== null,
    },
  });
}
