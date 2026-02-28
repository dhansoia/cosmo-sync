import { cookies }    from 'next/headers';
import { redirect }   from 'next/navigation';
import { DailyJournal } from '@/components/journal/DailyJournal';

export const metadata = {
  title: 'Daily Journal · CosmoSync',
  description: 'Log your mood and receive a personalised astrological insight based on today\'s transits.',
};

export default function JournalPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/login');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-10 pb-32 px-4">
      <DailyJournal />
    </main>
  );
}
