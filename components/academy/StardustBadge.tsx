'use client';

import { useEffect, useRef, useState } from 'react';

interface StardustBadgeProps {
  total:     number;
  completed: number;
  total_lessons: number;
}

/** Animates a number counter from 0 → target on mount. */
function useCountUp(target: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

export function StardustBadge({ total, completed, total_lessons }: StardustBadgeProps) {
  const animated = useCountUp(total, 900);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent p-5 flex items-center gap-5">

      {/* Stardust total */}
      <div className="flex items-center gap-3 flex-1">
        <span className="text-3xl" aria-hidden>✦</span>
        <div>
          <p className="text-amber-300 text-2xl font-bold tracking-tight tabular-nums">
            {animated.toLocaleString()}
          </p>
          <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">Stardust</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-white/10" />

      {/* Lesson progress */}
      <div className="text-right">
        <p className="text-white text-xl font-semibold">
          {completed}
          <span className="text-white/30 text-sm font-normal">/{total_lessons}</span>
        </p>
        <p className="text-white/40 text-xs uppercase tracking-widest mt-0.5">Lessons</p>
      </div>
    </div>
  );
}
