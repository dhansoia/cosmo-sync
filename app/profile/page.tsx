import { cookies }  from 'next/headers';
import { redirect } from 'next/navigation';
import Link         from 'next/link';
import { ProfileDashboard } from '@/components/profile/ProfileDashboard';
import { LogoutButton }     from '@/components/auth/LogoutButton';

export const metadata = {
  title: 'Profile · CosmoSync',
};

export default function ProfilePage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-start pt-16 pb-32 px-4">

      {/* Nav */}
      <nav className="w-full max-w-xl flex items-center justify-between mb-10">
        <Link
          href="/"
          className="text-white/40 text-sm hover:text-white/70 transition-colors"
        >
          ← CosmoSync
        </Link>
        <span className="text-white/20 text-xs tracking-widest uppercase">Profile</span>
      </nav>

      {/* Header */}
      <header className="text-center mb-10 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white via-white/80 to-white/40 bg-clip-text text-transparent">
          Your Profile
        </h1>
        <p className="text-white/30 text-sm">Account details and birth chart summary</p>
      </header>

      <ProfileDashboard />

      <div className="mt-10">
        <LogoutButton />
      </div>

    </main>
  );
}
