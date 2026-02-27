import type { Specialty } from '@prisma/client';

export interface ExpertPublicProfile {
  id: string;
  displayName: string;
  bio: string;
  specialties: Specialty[];
  ratePerMinute: number;
  avatarUrl: string | null;
  yearsExperience: number | null;
}
