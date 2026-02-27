import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { ExpertApplicationList } from '@/components/admin/ExpertApplicationList';

export default async function AdminExpertsPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  const user = await db.user.findUnique({ where: { id: uid } });
  if (!user || user.role !== 'ADMIN') redirect('/');

  return (
    <main className="min-h-screen px-4 py-16 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Expert Applications</h1>
        <p className="text-white/40 mt-1 text-sm">Review and approve expert marketplace applications.</p>
      </div>
      <ExpertApplicationList />
    </main>
  );
}
