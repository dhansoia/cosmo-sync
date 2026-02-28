import { cookies }          from 'next/headers';
import { redirect }         from 'next/navigation';
import { ProfileDashboard } from '@/components/profile/ProfileDashboard';

export const metadata = {
  title: 'Profile · CosmoSync',
};

export default function ProfilePage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/login');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-10 pb-32 px-4">

      <header className="text-center mb-10 space-y-1 mt-4">
        <h1 className="text-3xl font-bold tracking-tight text-white/90">
          Profile
        </h1>
        <p className="text-white/30 text-sm">Account details and birth chart summary.</p>
      </header>

      <ProfileDashboard />
    </main>
  );
}
