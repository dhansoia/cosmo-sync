import { cookies }         from 'next/headers';
import { redirect }        from 'next/navigation';
import { AcademyDashboard } from '@/components/academy/AcademyDashboard';

export const metadata = {
  title: 'CosmoAcademy · CosmoSync',
  description: 'Learn astrology through interactive lessons. Earn Stardust as you master the zodiac.',
};

export default function AcademyPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/login');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-10 pb-32 px-4">

      <header className="text-center mb-10 space-y-2 mt-4">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-amber-200 via-amber-100 to-white/50 bg-clip-text text-transparent">
          CosmoAcademy
        </h1>
        <p className="text-white/35 text-sm max-w-sm mx-auto">
          Learn astrology, earn Stardust, unlock the cosmos.
        </p>
      </header>

      <AcademyDashboard />
    </main>
  );
}
