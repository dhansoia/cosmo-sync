'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StepShell } from '../StepShell';
import type { OnboardingFormState } from '../types';

interface Props {
  form:   OnboardingFormState;
  onBack: () => void;
  step:   number;
  total:  number;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
}

function formatTime(hhmm: string, isApprox: boolean): string {
  if (isApprox || !hhmm) return 'Unknown (Solar chart)';
  const [h, m] = hhmm.split(':');
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${suffix} (local)`;
}

interface Row {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: Row) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-white/8 last:border-0">
      <span className="text-white/40 text-sm flex-shrink-0">{label}</span>
      <span className="text-white text-sm text-right">{value}</span>
    </div>
  );
}

export function ConfirmationStep({ form, onBack, step, total }: Props) {
  const router  = useRouter();
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const cityShort = form.cityLabel.split(',').slice(0, 2).join(',').trim() || '—';

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          birthDate:         form.birthDate,
          birthTime:         form.isTimeApproximate ? '' : form.birthTime,
          isTimeApproximate: form.isTimeApproximate,
          latitude:          form.latitude,
          longitude:         form.longitude,
          cityLabel:         form.cityLabel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Server error');
      }

      // Cookie is set by the server; navigate home to see real chart
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  }

  return (
    <StepShell
      title="Your birth details"
      subtitle="Everything look right? We'll calculate your chart from this."
      step={step}
      totalSteps={total}
      onBack={onBack}
      onNext={handleSubmit}
      nextLabel="See my chart ✦"
      nextLoading={loading}
    >
      <div className="py-4">
        <div className="rounded-xl border border-white/10 bg-white/4 px-5 py-1">
          <SummaryRow label="Date"     value={formatDate(form.birthDate)} />
          <SummaryRow label="Time"     value={formatTime(form.birthTime, form.isTimeApproximate)} />
          <SummaryRow label="City"     value={cityShort} />
          {form.latitude !== null && (
            <SummaryRow
              label="Coordinates"
              value={`${form.latitude.toFixed(3)}°, ${form.longitude!.toFixed(3)}°`}
            />
          )}
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </StepShell>
  );
}
