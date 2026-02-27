// ============================================================
// CosmoSync — Kundli Analysis Engine Type Definitions
// ============================================================

import type { ChartData, PlanetId } from '@/lib/astro/types';

// ── Vedic-extended planet set ─────────────────────────────────────────────────

/** All Vedic planets, including the shadow planets Rahu and Ketu. */
export type VedicPlanetId = PlanetId | 'rahu' | 'ketu';

// ── Dosha types ───────────────────────────────────────────────────────────────

export interface MangalDoshaResult {
  /** Whether Mars falls in a dosha-causing house (1, 4, 7, 8, or 12). */
  present: boolean;
  /** Which Whole-Sign house Mars occupies (1–12). */
  marsHouse: number;
  description: string;
}

export interface KaalSarpDoshaResult {
  /** True when all 7 classical planets lie between Rahu and Ketu. */
  present: boolean;
  /** Ecliptic longitude of Rahu (North Node) for this chart (0–360°). */
  rahuLongitude: number;
  /** Ecliptic longitude of Ketu (South Node) for this chart (0–360°). */
  ketuLongitude: number;
  /** Planets enclosed between the Rahu–Ketu axis. */
  trappedPlanets: VedicPlanetId[];
  description: string;
}

export interface SadeSatiResult {
  /**
   * True when natal Saturn is in the 12th, 1st, or 2nd sign from natal Moon
   * (i.e., the person was born during a Sade Sati period).
   */
  present: boolean;
  /**
   * Which phase of the 7½-year cycle applies at birth:
   *   '12th' → rising phase (Saturn one sign behind Moon)
   *   '1st'  → peak phase (Saturn in same sign as Moon)
   *   '2nd'  → setting phase (Saturn one sign ahead of Moon)
   *   null   → Sade Sati not active at birth
   */
  phase: '12th' | '1st' | '2nd' | null;
  description: string;
}

export interface DoshaReport {
  mangalDosha:   MangalDoshaResult;
  kaalSarpDosha: KaalSarpDoshaResult;
  sadeSati:      SadeSatiResult;
}

// ── Yoga types ────────────────────────────────────────────────────────────────

export interface YogaResult {
  present: boolean;
  name: string;
  description: string;
}

export interface YogaReport {
  /** Jupiter in a kendra (1, 4, 7, 10) from the Moon. */
  gajakesariYoga: YogaResult;
  /** Sun and Mercury occupy the same zodiac sign. */
  budhadityaYoga: YogaResult;
  /**
   * Detected Raj Yogas — may be empty.
   * Includes Dharma-Karma Adhipati (9th + 10th lords conjunct),
   * 5th–9th lord Yoga, and Kendra-Trikona Raj Yoga.
   */
  rajYogas: YogaResult[];
}

// ── Remedy types ──────────────────────────────────────────────────────────────

export type RemedyCategory = 'mantra' | 'ratna' | 'daan' | 'vrata';

export interface Remedy {
  category: RemedyCategory;
  /** Short name of the remedy (e.g. "Ruby", "Gayatri Mantra"). */
  item: string;
  /** Usage instructions or context. */
  detail: string;
}

export interface PlanetRemedies {
  planet:   string;         // Display name, e.g. "Saturn"
  planetId: VedicPlanetId;  // Machine key
  remedies: Remedy[];
}

// ── Top-level analysis result ─────────────────────────────────────────────────

export interface KundliAnalysis {
  doshas:              DoshaReport;
  yogas:               YogaReport;
  /** Remedies relevant to the doshas and yogas found in this chart. */
  applicableRemedies:  PlanetRemedies[];
  /**
   * LLM-generated third-person narrative weaving together the technical
   * findings into a coherent astrological summary for the native.
   */
  summary:             string;
  /** Computed Rahu longitude (mean node, 0–360°). */
  rahuLongitude:       number;
  /** Computed Ketu longitude (mean node, 0–360°). */
  ketuLongitude:       number;
}

// ── Input type alias ──────────────────────────────────────────────────────────

/** Convenience re-export so callers can import everything from one place. */
export type { ChartData };
