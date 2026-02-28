import Link from 'next/link';
import { cookies } from 'next/headers';
import { BigThreeCard } from '@/components/big-three/BigThreeCard';
import { db } from '@/lib/db';
import type { UserRole } from '@prisma/client';

/**
 * Demo birth data shown when the user has not yet onboarded.
 * New Delhi, India — June 15 1990 08:30 UTC.
 */
const DEMO = {
  time:           '1990-06-15T08:30:00Z',
  lat:            28.6139,
  lng:            77.2090,
  birthInfoLabel: 'Jun 15, 1990 · 08:30 UTC · New Delhi, India (demo)',
};

export default async function Home() {
  // ── Read personalisation cookie ──────────────────────────────────────────
  const cookieStore = cookies();
  const uid = cookieStore.get('cosmo_uid')?.value ?? null;

  const user = uid
    ? await db.user.findUnique({ where: { id: uid }, select: { role: true, birthData: true } })
    : null;

  const birthData = user?.birthData ?? null;

  // ── Build chart props ────────────────────────────────────────────────────
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
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-20 pb-32 px-4">

      {/* Brand header */}
      <header className="text-center mb-16 space-y-3">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-3xl" aria-hidden>✦</span>
        </div>
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
          CosmoSync
        </h1>
        <p className="text-white/40 text-base max-w-md mx-auto leading-relaxed">
          Astrological Wellness, Education &amp; Connection —<br />
          one platform, two traditions.
        </p>
      </header>

      {/* Divider */}
      <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent mb-12" aria-hidden />

      {/* Chart */}
      <BigThreeCard {...chartProps} />

      {/* CTA — only when showing the demo */}
      {!isPersonalised && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-white/30 text-sm">This is a demo chart. Ready to see yours?</p>
          <Link
            href="/onboarding"
            className="
              px-7 py-3 rounded-xl text-sm font-semibold
              bg-white text-black hover:bg-white/90 active:bg-white/80
              transition-colors shadow-lg shadow-white/10
            "
          >
            Start your journey ✦
          </Link>
        </div>
      )}

      {/* Nav links — shown when personalised */}
      {isPersonalised && (
        <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
          <Link
            href="/journal"
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium
              border border-white/15 text-white/60
              hover:border-white/30 hover:text-white/90
              transition-colors
            "
          >
            ☽ Daily Journal
          </Link>
          <Link
            href="/academy"
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium
              border border-amber-400/20 text-amber-400/70
              hover:border-amber-400/40 hover:text-amber-400
              transition-colors
            "
          >
            ✦ CosmoAcademy
          </Link>
          <Link
            href="/synastry"
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium
              border border-rose-400/20 text-rose-400/70
              hover:border-rose-400/40 hover:text-rose-400
              transition-colors
            "
          >
            ♡ Compatibility
          </Link>
          <Link
            href="/kundli"
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium
              border border-orange-400/20 text-orange-400/70
              hover:border-orange-400/40 hover:text-orange-400
              transition-colors
            "
          >
            𑀓 Kundli
          </Link>
          <Link
            href="/marketplace"
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium
              border border-violet-400/20 text-violet-400/70
              hover:border-violet-400/40 hover:text-violet-400
              transition-colors
            "
          >
            ✦ Marketplace
          </Link>
          <Link
            href="/profile"
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium
              border border-white/10 text-white/40
              hover:border-white/25 hover:text-white/70
              transition-colors
            "
          >
            ◎ Profile
          </Link>
          {userRole === 'ADMIN' && (
            <Link
              href="/admin"
              className="
                px-5 py-2.5 rounded-xl text-sm font-medium
                border border-red-400/20 text-red-400/60
                hover:border-red-400/40 hover:text-red-400
                transition-colors
              "
            >
              ⚙ Admin
            </Link>
          )}
        </div>
      )}

      {/* Feature teaser */}
      <footer className="mt-24 text-center space-y-3 text-white/20 text-sm">
        <p>Phase 2 — Astro-Wellness Journal &nbsp;·&nbsp; Phase 3 — CosmoAcademy &nbsp;·&nbsp; Phase 4 — Synastry &amp; Compatibility &nbsp;·&nbsp; Phase 5 — Expert Marketplace</p>
      </footer>
    </main>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

function buildBirthLabel(dob: Date, isApprox: boolean, timezone: string): string {
  const dateStr = dob.toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    timeZone: timezone,
  });

  if (isApprox) {
    return `${dateStr} · time unknown · ${timezone}`;
  }

  const timeStr = dob.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: timezone,
  });

  return `${dateStr} · ${timeStr} · ${timezone}`;
}
