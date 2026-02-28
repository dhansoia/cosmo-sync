'use client';

import { SIGN_ABBR, SIGN_SYMBOLS } from '@/lib/kundli/VedicCalc';

interface PlanetEntry {
  abbr:         string;
  signIndex:    number;
  isRetrograde: boolean;
}

interface Props {
  entries:        PlanetEntry[];
  lagnaSignIndex: number;
  title?:         string;
}

// [cssGridRow, cssGridCol] (1-indexed) for sign indices 0–11
// Aries at top-second, going clockwise to Pisces at top-first
const SIGN_POS: [number, number][] = [
  [1,2],[1,3],[1,4],   // 0 Aries, 1 Taurus, 2 Gemini
  [2,4],[3,4],[4,4],   // 3 Cancer, 4 Leo, 5 Virgo
  [4,3],[4,2],[4,1],   // 6 Libra, 7 Scorpio, 8 Sagittarius
  [3,1],[2,1],[1,1],   // 9 Capricorn, 10 Aquarius, 11 Pisces
];

// Corner cells get a diagonal line (traditional South Indian marker)
const CORNERS = new Set([2, 5, 8, 11]); // Gemini, Virgo, Sagittarius, Pisces

// Angular house colours
const ANGULAR: Record<number, { text: string; glow: string }> = {
  1:  { text: '#fbbf24', glow: 'rgba(251,191,36,0.08)'  }, // amber  – Lagna
  4:  { text: '#34d399', glow: 'rgba(52,211,153,0.05)'  }, // emerald
  7:  { text: '#38bdf8', glow: 'rgba(56,189,248,0.05)'  }, // sky
  10: { text: '#f87171', glow: 'rgba(248,113,113,0.05)' }, // rose
};

export function SouthIndianChart({ entries, lagnaSignIndex, title }: Props) {
  // Group planets by sign
  const bySign = new Map<number, PlanetEntry[]>();
  for (const e of entries) {
    if (!bySign.has(e.signIndex)) bySign.set(e.signIndex, []);
    bySign.get(e.signIndex)!.push(e);
  }

  function houseNum(si: number): number {
    return ((si - lagnaSignIndex + 12) % 12) + 1;
  }

  return (
    <div className="w-full max-w-[400px] mx-auto select-none">
      {/* Outer glow wrapper */}
      <div className="relative rounded-xl p-px"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)' }}
      >
        {/* 4×4 CSS Grid */}
        <div
          className="relative w-full rounded-xl overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridTemplateRows: 'repeat(4, 1fr)',
            aspectRatio: '1 / 1',
            background: 'rgba(8, 8, 18, 0.95)',
          }}
        >
          {/* 12 sign cells */}
          {Array.from({ length: 12 }, (_, si) => {
            const [gridRow, gridCol] = SIGN_POS[si];
            const h        = houseNum(si);
            const isLagna  = h === 1;
            const isCorner = CORNERS.has(si);
            const planets  = bySign.get(si) ?? [];
            const ang      = ANGULAR[h];

            return (
              <div
                key={si}
                className="relative overflow-hidden flex flex-col p-1.5"
                style={{
                  gridColumn:      gridCol,
                  gridRow:         gridRow,
                  backgroundColor: ang?.glow ?? 'transparent',
                  borderRight:     '1px solid rgba(255,255,255,0.06)',
                  borderBottom:    '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {/* Diagonal line for corner cells */}
                {isCorner && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <line
                      x1="0" y1="0" x2="100" y2="100"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="1.2"
                    />
                  </svg>
                )}

                {/* House number (top-left) + sign symbol (top-right) */}
                <div className="flex items-start justify-between leading-none relative z-10">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: ang?.text ?? 'rgba(255,255,255,0.25)' }}
                  >
                    {h}
                  </span>
                  <span className="text-[10px]" style={{ opacity: 0.18 }}>
                    {SIGN_SYMBOLS[si]}
                  </span>
                </div>

                {/* Sign abbreviation (just below house number) */}
                <div
                  className="text-[8px] leading-none mt-px relative z-10"
                  style={{ color: 'rgba(255,255,255,0.15)' }}
                >
                  {SIGN_ABBR[si]}
                </div>

                {/* Lagna "Asc" badge */}
                {isLagna && (
                  <div
                    className="text-[8px] font-bold leading-none mt-0.5 tracking-widest relative z-10"
                    style={{ color: '#fbbf24', opacity: 0.7 }}
                  >
                    ASC
                  </div>
                )}

                {/* Planet abbreviations — anchored to cell bottom */}
                <div className="mt-auto flex flex-wrap gap-x-[3px] gap-y-0 relative z-10">
                  {planets.map((p) => (
                    <span
                      key={p.abbr + si}
                      className="leading-[1.45] font-semibold"
                      style={{
                        fontSize:    '11px',
                        color:       isLagna ? '#fde68a' : 'rgba(255,255,255,0.82)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {p.abbr}{p.isRetrograde ? 'R' : ''}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Center 2×2 — chart label */}
          <div
            className="flex flex-col items-center justify-center"
            style={{
              gridColumn:      '2 / 4',
              gridRow:         '2 / 4',
              background:      'rgba(0,0,0,0.35)',
              borderRight:     '1px solid rgba(255,255,255,0.06)',
              borderBottom:    '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Decorative diamond */}
            <div
              className="mb-1.5"
              style={{
                width: 14, height: 14,
                border: '1px solid rgba(255,255,255,0.08)',
                transform: 'rotate(45deg)',
              }}
            />
            <span
              className="text-[10px] text-center tracking-widest uppercase font-medium"
              style={{ color: 'rgba(255,255,255,0.10)', letterSpacing: '0.15em' }}
            >
              {title ?? 'Kundli'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
