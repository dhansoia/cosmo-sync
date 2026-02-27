import { cookies }   from 'next/headers';
import { redirect }  from 'next/navigation';
import Link          from 'next/link';
import { KundliDashboard } from '@/components/kundli/KundliDashboard';

export const metadata = {
  title: 'Kundli Analysis · CosmoSync',
  description: 'Your personalised Vedic birth chart reading — Doshas, Yogas, and remedies.',
};

export default function KundliPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-16 pb-32 px-4">

      {/* Nav */}
      <nav className="w-full max-w-2xl flex items-center justify-between mb-10">
        <Link
          href="/"
          className="text-white/40 text-sm hover:text-white/70 transition-colors flex items-center gap-1.5"
        >
          ← CosmoSync
        </Link>
        <span className="text-orange-400/50 text-xs tracking-widest uppercase">Kundli</span>
      </nav>

      {/* Page header */}
      <header className="text-center mb-10 space-y-2">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl" aria-hidden>𑀓</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-orange-200 via-amber-100 to-white/60 bg-clip-text text-transparent">
          Kundli Analysis
        </h1>
        <p className="text-white/35 text-sm max-w-sm mx-auto leading-relaxed">
          Vedic birth chart reading — Doshas, Yogas &amp; personalised remedies
        </p>
      </header>

      <KundliDashboard />
    </main>
  );
}
