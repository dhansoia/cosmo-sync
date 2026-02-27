import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export const metadata = {
  title: 'Welcome to CosmoSync',
  description: 'Enter your birth details to receive your personalised astrological chart.',
};

export default function OnboardingPage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">

      {/* Brand mark */}
      <header className="text-center mb-10 space-y-2">
        <span className="text-2xl" aria-hidden>✦</span>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
          CosmoSync
        </h1>
        <p className="text-white/40 text-sm">Let&apos;s build your chart</p>
      </header>

      <OnboardingFlow />
    </main>
  );
}
