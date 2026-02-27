'use client';

import { useEffect, useState, useCallback } from 'react';

interface MoodEntry {
  id:             string;
  rating:         number;
  note:           string | null;
  moonPhaseAtTime: string;
  aiInsight:      string | null;
  transitSummary: string | null;
  createdAt:      string;
}

interface TransitSnap {
  moonSign?:  string;
  moonHouse?: number;
  moonPhase?: string;
}

const STARS  = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const RATING_COLOR: Record<number, string> = {
  1: 'text-red-400',
  2: 'text-orange-400',
  3: 'text-yellow-400',
  4: 'text-lime-400',
  5: 'text-green-400',
};

interface PastEntriesProps {
  /** Increment to trigger a reload (bumped by JournalForm after save) */
  refreshKey: number;
}

export function PastEntries({ refreshKey }: PastEntriesProps) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/journal?limit=10');
      const data = await res.json() as { entries: MoodEntry[] };
      setEntries(data.entries ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/3 p-5 animate-pulse">
            <div className="h-3 bg-white/10 rounded w-1/3 mb-3" />
            <div className="h-2 bg-white/8 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-white/25 text-sm text-center py-6">
        Your journal is empty — log your first mood above.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const date = new Date(entry.createdAt);
        const snap = entry.transitSummary
          ? JSON.parse(entry.transitSummary) as TransitSnap
          : null;

        return (
          <div
            key={entry.id}
            className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <p className={`font-mono text-sm tracking-wide ${RATING_COLOR[entry.rating]}`}>
                  {STARS(entry.rating)}
                </p>
                <p className="text-white/25 text-xs">
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Moon snapshot */}
              {snap?.moonSign && (
                <div className="text-right space-y-0.5">
                  <p className="text-white/50 text-xs">
                    ☽ {snap.moonSign}
                    {snap.moonHouse ? ` · ${ORDINAL[snap.moonHouse] ?? snap.moonHouse} house` : ''}
                  </p>
                  <p className="text-white/25 text-xs">{snap.moonPhase ?? entry.moonPhaseAtTime}</p>
                </div>
              )}
            </div>

            {/* User note */}
            {entry.note && (
              <p className="text-white/55 text-sm leading-relaxed border-l-2 border-white/10 pl-3">
                {entry.note}
              </p>
            )}

            {/* AI insight */}
            {entry.aiInsight && (
              <div className="pt-2 border-t border-white/6 space-y-1">
                <p className="text-white/25 text-xs uppercase tracking-widest">✦ Insight</p>
                <p className="text-white/50 text-sm leading-relaxed line-clamp-3">
                  {entry.aiInsight}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
