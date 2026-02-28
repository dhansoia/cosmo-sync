'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type PredType = 'life' | 'yearly' | 'monthly' | 'daily';

interface Section {
  title: string;
  body:  string;
}

interface TabState {
  sections: Section[];
  loading:  boolean;
  error:    string;
  cached:   boolean;
}

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS: {
  id:          PredType;
  label:       string;
  description: string;
  icon:        string;
  gradient:    string;
  accent:      string;
  cardBorder:  string;
  dotColor:    string;
}[] = [
  {
    id:          'life',
    label:       'Life',
    description: 'Your complete life blueprint based on your natal chart',
    icon:        '✦',
    gradient:    'from-amber-500/10 via-transparent',
    accent:      'text-amber-300',
    cardBorder:  'border-amber-500/15 bg-amber-500/[0.04]',
    dotColor:    'bg-amber-400',
  },
  {
    id:          'yearly',
    label:       'Yearly',
    description: `Planetary influences shaping ${new Date().getFullYear()}`,
    icon:        '◎',
    gradient:    'from-blue-500/10 via-transparent',
    accent:      'text-blue-300',
    cardBorder:  'border-blue-500/15 bg-blue-500/[0.04]',
    dotColor:    'bg-blue-400',
  },
  {
    id:          'monthly',
    label:       'Monthly',
    description: `Key themes for ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}`,
    icon:        '◑',
    gradient:    'from-violet-500/10 via-transparent',
    accent:      'text-violet-300',
    cardBorder:  'border-violet-500/15 bg-violet-500/[0.04]',
    dotColor:    'bg-violet-400',
  },
  {
    id:          'daily',
    label:       'Daily',
    description: `Guidance for ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
    icon:        '○',
    gradient:    'from-emerald-500/10 via-transparent',
    accent:      'text-emerald-300',
    cardBorder:  'border-emerald-500/15 bg-emerald-500/[0.04]',
    dotColor:    'bg-emerald-400',
  },
];

// ── Skeleton ───────────────────────────────────────────────────────────────────

function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4 space-y-2"
        >
          <div className="h-3 w-2/5 rounded bg-white/8" />
          <div className="h-2.5 w-full rounded bg-white/5" />
          <div className="h-2.5 w-5/6 rounded bg-white/5" />
          <div className="h-2.5 w-4/6 rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// ── Section card ───────────────────────────────────────────────────────────────

function SectionCard({
  section,
  cardBorder,
  accent,
  dotColor,
}: {
  section:    Section;
  cardBorder: string;
  accent:     string;
  dotColor:   string;
}) {
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${cardBorder}`}>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
        <h4 className={`text-xs font-semibold uppercase tracking-wider ${accent}`}>
          {section.title}
        </h4>
      </div>
      <p className="text-white/65 text-sm leading-relaxed">{section.body}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function KundliPredictions() {
  const [activeTab, setActiveTab]   = useState<PredType>('life');
  const [store, setStore]           = useState<Record<PredType, TabState>>({
    life:    { sections: [], loading: false, error: '', cached: false },
    yearly:  { sections: [], loading: false, error: '', cached: false },
    monthly: { sections: [], loading: false, error: '', cached: false },
    daily:   { sections: [], loading: false, error: '', cached: false },
  });

  const fetchPrediction = useCallback(async (type: PredType, force = false) => {
    const current = store[type];
    if (!force && (current.sections.length > 0 || current.loading)) return;

    setStore((prev) => ({ ...prev, [type]: { ...prev[type], loading: true, error: '' } }));
    try {
      const res  = await fetch(`/api/kundli/predictions?type=${type}`);
      const data = await res.json() as { sections?: Section[]; error?: string; cached?: boolean };
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');
      setStore((prev) => ({
        ...prev,
        [type]: { sections: data.sections ?? [], loading: false, error: '', cached: !!data.cached },
      }));
    } catch (err) {
      setStore((prev) => ({
        ...prev,
        [type]: { ...prev[type], loading: false, error: String(err) },
      }));
    }
  }, [store]);

  // Load on tab switch
  useEffect(() => {
    fetchPrediction(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const tab     = TABS.find((t) => t.id === activeTab)!;
  const current = store[activeTab];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Tab bar */}
      <div className="overflow-x-auto pb-0.5">
        <div className="flex gap-1 min-w-max">
          {TABS.map(({ id, label, icon, accent }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs
                whitespace-nowrap transition-all duration-150
                ${activeTab === id
                  ? 'bg-white/10 text-white/90 font-semibold shadow-inner'
                  : 'text-white/35 hover:text-white/65 hover:bg-white/5'}
              `}
            >
              <span className={activeTab === id ? accent : ''}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content panel */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">

        {/* Panel header */}
        <div className={`px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r ${tab.gradient}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className={`text-sm font-semibold ${tab.accent}`}>
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label} Predictions
              </h3>
              <p className="text-white/30 text-xs mt-0.5">{tab.description}</p>
            </div>
            {/* Refresh / cache badge */}
            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
              {current.cached && !current.loading && (
                <span className="text-[10px] text-white/20 border border-white/8 rounded px-1.5 py-0.5">
                  cached
                </span>
              )}
              {current.sections.length > 0 && !current.loading && (
                <button
                  onClick={() => fetchPrediction(activeTab, true)}
                  className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
                  title="Refresh prediction"
                >
                  ↺ refresh
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">

          {/* Loading */}
          {current.loading && (
            <Skeleton count={activeTab === 'daily' ? 4 : activeTab === 'monthly' ? 5 : 6} />
          )}

          {/* Error */}
          {!current.loading && current.error && (
            <div className="text-center py-8 space-y-2">
              <p className="text-red-400/60 text-sm">{current.error}</p>
              <button
                onClick={() => fetchPrediction(activeTab, true)}
                className="text-xs text-white/30 hover:text-white/60 transition-colors underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Sections grid */}
          {!current.loading && !current.error && current.sections.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {current.sections.map((s) => (
                <SectionCard
                  key={s.title}
                  section={s}
                  cardBorder={tab.cardBorder}
                  accent={tab.accent}
                  dotColor={tab.dotColor}
                />
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
