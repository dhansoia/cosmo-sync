import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ExpertApplicationForm } from '@/components/marketplace/ExpertApplicationForm';

export default async function ApplyPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  const profile = await db.expertProfile.findUnique({ where: { userId: uid } });

  if (profile?.status === 'APPROVED') {
    redirect('/expert/onboarding');
  }

  if (profile?.status === 'PENDING') {
    return (
      <main className="min-h-screen px-4 py-16 flex items-center justify-center">
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-10 text-center max-w-md">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-white font-semibold text-lg">Application under review</h2>
          <p className="text-white/40 text-sm mt-2">
            We&apos;ve received your application and will notify you once it&apos;s been reviewed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-16">
      <ExpertApplicationForm />
    </main>
  );
}
