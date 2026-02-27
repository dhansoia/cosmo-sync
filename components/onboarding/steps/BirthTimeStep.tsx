'use client';

import { StepShell } from '../StepShell';
import type { OnboardingFormState } from '../types';

interface Props {
  form:     OnboardingFormState;
  onChange: (patch: Partial<OnboardingFormState>) => void;
  onNext:   () => void;
  onBack:   () => void;
  step:     number;
  total:    number;
}

export function BirthTimeStep({ form, onChange, onNext, onBack, step, total }: Props) {
  const noTime = form.isTimeApproximate;

  return (
    <StepShell
      title="What time were you born?"
      subtitle="Birth time determines your Rising sign and house positions."
      step={step}
      totalSteps={total}
      onBack={onBack}
      onNext={onNext}
      // Always allow moving forward — time is optional
      nextDisabled={false}
    >
      <div className="flex flex-col items-center gap-5 py-4">
        {/* Time input */}
        <input
          type="time"
          value={form.birthTime}
          disabled={noTime}
          onChange={(e) => onChange({ birthTime: e.target.value })}
          style={{ colorScheme: 'dark' }}
          className={`
            w-full max-w-xs px-4 py-3 rounded-xl
            bg-white/8 border border-white/15 text-white text-center
            text-lg tracking-wide
            focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20
            transition-colors
            ${noTime ? 'opacity-30 cursor-not-allowed' : ''}
          `}
        />

        {/* "I don't know" toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none group">
          <span
            role="checkbox"
            aria-checked={noTime}
            tabIndex={0}
            onKeyDown={(e) => e.key === ' ' && onChange({ isTimeApproximate: !noTime, birthTime: noTime ? '' : '' })}
            onClick={() => onChange({ isTimeApproximate: !noTime, birthTime: '' })}
            className={`
              w-10 h-5.5 rounded-full border transition-colors flex items-center px-0.5
              ${noTime ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/15'}
            `}
          >
            <span
              className={`
                w-4 h-4 rounded-full bg-white transition-transform
                ${noTime ? 'translate-x-4' : 'translate-x-0'}
              `}
            />
          </span>
          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
            I don&apos;t know my birth time
          </span>
        </label>

        {noTime && (
          <p className="text-white/35 text-xs text-center max-w-xs">
            We&apos;ll use a Solar chart (Sun as Ascendant) — your Sun and Moon will still be accurate.
          </p>
        )}
      </div>
    </StepShell>
  );
}
