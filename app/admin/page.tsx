import { cookies }    from 'next/headers';
import { redirect }   from 'next/navigation';
import Link           from 'next/link';
import { db }         from '@/lib/db';
import { AdminStats } from '@/components/admin/AdminStats';

export const metadata = {
  title: 'Admin · CosmoSync',
};

export default async function AdminPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/login');

  const user = await db.user.findUnique({ where: { id: uid }, select: { role: true } });
  if (!user || user.role !== 'ADMIN') redirect('/');

  return (
    <main className="min-h-screen px-4 pt-10 pb-32 max-w-4xl mx-auto">

      <div className="flex items-center justify-between mt-4 mb-10">
        <div>
          <p className="text-white/25 text-xs uppercase tracking-widest mb-1">CosmoSync</p>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <Link
          href="/admin/experts"
          className="px-4 py-2 rounded-xl text-sm border border-violet-400/20 text-violet-300/70 hover:border-violet-400/40 hover:text-violet-300 transition-colors"
        >
          Expert Applications →
        </Link>
      </div>

      <AdminStats />
    </main>
  );
}
