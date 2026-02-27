import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AcademyDashboard } from '@/components/academy/AcademyDashboard';

export const metadata = {
  title: 'CosmoAcademy — CosmoSync',
  description: 'Learn astrology through interactive lessons. Earn Stardust as you master the zodiac.',
};

export default function AcademyPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-16 pb-32 px-4">

      {/* Nav */}
      <nav className="w-full max-w-2xl flex items-center justify-between mb-10">
        <Link
          href="/"
          className="text-white/40 text-sm hover:text-white/70 transition-colors"
        >
          ← CosmoSync
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/journal" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            Journal
          </Link>
        </div>
      </nav>

      {/* Header */}
      <header className="text-center mb-10 space-y-2">
        <p className="text-white/25 text-xs uppercase tracking-widest">Phase 3</p>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
          CosmoAcademy
        </h1>
        <p className="text-white/35 text-sm max-w-sm mx-auto">
          The Duolingo of Stars — learn astrology, earn Stardust, unlock the cosmos.
        </p>
      </header>

      <AcademyDashboard />
    </main>
  );
}
