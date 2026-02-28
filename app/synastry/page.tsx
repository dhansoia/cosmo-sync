import { cookies }    from 'next/headers';
import { redirect }   from 'next/navigation';
import { SynastryPage } from '@/components/synastry/SynastryPage';

export const metadata = { title: 'Compatibility · CosmoSync' };

export default async function Synastry() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/login');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-10 pb-32 px-4">

      <header className="text-center mb-10 space-y-2 mt-4">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-rose-200 via-rose-100 to-white/50 bg-clip-text text-transparent">
          Compatibility
        </h1>
        <p className="text-white/35 text-sm max-w-sm mx-auto">
          Western aspects &amp; Vedic Guna Milan — combined into one score.
        </p>
      </header>

      <SynastryPage />
    </main>
  );
}
