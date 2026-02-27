/**
 * lib/synastry/engine.ts — Main Synastry calculation entry point.
 *
 * Given two birth data sets, computes:
 *   1. Western synastry aspects + Chemistry / Stability / Communication scores
 *   2. Vedic Guna Milan (Ashtakoot) out of 36 points
 *   3. Blended dimension scores (60% Western + 40% Vedic per dimension)
 *   4. Overall compatibility score (0–100)
 *
 * Both charts are computed server-side via AstroEngine — no client calls needed.
 */

import { AstroEngine } from '@/lib/astro';
import type { PlanetId } from '@/lib/astro/types';
import { calculateWesternSynastry, normaliseWesternScores } from './aspects';
import type { SynastryAspect }                              from './aspects';
import { calculateGunaMilan }                               from './nakshatras';
import type { GunaResult }                                  from './nakshatras';

// ─── exported report type ─────────────────────────────────────────────────────

export interface SynastryReport {
  /** 0–100 composite */
  overallScore:       number;
  chemistryScore:     number;
  stabilityScore:     number;
  communicationScore: number;

  /** Vedic Guna Milan raw score 0–36 */
  gunaScore:          number;
  guna:               GunaResult;

  /** Top Western aspects sorted by significance */
  aspects:            SynastryAspect[];

  /** Western dimension scores before blending (for transparency) */
  westernScores: { chemistry: number; stability: number; communication: number };

  summary: string;
}

// ─── birth data shape (serialisable, used by API) ────────────────────────────

export interface BirthInput {
  dateOfBirth: Date | string;
  latitude:    number;
  longitude:   number;
}

// ─── blend helper ─────────────────────────────────────────────────────────────

/**
 * Blend Western (0–100) and Vedic (0–36) scores into a single 0–100 value.
 *
 * Vedic Guna Milan maps to dimension scores via:
 *   Chemistry     ← Yoni(4) + Varna(1) + Vashya(2)  max= 7  → out of 7
 *   Stability     ← Nadi(8) + Bhakoot(7) + Gana(6)  max=21  → out of 21
 *   Communication ← Graha Maitri(5) + Tara(3)       max= 8  → out of 8
 */
function blendScores(
  western: { chemistry: number; stability: number; communication: number },
  guna:    GunaResult,
): { chemistry: number; stability: number; communication: number } {
  // Extract Vedic sub-scores from kootas array
  function koota(name: string): number {
    return guna.kootas.find((k) => k.name === name)?.score ?? 0;
  }

  const chemVedic  = ((koota('Yoni') + koota('Varna') + koota('Vashya')) / 7)  * 100;
  const stabVedic  = ((koota('Nadi') + koota('Bhakoot') + koota('Gana'))  / 21) * 100;
  const commVedic  = ((koota('Graha Maitri') + koota('Tara'))             / 8)  * 100;

  const blend = (w: number, v: number) => Math.round(w * 0.6 + v * 0.4);

  return {
    chemistry:     blend(western.chemistry,     chemVedic),
    stability:     blend(western.stability,     stabVedic),
    communication: blend(western.communication, commVedic),
  };
}

function buildSummary(chem: number, stab: number, comm: number): string {
  const highest = Math.max(chem, stab, comm);
  const label =
    highest === chem ? 'magnetic chemistry' :
    highest === stab ? 'deep stability'     : 'strong communication';

  if ((chem + stab + comm) / 3 >= 75) return `Exceptional connection — exceptional ${label}.`;
  if ((chem + stab + comm) / 3 >= 60) return `Strong compatibility anchored by ${label}.`;
  if ((chem + stab + comm) / 3 >= 45) return `Meaningful bond with noteworthy ${label}.`;
  return `Growth-oriented connection — real ${label} to build on.`;
}

// ─── main export ──────────────────────────────────────────────────────────────

/**
 * Calculate a full synastry report between two birth data inputs.
 * Runs entirely on the server (AstroEngine + swisseph/astronomy-engine).
 */
export function calculateSynastry(a: BirthInput, b: BirthInput): SynastryReport {
  const engine = new AstroEngine();

  // ── Compute charts ────────────────────────────────────────────────────────
  const westA = engine.getWesternChart(a.dateOfBirth, a.latitude, a.longitude);
  const westB = engine.getWesternChart(b.dateOfBirth, b.latitude, b.longitude);
  const vedA  = engine.getVedicChart(a.dateOfBirth, a.latitude, a.longitude);
  const vedB  = engine.getVedicChart(b.dateOfBirth, b.latitude, b.longitude);

  // ── Extract planetary longitudes (Western) ────────────────────────────────
  const lonA: Partial<Record<PlanetId, number>> = {};
  const lonB: Partial<Record<PlanetId, number>> = {};

  for (const [id, pos] of Object.entries(westA.planets) as [PlanetId, { longitude: number }][]) {
    lonA[id] = pos.longitude;
  }
  for (const [id, pos] of Object.entries(westB.planets) as [PlanetId, { longitude: number }][]) {
    lonB[id] = pos.longitude;
  }

  // ── Western synastry ──────────────────────────────────────────────────────
  const { aspects, rawScores } = calculateWesternSynastry(lonA, lonB);
  const westernScores          = normaliseWesternScores(rawScores);

  // ── Vedic Guna Milan (uses sidereal Moon longitudes) ─────────────────────
  const guna = calculateGunaMilan(
    vedA.planets.moon.longitude,
    vedB.planets.moon.longitude,
  );

  // ── Blend into final dimension scores ─────────────────────────────────────
  const blended = blendScores(westernScores, guna);

  // ── Overall score ─────────────────────────────────────────────────────────
  const gunaPercent   = Math.round((guna.totalScore / 36) * 100);
  const westernAvg    = Math.round((westernScores.chemistry + westernScores.stability + westernScores.communication) / 3);
  const overallScore  = Math.round(westernAvg * 0.55 + gunaPercent * 0.45);

  return {
    overallScore,
    chemistryScore:     blended.chemistry,
    stabilityScore:     blended.stability,
    communicationScore: blended.communication,
    gunaScore:          guna.totalScore,
    guna,
    aspects,
    westernScores,
    summary: buildSummary(blended.chemistry, blended.stability, blended.communication),
  };
}
