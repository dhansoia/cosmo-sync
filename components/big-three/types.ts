// Types shared between the Server Component (BigThreeCard) and the
// Client Component (BigThreeDisplay).  Everything here must be fully
// JSON-serializable — no Date objects, no class instances.

export type AstroSystem = 'WESTERN' | 'VEDIC';

export type ElementType = 'fire' | 'earth' | 'air' | 'water';

/** One sign position, ready to render */
export interface SignPositionData {
  sign: string;          // e.g. "Gemini"
  symbol: string;        // e.g. "♊"
  degree: number;        // 0–29
  minutes: number;       // 0–59
  element: ElementType;
  isRetrograde: boolean;
}

/** All data the Client Component needs to render one system's Big 3 */
export interface BigThreeSlice {
  sun: SignPositionData;
  moon: SignPositionData;
  rising: SignPositionData;
  /** Ayanamsa applied in degrees; 0 for tropical */
  ayanamsaDegrees: number;
}

export interface BigThreeDisplayProps {
  western: BigThreeSlice;
  vedic: BigThreeSlice;
  birthInfo?: {
    label: string;  // e.g. "Jun 15, 1990 · New Delhi, India"
  };
}
