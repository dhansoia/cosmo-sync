'use client';

import { useState } from 'react';
import { MoodPicker } from './MoodPicker';
import { InsightCard } from './InsightCard';

const MAX_NOTE = 280;

interface JournalFormProps {
  onSaved: () => void; // called after a successful submission so history can refresh
}

type State = 'idle' | 'submitting' | 'done';

export function JournalForm({ onSaved }: JournalFormProps) {
  const [rating,  setRating]  = useState<number | null>(null);
  const [note,    setNote]    = useState('');
  const [insight, setInsight] = useState('');
  const [state,   setState]   = useState<State>('idle');
  const [error,   setError]   = useState('');

  async function handleSubmit() {
    if (!rating) return;

    setState('submitting');
    setError('');
    setInsight('');

    try {
      const res = await fetch('/api/journal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rating, note: note.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? 'Server error');
      }

      const data = await res.json() as { insight: string };
      setInsight(data.insight);
      setState('done');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setState('idle');
    }
  }

  function handleReset() {
    setRating(null);
    setNote('');
    setInsight('');
    setError('');
    setState('idle');
  }

  const disabled = state === 'submitting' || state === 'done';

  return (
    <div className="space-y-6">

      {/* Mood picker */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-6 space-y-5">
        <div className="text-center space-y-1">
          <h3 className="text-white text-base font-medium">How are you feeling?</h3>
          <p className="text-white/35 text-xs">Tap a star to log your mood</p>
        </div>

        <MoodPicker value={rating} onChange={setRating} disabled={disabled} />

        {/* Note textarea */}
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
            disabled={disabled}
            placeholder="What's on your mind? (optional)"
            rows={3}
            className="
              w-full px-4 py-3 rounded-xl resize-none
              bg-white/6 border border-white/10 text-white/80 placeholder-white/25
              text-sm leading-relaxed
              focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
          />
          <p className="text-right text-white/20 text-xs">{note.length}/{MAX_NOTE}</p>
        </div>

        {/* Submit */}
        {state !== 'done' && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!rating || state === 'submitting'}
            className="
              w-full py-3 rounded-xl text-sm font-semibold
              bg-white text-black hover:bg-white/90 active:bg-white/80
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2
            "
          >
            {state === 'submitting' && (
              <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            )}
            {state === 'submitting' ? 'Reading the stars…' : 'Generate My Insight ✦'}
          </button>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      {/* Insight reveal */}
      {state === 'done' && insight && (
        <>
          <InsightCard insight={insight} />

          {/* Log another */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleReset}
              className="text-white/35 text-sm hover:text-white/60 transition-colors"
            >
              + Log another entry
            </button>
          </div>
        </>
      )}
    </div>
  );
}
