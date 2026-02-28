import Link from 'next/link';
import { cookies } from 'next/headers';
import { BigThreeCard } from '@/components/big-three/BigThreeCard';
import { db } from '@/lib/db';
import type { UserRole } from '@prisma/client';

const DEMO = {
  time:           '1990-06-15T08:30:00Z',
  lat:            28.6139,
  lng:            77.2090,
  birthInfoLabel: 'Jun 15, 1990 · 08:30 UTC · New Delhi, India (demo)',
};

const FEATURES: {
  href:    string;
  icon:    string;
  title:   string;
  desc:    string;
  accent:  string;
  border:  string;
}[] = [
  {
    href:   '/journal',
    icon:   '☽',
    title:  'Daily Journal',
    desc:   'Log your mood with live transit insights and Claude-generated reflections.',
    accent: 'text-sky-300',
    border: 'hover:border-sky-400/30',
  },
  {
    href:   '/academy',
    icon:   '✦',
    title:  'CosmoAcademy',
    desc:   'Learn astrology through interactive lessons and earn Stardust.',
    accent: 'text-amber-300',
    border: 'hover:border-amber-400/30',
  },
  {
    href:   '/kundli',
    icon:   '𑀓',
    title:  'Kundli',
    desc:   'Vedic birth chart — doshas, yogas, and personalised remedies.',
    accent: 'text-orange-300',
    border: 'hover:border-orange-400/30',
  },
  {
    href:   '/synastry',
    icon:   '♡',
    title:  'Compatibility',
    desc:   'Compare charts using Western aspects and Vedic Guna Milan.',
    accent: 'text-rose-300',
    border: 'hover:border-rose-400/30',
  },
  {
    href:   '/marketplace',
    icon:   '◈',
    title:  'Marketplace',
    desc:   'Book one-on-one sessions with verified astrology experts.',
    accent: 'text-violet-300',
    border: 'hover:border-violet-400/30',
  },
  {
    href:   '/profile',
    icon:   '◎',
    title:  'Profile',
    desc:   'Manage your account, birth data, and Big Three summary.',
    accent: 'text-white/50',
    border: 'hover:border-white/20',
  },
];

export default async function Home() {
  const cookieStore = cookies();
  const uid = cookieStore.get('cosmo_uid')?.value ?? null;

  const user = uid
    ? await db.user.findUnique({
        where: { id: uid },
        select: { role: true, birthData: true },
      })
    : null;

  const birthData = user?.birthData ?? null;
  const isPersonalised = birthData !== null;
  const userRole: UserRole | null = user?.role ?? null;

  const chartProps = isPersonalised && birthData
    ? {
        time:           birthData.dateOfBirth.toISOString(),
        lat:            birthData.latitude,
        lng:            birthData.longitude,
        birthInfoLabel: buildBirthLabel(birthData.dateOfBirth, birthData.isTimeApproximate, birthData.timezone),
      }
    : DEMO;

  return (
    <main className="relative flex flex-col items-center justify-start pt-14 pb-32 px-4">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="text-center pt-16 pb-10 space-y-4 max-w-lg mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-white/40 text-xs tracking-widest uppercase mb-2">
          <span className="animate-glow-pulse">✦</span>
          Two traditions, one platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/45 bg-clip-text text-transparent">
          CosmoSync
        </h1>
        <p className="text-white/45 text-base max-w-md mx-auto leading-relaxed">
          Astrological wellness, education &amp; connection —<br className="hidden sm:block" />
          astrology for the modern era.
        </p>
      </section>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent mb-10" aria-hidden />

      {/* ── Chart ────────────────────────────────────────────────────────── */}
      <BigThreeCard {...chartProps} />

      {/* ── CTA (unauthenticated) ─────────────────────────────────────────── */}
      {!isPersonalised && (
        <div className="mt-10 flex flex-col items-center gap-3 animate-fade-up">
          <p className="text-white/30 text-sm">This is a demo chart. Ready to see yours?</p>
          <Link
            href="/register"
            className="
              px-7 py-3 rounded-xl text-sm font-semibold
              bg-white text-black hover:bg-white/92 active:bg-white/85
              transition-all shadow-lg shadow-white/10
            "
          >
            Start your journey ✦
          </Link>
          <p className="text-white/22 text-xs">
            Already have an account?{' '}
            <Link href="/login" className="text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      )}

      {/* ── Feature grid (authenticated) ─────────────────────────────────── */}
      {isPersonalised && (
        <div className="mt-14 w-full max-w-2xl mx-auto animate-fade-up">
          <p className="text-white/25 text-xs uppercase tracking-widest text-center mb-6">Explore</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURES.filter(f => f.href !== '/profile' || true).map((f) => {
              if (f.href === '/profile' && userRole === 'ADMIN') return null;
              return (
                <Link
                  key={f.href}
                  href={f.href}
                  className={`
                    group relative rounded-2xl border border-white/8 bg-white/[0.03]
                    p-5 flex flex-col gap-2
                    hover:bg-white/[0.06] ${f.border}
                    transition-all duration-200
                  `}
                >
                  <span className={`text-2xl ${f.accent} transition-transform duration-200 group-hover:scale-110 inline-block`}>
                    {f.icon}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-white/80 text-sm font-medium">{f.title}</p>
                    <p className="text-white/30 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </Link>
              );
            })}
            {userRole === 'ADMIN' && (
              <Link
                href="/admin"
                className="
                  group relative rounded-2xl border border-white/8 bg-white/[0.03]
                  p-5 flex flex-col gap-2
                  hover:bg-white/[0.06] hover:border-red-400/25
                  transition-all duration-200
                "
              >
                <span className="text-2xl text-red-400/60 transition-transform duration-200 group-hover:scale-110 inline-block">
                  ⚙
                </span>
                <div className="space-y-0.5">
                  <p className="text-white/80 text-sm font-medium">Admin</p>
                  <p className="text-white/30 text-xs leading-relaxed">Platform stats and expert review.</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="mt-24 text-center text-white/15 text-xs space-y-1">
        <p>Western &amp; Vedic traditions · AI-powered insights · Expert marketplace</p>
      </footer>

    </main>
  );
}

function buildBirthLabel(dob: Date, isApprox: boolean, timezone: string): string {
  const dateStr = dob.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: timezone,
  });
  if (isApprox) return `${dateStr} · time unknown · ${timezone}`;
  const timeStr = dob.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: timezone,
  });
  return `${dateStr} · ${timeStr} · ${timezone}`;
}
