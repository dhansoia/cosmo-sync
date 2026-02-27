import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { DailyJournal } from '@/components/journal/DailyJournal';

export const metadata = {
  title: 'Daily Transit Journal — CosmoSync',
  description: 'Log your mood and receive a personalised astrological insight based on today\'s transits.',
};

export default function JournalPage() {
  // Server-side auth guard — redirect to onboarding if no cookie
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) {
    redirect('/onboarding');
  }

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-16 pb-32 px-4">

      {/* Nav */}
      <nav className="w-full max-w-lg flex items-center justify-between mb-10">
        <Link
          href="/"
          className="text-white/40 text-sm hover:text-white/70 transition-colors flex items-center gap-1.5"
        >
          ← CosmoSync
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/academy" className="text-white/30 text-xs hover:text-white/60 transition-colors">
            ✦ Academy
          </Link>
          <span className="text-white/20 text-xs">Journal</span>
        </div>
      </nav>

      <DailyJournal />
    </main>
  );
}
