'use client';

import { useEffect, useState, useCallback } from 'react';
import { DoshaCards }   from './DoshaCards';
import { YogaCards }    from './YogaCards';
import { RemedyTracker } from './RemedyTracker';

// ── Types mirroring the /api/kundli response ──────────────────────────────────

export type Remedy = {
  id:          string;
  planet:      string;
  type:        string;   // "Mantra" | "Ratna" | "Daan" | "Vrata"
  description: string;
  isCompleted: boolean;
  createdAt:   string;
};

export type KundliData = {
  doshas: {
    mangalDosha: {
      present:     boolean;
      marsHouse:   number;
      description: string;
    };
    kaalSarpDosha: {
      present:        boolean;
      rahuLongitude:  number;
      ketuLongitude:  number;
      trappedPlanets: string[];
      description:    string;
    };
    sadeSati: {
      present:     boolean;
      phase:       '12th' | '1st' | '2nd' | null;
      description: string;
    };
  };
  yogas: {
    gajakesariYoga: { present: boolean; name: string; description: string };
    budhadityaYoga: { present: boolean; name: string; description: string };
    rajYogas:       { present: boolean; name: string; description: string }[];
  };
  rahuLongitude: number;
  ketuLongitude: number;
  summary:       string;
  remedies:      Remedy[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNS   = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

function signLabel(lon: number): string {
  const norm = ((lon % 360) + 360) % 360;
  const idx  = Math.floor(norm / 30);
  const deg  = Math.floor(norm % 30);
  return `${SYMBOLS[idx]} ${deg}° ${SIGNS[idx]}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl bg-white/5 border border-white/8" />
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map((i) => <div key={i} className="h-40 rounded-2xl bg-white/5 border border-white/8" />)}
      </div>
      <div className="h-32 rounded-2xl bg-white/5 border border-white/8" />
      <div className="h-48 rounded-2xl bg-white/5 border border-white/8" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type PageState = 'loading' | 'ready' | 'error' | 'no-data';

export function KundliDashboard() {
  const [state,   setState]   = useState<PageState>('loading');
  const [data,    setData]    = useState<KundliData | null>(null);
  const [errMsg,  setErrMsg]  = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch('/api/kundli');
      if (res.status === 404) { setState('no-data'); return; }
      if (!res.ok) {
        const j = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(j.error ?? 'Server error');
      }
      const json = await res.json() as KundliData;
      setData(json);
      setState('ready');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Optimistic remedy toggle — flip locally, PATCH API, revert on failure
  async function toggleRemedy(id: string) {
    if (!data) return;

    const prev = data.remedies;
    setData((d) => d && ({
      ...d,
      remedies: d.remedies.map((r) =>
        r.id === id ? { ...r, isCompleted: !r.isCompleted } : r,
      ),
    }));

    try {
      const res = await fetch(`/api/kundli/remedy/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setData((d) => d && { ...d, remedies: prev });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (state === 'loading') return <Skeleton />;

  if (state === 'no-data') {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center max-w-md mx-auto space-y-3">
        <p className="text-amber-400 text-sm">No birth data found.</p>
        <a
          href="/onboarding"
          className="inline-block px-5 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-300 text-sm hover:bg-amber-400/20 transition-colors"
        >
          Complete onboarding →
        </a>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center max-w-md mx-auto space-y-3">
        <p className="text-red-400 text-sm">{errMsg || 'Failed to load analysis.'}</p>
        <button
          onClick={() => void load()}
          className="text-white/40 text-xs hover:text-white/70 transition-colors underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const activeCount    = data.remedies.filter((r) => !r.isCompleted).length;
  const completedCount = data.remedies.filter((r) =>  r.isCompleted).length;
  const totalYogas     = (data.yogas.gajakesariYoga.present ? 1 : 0)
                       + (data.yogas.budhadityaYoga.present ? 1 : 0)
                       + data.yogas.rajYogas.length;
  const doshaCount     = [data.doshas.mangalDosha, data.doshas.kaalSarpDosha, data.doshas.sadeSati]
                           .filter((d) => d.present).length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">

      {/* ── Node positions ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 flex-wrap">
        <NodeBadge label="Rahu" value={signLabel(data.rahuLongitude)} color="violet" />
        <div className="w-px h-6 bg-white/10" aria-hidden />
        <NodeBadge label="Ketu" value={signLabel(data.ketuLongitude)} color="rose" />
      </div>

      {/* ── LLM summary ──────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon="✨" text="Your Reading" />
        <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 p-5 space-y-2">
          <p className="text-white/80 text-sm leading-relaxed">{data.summary}</p>
        </div>
      </section>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="Doshas" value={doshaCount} suffix="active" accent={doshaCount > 0 ? 'red' : 'green'} />
        <StatChip label="Yogas"  value={totalYogas} suffix="present" accent={totalYogas > 0 ? 'amber' : 'dim'} />
        <StatChip label="Remedies" value={`${completedCount}/${data.remedies.length}`} suffix="done" accent="blue" />
      </div>

      {/* ── Dosha check ──────────────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon="⚠" text="Dosha Check" />
        <DoshaCards doshas={data.doshas} />
      </section>

      {/* ── Yoga detection ───────────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon="✦" text="Yogas" />
        <YogaCards yogas={data.yogas} />
      </section>

      {/* ── Remedy tracker ───────────────────────────────────────────────────── */}
      <section>
        <SectionLabel
          icon="◎"
          text="Remedy Tracker"
          sub={activeCount > 0 ? `${activeCount} remaining` : 'All complete'}
        />
        <RemedyTracker remedies={data.remedies} onToggle={toggleRemedy} />
      </section>

    </div>
  );
}

// ── Small shared UI pieces ────────────────────────────────────────────────────

function SectionLabel({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-white/25 text-xs">{icon}</span>
      <h2 className="text-white/50 text-xs uppercase tracking-widest">{text}</h2>
      {sub && <span className="text-white/25 text-xs">{sub}</span>}
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

function NodeBadge({ label, value, color }: { label: string; value: string; color: 'violet' | 'rose' }) {
  const ring = color === 'violet'
    ? 'border-violet-400/25 bg-violet-400/5 text-violet-300'
    : 'border-rose-400/25 bg-rose-400/5 text-rose-300';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${ring}`}>
      <span className="text-white/35 uppercase tracking-widest" style={{ fontSize: '10px' }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function StatChip({
  label, value, suffix, accent,
}: {
  label:  string;
  value:  string | number;
  suffix: string;
  accent: 'red' | 'green' | 'amber' | 'blue' | 'dim';
}) {
  const colors = {
    red:   'text-red-400',
    green: 'text-emerald-400',
    amber: 'text-amber-400',
    blue:  'text-sky-400',
    dim:   'text-white/30',
  };
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-3 text-center space-y-0.5">
      <p className={`text-xl font-bold tabular-nums ${colors[accent]}`}>{value}</p>
      <p className="text-white/25 text-xs">{suffix}</p>
      <p className="text-white/40 text-xs">{label}</p>
    </div>
  );
}
