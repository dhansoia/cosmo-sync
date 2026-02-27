import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { MarketplaceDashboard } from '@/components/marketplace/MarketplaceDashboard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expert Marketplace · CosmoSync',
};

export default function MarketplacePage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  return (
    <main className="min-h-screen px-4 py-16 max-w-3xl mx-auto">
      <MarketplaceDashboard />
    </main>
  );
}
