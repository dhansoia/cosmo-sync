'use client';

/**
 * DailyJournal — client-side orchestrator for the journal page.
 *
 * Layout:
 *   1. Transit summary (fetched from /api/transits/today)
 *   2. Mood check-in form + insight reveal
 *   3. Past entries
 */

import { useEffect, useState } from 'react';
import { TransitBadge } from './TransitBadge';
import { JournalForm }  from './JournalForm';
import { PastEntries }  from './PastEntries';
import type { TransitReport } from '@/lib/transits';

type TransitState = 'loading' | 'ready' | 'error' | 'no-data';

export function DailyJournal() {
  const [report,     setReport]     = useState<TransitReport | null>(null);
  const [transitState, setTransitState] = useState<TransitState>('loading');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchTransits() {
      try {
        const res = await fetch('/api/transits/today');
        if (res.status === 404) { setTransitState('no-data'); return; }
        if (!res.ok)            { setTransitState('error');   return; }
        const data = await res.json() as TransitReport;
        setReport(data);
        setTransitState('ready');
      } catch {
        setTransitState('error');
      }
    }
    void fetchTransits();
  }, []);

  function handleSaved() {
    setRefreshKey((k) => k + 1);
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">

      {/* Date header */}
      <div className="text-center space-y-1">
        <p className="text-white/30 text-xs uppercase tracking-widest">{today}</p>
        <h2 className="text-white text-2xl font-semibold tracking-tight">Daily Transit</h2>
        <p className="text-white/35 text-sm">Your cosmic weather check-in</p>
      </div>

      {/* ── Transit summary ───────────────────────────────────────────────────── */}
      {transitState === 'loading' && (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-5 animate-pulse space-y-3">
          <div className="h-3 bg-white/10 rounded w-1/2" />
          <div className="h-3 bg-white/8  rounded w-2/3" />
          <div className="h-3 bg-white/6  rounded w-1/3" />
        </div>
      )}

      {transitState === 'ready' && report && (
        <TransitBadge report={report} />
      )}

      {transitState === 'error' && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm text-center">
          Could not load transit data. Please check your connection.
        </div>
      )}

      {transitState === 'no-data' && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-amber-400 text-sm text-center">
          No birth data found.{' '}
          <a href="/onboarding" className="underline hover:text-amber-300">
            Complete your onboarding
          </a>{' '}
          to enable personalised transits.
        </div>
      )}

      {/* ── Mood form ─────────────────────────────────────────────────────────── */}
      <JournalForm onSaved={handleSaved} />

      {/* ── Past entries ──────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-white/50 text-xs uppercase tracking-widest">Recent entries</h3>
          <div className="flex-1 h-px bg-white/8" />
        </div>
        <PastEntries refreshKey={refreshKey} />
      </section>
    </div>
  );
}
