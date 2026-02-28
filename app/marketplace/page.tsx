import { cookies }             from 'next/headers';
import { redirect }            from 'next/navigation';
import { MarketplaceDashboard } from '@/components/marketplace/MarketplaceDashboard';
import type { Metadata }       from 'next';

export const metadata: Metadata = {
  title: 'Expert Marketplace · CosmoSync',
};

export default function MarketplacePage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/login');

  return (
    <main className="min-h-screen px-4 pt-10 pb-32 max-w-3xl mx-auto">
      <MarketplaceDashboard />
    </main>
  );
}
