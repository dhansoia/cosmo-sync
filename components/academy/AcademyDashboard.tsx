'use client';

/**
 * AcademyDashboard — client-side orchestrator for the CosmoAcademy page.
 *
 * Fetches lesson + progress data, renders the lesson grid grouped by level,
 * and manages the QuizModal overlay.
 */

import { useCallback, useEffect, useState } from 'react';
import { StardustBadge } from './StardustBadge';
import { LessonCard }    from './LessonCard';
import { QuizModal }     from './QuizModal';
import type { LessonWithProgress } from '@/app/api/academy/lessons/route';

interface LessonsResponse {
  lessons:        LessonWithProgress[];
  totalStardust:  number;
  completedCount: number;
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Level 1 — Foundations',
  2: 'Level 2 — Core Concepts',
  3: 'Level 3 — Advanced',
  4: 'Level 4 — Mastery',
};

export function AcademyDashboard() {
  const [data,        setData]        = useState<LessonsResponse | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [activeLesson, setActiveLesson] = useState<LessonWithProgress | null>(null);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/academy/lessons');
      const json = await res.json() as LessonsResponse;
      setData(json);
    } catch {
      // silently fail — skeleton stays up
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchLessons(); }, [fetchLessons]);

  function handleQuizClose(didPass: boolean) {
    setActiveLesson(null);
    if (didPass) {
      // Refresh to reflect newly earned stardust + unlocked lessons
      void fetchLessons();
    }
  }

  // Group lessons by level
  const byLevel = data
    ? data.lessons.reduce<Record<number, LessonWithProgress[]>>((acc, l) => {
        (acc[l.level] ??= []).push(l);
        return acc;
      }, {})
    : {};

  const levels = Object.keys(byLevel).map(Number).sort();

  return (
    <>
      {/* ── Quiz modal overlay ────────────────────────────────────────────── */}
      {activeLesson && (
        <QuizModal lesson={activeLesson} onClose={handleQuizClose} />
      )}

      <div className="w-full max-w-2xl mx-auto space-y-8">

        {/* ── Stardust summary ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="rounded-2xl border border-white/8 bg-white/3 h-20 animate-pulse" />
        ) : data ? (
          <StardustBadge
            total={data.totalStardust}
            completed={data.completedCount}
            total_lessons={data.lessons.length}
          />
        ) : null}

        {/* ── Lessons by level ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/3 h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {levels.map((level) => {
              const levelLessons = byLevel[level] ?? [];
              const anyUnlocked  = levelLessons.some((l) => l.isUnlocked);

              return (
                <section key={level} className="space-y-4">
                  {/* Level header */}
                  <div className="flex items-center gap-3">
                    <h2 className={`text-xs font-semibold uppercase tracking-widest ${anyUnlocked ? 'text-white/50' : 'text-white/20'}`}>
                      {LEVEL_TITLES[level] ?? `Level ${level}`}
                    </h2>
                    <div className="flex-1 h-px bg-white/8" />
                    {!anyUnlocked && (
                      <span className="text-white/20 text-xs">🔒 Locked</span>
                    )}
                  </div>

                  {/* Cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {levelLessons.map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onStart={setActiveLesson}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Empty state (no DB / not seeded yet) */}
        {!loading && (!data || data.lessons.length === 0) && (
          <p className="text-white/30 text-sm text-center py-12">
            No lessons found. Check your database connection.
          </p>
        )}
      </div>
    </>
  );
}
