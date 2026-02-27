'use client';

import { useState, useEffect } from 'react';
import type { Specialty, ApplicationStatus } from '@prisma/client';

interface AdminProfile {
  id: string;
  displayName: string;
  bio: string;
  specialties: Specialty[];
  ratePerMinute: number;
  yearsExperience: number | null;
  status: ApplicationStatus;
  user: { email: string };
  createdAt: string;
}

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  PENDING:  'bg-amber-400/10 text-amber-400 border-amber-400/20',
  APPROVED: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  REJECTED: 'bg-red-400/10 text-red-400/80 border-red-400/20',
};

const SPECIALTY_LABELS: Record<Specialty, string> = {
  CAREER: 'Career', RELATIONSHIP: 'Relationship', VEDIC: 'Vedic',
  WESTERN: 'Western', NATAL_CHART: 'Natal Chart', SYNASTRY: 'Synastry',
  FORECASTING: 'Forecasting', SPIRITUAL: 'Spiritual',
};

export function ExpertApplicationList() {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/experts');
      if (res.ok) setProfiles(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActing(id);
    await fetch(`/api/admin/experts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setActing(null);
    fetchProfiles();
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-white/10 bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return <p className="text-white/25 text-sm">No applications yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {profiles.map((p) => (
        <div
          key={p.id}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold">{p.displayName}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-white/40 text-xs mt-0.5">{p.user.email}</p>
            </div>
            <span className="text-amber-400 text-sm font-medium flex-shrink-0">
              ₹{Math.round(p.ratePerMinute)}/min
            </span>
          </div>

          <p className="text-white/40 text-sm line-clamp-2">{p.bio}</p>

          <div className="flex flex-wrap gap-1.5">
            {p.specialties.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full text-xs border border-white/10 text-white/40">
                {SPECIALTY_LABELS[s]}
              </span>
            ))}
          </div>

          {p.status === 'PENDING' && (
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleAction(p.id, 'approve')}
                disabled={acting === p.id}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
              >
                {acting === p.id ? '…' : 'Approve'}
              </button>
              <button
                onClick={() => handleAction(p.id, 'reject')}
                disabled={acting === p.id}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400/80 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
              >
                {acting === p.id ? '…' : 'Reject'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
