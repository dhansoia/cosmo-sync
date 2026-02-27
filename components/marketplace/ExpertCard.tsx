'use client';

import type { Specialty } from '@prisma/client';
import type { ExpertPublicProfile } from '@/lib/marketplace/types';

const SPECIALTY_COLORS: Record<Specialty, string> = {
  CAREER:       'bg-sky-400/10 text-sky-400 border-sky-400/20',
  FORECASTING:  'bg-sky-400/10 text-sky-400 border-sky-400/20',
  RELATIONSHIP: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
  SYNASTRY:     'bg-rose-400/10 text-rose-400 border-rose-400/20',
  VEDIC:        'bg-violet-400/10 text-violet-400 border-violet-400/20',
  SPIRITUAL:    'bg-violet-400/10 text-violet-400 border-violet-400/20',
  WESTERN:      'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  NATAL_CHART:  'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
};

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

interface Props {
  profile: ExpertPublicProfile;
  onBook: () => void;
}

export function ExpertCard({ profile, onBook }: Props) {
  const initials = profile.displayName.charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-4 hover:border-white/20 transition-all">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white/10 text-white/60 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold truncate">{profile.displayName}</h3>
          {profile.yearsExperience != null && (
            <p className="text-white/40 text-xs mt-0.5">{profile.yearsExperience} yrs experience</p>
          )}
        </div>
        <span className="flex-shrink-0 text-amber-400 text-sm font-medium">
          ₹{Math.round(profile.ratePerMinute)}<span className="text-amber-400/60 text-xs"> / min</span>
        </span>
      </div>

      {/* Bio */}
      <p className="text-white/45 text-sm leading-relaxed line-clamp-2">{profile.bio}</p>

      {/* Specialties */}
      <div className="flex flex-wrap gap-1.5">
        {profile.specialties.map((s) => (
          <span
            key={s}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${SPECIALTY_COLORS[s]}`}
          >
            {SPECIALTY_LABELS[s]}
          </span>
        ))}
      </div>

      {/* Book button */}
      <button
        onClick={onBook}
        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-white/90 active:bg-white/80 transition-colors"
      >
        Book Session
      </button>
    </div>
  );
}
