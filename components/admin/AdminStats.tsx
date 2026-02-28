'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface StatsData {
  users:   { total: number; withBirthData: number };
  experts: { pending: number; approved: number };
  sessions:{ total: number; paid: number };
  journal: { totalEntries: number };
  kundli:  { savedProfiles: number };
  academy: { totalStardust: number };
  recentUsers: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
    displayName: string | null;
  }[];
}

export function AdminStats() {
  const [data,    setData]    = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.ok ? r.json() : Promise.reject('Failed'))
      .then((d: StatsData) => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load stats'); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/8" />
      ))}
    </div>
  );

  if (error || !data) return (
    <p className="text-red-400/70 text-sm">{error || 'No data'}</p>
  );

  return (
    <div className="space-y-8">

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={data.users.total}
          sub={`${data.users.withBirthData} with birth data`}
          accent="sky"
        />
        <StatCard
          label="Expert Applications"
          value={data.experts.pending}
          sub={`${data.experts.approved} approved`}
          accent={data.experts.pending > 0 ? 'amber' : 'dim'}
          href="/admin/experts"
          cta={data.experts.pending > 0 ? 'Review →' : undefined}
        />
        <StatCard
          label="Sessions"
          value={data.sessions.total}
          sub={`${data.sessions.paid} paid`}
          accent="emerald"
        />
        <StatCard
          label="Journal Entries"
          value={data.journal.totalEntries}
          sub="mood logs"
          accent="rose"
        />
        <StatCard
          label="Kundli Profiles"
          value={data.kundli.savedProfiles}
          sub="saved analyses"
          accent="orange"
        />
        <StatCard
          label="Stardust Earned"
          value={data.academy.totalStardust.toLocaleString()}
          sub="academy total"
          accent="violet"
        />
      </div>

      {/* Recent signups */}
      <section>
        <h2 className="text-white/40 text-xs uppercase tracking-widest mb-4">Recent Sign-ups</h2>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] divide-y divide-white/6">
          {data.recentUsers.length === 0 ? (
            <p className="p-4 text-white/25 text-sm">No users yet.</p>
          ) : data.recentUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-white/70 text-sm truncate">
                  {u.displayName || u.email}
                </p>
                {u.displayName && (
                  <p className="text-white/30 text-xs truncate">{u.email}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {u.role !== 'MEMBER' && (
                  <span className="px-2 py-0.5 rounded-full text-xs border border-violet-400/20 text-violet-300/70">
                    {u.role}
                  </span>
                )}
                <span className="text-white/25 text-xs">
                  {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent, href, cta,
}: {
  label:  string;
  value:  string | number;
  sub:    string;
  accent: 'sky' | 'amber' | 'emerald' | 'rose' | 'orange' | 'violet' | 'dim';
  href?:  string;
  cta?:   string;
}) {
  const colors = {
    sky:     'text-sky-400',
    amber:   'text-amber-400',
    emerald: 'text-emerald-400',
    rose:    'text-rose-400',
    orange:  'text-orange-400',
    violet:  'text-violet-400',
    dim:     'text-white/30',
  };

  const content = (
    <div className={`rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-1 ${href ? 'hover:border-white/15 transition-colors' : ''}`}>
      <p className={`text-2xl font-bold tabular-nums ${colors[accent]}`}>{value}</p>
      <p className="text-white/25 text-xs">{sub}</p>
      <p className="text-white/45 text-xs font-medium">{label}</p>
      {cta && <p className={`text-xs font-medium ${colors[accent]} mt-1`}>{cta}</p>}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
