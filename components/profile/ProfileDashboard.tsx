'use client';

import { useEffect, useState, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BigThree {
  westernSun: string;    westernMoon: string;    westernRising: string;
  vedicSun:   string;    vedicMoon:   string;    vedicRising:   string;
}

interface ProfileData {
  id:          string;
  email:       string;
  displayName: string | null;
  bio:         string | null;
  role:        string;
  joinedAt:    string;
  birthData: {
    dateOfBirth:       string;
    timezone:          string;
    isTimeApproximate: boolean;
    latitude:          number;
    longitude:         number;
  } | null;
  bigThree: BigThree | null;
}

// ── Sign symbols ──────────────────────────────────────────────────────────────

const SYMBOLS: Record<string, string> = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
};

// ── Main component ────────────────────────────────────────────────────────────

export function ProfileDashboard() {
  const [data,    setData]    = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const bioRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : Promise.reject('Failed'))
      .then((d: ProfileData) => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load profile'); setLoading(false); });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch('/api/profile', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: nameRef.current?.value ?? '',
        bio:         bioRef.current?.value  ?? '',
      }),
    });

    if (res.ok) {
      const updated = await res.json() as { displayName: string | null; bio: string | null };
      setData((d) => d ? { ...d, ...updated } : d);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }

    setSaving(false);
  }

  // ── Skeleton ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="w-full max-w-xl mx-auto space-y-5 animate-pulse">
      {[80, 56, 120, 80].map((h, i) => (
        <div key={i} className={`h-${h === 80 ? '20' : h === 56 ? '14' : h === 120 ? '32' : '20'} rounded-2xl bg-white/5 border border-white/8`} style={{ height: h }} />
      ))}
    </div>
  );

  if (error || !data) return (
    <p className="text-red-400/70 text-sm text-center">{error || 'No data'}</p>
  );

  const joinedDate = new Date(data.joinedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const birthDate = data.birthData
    ? new Date(data.birthData.dateOfBirth).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
        timeZone: data.birthData.timezone,
      })
    : null;

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">

      {/* ── Edit form ───────────────────────────────────────────────────────── */}
      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
        <SectionLabel icon="◎" text="Your Profile" />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">

          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-white/35 text-xs uppercase tracking-widest">Display Name</label>
            <input
              ref={nameRef}
              type="text"
              defaultValue={data.displayName ?? ''}
              maxLength={60}
              placeholder="Your name (optional)"
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                px-3 py-2.5 text-sm text-white placeholder-white/20
                focus:outline-none focus:border-white/25 focus:bg-white/8
                transition-colors
              "
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-white/35 text-xs uppercase tracking-widest">Bio</label>
            <textarea
              ref={bioRef}
              defaultValue={data.bio ?? ''}
              maxLength={500}
              rows={3}
              placeholder="A short note about yourself (optional)"
              className="
                w-full rounded-xl border border-white/10 bg-white/5
                px-3 py-2.5 text-sm text-white placeholder-white/20
                focus:outline-none focus:border-white/25 focus:bg-white/8
                transition-colors resize-none
              "
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-medium bg-white/10 text-white/80 border border-white/15 hover:bg-white/15 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {saved && <span className="text-emerald-400 text-xs">Saved ✓</span>}
          </div>
        </div>
      </form>

      {/* ── Account info ────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionLabel icon="✦" text="Account" />
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
          <InfoRow label="Email"   value={data.email} />
          <InfoRow label="Role"    value={data.role.charAt(0) + data.role.slice(1).toLowerCase()} />
          <InfoRow label="Joined"  value={joinedDate} />
        </div>
      </section>

      {/* ── Birth data ──────────────────────────────────────────────────────── */}
      {data.birthData ? (
        <section className="space-y-4">
          <SectionLabel icon="☽" text="Birth Data" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
            <InfoRow
              label="Date"
              value={`${birthDate}${data.birthData.isTimeApproximate ? ' (time unknown)' : ''}`}
            />
            <InfoRow label="Timezone"  value={data.birthData.timezone} />
            <InfoRow
              label="Coordinates"
              value={`${data.birthData.latitude.toFixed(4)}°, ${data.birthData.longitude.toFixed(4)}°`}
            />
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <SectionLabel icon="☽" text="Birth Data" />
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-center space-y-2">
            <p className="text-amber-400/70 text-sm">No birth data on file.</p>
            <a
              href="/onboarding"
              className="inline-block text-xs text-amber-300/70 hover:text-amber-300 underline transition-colors"
            >
              Complete onboarding →
            </a>
          </div>
        </section>
      )}

      {/* ── Big Three ───────────────────────────────────────────────────────── */}
      {data.bigThree && (
        <section className="space-y-4">
          <SectionLabel icon="✦" text="Your Big Three" />
          <div className="grid grid-cols-2 gap-3">
            <BigThreePanel
              label="Western"
              sun={data.bigThree.westernSun}
              moon={data.bigThree.westernMoon}
              rising={data.bigThree.westernRising}
              accent="sky"
            />
            <BigThreePanel
              label="Vedic"
              sun={data.bigThree.vedicSun}
              moon={data.bigThree.vedicMoon}
              rising={data.bigThree.vedicRising}
              accent="orange"
            />
          </div>
        </section>
      )}

    </div>
  );
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────

function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/25 text-xs">{icon}</span>
      <h2 className="text-white/50 text-xs uppercase tracking-widest">{text}</h2>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/30 text-xs w-24 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-white/70 text-sm text-right">{value}</span>
    </div>
  );
}

function BigThreePanel({
  label, sun, moon, rising, accent,
}: {
  label:  string;
  sun:    string;
  moon:   string;
  rising: string;
  accent: 'sky' | 'orange';
}) {
  const colors = {
    sky:    'border-sky-400/20 bg-sky-400/5',
    orange: 'border-orange-400/20 bg-orange-400/5',
  };
  const textColor = {
    sky:    'text-sky-300',
    orange: 'text-orange-300',
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${colors[accent]}`}>
      <p className={`text-xs uppercase tracking-widest ${textColor[accent]} opacity-60`}>{label}</p>
      {[['☉ Sun', sun], ['☽ Moon', moon], ['↑ Rising', rising]].map(([k, v]) => (
        <div key={k} className="flex items-center justify-between">
          <span className="text-white/30 text-xs">{k}</span>
          <span className="text-white/70 text-sm font-medium">
            {SYMBOLS[v] ?? ''} {v}
          </span>
        </div>
      ))}
    </div>
  );
}
