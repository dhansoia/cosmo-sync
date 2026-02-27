'use client';

import { useEffect, useRef, useState } from 'react';

interface ScoreRingProps {
  score:  number;   // 0–100
  label:  string;
  size?:  number;   // px, default 100
  stroke?: number;  // stroke width, default 8
}

const COLOR_AT = (score: number) =>
  score >= 75 ? '#34d399' :  // emerald
  score >= 55 ? '#a3e635' :  // lime
  score >= 38 ? '#fbbf24' :  // amber
                '#f87171';   // red

export function ScoreRing({ score, label, size = 100, stroke = 8 }: ScoreRingProps) {
  const [animated, setAnimated] = useState(0);
  const rafRef = useRef<number | null>(null);

  const r       = (size - stroke) / 2;
  const circ    = 2 * Math.PI * r;
  const dash    = (animated / 100) * circ;
  const color   = COLOR_AT(score);

  // Count-up animation on mount
  useEffect(() => {
    const start = performance.now();
    const dur   = 900;
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setAnimated(Math.round(e * score));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ - dash}`}
            style={{ transition: 'stroke 0.3s' }}
          />
        </svg>
        {/* Score number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold tabular-nums" style={{ color }}>
            {animated}
          </span>
        </div>
      </div>
      <p className="text-white/45 text-xs uppercase tracking-widest text-center">{label}</p>
    </div>
  );
}
