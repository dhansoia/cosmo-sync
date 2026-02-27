'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Specialty } from '@prisma/client';
import type { ExpertPublicProfile } from '@/lib/marketplace/types';
import { SpecialtyFilter } from './SpecialtyFilter';
import { ExpertCard } from './ExpertCard';
import { BookingModal } from './BookingModal';

export function MarketplaceDashboard() {
  const [experts, setExperts] = useState<ExpertPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [bookingExpert, setBookingExpert] = useState<ExpertPublicProfile | null>(null);

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedSpecialty
        ? `/api/experts?specialty=${selectedSpecialty}`
        : '/api/experts';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExperts(data);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  const handleBookClose = (booked: boolean) => {
    setBookingExpert(null);
    if (booked) fetchExperts();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Expert Marketplace</h1>
        <p className="text-white/40 mt-1 text-sm">Book a 1-on-1 session with a certified astrologer.</p>
      </div>

      {/* Apply CTA */}
      <div className="flex items-center gap-3">
        <a
          href="/marketplace/apply"
          className="px-4 py-2 rounded-xl text-sm font-medium border border-violet-400/20 text-violet-400/70 hover:border-violet-400/40 hover:text-violet-400 transition-colors"
        >
          ✦ Become an Expert
        </a>
      </div>

      {/* Filter */}
      <SpecialtyFilter selected={selectedSpecialty} onChange={setSelectedSpecialty} />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 h-52 animate-pulse"
            />
          ))}
        </div>
      ) : experts.length === 0 ? (
        <div className="text-center py-20 text-white/25 text-sm">
          No experts available{selectedSpecialty ? ' in this specialty' : ''} yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {experts.map((expert) => (
            <ExpertCard
              key={expert.id}
              profile={expert}
              onBook={() => setBookingExpert(expert)}
            />
          ))}
        </div>
      )}

      {/* Booking modal */}
      {bookingExpert && (
        <BookingModal expert={bookingExpert} onClose={handleBookClose} />
      )}
    </div>
  );
}
