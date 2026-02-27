/**
 * CosmoSync Kundli Analysis Engine — public surface
 *
 * Interprets a Vedic ChartData (from AstroEngine.getVedicChart) and returns a
 * structured analysis of Doshas, Yogas, Remedies, and an LLM-generated summary.
 *
 * Usage (Server Component / API Route / Server Action only):
 *
 *   import { AstroEngine }          from '@/lib/astro';
 *   import { KundliAnalysisEngine } from '@/lib/kundli';
 *
 *   const astro    = new AstroEngine();
 *   const chart    = astro.getVedicChart('1990-03-15T14:30:00Z', 28.63, 77.21);
 *
 *   const kundli   = new KundliAnalysisEngine();
 *   const analysis = await kundli.analyse(chart);
 *
 *   // analysis.doshas.mangalDosha.present   → boolean
 *   // analysis.yogas.gajakesariYoga.present → boolean
 *   // analysis.applicableRemedies            → PlanetRemedies[]
 *   // analysis.summary                       → string (LLM narrative)
 */

export { KundliAnalysisEngine } from './KundliAnalysisEngine';

export type {
  ChartData,
  DoshaReport,
  KaalSarpDoshaResult,
  KundliAnalysis,
  MangalDoshaResult,
  PlanetRemedies,
  Remedy,
  RemedyCategory,
  SadeSatiResult,
  VedicPlanetId,
  YogaReport,
  YogaResult,
} from './types';
