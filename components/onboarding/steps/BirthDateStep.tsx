'use client';

import { StepShell } from '../StepShell';
import type { OnboardingFormState } from '../types';

interface Props {
  form:     OnboardingFormState;
  onChange: (patch: Partial<OnboardingFormState>) => void;
  onNext:   () => void;
  step:     number;
  total:    number;
}

export function BirthDateStep({ form, onChange, onNext, step, total }: Props) {
  // Max = today; min = 100 years ago
  const today  = new Date().toISOString().split('T')[0];
  const minDate = `${new Date().getFullYear() - 100}-01-01`;

  return (
    <StepShell
      title="When were you born?"
      subtitle="Your birth date is the foundation of your astrological chart."
      step={step}
      totalSteps={total}
      onNext={onNext}
      nextDisabled={!form.birthDate}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <input
          type="date"
          value={form.birthDate}
          min={minDate}
          max={today}
          onChange={(e) => onChange({ birthDate: e.target.value })}
          style={{ colorScheme: 'dark' }}
          className="
            w-full max-w-xs px-4 py-3 rounded-xl
            bg-white/8 border border-white/15 text-white text-center
            text-lg tracking-wide
            focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20
            transition-colors
          "
        />
        <p className="text-white/25 text-xs">
          Your data is stored only on your device and our servers.
        </p>
      </div>
    </StepShell>
  );
}
