'use client';

import type { LessonWithProgress } from '@/app/api/academy/lessons/route';

interface LessonCardProps {
  lesson:  LessonWithProgress;
  onStart: (lesson: LessonWithProgress) => void;
}

const LEVEL_LABEL: Record<number, string> = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };
const LEVEL_COLOR: Record<number, string> = {
  1: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  2: 'text-sky-400    bg-sky-400/10    border-sky-400/20',
  3: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  4: 'text-amber-400  bg-amber-400/10  border-amber-400/20',
};

export function LessonCard({ lesson, onStart }: LessonCardProps) {
  const { progress, isUnlocked } = lesson;
  const isCompleted = progress?.isCompleted ?? false;

  // Score bar width (0–100%)
  const scorePercent = progress ? (progress.bestScore / progress.totalQuestions) * 100 : 0;

  return (
    <div
      className={`
        relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-200
        ${isUnlocked
          ? 'border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/6'
          : 'border-white/6  bg-white/2 opacity-60'}
      `}
    >
      {/* Completed badge */}
      {isCompleted && (
        <span className="absolute top-4 right-4 text-emerald-400 text-sm font-medium flex items-center gap-1">
          ✓ <span className="text-xs text-emerald-400/70">Done</span>
        </span>
      )}

      {/* Lock overlay icon */}
      {!isUnlocked && (
        <span className="absolute top-4 right-4 text-white/20 text-xl">🔒</span>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>{lesson.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-white font-semibold text-base leading-tight">{lesson.title}</h3>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded-full border text-xs ${LEVEL_COLOR[lesson.level]}`}>
            {LEVEL_LABEL[lesson.level] ?? `Level ${lesson.level}`}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-white/45 text-sm leading-relaxed">{lesson.description}</p>

      {/* Score bar (shown if attempted) */}
      {progress && progress.attempts > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Best score</span>
            <span>{progress.bestScore}/{progress.totalQuestions}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        {/* Stardust reward */}
        <p className="text-amber-400/70 text-xs flex items-center gap-1">
          <span>✦</span>
          {isCompleted
            ? <span className="text-amber-400">{progress!.stardustEarned} earned</span>
            : <span>{lesson.stardustReward} Stardust</span>
          }
        </p>

        {/* Action button */}
        {isUnlocked ? (
          <button
            type="button"
            onClick={() => onStart(lesson)}
            className={`
              px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${isCompleted
                ? 'border border-white/15 text-white/50 hover:text-white/80 hover:border-white/30'
                : 'bg-white text-black hover:bg-white/90'}
            `}
          >
            {isCompleted ? 'Replay' : progress ? 'Retry' : 'Start'}
          </button>
        ) : (
          <p className="text-white/20 text-xs">Complete Level {lesson.level - 1} first</p>
        )}
      </div>
    </div>
  );
}
