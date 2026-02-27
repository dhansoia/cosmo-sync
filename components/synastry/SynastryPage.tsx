'use client';

import { useState } from 'react';
import { SynastryForm } from './SynastryForm';
import { CompatibilityCard } from './CompatibilityCard';
import type { PartnerInput } from './SynastryForm';
import type { SynastryReport } from '@/lib/synastry/engine';

type State = 'idle' | 'loading' | 'result' | 'error';

export function SynastryPage() {
  const [state,       setState]      = useState<State>('idle');
  const [report,      setReport]     = useState<SynastryReport | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [errorMsg,    setErrorMsg]   = useState('');

  async function handleSubmit(data: PartnerInput) {
    setState('loading');
    setErrorMsg('');
    setPartnerName(data.name || 'Partner');

    try {
      const res = await fetch('/api/synastry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          partnerDate: data.date,
          partnerTime: data.time,
          partnerLat:  data.lat,
          partnerLng:  data.lng,
          partnerName: data.name,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(d.error ?? 'Server error');
      }

      const json = await res.json() as SynastryReport;
      setReport(json);
      setState('result');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setState('error');
    }
  }

  function handleReset() {
    setState('idle');
    setReport(null);
    setErrorMsg('');
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-8">

      {/* Form — always shown unless loading/result */}
      {(state === 'idle' || state === 'error') && (
        <>
          <SynastryForm onSubmit={handleSubmit} loading={false} />
          {state === 'error' && (
            <p className="text-red-400 text-sm text-center -mt-4">{errorMsg}</p>
          )}
        </>
      )}

      {/* Loading skeleton */}
      {state === 'loading' && (
        <div className="space-y-4">
          <SynastryForm onSubmit={handleSubmit} loading={true} />
          <div className="rounded-2xl border border-white/8 bg-white/3 h-48 animate-pulse" />
          <div className="rounded-2xl border border-white/8 bg-white/3 h-64 animate-pulse" />
        </div>
      )}

      {/* Result */}
      {state === 'result' && report && (
        <>
          <CompatibilityCard report={report} partnerName={partnerName} />

          <div className="text-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-white/30 text-sm hover:text-white/60 transition-colors"
            >
              ← Try another person
            </button>
          </div>
        </>
      )}
    </div>
  );
}
