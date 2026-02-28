'use client';

import { GRID_SIGN, SIGN_ABBR } from '@/lib/kundli/VedicCalc';

interface PlanetEntry {
  abbr:         string;
  signIndex:    number;
  isRetrograde: boolean;
  isLagna?:     boolean;
}

interface SouthIndianChartProps {
  /** Entries to place in the chart cells */
  entries:        PlanetEntry[];
  /** Sign index (0–11) that is the first house (Lagna) */
  lagnaSignIndex: number;
  title?:         string;
}

const CELL_COLORS: Record<number, string> = {
  1:  'text-orange-300',
  4:  'text-emerald-300',
  7:  'text-sky-300',
  10: 'text-rose-300',
};

function houseColor(h: number): string {
  return CELL_COLORS[h] ?? 'text-white/50';
}

export function SouthIndianChart({ entries, lagnaSignIndex, title }: SouthIndianChartProps) {
  // Group entries by signIndex
  const bySign: Map<number, PlanetEntry[]> = new Map();
  for (const e of entries) {
    if (!bySign.has(e.signIndex)) bySign.set(e.signIndex, []);
    bySign.get(e.signIndex)!.push(e);
  }

  function houseNum(si: number): number {
    return ((si - lagnaSignIndex + 12) % 12) + 1;
  }

  function renderCell(row: number, col: number) {
    const si = GRID_SIGN[row][col];
    if (si === -1) {
      // Centre cell
      return (
        <td
          key={`${row}-${col}`}
          rowSpan={row < 2 ? (col < 2 ? 2 : 1) : 1}
          colSpan={row < 2 ? (col < 2 ? 2 : 1) : 1}
          className="border border-white/10 bg-[#080810]"
        >
          {row === 1 && col === 1 && (
            <div className="flex items-center justify-center h-full min-h-[60px]">
              <span className="text-white/15 text-xs text-center leading-tight px-2">
                {title ?? 'South Indian'}
              </span>
            </div>
          )}
        </td>
      );
    }

    const hn       = houseNum(si);
    const isLagna  = hn === 1;
    const planetsHere = bySign.get(si) ?? [];

    return (
      <td
        key={`${row}-${col}`}
        className={`
          border border-white/10 p-1.5 align-top w-[25%]
          ${isLagna ? 'bg-white/[0.05]' : 'bg-transparent'}
          transition-colors
        `}
        style={{ minWidth: 0, minHeight: 72 }}
      >
        <div className="flex flex-col gap-0.5 h-full min-h-[68px]">
          {/* House number + sign abbr */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-semibold ${houseColor(hn)}`}>{hn}</span>
            <span className="text-[9px] text-white/20">{SIGN_ABBR[si]}</span>
          </div>

          {/* Lagna marker */}
          {isLagna && (
            <span className="text-[9px] text-orange-400/80 font-medium">Lg</span>
          )}

          {/* Planets */}
          <div className="flex flex-wrap gap-x-1 gap-y-0.5 mt-auto">
            {planetsHere.map((p) => (
              <span
                key={p.abbr + p.signIndex}
                className="text-[11px] text-white/75 leading-tight font-medium"
              >
                {p.abbr}{p.isRetrograde && !['rahu','ketu'].includes(p.abbr.toLowerCase()) ? 'R' : ''}
              </span>
            ))}
          </div>
        </div>
      </td>
    );
  }

  // Render 4×4 grid, skipping inner centre cells (handled by rowSpan/colSpan)
  const skipCells = new Set(['1-1','1-2','2-1','2-2']);

  return (
    <div className="w-full max-w-xs mx-auto">
      <table className="w-full border-collapse border border-white/10 rounded-xl overflow-hidden">
        <tbody>
          {[0,1,2,3].map((row) => (
            <tr key={row}>
              {[0,1,2,3].map((col) => {
                const key = `${row}-${col}`;
                if (skipCells.has(key)) return null;
                // Only render centre once (at 1-1)
                if (GRID_SIGN[row][col] === -1 && !(row === 1 && col === 1)) return null;
                return renderCell(row, col);
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
