import { cookies }  from 'next/headers';
import { redirect } from 'next/navigation';
import Link         from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Sign In · CosmoSync',
};

export default function LoginPage() {
  // Already logged in → home
  const uid = cookies().get('cosmo_uid')?.value;
  if (uid) redirect('/');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">

      <div className="mb-10 text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors mb-4">
          <span aria-hidden>✦</span>
          <span className="font-semibold tracking-tight">CosmoSync</span>
        </Link>
      </div>

      <AuthForm mode="login" />

    </main>
  );
}
