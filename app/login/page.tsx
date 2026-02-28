import { cookies }  from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForm }  from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Sign In · CosmoSync',
};

export default function LoginPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (uid) redirect('/');

  return (
    <main className="relative min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-16">
      <AuthForm mode="login" />
    </main>
  );
}
