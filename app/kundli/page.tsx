import { cookies }        from 'next/headers';
import { redirect }       from 'next/navigation';
import { KundliDashboard }     from '@/components/kundli/KundliDashboard';
import { KundliCharts }        from '@/components/kundli/KundliCharts';
import { KundliPredictions }   from '@/components/kundli/KundliPredictions';

export const metadata = {
  title: 'Kundli Analysis · CosmoSync',
  description: 'Your personalised Vedic birth chart reading — Doshas, Yogas, and remedies.',
};

export default function KundliPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/login');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-10 pb-32 px-4">

      <header className="text-center mb-10 space-y-2 mt-4">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-orange-200 via-amber-100 to-white/60 bg-clip-text text-transparent">
          Kundli Analysis
        </h1>
        <p className="text-white/35 text-sm max-w-sm mx-auto leading-relaxed">
          Vedic birth chart — Doshas, Yogas &amp; personalised remedies.
        </p>
      </header>

      {/* Birth charts — 9 tabs */}
      <section className="w-full max-w-2xl mx-auto mb-10">
        <KundliCharts />
      </section>

      {/* Predictions — life / yearly / monthly / daily */}
      <section className="w-full max-w-2xl mx-auto mb-10">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-white/70 tracking-tight">Predictions</h2>
          <p className="text-white/25 text-xs mt-0.5">AI-generated insights from your Vedic chart and current transits</p>
        </div>
        <KundliPredictions />
      </section>

      <KundliDashboard />
    </main>
  );
}
