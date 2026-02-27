'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface GeoResult { id: number; label: string; lat: number; lng: number; }

export interface PartnerInput {
  name:  string;
  date:  string;
  time:  string;
  noTime: boolean;
  lat:   number | null;
  lng:   number | null;
  cityLabel: string;
}

interface SynastryFormProps {
  onSubmit: (data: PartnerInput) => void;
  loading:  boolean;
}

export function SynastryForm({ onSubmit, loading }: SynastryFormProps) {
  const [name,    setName]    = useState('');
  const [date,    setDate]    = useState('');
  const [time,    setTime]    = useState('');
  const [noTime,  setNoTime]  = useState(false);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [lat,     setLat]     = useState<number | null>(null);
  const [lng,     setLng]     = useState<number | null>(null);
  const [cityLabel, setCityLabel] = useState('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = await res.json() as GeoResult[];
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch { /* ignore */ } finally { setGeoLoading(false); }
    }, 350);
  }, []);

  useEffect(() => { search(query); return () => { if (timerRef.current) clearTimeout(timerRef.current); }; }, [query, search]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function pickCity(r: GeoResult) {
    setQuery(r.label.split(',')[0].trim());
    setLat(r.lat); setLng(r.lng); setCityLabel(r.label);
    setOpen(false);
  }

  const canSubmit = !loading && date && lat !== null && lng !== null;

  const today   = new Date().toISOString().split('T')[0];
  const minDate = `${new Date().getFullYear() - 120}-01-01`;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({ name, date, time: noTime ? '' : time, noTime, lat: lat!, lng: lng!, cityLabel });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-6 space-y-5">
      <div className="space-y-1">
        <h3 className="text-white font-semibold">Enter partner&apos;s birth details</h3>
        <p className="text-white/35 text-sm">City is required — date and time determine chart accuracy.</p>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-white/40 text-xs uppercase tracking-widest">Name (optional)</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex"
          className="w-full px-4 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>

      {/* Date + Time row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs uppercase tracking-widest">Birth Date *</label>
          <input
            type="date" value={date} min={minDate} max={today}
            onChange={(e) => setDate(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className="w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-white/40 text-xs uppercase tracking-widest">Birth Time</label>
          <input
            type="time" value={time} disabled={noTime}
            onChange={(e) => setTime(e.target.value)}
            style={{ colorScheme: 'dark' }}
            className={`w-full px-3 py-2.5 rounded-xl bg-white/6 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 transition-colors ${noTime ? 'opacity-30 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>

      {/* Unknown time toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={noTime}
          onChange={(e) => { setNoTime(e.target.checked); if (e.target.checked) setTime(''); }}
          className="w-4 h-4 rounded accent-white"
        />
        <span className="text-white/45 text-sm">Time unknown — use Solar chart</span>
      </label>

      {/* City search */}
      <div className="space-y-1.5">
        <label className="text-white/40 text-xs uppercase tracking-widest">Birth City *</label>
        <div ref={wrapRef} className="relative">
          <input
            type="text" value={query}
            placeholder="Search city…"
            onChange={(e) => {
              setQuery(e.target.value);
              if (lat !== null) { setLat(null); setLng(null); setCityLabel(''); }
            }}
            className="w-full px-4 py-2.5 pr-8 rounded-xl bg-white/6 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-white/30 transition-colors"
          />
          {geoLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="block w-3.5 h-3.5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </span>
          )}
          {!geoLoading && lat !== null && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">✓</span>
          )}

          {open && results.length > 0 && (
            <ul className="absolute top-full mt-1 left-0 right-0 z-50 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl overflow-hidden">
              {results.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => pickCity(r)}
                    className="w-full px-4 py-2.5 text-left text-xs text-white/65 hover:bg-white/8 hover:text-white border-b border-white/5 last:border-0 transition-colors">
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {lat !== null && (
          <p className="text-white/25 text-xs">{lat.toFixed(3)}°, {lng!.toFixed(3)}°</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="button" onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-white text-black
                   hover:bg-white/90 active:bg-white/80 transition-colors
                   disabled:opacity-30 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2"
      >
        {loading && <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />}
        {loading ? 'Calculating…' : 'Calculate Compatibility ✦'}
      </button>
    </div>
  );
}
