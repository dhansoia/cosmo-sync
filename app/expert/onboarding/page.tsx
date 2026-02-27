import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function ExpertOnboardingPage() {
  const uid = cookies().get('cosmo_uid')?.value;
  if (!uid) redirect('/onboarding');

  const user = await db.user.findUnique({
    where:   { id: uid },
    include: { expertProfile: true },
  });

  if (!user || user.role !== 'EXPERT') redirect('/');

  const profile = user.expertProfile!;

  return (
    <main className="min-h-screen px-4 py-16 max-w-xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Expert Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Your marketplace profile status.</p>
        </div>

        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 text-xl flex-shrink-0">
            ✓
          </div>
          <div>
            <p className="text-white font-semibold">You&apos;re live in the marketplace</p>
            <p className="text-white/40 text-sm mt-1">
              Clients can now discover and book sessions with you.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-3">
          <p className="text-white/50 text-xs uppercase tracking-widest">Profile summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Display name</span>
            <span className="text-white">{profile.displayName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Rate</span>
            <span className="text-amber-400">₹{Math.round(profile.ratePerMinute)} / min</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Specialties</span>
            <span className="text-white">{profile.specialties.length} selected</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Payouts</span>
            <span className={profile.payoutsEnabled ? 'text-emerald-400' : 'text-amber-400'}>
              {profile.payoutsEnabled ? 'Enabled' : 'Pending admin setup'}
            </span>
          </div>
        </div>

        <p className="text-white/25 text-xs text-center leading-relaxed">
          Payouts are processed by the CosmoSync team within 7 business days of each completed session.
          Contact support to register your UPI ID or bank account details.
        </p>
      </div>
    </main>
  );
}
