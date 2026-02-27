'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { StepShell } from '../StepShell';
import type { OnboardingFormState, GeoResult } from '../types';

interface Props {
  form:     OnboardingFormState;
  onChange: (patch: Partial<OnboardingFormState>) => void;
  onNext:   () => void;
  onBack:   () => void;
  step:     number;
  total:    number;
}

export function BirthCityStep({ form, onChange, onNext, onBack, step, total }: Props) {
  const [query,    setQuery]    = useState(form.cityLabel ?? '');
  const [results,  setResults]  = useState<GeoResult[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [open,     setOpen]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Debounced geocode search
  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json() as GeoResult[];
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  // Re-search when input changes
  useEffect(() => {
    search(query);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function pick(result: GeoResult) {
    setQuery(result.label.split(',')[0].trim()); // show just the city name in input
    setOpen(false);
    onChange({
      latitude:  result.lat,
      longitude: result.lng,
      cityLabel: result.label,
    });
  }

  const hasPick = form.latitude !== null && form.longitude !== null;

  return (
    <StepShell
      title="Where were you born?"
      subtitle="Your birth city determines your local time zone and Ascendant."
      step={step}
      totalSteps={total}
      onBack={onBack}
      onNext={onNext}
      nextDisabled={!hasPick}
    >
      <div ref={wrapRef} className="relative flex flex-col gap-3 py-4">
        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={query}
            placeholder="Search city…"
            onChange={(e) => {
              setQuery(e.target.value);
              // Clear selection if user edits after picking
              if (hasPick) onChange({ latitude: null, longitude: null, cityLabel: '' });
            }}
            className="
              w-full px-4 py-3 pr-10 rounded-xl
              bg-white/8 border border-white/15 text-white placeholder-white/30
              focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20
              transition-colors
            "
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </span>
          )}
          {!loading && hasPick && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">✓</span>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {open && results.length > 0 && (
          <ul className="
            absolute top-full mt-1 left-0 right-0 z-50
            bg-[#1a1a2e] border border-white/10 rounded-xl
            shadow-xl overflow-hidden
          ">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => pick(r)}
                  className="
                    w-full px-4 py-3 text-left text-sm text-white/70
                    hover:bg-white/8 hover:text-white transition-colors
                    border-b border-white/5 last:border-0
                  "
                >
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Selected coordinates display */}
        {hasPick && (
          <p className="text-white/35 text-xs text-center">
            {form.latitude?.toFixed(4)}°, {form.longitude?.toFixed(4)}°
          </p>
        )}
      </div>
    </StepShell>
  );
}
