import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SynastryPage } from '@/components/synastry/SynastryPage';

export const metadata = { title: 'Compatibility · CosmoSync' };

export default async function Synastry() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-20 pb-32 px-4">

      {/* Header */}
      <header className="text-center mb-12 space-y-2">
        <p className="text-white/30 text-xs uppercase tracking-widest">CosmoSync</p>
        <h1 className="text-3xl font-bold text-white">Compatibility</h1>
        <p className="text-white/40 text-sm max-w-sm mx-auto">
          Compare your chart with a partner&apos;s using Western aspects and Vedic Guna Milan.
        </p>
      </header>

      {/* Synastry wizard */}
      <SynastryPage />

      {/* Back link */}
      <div className="mt-12">
        <Link
          href="/"
          className="text-white/25 text-sm hover:text-white/50 transition-colors"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
