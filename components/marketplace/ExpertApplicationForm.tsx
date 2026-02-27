'use client';

import { useState } from 'react';
import type { Specialty } from '@prisma/client';

const ALL_SPECIALTIES: Specialty[] = [
  'CAREER', 'RELATIONSHIP', 'VEDIC', 'WESTERN',
  'NATAL_CHART', 'SYNASTRY', 'FORECASTING', 'SPIRITUAL',
];

const SPECIALTY_LABELS: Record<Specialty, string> = {
  CAREER: 'Career',
  RELATIONSHIP: 'Relationship',
  VEDIC: 'Vedic',
  WESTERN: 'Western',
  NATAL_CHART: 'Natal Chart',
  SYNASTRY: 'Synastry',
  FORECASTING: 'Forecasting',
  SPIRITUAL: 'Spiritual',
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ExpertApplicationForm() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [ratePerMinute, setRatePerMinute] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleSpecialty = (s: Specialty) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (specialties.length === 0) {
      setErrorMsg('Select at least one specialty.');
      setStatus('error');
      return;
    }
    const rate = parseFloat(ratePerMinute);
    if (isNaN(rate) || rate < 10) {
      setErrorMsg('Minimum rate is ₹10 / min.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    const res = await fetch('/api/expert/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName,
        bio,
        specialties,
        ratePerMinute: rate,
        yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
      }),
    });

    if (res.ok) {
      setStatus('success');
    } else {
      const data = await res.json();
      setErrorMsg(data.error ?? 'Something went wrong.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-8 text-center max-w-lg mx-auto">
        <div className="text-4xl mb-4">✦</div>
        <h2 className="text-white font-semibold text-lg">Application submitted!</h2>
        <p className="text-white/50 text-sm mt-2">We&apos;ll review it shortly and notify you by email.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 flex flex-col gap-5 max-w-lg mx-auto w-full"
    >
      <h2 className="text-white font-semibold text-xl">Apply as an Expert</h2>

      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-white/50 text-sm">Display name</label>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Luna Starfield"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-white/50 text-sm">
          Bio <span className="text-white/25">(max 400 chars)</span>
        </label>
        <textarea
          required
          maxLength={400}
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell clients about your astrological background…"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 resize-none"
        />
        <span className="text-white/20 text-xs text-right">{bio.length}/400</span>
      </div>

      {/* Years experience */}
      <div className="flex flex-col gap-1.5">
        <label className="text-white/50 text-sm">Years of experience <span className="text-white/25">(optional)</span></label>
        <input
          type="number"
          min={0}
          max={60}
          value={yearsExperience}
          onChange={(e) => setYearsExperience(e.target.value)}
          placeholder="e.g. 5"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Rate */}
      <div className="flex flex-col gap-1.5">
        <label className="text-white/50 text-sm">Rate (₹ / minute, min ₹10)</label>
        <input
          required
          type="number"
          min={10}
          step={1}
          value={ratePerMinute}
          onChange={(e) => setRatePerMinute(e.target.value)}
          placeholder="e.g. 100"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Specialties */}
      <div className="flex flex-col gap-2">
        <label className="text-white/50 text-sm">Specialties (select all that apply)</label>
        <div className="flex flex-wrap gap-2">
          {ALL_SPECIALTIES.map((s) => {
            const active = specialties.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                  ${active
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}
                `}
              >
                {SPECIALTY_LABELS[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {status === 'error' && (
        <p className="text-red-400 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'submitting' ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  );
}
